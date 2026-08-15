import hashlib
import json
import logging
from dataclasses import dataclass, field

from openai import AsyncOpenAI
from olivia_v2.app.clients import ClientProfile
from olivia_v2.app.config import Settings
from olivia_v2.app.routing import build_agent_plan
from olivia_v2.app.schemas import ChatRequest
from olivia_v2.app.tools import FUNCTION_TOOLS, ToolContext, execute_tool

logger = logging.getLogger(__name__)


@dataclass
class AgentResult:
    text: str | None
    model: str | None = None
    tier: str | None = None
    tools_used: list[str] = field(default_factory=list)
    sources: list[dict[str, str]] = field(default_factory=list)


class OpenAIService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = AsyncOpenAI(api_key=settings.openai_api_key, max_retries=2, timeout=30.0) if settings.openai_api_key else None

    @staticmethod
    def _user_content(request: ChatRequest, user: str) -> list[dict]:
        content: list[dict] = [{"type": "input_text", "text": user}]
        for attachment in request.attachments:
            if attachment.mimeType.startswith("image/"):
                content.append({"type": "input_image", "image_url": attachment.dataUrl, "detail": "auto"})
            elif attachment.mimeType == "application/pdf":
                content.append({"type": "input_file", "filename": attachment.name, "file_data": attachment.dataUrl})
        return content

    @staticmethod
    def _extract_sources(response) -> list[dict[str, str]]:
        payload = response.model_dump() if hasattr(response, "model_dump") else {}
        found: dict[str, dict[str, str]] = {}

        def visit(value):
            if isinstance(value, dict):
                url = value.get("url")
                if isinstance(url, str) and url.startswith("http"):
                    found[url] = {"title": value.get("title") or url, "url": url}
                for nested in value.values():
                    visit(nested)
            elif isinstance(value, list):
                for nested in value:
                    visit(nested)

        visit(payload.get("output", []))
        return list(found.values())[:8]

    async def generate(self, system: str, user: str, request: ChatRequest, client_profile: ClientProfile, rates: list[dict] | None = None) -> AgentResult:
        if not self.client:
            return AgentResult(None)

        vector_store_id = self.settings.vector_store_for(client_profile.code)
        plan = build_agent_plan(request, self.settings, vector_store_id)
        input_items: list[dict] = [
            {"role": "system", "content": system},
            *[{"role": message.role, "content": message.content} for message in request.history[-12:]],
            {"role": "user", "content": self._user_content(request, user)},
        ]
        tools: list[dict] = [*FUNCTION_TOOLS]
        include: list[str] = []
        if plan.use_files and vector_store_id:
            tools.append({"type": "file_search", "vector_store_ids": [vector_store_id], "max_num_results": 5})
            include.append("file_search_call.results")
        if plan.use_web and client_profile.site_domains:
            tools.append({"type": "web_search", "filters": {"allowed_domains": list(client_profile.site_domains)}})
            include.append("web_search_call.action.sources")

        options = {"model": plan.model, "input": input_items, "tools": tools, "reasoning": {"effort": plan.reasoning_effort}, "max_output_tokens": 700}
        if include:
            options["include"] = include
        if request.visitorId:
            options["safety_identifier"] = hashlib.sha256(request.visitorId.encode()).hexdigest()[:32]

        used: list[str] = []
        try:
            response = await self.client.responses.create(**options)
            for _ in range(max(1, self.settings.max_tool_rounds)):
                calls = [item for item in response.output if getattr(item, "type", None) == "function_call"]
                if not calls:
                    break
                outputs = []
                for call in calls:
                    used.append(call.name)
                    result = await execute_tool(call.name, call.arguments, ToolContext(rates or [], client_profile.code))
                    outputs.append({"type": "function_call_output", "call_id": call.call_id, "output": json.dumps(result)})
                response = await self.client.responses.create(
                    model=plan.model, previous_response_id=response.id, input=outputs, tools=tools,
                    reasoning={"effort": plan.reasoning_effort}, max_output_tokens=700,
                    **({"include": include} if include else {}),
                )
            output_types = {getattr(item, "type", "") for item in response.output}
            if "web_search_call" in output_types:
                used.append("web_search")
            if "file_search_call" in output_types:
                used.append("file_search")
            return AgentResult(getattr(response, "output_text", None), plan.model, plan.tier, list(dict.fromkeys(used)), self._extract_sources(response))
        except Exception as error:
            logger.warning("OpenAI agent failed: %s", error)
            return AgentResult(None, plan.model, plan.tier, used)
