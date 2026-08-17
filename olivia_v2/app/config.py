import json
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    app_name: str = "Olivia AI v2"
    environment: str = Field(default="development", alias="NODE_ENV")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-5.6-luna", alias="OPENAI_MODEL")
    openai_model_fast: str = Field(default="gpt-5.6-luna", alias="OPENAI_MODEL_FAST")
    openai_model_balanced: str = Field(default="gpt-5.6-terra", alias="OPENAI_MODEL_BALANCED")
    openai_model_powerful: str = Field(default="gpt-5.6-sol", alias="OPENAI_MODEL_POWERFUL")
    openai_vector_stores_json: str = Field(default="{}", alias="OPENAI_VECTOR_STORES_JSON")
    web_search_enabled: bool = Field(default=True, alias="OLIVIA_WEB_SEARCH_ENABLED")
    max_tool_rounds: int = Field(default=3, alias="OLIVIA_MAX_TOOL_ROUNDS")
    demo_mode: bool = Field(default=True, alias="OLIVIA_DEMO_MODE")
    internal_token: str | None = Field(default=None, alias="OLIVIA_INTERNAL_TOKEN")

    cloudbeds_api_key: str | None = Field(default=None, alias="CLOUDBEDS_API_KEY")
    cloudbeds_access_token: str | None = Field(default=None, alias="CLOUDBEDS_ACCESS_TOKEN")
    cloudbeds_property_id: str = Field(default="319424", alias="CLOUDBEDS_PROPERTY_ID")
    cloudbeds_api_base: str = Field(
        default="https://api.cloudbeds.com/api/v1.2",
        alias="CLOUDBEDS_API_BASE",
    )

    def vector_store_for(self, client_code: str) -> str | None:
        try:
            stores = json.loads(self.openai_vector_stores_json)
        except (TypeError, ValueError):
            return None
        value = stores.get(client_code) if isinstance(stores, dict) else None
        return value.strip() if isinstance(value, str) and value.strip() else None


@lru_cache
def get_settings() -> Settings:
    return Settings()
