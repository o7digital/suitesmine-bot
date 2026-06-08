# Olivia Platform

Reusable multi-site AI assistant, channel manager and owner dashboard.

The first implementation serves Suites Mine hospitality workflows with OpenAI and Cloudbeds. The target platform supports multiple client websites, skins, knowledge bases, operator inboxes and business integrations.

## Documentation

Start with [docs/README.md](./docs/README.md).

Olivia v2 Python engine: [docs/olivia-v2-python.md](./docs/olivia-v2-python.md).

## Current Routes

- Inbox UI: `/inbox`
- Olivia API: `/api/olivia/chat`
- Olivia v2 Python API: `GET /health`, `POST /chat` when deployed with `Dockerfile.python`

## Local Setup

```bash
npm install
npm run dev
```

Keep secrets in `.env.local`. Do not commit them.

## Python v2

The Python engine lives in `olivia_v2/`. It is intended to run as a separate Railway service while this Next.js app continues to serve the widget and inbox.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn olivia_v2.app.main:app --reload --port 8000
```

## Historical Files

The repository still contains earlier Botpress and Cloudbeds workflow files for reference. New platform work should follow the architecture documented in `docs/`.
