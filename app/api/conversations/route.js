import { auth } from "@clerk/nextjs/server";
import { isDatabaseConfigured } from "@/lib/db";
import { listConversations } from "@/lib/conversations";

export const runtime = "nodejs";

export async function GET(request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured()) {
    return Response.json({ conversations: [], configured: false });
  }

  const clientCode = new URL(request.url).searchParams.get("clientCode") || "";
  const conversations = await listConversations(clientCode);
  return Response.json({ conversations, configured: true });
}
