import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.db import Base, get_db
from backend.app.main import app
from backend.app.models import Event, AdminUser
from backend.app.security import get_password_hash

# Setup test SQLite DB in memory
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

@pytest.fixture(scope="function")
def db():
    """Provides a transactional database session for testing."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Seed default configurations
    # Default Event
    default_event = Event(
        id="test-event-id",
        name="Test 2026 Skills Conference",
        description="A test event for integration verification.",
        amount=1000.00,
        currency="KES",
        paybill="9410300",
        status="OPEN"
    )
    # Default Admin Users
    super_admin = AdminUser(
        id="test-superadmin-id",
        username="admin",
        password_hash=get_password_hash("AdminPassword123"),
        role="SUPER_ADMIN"
    )
    event_admin = AdminUser(
        id="test-eventadmin-id",
        username="event_admin",
        password_hash=get_password_hash("EventPassword123"),
        role="EVENT_ADMIN"
    )
    staff = AdminUser(
        id="test-staff-id",
        username="staff",
        password_hash=get_password_hash("StaffPassword123"),
        role="CHECKIN_STAFF"
    )
    
    session.add_all([default_event, super_admin, event_admin, staff])
    session.commit()
    
    try:
        yield session
    finally:
        session.close()
        # Tear down
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    """Provides a FastAPI test client configured to use the test database."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
