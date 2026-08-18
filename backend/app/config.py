import os
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()

class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    
    # Daraja M-PESA STK Push
    DARAJA_CONSUMER_KEY: str = os.getenv("DARAJA_CONSUMER_KEY", "")
    DARAJA_CONSUMER_SECRET: str = os.getenv("DARAJA_CONSUMER_SECRET", "")
    MPESA_SHORTCODE: str = os.getenv("MPESA_SHORTCODE", "174379")
    MPESA_PASSKEY: str = os.getenv("MPESA_PASSKEY", "")
    MPESA_ENVIRONMENT: str = os.getenv("MPESA_ENVIRONMENT", "sandbox")
    MPESA_CALLBACK_URL: str = os.getenv("MPESA_CALLBACK_URL", "")
    
    # Resend Email Configuration
    EMAIL_PROVIDER_API_KEY: str = os.getenv("EMAIL_PROVIDER_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@example.com")
    EMAIL_FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "Event Registration")
    
    # Frontend URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    QR_BASE_URL: str = os.getenv("QR_BASE_URL", "http://localhost:5173/verify")
    
    # JWT Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change_this_to_a_secure_random_key_in_production")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours

settings = Settings()
