from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    app_name: str = "Olivia AI v2"
    environment: str = Field(default="development", alias="NODE_ENV")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    demo_mode: bool = Field(default=True, alias="OLIVIA_DEMO_MODE")

    cloudbeds_api_key: str | None = Field(default=None, alias="CLOUDBEDS_API_KEY")
    cloudbeds_access_token: str | None = Field(default=None, alias="CLOUDBEDS_ACCESS_TOKEN")
    cloudbeds_property_id: str = Field(default="319424", alias="CLOUDBEDS_PROPERTY_ID")
    cloudbeds_api_base: str = Field(
        default="https://api.cloudbeds.com/api/v1.2",
        alias="CLOUDBEDS_API_BASE",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

