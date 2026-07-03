create extension if not exists pgcrypto;

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  client_code text not null,
  visitor_id text not null,
  visitor_name text,
  email text,
  phone text,
  status text not null default 'ai' check (status in ('ai', 'manual', 'solved')),
  source text not null default 'website',
  language text not null default 'es',
  metadata jsonb not null default '{}'::jsonb,
  assigned_operator_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_code, visitor_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('visitor', 'ai', 'operator', 'system')),
  content text not null,
  model text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversations_client_updated_idx
  on conversations (client_code, updated_at desc);

create index if not exists messages_conversation_created_idx
  on messages (conversation_id, created_at asc);

create table if not exists oauth_connections (
  id uuid primary key default gen_random_uuid(), client_code text not null, provider text not null,
  account_id text, account_email text, access_token text not null, refresh_token text,
  expires_at timestamptz, scopes text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (client_code, provider)
);
