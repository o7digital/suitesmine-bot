from typing import Any, Literal
from pydantic import BaseModel, Field


Language = Literal["es", "en", "fr", "auto"]
Intent = Literal["availability", "pricing", "booking", "faq", "handoff", "lead"]
ConversationPhase = Literal[
    "greeting",
    "qualification",
    "availability_check",
    "booking_intake",
    "payment_handoff",
    "human_handoff",
    "answer",
]


class ChatMetadata(BaseModel):
    checkIn: str | None = None
    checkOut: str | None = None
    guests: str | int | None = None
    roomType: str | None = None
    pageUrl: str | None = None
    pageTitle: str | None = None
    pageContent: str | None = None
    bookingDraft: dict[str, Any] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    clientCode: str | None = None
    clientId: str | None = None
    visitorId: str | None = None
    language: Language | None = None
    message: str
    source: str = "website"
    metadata: ChatMetadata = Field(default_factory=ChatMetadata)


class CollectedFields(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    checkIn: str | None = None
    checkOut: str | None = None
    guests: str | None = None
    roomType: str | None = None


class OliviaResponse(BaseModel):
    reply: str
    clientCode: str
    language: Language
    intent: Intent
    phase: ConversationPhase
    nextAction: str
    handoffRecommended: bool = False
    collected: CollectedFields = Field(default_factory=CollectedFields)
    missingFields: list[str] = Field(default_factory=list)
    bookingUrl: str | None = None
    rates: list[dict[str, Any]] = Field(default_factory=list)
    mode: str = "olivia-v2"
