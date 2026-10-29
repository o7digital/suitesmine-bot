import { clients } from '@/config/clients';
import { resolveRequestClient } from '@/lib/client-identity.mjs';
import { validateAcademyLead, academyLeadReceipt } from '@/lib/academy-lead.mjs';
import { findVisitorConversation } from '@/lib/conversations';
import { isDatabaseConfigured, query } from '@/lib/db';

export const runtime = 'nodejs';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Olivia-Widget-Identity',
  'Cache-Control': 'no-store',
};
const json = (data, status = 200) => Response.json(data, { status, headers });
export function OPTIONS() { return new Response(null, { status: 204, headers }); }

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  let clientCode;
  try { clientCode = resolveRequestClient(request, payload.clientCode, clients); }
  catch { return json({ error: 'Invalid widget identity' }, 401); }
  if (clientCode !== 'bullbear') return json({ error: 'Unsupported client' }, 403);
  let validated;
  try { validated = validateAcademyLead(payload); }
  catch (error) { return json({ error: error.message }, 400); }
  if (!isDatabaseConfigured()) return json({ error: 'Contact storage unavailable' }, 503);

  try {
    const { visitorId, submissionId, lead, interest, language } = validated;
    const conversation = await findVisitorConversation(clientCode, visitorId);
    if (!conversation) return json({ error: 'Conversation not found' }, 404);
    if (conversation.metadata?.academyLeadSubmissionId === submissionId) return json({ received: true, submissionId, lead: conversation.metadata.lead });
    const metadata = academyLeadReceipt(lead, interest, new Date().toISOString(), submissionId);
    const content = `Solicitud de contacto — Bull & Bear Academy\nNombre: ${lead.name}\nEmail: ${lead.email}\nTeléfono: ${lead.phone}\nCurso o servicio: ${interest || 'Por precisar'}\nSolicitud: ${lead.details}`;
    // Contact data and its transcript entry are committed together. A retried
    // submission with the same ID cannot create a duplicate message.
    const result = await query(`with updated as (
      update conversations set visitor_name = $4, email = $5, phone = $6,
        language = $7, metadata = metadata || $8::jsonb, updated_at = now(),
        status = case when status = 'solved' then 'ai' else status end
      where client_code = $1 and visitor_id = $2
        and metadata->>'academyLeadSubmissionId' is distinct from $3
      returning id
    ) insert into messages (conversation_id, role, content, metadata)
      select id, 'visitor', $9, $8::jsonb from updated`,
    [clientCode, visitorId, submissionId, lead.name, lead.email, lead.phone, language, JSON.stringify(metadata), content]);
    if (!result.rowCount) {
      const saved = await findVisitorConversation(clientCode, visitorId);
      if (saved?.metadata?.academyLeadSubmissionId !== submissionId) throw new Error('Contact request not saved');
      return json({ received: true, submissionId, lead: saved.metadata.lead });
    }
    return json({ received: true, submissionId, lead });
  } catch {
    return json({ error: 'The contact request could not be saved' }, 503);
  }
}
