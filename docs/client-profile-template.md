# Olivia Client Profile Template

Create one profile for every website using Olivia.

## Identity

```yaml
clientCode: example
name: Example Company
industry: hospitality
siteUrl: https://example.com
ownerUsers: []
languages:
  - es
  - en
roleLabelByLanguage:
  es: Olivia IA Concierge
  en: Olivia AI Concierge
```

## Skin

```yaml
skin:
  logoUrl: /logos/example.svg
  accent: "#3159c9"
  soft: "#eaf0ff"
  operator: "#1f2a44"
  widgetPosition: bottom-right
  welcomeMessageByLanguage:
    es: Hola, soy Olivia IA Concierge. Como puedo ayudarle?
    en: Hello, I am Olivia AI Concierge. How can I help?
```

## Business Knowledge

Provide:

- business description;
- contact details;
- address and service areas;
- opening hours;
- products or services;
- prices or pricing rules;
- delivery, booking or appointment rules;
- payment methods;
- cancellation and refund rules;
- common questions and approved answers;
- escalation rules;
- forbidden claims;
- legal and privacy texts by locale.

## Owner Dashboard Fields

Choose the fields useful to this business.

```yaml
dashboard:
  leadFields:
    - fullName
    - email
    - phone
  businessFields:
    - intent
    - budget
    - preferredProduct
    - requestedDate
  metrics:
    - conversations
    - leads
    - manualTakeovers
    - conversionEvents
    - topQuestions
    - unansweredQuestions
```

## Integrations

```yaml
integrations:
  crm:
    enabled: false
    provider: pulse
  booking:
    enabled: false
    provider: cloudbeds
  payment:
    enabled: false
    provider: stripe
  email:
    enabled: false
    provider: resend
  huggingFaceDashboard:
    enabled: false
```

Store integration secrets only in server-side environment variables or a secure secret manager.

## Consent

```yaml
consent:
  enabled: true
  jurisdiction: MX
  version: "2026-06-01"
  textByLanguage:
    es: ""
    en: ""
```

## Onboarding Checklist

- Create unique `clientCode`.
- Validate skin colors and logo.
- Validate role labels in every language.
- Import approved FAQ content.
- Configure owner users and roles.
- Select dashboard fields and metrics.
- Configure integrations.
- Add consent text.
- Test widget in Preview.
- Test inbox routing and manual takeover.
- Test owner dashboard scope.
- Approve production deployment explicitly.
