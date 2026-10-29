export function validateAcademyLead(payload) {
  const clean = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
  const lead = Object.fromEntries(Object.entries({ firstName: 100, lastName: 100, email: 254, phone: 40, details: 4000 })
    .map(([key, limit]) => [key, clean(payload.lead?.[key], limit)]));
  const visitorId = clean(payload.visitorId, 80);
  const submissionId = clean(payload.submissionId, 80);
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(visitorId) || !/^[a-zA-Z0-9_-]{1,80}$/.test(submissionId)) {
    throw new Error('Invalid request identity');
  }
  if (payload.dataConsent !== true || payload.contactConsent !== true) throw new Error('Consent is required');
  if (!lead.firstName || !lead.lastName || !lead.details) throw new Error('Name and request are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) throw new Error('Invalid email');
  const digits = lead.phone.replace(/\D/g, '');
  if (!/^[+\d\s().-]+$/.test(lead.phone) || digits.length < 8 || digits.length > 15) throw new Error('Invalid phone');
  return { visitorId, submissionId, lead: { ...lead, name: `${lead.firstName} ${lead.lastName}` },
    interest: clean(payload.interest, 200), language: clean(payload.language, 10) || 'es' };
}

export function academyLeadReceipt(lead, interest, consentAt, submissionId) {
  return {
    lead, academyRequestStatus: 'received', academyRequestSummary: lead.details,
    academyInterest: interest, academyLeadSubmissionId: submissionId,
    handoffRequested: true, intent: 'handoff', contactConsent: true, contactConsentAt: consentAt,
  };
}

export function academyChatMetadata(metadata = {}) {
  const result = { ...metadata };
  for (const key of ['lead', 'academyRequestStatus', 'academyLeadSubmissionId', 'handoffRequested', 'contactConsent', 'contactConsentAt']) delete result[key];
  return result;
}
