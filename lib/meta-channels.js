import { addMessage, upsertConversation } from "@/lib/conversations";
import { translateVisitorMessageForOperator } from "@/lib/operator-translation";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseJsonEnv(name) {
  const raw = clean(process.env[name]);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getMetaWebhookUrl() {
  return `${(process.env.NEXT_PUBLIC_OLIVIA_BASE_URL || "https://olivia-ai.o7digital.com").replace(/\/$/, "")}/api/integrations/meta/webhook`;
}

export function resolveMetaClientCode(accountId) {
  const map = {
    ...parseJsonEnv("META_CHANNEL_CLIENTS"),
    ...parseJsonEnv("META_ACCOUNT_CLIENT_MAP"),
  };
  return clean(map[accountId]) || clean(process.env.META_DEFAULT_CLIENT_CODE) || "default";
}

function normalizeWhatsAppChange(change) {
  const value = change?.value || {};
  const phoneNumberId = clean(value?.metadata?.phone_number_id);
  const contacts = Object.fromEntries((value.contacts || []).map((contact) => [contact.wa_id, contact]));
  return (value.messages || [])
    .filter((message) => message?.from && (message.text?.body || message.button?.text || message.interactive?.button_reply?.title))
    .map((message) => {
      const contact = contacts[message.from] || {};
      const text = clean(message.text?.body || message.button?.text || message.interactive?.button_reply?.title);
      return {
        provider: "whatsapp",
        accountId: phoneNumberId,
        clientCode: resolveMetaClientCode(phoneNumberId),
        visitorId: `whatsapp:${phoneNumberId}:${message.from}`,
        visitorName: clean(contact.profile?.name) || message.from,
        phone: message.from,
        content: text,
        externalMessageId: message.id,
        metadata: {
          channel: "whatsapp",
          provider: "meta",
          accountId: phoneNumberId,
          senderId: message.from,
          recipientId: phoneNumberId,
          externalMessageId: message.id,
          timestamp: message.timestamp,
        },
      };
    });
}

function normalizeMessengerEntry(entry, objectType) {
  const recipientId = clean(entry.id);
  return (entry.messaging || [])
    .filter((event) => event?.sender?.id && event?.message && !event.message.is_echo)
    .map((event) => {
      const channel = objectType === "instagram" ? "instagram" : "facebook";
      const accountId = clean(event.recipient?.id) || recipientId;
      const text = clean(event.message?.text) || "[Attachment]";
      return {
        provider: channel,
        accountId,
        clientCode: resolveMetaClientCode(accountId),
        visitorId: `${channel}:${accountId}:${event.sender.id}`,
        visitorName: event.sender.id,
        content: text,
        externalMessageId: event.message.mid,
        metadata: {
          channel,
          provider: "meta",
          accountId,
          senderId: event.sender.id,
          recipientId: accountId,
          externalMessageId: event.message.mid,
          timestamp: event.timestamp,
          attachments: event.message.attachments || [],
        },
      };
    });
}

export function normalizeMetaWebhook(payload) {
  const objectType = clean(payload?.object);
  const events = [];
  for (const entry of payload?.entry || []) {
    for (const change of entry.changes || []) {
      if (change?.field === "messages" || change?.value?.messaging_product === "whatsapp") {
        events.push(...normalizeWhatsAppChange(change));
      }
    }
    events.push(...normalizeMessengerEntry(entry, objectType));
  }
  return events;
}

export async function persistMetaEvents(events) {
  const persisted = [];
  for (const event of events) {
    const conversation = await upsertConversation({
      clientCode: event.clientCode,
      visitorId: event.visitorId,
      visitorName: event.visitorName,
      email: "",
      phone: event.phone || "",
      source: event.provider,
      language: "",
      metadata: event.metadata,
    });
    const operatorTranslation = await translateVisitorMessageForOperator({
      content: event.content,
      sourceLanguage: event.metadata?.language || event.metadata?.locale,
    }).catch((error) => ({
      content: event.content,
      translated: false,
      sourceLanguage: event.metadata?.language || event.metadata?.locale || "",
      targetLanguage: "es",
      reason: error?.message || "translation_failed",
    }));
    const message = await addMessage({
      conversationId: conversation.id,
      role: "visitor",
      content: event.content,
      metadata: {
        ...(event.metadata || {}),
        operatorDisplayContent: operatorTranslation.content,
        operatorDisplayLanguage: operatorTranslation.targetLanguage || "es",
        visitorOriginalLanguage: operatorTranslation.sourceLanguage || "",
        visitorTranslatedForOperator: Boolean(operatorTranslation.translated),
        ...(operatorTranslation.reason ? { visitorTranslationReason: operatorTranslation.reason } : {}),
      },
    });
    persisted.push({ conversation, message });
  }
  return persisted;
}

export async function sendMetaReply(conversation, content) {
  const source = clean(conversation?.source);
  const metadata = conversation?.metadata || {};
  const channel = clean(metadata.channel || source);
  const recipientId = clean(metadata.senderId);
  if (!recipientId || !content) return { skipped: true };

  if (channel === "whatsapp") {
    const phoneNumberId = clean(metadata.accountId || process.env.WHATSAPP_PHONE_NUMBER_ID);
    const token = clean(process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN);
    if (!phoneNumberId || !token) return { skipped: true, reason: "whatsapp_not_configured" };
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipientId,
        type: "text",
        text: { body: content },
      }),
    });
    return { skipped: false, ok: response.ok, status: response.status };
  }

  if (channel === "facebook" || channel === "instagram") {
    const pageId = clean(metadata.accountId || process.env.META_PAGE_ID);
    const token = clean(process.env.META_PAGE_ACCESS_TOKEN);
    if (!pageId || !token) return { skipped: true, reason: "messenger_not_configured" };
    const response = await fetch(`https://graph.facebook.com/v20.0/${pageId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: content },
        ...(channel === "instagram" ? { messaging_type: "RESPONSE" } : {}),
      }),
    });
    return { skipped: false, ok: response.ok, status: response.status };
  }

  return { skipped: true };
}
