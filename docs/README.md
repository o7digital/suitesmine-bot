# Olivia Platform Documentation

This folder is the reference documentation for the reusable Olivia platform.

## Documents

- [Platform architecture](./olivia-platform.md): current state, target architecture, dashboard, inbox, manual takeover and Hugging Face integration.
- [Olivia v2 Python engine](./olivia-v2-python.md): FastAPI service, Railway deployment and Next.js proxy integration.
- [Client profile template](./client-profile-template.md): information required to onboard a website and create its skin, knowledge base and owner dashboard.

## Current URLs

- Suites Mine channel manager: `https://suitesmine-bot.vercel.app/inbox`
- Suites Mine chat API: `https://suitesmine-bot.vercel.app/api/olivia/chat`

## Naming

Olivia is a reusable assistant with a presentation adapted to each business:

- Generic product: `Olivia AI Assistant`
- Hospitality version: `Olivia IA Concierge` in Spanish, `Olivia AI Concierge` in English
- Other industries: a role label can be selected per client profile

## Important

The inbox is connected to the conversation API when Railway Postgres is configured. Some dashboard and owner-reporting features are still prototypes.
