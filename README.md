# Olivia Platform

Reusable multi-site AI assistant, channel manager and owner dashboard.

The first implementation serves Suites Mine hospitality workflows with OpenAI and Cloudbeds. The target platform supports multiple client websites, skins, knowledge bases, operator inboxes and business integrations.

## Documentation

Start with [docs/README.md](./docs/README.md).

## Current Routes

- Inbox UI: `/inbox`
- Olivia API: `/api/olivia/chat`

## Local Setup

```bash
npm install
npm run dev
```

Keep secrets in `.env.local`. Do not commit them.

## Historical Files

The repository still contains earlier Botpress and Cloudbeds workflow files for reference. New platform work should follow the architecture documented in `docs/`.
