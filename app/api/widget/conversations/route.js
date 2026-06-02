import { isDatabaseConfigured } from "@/lib/db";
import { addMessage, upsertConversation } from "@/lib/conversations";

export const runtime = "nodejs";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Conversation storage is not configured" }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  const visitorId = clean(payload.visitorId);
  const content = clean(payload.content);
  if (!visitorId || !content) {
    return Response.json({ error: "visitorId and content are required" }, { status: 400 });
  }

  const conversation = await upsertConversation({
    clientCode: payload.clientCode,
    visitorId,
    visitorName: payload.visitorName,
    email: payload.email,
    phone: payload.phone,
    source: payload.source,
    language: payload.language,
    metadata: payload.metadata,
  });

  const message = await addMessage({
    conversationId: conversation.id,
    role: "visitor",
    content,
    metadata: payload.metadata,
  });

  return Response.json({ conversation, message });
}
