import { isDatabaseConfigured } from "@/lib/db";
import { listConversations } from "@/lib/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json({ configured: false, count: 0, sample: [] });
  }

  const conversations = await listConversations();
  return Response.json({
    configured: true,
    count: conversations.length,
    sample: conversations.slice(0, 5).map((conversation) => ({
      id: conversation.id,
      clientCode: conversation.client_code,
      visitorId: conversation.visitor_id,
      status: conversation.status,
      messages: conversation.messages?.length || 0,
      updatedAt: conversation.updated_at,
    })),
  });
}
