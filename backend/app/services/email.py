import logging
import base64
import requests
from backend.app.config import settings
from backend.app.services.qr import qr_service

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_confirmation_email(
        recipient_email: str,
        participant_name: str,
        registration_number: str,
        amount: float,
        mpesa_receipt: str,
        payment_date: str,
        qr_token: str,
        event_name: str = "2026 Digital Skills Conference"
    ) -> bool:
        """Sends a beautiful confirmation email with an embedded QR code using the Resend API."""
        api_key = settings.EMAIL_PROVIDER_API_KEY
        from_email = settings.EMAIL_FROM
        from_name = settings.EMAIL_FROM_NAME
        
        if not api_key or "mock" in api_key.lower():
            logger.warning("EMAIL_PROVIDER_API_KEY not configured. Email will be logged but not sent.")
            return False

        # Generate QR code PNG bytes and base64 encode
        qr_bytes = qr_service.generate_qr_image_bytes(qr_token)
        qr_base64 = base64.b64encode(qr_bytes).decode('utf-8')
        
        subject = f"Registration Confirmed — {registration_number}"
        
        # Design a highly professional HTML template with responsive CSS
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Confirmed</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f6f9fc;
                    margin: 0;
                    padding: 0;
                    -webkit-font-smoothing: antialiased;
                }}
                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    border: 1px solid #eef2f5;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%);
                    color: #ffffff;
                    padding: 40px 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                }}
                .header p {{
                    margin: 10px 0 0;
                    font-size: 16px;
                    opacity: 0.9;
                }}
                .content {{
                    padding: 40px 30px;
                    color: #334155;
                    line-height: 1.6;
                }}
                .greeting {{
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 20px;
                }}
                .details-box {{
                    background-color: #f8fafc;
                    border: 1px solid #f1f5f9;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 30px;
                }}
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    border-bottom: 1px dashed #e2e8f0;
                    padding-bottom: 8px;
                }}
                .detail-row:last-child {{
                    margin-bottom: 0;
                    border-bottom: none;
                    padding-bottom: 0;
                }}
                .detail-label {{
                    font-weight: 500;
                    color: #64748b;
                }}
                .detail-value {{
                    font-weight: 600;
                    color: #0f172a;
                }}
                .qr-container {{
                    text-align: center;
                    margin: 30px 0;
                    padding: 20px;
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    border-radius: 8px;
                }}
                .qr-image {{
                    width: 200px;
                    height: 200px;
                    margin-bottom: 15px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                }}
                .instructions {{
                    font-size: 14px;
                    color: #64748b;
                    text-align: center;
                    margin-top: 10px;
                }}
                .footer {{
                    background-color: #f8fafc;
                    padding: 20px 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #94a3b8;
                    border-top: 1px solid #eef2f5;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>REGISTRATION CONFIRMED ✓</h1>
                    <p>{event_name}</p>
                </div>
                <div class="content">
                    <div class="greeting">Dear {participant_name},</div>
                    <p>Your registration has been successfully confirmed. Please find your registration details and secure check-in QR code below.</p>
                    
                    <div class="details-box">
                        <div class="detail-row">
                            <span class="detail-label">Registration Number:</span>
                            <span class="detail-value" style="color: #0d9488;">{registration_number}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Amount Paid:</span>
                            <span class="detail-value">KES {amount:,.2f}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">M-PESA Receipt:</span>
                            <span class="detail-value">{mpesa_receipt}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Payment Date:</span>
                            <span class="detail-value">{payment_date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Payment Status:</span>
                            <span class="detail-value" style="color: #0d9488;">PAID ✓</span>
                        </div>
                    </div>

                    <div class="qr-container">
                        <h3>Your QR Verification Code</h3>
                        <img src="cid:qrcode" alt="QR Verification Code" class="qr-image" />
                        <div class="instructions">
                            Present this QR code (either on your phone or printed) at the event entrance for verification and check-in.
                        </div>
                    </div>
                </div>
                <div class="footer">
                    &copy; {datetime.now().year} {event_name}. All rights reserved.<br>
                    This is an automated transactional receipt. Do not reply to this email.
                </div>
            </div>
        </body>
        </html>
        """

        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "from": f"{from_name} <{from_email}>",
            "to": [recipient_email],
            "subject": subject,
            "html": html_content,
            "attachments": [
                {
                    "content": qr_base64,
                    "filename": "qrcode.png",
                    "content_type": "image/png",
                    "disposition": "inline",
                    "cid": "qrcode"
                }
            ]
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            logger.info(f"Resend email status: {response.status_code}")
            
            if response.status_code not in [200, 201]:
                logger.error(f"Resend rejected email. Status: {response.status_code}, Body: {response.text}")
                return False
                
            return True
            
        except requests.RequestException as e:
            logger.error(f"Failed to connect to Resend API: {str(e)}")
            return False

email_service = EmailService()
