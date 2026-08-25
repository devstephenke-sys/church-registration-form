import secrets
import logging
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.models import Registration, Event, Payment, QRVerification, EmailLog
from backend.app.schemas import STKPushRequest, STKPushResponse
from backend.app.services.daraja import daraja_client, DarajaException
from backend.app.services.email import email_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["payments"])

def parse_daraja_date(date_str: str) -> datetime:
    """Parses Safaricom transaction date format (YYYYMMDDHHMMSS) to datetime object."""
    try:
        # Expected format e.g. 20260818112000
        return datetime.strptime(str(date_str), "%Y%m%d%H%M%S")
    except Exception:
        return datetime.utcnow()

@router.post("/stk-push", response_model=STKPushResponse)
def initiate_payment(data: STKPushRequest, db: Session = Depends(get_db)):
    """Initiates an M-PESA STK Push for a pending registration."""
    # Find registration
    reg = db.query(Registration).filter(Registration.id == data.registration_id).first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )
        
    if reg.status in ["PAID", "CHECKED_IN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is already paid"
        )

    # Check if STK Push is already processing (anti-spam timeout: 60 seconds)
    if reg.status == "PAYMENT_PROCESSING":
        last_payment = db.query(Payment).filter(
            Payment.registration_id == reg.id
        ).order_by(Payment.created_at.desc()).first()
        
        if last_payment and (datetime.utcnow() - last_payment.created_at).total_seconds() < 60:
            logger.warning(f"Duplicate payment request for registration {reg.id} within 60s")
            return STKPushResponse(
                merchant_request_id=last_payment.merchant_request_id or "",
                checkout_request_id=last_payment.checkout_request_id or "",
                customer_message="M-PESA prompt already sent. Please wait before requesting again."
            )

    # Fetch event details
    event = db.query(Event).filter(Event.id == reg.event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Call Daraja API STK Push
    try:
        # For Sandbox testing, Daraja might require specific details depending on environment,
        # but the daraja_client handles it transparently.
        # Build a clean, readable account reference for the M-PESA prompt
        # Safaricom limits AccountReference to 12 characters
        account_ref = "KisumuCrusade"[:12]
        response = daraja_client.initiate_stk_push(
            phone=reg.phone,
            amount=int(event.amount),
            account_ref=account_ref
        )
        
        merchant_request_id = response.get("MerchantRequestID")
        checkout_request_id = response.get("CheckoutRequestID")
        customer_msg = response.get("CustomerMessage", "Check your phone for the M-PESA prompt.")
        
        # Create payment record
        new_payment = Payment(
            registration_id=reg.id,
            amount=event.amount,
            currency=event.currency,
            phone=reg.phone,
            payment_status="PENDING",
            merchant_request_id=merchant_request_id,
            checkout_request_id=checkout_request_id
        )
        db.add(new_payment)
        
        # Update registration status
        reg.status = "PAYMENT_PROCESSING"
        db.commit()
        
        logger.info(f"Initiated STK push for reg {reg.id}. CheckoutRequestID: {checkout_request_id}")
        return STKPushResponse(
            merchant_request_id=merchant_request_id,
            checkout_request_id=checkout_request_id,
            customer_message=customer_msg
        )
        
    except DarajaException as e:
        logger.error(f"Daraja STK push failure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Safaricom M-PESA API error: {str(e)}"
        )

def process_email_background(
    reg_id: str, 
    recipient_email: str, 
    name: str, 
    reg_num: str, 
    amount: float, 
    receipt: str, 
    pay_date_str: str, 
    token: str,
    event_name: str
):
    """Background task to send confirmation email and log results in database."""
    # We open a new database session because this is executed outside the request lifecycle
    from backend.app.db import SessionLocal
    db = SessionLocal()
    try:
        success = email_service.send_confirmation_email(
            recipient_email=recipient_email,
            participant_name=name,
            registration_number=reg_num,
            amount=amount,
            mpesa_receipt=receipt,
            payment_date=pay_date_str,
            qr_token=token,
            event_name=event_name
        )
        
        email_log = EmailLog(
            registration_id=reg_id,
            recipient=recipient_email,
            subject=f"Registration Confirmed — {reg_num}",
            status="SENT" if success else "FAILED",
            error_message=None if success else "Email provider failed to deliver. Check logs."
        )
        db.add(email_log)
        db.commit()
        logger.info(f"Email log created for {reg_num}. Sent: {success}")
    except Exception as e:
        logger.error(f"Error in background email task: {str(e)}")
        try:
            email_log = EmailLog(
                registration_id=reg_id,
                recipient=recipient_email,
                subject=f"Registration Confirmed — {reg_num}",
                status="FAILED",
                error_message=str(e)
            )
            db.add(email_log)
            db.commit()
        except Exception:
            pass
    finally:
        db.close()

@router.post("/callback")
async def mpesa_callback(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Authoritative Callback Webhook for Safaricom Daraja. Highly secure, transactional, and idempotent."""
    try:
        payload = await request.json()
        logger.info(f"Received M-PESA Callback: {payload}")
    except Exception as e:
        logger.error(f"Invalid JSON payload in callback: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    body = payload.get("Body", {})
    stk_callback = body.get("stkCallback", {})
    checkout_request_id = stk_callback.get("CheckoutRequestID")
    result_code = stk_callback.get("ResultCode")
    result_description = stk_callback.get("ResultDesc")
    
    if not checkout_request_id:
        logger.error("M-PESA callback missing CheckoutRequestID")
        return {"status": "error", "message": "Missing CheckoutRequestID"}

    # Transaction-lock the payment record to ensure idempotency and prevent race conditions
    payment = db.query(Payment).filter(
        Payment.checkout_request_id == checkout_request_id
    ).with_for_update().first()

    if not payment:
        logger.warning(f"Payment record not found for CheckoutRequestID: {checkout_request_id}")
        # Return 200 so Safaricom stops retrying unrecognized transactions
        return {"status": "ignored", "message": "Transaction not found"}

    # If the payment has already been processed, exit immediately (idempotent)
    if payment.payment_status in ["SUCCESS", "FAILED"]:
        logger.info(f"M-PESA callback already processed for checkout {checkout_request_id} (Status: {payment.payment_status})")
        return {"status": "success", "message": "Already processed"}

    # Get registration and lock it
    reg = db.query(Registration).filter(
        Registration.id == payment.registration_id
    ).with_for_update().first()
    
    if not reg:
        logger.error(f"Registration not found for payment {payment.id}")
        return {"status": "error", "message": "Registration not found"}

    # Check ResultCode (0 = Success)
    if result_code == 0:
        logger.info(f"Payment successful for checkout {checkout_request_id}")
        payment.payment_status = "SUCCESS"
        payment.result_code = result_code
        payment.result_description = result_description
        payment.raw_callback_response = payload
        payment.paid_at = datetime.utcnow()
        
        # Parse metadata
        callback_metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
        metadata_dict = {item.get("Name"): item.get("Value") for item in callback_metadata}
        
        mpesa_receipt = metadata_dict.get("MpesaReceiptNumber", "")
        trans_date_raw = metadata_dict.get("TransactionDate")
        trans_date = parse_daraja_date(trans_date_raw)
        
        payment.mpesa_receipt = mpesa_receipt
        payment.transaction_date = trans_date
        
        # Update registration
        reg.status = "PAID"
        
        # Atomically lock the event row to serialize sequential registration number generation
        event = db.query(Event).filter(Event.id == reg.event_id).with_for_update().first()
        
        # Check if already has a registration number (safety double check)
        if not reg.registration_number:
            # Query count of confirmed registrations to generate sequential number
            paid_count = db.query(Registration).filter(
                Registration.event_id == reg.event_id,
                Registration.status.in_(["PAID", "CHECKED_IN"])
            ).count()
            # Since this current registration is now PAID (state is modified but transaction is not yet committed),
            # paid_count includes it. If not, we add +1.
            # To be absolutely sure:
            # We select count of registrations that have registration numbers
            numbered_count = db.query(Registration).filter(
                Registration.event_id == reg.event_id,
                Registration.registration_number != None
            ).count()
            
            sequence_num = numbered_count + 1
            current_year = datetime.now().year
            reg.registration_number = f"REG-{current_year}-{sequence_num:06d}"
            logger.info(f"Generated registration number {reg.registration_number}")

        # Generate secure random token for QR code verification
        secure_token = secrets.token_urlsafe(32)
        
        # Check if QR verification record already exists
        qr_verify = db.query(QRVerification).filter(
            QRVerification.registration_id == reg.id
        ).first()
        
        if not qr_verify:
            qr_verify = QRVerification(
                registration_id=reg.id,
                token=secure_token,
                status="ACTIVE"
            )
            db.add(qr_verify)
            
        db.commit()
        
        # Queue email receipt in background tasks
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
            token=secure_token,
            event_name=event.name if event else "2026 Digital Skills Conference"
        )
        
    else:
        # Payment failed (e.g. user cancelled, insufficient balance, timeout)
        logger.info(f"Payment failed for checkout {checkout_request_id}. ResultCode: {result_code}, Desc: {result_description}")
        payment.payment_status = "FAILED"
        payment.result_code = result_code
        payment.result_description = result_description
        payment.raw_callback_response = payload
        
        reg.status = "PAYMENT_FAILED"
        db.commit()

    return {"status": "success", "message": "Callback processed"}
