from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:password@localhost:5432/otaska"
    jwt_secret: str = "change_in_production"
    jwt_expires_days: int = 7
    anthropic_api_key: str = ""
    mutask_api_gpt: str = ""
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    client_url: str = "http://localhost:5173"
    port: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()

PLATFORM_COMMISSION = 0.12
TRUST_FEE = 0.05
AI_ESTIMATE_PDF_PRICE = 4.99
