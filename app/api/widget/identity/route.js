import { clients } from "@/config/clients";
import { clientCodeForSiteHost, issueWidgetIdentity, requestSiteHost } from "@/lib/client-identity.mjs";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function GET(request) {
  const host = requestSiteHost(request);
  const clientCode = clientCodeForSiteHost(host, clients);
  if (!clientCode) return Response.json({ error: "Site is not registered for Olivia" }, { status: 403, headers: CORS_HEADERS });
  try {
    return Response.json({ clientCode, identity: issueWidgetIdentity(clientCode, host, clients) }, { headers: CORS_HEADERS });
  } catch {
    return Response.json({ error: "Widget identity is not configured" }, { status: 503, headers: CORS_HEADERS });
  }
}
