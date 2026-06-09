import asyncio
import json
import logging
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.database import async_session
from app.events.ws_manager import ws_manager
from app.middleware.auth import ws_auth
from app.modules.terminal.service import TerminalService

logger = logging.getLogger(__name__)
router = APIRouter()

BUFFER_SIZE = 4096
# Dedicated thread pool for Docker socket I/O (blocking operations)
io_pool = ThreadPoolExecutor(max_workers=16, thread_name_prefix="docker-io")


def _make_msg(msg_type: str, **kwargs: Any) -> str:
    payload: dict = {"type": msg_type, **kwargs}
    return json.dumps(payload, ensure_ascii=False)


@router.websocket("/connect")
async def terminal_connect(ws: WebSocket):
    user = await ws_auth(ws)
    if not user:
        await ws.close(code=4001, reason="Not authenticated")
        return

    user_id = user["id"]
    session_id = uuid.uuid4()
    logger.info("Terminal WS connecting: user=%s session=%s", user_id, session_id)

    await ws.accept()

    # Ensure container and exec session exist
    async with async_session() as db:
        svc = TerminalService(db)
        try:
            container_id, container_name = await svc.ensure_container(user_id)
        except Exception as e:
            logger.exception("Failed to ensure container")
            await ws.send_text(_make_msg("error", message=str(e)))
            await ws.close(code=4002)
            return

        try:
            exec_session = await svc.create_exec_session(container_id)
        except Exception as e:
            logger.exception("Failed to create exec session")
            await ws.send_text(_make_msg("error", message=str(e)))
            await ws.close(code=4003)
            return

    sock = exec_session["socket"]
    exec_id = exec_session["exec_id"]
    loop = asyncio.get_event_loop()
    running = True

    await ws.send_text(
        _make_msg("session", status="connected", container_id=container_id, user=user_id)
    )

    # Register for AI push messages
    async def push_to_client(msg: dict) -> None:
        await ws.send_text(json.dumps(msg, ensure_ascii=False))

    ws_manager.register(user_id, push_to_client)

    # Use a queue to transfer data from the Docker reader thread to the asyncio task
    output_queue: asyncio.Queue = asyncio.Queue()

    def docker_reader() -> None:
        """Runs in a thread. Reads from Docker socket and pushes to queue."""
        while running:
            try:
                data = sock.read(BUFFER_SIZE)
                if data is None or (isinstance(data, bytes) and len(data) == 0):
                    break
                if isinstance(data, bytes):
                    text = data.decode("utf-8", errors="replace")
                else:
                    text = str(data)
                if text:
                    loop.call_soon_threadsafe(output_queue.put_nowait, text)
            except Exception:
                time.sleep(0.05)

    reader_future = loop.run_in_executor(io_pool, docker_reader)

    async def forward_output() -> None:
        """Reads from the queue and sends to WebSocket."""
        while running:
            try:
                text = await asyncio.wait_for(output_queue.get(), timeout=0.1)
                await ws.send_text(_make_msg("output", data=text))
            except asyncio.TimeoutError:
                continue
            except Exception:
                break

    forward_task = asyncio.create_task(forward_output())

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type", "")

            if msg_type == "input":
                data = msg.get("data", "")
                # SocketIO is read-only; use underlying _sock for writes
                await loop.run_in_executor(io_pool, sock._sock.send, data.encode("utf-8"))

            elif msg_type == "resize":
                try:
                    svc.resize_terminal(container_id, exec_id, msg["cols"], msg["rows"])
                except Exception:
                    pass

            elif msg_type == "command":
                command = msg.get("text", "")
                cwd = msg.get("cwd", "/home/student")
                if command.strip():
                    async with async_session() as db:
                        db_svc = TerminalService(db)
                        await db_svc.log_command(
                            user_id=uuid.UUID(user_id),
                            session_id=session_id,
                            command=command.strip(),
                            cwd=cwd,
                        )
                        await db_svc.emit_command_executed(
                            user_id=user_id,
                            command=command.strip(),
                            stdout="",
                            stderr="",
                            exit_code=None,
                            cwd=cwd,
                        )

            elif msg_type == "ping":
                await ws.send_text(_make_msg("pong"))

    except WebSocketDisconnect:
        logger.info("Terminal WS disconnected: user=%s session=%s", user_id, session_id)
    except Exception:
        logger.exception("Terminal WS error for user=%s", user_id)
    finally:
        running = False
        forward_task.cancel()
        ws_manager.unregister(user_id)
        try:
            sock.close()
        except Exception:
            pass
