from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.modules.auth.schema import (
    LoginRequest,
    RegisterRequest,
    UserResponse,
    UserStatsResponse,
)
from app.modules.auth.service import AuthService, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

COOKIE_KEY = "access_token"


def _cookie_policy(request: Request) -> tuple[bool, str]:
    host = request.headers.get("host", "")
    origin = request.headers.get("origin", "")
    forwarded_proto = request.headers.get("x-forwarded-proto", "")

    is_local = host.startswith(("localhost:", "127.0.0.1:")) or origin.startswith(
        ("http://localhost:", "http://127.0.0.1:")
    )
    is_https_public = (
        forwarded_proto == "https"
        or origin.startswith("https://")
        or "trycloudflare.com" in host
    )

    if is_local and not is_https_public:
        return False, "lax"
    if is_https_public:
        return True, "none"
    return settings.COOKIE_SECURE, settings.COOKIE_SAMESITE


def _set_cookie(request: Request, response: Response, token: str) -> None:
    secure, samesite = _cookie_policy(request)
    response.set_cookie(
        key=COOKIE_KEY,
        value=token,
        max_age=settings.JWT_EXPIRE_SECONDS,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path="/",
    )


def _clear_cookie(request: Request, response: Response) -> None:
    secure, samesite = _cookie_policy(request)
    response.delete_cookie(key=COOKIE_KEY, path="/", secure=secure, samesite=samesite)


@router.post("/register", status_code=201, response_model=UserResponse)
async def register(req: RegisterRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    user = await svc.register(req)
    token = create_access_token(user.id, user.role)
    _set_cookie(request, response, token)
    return user


@router.post("/login", response_model=UserResponse)
async def login(req: LoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    user = await svc.login(req)
    token = create_access_token(user.id, user.role)
    _set_cookie(request, response, token)
    return user


@router.post("/logout", status_code=204)
async def logout(request: Request, response: Response):
    _clear_cookie(request, response)


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    return await svc.get_me(user["id"])


@router.get("/stats", response_model=UserStatsResponse)
async def get_stats(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    return await svc.get_stats(user["id"])
