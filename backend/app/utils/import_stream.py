import asyncio
from typing import Dict

# Shared registry mapping client import_ids (str) to asyncio.Queue message buffers.
import_queues: Dict[str, asyncio.Queue] = {}
