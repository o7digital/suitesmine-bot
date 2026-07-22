# Olivia AI chat backups

This project is the central source of truth for Olivia AI Channel Manager chat history.

## What is backed up

- `conversations`
- `messages`
- per-client metadata
- visitor name, email and phone when available
- message role, model, timestamps and metadata

## Manual backup

Set one of:

```bash
export DATABASE_PUBLIC_URL="postgres://..."
export DATABASE_URL="postgres://..."
```

Then run:

```bash
npm run backup:chats
```

Output:

```txt
backups/chat-history/YYYY-MM-DD/all/
  manifest.json
  chat-history.json
  conversations.csv
  messages.csv
  clients/
    jeanlouisdavid.json
    cusi.json
    vialterna.json
```

Backup one client only:

```bash
npm run backup:chats -- --client jeanlouisdavid
```

Backup a date range:

```bash
npm run backup:chats -- --since 2026-07-01 --until 2026-07-31
```

## Admin API

Set in production:

```bash
BACKUP_ADMIN_TOKEN="a-long-random-secret"
```

Download JSON:

```bash
curl -H "x-backup-token: $BACKUP_ADMIN_TOKEN" \
  "https://olivia-ai.o7digital.com/api/admin/backups/chats?client=jeanlouisdavid"
```

Download CSV:

```bash
curl -H "x-backup-token: $BACKUP_ADMIN_TOKEN" \
  "https://olivia-ai.o7digital.com/api/admin/backups/chats?client=jeanlouisdavid&format=messages.csv"
```

Manifest only:

```bash
curl -H "x-backup-token: $BACKUP_ADMIN_TOKEN" \
  "https://olivia-ai.o7digital.com/api/admin/backups/chats?format=manifest"
```

## Required rule for all sites

Every chat widget, Formspree bridge, WhatsApp bridge, Instagram bridge or external bot must write to:

```txt
https://olivia-ai.o7digital.com/api/widget/conversations
```

If a site only calls a model endpoint and does not persist to `/api/widget/conversations`, that conversation cannot be guaranteed in backups.
