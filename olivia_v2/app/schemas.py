from typing import Any, Literal
from pydantic import BaseModel, Field


Language = Literal["es", "en", "fr", "it", "de", "ru", "auto"]
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


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatAttachment(BaseModel):
    name: str = Field(min_length=1, max_length=180)
    mimeType: Literal["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
    dataUrl: str = Field(min_length=20, max_length=14_000_000)


class ChatMetadata(BaseModel):
    checkIn: str | None = None
    checkOut: str | None = None
    guests: str | int | None = None
    roomType: str | None = None
    pageUrl: str | None = None
    pageTitle: str | None = None
    pageContent: str | None = None
    bookingDraft: dict[str, Any] = Field(default_factory=dict)
    lead: dict[str, Any] = Field(default_factory=dict)
    handoffStage: str | None = None
    clientName: str | None = None
    clientIndustry: str | None = None
    clientKnowledge: str | None = Field(default=None, max_length=20000)
    clientSiteUrl: str | None = None


class ChatRequest(BaseModel):
    clientCode: str | None = None
    clientId: str | None = None
    visitorId: str | None = None
    language: Language | None = None
    message: str
    source: str = "website"
    metadata: ChatMetadata = Field(default_factory=ChatMetadata)
    history: list[ConversationMessage] = Field(default_factory=list, max_length=20)
    attachments: list[ChatAttachment] = Field(default_factory=list, max_length=3)


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
    action: str | None = None
    leadForm: dict[str, Any] | None = None
    mode: str = "olivia-v2"
    model: str | None = None
    reasoningTier: Literal["fast", "balanced", "powerful"] | None = None
    toolsUsed: list[str] = Field(default_factory=list)
    sources: list[dict[str, str]] = Field(default_factory=list)


class EmailMessageContext(BaseModel):
    clientCode: str | None = None
    mailbox: str = Field(min_length=3, max_length=320)
    sender: str = Field(min_length=1, max_length=320)
    senderEmail: str = Field(min_length=3, max_length=320)
    recipients: list[str] = Field(default_factory=list, max_length=32)
    subject: str = Field(default="", max_length=998)
    body: str = Field(min_length=1, max_length=40000)
    previousMessages: list[ConversationMessage] = Field(default_factory=list, max_length=20)
    language: Language | None = None


class EmailSentiment(BaseModel):
    label: str
    confidence: float = Field(ge=0, le=1)


class EmailTask(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    dueAt: str | None = None


class EmailOpportunity(BaseModel):
    detected: bool
    title: str = ""
    estimatedValue: float | None = None
    currency: str | None = None
    confidence: float = Field(ge=0, le=1)


class EmailContactInsights(BaseModel):
    summary: str
    engagement: str


class EmailAnalysisResponse(BaseModel):
    summary: list[str] = Field(default_factory=list)
    urgency: Literal["Low", "Medium", "High", "Critical"]
    leadScore: float = Field(ge=0, le=100)
    sentiment: EmailSentiment
    intent: str
    buyingSignals: list[str] = Field(default_factory=list)
    tasks: list[EmailTask] = Field(default_factory=list)
    opportunity: EmailOpportunity
    contactInsights: EmailContactInsights
    suggestedReply: str
    model: str | None = None
    reasoningTier: Literal["fast", "balanced", "powerful"] | None = None
    toolsUsed: list[str] = Field(default_factory=list)


class EmailRewriteRequest(BaseModel):
    clientCode: str | None = None
    action: Literal["shorter", "longer", "formal", "friendly", "translate-fr", "translate-es", "translate-en", "improve"]
    draft: str = Field(min_length=1, max_length=20000)
    mailbox: str | None = Field(default=None, max_length=320)
    recipient: str | None = Field(default=None, max_length=320)
    subject: str | None = Field(default=None, max_length=998)
    language: Language | None = None


class EmailRewriteResponse(BaseModel):
    draft: str
    model: str | None = None
    reasoningTier: Literal["fast", "balanced", "powerful"] | None = None
    toolsUsed: list[str] = Field(default_factory=list)


class EmailComposeRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=20000)
    recipient: str | None = Field(default=None, max_length=320)
    subject: str | None = Field(default=None, max_length=998)
    currentDraft: str | None = Field(default=None, max_length=20000)
    clientCode: str | None = None
    mailbox: str | None = Field(default=None, max_length=320)
    language: Language | None = None


class EmailComposeResponse(BaseModel):
    draft: str
    model: str | None = None
    reasoningTier: Literal["fast", "balanced", "powerful"] | None = None
    toolsUsed: list[str] = Field(default_factory=list)
