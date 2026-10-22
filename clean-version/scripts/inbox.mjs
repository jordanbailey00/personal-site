import { readFile, writeFile, mkdir, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { checkMessage } from '../assets/messages.js';

// The private inbox behind "message me": each message a visitor sends
// is a JSON file in inbox/, which never ships with the site. Publishing copies
// one, with Jordan's answer, into content/messages.json for the next build.
const ID = /^\d{8}-\d{6}-[a-f0-9]{4}$/;
// Indented JSON, but with each drawing stroke's numbers, and the list of pen
// colors, kept on one line.
const json = value => `${JSON.stringify(value, null, 2)
  .replace(/\[\s+([-\d.,\s]+?)\s+\]/g, (_, numbers) => `[${numbers.replace(/\s+/g, '')}]`)
  .replace(/\[\s+((?:"[a-z]+",?\s+)+)\]/g, (_, names) => `[${names.trim().replace(/,\s+/g, ',')}]`)}\n`;
// Days by this computer's clock: by UTC, a message sent on an American evening
// would be dated tomorrow. Ids stay in UTC so they sort in the order sent.
const day = when => `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')}`;

export function inboxAt(root) {
  const folder = path.join(root, 'inbox'), archive = path.join(folder, 'archived'), publishedFile = path.join(root, 'content/messages.json');
  const read = async file => JSON.parse(await readFile(file, 'utf8'));
  const fileFor = id => path.join(folder, `${id}.json`);
  async function published() {
    try { return await read(publishedFile); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  }
  async function waiting(id) {
    if (!ID.test(id ?? '')) return null;
    try { return await read(fileFor(id)); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }

  return {
    // New messages first, then the published ones.
    async list() {
      await mkdir(folder, { recursive: true });
      const files = (await readdir(folder)).filter(name => name.endsWith('.json')).sort().reverse();
      return { inbox: await Promise.all(files.map(name => read(path.join(folder, name)))), published: await published() };
    },
    async receive(payload, now = new Date()) {
      // Bots fill in the hidden field or send the instant a page opens; take
      // their message and quietly drop it.
      if (payload?.website || !(payload?.elapsed >= 2500)) return { dropped: true };
      const { message, error } = checkMessage(payload);
      if (error) return { error };
      const id = `${now.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-')}-${randomBytes(2).toString('hex')}`;
      await mkdir(folder, { recursive: true });
      await writeFile(fileFor(id), json({ id, received: now.toISOString(), ...message }));
      return { id };
    },
    async publish(id, answer, now = new Date()) {
      const message = await waiting(id);
      if (!message) return { error: 'That message is not in the inbox.' };
      if (!answer?.trim()) return { error: 'Write an answer first.' };
      const list = await published();
      list.unshift({ id, date: day(new Date(message.received)), name: message.name, text: message.text, drawing: message.drawing, answer: answer.trim(), answered: day(now) });
      await writeFile(publishedFile, json(list));
      await rm(fileFor(id));
      return { ok: true };
    },
    async update(id, answer) {
      const list = await published(), message = list.find(each => each.id === id);
      if (!message) return { error: 'That message is not published.' };
      if (!answer?.trim()) return { error: 'An answer cannot be empty.' };
      message.answer = answer.trim();
      await writeFile(publishedFile, json(list));
      return { ok: true };
    },
    // Takes a message off the site and puts it back in the inbox.
    async unpublish(id) {
      const list = await published(), message = list.find(each => each.id === id);
      if (!message || !ID.test(id)) return { error: 'That message is not published.' };
      await mkdir(folder, { recursive: true });
      // Noon on its day, by the same clock, so publishing it again keeps the date.
      await writeFile(fileFor(id), json({ id, received: new Date(`${message.date}T12:00:00`).toISOString(), name: message.name, text: message.text, drawing: message.drawing, answer: message.answer }));
      await writeFile(publishedFile, json(list.filter(each => each.id !== id)));
      return { ok: true };
    },
    // Keeps a message out of the way without deleting it.
    async archive(id) {
      if (!(await waiting(id))) return { error: 'That message is not in the inbox.' };
      await mkdir(archive, { recursive: true });
      await rename(fileFor(id), path.join(archive, `${id}.json`));
      return { ok: true };
    },
  };
}
