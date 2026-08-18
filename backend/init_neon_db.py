import sys
from backend.app.config import settings
from backend.app.db import engine, Base, SessionLocal
from backend.app.models import Event, AdminUser
from backend.app.security import get_password_hash

print("Connecting to Neon PostgreSQL Database...")

try:
    print("Creating tables on Neon PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("[SUCCESS] Tables created successfully.")

    db = SessionLocal()
    
    # Check and seed default event
    event = db.query(Event).filter(Event.id == "d56e090f-e234-4b5c-a5b5-b778789d9703").first()
    if not event:
        print("Seeding default event on Neon...")
        event = Event(
            id="d56e090f-e234-4b5c-a5b5-b778789d9703",
            name="Pastoral Delegation for Apostle Johnson Suleman Crusade",
            description="Registration for pastors and ministers wishing to register their attendance and participation for the upcoming crusade event.",
            amount=1000.00,
            currency="KES",
            paybill="9410300",
            status="OPEN"
        )
        db.add(event)
    else:
        print("Default event already exists.")
        
    # Check and seed admin users
    if db.query(AdminUser).count() == 0:
        print("Seeding administrative users on Neon...")
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
    else:
        print("Admin users already exist.")

    db.commit()
    db.close()
    print("[SUCCESS] Database initialization on Neon completed successfully!")

except Exception as e:
    print(f"[ERROR] Error initializing Neon DB: {e}")
    sys.exit(1)
