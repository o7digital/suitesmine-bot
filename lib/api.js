export async function sendMessage(payload) {
  const res = await fetch("/api/olivia/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Unable to send message");
  }

  return data;
}

export async function persistConversationMessage(payload) {
  const res = await fetch("/api/widget/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Unable to persist conversation");
  return res.json();
}

export async function persistAssistantMessage(payload) {
  const res = await fetch("/api/widget/conversations", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Unable to persist assistant message");
  return res.json();
}

export async function getVisitorConversation({ clientCode, visitorId }) {
  const params = new URLSearchParams({ clientCode, visitorId });
  const res = await fetch(`/api/widget/conversations?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Unable to load conversation");
  return res.json();
}
