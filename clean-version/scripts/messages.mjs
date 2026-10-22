import { PAD, PENS, LIMITS, checkMessage, drawingSvg } from '../assets/messages.js';
import { SPRITE } from '../assets/lander.js';

const formatDate = value => new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
const paragraphs = (value, escape) => value.trim().split(/\n{2,}/).map(part => `<p>${escape(part).replaceAll('\n', '<br>')}</p>`).join('');
const capitalize = value => value[0].toUpperCase() + value.slice(1);
// The page shows this many answered messages before a "show more" fold.
const SHOWN = 10;
// The handwritten note's arrows, drawn like the homepage's "play here" arrow:
// a curving shaft and its head. One curls down into the sheet from above it;
// the other, for wide windows where the note sits beside the sheet, swoops
// right into its left edge.
const ARROWS = {
  down: { box: '0 0 260 84', paths: ['M206 15C228 14 246 32 247 64', 'M242.2 56.4Q244.8 60.5 247 64Q248.6 60 250.7 55.8'] },
  side: { box: '0 0 170 100', paths: ['M118 54C132 66 149 63 164 50', 'M156.8 50.6Q160.6 50.2 164 50Q162.6 53.4 161.6 56.8'] },
};
// Icons on the site's 24-unit grid. Type's cursor blinks and Draw's squiggle
// draws itself while chosen; the rocket on Send launches with each message,
// trailing the lander's flame colors.
const ICONS = {
  type: '<path d="M3.5 7V5h11v2M9 5v14m-2 0h4"/><path class="message-cursor" d="M18.5 9v10"/>',
  draw: '<path d="m15 3.5 3.5 3.5L8 17.5H4.5V14L15 3.5Z"/><path class="message-squiggle" pathLength="1" d="M10 21c2.5-2 4.5 1.5 7-.5s3-1 3.5-1"/>',
  eraser: '<path d="m7.5 20-3.9-3.9a2 2 0 0 1 0-2.8l9.6-9.6a2 2 0 0 1 2.8 0l4.3 4.3a2 2 0 0 1 0 2.8L12.5 20Zm0 0h13M9 8.6l6.4 6.4"/>',
  rocket: '<defs><linearGradient id="message-flame" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1c1"/><stop offset=".45" stop-color="#ffb13b"/><stop offset="1" stop-color="#ff6a2b"/></linearGradient></defs><path class="message-flame" d="M9.2 12.7Q5.2 15 2.6 21.4Q9 18.8 11.3 14.8Z"/><path d="M20 4c-5 0-9 3-11 8l3 3c5-2 8-6 8-11Z"/><path d="M9 12 5 13l-1 3 3-1m5 0-1 4 3-1 1-3"/><circle cx="15.5" cy="8.5" r="1.2"/>',
};
const glyph = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

// Published messages live in content/messages.json, newest first, as
// { id, date, name, text, drawing, answer, answered }. Only answered messages
// can be published; the reply tool writes them.
export function validateMessages(messages) {
  if (!Array.isArray(messages)) throw new Error('content/messages.json must be a list');
  const ids = new Set();
  for (const entry of messages) {
    if (!/^[\w-]+$/.test(entry?.id ?? '') || ids.has(entry.id)) throw new Error(`Invalid or duplicate message id: ${entry?.id}`);
    ids.add(entry.id);
    for (const field of ['date', 'answered']) if (!/^\d{4}-\d{2}-\d{2}$/.test(entry[field] ?? '')) throw new Error(`Message ${entry.id} needs a ${field} date`);
    if (!entry.answer?.trim()) throw new Error(`Message ${entry.id} needs an answer before it can be published`);
    const { error } = checkMessage(entry);
    if (error) throw new Error(`Message ${entry.id}: ${error}`);
  }
}

// A message as the visitor wrote or drew it, then Jordan's answer in the
// lander's gold, marked with the lander itself.
function entry(message, escape) {
  const drawing = message.drawing ? drawingSvg(message.drawing, message.name ? `A drawing from ${message.name}` : 'A visitor’s drawing') : '';
  return `<li class="message-entry" id="message-${escape(message.id)}"><div class="message-from">${message.text ? `<div class="message-text">${paragraphs(message.text, escape)}</div>` : ''}${drawing}<p class="message-meta">— ${message.name ? escape(message.name) : 'Someone'} <span aria-hidden="true">·</span> <time datetime="${message.date}">${formatDate(message.date)}</time></p></div>`
    + `<div class="message-answer"><span class="message-answer-mark">${SPRITE}</span><div class="message-answer-text"><span class="visually-hidden">Jordan’s answer: </span>${paragraphs(message.answer, escape)}</div></div></li>`;
}

function answers(messages, escape) {
  if (!messages.length) return '<p class="message-empty">No answers yet. Yours could be the first.</p>';
  const list = items => `<ol class="message-list">${items.map(message => entry(message, escape)).join('')}</ol>`;
  const more = messages.slice(SHOWN);
  return list(messages.slice(0, SHOWN)) + (more.length ? `<details class="message-more"><summary>Show ${more.length} more</summary>${list(more)}</details>` : '');
}

// The message page: a sheet to write or draw on, then the answered messages.
export function messagePage({ escape, messages, endpoint = '', email, back }) {
  const arrows = Object.entries(ARROWS).map(([side, arrow]) => `<svg class="message-note-arrow is-${side}" viewBox="${arrow.box}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${arrow.paths.map((d, index) => `<path pathLength="1" style="--stroke:${index}" d="${d}"/>`).join('')}</svg>`).join('');
  const note = `<p class="message-note" data-message-note aria-hidden="true"><span class="message-note-text"><span class="message-note-line">write or</span> <span class="message-note-line">draw here</span></span>${arrows}</p>`;
  const modes = `<div class="message-modes" role="group" aria-label="How to write" data-message-modes data-current="type">${[['type', 'Type'], ['draw', 'Draw']].map(([mode, label]) => `<button type="button" class="message-mode" data-mode="${mode}" aria-pressed="${mode === 'type'}">${glyph(mode)}<span>${label}</span></button>`).join('')}</div>`;
  const pens = `<div class="message-pens" role="group" aria-label="Pen">${PENS.map(pen => `<button type="button" class="message-pen" data-pen="${pen}" aria-pressed="${pen === 'ink'}" aria-label="${capitalize(pen)}" title="${capitalize(pen)}" style="color:var(--${pen === 'ink' ? 'ink' : `pen-${pen}`})"></button>`).join('')}`
    + `<span class="message-pens-gap" aria-hidden="true"></span><button type="button" class="message-eraser" data-pen="eraser" aria-pressed="false">${glyph('eraser')}<span>Eraser</span></button><button type="button" class="message-clear" data-clear>Clear</button></div>`;
  return `<main class="page message-page" id="main"><a class="back-link" href="/">${back} Back to Home</a><h1 class="page-title">message me</h1><p class="page-subtitle message-intro">Feel free to say hello, ask a question, or draw something. I read and respond to every message :)</p>`
    + `<p class="message-fallback" data-message-fallback>Sending a message needs JavaScript. You can also email me at <a href="mailto:${escape(email)}">${escape(email)}</a>.</p>`
    + `<form class="message-form" data-message-form data-endpoint="${escape(endpoint)}" hidden>${note}`
    + `<div class="message-sheet"><label class="visually-hidden" for="message-text">Your message</label><textarea id="message-text" name="text" maxlength="${LIMITS.text}" placeholder="Hi Jordan…"></textarea>`
    + `<div class="message-pad" data-message-pad data-tool="pen" hidden><canvas class="message-canvas" width="${PAD.width}" height="${PAD.height}" aria-label="Drawing pad. Draw with a mouse, finger, or pen; or switch to Type."></canvas>${pens}</div>`
    + `<span class="message-count" data-message-count>0 / ${LIMITS.text}</span></div>`
    + `<div class="message-controls">${modes}<label class="visually-hidden" for="message-name">Your name (optional)</label><input id="message-name" class="message-name" name="name" maxlength="${LIMITS.name}" autocomplete="name" placeholder="Your name (optional)">`
    + `<button type="submit" class="message-send"><span data-message-send-label>Send</span><span class="message-rocket">${glyph('rocket')}</span></button></div>`
    + `<div class="message-trap" aria-hidden="true"><label for="message-website">Leave this empty</label><input id="message-website" name="website" tabindex="-1" autocomplete="off"></div>`
    + `<p class="message-status" data-message-status role="status"></p></form>`
    + `<section class="message-answers" aria-labelledby="answers"><h2 class="section-title" id="answers">Answers</h2>${answers(messages, escape)}</section></main>`;
}
