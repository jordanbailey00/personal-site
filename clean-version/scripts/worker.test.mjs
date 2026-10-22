import assert from 'node:assert/strict';
import test from 'node:test';
import worker, { messageId } from '../worker/index.mjs';

// An in-memory stand-in for the Worker's key-value store.
function store() {
  const values = new Map();
  return {
    values,
    get: async key => values.get(key) ?? null,
    put: async (key, value) => { values.set(key, value); },
    delete: async key => { values.delete(key); },
    list: async ({ prefix }) => ({ keys: [...values.keys()].filter(key => key.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const SITE = 'https://www.jordanbailey.dev';
const send = (env, payload, { origin = SITE, ip = '203.0.113.1' } = {}) => worker.fetch(new Request('https://inbox.example/messages', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, 'CF-Connecting-IP': ip }, body: JSON.stringify(payload),
}), env, { waitUntil() {} });
const ask = (env, path, { token = 'secret', method = 'GET', body } = {}) => worker.fetch(new Request(`https://inbox.example${path}`, {
  method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body),
}), env);

test('The live inbox takes messages only from the site, and only real ones', async () => {
  const env = { MESSAGES: store(), INBOX_TOKEN: 'secret' };
  const preflight = await worker.fetch(new Request('https://inbox.example/messages', { method: 'OPTIONS', headers: { Origin: SITE } }), env);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), SITE);
  assert.equal((await send(env, { text: 'Hi', elapsed: 9000 }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await send(env, { text: '', elapsed: 9000 })).status, 400);
  assert.equal((await send(env, { text: 'Hi', elapsed: 9000, website: 'spam' })).status, 201, 'bots are told it worked');
  assert.equal((await send(env, { text: 'Hi', elapsed: 100 })).status, 201);
  assert.equal([...env.MESSAGES.values.keys()].filter(key => key.startsWith('msg:')).length, 0, 'but nothing is kept');

  const response = await send(env, { name: 'Alex', text: 'Hello!', drawing: { strokes: [[1, 2, 3, 4]], colors: ['red'] }, elapsed: 9000 });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), SITE);
  const [stored] = [...env.MESSAGES.values].filter(([key]) => key.startsWith('msg:'));
  const message = JSON.parse(stored[1]);
  assert.match(message.id, /^\d{8}-\d{6}-[a-f0-9]{4}$/);
  assert.deepEqual({ ...message, id: undefined, received: undefined }, { id: undefined, received: undefined, name: 'Alex', text: 'Hello!', drawing: { strokes: [[1, 2, 3, 4]], colors: ['red'] } });
});

test('One address can only send so many messages at once', async () => {
  const env = { MESSAGES: store(), INBOX_TOKEN: 'secret' };
  for (let count = 0; count < 6; count++) assert.equal((await send(env, { text: `Hi ${count}`, elapsed: 9000 })).status, 201);
  assert.equal((await send(env, { text: 'One more', elapsed: 9000 })).status, 429);
  assert.equal((await send(env, { text: 'Someone else', elapsed: 9000 }, { ip: '203.0.113.2' })).status, 201);
});

test('Only the reply tool, with its key, can read and clear the inbox', async () => {
  const env = { MESSAGES: store(), INBOX_TOKEN: 'secret' };
  await send(env, { text: 'Hello', elapsed: 9000 });
  assert.equal((await ask(env, '/inbox', { token: 'wrong' })).status, 403);
  assert.equal((await ask(env, '/inbox', { token: '' })).status, 403);
  const { messages } = await (await ask(env, '/inbox')).json();
  assert.equal(messages.length, 1);
  assert.equal(messages[0].text, 'Hello');
  assert.equal((await ask(env, '/inbox/clear', { method: 'POST', body: { ids: ['../x'] } })).status, 400);
  assert.equal((await ask(env, '/inbox/clear', { method: 'POST', body: { ids: [messages[0].id] } })).status, 200);
  assert.deepEqual((await (await ask(env, '/inbox')).json()).messages, []);
  assert.equal((await ask({ MESSAGES: store() }, '/inbox')).status, 403, 'no key set, no access');
});

test('Message ids sort by the time they arrived', () => {
  assert.equal(messageId(new Date('2026-10-22T09:08:07Z'), new Uint8Array([10, 255])), '20261022-090807-0aff');
});
