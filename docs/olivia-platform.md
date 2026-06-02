# Olivia Multi-Site Platform

## Objective

Olivia is a reusable AI assistant for client websites. Each website receives:

- a branded widget;
- a client code;
- a business-specific knowledge base;
- a channel manager inbox;
- optional manual takeover;
- a dashboard for the website owner;
- integrations such as booking, CRM, email or payment.

The first hospitality implementation is Suites Mine. The same platform must also support commerce, automotive, services and other industries.

## Current State

### Implemented

- `/inbox` channel manager UI inspired by Tidio.
- Client skin selection using `clientCode`.
- Conversation status display: `AI`, `Manual`, `Solved`.
- Manual takeover button and return-to-AI button in the UI.
- Clerk provider initialization when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is configured.
- `/api/olivia/chat` endpoint.
- OpenAI responses for Suites Mine FAQ questions.
- Deterministic Suites Mine reservation intake.
- Cloudbeds rate lookup and booking URL generation.

### Prototype Only

- Inbox conversations are currently static objects in `app/inbox/page.js`.
- Manual takeover is currently local React state.
- Operator replies are not yet persisted or delivered to the website visitor.
- Client skins are currently hardcoded in `app/inbox/page.js`.
- Clerk is initialized but roles and tenant scopes are not yet enforced.
- CRM, consent tracking, reporting and owner dashboard data are not yet persisted.

## Target Architecture

```text
Client website widget
  -> Olivia public API
  -> Railway Postgres conversation store
  -> AI orchestrator
       -> client profile and FAQ
       -> OpenAI guest-facing response
       -> Hugging Face dashboard assistance
       -> business integrations
            -> Cloudbeds
            -> CRM Pulse
            -> email
            -> payment
  -> inbox websocket or polling stream
  -> owner dashboard
```

## Multi-Tenant Rule

Every request must include a `clientCode`.

Example:

```json
{
  "clientCode": "suitesmine",
  "source": "website",
  "language": "es",
  "message": "Busco una suite para dos personas",
  "pageUrl": "https://www.suitesmine.com/suites",
  "metadata": {
    "checkIn": "2026-06-15",
    "checkOut": "2026-06-18",
    "guests": "2"
  }
}
```

The backend must resolve configuration from `clientCode`. Never put API secrets inside the website widget.

The first configuration source is `config/clients.js`. Railway Postgres will become the persistent source when the onboarding editor is implemented.

## Required Persistent Data

### Client

- `id`
- `clientCode`
- `name`
- `industry`
- `siteUrl`
- `skin`
- `languages`
- `roleLabelByLanguage`
- `knowledgeBase`
- `integrations`
- `ownerUsers`

### Conversation

- `id`
- `clientCode`
- `visitorId`
- `status`: `ai`, `manual`, `solved`
- `assignedOperatorId`
- `source`
- `language`
- `lastViewedPage`
- `createdAt`
- `updatedAt`

### Message

- `id`
- `conversationId`
- `role`: `visitor`, `ai`, `operator`, `system`
- `content`
- `createdAt`
- `model`
- `metadata`

### Visitor Profile

- contact details;
- consent status and consent version;
- preferences;
- business-specific fields;
- CRM sync status.

## Inbox and Manual Takeover

When a visitor sends a widget message:

1. Persist the visitor message.
2. Check conversation status.
3. If status is `ai`, generate and persist an AI answer.
4. If status is `manual`, notify the operator and do not generate an AI answer.
5. Stream or poll new messages back to the widget.

When an operator clicks `Prendre la main`:

1. Set status to `manual`.
2. Persist a system event.
3. Pause AI replies for that conversation.
4. Deliver operator replies to the website widget.

When an operator clicks `Rendre a l'IA`:

1. Set status to `ai`.
2. Persist a system event.
3. Allow Olivia to answer the next visitor message.

## Railway Postgres

Railway Postgres is the persistent store for the multi-site channel manager. It must store client profiles, Clerk tenant mappings, conversations, messages, visitor profiles, consent records and OAuth refresh tokens.

Railway exposes a Postgres connection string. Configure it server-side in the local environment and in the Vercel Preview environment:

```env
DATABASE_URL=
```

Do not expose `DATABASE_URL` in widgets or browser code.

## Owner Dashboard

Each website owner needs a dashboard filtered by their `clientCode`. Admin users can access all clients.

### Owner Overview

- conversations today, week and month;
- AI resolution rate;
- manual takeover rate;
- response time;
- leads collected;
- conversion events;
- top visitor intents;
- unanswered questions;
- languages used;
- popular pages before contact;
- satisfaction score when available.

### Business Information

The dashboard must show business-specific information defined by the client profile.

For Suites Mine:

- requested dates;
- guest count;
- room category;
- Cloudbeds availability result;
- booking URL sent;
- reservation or payment status when integrated.

For CUSI Flores:

- occasion;
- delivery date;
- delivery area;
- budget;
- flower or arrangement preference;
- lead status;
- WhatsApp or checkout handoff status.

## Hugging Face Role

Hugging Face should assist the dashboard user. It is not required to replace the guest-facing OpenAI flow immediately.

### Recommended First Features

1. Conversation summary for operators.
2. Intent classification.
3. Sentiment and urgency classification.
4. Suggested tags.
5. Suggested operator reply.
6. FAQ gap detection: identify recurring questions without a reliable answer.
7. Weekly owner report summary.

### Recommended Boundary

```text
Guest-facing response:
  OpenAI + deterministic business flows

Dashboard assistance:
  Hugging Face inference endpoint or dedicated server-side model
```

Hugging Face tokens must stay server-side. Do not expose them in widgets or browser code.

### Suggested Environment Variables

```env
HF_TOKEN=
# Accepted alias:
HUGGING_FACE_TOKEN=
HF_DASHBOARD_MODEL=openai/gpt-oss-20b:fastest
```

The exact model must be selected after testing Spanish, English and French conversations. Model selection should be based on quality, latency and cost, not only popularity.

The first server-side endpoint is:

```text
POST /api/dashboard/analyze
```

It returns an operator-oriented analysis: summary, intent, sentiment, urgency, tags, suggested reply and missing information.

## Mailbox Connector

The mailbox must belong to the client whenever possible. For Suites Mine, use a Suites Mine inbox rather than a personal o7 mailbox. Gmail must be connected through OAuth; never store a mailbox password.

Required variables:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

The mailbox connector still needs Railway Postgres before OAuth refresh tokens and imported emails can be stored safely.

## Google Analytics 4

Olivia needs two GA4 layers:

1. Website tracking with `gtag` or Google Tag Manager on every client website.
2. Dashboard reporting with the GA4 Data API so owners can see visits, pages, sources and conversion events.

Required dashboard variables:

```env
GA4_PROPERTY_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
```

The service account must have read access to the relevant GA4 property.

## Integration Status

Use this endpoint to see which server-side integrations are configured:

```text
GET /api/integrations/status
```

## Authentication and Permissions

Clerk should enforce these roles:

- `platform_admin`: all clients and configuration.
- `client_owner`: dashboard and inbox for assigned clients.
- `operator`: inbox and manual replies for assigned clients.
- `viewer`: read-only reports.

Every server-side query must filter by the Clerk user tenant scope. Hiding another client in the UI is not sufficient.

The first protected routes are:

```text
/inbox
/api/dashboard/*
/api/integrations/*
```

The public widget endpoint remains accessible without a Clerk session:

```text
/api/olivia/chat
```

## Privacy and CRM

Before storing personal information for CRM use:

1. Show the applicable privacy consent text.
2. Store acceptance timestamp, locale, consent version and source.
3. Store only permitted fields.
4. Sync allowed fields to CRM Pulse.
5. Support access, correction and deletion requests.

Legal text must be configurable by client and jurisdiction.

## Delivery Plan

### V1: Channel Manager

- persistent conversations;
- widget message delivery;
- operator replies;
- manual takeover;
- Clerk tenant scopes.

### V2: Owner Dashboard and Hugging Face

- owner metrics;
- business-specific profile fields;
- conversation summaries;
- intents, tags and FAQ gaps;
- weekly report.

### V3: Integrations

- CRM Pulse;
- consent tracking;
- email;
- payment;
- business integrations such as Cloudbeds.

### V4: Client Onboarding

- move hardcoded skins into persistent client profiles;
- admin editor for skin and knowledge base;
- reusable widget embed;
- per-client analytics and integrations.

## Deployment Safety

- Work on `dev`.
- Use Vercel Preview deployments for validation.
- Do not use `vercel deploy --prod` unless production deployment is explicitly requested.
- Keep secrets in Vercel environment variables and local `.env.local`, never in Git.
