import os
from pydantic_settings import BaseSettings

# On Vercel serverless, /tmp is the only writable directory
_default_db = "sqlite:////tmp/otaska.db" if os.environ.get("VERCEL") else "sqlite:///./otaska.db"


class Settings(BaseSettings):
    database_url: str = _default_db
    jwt_secret: str = "change_in_production"
    jwt_expires_days: int = 7
    anthropic_api_key: str = ""
    mutask_api_gpt: str = ""
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    client_url: str = "*"
    port: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()

# Fix Heroku/Railway postgres:// → postgresql://
if settings.database_url.startswith("postgres://"):
    settings.database_url = settings.database_url.replace("postgres://", "postgresql://", 1)

PLATFORM_COMMISSION = 0.12
TRUST_FEE = 0.05
AI_ESTIMATE_PDF_PRICE = 4.99
