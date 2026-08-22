# Olivia AI v2 Python Engine

## Goal

Olivia v2 is a Python backend for a reusable AI hostess. It is designed to serve Suites Mine first, then other client businesses through client profiles.

Olivia is not only a chatbot. The engine returns operational state for the inbox:

- `intent`: what the visitor wants;
- `phase`: where the conversation is in the journey;
- `collected`: booking or lead fields already captured;
- `missingFields`: what Olivia still needs;
- `nextAction`: what the frontend or operator should do next;
- `handoffRecommended`: when a human should take over.

## Current Scope

Implemented in `olivia_v2/`:

- FastAPI app with `GET /health` and `POST /chat`;
- multi-client profile resolver;
- Suites Mine hospitality profile;
- language detection for Spanish, English, French, Italian, German and Russian;
- bounded multi-turn memory, restored from persisted conversations when available;
- answer-first lead qualification shared by every client profile;
- deterministic booking intake;
- Cloudbeds rate lookup with demo fallback;
- OpenAI Responses API for natural FAQ/hostess replies;
- automatic Luna/Terra/Sol routing according to complexity and sensitivity;
- isolated file search per client, controlled web search, business function calling;
- image/PDF input and browser voice dictation;
- offline and live evaluation scenarios;
- structured response for inbox and widget integration.

## Local Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn olivia_v2.app.main:app --reload --port 8000
```

Test:

```bash
curl -s http://localhost:8000/health
curl -s http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "clientCode": "suitesmine",
    "language": "es",
    "message": "Hola, quiero reservar una suite",
    "metadata": {
      "checkIn": "2026-06-16",
      "checkOut": "2026-06-19",
      "guests": "2"
    }
  }'
```

## Environment

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
OPENAI_MODEL_FAST=gpt-5.6-luna
OPENAI_MODEL_BALANCED=gpt-5.6-terra
OPENAI_MODEL_POWERFUL=gpt-5.6-sol
OPENAI_VECTOR_STORES_JSON={}
OLIVIA_INTERNAL_TOKEN=
OLIVIA_WEB_SEARCH_ENABLED=true
OLIVIA_MAX_TOOL_ROUNDS=3
OLIVIA_DEMO_MODE=true
CLOUDBEDS_API_KEY=
CLOUDBEDS_ACCESS_TOKEN=
CLOUDBEDS_PROPERTY_ID=319424
CLOUDBEDS_API_BASE=https://api.cloudbeds.com/api/v1.2
```

Use `OLIVIA_DEMO_MODE=true` until Cloudbeds availability/rate credentials are confirmed.

Permanent documents are placed in `knowledge/<clientCode>/` and synchronized with
`python scripts/sync_openai_knowledge.py <clientCode>`. Each client must use a separate
vector store. Synchronization creates and validates the replacement before atomically
switching the mapping and deleting the previous store. Use `--dry-run` to validate local
inputs without API calls and `--keep-old` to retain the previous store after a successful
switch. Run `python scripts/run_olivia_evals.py` for offline routing checks, or add
`--url http://localhost:8000/chat` to evaluate real responses.

## Railway Deployment

Recommended for the Python engine:

1. Create a new Railway service from this same GitHub repo.
2. Set the service root to the repository root.
3. Use `Dockerfile.python` as the Dockerfile.
4. Add the environment variables above.
5. Deploy and confirm `/health` returns `ok: true`.

This keeps the existing Next.js/Vercel inbox intact while Railway runs the Python Olivia engine.

## Next.js Integration Plan

The current widget calls:

```text
POST /api/olivia/chat
```

When the Python service is deployed, add this server-side variable to the Next/Vercel app:

```env
OLIVIA_V2_URL=https://your-railway-service.up.railway.app
OLIVIA_INTERNAL_TOKEN=
OLIVIA_WIDGET_SIGNING_SECRET=
```

`OLIVIA_INTERNAL_TOKEN` must have the same secret value in Next/Vercel and the Python
service. `OLIVIA_WIDGET_SIGNING_SECRET` stays only in Next/Vercel and signs short-lived
widget identities; neither value is exposed to browser code. Every configured client's
`siteUrl` must match the hostname serving that client's widget API. The server binds that
hostname to the approved `clientCode`, so browser JSON and page metadata cannot select a
different client profile, conversation, integration, web-search domain, or vector store.

Then `/api/olivia/chat` proxies to:

```text
POST ${OLIVIA_V2_URL}/chat
```

The JavaScript route keeps the current legacy behavior as fallback. If `OLIVIA_V2_URL` is empty, or if v2 fails, the existing route still answers.

## Product Direction

Suites Mine is the first implementation. The same engine can support other clients by adding profiles and business modules:

- hospitality: PMS, booking links, arrival instructions;
- services: lead qualification, quote intake, appointment handoff;
- commerce: product guidance, delivery details, order handoff;
- professional firms: qualification, compliance-safe answers, contact handoff.

The rule is: one Olivia engine, many client profiles, separated integrations.
