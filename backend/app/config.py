from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_prefix": "LL_", "env_file": ".env", "extra": "ignore"}

    # Application
    APP_NAME: str = "Linux Learning System"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://lluser:llpass@localhost:5432/ll_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_SECONDS: int = 86400  # 24 hours

    # Docker
    DOCKER_IMAGE: str = "linux-student:latest"
    DOCKER_NETWORK: str = "ll-student-net"
    DOCKER_VOLUME_PREFIX: str = "ll-home-"
    DOCKER_MEMORY_LIMIT: str = "2g"
    DOCKER_CPU_LIMIT: float = 1.0
    DOCKER_PIDS_LIMIT: int = 100

    # AI (DeepSeek)
    AI_API_KEY: str = ""
    AI_BASE_URL: str = "https://api.deepseek.com"
    AI_MODEL: str = "deepseek-v4-pro"
    AI_MAX_TOKENS: int = 1024
    AI_TEMPERATURE: float = 0.3

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    CORS_ORIGIN_REGEX: str | None = r"https://.*\.trycloudflare\.com"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"


settings = Settings()
