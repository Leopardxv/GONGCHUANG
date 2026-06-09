from fastapi import APIRouter, Depends, Response
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
COOKIE_KWARGS: dict = {
    "httponly": True,
    "secure": False,  # True in production (HTTPS)
    "samesite": "lax",
    "path": "/",
}


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_KEY,
        value=token,
        max_age=settings.JWT_EXPIRE_SECONDS,
        **COOKIE_KWARGS,
    )


def _clear_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_KEY, path="/")


@router.post("/register", status_code=201, response_model=UserResponse)
async def register(req: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    user = await svc.register(req)
    token = create_access_token(user.id, user.role)
    _set_cookie(response, token)
    return user


@router.post("/login", response_model=UserResponse)
async def login(req: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    user = await svc.login(req)
    token = create_access_token(user.id, user.role)
    _set_cookie(response, token)
    return user


@router.post("/logout", status_code=204)
async def logout(response: Response):
    _clear_cookie(response)


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    return await svc.get_me(user["id"])


@router.get("/stats", response_model=UserStatsResponse)
async def get_stats(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    return await svc.get_stats(user["id"])
