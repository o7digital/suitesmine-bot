import crypto from "node:crypto";
import { saveOAuthConnection } from "@/lib/oauth-connections";

export const runtime = "nodejs";
const sign = (value) => crypto.createHmac("sha256", process.env.CLERK_SECRET_KEY).update(value).digest("base64url");

export async function GET(request) {
  const url = new URL(request.url);
  const [payload, signature] = (url.searchParams.get("state") || "").split(".");
  if (!payload || !signature || signature !== sign(payload)) return Response.json({ error: "Invalid OAuth state" }, { status: 400 });
  const state = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (state.expires < Date.now()) return Response.json({ error: "Expired OAuth state" }, { status: 400 });
  const code = url.searchParams.get("code");
  if (!code) return Response.redirect(`${url.origin}/inbox?client=${encodeURIComponent(state.clientCode)}&gmail=cancelled`);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: process.env.GOOGLE_REDIRECT_URI, grant_type: "authorization_code" }) });
  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok) return Response.json({ error: tokens.error_description || tokens.error }, { status: 502 });
  const profileResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  const profile = await profileResponse.json();
  if (!profileResponse.ok) return Response.json({ error: profile.error?.message || "Unable to read Gmail profile" }, { status: 502 });
  await saveOAuthConnection({ clientCode: state.clientCode, provider: "gmail", accountId: profile.emailAddress, accountEmail: profile.emailAddress, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000), scopes: tokens.scope, metadata: { historyId: profile.historyId, messagesTotal: profile.messagesTotal } });
  return Response.redirect(`${url.origin}/inbox?client=${encodeURIComponent(state.clientCode)}&gmail=connected`);
}
