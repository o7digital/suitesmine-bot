import { auth } from "@clerk/nextjs/server";
import { isDatabaseConfigured } from "@/lib/db";
import { listConversations } from "@/lib/conversations";

export const runtime = "nodejs";

export async function GET(request) {
  const { userId } = await auth();
  console.log("[olivia-inbox] GET /api/conversations auth", {
    hasUser: Boolean(userId),
  });
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured()) {
    console.log("[olivia-inbox] GET /api/conversations database not configured");
    return Response.json({ conversations: [], configured: false });
  }

  const clientCode = new URL(request.url).searchParams.get("clientCode") || "";
  const conversations = await listConversations(clientCode);
  console.log("[olivia-inbox] GET /api/conversations result", {
    clientCode: clientCode || "all",
    count: conversations.length,
    firstId: conversations[0]?.id || null,
  });
  return Response.json({ conversations, configured: true });
}
