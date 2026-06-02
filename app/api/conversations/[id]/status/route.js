import { auth } from "@clerk/nextjs/server";
import { addMessage, updateConversationStatus } from "@/lib/conversations";

export const runtime = "nodejs";

const allowedStatuses = new Set(["ai", "manual", "solved"]);

export async function POST(request, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  if (!allowedStatuses.has(payload.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const conversation = await updateConversationStatus({
    id: params.id,
    status: payload.status,
    operatorId: userId,
  });
  if (!conversation) return Response.json({ error: "Conversation not found" }, { status: 404 });

  const content = {
    ai: "AI replies enabled.",
    manual: "Manual takeover enabled. AI replies are paused.",
    solved: "Conversation marked as solved.",
  }[payload.status];

  await addMessage({ conversationId: conversation.id, role: "system", content });
  return Response.json({ conversation });
}
