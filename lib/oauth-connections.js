import { query } from "@/lib/db";

export async function ensureOAuthConnectionsTable() {
  await query(`create table if not exists oauth_connections (
    id uuid primary key default gen_random_uuid(), client_code text not null, provider text not null,
    account_id text, account_email text, access_token text not null, refresh_token text,
    expires_at timestamptz, scopes text, metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
    unique (client_code, provider)
  )`);
}

export async function getOAuthConnection(clientCode, provider) {
  await ensureOAuthConnectionsTable();
  const result = await query(
    "select client_code, provider, account_id, account_email, expires_at, scopes, metadata from oauth_connections where client_code = $1 and provider = $2",
    [clientCode, provider]
  );
  return result.rows[0] || null;
}

export async function saveOAuthConnection(connection) {
  await ensureOAuthConnectionsTable();
  await query(
    `insert into oauth_connections (client_code, provider, account_id, account_email, access_token, refresh_token, expires_at, scopes, metadata)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     on conflict (client_code, provider) do update set account_id=excluded.account_id, account_email=excluded.account_email,
     access_token=excluded.access_token, refresh_token=coalesce(excluded.refresh_token, oauth_connections.refresh_token),
     expires_at=excluded.expires_at, scopes=excluded.scopes, metadata=excluded.metadata, updated_at=now()`,
    [connection.clientCode, connection.provider, connection.accountId, connection.accountEmail, connection.accessToken, connection.refreshToken, connection.expiresAt, connection.scopes, connection.metadata || {}]
  );
}
