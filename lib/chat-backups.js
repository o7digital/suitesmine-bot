import { query } from "@/lib/db";

function cleanClientCode(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const serialized =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${serialized.replaceAll('"', '""')}"`;
}

function toCsv(rows, columns) {
  return [
    columns.map((column) => csvEscape(column.header)).join(","),
    ...rows.map((row) =>
      columns.map((column) => csvEscape(column.value(row))).join(",")
    ),
  ].join("\n");
}

export async function exportChatHistory({ clientCode, since, until } = {}) {
  const values = [];
  const filters = [];
  const scopedClientCode = cleanClientCode(clientCode);
  const sinceIso = normalizeDate(since);
  const untilIso = normalizeDate(until);

  if (scopedClientCode) {
    values.push(scopedClientCode);
    filters.push(`c.client_code = $${values.length}`);
  }

  if (sinceIso) {
    values.push(sinceIso);
    filters.push(`c.updated_at >= $${values.length}`);
  }

  if (untilIso) {
    values.push(untilIso);
    filters.push(`c.updated_at <= $${values.length}`);
  }

  const where = filters.length ? `where ${filters.join(" and ")}` : "";

  const result = await query(
    `select
      c.id as conversation_id,
      c.client_code,
      c.visitor_id,
      c.visitor_name,
      c.email,
      c.phone,
      c.status,
      c.source,
      c.language,
      c.metadata as conversation_metadata,
      c.assigned_operator_id,
      c.created_at as conversation_created_at,
      c.updated_at as conversation_updated_at,
      m.id as message_id,
      m.role as message_role,
      m.content as message_content,
      m.model as message_model,
      m.metadata as message_metadata,
      m.created_at as message_created_at
    from conversations c
    left join messages m on m.conversation_id = c.id
    ${where}
    order by c.client_code asc, c.updated_at desc, m.created_at asc`,
    values
  );

  const conversationMap = new Map();
  const messages = [];

  for (const row of result.rows) {
    if (!conversationMap.has(row.conversation_id)) {
      conversationMap.set(row.conversation_id, {
        id: row.conversation_id,
        clientCode: row.client_code,
        visitorId: row.visitor_id,
        visitorName: row.visitor_name,
        email: row.email,
        phone: row.phone,
        status: row.status,
        source: row.source,
        language: row.language,
        metadata: row.conversation_metadata || {},
        assignedOperatorId: row.assigned_operator_id,
        createdAt: row.conversation_created_at,
        updatedAt: row.conversation_updated_at,
        messages: [],
      });
    }

    if (row.message_id) {
      const message = {
        id: row.message_id,
        conversationId: row.conversation_id,
        clientCode: row.client_code,
        role: row.message_role,
        content: row.message_content,
        model: row.message_model,
        metadata: row.message_metadata || {},
        createdAt: row.message_created_at,
      };
      messages.push(message);
      conversationMap.get(row.conversation_id).messages.push(message);
    }
  }

  const conversations = Array.from(conversationMap.values());
  const clients = conversations.reduce((acc, conversation) => {
    acc[conversation.clientCode] ??= { conversations: 0, messages: 0 };
    acc[conversation.clientCode].conversations += 1;
    acc[conversation.clientCode].messages += conversation.messages.length;
    return acc;
  }, {});

  const manifest = {
    generatedAt: new Date().toISOString(),
    scope: {
      clientCode: scopedClientCode || "all",
      since: sinceIso,
      until: untilIso,
    },
    totals: {
      clients: Object.keys(clients).length,
      conversations: conversations.length,
      messages: messages.length,
    },
    clients,
  };

  return { manifest, conversations, messages };
}

export function exportChatHistoryCsv(exportData) {
  const conversationRows = exportData.conversations.map((conversation) => ({
    ...conversation,
    messageCount: conversation.messages.length,
  }));

  const conversationsCsv = toCsv(conversationRows, [
    { header: "conversation_id", value: (row) => row.id },
    { header: "client_code", value: (row) => row.clientCode },
    { header: "visitor_id", value: (row) => row.visitorId },
    { header: "visitor_name", value: (row) => row.visitorName },
    { header: "email", value: (row) => row.email },
    { header: "phone", value: (row) => row.phone },
    { header: "status", value: (row) => row.status },
    { header: "source", value: (row) => row.source },
    { header: "language", value: (row) => row.language },
    { header: "message_count", value: (row) => row.messageCount },
    { header: "metadata", value: (row) => row.metadata },
    { header: "created_at", value: (row) => row.createdAt },
    { header: "updated_at", value: (row) => row.updatedAt },
  ]);

  const messagesCsv = toCsv(exportData.messages, [
    { header: "message_id", value: (row) => row.id },
    { header: "conversation_id", value: (row) => row.conversationId },
    { header: "client_code", value: (row) => row.clientCode },
    { header: "role", value: (row) => row.role },
    { header: "content", value: (row) => row.content },
    { header: "model", value: (row) => row.model },
    { header: "metadata", value: (row) => row.metadata },
    { header: "created_at", value: (row) => row.createdAt },
  ]);

  return { conversationsCsv, messagesCsv };
}
