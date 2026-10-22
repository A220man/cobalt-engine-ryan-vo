from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    secret_key: str = "change-me-in-production"

    # Database
    database_url: str = "sqlite:///./data/cobalt.db"

    # LLM Configuration
    llm_api_key: str = ""
    llm_provider: str = "openai-compatible"
    llm_model: str = "gpt-4o-mini"
    llm_base_url: str = "https://api.openai.com/v1"

    # Keycloak/OIDC
    keycloak_url: str = "http://localhost:8080"
    keycloak_realm: str = "cobalt"
    keycloak_client_id: str = "cobalt-engine"
    keycloak_client_secret: str = ""
    keycloak_admin_user: str = "admin"
    keycloak_admin_password: str = "admin"

    # Demo mode (LOCALHOST ONLY)
    demo_mode: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()