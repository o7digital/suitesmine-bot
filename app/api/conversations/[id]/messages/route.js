import { auth } from "@clerk/nextjs/server";
import { addMessage, findConversation } from "@/lib/conversations";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const { userId } = await auth();
  console.log("[olivia-inbox] POST /api/conversations/:id/messages auth", {
    hasUser: Boolean(userId),
    conversationId: params.id,
  });
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const conversation = await findConversation(params.id);
  console.log("[olivia-inbox] POST /api/conversations/:id/messages conversation", {
    found: Boolean(conversation),
    status: conversation?.status || null,
  });
  if (!conversation) return Response.json({ error: "Conversation not found" }, { status: 404 });
  if (conversation.status !== "manual") {
    return Response.json({ error: "Manual takeover is required before replying" }, { status: 409 });
  }

  const payload = await request.json().catch(() => ({}));
  if (!payload.content?.trim()) return Response.json({ error: "Missing content" }, { status: 400 });

  const message = await addMessage({
    conversationId: conversation.id,
    role: "operator",
    content: payload.content,
    metadata: { operatorId: userId },
  });
  console.log("[olivia-inbox] POST /api/conversations/:id/messages created", {
    messageId: message?.id || null,
  });

  return Response.json({ message });
}
