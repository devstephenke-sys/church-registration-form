import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Integer, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.db import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False, default=1000.00)
    currency = Column(String(10), nullable=False, default="KES")
    paybill = Column(String(50), nullable=False, default="9410300")
    status = Column(String(20), nullable=False, default="OPEN")  # OPEN, CLOSED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")

class Registration(Base):
    __tablename__ = "registrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    registration_number = Column(String(50), unique=True, index=True, nullable=True) # REG-YYYY-XXXXXX (generated post-payment)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)  # Normalized to 2547XXXXXXXX
    
    # Custom Pastoral Delegation fields
    organization = Column(String(255), nullable=True) # Name of Church or Ministry
    church_ministry = Column(String(255), nullable=True)
    ministry_location = Column(String(255), nullable=True)
    years_in_ministry = Column(String(50), nullable=True)
    sessions_attending = Column(JSON, nullable=True) # List of sessions
    referral_source = Column(String(100), nullable=True)
    special_assistance = Column(String(255), nullable=True)
    designation = Column(String(255), nullable=True)
    county = Column(String(255), nullable=True)
    
    status = Column(String(50), nullable=False, default="PENDING_PAYMENT")
    # PENDING_PAYMENT, PAYMENT_PROCESSING, PAID, PAYMENT_FAILED, PAYMENT_CANCELLED, EXPIRED, REFUNDED, CHECKED_IN
    checked_in_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    event = relationship("Event", back_populates="registrations")
    payments = relationship("Payment", back_populates="registration", cascade="all, delete-orphan")
    qr_verification = relationship("QRVerification", uselist=False, back_populates="registration", cascade="all, delete-orphan")
    email_logs = relationship("EmailLog", back_populates="registration", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(36), ForeignKey("registrations.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="KES")
    phone = Column(String(20), nullable=False)
    payment_status = Column(String(20), nullable=False, default="PENDING")  # PENDING, SUCCESS, FAILED
    merchant_request_id = Column(String(255), unique=True, index=True, nullable=True)
    checkout_request_id = Column(String(255), unique=True, index=True, nullable=True)
    mpesa_receipt = Column(String(50), nullable=True, index=True)
    transaction_date = Column(DateTime, nullable=True)
    result_code = Column(Integer, nullable=True)
    result_description = Column(String(500), nullable=True)
    raw_callback_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    registration = relationship("Registration", back_populates="payments")

class QRVerification(Base):
    __tablename__ = "qr_verifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(36), ForeignKey("registrations.id"), unique=True, nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)  # Secure random string
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, REVOKED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    registration = relationship("Registration", back_populates="qr_verification")

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="CHECKIN_STAFF")  # SUPER_ADMIN, EVENT_ADMIN, CHECKIN_STAFF
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    audit_logs = relationship("AuditLog", back_populates="actor")

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(36), ForeignKey("registrations.id"), nullable=False)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False)  # SENT, FAILED
    error_message = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    registration = relationship("Registration", back_populates="email_logs")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("admin_users.id"), nullable=True)
    actor_username = Column(String(255), nullable=True)
    action = Column(String(255), nullable=False)  # e.g., ADMIN_LOGIN, CHECK_IN, MANUAL_PAY
    target_id = Column(String(255), nullable=True)
    target_type = Column(String(255), nullable=True)  # e.g., REGISTRATION, PAYMENT
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    actor = relationship("AdminUser", back_populates="audit_logs")
