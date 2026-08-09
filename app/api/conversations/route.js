import { currentUser } from "@clerk/nextjs/server";
import { canAccessClient, normalizeClientCode } from "@/config/adminAccess";
import { clients } from "@/config/clients";
import { isDatabaseConfigured } from "@/lib/db";
import { listConversations } from "@/lib/conversations";

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
  const email = user?.primaryEmailAddress?.emailAddress || "";
  if (clientCode && !canAccessClient(email, clientCode, Object.keys(clients))) {
    return Response.json({ error: "Forbidden client", conversations: [], configured: true }, { status: 403, headers: noStoreHeaders });
  }
  const conversations = await listConversations(clientCode);
  console.log("[olivia-inbox] GET /api/conversations result", {
    clientCode: clientCode || "all",
    count: conversations.length,
    firstId: conversations[0]?.id || null,
  });
  return Response.json({ conversations, configured: true }, { headers: noStoreHeaders });
}
