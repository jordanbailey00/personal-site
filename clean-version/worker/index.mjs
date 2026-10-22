import { checkMessage } from '../assets/messages.js';

// The live inbox for "message me", a Cloudflare Worker. The message page posts
// here; each message waits in the MESSAGES store until the reply tool on
// Jordan's computer pulls it (with the private INBOX_TOKEN) and clears it.
// Nothing here is ever shown on the site: publishing stays a local step.
const ORIGINS = new Set(['https://www.jordanbailey.dev', 'https://jordanbailey.dev']);
// Messages from one address in a window of time, to slow down floods.
const RATE = { limit: 6, seconds: 600 };
const MAX_BODY = 64 * 1024;

const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });
const cors = origin => (ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : {});

// The same ids the local inbox uses: UTC time, then four random hex digits.
export function messageId(now = new Date(), random = crypto.getRandomValues(new Uint8Array(2))) {
  const stamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
  return `${stamp}-${[...random].map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

// Compares tokens in time that does not depend on where they differ.
function sameToken(given, expected) {
  if (!expected || typeof given !== 'string' || given.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < given.length; index++) difference |= given.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

async function receive(request, env, ctx) {
  const headers = cors(request.headers.get('Origin'));
  if (!headers['Access-Control-Allow-Origin']) return json({ error: 'Forbidden' }, 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'Send JSON' }, 415, headers);
  const body = await request.text();
  if (body.length > MAX_BODY) return json({ error: 'Too large' }, 413, headers);
  let payload;
  try { payload = JSON.parse(body); } catch { return json({ error: 'Not JSON' }, 400, headers); }
  // Bots fill in the hidden field or send the instant a page opens; take
  // their message and quietly drop it.
  if (payload?.website || !(payload?.elapsed >= 2500)) return json({ ok: true }, 201, headers);
  const { message, error } = checkMessage(payload);
  if (error) return json({ error }, 400, headers);

  const address = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateKey = `rate:${address}`;
  const sent = Number(await env.MESSAGES.get(rateKey)) || 0;
  if (sent >= RATE.limit) return json({ error: 'Too many messages. Please try again later.' }, 429, headers);
  await env.MESSAGES.put(rateKey, String(sent + 1), { expirationTtl: RATE.seconds });

  const now = new Date();
  const id = messageId(now);
  await env.MESSAGES.put(`msg:${id}`, JSON.stringify({ id, received: now.toISOString(), ...message }));
  if (env.RESEND_API_KEY && env.ALERT_EMAIL) ctx?.waitUntil?.(alert(env, message).catch(() => {}));
  return json({ ok: true }, 201, headers);
}

// An optional email alert for each new message, through Resend.
function alert(env, { name, text, drawing }) {
  const lines = [`From: ${name || 'Someone'}`, '', text || '(no text)', drawing ? '\n(Includes a drawing.)' : '', '', 'Open the reply tool to read and answer it.'];
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.ALERT_FROM || 'message me <onboarding@resend.dev>', to: env.ALERT_EMAIL, subject: 'New message on jordanbailey.dev', text: lines.join('\n') }),
  });
}

// For the reply tool only: every waiting message, then clearing the ones it saved.
async function inbox(request, env, url) {
  if (!sameToken(request.headers.get('Authorization')?.replace(/^Bearer /, ''), env.INBOX_TOKEN)) return json({ error: 'Forbidden' }, 403);
  if (request.method === 'GET') {
    const messages = [];
    let cursor;
    do {
      const page = await env.MESSAGES.list({ prefix: 'msg:', cursor });
      for (const { name } of page.keys) {
        const value = await env.MESSAGES.get(name);
        if (value) messages.push(JSON.parse(value));
      }
      cursor = page.list_complete ? null : page.cursor;
    } while (cursor);
    return json({ messages });
  }
  if (request.method === 'POST' && url.pathname === '/inbox/clear') {
    const { ids } = await request.json().catch(() => ({}));
    if (!Array.isArray(ids) || ids.some(id => !/^\d{8}-\d{6}-[a-f0-9]{4}$/.test(id))) return json({ error: 'Bad ids' }, 400);
    await Promise.all(ids.map(id => env.MESSAGES.delete(`msg:${id}`)));
    return json({ ok: true, cleared: ids.length });
  }
  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/messages') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request.headers.get('Origin')) });
      if (request.method === 'POST') return receive(request, env, ctx);
    }
    if (url.pathname === '/inbox' || url.pathname === '/inbox/clear') return inbox(request, env, url);
    return json({ error: 'Not found' }, 404);
  },
};
