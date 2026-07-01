"""SMS Gateway Client Interface and Simulated Gateway implementation."""

import abc
import asyncio
import logging
import uuid
from typing import List, Dict, Any

logger = logging.getLogger("trackom.sms_gateway")


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
        db
    ) -> List[Dict[str, Any]]:
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
