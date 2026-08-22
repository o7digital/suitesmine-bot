function widgetHeaders(identity) {
  return {
    "Content-Type": "application/json",
    "X-Olivia-Widget-Identity": identity,
  };
}

export async function getWidgetIdentity() {
  const res = await fetch("/api/widget/identity", { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Unable to establish widget identity");
  return data;
}

export async function sendMessage(payload, identity) {
  const res = await fetch("/api/olivia/chat", {
    method: "POST",
    headers: widgetHeaders(identity),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Unable to send message");
  }

  return data;
}

export async function persistConversationMessage(payload, identity) {
  const res = await fetch("/api/widget/conversations", {
    method: "POST",
    headers: widgetHeaders(identity),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Unable to persist conversation");
  return res.json();
}

export async function persistAssistantMessage(payload, identity) {
  const res = await fetch("/api/widget/conversations", {
    method: "PATCH",
    headers: widgetHeaders(identity),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Unable to persist assistant message");
  return res.json();
}

export async function getVisitorConversation({ clientCode, visitorId }, identity) {
  const params = new URLSearchParams({ clientCode, visitorId });
  const res = await fetch(`/api/widget/conversations?${params}`, {
    cache: "no-store",
    headers: { "X-Olivia-Widget-Identity": identity },
  });
  if (!res.ok) throw new Error("Unable to load conversation");
  return res.json();
}
