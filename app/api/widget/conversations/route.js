import { isDatabaseConfigured } from "@/lib/db";
import { clients } from "@/config/clients";
import { resolveRequestClient } from "@/lib/client-identity.mjs";
import { addMessage, findVisitorConversation, upsertConversation } from "@/lib/conversations";
import { translateVisitorMessageForOperator } from "@/lib/operator-translation";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Olivia-Widget-Identity",
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function extractContactDetails(text = "", metadata = {}) {
  const source = `${text}\n${metadata?.name || ""}\n${metadata?.firstName || ""} ${metadata?.lastName || ""}\n${metadata?.email || ""}\n${metadata?.phone || ""}`;
  const email = clean(metadata?.email) || source.match(/[^\s@]+@[^\s@]+\.[^\s@,.;]+/)?.[0] || "";
  const phone = clean(metadata?.phone) || source.match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0] || "";
  const explicitName = clean(metadata?.name) || [clean(metadata?.firstName), clean(metadata?.lastName)].filter(Boolean).join(" ");
  let name = explicitName;
  if (!name && email) {
    name = source
      .slice(0, source.indexOf(email))
      .replace(/(?:\+?\d[\d\s().-]{6,}\d)/g, " ")
      .replace(/\b(hola|hello|bonjour|soy|i am|je suis|me llamo|my name is|nombre|name|email|telefono|phone|tel)\b/gi, " ")
      .replace(/[,:;|]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return { visitorName: name, email, phone };
}

export async function GET(request) {
  if (!isDatabaseConfigured()) return json({ configured: false, messages: [] });
  const url = new URL(request.url);
  let clientCode;
  try {
    clientCode = resolveRequestClient(request, url.searchParams.get("clientCode"), clients);
  } catch {
    return json({ error: "Invalid widget identity" }, 401);
  }
  const visitorId = clean(url.searchParams.get("visitorId"));
  if (!visitorId) return json({ error: "visitorId is required" }, 400);

  const conversation = await findVisitorConversation(clientCode, visitorId);
  return json({
    configured: true,
    status: conversation?.status || "ai",
    messages: conversation?.messages || [],
  });
}

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return json({ error: "Conversation storage is not configured" }, 503);
  }

  const payload = await request.json().catch(() => ({}));
  let clientCode;
  try {
    clientCode = resolveRequestClient(request, payload.clientCode, clients);
  } catch {
    return json({ error: "Invalid widget identity" }, 401);
  }
  const visitorId = clean(payload.visitorId);
  const content = clean(payload.content);
  if (!visitorId || !content) {
    return json({ error: "visitorId and content are required" }, 400);
  }

  const extracted = extractContactDetails(content, payload.metadata);
  const conversation = await upsertConversation({
    clientCode,
    visitorId,
    visitorName: payload.visitorName || extracted.visitorName,
    email: payload.email || extracted.email,
    phone: payload.phone || extracted.phone,
    source: payload.source,
    language: payload.language,
    metadata: payload.metadata,
  });

  const operatorTranslation = await translateVisitorMessageForOperator({
    content,
    sourceLanguage: payload.language || payload.metadata?.language || payload.metadata?.locale,
  }).catch((error) => ({
    content,
    translated: false,
    sourceLanguage: payload.language || payload.metadata?.language || payload.metadata?.locale || "",
    targetLanguage: "es",
    reason: error?.message || "translation_failed",
  }));

  const message = await addMessage({
    conversationId: conversation.id,
    role: "visitor",
    content,
    metadata: {
      ...(payload.metadata || {}),
      operatorDisplayContent: operatorTranslation.content,
      operatorDisplayLanguage: operatorTranslation.targetLanguage || "es",
      visitorOriginalLanguage: operatorTranslation.sourceLanguage || payload.language || "",
      visitorTranslatedForOperator: Boolean(operatorTranslation.translated),
      ...(operatorTranslation.reason ? { visitorTranslationReason: operatorTranslation.reason } : {}),
    },
  });

  return json({ conversation, message });
}

export async function PATCH(request) {
  if (!isDatabaseConfigured()) return json({ error: "Conversation storage is not configured" }, 503);
  const payload = await request.json().catch(() => ({}));
  let clientCode;
  try {
    clientCode = resolveRequestClient(request, payload.clientCode, clients);
  } catch {
    return json({ error: "Invalid widget identity" }, 401);
  }
  const conversation = await findVisitorConversation(clientCode, payload.visitorId);
  if (!conversation) return json({ error: "Conversation not found" }, 404);
  if (conversation.status !== "ai") return json({ skipped: true, status: conversation.status });

  const message = await addMessage({
    conversationId: conversation.id,
    role: "ai",
    content: payload.content,
    model: payload.model,
  });
  return json({ message });
}
