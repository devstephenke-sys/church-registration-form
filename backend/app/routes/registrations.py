import re
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.models import Registration, Event, Payment, QRVerification
from backend.app.schemas import RegistrationCreate, RegistrationResponse, RegistrationStatusResponse, RegistrationDetails, PaymentResponse
from backend.app.services.qr import qr_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/registrations", tags=["registrations"])

def normalize_phone(phone: str) -> str:
    """Normalizes Kenyan phone numbers to the format 2547XXXXXXXX or 2541XXXXXXXX."""
    cleaned = re.sub(r"[^\d+]", "", phone)
    
    if cleaned.startswith("+"):
        cleaned = cleaned[1:]
        
    if cleaned.startswith("07") and len(cleaned) == 10:
        return "254" + cleaned[1:]
    elif cleaned.startswith("01") and len(cleaned) == 10:
        return "254" + cleaned[1:]
    elif cleaned.startswith("254") and len(cleaned) == 12:
        if cleaned[3] in ["7", "1"]:
            return cleaned
    elif len(cleaned) == 9 and (cleaned.startswith("7") or cleaned.startswith("1")):
        return "254" + cleaned
        
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid Kenyan phone number. Provide a valid number e.g., 0712345678, +254712345678"
    )

@router.post("", response_model=RegistrationResponse)
def create_registration(data: RegistrationCreate, db: Session = Depends(get_db)):
    """Creates a new pending registration with custom pastoral delegation fields."""
    event = db.query(Event).filter(Event.id == data.event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    if event.status != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration for this event is closed"
        )
        
    normalized_phone = normalize_phone(data.phone)
    
    existing_paid = db.query(Registration).filter(
        Registration.event_id == data.event_id,
        Registration.email == data.email.lower(),
        Registration.status.in_(["PAID", "CHECKED_IN"])
    ).first()
    
    if existing_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A confirmed paid registration already exists for this email address."
        )

    # Org / Church fallback
    org = data.church_ministry or data.organization

    existing_pending = db.query(Registration).filter(
        Registration.event_id == data.event_id,
        Registration.email == data.email.lower(),
        Registration.phone == normalized_phone,
        Registration.status.in_(["PENDING_PAYMENT", "PAYMENT_PROCESSING"])
    ).first()
    
    if existing_pending:
        logger.info(f"Reusing existing pending registration {existing_pending.id}")
        existing_pending.full_name = data.full_name
        existing_pending.organization = org
        existing_pending.church_ministry = data.church_ministry
        existing_pending.ministry_location = data.ministry_location
        existing_pending.years_in_ministry = data.years_in_ministry
        existing_pending.sessions_attending = data.sessions_attending
        existing_pending.referral_source = data.referral_source
        existing_pending.special_assistance = data.special_assistance
        db.commit()
        db.refresh(existing_pending)
        return existing_pending

    new_reg = Registration(
        event_id=data.event_id,
        full_name=data.full_name,
        email=data.email.lower(),
        phone=normalized_phone,
        organization=org,
        church_ministry=data.church_ministry,
        ministry_location=data.ministry_location,
        years_in_ministry=data.years_in_ministry,
        sessions_attending=data.sessions_attending,
        referral_source=data.referral_source,
        special_assistance=data.special_assistance,
        designation=data.designation,
        county=data.county,
        status="PENDING_PAYMENT"
    )
    
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)
    
    logger.info(f"Created pending registration {new_reg.id} for {new_reg.full_name}")
    return new_reg

@router.get("/{registration_id}/status", response_model=RegistrationStatusResponse)
def get_registration_status(registration_id: str, db: Session = Depends(get_db)):
    """Short-polling endpoint for frontend to check registration and payment status."""
    reg = db.query(Registration).filter(Registration.id == registration_id).first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )
    return reg

@router.get("/{registration_id}", response_model=RegistrationDetails)
def get_registration_details(registration_id: str, db: Session = Depends(get_db)):
    """Retrieves full registration details, payment status, and secure QR code (if paid)."""
    reg = db.query(Registration).filter(Registration.id == registration_id).first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )
        
    payment = db.query(Payment).filter(
        Payment.registration_id == registration_id
    ).order_by(Payment.created_at.desc()).first()
    
    masked_reg = RegistrationResponse(
        id=reg.id,
        event_id=reg.event_id,
        registration_number=reg.registration_number,
        full_name=reg.full_name,
        email=reg.email,
        phone=f"{reg.phone[:6]}******{reg.phone[-2:]}",
        organization=reg.organization,
        church_ministry=reg.church_ministry,
        ministry_location=reg.ministry_location,
        years_in_ministry=reg.years_in_ministry,
        sessions_attending=reg.sessions_attending,
        referral_source=reg.referral_source,
        special_assistance=reg.special_assistance,
        designation=reg.designation,
        county=reg.county,
        status=reg.status,
        checked_in_at=reg.checked_in_at,
        created_at=reg.created_at,
        updated_at=reg.updated_at
    )
    
    payment_resp = None
    if payment:
        payment_resp = PaymentResponse(
            id=payment.id,
            registration_id=payment.registration_id,
            amount=payment.amount,
            currency=payment.currency,
            phone=f"{payment.phone[:6]}******{payment.phone[-2:]}",
            payment_status=payment.payment_status,
            mpesa_receipt=payment.mpesa_receipt,
            transaction_date=payment.transaction_date,
            result_description=payment.result_description,
            created_at=payment.created_at,
            paid_at=payment.paid_at
        )

    qr_base64 = None
    verification_url = None
    
    if reg.status in ["PAID", "CHECKED_IN"] and reg.qr_verification:
        qr_base64 = qr_service.generate_qr_base64(reg.qr_verification.token)
        verification_url = qr_service.generate_verification_url(reg.qr_verification.token)

    return RegistrationDetails(
        registration=masked_reg,
        payment=payment_resp,
        qr_code_base64=qr_base64,
        verification_url=verification_url
    )
