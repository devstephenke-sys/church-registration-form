import pytest
from backend.app.models import Registration, QRVerification, Payment

@pytest.fixture
def paid_registration(db):
    """Creates a paid registration and returns registration details and token."""
    reg = Registration(
        event_id="test-event-id",
        full_name="Jane Doe",
        email="jane@example.com",
        phone="254712345678",
        organization="ABC Org",
        status="PAID",
        registration_number="REG-2026-000123"
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    
    payment = Payment(
        registration_id=reg.id,
        amount=1000.00,
        currency="KES",
        phone="254712345678",
        payment_status="SUCCESS",
        mpesa_receipt="MPESARECEIPT",
        result_code=0
    )
    db.add(payment)
    
    qr = QRVerification(
        registration_id=reg.id,
        token="secure_test_token_12345",
        status="ACTIVE"
    )
    db.add(qr)
    db.commit()
    
    return reg, qr

def test_public_qr_verification_valid(client, paid_registration):
    """Tests scanning a valid paid registration QR code."""
    _, qr = paid_registration
    response = client.get(f"/api/verify/{qr.token}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VALID"
    assert data["full_name"] == "Jane Doe"
    assert data["registration_number"] == "REG-2026-000123"
    assert data["mpesa_receipt"] == "MPESARECEIPT"

def test_public_qr_verification_invalid(client):
    """Tests scanning an unrecognized QR code token."""
    response = client.get("/api/verify/non_existent_token")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "INVALID"
    assert "could not be verified" in data["message"]

def test_admin_check_in_success(client, paid_registration, db):
    """Tests administrative check-in flow and status update."""
    reg, qr = paid_registration
    
    # Authenticate as check-in staff
    login_resp = client.post("/api/admin/login", json={
        "username": "staff",
        "password": "StaffPassword123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Scan and check in
    response = client.post("/api/admin/check-in", json={"token": qr.token}, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    # Assert database updated to CHECKED_IN
    db.expire_all()
    updated_reg = db.query(Registration).filter(Registration.id == reg.id).first()
    assert updated_reg.status == "CHECKED_IN"
    assert updated_reg.checked_in_at is not None

def test_admin_double_check_in_prevention(client, paid_registration, db):
    """Verifies that scanning a QR code twice results in 'ALREADY CHECKED IN' error on the second attempt."""
    reg, qr = paid_registration
    
    # Login staff
    login_resp = client.post("/api/admin/login", json={
        "username": "staff",
        "password": "StaffPassword123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1st scan - Success check-in
    resp1 = client.post("/api/admin/check-in", json={"token": qr.token}, headers=headers)
    assert resp1.status_code == 200
    
    # 2nd scan - Reject with 400 Bad Request
    resp2 = client.post("/api/admin/check-in", json={"token": qr.token}, headers=headers)
    assert resp2.status_code == 400
    assert "already checked in" in resp2.json()["detail"]
    
    # Verify public verify status changes to ALREADY_CHECKED_IN
    public_resp = client.get(f"/api/verify/{qr.token}")
    assert public_resp.status_code == 200
    assert public_resp.json()["status"] == "ALREADY_CHECKED_IN"
