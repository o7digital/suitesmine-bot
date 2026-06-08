from openai import AsyncOpenAI
from olivia_v2.app.config import Settings


class OpenAIService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    async def generate(self, system: str, user: str) -> str | None:
        if not self.client:
            return None

        response = await self.client.responses.create(
            model=self.settings.openai_model,
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,
            max_output_tokens=500,
        )
        return getattr(response, "output_text", None)

