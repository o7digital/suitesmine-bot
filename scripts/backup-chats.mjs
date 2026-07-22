import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadDotEnvLocal() {
  const envPath = path.join(rootDir, ".env.local");
  try {
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const rawValue = trimmed.slice(index + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "");
      process.env[key] ??= value;
    }
  } catch {
    // Optional for production/CI where env vars are injected.
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
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

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function exportChatHistory(pool, { clientCode, since, until }) {
  const values = [];
  const filters = [];
  const sinceIso = normalizeDate(since);
  const untilIso = normalizeDate(until);
  const scopedClientCode =
    typeof clientCode === "string" ? clientCode.trim().toLowerCase() : "";

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
  const result = await pool.query(
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

  return {
    manifest: {
      generatedAt: new Date().toISOString(),
      scope: { clientCode: scopedClientCode || "all", since: sinceIso, until: untilIso },
      totals: {
        clients: Object.keys(clients).length,
        conversations: conversations.length,
        messages: messages.length,
      },
      clients,
    },
    conversations,
    messages,
  };
}

function exportCsv(exportData) {
  const conversationsCsv = toCsv(exportData.conversations, [
    { header: "conversation_id", value: (row) => row.id },
    { header: "client_code", value: (row) => row.clientCode },
    { header: "visitor_id", value: (row) => row.visitorId },
    { header: "visitor_name", value: (row) => row.visitorName },
    { header: "email", value: (row) => row.email },
    { header: "phone", value: (row) => row.phone },
    { header: "status", value: (row) => row.status },
    { header: "source", value: (row) => row.source },
    { header: "language", value: (row) => row.language },
    { header: "message_count", value: (row) => row.messages.length },
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

async function main() {
  await loadDotEnvLocal();
  const args = parseArgs(process.argv.slice(2));
  const connectionString =
    process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Set DATABASE_PUBLIC_URL or DATABASE_URL before running backups.");
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("railway") || connectionString.includes("postgres")
      ? { rejectUnauthorized: false }
      : undefined,
    max: 2,
  });

  const exportData = await exportChatHistory(pool, {
    clientCode: args.client || args.clientCode || "",
    since: args.since || "",
    until: args.until || "",
  });
  await pool.end();

  const date = new Date().toISOString().slice(0, 10);
  const scope = exportData.manifest.scope.clientCode;
  const outputDir = path.resolve(
    rootDir,
    args.out || "backups/chat-history",
    date,
    scope
  );
  await fs.mkdir(outputDir, { recursive: true });

  const { conversationsCsv, messagesCsv } = exportCsv(exportData);
  await fs.writeFile(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(exportData.manifest, null, 2)
  );
  await fs.writeFile(
    path.join(outputDir, "chat-history.json"),
    JSON.stringify(exportData, null, 2)
  );
  await fs.writeFile(path.join(outputDir, "conversations.csv"), conversationsCsv);
  await fs.writeFile(path.join(outputDir, "messages.csv"), messagesCsv);

  if (scope === "all") {
    const clientsDir = path.join(outputDir, "clients");
    await fs.mkdir(clientsDir, { recursive: true });
    for (const clientCode of Object.keys(exportData.manifest.clients)) {
      const clientExport = {
        manifest: {
          ...exportData.manifest,
          scope: { ...exportData.manifest.scope, clientCode },
        },
        conversations: exportData.conversations.filter(
          (conversation) => conversation.clientCode === clientCode
        ),
        messages: exportData.messages.filter(
          (message) => message.clientCode === clientCode
        ),
      };
      await fs.writeFile(
        path.join(clientsDir, `${clientCode}.json`),
        JSON.stringify(clientExport, null, 2)
      );
    }
  }

  console.log(JSON.stringify({ outputDir, ...exportData.manifest }, null, 2));
}

main().catch((error) => {
  console.error("[backup-chats] failed", error);
  process.exit(1);
});
