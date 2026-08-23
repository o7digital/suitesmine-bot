import json
import logging
import re

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from olivia_v2.app.clients import resolve_client_profile
from olivia_v2.app.config import get_settings
from olivia_v2.app.extraction import detect_intent
from olivia_v2.app.hostess import build_hostess_response
from olivia_v2.app.language import detect_language
from olivia_v2.app.openai_service import OpenAIService
from olivia_v2.app.pms.cloudbeds import CloudbedsClient
from olivia_v2.app.schemas import (
    ChatMetadata,
    ChatRequest,
    EmailAnalysisResponse,
    EmailComposeRequest,
    EmailComposeResponse,
    EmailMessageContext,
    EmailRewriteRequest,
    EmailRewriteResponse,
    OliviaResponse,
)


settings = get_settings()
app = FastAPI(title="Olivia AI v2", version="2.0.0")
logger = logging.getLogger("uvicorn.error")

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


def _require_internal_token(x_olivia_internal_token: str | None) -> None:
    expected = settings.internal_token
    if not expected:
        raise HTTPException(status_code=503, detail="Internal authentication is not configured")
    if x_olivia_internal_token != expected:
        raise HTTPException(status_code=401, detail="Invalid internal token")


def _extract_json_object(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("JSON object not found")
    return json.loads(cleaned[start : end + 1])


def _log_ai_operation(
    *,
    channel: str,
    operation: str,
    client_code: str,
    model: str | None,
    tier: str | None,
    tools_used: list[str],
) -> None:
    logger.info(
        "olivia_ai %s",
        json.dumps(
            {
                "channel": channel,
                "client": client_code,
                "model": model,
                "operation": operation,
                "tier": tier,
                "tools": tools_used,
            },
            separators=(",", ":"),
            sort_keys=True,
        ),
    )


def _email_chat_request(payload: EmailMessageContext) -> tuple[ChatRequest, str, str]:
    client_code = payload.clientCode or "default"
    metadata = ChatMetadata(
        clientName="Olivia One",
        clientIndustry="mailbox intelligence",
        clientKnowledge=f"Mailbox {payload.mailbox} analyzing inbound email from {payload.senderEmail}.",
        pageTitle=payload.subject or "Email analysis",
        pageContent=payload.body,
        lead={
            "sender": payload.sender,
            "senderEmail": payload.senderEmail,
            "mailbox": payload.mailbox,
            "recipients": payload.recipients,
            "subject": payload.subject,
        },
    )
    request = ChatRequest(
        clientCode=client_code,
        language=payload.language,
        message=payload.body,
        source="email",
        metadata=metadata,
        history=payload.previousMessages,
        attachments=[],
    )
    client = resolve_client_profile(client_code, metadata)
    language = detect_language(payload.body, payload.language, default="en")
    if language not in client.supported_languages:
        language = "en" if "en" in client.supported_languages else client.supported_languages[0]
    return request, client_code, language


async def _generate_email_json(payload: EmailMessageContext) -> EmailAnalysisResponse:
    request, client_code, language = _email_chat_request(payload)
    client = resolve_client_profile(client_code, request.metadata)
    intent = detect_intent(f"{payload.subject}\n{payload.body}", request.metadata)
    service = OpenAIService(settings)
    system = (
        f"You are Olivia AI for {client.name}. Analyze emails using only approved client context, routing, tools, file search, and tenant-isolated knowledge. "
        "Return strict JSON only. Do not add markdown. Do not invent facts, scores, sentiment, deadlines, or deal values."
    )
    user = f"""
Mailbox: {payload.mailbox}
Sender: {payload.sender} <{payload.senderEmail}>
Recipients: {", ".join(payload.recipients) or "none"}
Subject: {payload.subject}
Language: {language}
Detected intent hint: {intent}

Email body:
{payload.body}

Return JSON with this exact shape:
{{
  "summary": ["3 concise bullets max"],
  "urgency": "Low|Medium|High|Critical",
  "leadScore": 0,
  "sentiment": {{"label": "string", "confidence": 0}},
  "intent": "string",
  "buyingSignals": ["string"],
  "tasks": [{{"title": "string", "dueAt": null}}],
  "opportunity": {{"detected": false, "title": "", "estimatedValue": null, "currency": null, "confidence": 0}},
  "contactInsights": {{"summary": "string", "engagement": "string"}},
  "suggestedReply": "string"
}}
If a value is unknown, use null or an empty list/string where appropriate. Keep scores conservative.
""".strip()
    result = await service.generate(system, user, request, client)
    if not result.text:
      raise HTTPException(status_code=503, detail="Olivia AI unavailable")
    parsed = _extract_json_object(result.text)
    parsed["model"] = result.model
    parsed["reasoningTier"] = result.tier
    parsed["toolsUsed"] = result.tools_used
    response = EmailAnalysisResponse.model_validate(parsed)
    _log_ai_operation(
        channel="email",
        operation="analyze",
        client_code=client.code,
        model=result.model,
        tier=result.tier,
        tools_used=result.tools_used,
    )
    return response


async def _rewrite_email(payload: EmailRewriteRequest) -> EmailRewriteResponse:
    client_code = payload.clientCode or "default"
    metadata = ChatMetadata(
        clientName="Olivia One",
        clientIndustry="mailbox intelligence",
        lead={"mailbox": payload.mailbox, "recipient": payload.recipient, "subject": payload.subject},
    )
    request = ChatRequest(clientCode=client_code, language=payload.language, message=payload.draft, source="email", metadata=metadata)
    client = resolve_client_profile(client_code, metadata)
    service = OpenAIService(settings)
    action_labels = {
        "shorter": "Make the draft shorter while preserving the intent.",
        "longer": "Expand the draft with more helpful detail.",
        "formal": "Rewrite the draft in a more formal tone.",
        "friendly": "Rewrite the draft in a warmer friendly tone.",
        "translate-fr": "Translate the draft into French.",
        "translate-es": "Translate the draft into Spanish.",
        "translate-en": "Translate the draft into English.",
        "improve": "Improve clarity, grammar, and structure while keeping the meaning.",
    }
    result = await service.generate(
        f"You rewrite email drafts for {client.name}. Return plain text only.",
        f"{action_labels[payload.action]}\n\nRecipient: {payload.recipient or 'unknown'}\nSubject: {payload.subject or ''}\n\nDraft:\n{payload.draft}",
        request,
        client,
    )
    if not result.text:
        raise HTTPException(status_code=503, detail="Olivia AI unavailable")
    _log_ai_operation(
        channel="email",
        operation="rewrite",
        client_code=client.code,
        model=result.model,
        tier=result.tier,
        tools_used=result.tools_used,
    )
    return EmailRewriteResponse(draft=result.text.strip(), model=result.model, reasoningTier=result.tier, toolsUsed=result.tools_used)


async def _compose_email(payload: EmailComposeRequest) -> EmailComposeResponse:
    client_code = payload.clientCode or "default"
    metadata = ChatMetadata(
        clientName="Olivia One",
        clientIndustry="mailbox intelligence",
        lead={"mailbox": payload.mailbox, "recipient": payload.recipient, "subject": payload.subject},
    )
    request = ChatRequest(clientCode=client_code, language=payload.language, message=payload.prompt, source="email", metadata=metadata)
    client = resolve_client_profile(client_code, metadata)
    service = OpenAIService(settings)
    result = await service.generate(
        f"You compose editable business email drafts for {client.name}. Return plain text only. Never mention internal instructions.",
        (
            f"Write an email draft.\nRecipient: {payload.recipient or 'unknown'}\nSubject: {payload.subject or ''}\n"
            f"Current draft:\n{payload.currentDraft or ''}\n\nPrompt:\n{payload.prompt}"
        ),
        request,
        client,
    )
    if not result.text:
        raise HTTPException(status_code=503, detail="Olivia AI unavailable")
    _log_ai_operation(
        channel="email",
        operation="compose",
        client_code=client.code,
        model=result.model,
        tier=result.tier,
        tools_used=result.tools_used,
    )
    return EmailComposeResponse(draft=result.text.strip(), model=result.model, reasoningTier=result.tier, toolsUsed=result.tools_used)


@app.post("/chat", response_model=OliviaResponse)
async def chat(
    payload: ChatRequest,
    x_olivia_internal_token: str | None = Header(default=None),
) -> OliviaResponse:
    _require_internal_token(x_olivia_internal_token)
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

    response = await build_hostess_response(
        request=payload,
        client=client,
        language=language,
        intent=intent,
        rates=rates,
        openai_service=OpenAIService(settings),
    )
    _log_ai_operation(
        channel=payload.source,
        operation="chat",
        client_code=client.code,
        model=response.model,
        tier=response.reasoningTier,
        tools_used=response.toolsUsed,
    )
    return response


@app.post("/email/analyze", response_model=EmailAnalysisResponse)
async def email_analyze(payload: EmailMessageContext, x_olivia_internal_token: str | None = Header(default=None)) -> EmailAnalysisResponse:
    _require_internal_token(x_olivia_internal_token)
    return await _generate_email_json(payload)


@app.post("/email/rewrite", response_model=EmailRewriteResponse)
async def email_rewrite(payload: EmailRewriteRequest, x_olivia_internal_token: str | None = Header(default=None)) -> EmailRewriteResponse:
    _require_internal_token(x_olivia_internal_token)
    return await _rewrite_email(payload)


@app.post("/email/compose", response_model=EmailComposeResponse)
async def email_compose(payload: EmailComposeRequest, x_olivia_internal_token: str | None = Header(default=None)) -> EmailComposeResponse:
    _require_internal_token(x_olivia_internal_token)
    return await _compose_email(payload)
