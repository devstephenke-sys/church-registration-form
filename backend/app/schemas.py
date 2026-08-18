from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal

# JWT Auth Schemas
class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class AdminUserResponse(BaseModel):
    id: str
    username: str
    role: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Event Schemas
class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    amount: Decimal = Field(default=1000.00, max_digits=10, decimal_places=2)
    currency: str = "KES"
    paybill: str = "9410300"
    status: str = "OPEN"

class EventResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    amount: Decimal
    currency: str
    paybill: str
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Registration Schemas
class RegistrationCreate(BaseModel):
    event_id: str

    @field_validator('event_id', mode='before')
    @classmethod
    def strip_event_id(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v
    full_name: str
    email: EmailStr
    phone: str
    organization: Optional[str] = None # Name of Church or Ministry
    church_ministry: Optional[str] = None
    ministry_location: Optional[str] = None
    years_in_ministry: Optional[str] = None
    sessions_attending: Optional[List[str]] = None
    referral_source: Optional[str] = None
    special_assistance: Optional[str] = None
    designation: Optional[str] = None
    county: Optional[str] = None

class RegistrationResponse(BaseModel):
    id: str
    event_id: str
    registration_number: Optional[str] = None
    full_name: str
    email: EmailStr
    phone: str
    organization: Optional[str] = None
    church_ministry: Optional[str] = None
    ministry_location: Optional[str] = None
    years_in_ministry: Optional[str] = None
    sessions_attending: Optional[List[str]] = None
    referral_source: Optional[str] = None
    special_assistance: Optional[str] = None
    designation: Optional[str] = None
    county: Optional[str] = None
    status: str
    checked_in_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class RegistrationStatusResponse(BaseModel):
    id: str
    status: str
    registration_number: Optional[str] = None

# Payment Schemas
class STKPushRequest(BaseModel):
    registration_id: str

class STKPushResponse(BaseModel):
    merchant_request_id: str
    checkout_request_id: str
    customer_message: str

class PaymentResponse(BaseModel):
    id: str
    registration_id: str
    amount: Decimal
    currency: str
    phone: str
    payment_status: str
    mpesa_receipt: Optional[str] = None
    transaction_date: Optional[datetime] = None
    result_description: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# Combined Details Schemas
class RegistrationDetails(BaseModel):
    registration: RegistrationResponse
    payment: Optional[PaymentResponse] = None
    qr_code_base64: Optional[str] = None
    verification_url: Optional[str] = None

# QR Verification / Check-in Schemas
class QRVerifyResponse(BaseModel):
    status: str  # VALID, INVALID, ALREADY_CHECKED_IN, PAYMENT_NOT_CONFIRMED, REVOKED
    message: str
    registration_number: Optional[str] = None
    full_name: Optional[str] = None
    organization: Optional[str] = None
    checked_in_at: Optional[datetime] = None
    mpesa_receipt: Optional[str] = None
    paid_at: Optional[datetime] = None
    amount: Optional[Decimal] = None

class ManualPayRequest(BaseModel):
    reason: str

# Stats Schemas
class DashboardStats(BaseModel):
    total_registrations: int
    paid_registrations: int
    pending_payments: int
    failed_payments: int
    checked_in_participants: int
    total_revenue: float
