"""Environment-driven configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql://placeholder/placeholder"
    sentry_dsn: str | None = None
    request_delay_seconds: float = 7.0
    user_agent: str = "FutureRally Bot / contact: editor@futurerally.example"
    request_timeout_seconds: float = 30.0


def load_settings() -> Settings:
    return Settings()
