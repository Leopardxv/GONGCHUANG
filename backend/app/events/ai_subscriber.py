import json
import logging

from app.database import async_session
from app.events.event_bus import event_bus
from app.events.ws_manager import ws_manager
from app.modules.ai.schema import CommandAnalysisRequest
from app.modules.ai.service import AIService
# Ensure all models are loaded so FK references resolve
from app.modules.auth.model import User  # noqa: F401

logger = logging.getLogger(__name__)


async def handle_command_executed(data: dict) -> None:
    """Handle command_executed event: analyze via AI, store result, push to user."""
    user_id = data.get("user_id", "")
    command = data.get("command", "")
    if not command.strip():
        return

    async with async_session() as db:
        svc = AIService(db)
        try:
            result = await svc.analyze_and_store(
                user_id=user_id,
                command=data.get("command", ""),
                stdout=data.get("stdout", ""),
                stderr=data.get("stderr", ""),
                exit_code=data.get("exit_code"),
                cwd=data.get("cwd", "/home/student"),
            )
        except Exception:
            logger.exception("AI analysis failed for user=%s command=%s", user_id, command)
            return

    # Push result to user's WebSocket
    await ws_manager.send_to_user(
        user_id,
        {
            "type": "ai_analysis",
            "analysis": result.model_dump(mode="json"),
        },
    )


def register_ai_subscriber() -> None:
    event_bus.subscribe("command_executed", handle_command_executed)
    logger.info("AI subscriber registered for command_executed events")
