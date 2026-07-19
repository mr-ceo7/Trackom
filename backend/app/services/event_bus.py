"""Async in-memory Event Bus for Server-Sent Events (SSE)."""

import asyncio
import logging
from typing import Dict, Set

logger = logging.getLogger("trackom.event_bus")

class EventBus:
    def __init__(self):
        self.listeners: Dict[str, Set[asyncio.Queue]] = {}

    def subscribe(self, user_id: str) -> asyncio.Queue:
        user_id_str = str(user_id)
        queue = asyncio.Queue()
        if user_id_str not in self.listeners:
            self.listeners[user_id_str] = set()
        self.listeners[user_id_str].add(queue)
        logger.info(f"User {user_id_str} subscribed to real-time events. Active listener queues: {len(self.listeners[user_id_str])}")
        return queue

    def unsubscribe(self, user_id: str, queue: asyncio.Queue):
        user_id_str = str(user_id)
        if user_id_str in self.listeners:
            self.listeners[user_id_str].discard(queue)
            if not self.listeners[user_id_str]:
                del self.listeners[user_id_str]
        logger.info(f"User {user_id_str} unsubscribed from real-time events.")

    def publish(self, user_id: str, event_type: str, data: dict):
        user_id_str = str(user_id)
        if user_id_str in self.listeners:
            payload = {"type": event_type, "data": data}
            logger.info(f"Publishing event '{event_type}' to user {user_id_str}")
            for queue in self.listeners[user_id_str]:
                queue.put_nowait(payload)

event_bus = EventBus()
