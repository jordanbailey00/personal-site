// "message me": on the message page, visitors type or draw a note and send
// it. Nothing they send appears on the site by itself: Jordan answers messages
// in a private reply tool and chooses which ship with the next deploy. This
// module holds the message rules (shared with that tool's server and the
// build) and the form.

// A drawing lives on a 600 × 240 grid as strokes of whole-number points, so it
// can be redrawn later as a crisp SVG in whichever theme the reader uses.
export const PAD = { width: 600, height: 240 };
export const LIMITS = { name: 40, text: 1000, strokes: 200, points: 5000 };
// Pen colors, by name. Ink is the theme's text color; messages.css holds the
// others' values, so the pad, the swatches, and published drawings agree.
export const PENS = ['ink', 'red', 'orange', 'green', 'blue', 'purple'];
// The eraser's radius, in pad units.
const ERASER = 10;

// Returns { message } with a clean copy, or { error } saying what to fix.
export function checkMessage(input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const text = typeof input?.text === 'string' ? input.text.replace(/\r\n?/g, '\n').trim() : '';
  if (name.length > LIMITS.name) return { error: `Names can be up to ${LIMITS.name} characters.` };
  if (text.length > LIMITS.text) return { error: `Messages can be up to ${LIMITS.text} characters.` };
  let drawing = null;
  if (input?.drawing != null) {
    const { strokes, colors } = input.drawing;
    if (!Array.isArray(strokes) || strokes.length > LIMITS.strokes) return { error: 'That drawing has too many lines.' };
    // Colors are optional: one pen name per stroke.
    if (colors != null && (!Array.isArray(colors) || colors.length !== strokes.length || colors.some(pen => !PENS.includes(pen)))) return { error: 'That drawing could not be read.' };
    let points = 0;
    for (const stroke of strokes) {
      if (!Array.isArray(stroke) || stroke.length < 2 || stroke.length % 2) return { error: 'That drawing could not be read.' };
      for (let index = 0; index < stroke.length; index += 2) {
        const x = stroke[index], y = stroke[index + 1];
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x > PAD.width || y > PAD.height) return { error: 'That drawing could not be read.' };
      }
      points += stroke.length / 2;
    }
    if (points > LIMITS.points) return { error: 'That drawing is too detailed.' };
    if (strokes.length) {
      drawing = { strokes: strokes.map(stroke => [...stroke]) };
      if (colors?.some(pen => pen !== 'ink')) drawing.colors = [...colors];
    }
  }
  if (!text && !drawing) return { error: 'Write or draw something first.' };
  return { message: { name, text, drawing } };
}

// Strokes as one SVG path; a single tap becomes a dot.
export function drawingPath({ strokes }) {
  return strokes.map(stroke => {
    let path = `M${stroke[0]} ${stroke[1]}`;
    if (stroke.length === 2) return `${path}h0.01`;
    for (let index = 2; index < stroke.length; index += 2) path += `L${stroke[index]} ${stroke[index + 1]}`;
    return path;
  }).join('');
}

// Runs of consecutive strokes in one color, in drawing order, so each run can
// be one path while later strokes still cover earlier ones.
export function penRuns({ strokes, colors }) {
  const runs = [];
  strokes.forEach((stroke, index) => {
    const pen = colors?.[index] ?? 'ink';
    if (runs.at(-1)?.pen === pen) runs.at(-1).strokes.push(stroke);
    else runs.push({ pen, strokes: [stroke] });
  });
  return runs;
}

// The part of the pad a drawing covers, with room around it for the pen.
export function drawingBounds({ strokes }, margin = 6) {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const stroke of strokes) {
    for (let index = 0; index < stroke.length; index += 2) {
      left = Math.min(left, stroke[index]);
      right = Math.max(right, stroke[index]);
      top = Math.min(top, stroke[index + 1]);
      bottom = Math.max(bottom, stroke[index + 1]);
    }
  }
  return { x: left - margin, y: top - margin, width: right - left + 2 * margin, height: bottom - top + 2 * margin };
}

// A drawing as an SVG image, cropped to what was drawn. Ink follows the
// reader's theme. It keeps the pad's scale, so every drawing shows at the same
// size: the whole pad would be 460 pixels wide, or the full width on a phone.
export function drawingSvg(drawing, label) {
  const { x, y, width, height } = drawingBounds(drawing);
  const share = +(width / PAD.width * 100).toFixed(2);
  const safe = String(label).replace(/[&<>"']/g, character => `&#${character.charCodeAt(0)};`);
  const paths = penRuns(drawing).map(run => `<path${run.pen === 'ink' ? '' : ` class="pen-${run.pen}"`} d="${drawingPath(run)}"/>`).join('');
  return `<svg class="message-drawing" viewBox="${x} ${y} ${width} ${height}" style="width:min(${share}%,${+(share * 4.6).toFixed(1)}px)" role="img" aria-label="${safe}">${paths}</svg>`;
}

// The parts of one stroke outside a circle: an eraser cuts each segment where
// it enters and leaves the circle, so long straight lines erase cleanly too.
function cutStroke(stroke, cx, cy, radius) {
  if (stroke.length === 2) return Math.hypot(stroke[0] - cx, stroke[1] - cy) <= radius ? [] : [stroke];
  const pieces = [];
  let piece = [];
  const add = (px, py) => {
    const x = Math.round(px), y = Math.round(py);
    if (piece.at(-2) !== x || piece.at(-1) !== y) piece.push(x, y);
  };
  // Keeps a piece unless it is a crumb too small to see.
  const end = () => {
    let length = 0;
    for (let index = 2; index < piece.length; index += 2) length += Math.hypot(piece[index] - piece[index - 2], piece[index + 1] - piece[index - 1]);
    if (length >= 2) pieces.push(piece);
    piece = [];
  };
  for (let index = 0; index + 3 < stroke.length; index += 2) {
    const ax = stroke[index], ay = stroke[index + 1], dx = stroke[index + 2] - ax, dy = stroke[index + 3] - ay;
    // Where the segment enters and leaves the circle, as fractions of its length.
    const a = dx * dx + dy * dy, b = 2 * ((ax - cx) * dx + (ay - cy) * dy), c = (ax - cx) ** 2 + (ay - cy) ** 2 - radius * radius;
    let enter = 1, leave = 0;
    if (!a) {
      if (c <= 0) [enter, leave] = [0, 1];
    } else if (b * b - 4 * a * c > 0) {
      const root = Math.sqrt(b * b - 4 * a * c);
      enter = Math.max(0, (-b - root) / (2 * a));
      leave = Math.min(1, (-b + root) / (2 * a));
    }
    if (enter >= leave) {
      add(ax, ay);
      add(ax + dx, ay + dy);
      continue;
    }
    if (enter > 0) {
      add(ax, ay);
      add(ax + enter * dx, ay + enter * dy);
    }
    end();
    if (leave < 1) {
      add(ax + leave * dx, ay + leave * dy);
      add(ax + dx, ay + dy);
    }
  }
  end();
  return pieces;
}

// Erases what lies within the eraser's circle; what is left keeps its color.
export function eraseAt({ strokes, colors }, x, y, radius = ERASER) {
  const kept = { strokes: [], colors: [] };
  strokes.forEach((stroke, index) => {
    for (const piece of cutStroke(stroke, x, y, radius)) {
      kept.strokes.push(piece);
      kept.colors.push(colors?.[index] ?? 'ink');
    }
  });
  return kept;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function installMessages({ document, window }) {
  const form = document.querySelector('[data-message-form]');
  if (!form) return null;
  // On the live site the form sends to the inbox service named in the page;
  // on this computer it sends to the development server's inbox.
  const local = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
  const endpoint = form.dataset.endpoint || (local ? '/api/messages' : '');
  const text = form.querySelector('#message-text'), name = form.querySelector('#message-name'), trap = form.querySelector('#message-website');
  const pad = form.querySelector('[data-message-pad]'), canvas = pad.querySelector('canvas'), context = canvas.getContext('2d');
  const switcher = form.querySelector('[data-message-modes]'), modes = [...switcher.querySelectorAll('[data-mode]')], pens = [...pad.querySelectorAll('[data-pen]')];
  const send = form.querySelector('[type="submit"]'), sendLabel = send.querySelector('[data-message-send-label]');
  const count = form.querySelector('[data-message-count]'), status = form.querySelector('[data-message-status]');
  const opened = Date.now();
  let strokes = [], colors = [], current = null, erasing = null, mode = 'type', pen = 'ink', resting = false, inks = null;

  document.querySelector('[data-message-fallback]')?.setAttribute('hidden', '');
  form.hidden = false;
  const say = message => { status.textContent = message; };

  // The handwritten note, like the homepage's "play here", writes itself in
  // once its font has loaded, and writes again to answer a sent message.
  const note = form.querySelector('[data-message-note]'), noteText = note?.querySelector('.message-note-text');
  const noteLines = note ? [...note.querySelectorAll('.message-note-line')] : [];
  const prompt = noteLines.map(line => line.textContent);
  if (note) {
    const show = () => note.classList.add('is-ready');
    if (!document.fonts?.load) show();
    else Promise.race([document.fonts.load('34px "Reenie Beanie"'), new Promise(resolve => window.setTimeout(resolve, 1500))]).then(show, show);
  }
  function scribble(lines) {
    if (!noteText || noteLines.every((line, index) => line.textContent === lines[index])) return;
    noteLines.forEach((line, index) => { line.textContent = lines[index]; });
    noteText.style.animation = 'none';
    void noteText.offsetWidth;
    noteText.style.animation = '';
  }
  const points = () => strokes.reduce((total, stroke) => total + stroke.length / 2, 0) + (current ? current.length / 2 : 0);

  // Pen colors come from the page's styles, read again when the theme changes.
  function readInks() {
    const style = window.getComputedStyle(document.documentElement);
    return Object.fromEntries(PENS.map(name => [name, style.getPropertyValue(name === 'ink' ? '--ink' : `--pen-${name}`).trim() || '#888']));
  }
  function paint() {
    if (!canvas.width) return;
    context.setTransform(canvas.width / PAD.width, 0, 0, canvas.height / PAD.height, 0, 0);
    context.clearRect(0, 0, PAD.width, PAD.height);
    inks ||= readInks();
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    const drawing = current ? { strokes: [...strokes, current], colors: [...colors, pen] } : { strokes, colors };
    for (const run of penRuns(drawing)) {
      context.strokeStyle = inks[run.pen];
      context.stroke(new window.Path2D(drawingPath(run)));
    }
  }
  function fit() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);
    paint();
  }
  // Notes what will be sent from the other mode, and the characters left.
  function update() {
    count.textContent = `${text.value.length} / ${LIMITS.text}`;
    if (resting) return;
    if (mode === 'type' && strokes.length) say('Your drawing will be sent too.');
    else if (mode === 'draw' && text.value.trim()) say('Your note will be sent too.');
    else say('');
  }
  function setMode(next) {
    mode = next;
    switcher.dataset.current = next;
    for (const button of modes) button.setAttribute('aria-pressed', String(button.dataset.mode === next));
    text.hidden = next !== 'type';
    count.hidden = next !== 'type';
    pad.hidden = next !== 'draw';
    if (next === 'draw') fit();
    update();
  }
  function setPen(next) {
    pen = next;
    pad.dataset.tool = next === 'eraser' ? 'eraser' : 'pen';
    for (const button of pens) button.setAttribute('aria-pressed', String(button.dataset.pen === next));
  }
  for (const button of modes) button.addEventListener('click', () => setMode(button.dataset.mode));
  for (const button of pens) button.addEventListener('click', () => setPen(button.dataset.pen));
  text.addEventListener('input', update);

  const at = event => {
    const rect = canvas.getBoundingClientRect();
    return [clamp(Math.round((event.clientX - rect.left) / rect.width * PAD.width), 0, PAD.width), clamp(Math.round((event.clientY - rect.top) / rect.height * PAD.height), 0, PAD.height)];
  };
  // The eraser rubs along the pointer's path in steps half its width, so a
  // quick swipe leaves nothing behind.
  function rub([x, y]) {
    const [fromX, fromY] = erasing.last ?? [x, y];
    const steps = Math.max(1, Math.ceil(Math.hypot(x - fromX, y - fromY) / (ERASER / 2)));
    let drawing = { strokes, colors };
    for (let step = 1; step <= steps; step++) drawing = eraseAt(drawing, fromX + (x - fromX) * step / steps, fromY + (y - fromY) * step / steps);
    // Cutting can split strokes; stop short of the stroke limit.
    if (drawing.strokes.length <= LIMITS.strokes) ({ strokes, colors } = drawing);
    erasing.last = [x, y];
  }
  canvas.addEventListener('pointerdown', event => {
    if (pen !== 'eraser' && (strokes.length >= LIMITS.strokes || points() >= LIMITS.points)) return say('The page is full. Erase or clear to keep drawing.');
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    if (pen === 'eraser') {
      erasing = { last: null };
      rub(at(event));
    } else {
      current = at(event);
    }
    paint();
  });
  canvas.addEventListener('pointermove', event => {
    if (!current && !erasing) return;
    for (const move of event.getCoalescedEvents?.() ?? [event]) {
      const [x, y] = at(move);
      if (erasing) { rub([x, y]); continue; }
      // Skip points too close to the last one; they add size, not detail.
      if (Math.hypot(x - current.at(-2), y - current.at(-1)) < 2 || points() >= LIMITS.points) continue;
      current.push(x, y);
    }
    paint();
  });
  const finish = () => {
    if (current) {
      strokes.push(current);
      colors.push(pen);
      current = null;
    }
    erasing = null;
    paint();
    update();
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  pad.querySelector('[data-clear]').addEventListener('click', () => {
    strokes = [];
    colors = [];
    paint();
    update();
  });

  if (!endpoint) {
    send.disabled = true;
    resting = true;
    say('Messages open soon.');
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!endpoint) return;
    const { message, error } = checkMessage({ name: name.value, text: text.value, drawing: strokes.length ? { strokes, colors } : null });
    if (error) return say(error);
    send.disabled = true;
    say('Sending…');
    try {
      const response = await window.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The hidden field and the time on the page help the inbox turn away bots.
        body: JSON.stringify({ ...message, website: trap.value, elapsed: Date.now() - opened }),
      });
      if (!response.ok) throw Error(`The inbox answered ${response.status}`);
      text.value = '';
      strokes = [];
      colors = [];
      paint();
      update();
      resting = true;
      // The rocket on the button launches with the message.
      send.classList.remove('is-back');
      send.classList.add('is-sent');
      sendLabel.textContent = 'Sent!';
      say('Sent. Thank you! I read and respond to every message.');
      scribble(['got it,', 'thanks!']);
      // A short pause keeps an eager double-click from sending twice.
      window.setTimeout(() => {
        send.disabled = false;
        resting = false;
        send.classList.replace('is-sent', 'is-back');
        sendLabel.textContent = 'Send';
        scribble(prompt);
      }, 15000);
    } catch {
      send.disabled = false;
      say('That didn’t send. Please try again in a moment.');
    }
  });
  window.addEventListener('resize', () => { if (mode === 'draw') fit(); });
  new window.MutationObserver(() => { inks = readInks(); paint(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  update();
  return { setMode, setPen, get strokes() { return strokes; }, get colors() { return colors; } };
}

if (typeof window !== 'undefined') installMessages({ document, window });
