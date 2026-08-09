import { currentUser } from "@clerk/nextjs/server";
import { canAccessClient, getAccessibleClientCodes, normalizeClientCode } from "@/config/adminAccess";
import { clients } from "@/config/clients";
import { isDatabaseConfigured } from "@/lib/db";
import { listConversations, listConversationsForClients } from "@/lib/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request) {
  if (!isDatabaseConfigured()) {
    console.log("[olivia-inbox] GET /api/conversations database not configured");
    return Response.json({ conversations: [], configured: false }, { headers: noStoreHeaders });
  }

  const clientCode = normalizeClientCode(new URL(request.url).searchParams.get("clientCode") || "");
  const user = await currentUser().catch(() => null);
  const availableClientCodes = Object.keys(clients).filter((code) => !["default", "demo"].includes(code));
  const accessibleClientCodes = getAccessibleClientCodes(user, availableClientCodes);
  if (clientCode && !canAccessClient(user, clientCode, Object.keys(clients))) {
    return Response.json({ error: "Forbidden client", conversations: [], configured: true }, { status: 403, headers: noStoreHeaders });
  }
  const conversations = clientCode
    ? await listConversations(clientCode)
    : await listConversationsForClients(accessibleClientCodes);
  console.log("[olivia-inbox] GET /api/conversations result", {
    clientCode: clientCode || accessibleClientCodes.join(",") || "none",
    count: conversations.length,
    firstId: conversations[0]?.id || null,
  });
  return Response.json({ conversations, configured: true }, { headers: noStoreHeaders });
}
