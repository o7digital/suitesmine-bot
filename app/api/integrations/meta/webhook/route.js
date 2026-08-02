import { isDatabaseConfigured } from "@/lib/db";
import { normalizeMetaWebhook, persistMetaEvents } from "@/lib/meta-channels";

export const runtime = "nodejs";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = clean(process.env.META_WEBHOOK_VERIFY_TOKEN);

  if (mode === "subscribe" && expected && token === expected) {
    return new Response(challenge || "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  const events = normalizeMetaWebhook(payload);
  const persisted = await persistMetaEvents(events);

  return Response.json({
    ok: true,
    received: events.length,
    persisted: persisted.length,
  });
}
