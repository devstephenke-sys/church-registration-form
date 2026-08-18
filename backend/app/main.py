import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.db import engine, Base, SessionLocal
from backend.app.models import AdminUser, Event
from backend.app.security import get_password_hash
from backend.app.routes import auth, registrations, payments, verify, admin

# Setup logger configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title="Pastoral Delegation Event Registration & M-PESA API",
    description="Clean, production-ready system for Apostle Johnson Suleman Crusade pastoral delegation registration and M-PESA payment verification.",
    version="1.0.0"
)

# CORS Middleware setup
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "https://localhost:5173",
    "https://*.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(registrations.router)
app.include_router(payments.router)
app.include_router(verify.router)
app.include_router(admin.router)

@app.on_event("startup")
def startup_db_setup():
    """Initializes database tables and seeds default records if empty."""
    logger.info("Initializing database schema...")
    
    # Automatically create tables for SQLite/Postgres if not already present
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed Default Event: Apostle Johnson Suleman Crusade
        existing_event = db.query(Event).filter(Event.id == "d56e090f-e234-4b5c-a5b5-b778789d9703").first()
        if not existing_event:
            logger.info("Seeding default event: 'Pastoral Delegation for Apostle Johnson Suleman Crusade'")
            default_event = Event(
                id="d56e090f-e234-4b5c-a5b5-b778789d9703",
                name="Pastoral Delegation for Apostle Johnson Suleman Crusade",
                description="Registration for pastors and ministers wishing to register their attendance and participation for the upcoming crusade event.",
                amount=1000.00,
                currency="KES",
                paybill="9410300",
                status="OPEN"
            )
            db.add(default_event)
        else:
            existing_event.name = "Pastoral Delegation for Apostle Johnson Suleman Crusade"
            existing_event.description = "Registration for pastors and ministers wishing to register their attendance and participation for the upcoming crusade event."
            existing_event.amount = 1000.00
            existing_event.paybill = "9410300"
            existing_event.status = "OPEN"
            
        # Seed Default Admin Users if table is empty
        if db.query(AdminUser).count() == 0:
            logger.info("Seeding default administrative users...")
            super_admin = AdminUser(
                username="admin",
                password_hash=get_password_hash("AdminPassword123"),
                role="SUPER_ADMIN"
            )
            event_admin = AdminUser(
                username="event_admin",
                password_hash=get_password_hash("EventPassword123"),
                role="EVENT_ADMIN"
            )
            staff = AdminUser(
                username="staff",
                password_hash=get_password_hash("StaffPassword123"),
                role="CHECKIN_STAFF"
            )
            db.add_all([super_admin, event_admin, staff])
            
        db.commit()
        logger.info("Database startup checks and seeding complete.")
        
    except Exception as e:
        logger.error(f"Error during database startup checks: {str(e)}")
        db.rollback()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Pastoral Delegation Event Registration & M-PESA Verification API",
        "documentation": "/docs"
    }
