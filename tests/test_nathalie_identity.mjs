import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { clientCodeForSiteHost, issueWidgetIdentity, resolveRequestClient } from '../lib/client-identity.mjs';
const source = await readFile(new URL('../config/clients.js', import.meta.url), 'utf8');
const { clients } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
process.env.OLIVIA_WIDGET_SIGNING_SECRET = 'test-only-nathalie-key';
test('Nathalie has an isolated artistic profile bound to the deployed site', () => {
 assert.equal(clientCodeForSiteHost('nathalie-pena-comas.vercel.app',clients),'nathalie');
 assert.equal(clients.nathalie.languages.length,11);
 assert.equal(clients.nathalie.integrations.booking,undefined);
 assert.match(clients.nathalie.knowledge,/office@buchmann.at/);
 const identity=issueWidgetIdentity('nathalie','nathalie-pena-comas.vercel.app',clients);
 const request=new Request('https://suitesmine-bot.vercel.app/api/olivia/chat',{headers:{origin:'https://nathalie-pena-comas.vercel.app','x-olivia-widget-identity':identity}});
 assert.equal(resolveRequestClient(request,'suitesmine',clients),'nathalie');
 const other=new Request('https://suitesmine-bot.vercel.app/api/olivia/chat',{headers:{origin:'https://suitesmine.com','x-olivia-widget-identity':identity}});
 assert.throws(()=>resolveRequestClient(other,'nathalie',clients));
});
