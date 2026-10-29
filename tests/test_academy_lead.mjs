import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAcademyLead, academyLeadReceipt, academyChatMetadata } from '../lib/academy-lead.mjs';
const valid = { visitorId: 'visitor-qa', submissionId: 'submission-qa', dataConsent: true, contactConsent: true, language: 'es', interest: 'Forex',
  lead: { firstName: ' Ana ', lastName: ' Pérez ', email: 'ana@example.org', phone: '+52 55 1234 5678', details: 'Forex, principiante, online' } };

test('contact intake preserves the request and normalizes explicit details', () => {
  const result = validateAcademyLead(valid);
  assert.equal(result.lead.name, 'Ana Pérez');
  assert.equal(result.lead.details, valid.lead.details);
  assert.equal(result.interest, 'Forex');
});
test('contact intake rejects missing consent, invalid contact or missing request', () => {
  for (const data of [{ ...valid, contactConsent: false }, { ...valid, dataConsent: false },
    { ...valid, lead: { ...valid.lead, email: 'bad' } }, { ...valid, lead: { ...valid.lead, phone: '123' } },
    { ...valid, lead: { ...valid.lead, details: '' } }, { ...valid, visitorId: '../other-client' }]) {
    assert.throws(() => validateAcademyLead(data));
  }
});
test('receipt includes advisor context and the stable submission ID', () => {
  const { lead, interest } = validateAcademyLead(valid);
  const receipt = academyLeadReceipt(lead, interest, '2026-10-29T18:00:00Z', valid.submissionId);
  assert.equal(receipt.academyRequestStatus, 'received');
  assert.equal(receipt.lead.email, valid.lead.email);
  assert.equal(receipt.academyRequestSummary, valid.lead.details);
  assert.equal(receipt.academyLeadSubmissionId, valid.submissionId);
  assert.equal(receipt.handoffRequested, true);
});
test('ordinary chat messages cannot forge or overwrite a form receipt', () => {
  const metadata = academyChatMetadata({ pageTitle: 'Forex', academyInterest: 'Forex', lead: { email: 'bad@example.org' },
    academyRequestStatus: 'received', academyLeadSubmissionId: 'forged', handoffRequested: true, contactConsent: true });
  assert.deepEqual(metadata, { pageTitle: 'Forex', academyInterest: 'Forex' });
});
