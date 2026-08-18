import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.models import Registration, QRVerification, Payment
from backend.app.schemas import QRVerifyResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["qr-verification"])

@router.get("/verify/{token}", response_model=QRVerifyResponse)
def verify_qr_token(token: str, db: Session = Depends(get_db)):
    """Public endpoint to verify QR code token validity. Exposes safe participant details."""
    logger.info(f"QR Verification scan request received for token: {token[:8]}...")
    
    # Query verification token
    qr_record = db.query(QRVerification).filter(QRVerification.token == token).first()
    if not qr_record:
        logger.warning(f"QR verification failed. Token not found: {token[:8]}...")
        return QRVerifyResponse(
            status="INVALID",
            message="This QR code could not be verified. Please contact event administration."
        )

    if qr_record.status == "REVOKED":
        return QRVerifyResponse(
            status="REVOKED",
            message="This registration QR code has been revoked."
        )

    # Get associated registration
    reg = db.query(Registration).filter(Registration.id == qr_record.registration_id).first()
    if not reg:
        logger.error(f"QR token exists but registration not found for ID: {qr_record.registration_id}")
        return QRVerifyResponse(
            status="INVALID",
            message="Internal error: registration details not found."
        )

    # Retrieve payment information for confirmation
    payment = db.query(Payment).filter(
        Payment.registration_id == reg.id,
        Payment.payment_status == "SUCCESS"
    ).order_by(Payment.paid_at.desc()).first()

    # Determine status
    if reg.status == "CHECKED_IN":
        return QRVerifyResponse(
            status="ALREADY_CHECKED_IN",
            message="Participant is already checked in.",
            registration_number=reg.registration_number,
            full_name=reg.full_name,
            organization=reg.organization,
            checked_in_at=reg.checked_in_at
        )
        
    elif reg.status == "PAID":
        return QRVerifyResponse(
            status="VALID",
            message="Valid registration. Ready for check-in.",
            registration_number=reg.registration_number,
            full_name=reg.full_name,
            organization=reg.organization,
            mpesa_receipt=payment.mpesa_receipt if payment else "M-PESA",
            paid_at=payment.paid_at if payment else reg.updated_at,
            amount=payment.amount if payment else None
        )
        
    else:
        logger.warning(f"QR scan check failed. Registration status is {reg.status}")
        return QRVerifyResponse(
            status="PAYMENT_NOT_CONFIRMED",
            message="Registration payment has not been confirmed.",
            registration_number=reg.registration_number,
            full_name=reg.full_name,
            organization=reg.organization
        )
