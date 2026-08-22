import { clients } from "@/config/clients";
import { clientCodeForSiteHost, issueWidgetIdentity, requestSiteHost } from "@/lib/client-identity.mjs";

export const runtime = "nodejs";

export function GET(request) {
  const host = requestSiteHost(request);
  const clientCode = clientCodeForSiteHost(host, clients);
  if (!clientCode) return Response.json({ error: "Site is not registered for Olivia" }, { status: 403 });
  try {
    return Response.json({ clientCode, identity: issueWidgetIdentity(clientCode, host, clients) });
  } catch {
    return Response.json({ error: "Widget identity is not configured" }, { status: 503 });
  }
}