import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkMessage, drawingBounds, drawingPath, drawingSvg, eraseAt, LIMITS, penRuns } from '../assets/messages.js';
import { messagePage, validateMessages } from './messages.mjs';
import { inboxAt } from './inbox.mjs';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const doodle = { strokes: [[10, 10, 20, 20, 30, 15], [100, 100]] };
const published = (details = {}) => ({ id: '20261021-120000-abcd', date: '2026-10-21', name: 'Alex', text: 'Hello!', drawing: null, answer: 'Hi Alex.', answered: '2026-10-22', ...details });

test('A message needs words or a drawing, within limits', () => {
  assert.deepEqual(checkMessage({ name: '  Alex ', text: ' Hi\r\nthere ' }).message, { name: 'Alex', text: 'Hi\nthere', drawing: null });
  assert.deepEqual(checkMessage({ drawing: doodle }).message.drawing, doodle);
  assert.match(checkMessage({ text: '   ' }).error, /Write or draw/);
  assert.match(checkMessage({ text: 'x'.repeat(LIMITS.text + 1) }).error, /up to 1000/);
  assert.match(checkMessage({ name: 'x'.repeat(LIMITS.name + 1), text: 'Hi' }).error, /up to 40/);
  assert.match(checkMessage({ drawing: { strokes: [[1, 2, 3]] } }).error, /could not be read/);
  assert.match(checkMessage({ drawing: { strokes: [[1.5, 2]] } }).error, /could not be read/);
  assert.match(checkMessage({ drawing: { strokes: [[601, 2]] } }).error, /could not be read/);
  const crowded = Array.from({ length: 51 }, () => Array.from({ length: 200 }, (_, index) => index % 2 ? 1 : 2));
  assert.match(checkMessage({ drawing: { strokes: crowded } }).error, /too detailed/);
});

test('Drawings may name a pen color for each stroke', () => {
  assert.deepEqual(checkMessage({ drawing: { ...doodle, colors: ['red', 'ink'] } }).message.drawing, { ...doodle, colors: ['red', 'ink'] });
  assert.deepEqual(checkMessage({ drawing: { ...doodle, colors: ['ink', 'ink'] } }).message.drawing, doodle, 'all-ink drawings need no colors');
  assert.match(checkMessage({ drawing: { ...doodle, colors: ['red'] } }).error, /could not be read/, 'one color per stroke');
  assert.match(checkMessage({ drawing: { ...doodle, colors: ['red', 'url(x)'] } }).error, /could not be read/, 'only the palette');
  const runs = penRuns({ strokes: [[1, 1], [2, 2], [3, 3], [4, 4]], colors: ['ink', 'ink', 'red', 'ink'] });
  assert.deepEqual(runs.map(run => [run.pen, run.strokes.length]), [['ink', 2], ['red', 1], ['ink', 1]], 'runs keep the drawing order');
  assert.match(drawingSvg({ ...doodle, colors: ['blue', 'ink'] }, 'x'), /<path class="pen-blue" d="M10 10L20 20L30 15"\/><path d="M100 100h0\.01"\/>/);
});

test('The eraser cuts away only what it touches, and keeps each piece’s color', () => {
  const line = { strokes: [[0, 50, 100, 50]], colors: ['green'] };
  // A circle of radius 10 at the middle of a straight line splits it in two.
  assert.deepEqual(eraseAt(line, 50, 50, 10), { strokes: [[0, 50, 40, 50], [60, 50, 100, 50]], colors: ['green', 'green'] });
  assert.deepEqual(eraseAt(line, 50, 80, 10), { strokes: line.strokes, colors: ['green'] }, 'out of reach');
  assert.deepEqual(eraseAt(line, 2, 50, 10), { strokes: [[12, 50, 100, 50]], colors: ['green'] }, 'trims an end');
  assert.deepEqual(eraseAt({ strokes: [[5, 5], [80, 80]] }, 6, 6, 10), { strokes: [[80, 80]], colors: ['ink'] }, 'dots go whole');
  assert.deepEqual(eraseAt({ strokes: [[48, 50, 52, 50]] }, 50, 50, 10).strokes, [], 'strokes inside the circle vanish');
  const zigzag = { strokes: [[0, 0, 30, 30, 60, 0, 90, 30]] };
  const [left, right] = eraseAt(zigzag, 60, 0, 10).strokes;
  assert.deepEqual(left.slice(0, 4), [0, 0, 30, 30], 'the start survives');
  assert.deepEqual(right.slice(-2), [90, 30], 'so does the end');
  for (const [x, y] of [left.slice(-2), right.slice(0, 2)]) assert.ok(Math.abs(Math.hypot(x - 60, y) - 10) <= 1, 'cut on the circle');
});

test('Drawings become one SVG path, with taps as dots', () => {
  assert.equal(drawingPath(doodle), 'M10 10L20 20L30 15M100 100h0.01');
});

test('The message page renders answers safely, newest first', () => {
  const html = messagePage({ escape, email: 'jordan@example.com', back: '←', messages: [
    published({ name: '<b>Alex</b>', text: 'Line one\nline two\n\n<script>alert(1)</script>', answer: 'Thanks & hello' }),
    published({ id: '20261020-090000-beef', date: '2026-10-20', name: '', text: '', drawing: doodle }),
  ] });
  assert.match(html, /<h1 class="page-title">message me<\/h1>/);
  assert.match(html, /Feel free to say hello, ask a question, or draw something\. I read and respond to every message :\)/);
  assert.match(html, /<span class="message-note-line">write or<\/span> <span class="message-note-line">draw here<\/span>/);
  assert.match(html, /data-mode="type" aria-pressed="true"/);
  assert.equal(html.match(/class="message-pen"/g).length, 6, 'a swatch for each pen');
  assert.match(html, /data-pen="eraser" aria-pressed="false"/);
  assert.ok(!html.includes('data-undo'), 'the eraser replaces undo');
  assert.match(html, /<h2 class="section-title" id="answers">Answers<\/h2>/);
  assert.ok(!html.includes('<script>') && !html.includes('<b>Alex'), 'visitor text is escaped');
  assert.match(html, /<p>Line one<br>line two<\/p><p>&lt;script&gt;alert\(1\)&lt;\/script&gt;<\/p>/);
  assert.match(html, /<div class="message-answer-text"><span class="visually-hidden">Jordan’s answer: <\/span><p>Thanks &amp; hello<\/p><\/div>/);
  assert.match(html, /<span class="message-answer-mark"><svg viewBox="0 0 48 48"/, 'answers are marked with the lander');
  assert.match(html, /aria-label="A visitor’s drawing"><path d="M10 10L20 20L30 15M100 100h0\.01"\/>/);
  assert.ok(html.indexOf('message-20261021') < html.indexOf('message-20261020'));
  assert.match(html, /— Someone <span aria-hidden="true">·<\/span> <time datetime="2026-10-20">October 20, 2026<\/time>/);
  assert.match(html, /data-endpoint=""/);
  assert.ok(!html.includes('message-more'));
  assert.match(drawingSvg(doodle, 'A drawing from "Al" <b>'), /aria-label="A drawing from &#34;Al&#34; &#60;b&#62;"/);
});

test('Published drawings are cropped to what was drawn, at the pad’s scale', () => {
  assert.deepEqual(drawingBounds(doodle), { x: 4, y: 4, width: 102, height: 102 });
  // 102 of the pad's 600 units: 17% of the width, or of 460 pixels at most.
  assert.match(drawingSvg(doodle, 'x'), /viewBox="4 4 102 102" style="width:min\(17%,78\.2px\)"/);
  const wide = { strokes: [[0, 120, 600, 120]] };
  assert.match(drawingSvg(wide, 'x'), /viewBox="-6 114 612 12" style="width:min\(102%,469\.2px\)"/, 'a stroke along the edge keeps its round ends');
});

test('Long lists fold after ten, and an empty list invites the first message', () => {
  const many = Array.from({ length: 12 }, (_, index) => published({ id: `20261021-1200${String(index).padStart(2, '0')}-abcd` }));
  assert.match(messagePage({ escape, email: 'a@b.c', back: '', messages: many }), /<summary>Show 2 more<\/summary>/);
  assert.match(messagePage({ escape, email: 'a@b.c', back: '', messages: [] }), /No answers yet\. Yours could be the first\./);
});

test('Only answered, well-formed messages can be published', () => {
  assert.doesNotThrow(() => validateMessages([published()]));
  assert.throws(() => validateMessages([published({ answer: ' ' })]), /needs an answer/);
  assert.throws(() => validateMessages([published(), published()]), /duplicate/);
  assert.throws(() => validateMessages([published({ answered: undefined })]), /answered date/);
  assert.throws(() => validateMessages([published({ text: '', drawing: null })]), /Write or draw/);
});

test('The inbox keeps messages private until one is published with an answer', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'site-inbox-'));
  try {
    await mkdir(path.join(root, 'content'));
    await writeFile(path.join(root, 'content/messages.json'), '[]\n');
    // 10:04 pm on October 21 by this computer's clock, whatever its time zone.
    const inbox = inboxAt(root), evening = new Date(2026, 9, 21, 22, 4, 5);
    assert.deepEqual(await inbox.receive({ text: 'Hi', elapsed: 500 }), { dropped: true }, 'too quick to be a person');
    assert.deepEqual(await inbox.receive({ text: 'Hi', website: 'spam.example', elapsed: 9000 }), { dropped: true }, 'the hidden field was filled');
    assert.match((await inbox.receive({ text: '', elapsed: 9000 })).error, /Write or draw/);
    const { id } = await inbox.receive({ name: 'Alex', text: 'Hi Jordan', drawing: doodle, elapsed: 9000 }, evening);
    assert.match(id, /^\d{8}-\d{6}-[a-f0-9]{4}$/);
    const saved = await readFile(path.join(root, 'inbox', `${id}.json`), 'utf8');
    assert.match(saved, /\[10,10,20,20,30,15\]/, 'strokes stay on one line');
    assert.equal((await inbox.list()).inbox.length, 1);
    assert.deepEqual(JSON.parse(await readFile(path.join(root, 'content/messages.json'), 'utf8')), [], 'nothing is published automatically');

    assert.match((await inbox.publish(id, '  ')).error, /Write an answer/);
    assert.deepEqual(await inbox.publish(id, ' Hello Alex! ', new Date(2026, 9, 22, 9)), { ok: true });
    let site = JSON.parse(await readFile(path.join(root, 'content/messages.json'), 'utf8'));
    assert.deepEqual(site, [{ id, date: '2026-10-21', name: 'Alex', text: 'Hi Jordan', drawing: doodle, answer: 'Hello Alex!', answered: '2026-10-22' }], 'an evening message keeps its own day');
    assert.doesNotThrow(() => validateMessages(site));
    assert.deepEqual((await inbox.list()).inbox, []);

    await inbox.update(id, 'Hello again!');
    site = JSON.parse(await readFile(path.join(root, 'content/messages.json'), 'utf8'));
    assert.equal(site[0].answer, 'Hello again!');
    await inbox.unpublish(id);
    assert.deepEqual(JSON.parse(await readFile(path.join(root, 'content/messages.json'), 'utf8')), []);
    const [back] = (await inbox.list()).inbox;
    assert.equal(back.answer, 'Hello again!', 'the draft answer returns with it');
    assert.equal(new Date(back.received).toDateString(), evening.toDateString(), 'and so does its day');
    await inbox.archive(id);
    assert.deepEqual((await inbox.list()).inbox, []);
    assert.deepEqual(await readdir(path.join(root, 'inbox/archived')), [`${id}.json`]);
    assert.match((await inbox.publish('../../content/messages', 'x')).error, /not in the inbox/, 'ids cannot reach other files');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
