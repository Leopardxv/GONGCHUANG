import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import docker
from docker.errors import NotFound
from docker.models.containers import Container
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.events.event_bus import event_bus
from app.modules.terminal.model import DockerInstance
from app.modules.terminal.repository import (
    DockerInstanceRepository,
    TerminalLogRepository,
)

logger = logging.getLogger(__name__)

_docker_client: docker.DockerClient | None = None


def _get_docker_client() -> docker.DockerClient:
    """Create Docker client lazily, with a Colima socket fallback for macOS dev."""
    global _docker_client
    if _docker_client is not None:
        return _docker_client

    docker_host = os.environ.get("DOCKER_HOST")
    if not docker_host:
        colima_socket = Path.home() / ".colima" / "default" / "docker.sock"
        if colima_socket.exists():
            docker_host = f"unix://{colima_socket}"

    _docker_client = docker.DockerClient(base_url=docker_host) if docker_host else docker.from_env()
    _docker_client.ping()
    return _docker_client

# Module-level task set to keep background AI tasks alive
_bg_tasks: set[asyncio.Task] = set()


class TerminalService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.instance_repo = DockerInstanceRepository(db)
        self.log_repo = TerminalLogRepository(db)

    def _container_name(self, user_id: str) -> str:
        return f"ll-student-{user_id[:12]}"

    def _volume_name(self, user_id: str) -> str:
        return f"{settings.DOCKER_VOLUME_PREFIX}{user_id[:12]}"

    def _ensure_network(self) -> None:
        client = _get_docker_client()
        network_name = settings.DOCKER_NETWORK
        try:
            client.networks.get(network_name)
        except NotFound:
            logger.info("Creating Docker network %s", network_name)
            client.networks.create(name=network_name, driver="bridge")

    async def ensure_container(self, user_id: str) -> tuple[str, str]:
        """Ensure a Docker container exists and is running for the user.

        Returns (container_id, container_name).
        """
        uid = uuid.UUID(user_id)
        container_name = self._container_name(user_id)
        client = _get_docker_client()

        container = None
        try:
            container = client.containers.get(container_name)
        except NotFound:
            pass

        if container is not None:
            if container.status != "running":
                container.start()
            await self.instance_repo.upsert(uid, container.id, container_name)
            return container.id, container_name

        return await self._create_container(uid, container_name)

    async def _create_container(
        self, user_id: uuid.UUID, container_name: str
    ) -> tuple[str, str]:
        """Create and start a new Docker container for the user."""
        uid_str = str(user_id)
        volume_name = self._volume_name(uid_str)
        client = _get_docker_client()

        self._ensure_network()

        # Remove any stale container with the same name
        try:
            old = client.containers.get(container_name)
            old.remove(force=True)
            logger.info("Removed stale container %s", container_name)
        except NotFound:
            pass

        # Ensure volume exists
        try:
            client.volumes.get(volume_name)
        except NotFound:
            client.volumes.create(name=volume_name)

        container: Container = client.containers.run(
            image=settings.DOCKER_IMAGE,
            name=container_name,
            hostname="linux-lab",
            detach=True,
            tty=True,
            stdin_open=True,
            network=settings.DOCKER_NETWORK,
            mem_limit=settings.DOCKER_MEMORY_LIMIT,
            nano_cpus=int(settings.DOCKER_CPU_LIMIT * 1e9),
            pids_limit=settings.DOCKER_PIDS_LIMIT,
            security_opt=["no-new-privileges"],
            cap_drop=["ALL"],
            cap_add=["CHOWN", "DAC_OVERRIDE", "SETUID", "SETGID"],
            volumes={volume_name: {"bind": "/home/student", "mode": "rw"}},
            command="sleep infinity",
        )

        try:
            await self.instance_repo.upsert(
                user_id=user_id,
                container_id=container.id,
                container_name=container_name,
            )
        except Exception:
            try:
                container.remove(force=True)
            except Exception:
                pass
            raise

        logger.info("Created container %s for user %s", container.id, uid_str)
        return container.id, container_name

    async def create_exec_session(self, container_id: str) -> dict:
        """Create a persistent interactive exec session (bash) in the container."""
        container = _get_docker_client().containers.get(container_id)
        exec_result = container.client.api.exec_create(
            container_id,
            cmd="bash",
            stdin=True,
            stdout=True,
            stderr=True,
            tty=True,
            environment={"TERM": "xterm-256color"},
            workdir="/home/student",
            user="student",
        )
        exec_id = exec_result["Id"]

        # Start the exec with socket for bidirectional streaming
        sock = container.client.api.exec_start(
            exec_id, socket=True, tty=True
        )
        # Demux=False because tty=True merges stdout/stderr
        return {"exec_id": exec_id, "socket": sock}

    def resize_terminal(self, container_id: str, exec_id: str, cols: int, rows: int) -> None:
        """Resize the exec session PTY."""
        container = _get_docker_client().containers.get(container_id)
        container.client.api.exec_resize(exec_id, height=rows, width=cols)

    async def log_command(
        self,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        command: str,
        stdout: str = "",
        stderr: str = "",
        exit_code: int | None = None,
        cwd: str = "/home/student",
    ) -> None:
        await self.log_repo.create(
            user_id=user_id,
            session_id=session_id,
            command=command,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            cwd=cwd,
        )

    async def emit_command_executed(
        self,
        user_id: str,
        command: str,
        stdout: str,
        stderr: str,
        exit_code: int | None,
        cwd: str,
    ) -> None:
        """Publish command_executed event for AI analysis (non-blocking)."""
        task = asyncio.create_task(
            event_bus.publish(
                "command_executed",
                {
                    "user_id": user_id,
                    "command": command,
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": exit_code,
                    "cwd": cwd,
                },
            )
        )
        _bg_tasks.add(task)
        task.add_done_callback(_bg_tasks.discard)

    async def stop_container(self, user_id: uuid.UUID) -> None:
        instance = await self.instance_repo.get_by_user_id(user_id)
        if not instance:
            return
        try:
            container = _get_docker_client().containers.get(instance.container_id)
            container.stop(timeout=5)
        except NotFound:
            pass
        await self.instance_repo.update_status(instance.id, "stopped")
