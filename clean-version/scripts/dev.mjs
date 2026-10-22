import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { inboxAt } from './inbox.mjs';

// The local development server: the built site from dist/, plus the inbox for
// "message me". Messages sent from the local site land in inbox/, and
// the reply tool at /inbox/ (never deployed) publishes the ones Jordan answers.
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const host = '127.0.0.1', port = 4173;
const inbox = inboxAt(root);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.pdf': 'application/pdf',
};
const ORIGINS = new Set([`http://${host}:${port}`, `http://localhost:${port}`]);

function reply(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}
// Only JSON from this server's own pages: another website open in the same
// browser cannot post here, since a JSON request from it needs a permission
// this server never grants.
const trusted = request => request.headers['content-type']?.startsWith('application/json') && (!request.headers.origin || ORIGINS.has(request.headers.origin));
function body(request, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on('data', chunk => {
      size += chunk.length;
      if (size > limit) { reject(Object.assign(new Error('Too large'), { status: 413 })); request.destroy(); }
      else chunks.push(chunk);
    });
    request.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(Object.assign(new Error('Not JSON'), { status: 400 })); } });
    request.on('error', reject);
  });
}
// Publishing changes content/messages.json; rebuild so the local site shows it.
function rebuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts/build.mjs')], { stdio: 'inherit' });
    child.on('exit', code => (code ? reject(new Error(`The build exited with ${code}`)) : resolve()));
  });
}

async function file(pathname, response) {
  let target = path.normalize(path.join(dist, decodeURIComponent(pathname)));
  if (target !== dist && !target.startsWith(dist + path.sep)) return reply(response, 403, { error: 'Forbidden' });
  try {
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    const content = await readFile(target);
    response.writeHead(200, { 'Content-Type': TYPES[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': TYPES['.html'] });
    response.end(await readFile(path.join(dist, '404.html')).catch(() => 'Not found'));
  }
}

const ACTIONS = { publish: ({ id, answer }) => inbox.publish(id, answer), update: ({ id, answer }) => inbox.update(id, answer), unpublish: ({ id }) => inbox.unpublish(id), archive: ({ id }) => inbox.archive(id) };

const server = http.createServer(async (request, response) => {
  try {
    const { pathname } = new URL(request.url, `http://${host}:${port}`);
    if (pathname === '/api/messages' && request.method === 'POST') {
      if (!trusted(request)) return reply(response, 403, { error: 'Forbidden' });
      const result = await inbox.receive(await body(request));
      if (result.error) return reply(response, 400, result);
      if (result.id) console.log(`New message in the inbox: ${result.id}. Reply at http://${host}:${port}/inbox/`);
      return reply(response, 201, { ok: true });
    }
    if (pathname === '/inbox' || pathname === '/inbox/') {
      response.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' });
      return response.end(await readFile(path.join(root, 'scripts/reply.html')));
    }
    if (pathname === '/inbox/messages.json') return reply(response, 200, await inbox.list());
    const action = pathname.match(/^\/inbox\/(publish|update|unpublish|archive)$/)?.[1];
    if (action && request.method === 'POST') {
      if (!trusted(request)) return reply(response, 403, { error: 'Forbidden' });
      const result = await ACTIONS[action](await body(request));
      if (result.error) return reply(response, 400, result);
      if (action !== 'archive') await rebuild();
      return reply(response, 200, result);
    }
    return file(pathname, response);
  } catch (error) {
    if (!response.headersSent) reply(response, error.status ?? 500, { error: error.status ? error.message : 'Something went wrong.' });
    if (!error.status) console.error(error);
  }
});
server.listen(port, host, () => {
  console.log(`Site: http://${host}:${port}/`);
  console.log(`Reply to messages: http://${host}:${port}/inbox/`);
});
