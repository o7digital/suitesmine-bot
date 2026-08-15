from dataclasses import dataclass

from olivia_v2.app.config import Settings
from olivia_v2.app.schemas import ChatRequest


@dataclass(frozen=True)
class AgentPlan:
    tier: str
    model: str
    reasoning_effort: str
    use_web: bool
    use_files: bool


CURRENT_WORDS = (
    "aujourd'hui", "actuel", "actualité", "dernière", "recent", "today", "current",
    "latest", "news", "ahora", "actual", "reciente", "precio de mercado",
)
COMPLEX_WORDS = (
    "compare", "analyse", "analyze", "estrategia", "strategy", "contrat", "contract",
    "legal", "fiscal", "medical", "médical", "financier", "financial", "plan détaillé",
)
POWERFUL_WORDS = (
    "urgence", "urgent", "diagnostic", "contre-indication", "contraindication",
    "litige", "lawsuit", "due diligence", "risque juridique", "legal risk",
)


def build_agent_plan(request: ChatRequest, settings: Settings, vector_store_id: str | None) -> AgentPlan:
    text = request.message.casefold()
    has_attachment = bool(request.attachments)
    wants_current = any(word in text for word in CURRENT_WORDS)
    is_complex = has_attachment or len(text) > 700 or any(word in text for word in COMPLEX_WORDS)
    is_sensitive = any(word in text for word in POWERFUL_WORDS)

    if is_sensitive:
        tier, model, effort = "powerful", settings.openai_model_powerful, "high"
    elif is_complex or wants_current:
        tier, model, effort = "balanced", settings.openai_model_balanced, "medium"
    else:
        tier, model, effort = "fast", settings.openai_model_fast, "low"

    return AgentPlan(
        tier=tier,
        model=model,
        reasoning_effort=effort,
        use_web=settings.web_search_enabled and wants_current,
        use_files=bool(vector_store_id),
    )
