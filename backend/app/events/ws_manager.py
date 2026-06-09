import logging
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)

# Callback type: receives a JSON-serializable message
PushHandler = Callable[[dict[str, Any]], Awaitable[None]]


class WSConnectionManager:
    """Tracks active WebSocket connections per user for push messages."""

    def __init__(self) -> None:
        self._connections: dict[str, PushHandler] = {}

    def register(self, user_id: str, send: PushHandler) -> None:
        self._connections[user_id] = send

    def unregister(self, user_id: str) -> None:
        self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, message: dict[str, Any]) -> bool:
        handler = self._connections.get(user_id)
        if handler is None:
            return False
        try:
            await handler(message)
            return True
        except Exception:
            logger.exception("Failed to send WS message to user %s", user_id)
            return False


ws_manager = WSConnectionManager()
