import json
import logging
import uuid
from pathlib import Path

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.modules.ai.repository import AIAnalysisRepository
from app.modules.ai.schema import ChatRequest, ChatResponse, CommandAnalysisRequest, CommandAnalysisResponse
from app.modules.ai.textbook_search import get_textbook_context

logger = logging.getLogger(__name__)

# In-memory cache: (command, has_stderr, exit_code) → CommandAnalysisResponse
# Avoids repeated DeepSeek calls for the same command/error pattern
_analysis_cache: dict[tuple[str, bool, int], CommandAnalysisResponse] = {}
CACHE_MAX_SIZE = 200

# Lazy-initialized client
_client: AsyncOpenAI | None = None
_prompt_template: str | None = None


def _cache_key(command: str, stderr: str, exit_code: int | None) -> tuple[str, bool, int]:
    return (command.strip(), bool(stderr and stderr.strip()), exit_code or 0)


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        # Strip proxy env vars so httpx doesn't try to use SOCKS proxy
        import os

        safe_env: dict[str, str] = {}
        for k, v in os.environ.items():
            if "proxy" not in k.lower():
                safe_env[k] = v
        # Ensure NO_PROXY covers DeepSeek
        safe_env["no_proxy"] = safe_env.get("no_proxy", "") + ",api.deepseek.com"
        safe_env["NO_PROXY"] = safe_env.get("NO_PROXY", "") + ",api.deepseek.com"

        # Temporarily swap env for httpx client creation
        orig = dict(os.environ)
        os.environ.clear()
        os.environ.update(safe_env)
        try:
            _client = AsyncOpenAI(
                api_key=settings.AI_API_KEY,
                base_url=settings.AI_BASE_URL,
            )
        finally:
            os.environ.clear()
            os.environ.update(orig)
    return _client


def _load_prompt() -> str:
    global _prompt_template
    if _prompt_template is None:
        prompt_path = Path(__file__).parent.parent.parent.parent / "prompts" / "command_analysis.prompt"
        _prompt_template = prompt_path.read_text(encoding="utf-8")
    return _prompt_template


def _build_prompt(req: CommandAnalysisRequest) -> str:
    template = _load_prompt()
    return template.format(
        cwd=req.cwd,
        command=req.command,
        stdout=req.stdout or "(empty)",
        stderr=req.stderr or "(empty)",
        exit_code=req.exit_code if req.exit_code is not None else "unknown",
        context="\n".join(f"  $ {c}" for c in req.context) if req.context else "(no history)",
    )


def _parse_response(text: str) -> dict:
    """Extract JSON from AI response, handling markdown code fences."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```) and last line (```)
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


class AIService:
    def __init__(self, db: AsyncSession | None) -> None:
        self.db = db
        self.repo = AIAnalysisRepository(db) if db is not None else None

    async def analyze(self, req: CommandAnalysisRequest) -> CommandAnalysisResponse:
        """Call DeepSeek API to analyze a command. Returns structured analysis."""
        if not settings.AI_API_KEY:
            return CommandAnalysisResponse(
                id=uuid.uuid4(),
                command_explanation=f"'{req.command}' — AI 分析暂不可用（API key 未配置）。",
                syntax_fix=None,
                error_reason=None,
                best_practice="请配置 AI_API_KEY 环境变量以启用 AI 分析。",
                learning_recommendation="",
                related_section_id=None,
            )

        # Check cache
        key = _cache_key(req.command, req.stderr, req.exit_code)
        if key in _analysis_cache:
            logger.info("AI cache hit: %s", req.command[:50])
            cached = _analysis_cache[key]
            # Return a copy with fresh ID
            return CommandAnalysisResponse(
                id=uuid.uuid4(),
                command_explanation=cached.command_explanation,
                syntax_fix=cached.syntax_fix,
                error_reason=cached.error_reason,
                best_practice=cached.best_practice,
                learning_recommendation=cached.learning_recommendation,
                related_section_id=cached.related_section_id,
            )

        client = _get_client()
        prompt = _build_prompt(req)

        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[
                {"role": "system", "content": "You are a Linux expert teacher. Always respond in JSON."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=settings.AI_MAX_TOKENS,
            temperature=settings.AI_TEMPERATURE,
        )

        content = response.choices[0].message.content or ""
        try:
            parsed = _parse_response(content)
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning("Failed to parse AI response: %s\nRaw: %s", e, content[:500])
            parsed = {
                "command_explanation": content[:200],
                "syntax_fix": None,
                "error_reason": None,
                "best_practice": "",
                "learning_recommendation": "",
                "related_section_id": None,
            }

        result = CommandAnalysisResponse(
            id=uuid.uuid4(),
            command_explanation=parsed.get("command_explanation", ""),
            syntax_fix=parsed.get("syntax_fix"),
            error_reason=parsed.get("error_reason"),
            best_practice=parsed.get("best_practice", ""),
            learning_recommendation=parsed.get("learning_recommendation", ""),
            related_section_id=parsed.get("related_section_id"),
        )

        # Store in cache, evict oldest if full
        if len(_analysis_cache) >= CACHE_MAX_SIZE:
            oldest = next(iter(_analysis_cache))
            del _analysis_cache[oldest]
        _analysis_cache[key] = result

        return result

    async def analyze_and_store(
        self,
        user_id: str,
        command: str,
        stdout: str = "",
        stderr: str = "",
        exit_code: int | None = None,
        cwd: str = "/home/student",
        context: list[str] | None = None,
    ) -> CommandAnalysisResponse:
        """Analyze a command and persist the result."""
        req = CommandAnalysisRequest(
            command=command,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            cwd=cwd,
            context=context or [],
        )
        result = await self.analyze(req)

        await self.repo.create(
            user_id=uuid.UUID(user_id),
            command=command,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            command_explanation=result.command_explanation,
            syntax_fix=result.syntax_fix,
            error_reason=result.error_reason,
            best_practice=result.best_practice,
            learning_recommendation=result.learning_recommendation,
            related_section_id=result.related_section_id,
        )

        return result

    async def chat(self, req: ChatRequest) -> ChatResponse:
        if not settings.AI_API_KEY:
            return ChatResponse(
                reply="AI chat is not available (API key not configured)."
            )

        client = _get_client()

        # Search textbook for relevant content
        textbook_context = get_textbook_context(req.message)

        system_prompt = (
            "You are a Linux expert tutor for university students. "
            "Your role is to teach Linux concepts, answer questions about Linux commands, "
            "shell scripting, system administration, and related topics. "
            "Use clear, concise Chinese with English technical terms where appropriate. "
            "When providing code examples, use markdown code blocks. "
            "Keep explanations beginner-friendly but technically accurate.\n\n"
            "你是大学 Linux 课程的智能导师。回答 Linux 相关问题，使用中文讲解，"
            "代码块用 markdown 格式。保持解释清晰、准确、适合学生水平。"
        )

        if textbook_context:
            system_prompt += "\n\n" + textbook_context

        messages: list[dict] = [
            {"role": "system", "content": system_prompt},
        ]

        for h in req.history:
            messages.append({"role": h.role, "content": h.content})

        messages.append({"role": "user", "content": req.message})

        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=messages,
            max_tokens=settings.AI_MAX_TOKENS,
            temperature=settings.AI_TEMPERATURE,
        )

        reply = response.choices[0].message.content or ""
        return ChatResponse(reply=reply)
