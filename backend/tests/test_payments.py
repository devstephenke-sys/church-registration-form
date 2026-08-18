import pytest
from unittest.mock import patch
from backend.app.models import Registration, Payment, QRVerification

@pytest.fixture
def pending_registration(client):
    """Creates a registration and returns its ID."""
    response = client.post("/api/registrations", json={
        "event_id": "test-event-id",
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone": "0722334455"
    })
    return response.json()["id"]

@patch("backend.app.routes.payments.daraja_client.initiate_stk_push")
def test_initiate_payment_success(mock_stk, client, pending_registration, db):
    """Verifies successful initiation of STK Push and database updates."""
    # Mock Daraja response
    mock_stk.return_value = {
        "MerchantRequestID": "mock-merchant-id-123",
        "CheckoutRequestID": "mock-checkout-id-456",
        "ResponseCode": "0",
        "ResponseDescription": "Success",
        "CustomerMessage": "Please check your phone"
    }
    
    response = client.post("/api/payments/stk-push", json={
        "registration_id": pending_registration
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["checkout_request_id"] == "mock-checkout-id-456"
    
    # Check registration updated to processing
    reg = db.query(Registration).filter(Registration.id == pending_registration).first()
    assert reg.status == "PAYMENT_PROCESSING"
    
    # Check payment record created
    payment = db.query(Payment).filter(Payment.registration_id == pending_registration).first()
    assert payment is not None
    assert payment.payment_status == "PENDING"
    assert payment.checkout_request_id == "mock-checkout-id-456"

@patch("backend.app.routes.payments.daraja_client.initiate_stk_push")
def test_stk_push_spam_prevention(mock_stk, client, pending_registration):
    """Verifies that spamming STK Push requests within 60s is blocked and returns cached checkout_request_id."""
    mock_stk.return_value = {
        "MerchantRequestID": "mock-merchant-id-123",
        "CheckoutRequestID": "mock-checkout-id-456",
        "CustomerMessage": "Please check your phone"
    }
    
    # First request
    resp1 = client.post("/api/payments/stk-push", json={"registration_id": pending_registration})
    assert resp1.status_code == 200
    assert resp1.json()["checkout_request_id"] == "mock-checkout-id-456"
    assert mock_stk.call_count == 1
    
    # Second request immediately after
    resp2 = client.post("/api/payments/stk-push", json={"registration_id": pending_registration})
    assert resp2.status_code == 200
    assert resp2.json()["checkout_request_id"] == "mock-checkout-id-456"
    assert "M-PESA prompt already sent" in resp2.json()["customer_message"]
    # Mock should NOT have been called a second time
    assert mock_stk.call_count == 1

@patch("backend.app.routes.payments.email_service.send_confirmation_email")
@patch("backend.app.routes.payments.daraja_client.initiate_stk_push")
def test_callback_processing_success(mock_stk, mock_email, client, pending_registration, db):
    """Tests the authoritative Safaricom callback on successful payment."""
    mock_stk.return_value = {
        "MerchantRequestID": "mock-merchant-123",
        "CheckoutRequestID": "mock-checkout-456",
        "CustomerMessage": "Prompt sent"
    }
    mock_email.return_value = True
    
    # Initiate payment first
    client.post("/api/payments/stk-push", json={"registration_id": pending_registration})
    
    # Mock callback payload from Safaricom
    callback_payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "mock-merchant-123",
                "CheckoutRequestID": "mock-checkout-456",
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 1000.00},
                        {"Name": "MpesaReceiptNumber", "Value": "QWERTYUIOP"},
                        {"Name": "TransactionDate", "Value": 20260818112000},
                        {"Name": "PhoneNumber", "Value": 254722334455}
                    ]
                }
            }
        }
    }
    
    response = client.post("/api/payments/callback", json=callback_payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    # Refresh database records
    db.expire_all()
    
    # Assert payment updated
    payment = db.query(Payment).filter(Payment.checkout_request_id == "mock-checkout-456").first()
    assert payment.payment_status == "SUCCESS"
    assert payment.mpesa_receipt == "QWERTYUIOP"
    
    # Assert registration updated to PAID and registration number generated
    reg = db.query(Registration).filter(Registration.id == pending_registration).first()
    assert reg.status == "PAID"
    assert reg.registration_number == "REG-2026-000001"
    
    # Assert QR Verification record generated
    qr = db.query(QRVerification).filter(QRVerification.registration_id == pending_registration).first()
    assert qr is not None
    assert len(qr.token) > 20

@patch("backend.app.routes.payments.daraja_client.initiate_stk_push")
def test_callback_processing_failure(mock_stk, client, pending_registration, db):
    """Tests Safaricom callback on transaction cancellation/failure."""
    mock_stk.return_value = {
        "MerchantRequestID": "mock-merchant-123",
        "CheckoutRequestID": "mock-checkout-456",
        "CustomerMessage": "Prompt sent"
    }
    
    client.post("/api/payments/stk-push", json={"registration_id": pending_registration})
    
    # User cancelled (ResultCode 1032)
    callback_payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "mock-merchant-123",
                "CheckoutRequestID": "mock-checkout-456",
                "ResultCode": 1032,
                "ResultDesc": "Request cancelled by user."
            }
        }
    }
    
    response = client.post("/api/payments/callback", json=callback_payload)
    assert response.status_code == 200
    
    db.expire_all()
    
    payment = db.query(Payment).filter(Payment.checkout_request_id == "mock-checkout-456").first()
    assert payment.payment_status == "FAILED"
    
    reg = db.query(Registration).filter(Registration.id == pending_registration).first()
    assert reg.status == "PAYMENT_FAILED"

@patch("backend.app.routes.payments.email_service.send_confirmation_email")
@patch("backend.app.routes.payments.daraja_client.initiate_stk_push")
def test_callback_idempotency(mock_stk, mock_email, client, pending_registration, db):
    """Verifies that duplicate callbacks are processed idempotently (no duplicate registration numbers/QR codes/emails)."""
    mock_stk.return_value = {
        "MerchantRequestID": "mock-merchant-123",
        "CheckoutRequestID": "mock-checkout-456",
        "CustomerMessage": "Prompt sent"
    }
    mock_email.return_value = True
    
    client.post("/api/payments/stk-push", json={"registration_id": pending_registration})
    
    callback_payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "mock-merchant-123",
                "CheckoutRequestID": "mock-checkout-456",
                "ResultCode": 0,
                "ResultDesc": "Success.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 1000.00},
                        {"Name": "MpesaReceiptNumber", "Value": "QWERTYUIOP"},
                        {"Name": "TransactionDate", "Value": 20260818112000},
                        {"Name": "PhoneNumber", "Value": 254722334455}
                    ]
                }
            }
        }
    }
    
    # Send first callback
    resp1 = client.post("/api/payments/callback", json=callback_payload)
    assert resp1.status_code == 200
    
    # Record generated details
    db.expire_all()
    reg1 = db.query(Registration).filter(Registration.id == pending_registration).first()
    reg_num1 = reg1.registration_number
    qr_token1 = reg1.qr_verification.token
    assert reg_num1 == "REG-2026-000001"
    
    # Send second callback (simulated Safaricom retry)
    resp2 = client.post("/api/payments/callback", json=callback_payload)
    assert resp2.status_code == 200
    assert resp2.json()["message"] == "Already processed"
    
    # Verify values did not change
    db.expire_all()
    reg2 = db.query(Registration).filter(Registration.id == pending_registration).first()
    assert reg2.registration_number == reg_num1
    assert reg2.qr_verification.token == qr_token1
    
    # Verify email only sent once (mock_email called once)
    # Note: process_email_background is executed inside BackgroundTasks, which runs synchronously in TestClient.
    # So we can assert its call count.
    # Wait, in FastAPI TestClient, background tasks run synchronously during request execution.
    # Therefore, if it was called a second time, mock_email would have call_count = 2.
    assert mock_email.call_count == 1
