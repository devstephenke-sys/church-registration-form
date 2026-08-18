import io
import base64
import qrcode
from backend.app.config import settings

class QRService:
    @staticmethod
    def generate_verification_url(token: str) -> str:
        """Helper to generate the public verification URL for a registration token."""
        base_url = settings.QR_BASE_URL.rstrip('/')
        return f"{base_url}/{token}"

    @staticmethod
    def generate_qr_image_bytes(token: str) -> bytes:
        """Generates QR code PNG image bytes for a given verification token."""
        url = QRService.generate_verification_url(token)
        
        # Configure QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        # Create an image using Pil
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to buffer
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        return img_byte_arr.getvalue()

    @staticmethod
    def generate_qr_base64(token: str) -> str:
        """Generates QR code Base64 data URL (e.g., 'data:image/png;base64,...') for rendering in HTML."""
        img_bytes = QRService.generate_qr_image_bytes(token)
        base64_encoded = base64.b64encode(img_bytes).decode('utf-8')
        return f"data:image/png;base64,{base64_encoded}"

qr_service = QRService()
