import { isDatabaseConfigured } from "@/lib/db";
import { addMessage, findVisitorConversation, upsertConversation } from "@/lib/conversations";

export const runtime = "nodejs";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request) {
  if (!isDatabaseConfigured()) return Response.json({ configured: false, messages: [] });
  const url = new URL(request.url);
  const clientCode = clean(url.searchParams.get("clientCode")) || "default";
  const visitorId = clean(url.searchParams.get("visitorId"));
  if (!visitorId) return Response.json({ error: "visitorId is required" }, { status: 400 });

  const conversation = await findVisitorConversation(clientCode, visitorId);
  return Response.json({
    configured: true,
    status: conversation?.status || "ai",
    messages: conversation?.messages || [],
  });
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

export async function PATCH(request) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Conversation storage is not configured" }, { status: 503 });
  const payload = await request.json().catch(() => ({}));
  const conversation = await findVisitorConversation(payload.clientCode, payload.visitorId);
  if (!conversation) return Response.json({ error: "Conversation not found" }, { status: 404 });
  if (conversation.status !== "ai") return Response.json({ skipped: true, status: conversation.status });

  const message = await addMessage({
    conversationId: conversation.id,
    role: "ai",
    content: payload.content,
    model: payload.model,
  });
  return Response.json({ message });
}
