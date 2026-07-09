"""SMS Gateway Client Interface and Simulated Gateway implementation."""

import abc
import asyncio
import logging
import uuid
from typing import List, Dict, Any

import httpx

from app.config import get_settings

logger = logging.getLogger("trackom.sms_gateway")

# AdvantaSMS response code descriptions
ADVANTA_RESPONSE_CODES = {
    200: "Success",
    1001: "Invalid sender ID",
    1002: "Network not allowed",
    1003: "Invalid mobile number",
    1004: "Low bulk credits",
    1005: "System error",
    1006: "Invalid credentials",
    1007: "System error",
    1008: "No Delivery Report",
    1009: "Unsupported data type",
    1010: "Low OTP credits",
}


class SmsGatewayException(Exception):
    """Base exception for SMS Gateway operations."""
    pass


class BaseSMSGateway(abc.ABC):
    """Abstract Base Class defining the SMS Gateway Client interface."""

    @abc.abstractmethod
    async def send_messages(
        self,
        sender_id: str,
        recipients: List[str],
        message: str
    ) -> List[Dict[str, Any]]:
        """
        Send a message to multiple recipients.
        
        Args:
            sender_id: The approved alphanumeric Sender ID or Shortcode.
            recipients: List of E.164 phone numbers.
            message: The raw text content of the message.
            
        Returns:
            List[Dict]: List of results per recipient:
                [
                    {
                        "recipient": "+254712345678",
                        "status": "success" | "failed",
                        "message_id": "gateway-uuid",
                        "cost": float,
                        "error_message": str | None
                    },
                    ...
                ]
        """
        pass


class AfricaTalkingSimulatorGateway(BaseSMSGateway):
    """
    Simulates the Africa's Talking SMS API.
    Provides realistic API responses, latency, and success/failure distribution.
    """

    async def send_messages(
        self,
        sender_id: str,
        recipients: List[str],
        message: str
    ) -> List[Dict[str, Any]]:
        # Simulate network latency (e.g. 50ms per batch, capped at 1s)
        delay = min(1.0, 0.05 * len(recipients))
        await asyncio.sleep(delay)

        results = []
        for phone in recipients:
            clean_phone = phone.strip()
            
            is_success = True
            error_msg = None
            status_str = "success"
            
            if not (clean_phone.startswith("+") or len(clean_phone) >= 9):
                is_success = False
                error_msg = "Invalid Phone Number Format"
                status_str = "failed"
            elif clean_phone.endswith("999"):
                is_success = False
                error_msg = "User Opted Out / DND Active"
                status_str = "failed"
            
            simulated_msg_id = f"AT_SMS_{uuid.uuid4().hex[:12].upper()}"
            parts = max(1, len(message) // 160)
            
            results.append({
                "recipient": clean_phone,
                "status": status_str,
                "message_id": simulated_msg_id if is_success else None,
                "cost": float(parts),
                "error_message": error_msg
            })
            
            logger.info(
                f"Simulated Gateway send: to={clean_phone} sender={sender_id} "
                f"id={simulated_msg_id} status={status_str} error={error_msg}"
            )
            
        return results


class AdvantaSMSGateway(BaseSMSGateway):
    """
    Real AdvantaSMS Gateway integration.
    Calls the live AdvantaSMS API at https://quicksms.advantasms.com.
    """

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.ADVANTA_API_KEY
        self.partner_id = settings.ADVANTA_PARTNER_ID
        self.base_url = settings.ADVANTA_BASE_URL
        from app.routers.admin import load_system_settings
        sys_settings = load_system_settings()
        self.default_shortcode = sys_settings.get("advantasmsDefaultShortcode") or settings.ADVANTA_DEFAULT_SHORTCODE


    @staticmethod
    def _normalize_phone(phone: str) -> str:
        """Normalize phone number for AdvantaSMS (strip +, ensure 254 prefix)."""
        cleaned = phone.strip().replace(" ", "").replace("-", "")
        # Strip leading +
        if cleaned.startswith("+"):
            cleaned = cleaned[1:]
        # Convert 07xxx to 2547xxx for Kenyan numbers
        if cleaned.startswith("07") and len(cleaned) == 10:
            cleaned = "254" + cleaned[1:]
        # Convert 01xxx to 2541xxx for Kenyan numbers
        if cleaned.startswith("01") and len(cleaned) == 10:
            cleaned = "254" + cleaned[1:]
        # Convert 7xxx to 2547xxx
        if cleaned.startswith("7") and len(cleaned) == 9:
            cleaned = "254" + cleaned
        return cleaned

    async def send_messages(
        self,
        sender_id: str,
        recipients: List[str],
        message: str
    ) -> List[Dict[str, Any]]:
        """Send SMS via AdvantaSMS /api/services/sendsms endpoint."""
        normalized = [self._normalize_phone(r) for r in recipients]
        mobile_str = ",".join(normalized)

        payload = {
            "apikey": self.api_key,
            "partnerID": self.partner_id,
            "message": message,
            "shortcode": sender_id or self.default_shortcode,
            "mobile": mobile_str,
        }

        logger.info(
            f"AdvantaSMS: Sending to {len(normalized)} recipient(s) "
            f"via sender_id='{sender_id}'"
        )

        results = []
        try:
            import asyncio
            retries = 3
            backoff = 1.0
            resp_data = None
            for attempt in range(retries):
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(
                            f"{self.base_url}/api/services/sendsms",
                            json=payload,
                        )
                        logger.info(
                            f"AdvantaSMS: HTTP {resp.status_code} response received on attempt {attempt + 1}"
                        )
                        resp_data = resp.json()
                        break
                except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as exc:
                    if attempt == retries - 1:
                        logger.error(f"AdvantaSMS: All retry attempts failed for send: {exc}")
                        raise exc
                    logger.warning(f"AdvantaSMS: Network error on attempt {attempt + 1}: {exc}. Retrying in {backoff}s...")
                    await asyncio.sleep(backoff)
                    backoff *= 2

            # Parse the response
            responses = resp_data.get("responses", [])

            if responses:
                for item in responses:
                    resp_code = item.get("response-code", item.get("responsecode", 0))
                    resp_code = int(resp_code) if resp_code else 0
                    msg_id = item.get("messageid", item.get("message-id"))
                    recipient_phone = item.get("mobile", item.get("recipient", ""))
                    is_success = resp_code == 200
                    error_desc = None if is_success else ADVANTA_RESPONSE_CODES.get(
                        resp_code, f"Unknown error (code: {resp_code})"
                    )

                    results.append({
                        "recipient": recipient_phone,
                        "status": "success" if is_success else "failed",
                        "message_id": str(msg_id) if msg_id else None,
                        "cost": 1.0,
                        "error_message": error_desc,
                    })

                    logger.info(
                        f"AdvantaSMS: to={recipient_phone} code={resp_code} "
                        f"msg_id={msg_id} status={'success' if is_success else 'failed'}"
                    )
            else:
                # Fallback: API returned a single-level response (no responses array)
                resp_code = int(resp_data.get("response-code", resp_data.get("responsecode", 0)))
                msg_id = resp_data.get("messageid", resp_data.get("message-id"))
                is_success = resp_code == 200
                error_desc = None if is_success else ADVANTA_RESPONSE_CODES.get(
                    resp_code, f"Unknown error (code: {resp_code})"
                )

                # Map results back to original recipients
                for i, phone in enumerate(normalized):
                    results.append({
                        "recipient": phone,
                        "status": "success" if is_success else "failed",
                        "message_id": str(msg_id) if msg_id else None,
                        "cost": 1.0,
                        "error_message": error_desc,
                    })

                logger.info(
                    f"AdvantaSMS: Bulk result code={resp_code} "
                    f"msg_id={msg_id} recipients={len(normalized)}"
                )

        except httpx.HTTPError as e:
            logger.error(f"AdvantaSMS: HTTP error: {e}")
            for phone in normalized:
                results.append({
                    "recipient": phone,
                    "status": "failed",
                    "message_id": None,
                    "cost": 0.0,
                    "error_message": f"HTTP error: {str(e)}",
                })
        except Exception as e:
            logger.error(f"AdvantaSMS: Unexpected error: {e}")
            for phone in normalized:
                results.append({
                    "recipient": phone,
                    "status": "failed",
                    "message_id": None,
                    "cost": 0.0,
                    "error_message": f"Gateway error: {str(e)}",
                })

        return results

    async def check_balance(self, timeout: float = 5.0) -> dict:
        """Check AdvantaSMS account balance via /api/services/getbalance."""
        params = {
            "apikey": self.api_key,
            "partnerID": self.partner_id,
        }
        try:
            import asyncio
            retries = 3
            backoff = 0.5
            for attempt in range(retries):
                try:
                    async with httpx.AsyncClient(timeout=timeout) as client:
                        resp = await client.get(
                            f"{self.base_url}/api/services/getbalance",
                            params=params,
                        )
                        data = resp.json()
                        logger.info(f"AdvantaSMS: Balance check response: {data}")
                        return data
                except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as exc:
                    if attempt == retries - 1:
                        logger.error(f"AdvantaSMS: All balance check retries failed: {exc}")
                        raise exc
                    logger.warning(f"AdvantaSMS: Balance check network error on attempt {attempt + 1}: {exc}. Retrying in {backoff}s...")
                    await asyncio.sleep(backoff)
                    backoff *= 2
        except Exception as e:
            logger.error(f"AdvantaSMS: Balance check failed: {e}")
            raise SmsGatewayException(f"Failed to check balance: {str(e)}")

    async def get_delivery_report(self, message_id: str) -> dict:
        """Fetch delivery report for a message via /api/services/getdlr."""
        params = {
            "apikey": self.api_key,
            "partnerID": self.partner_id,
            "messageID": message_id,
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"{self.base_url}/api/services/getdlr",
                    params=params,
                )
                data = resp.json()
                logger.info(
                    f"AdvantaSMS: DLR for message_id={message_id}: {data}"
                )
                return data
        except Exception as e:
            logger.error(f"AdvantaSMS: DLR fetch failed for {message_id}: {e}")
            raise SmsGatewayException(f"Failed to fetch delivery report: {str(e)}")

    async def send_bulk(self, sms_list: list) -> list:
        """
        Send personalized bulk SMS via /api/services/sendbulk.
        
        Args:
            sms_list: List of dicts with keys: mobile, message, shortcode (optional),
                      clientsmsid (optional).
        
        Returns:
            List of response dicts per message.
        """
        formatted_list = []
        for item in sms_list:
            formatted_list.append({
                "partnerID": self.partner_id,
                "apikey": self.api_key,
                "pass_type": "plain",
                "clientsmsid": item.get("clientsmsid", str(uuid.uuid4().hex[:12])),
                "mobile": self._normalize_phone(item["mobile"]),
                "message": item["message"],
                "shortcode": item.get("shortcode", self.default_shortcode),
            })

        payload = {
            "count": len(formatted_list),
            "smslist": formatted_list,
        }

        logger.info(f"AdvantaSMS: Sending bulk batch of {len(formatted_list)} messages")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/services/sendbulk",
                    json=payload,
                )
                data = resp.json()
                logger.info(f"AdvantaSMS: Bulk send response: {data}")
                return data.get("responses", [data])
        except Exception as e:
            logger.error(f"AdvantaSMS: Bulk send failed: {e}")
            raise SmsGatewayException(f"Bulk send failed: {str(e)}")


class DynamicLoadBalancedGateway:
    """
    Load balances outgoing SMS traffic between multiple configured gateways
    in the database based on their assigned weight percentages.
    """

    async def send_messages(
        self,
        sender_id: str,
        recipients: List[str],
        message: str,
        db,
        sandbox_mode: bool = True
    ) -> List[Dict[str, Any]]:
        # If live mode, use AdvantaSMSGateway directly (bypass DB gateway selection)
        if not sandbox_mode:
            gateway = AdvantaSMSGateway()
            logger.info(
                f"Load Balancer: LIVE mode — routing {len(recipients)} messages "
                f"via AdvantaSMSGateway"
            )
            return await gateway.send_messages(sender_id, recipients, message)

        import random
        from sqlalchemy import select
        from app.models.gateway import SmsGateway

        # Retrieve active gateways
        res = await db.execute(select(SmsGateway).where(SmsGateway.is_active == True))
        gateways = res.scalars().all()

        if not gateways:
            # Fallback to standard simulator if no gateways defined
            simulator = AfricaTalkingSimulatorGateway()
            return await simulator.send_messages(sender_id, recipients, message)

        weights = [g.weight for g in gateways]
        if sum(weights) == 0:
            weights = [1 for _ in gateways]

        selected_gateway = random.choices(gateways, weights=weights)[0]
        logger.info(
            f"Load Balancer: Routed {len(recipients)} messages to gateway "
            f"'{selected_gateway.name}' (weight={selected_gateway.weight}%)"
        )

        # Call simulated gateway and prefix results to visually confirm route choice
        simulator = AfricaTalkingSimulatorGateway()
        results = await simulator.send_messages(sender_id, recipients, message)
        for r in results:
            if r["status"] == "success" and r["message_id"]:
                prefix = selected_gateway.name.upper().replace(" ", "_")
                r["message_id"] = f"{prefix}_{r['message_id']}"

        return results


# Global singleton instance
_gateway_instance = DynamicLoadBalancedGateway()


def get_sms_gateway() -> DynamicLoadBalancedGateway:
    """Retrieve the active load balanced SMS Gateway client."""
    return _gateway_instance
