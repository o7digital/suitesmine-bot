import { query } from "@/lib/db";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listConversations(clientCode) {
  const values = [];
  const filter = clientCode ? "where c.client_code = $1" : "";
  if (clientCode) values.push(clientCode);

  const result = await query(
    `select c.*,
      coalesce(
        json_agg(
          json_build_object(
            'id', m.id,
            'role', m.role,
            'content', m.content,
            'model', m.model,
            'metadata', m.metadata,
            'createdAt', m.created_at
          ) order by m.created_at
        ) filter (where m.id is not null),
        '[]'::json
      ) as messages
    from conversations c
    left join messages m on m.conversation_id = c.id
    ${filter}
    group by c.id
    order by c.updated_at desc`,
    values
  );

  return result.rows;
}

export async function findConversation(id) {
  const result = await query("select * from conversations where id = $1", [id]);
  return result.rows[0] || null;
}

export async function findVisitorConversation(clientCode, visitorId) {
  const result = await query(
    `select c.*,
      coalesce(
        json_agg(
          json_build_object(
            'id', m.id,
            'role', m.role,
            'content', m.content,
            'metadata', m.metadata,
            'createdAt', m.created_at
          ) order by m.created_at
        ) filter (where m.id is not null),
        '[]'::json
      ) as messages
    from conversations c
    left join messages m on m.conversation_id = c.id
    where c.client_code = $1 and c.visitor_id = $2
    group by c.id`,
    [clean(clientCode) || "default", clean(visitorId)]
  );
  return result.rows[0] || null;
}

export async function upsertConversation({
  clientCode,
  visitorId,
  visitorName,
  email,
  phone,
  source,
  language,
  metadata,
}) {
  const result = await query(
    `insert into conversations (
      client_code, visitor_id, visitor_name, email, phone, source, language, metadata
    ) values ($1, $2, $3, $4, $5, $6, $7, $8)
    on conflict (client_code, visitor_id) do update set
      visitor_name = coalesce(nullif(excluded.visitor_name, ''), conversations.visitor_name),
      email = coalesce(nullif(excluded.email, ''), conversations.email),
      phone = coalesce(nullif(excluded.phone, ''), conversations.phone),
      source = excluded.source,
      language = excluded.language,
      metadata = conversations.metadata || excluded.metadata,
      updated_at = now()
    returning *`,
    [
      clean(clientCode) || "default",
      clean(visitorId),
      clean(visitorName),
      clean(email),
      clean(phone),
      clean(source) || "website",
      clean(language) || "es",
      metadata || {},
    ]
  );

  return result.rows[0];
}

export async function addMessage({ conversationId, role, content, model, metadata }) {
  const result = await query(
    `with inserted as (
      insert into messages (conversation_id, role, content, model, metadata)
      values ($1, $2, $3, $4, $5)
      returning *
    )
    update conversations set updated_at = now()
    where id = $1
    returning (select row_to_json(inserted) from inserted) as message`,
    [conversationId, role, clean(content), clean(model), metadata || {}]
  );

  return result.rows[0]?.message;
}

export async function updateConversationStatus({ id, status, operatorId }) {
  const assignedOperatorId = status === "manual" ? operatorId : null;
  const result = await query(
    `update conversations
      set status = $2, assigned_operator_id = $3, updated_at = now()
      where id = $1
      returning *`,
    [id, status, assignedOperatorId]
  );

  return result.rows[0] || null;
}
