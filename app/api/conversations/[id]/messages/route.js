import { auth } from "@clerk/nextjs/server";
import { addMessage, findConversation } from "@/lib/conversations";
import { sendMetaReply } from "@/lib/meta-channels";
import { normalizeLanguage, translateOperatorReply } from "@/lib/operator-translation";

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
  const attachment = payload.attachment;
  const allowedAttachmentTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "text/plain",
  ]);
  const hasAttachment =
    attachment &&
    typeof attachment.name === "string" &&
    typeof attachment.type === "string" &&
    typeof attachment.dataUrl === "string" &&
    allowedAttachmentTypes.has(attachment.type) &&
    attachment.dataUrl.startsWith(`data:${attachment.type};base64,`);
  if (!payload.content?.trim() && !hasAttachment) {
    return Response.json({ error: "Missing content or attachment" }, { status: 400 });
  }
  if (hasAttachment && attachment.dataUrl.length > 3_000_000) {
    return Response.json({ error: "Attachment is too large" }, { status: 413 });
  }

  const originalContent = payload.content?.trim() || attachment.name;
  const targetLanguage = normalizeLanguage(
    payload.targetLanguage ||
      conversation.language ||
      conversation.metadata?.language ||
      conversation.metadata?.locale
  );
  const translation = hasAttachment
    ? { content: originalContent, translated: false, sourceLanguage: "es", targetLanguage }
    : await translateOperatorReply({
        content: originalContent,
        sourceLanguage: payload.sourceLanguage || "es",
        targetLanguage,
      }).catch((error) => ({
        content: originalContent,
        translated: false,
        sourceLanguage: normalizeLanguage(payload.sourceLanguage || "es") || "es",
        targetLanguage,
        reason: error?.message || "translation_failed",
      }));
  const content = translation.content || originalContent;
  const delivery = await sendMetaReply(conversation, content).catch((error) => ({
    skipped: false,
    ok: false,
    error: error?.message || "Meta delivery failed",
  }));

  const message = await addMessage({
    conversationId: conversation.id,
    role: "operator",
    content,
    metadata: {
      operatorId: userId,
      delivery,
      operatorOriginalContent: originalContent,
      operatorSourceLanguage: translation.sourceLanguage || normalizeLanguage(payload.sourceLanguage || "es") || "es",
      operatorTargetLanguage: translation.targetLanguage || targetLanguage || "",
      operatorTranslated: Boolean(translation.translated),
      ...(translation.reason ? { operatorTranslationReason: translation.reason } : {}),
      ...(hasAttachment ? { attachment } : {}),
    },
  });
  console.log("[olivia-inbox] POST /api/conversations/:id/messages created", {
    messageId: message?.id || null,
  });

  return Response.json({ message });
}
