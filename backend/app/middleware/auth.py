from fastapi import Request
from jose import JWTError, jwt
from starlette.websockets import WebSocket

from app.config import settings


async def ws_auth(websocket: WebSocket) -> dict | None:
    """Authenticate WebSocket via cookie. Returns user dict or None."""
    access_token = websocket.cookies.get("access_token")
    if not access_token:
        return None
    try:
        payload = jwt.decode(
            access_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return {"id": user_id, "role": payload.get("role")}
