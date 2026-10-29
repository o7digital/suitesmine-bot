import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { clientCodeForSiteHost, issueWidgetIdentity, resolveRequestClient } from '../lib/client-identity.mjs';
const source = await readFile(new URL('../config/clients.js', import.meta.url), 'utf8');
const { clients } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
process.env.OLIVIA_WIDGET_SIGNING_SECRET = 'test-only-bullbear-key';

test('BullBear identity stays bound to its academy site and profile', () => {
  const origin = 'https://bullbear-academy-preview.vercel.app';
  assert.equal(clientCodeForSiteHost(origin, clients), 'bullbear');
  assert.deepEqual(clients.bullbear.languages, ['es', 'en', 'ru', 'zh', 'de', 'it', 'fr', 'pt']);
  assert.equal(clients.bullbear.integrations.booking, undefined);
  const identity = issueWidgetIdentity('bullbear', origin, clients);
  const request = (host) => new Request('https://olivia-ai.o7digital.com/api/olivia/chat', {
    headers: { origin: host, 'x-olivia-widget-identity': identity },
  });
  assert.equal(resolveRequestClient(request(origin), 'suitesmine', clients), 'bullbear');
  assert.throws(() => resolveRequestClient(request('https://suitesmine.com'), 'bullbear', clients));
});

test('BullBear model identity is Carlos in every supported language', () => {
  for (const language of clients.bullbear.languages) {
    assert.match(clients.bullbear.roleLabel[language], /Carlos/);
    assert.doesNotMatch(clients.bullbear.roleLabel[language], /Olivia/);
  }
  assert.match(clients.bullbear.knowledge, /Your name is Carlos IA/);
  assert.doesNotMatch(clients.bullbear.knowledge, /Olivia/);
  assert.match(clients.nathalie.roleLabel.es, /Olivia/);
});
