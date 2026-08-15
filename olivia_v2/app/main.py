from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from olivia_v2.app.clients import resolve_client_profile
from olivia_v2.app.config import get_settings
from olivia_v2.app.extraction import detect_intent
from olivia_v2.app.hostess import build_hostess_response
from olivia_v2.app.language import detect_language
from olivia_v2.app.openai_service import OpenAIService
from olivia_v2.app.pms.cloudbeds import CloudbedsClient
from olivia_v2.app.schemas import ChatRequest, OliviaResponse


settings = get_settings()
app = FastAPI(title="Olivia AI v2", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {
        "ok": True,
        "service": settings.app_name,
        "demoMode": settings.demo_mode,
    }


@app.post("/chat", response_model=OliviaResponse)
async def chat(payload: ChatRequest) -> OliviaResponse:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    client_code = payload.clientCode or payload.clientId or "default"
    client = resolve_client_profile(client_code, payload.metadata)
    language = detect_language(message, payload.language)
    if language not in client.supported_languages:
        language = "en" if "en" in client.supported_languages else client.supported_languages[0]
    intent = detect_intent(message, payload.metadata)

    pms = CloudbedsClient(settings)
    rates = []
    if client.integrations.get("booking") == "cloudbeds":
        rates = await pms.get_rates(payload.metadata.checkIn, payload.metadata.checkOut)

    return await build_hostess_response(
        request=payload,
        client=client,
        language=language,
        intent=intent,
        rates=rates,
        openai_service=OpenAIService(settings),
    )
