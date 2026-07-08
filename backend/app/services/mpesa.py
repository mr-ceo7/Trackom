"""
M-Pesa payment gateway service — real STK push implementation using Safaricom Daraja API.
"""

import httpx
import base64
import logging
from datetime import datetime
from app.config import get_settings

logger = logging.getLogger("trackom.mpesa")

async def get_mpesa_access_token() -> str:
    """Get OAuth access token from Safaricom Daraja API."""
    settings = get_settings()
    if settings.MPESA_ENV == "sandbox":
        url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    else:
        url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"

    key = settings.MPESA_CONSUMER_KEY.replace("\n", "").replace("\r", "").replace(" ", "").strip()
    secret = settings.MPESA_CONSUMER_SECRET.replace("\n", "").replace("\r", "").replace(" ", "").strip()
    
    logger.info(f"Generating Safaricom token. Key prefix: {key[:5]}... (len: {len(key)}), Secret prefix: {secret[:5]}... (len: {len(secret)})")
    
    credentials = base64.b64encode(f"{key}:{secret}".encode()).decode()

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(url, headers={"Authorization": f"Basic {credentials}"})
            if resp.status_code != 200:
                logger.error(f"Failed to fetch M-Pesa token. Status: {resp.status_code}, Body: {resp.text}")
                raise Exception(f"M-Pesa Token Error: {resp.status_code} - {resp.text}")
            data = resp.json()
            return data["access_token"]
        except httpx.TimeoutException:
            raise Exception("M-Pesa access token request timed out.")
        except httpx.RequestError as e:
            raise Exception(f"M-Pesa connection error: {str(e)}")


async def initiate_mpesa_stk(phone: str, amount: float, reference: str) -> dict:
    """Initiate an M-Pesa STK Push process request."""
    settings = get_settings()
    token = await get_mpesa_access_token()

    if settings.MPESA_ENV == "sandbox":
        url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    else:
        url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    shortcode = settings.MPESA_SHORTCODE.replace("\n", "").replace("\r", "").replace(" ", "").strip()
    passkey = settings.MPESA_PASSKEY.replace("\n", "").replace("\r", "").replace(" ", "").strip()

    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()

    # Ensure phone is formatted as 2547XXXXXXXX
    cleaned_phone = phone.strip().replace("+", "").replace(" ", "").replace("-", "")
    if cleaned_phone.startswith("0") and len(cleaned_phone) == 10:
        cleaned_phone = "254" + cleaned_phone[1:]

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": cleaned_phone,
        "PartyB": shortcode,
        "PhoneNumber": cleaned_phone,
        "CallBackURL": f"{settings.MPESA_CALLBACK_URL}?secret={settings.MPESA_CALLBACK_SECRET}" if settings.MPESA_CALLBACK_SECRET else settings.MPESA_CALLBACK_URL,
        "AccountReference": reference,
        "TransactionDesc": f"Trackom Wallet Topup {reference}",
    }

    logger.info(f"Initiating M-Pesa STK push for {cleaned_phone} - Amount: {amount}, Ref: {reference}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code != 200:
                logger.error(f"M-Pesa STK API returned error: {resp.status_code} - {resp.text}")
                raise Exception(f"M-Pesa STK Push error: {resp.status_code} - {resp.text}")
            
            data = resp.json()
            logger.info(f"M-Pesa STK push accepted: {data.get('CheckoutRequestID')}")
            return data
        except httpx.TimeoutException:
            raise Exception("M-Pesa STK push request timed out.")
        except httpx.RequestError as e:
            raise Exception(f"M-Pesa connection error: {str(e)}")
