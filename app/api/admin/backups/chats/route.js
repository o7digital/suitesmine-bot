import { isDatabaseConfigured } from "@/lib/db";
import {
  exportChatHistory,
  exportChatHistoryCsv,
} from "@/lib/chat-backups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request) {
  const expected = process.env.BACKUP_ADMIN_TOKEN;
  if (!expected) return process.env.NODE_ENV !== "production";

  const url = new URL(request.url);
  const token =
    request.headers.get("x-backup-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("token");

  return token === expected;
}

function downloadResponse(body, filename, contentType) {
  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ error: "database_not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const clientCode = url.searchParams.get("client") || url.searchParams.get("clientCode") || "";
  const since = url.searchParams.get("since") || "";
  const until = url.searchParams.get("until") || "";
  const format = (url.searchParams.get("format") || "json").toLowerCase();
  const exportData = await exportChatHistory({ clientCode, since, until });
  const date = new Date().toISOString().slice(0, 10);
  const scope = clientCode || "all";

  if (format === "conversations.csv") {
    const { conversationsCsv } = exportChatHistoryCsv(exportData);
    return downloadResponse(
      conversationsCsv,
      `olivia-chat-conversations-${scope}-${date}.csv`,
      "text/csv; charset=utf-8"
    );
  }

  if (format === "messages.csv") {
    const { messagesCsv } = exportChatHistoryCsv(exportData);
    return downloadResponse(
      messagesCsv,
      `olivia-chat-messages-${scope}-${date}.csv`,
      "text/csv; charset=utf-8"
    );
  }

  if (format === "manifest") {
    return Response.json(exportData.manifest, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  return downloadResponse(
    JSON.stringify(exportData, null, 2),
    `olivia-chat-history-${scope}-${date}.json`,
    "application/json; charset=utf-8"
  );
}
