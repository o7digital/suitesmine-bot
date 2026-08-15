#!/usr/bin/env python3
"""Run routing checks offline, and response checks against a running Olivia API with --url."""
import argparse
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from olivia_v2.app.config import Settings
from olivia_v2.app.routing import build_agent_plan
from olivia_v2.app.schemas import ChatRequest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", help="Example: http://localhost:8000/chat")
    args = parser.parse_args()
    cases = json.loads(Path("evals/cases.json").read_text())
    failures = []
    for case in cases:
        attachments = []
        if case.get("hasAttachment"):
            attachments = [{"name": "test.pdf", "mimeType": "application/pdf", "dataUrl": "data:application/pdf;base64,JVBERi0xLjQ="}]
        request = ChatRequest(clientCode=case["clientCode"], message=case["message"], attachments=attachments)
        if case.get("expectedTier"):
            tier = build_agent_plan(request, Settings(_env_file=None), None).tier
            if tier != case["expectedTier"]:
                failures.append(f"{case['id']}: tier={tier}")
        if args.url:
            body = json.dumps(request.model_dump()).encode()
            response = urllib.request.urlopen(urllib.request.Request(args.url, data=body, headers={"Content-Type": "application/json"})).read()
            reply = json.loads(response).get("reply", "").casefold()
            if any(word.casefold() not in reply for word in case.get("mustContain", [])):
                failures.append(f"{case['id']}: missing required text")
            choices = case.get("mustContainAny", [])
            if choices and not any(word.casefold() in reply for word in choices):
                failures.append(f"{case['id']}: missing safety/validation language")
            if any(word.casefold() in reply for word in case.get("mustNotContain", [])):
                failures.append(f"{case['id']}: forbidden text")
    if failures:
        raise SystemExit("\n".join(failures))
    print(f"OK: {len(cases)} evaluation cases")


if __name__ == "__main__":
    main()
