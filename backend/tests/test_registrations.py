import pytest
from backend.app.models import Registration, Event

def test_create_registration_success(client, db):
    """Verifies that a valid registration can be submitted successfully."""
    response = client.post("/api/registrations", json={
        "event_id": "test-event-id",
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "0712345678",
        "organization": "ABC Co",
        "designation": "Manager",
        "county": "Nairobi"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Jane Doe"
    assert data["email"] == "jane@example.com"
    assert data["phone"] == "254712345678" # Normalized format
    assert data["status"] == "PENDING_PAYMENT"

def test_phone_number_normalization(client):
    """Tests the normalization of various Kenyan phone formats."""
    test_cases = [
        ("0712345678", "254712345678"),
        ("0112345678", "254112345678"),
        ("+254712345678", "254712345678"),
        ("254712345678", "254712345678"),
    ]
    
    for input_phone, expected_normalized in test_cases:
        response = client.post("/api/registrations", json={
            "event_id": "test-event-id",
            "full_name": "Test User",
            "email": "test@example.com",
            "phone": input_phone
        })
        assert response.status_code == 200
        assert response.json()["phone"] == expected_normalized

def test_phone_number_validation_error(client):
    """Verifies that invalid phone numbers trigger a 400 Bad Request."""
    invalid_phones = [
        "12345",
        "07123",
        "020-123456",
        "+25471234",
        "not-a-phone-number"
    ]
    
    for invalid_phone in invalid_phones:
        response = client.post("/api/registrations", json={
            "event_id": "test-event-id",
            "full_name": "Test User",
            "email": "test@example.com",
            "phone": invalid_phone
        })
        assert response.status_code == 400
        assert "Invalid Kenyan phone number" in response.json()["detail"]

def test_duplicate_registration_guard(client, db):
    """Verifies double registration prevention logic."""
    payload = {
        "event_id": "test-event-id",
        "full_name": "Duplicate User",
        "email": "duplicate@example.com",
        "phone": "0711222333"
    }
    
    # 1. Create first registration
    resp1 = client.post("/api/registrations", json=payload)
    assert resp1.status_code == 200
    id1 = resp1.json()["id"]
    
    # 2. Resubmitting pending registration should return the same record ID (reused)
    resp2 = client.post("/api/registrations", json=payload)
    assert resp2.status_code == 200
    assert resp2.json()["id"] == id1
    
    # 3. Simulate payment completed for the first registration
    reg = db.query(Registration).filter(Registration.id == id1).first()
    reg.status = "PAID"
    reg.registration_number = "REG-2026-000001"
    db.commit()
    
    # 4. Attempting to register again with same email/event should trigger double-registration error
    resp3 = client.post("/api/registrations", json=payload)
    assert resp3.status_code == 400
    assert "confirmed paid registration already exists" in resp3.json()["detail"]

def test_get_registration_details_masked(client, db):
    """Verifies retrieval of registration details with masked phone numbers for privacy."""
    # Create registration
    response = client.post("/api/registrations", json={
        "event_id": "test-event-id",
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "0712345678"
    })
    reg_id = response.json()["id"]
    
    # Fetch details
    detail_resp = client.get(f"/api/registrations/{reg_id}")
    assert detail_resp.status_code == 200
    data = detail_resp.json()
    assert data["registration"]["full_name"] == "Jane Doe"
    assert data["registration"]["phone"] == "254712******78" # Correct masking
