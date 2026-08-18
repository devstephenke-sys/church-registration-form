import os
import time
import base64
import logging
import requests
from datetime import datetime
from backend.app.config import settings

logger = logging.getLogger(__name__)

class DarajaException(Exception):
    """Custom exception for Daraja API failures."""
    pass

class DarajaClient:
    def __init__(self):
        self.cached_token = None
        self.token_expiry = 0.0

    @property
    def base_url(self) -> str:
        if settings.MPESA_ENVIRONMENT.lower() == "production":
            return "https://api.safaricom.co.ke"
        return "https://sandbox.safaricom.co.ke"

    def get_access_token(self) -> str:
        """Fetches and caches the OAuth access token from Safaricom Daraja API."""
        # Return cached token if still valid (using 60s safety buffer)
        if self.cached_token and time.time() < self.token_expiry - 60:
            return self.cached_token

        logger.info("Fetching new M-PESA Daraja OAuth token...")
        
        consumer_key = settings.DARAJA_CONSUMER_KEY
        consumer_secret = settings.DARAJA_CONSUMER_SECRET
        
        if not consumer_key or not consumer_secret:
            raise DarajaException("DARAJA_CONSUMER_KEY or DARAJA_CONSUMER_SECRET is not configured.")

        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        
        try:
            response = requests.get(
                url, 
                auth=(consumer_key, consumer_secret),
                timeout=15
            )
            
            if response.status_code != 200:
                logger.error(f"Daraja OAuth failed. Status: {response.status_code}, Body: {response.text}")
                raise DarajaException(f"Failed to generate access token. Status code: {response.status_code}")
            
            data = response.json()
            access_token = data.get("access_token")
            expires_in = int(data.get("expires_in", 3600))
            
            # Cache the token
            self.cached_token = access_token
            self.token_expiry = time.time() + expires_in
            
            logger.info("Successfully fetched new Daraja access token.")
            return access_token
            
        except requests.RequestException as e:
            logger.error(f"Network error during Daraja OAuth: {str(e)}")
            raise DarajaException(f"Network error calling Safaricom OAuth: {str(e)}")

    def initiate_stk_push(self, phone: str, amount: int, account_ref: str, transaction_desc: str = "Event Registration") -> dict:
        """Initiates an STK Push (Lipa Na M-PESA Online) request."""
        logger.info(f"Initiating STK Push for {phone}, Amount: {amount}, Ref: {account_ref}")
        
        access_token = self.get_access_token()
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        shortcode = settings.MPESA_SHORTCODE
        passkey = settings.MPESA_PASSKEY
        
        if not passkey:
            raise DarajaException("MPESA_PASSKEY environment variable is not set.")
            
        # Calculate password: base64(ShortCode + PassKey + Timestamp)
        password_str = f"{shortcode}{passkey}{timestamp}"
        password_bytes = password_str.encode("utf-8")
        password = base64.b64encode(password_bytes).decode("utf-8")
        
        # Ensure callback URL is defined
        callback_url = settings.MPESA_CALLBACK_URL
        if not callback_url:
            raise DarajaException("MPESA_CALLBACK_URL is not configured.")
            
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "BusinessShortCode": int(shortcode),
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": int(phone),
            "PartyB": int(shortcode),
            "PhoneNumber": int(phone),
            "CallBackURL": callback_url,
            "AccountReference": account_ref,
            "TransactionDesc": transaction_desc[:20]  # Safaricom limits description length
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=20)
            logger.info(f"Daraja STK push response status: {response.status_code}")
            
            if response.status_code not in [200, 201]:
                logger.error(f"Daraja STK push rejected. Status: {response.status_code}, Body: {response.text}")
                raise DarajaException(f"Safaricom rejected request. Status: {response.status_code}, Details: {response.text}")
                
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"Network error during Daraja STK Push: {str(e)}")
            raise DarajaException(f"Failed to communicate with M-PESA STK Push API: {str(e)}")

# Global instance
daraja_client = DarajaClient()
