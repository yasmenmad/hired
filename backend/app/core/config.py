import logging
from pydantic_settings import BaseSettings
from functools import lru_cache

log = logging.getLogger(__name__)


class Settings(BaseSettings):
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    secret_key: str = "hired-secret-key-2024"
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    database_url: str = "sqlite+aiosqlite:///./hired.db"
    scrape_interval: int = 3600
    max_jobs_per_source: int = 200
    rapidapi_key: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
