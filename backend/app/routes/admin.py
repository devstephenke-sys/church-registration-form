import csv
import io
import logging
import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.models import Registration, Event, Payment, QRVerification, EmailLog, AuditLog, AdminUser
from backend.app.schemas import DashboardStats, RegistrationResponse, PaymentResponse, ManualPayRequest
from backend.app.security import (
    get_current_user,
    require_super_admin,
    require_event_admin,
    require_checkin_staff
)
from backend.app.routes.payments import process_email_background

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin-management"])

def create_audit_log(
    db: Session,
    current_user: AdminUser,
    action: str,
    target_id: str = None,
    target_type: str = None,
    details: dict = None
):
    """Utility to create administrative audit log entries."""
    audit = AuditLog(
        actor_id=current_user.id,
        actor_username=current_user.username,
        action=action,
        target_id=target_id,
        target_type=target_type,
        details=details
    )
    db.add(audit)
    db.commit()

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_checkin_staff)
):
    """Retrieves high-level dashboard metrics for event organizers."""
    # Count totals
    total_reg = db.query(Registration).count()
    paid_reg = db.query(Registration).filter(Registration.status.in_(["PAID", "CHECKED_IN"])).count()
    pending_reg = db.query(Registration).filter(Registration.status.in_(["PENDING_PAYMENT", "PAYMENT_PROCESSING"])).count()
    failed_reg = db.query(Registration).filter(Registration.status.in_(["PAYMENT_FAILED", "PAYMENT_CANCELLED", "EXPIRED"])).count()
    checked_in = db.query(Registration).filter(Registration.status == "CHECKED_IN").count()
    
    # Calculate revenue
    revenue_query = db.query(func.sum(Payment.amount)).filter(Payment.payment_status == "SUCCESS").scalar()
    total_revenue = float(revenue_query) if revenue_query else 0.0

    return DashboardStats(
        total_registrations=total_reg,
        paid_registrations=paid_reg,
        pending_payments=pending_reg,
        failed_payments=failed_reg,
        checked_in_participants=checked_in,
        total_revenue=total_revenue
    )

@router.get("/registrations")
def list_registrations(
    search: str = None,
    status_filter: str = None,
    checked_in: bool = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_checkin_staff)
):
    """Lists, searches, and filters participant registrations."""
    query = db.query(Registration)
    
    # Search filters (Name, Email, Phone, Reg Number, Mpesa Receipt)
    if search:
        search_term = f"%{search}%"
        # We also check payment M-PESA receipt numbers
        query = query.outerjoin(Payment).filter(
            or_(
                Registration.full_name.ilike(search_term),
                Registration.email.ilike(search_term),
                Registration.phone.ilike(search_term),
                Registration.registration_number.ilike(search_term),
                Payment.mpesa_receipt.ilike(search_term)
            )
        )
        # Prevent duplicates due to join
        query = query.distinct()

    if status_filter:
        query = query.filter(Registration.status == status_filter)
        
    if checked_in is not None:
        if checked_in:
            query = query.filter(Registration.status == "CHECKED_IN")
        else:
            query = query.filter(Registration.status != "CHECKED_IN")

    total = query.count()
    registrations = query.order_by(Registration.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "registrations": registrations
    }

@router.get("/registrations/{reg_id}")
def get_registration_detail(
    reg_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_checkin_staff)
):
    """Retrieves full detail of a registration including payment records and email history."""
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    payments = db.query(Payment).filter(Payment.registration_id == reg_id).order_by(Payment.created_at.desc()).all()
    emails = db.query(EmailLog).filter(EmailLog.registration_id == reg_id).order_by(EmailLog.created_at.desc()).all()
    
    qr_token = reg.qr_verification.token if reg.qr_verification else None
    
    return {
        "registration": reg,
        "payments": payments,
        "emails": emails,
        "qr_token": qr_token
    }

@router.post("/registrations/{reg_id}/resend-receipt")
def resend_email_receipt(
    reg_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_event_admin)
):
    """Manually triggers resending the confirmation receipt to the participant."""
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    if reg.status not in ["PAID", "CHECKED_IN"]:
        raise HTTPException(status_code=400, detail="Cannot resend receipt for unpaid registration")
        
    payment = db.query(Payment).filter(
        Payment.registration_id == reg_id,
        Payment.payment_status == "SUCCESS"
    ).order_by(Payment.paid_at.desc()).first()
    
    if not payment:
        raise HTTPException(status_code=400, detail="No successful payment record found")
        
    qr_verify = reg.qr_verification
    if not qr_verify:
        raise HTTPException(status_code=400, detail="No QR code verification generated for this paid registration")

    event = db.query(Event).filter(Event.id == reg.event_id).first()
    
    # Audit log
    create_audit_log(
        db=db,
        current_user=current_user,
        action="RESEND_EMAIL_RECEIPT",
        target_id=reg.id,
        target_type="REGISTRATION",
        details={"email": reg.email}
    )

    # Queue resend in background task
    payment_date_str = payment.transaction_date.strftime("%d %b %Y, %H:%M") if payment.transaction_date else datetime.utcnow().strftime("%d %b %Y, %H:%M")
    background_tasks.add_task(
        process_email_background,
        reg_id=reg.id,
        recipient_email=reg.email,
        name=reg.full_name,
        reg_num=reg.registration_number,
        amount=float(payment.amount),
        receipt=payment.mpesa_receipt or "M-PESA",
        pay_date_str=payment_date_str,
        token=qr_verify.token,
        event_name=event.name if event else "2026 Digital Skills Conference"
    )

    return {"status": "success", "message": "Email receipt queued for resending."}

@router.post("/registrations/{reg_id}/manual-pay")
def manual_payment_override(
    reg_id: str,
    data: ManualPayRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    """Forces payment verification using manual administrator override. Restrict to SUPER_ADMIN."""
    logger.info(f"Manual override payment requested by {current_user.username} for registration {reg_id}")
    
    # Transaction-lock registration
    reg = db.query(Registration).filter(Registration.id == reg_id).with_for_update().first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    if reg.status in ["PAID", "CHECKED_IN"]:
        raise HTTPException(status_code=400, detail="Registration is already paid")

    event = db.query(Event).filter(Event.id == reg.event_id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=404, detail="Associated event not found")

    # Generate sequential registration number if missing
    if not reg.registration_number:
        numbered_count = db.query(Registration).filter(
            Registration.event_id == reg.event_id,
            Registration.registration_number != None
        ).count()
        sequence_num = numbered_count + 1
        current_year = datetime.now().year
        reg.registration_number = f"REG-{current_year}-{sequence_num:06d}"

    # Generate secure QR token
    secure_token = secrets.token_urlsafe(32)
    qr_verify = db.query(QRVerification).filter(QRVerification.registration_id == reg.id).first()
    if not qr_verify:
        qr_verify = QRVerification(
            registration_id=reg.id,
            token=secure_token,
            status="ACTIVE"
        )
        db.add(qr_verify)
    else:
        secure_token = qr_verify.token

    # Create mock payment representing manual administrative authorization
    mock_receipt = f"MANUAL-{secrets.token_hex(4).upper()}"
    manual_payment = Payment(
        registration_id=reg.id,
        amount=event.amount,
        currency=event.currency,
        phone=reg.phone,
        payment_status="SUCCESS",
        mpesa_receipt=mock_receipt,
        transaction_date=datetime.utcnow(),
        result_code=0,
        result_description=f"Manual Override: {data.reason}",
        paid_at=datetime.utcnow()
    )
    db.add(manual_payment)

    # Update registration status
    reg.status = "PAID"
    db.commit()

    # Log override in AuditLog
    create_audit_log(
        db=db,
        current_user=current_user,
        action="MANUAL_PAYMENT_OVERRIDE",
        target_id=reg.id,
        target_type="REGISTRATION",
        details={
            "reason": data.reason,
            "receipt": mock_receipt,
            "amount": float(event.amount)
        }
    )

    # Queue email sending
    payment_date_str = datetime.utcnow().strftime("%d %b %Y, %H:%M")
    background_tasks.add_task(
        process_email_background,
        reg_id=reg.id,
        recipient_email=reg.email,
        name=reg.full_name,
        reg_num=reg.registration_number,
        amount=float(event.amount),
        receipt=mock_receipt,
        pay_date_str=payment_date_str,
        token=secure_token,
        event_name=event.name
    )

    return {
        "status": "success", 
        "message": "Manual payment override completed successfully.",
        "registration_number": reg.registration_number
    }

@router.post("/check-in")
def check_in_participant(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_checkin_staff)
):
    """Marks a registration as CHECKED_IN. Ensures double-checkin prevention."""
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing secure token")

    # Transactional Lock to prevent concurrent scanning checkins
    qr_record = db.query(QRVerification).filter(QRVerification.token == token).first()
    if not qr_record:
        raise HTTPException(status_code=404, detail="Invalid token: Verification record not found")

    reg = db.query(Registration).filter(
        Registration.id == qr_record.registration_id
    ).with_for_update().first()

    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    if reg.status == "CHECKED_IN":
        raise HTTPException(
            status_code=400,
            detail=f"Participant is already checked in. (Check-in time: {reg.checked_in_at})"
        )

    if reg.status != "PAID":
        raise HTTPException(
            status_code=400,
            detail=f"Registration status is {reg.status}. Only PAID registrations can be checked in."
        )

    # Perform check-in
    reg.status = "CHECKED_IN"
    reg.checked_in_at = datetime.utcnow()
    db.commit()

    # Audit log
    create_audit_log(
        db=db,
        current_user=current_user,
        action="PARTICIPANT_CHECKIN",
        target_id=reg.id,
        target_type="REGISTRATION",
        details={
            "registration_number": reg.registration_number,
            "name": reg.full_name
        }
    )

    return {
        "status": "success",
        "message": "Participant checked in successfully.",
        "registration_number": reg.registration_number,
        "full_name": reg.full_name,
        "checked_in_at": reg.checked_in_at
    }

@router.get("/export")
def export_registrations_csv(
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_event_admin)
):
    """Exports all registrations to a clean CSV file."""
    # Write to in-memory string buffer
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Registration ID",
        "Registration Number",
        "Full Name",
        "Email Address",
        "Phone Number",
        "Organization",
        "Designation",
        "County",
        "Status",
        "M-PESA Receipt",
        "Amount Paid (KES)",
        "Created At",
        "Paid At",
        "Checked In At"
    ])
    
    # Query registrations joined with payments
    registrations = db.query(Registration).order_by(Registration.created_at.desc()).all()
    
    for r in registrations:
        # Find successful payment
        payment = next((p for p in r.payments if p.payment_status == "SUCCESS"), None)
        
        writer.writerow([
            r.id,
            r.registration_number or "",
            r.full_name,
            r.email,
            r.phone,
            r.organization or "",
            r.designation or "",
            r.county or "",
            r.status,
            payment.mpesa_receipt if payment else "",
            float(payment.amount) if payment else "",
            r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            payment.paid_at.strftime("%Y-%m-%d %H:%M:%S") if payment and payment.paid_at else "",
            r.checked_in_at.strftime("%Y-%m-%d %H:%M:%S") if r.checked_in_at else ""
        ])
        
    output.seek(0)
    
    # Create Streaming Response
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=event_registrations.csv"
    
    # Log administrative export
    create_audit_log(
        db=db,
        current_user=current_user,
        action="EXPORT_REGISTRATIONS_CSV"
    )
    
    return response
