import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { clientCodeForSiteHost, issueWidgetIdentity, resolveRequestClient } from '../lib/client-identity.mjs';
const source = await readFile(new URL('../config/clients.js', import.meta.url), 'utf8');
const { clients } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
process.env.OLIVIA_WIDGET_SIGNING_SECRET = 'test-only-diicsa-key';
test('DIICSA Tu Casa resolves separately from institutional DIICSA and hotel', () => {
  assert.equal(clientCodeForSiteHost('diicsa-tucasa.vercel.app', clients), 'diicsatucasa');
  assert.equal(clientCodeForSiteHost('diicsacv.com', clients), 'diicsacv');
  assert.equal(clientCodeForSiteHost('suitesmine-bot.vercel.app', clients), 'suitesmine');
  const identity = issueWidgetIdentity('diicsatucasa', 'diicsa-tucasa.vercel.app', clients);
  const request = new Request('https://suitesmine-bot.vercel.app/api/olivia/chat', { headers: { origin: 'https://diicsa-tucasa.vercel.app', 'x-olivia-widget-identity': identity } });
  assert.equal(resolveRequestClient(request, 'suitesmine', clients), 'diicsatucasa');
});
