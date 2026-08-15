import json
from dataclasses import dataclass
from typing import Any


@dataclass
class ToolContext:
    rates: list[dict[str, Any]]
    client_code: str


FUNCTION_TOOLS = [
    {
        "type": "function",
        "name": "check_business_availability",
        "description": "Read availability or rates already obtained from the client's connected booking system. Never invent availability.",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "recommend_human_handoff",
        "description": "Recommend a human follow-up for an unsupported, sensitive, urgent, or confirmation-dependent request.",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {"reason": {"type": "string"}},
            "required": ["reason"],
            "additionalProperties": False,
        },
    },
]


async def execute_tool(name: str, arguments: str, context: ToolContext) -> dict[str, Any]:
    try:
        args = json.loads(arguments or "{}")
    except ValueError:
        args = {}
    if name == "check_business_availability":
        return {"connected": bool(context.rates), "rates": context.rates}
    if name == "recommend_human_handoff":
        return {"recommended": True, "reason": args.get("reason", "manual validation required")}
    return {"error": "unknown_tool", "name": name}
