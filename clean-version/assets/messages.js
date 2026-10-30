// "message me": on the message page, visitors type and draw a note on one
// sheet and send it. Nothing they send appears on the site by itself: Jordan
// answers messages in a private reply tool and chooses which ship with the next
// deploy. This module holds the message rules (shared with that tool's server
// and the build), the sheet, and the form.

// A drawing lives on a 600 × 240 grid as strokes of whole-number points, so it
// can be redrawn later as a crisp SVG in whichever theme the reader uses.
export const PAD = { width: 600, height: 240 };
export const LIMITS = { name: 40, text: 1000, strokes: 200, points: 5000, words: 60 };
// Pen colors, by name. Ink is the theme's text color; messages.css holds the
// others' values, so the pad, the swatches, and published drawings agree.
export const PENS = ['ink', 'red', 'orange', 'green', 'blue', 'purple'];
// The eraser's radius, in pad units.
const ERASER = 10;
// Words typed on the sheet sit on the same grid as { x, y, text, pen }: x and y
// are the top-left of the first line. Lines break where the writer pressed
// Enter or reached the sheet's right edge, so they read the same everywhere.
export const TYPE = { size: 20, line: 26, family: "'Ubuntu Sans', Arial, sans-serif" };
// Where a line's baseline sits below its top.
const BASELINE = Math.round((TYPE.line - TYPE.size) / 2 + TYPE.size * 0.8);
// About how wide a character is, for sizing where nothing can measure text.
const CHAR = TYPE.size * 0.56;
const onPad = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x <= PAD.width && y <= PAD.height;

// Returns { drawing } with a clean copy (null when nothing was drawn or typed),
// or { error } saying what to fix.
export function checkDrawing(input) {
  if (input == null) return { drawing: null };
  if (typeof input !== 'object' || Array.isArray(input)) return { error: 'That drawing could not be read.' };
  const { strokes = [], colors, words } = input;
  if (!Array.isArray(strokes) || strokes.length > LIMITS.strokes) return { error: 'That drawing has too many lines.' };
  // Colors are optional: one pen name per stroke.
  if (colors != null && (!Array.isArray(colors) || colors.length !== strokes.length || colors.some(pen => !PENS.includes(pen)))) return { error: 'That drawing could not be read.' };
  let points = 0;
  for (const stroke of strokes) {
    if (!Array.isArray(stroke) || stroke.length < 2 || stroke.length % 2) return { error: 'That drawing could not be read.' };
    for (let index = 0; index < stroke.length; index += 2) if (!onPad(stroke[index], stroke[index + 1])) return { error: 'That drawing could not be read.' };
    points += stroke.length / 2;
  }
  if (points > LIMITS.points) return { error: 'That drawing is too detailed.' };
  const kept = [];
  if (words != null) {
    if (!Array.isArray(words) || words.length > LIMITS.words) return { error: 'That note has too many separate bits of writing.' };
    let typed = 0;
    for (const word of words) {
      const { x, y, text, pen = 'ink' } = word ?? {};
      if (!onPad(x, y) || typeof text !== 'string' || !PENS.includes(pen)) return { error: 'That drawing could not be read.' };
      const clean = text.replace(/\r\n?/g, '\n').replace(/\s+$/, '');
      if (!clean.trim()) continue;
      typed += clean.length;
      kept.push(pen === 'ink' ? { x, y, text: clean } : { x, y, text: clean, pen });
    }
    if (typed > LIMITS.text) return { error: `Messages can be up to ${LIMITS.text} characters.` };
  }
  if (!strokes.length && !kept.length) return { drawing: null };
  const drawing = { strokes: strokes.map(stroke => [...stroke]) };
  if (colors?.some(pen => pen !== 'ink')) drawing.colors = [...colors];
  if (kept.length) drawing.words = kept;
  return { drawing };
}

// Returns { message } with a clean copy, or { error } saying what to fix.
export function checkMessage(input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const text = typeof input?.text === 'string' ? input.text.replace(/\r\n?/g, '\n').trim() : '';
  if (name.length > LIMITS.name) return { error: `Names can be up to ${LIMITS.name} characters.` };
  if (text.length > LIMITS.text) return { error: `Messages can be up to ${LIMITS.text} characters.` };
  const { drawing, error } = checkDrawing(input?.drawing);
  if (error) return { error };
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
// Typed lines are sized by an average character width.
export function drawingBounds({ strokes, words = [] }, margin = 6) {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const stroke of strokes) {
    for (let index = 0; index < stroke.length; index += 2) {
      left = Math.min(left, stroke[index]);
      right = Math.max(right, stroke[index]);
      top = Math.min(top, stroke[index + 1]);
      bottom = Math.max(bottom, stroke[index + 1]);
    }
  }
  for (const word of words) {
    const lines = word.text.split('\n');
    left = Math.min(left, word.x);
    top = Math.min(top, word.y);
    right = Math.max(right, Math.round(word.x + Math.max(...lines.map(line => line.length)) * CHAR));
    bottom = Math.max(bottom, word.y + lines.length * TYPE.line);
  }
  return { x: left - margin, y: top - margin, width: right - left + 2 * margin, height: bottom - top + 2 * margin };
}

const escapeXml = value => String(value).replace(/[&<>"']/g, character => `&#${character.charCodeAt(0)};`);

// A drawing as an SVG image, cropped to what was drawn. Ink follows the
// reader's theme. It keeps the pad's scale, so every drawing shows at the same
// size: the whole pad would be 460 pixels wide, or the full width on a phone.
// Typed words stay real text, which readers can select and screen readers hear.
export function drawingSvg(drawing, label) {
  const { x, y, width, height } = drawingBounds(drawing);
  const share = +(width / PAD.width * 100).toFixed(2);
  const words = drawing.words ?? [];
  const spoken = words.length ? `${label}: ${words.map(word => word.text.replace(/\n/g, ' ')).join(' ')}` : label;
  const paths = penRuns(drawing).map(run => `<path${run.pen === 'ink' ? '' : ` class="pen-${run.pen}"`} d="${drawingPath(run)}"/>`).join('');
  const texts = words.map(word => `<text font-size="${TYPE.size}"${word.pen ? ` class="pen-${word.pen}"` : ''}>${word.text.split('\n').map((line, index) => line ? `<tspan x="${word.x}" y="${word.y + BASELINE + index * TYPE.line}">${escapeXml(line)}</tspan>` : '').join('')}</text>`).join('');
  return `<svg class="message-drawing" viewBox="${x} ${y} ${width} ${height}" style="width:min(${share}%,${+(share * 4.6).toFixed(1)}px)" role="img" aria-label="${escapeXml(spoken)}">${paths}${texts}</svg>`;
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

// Breaks typed text into lines no wider than the room left on the sheet,
// between words where it can and inside a word too long for a line.
export function wrapLines(text, room, measure) {
  const lines = [];
  const fits = value => measure(value) <= room;
  for (const paragraph of text.split('\n')) {
    let row = '';
    for (const token of paragraph.match(/\S+\s*|\s+/g) ?? ['']) {
      if (fits((row + token).trimEnd())) { row += token; continue; }
      if (row) lines.push(row.trimEnd());
      let rest = token;
      while (rest.length > 1 && !fits(rest.trimEnd())) {
        let cut = rest.length - 1;
        while (cut > 1 && !fits(rest.slice(0, cut))) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      row = rest;
    }
    lines.push(row.trimEnd());
  }
  return lines;
}

const ERASER_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 20-3.9-3.9a2 2 0 0 1 0-2.8l9.6-9.6a2 2 0 0 1 2.8 0l4.3 4.3a2 2 0 0 1 0 2.8L12.5 20Zm0 0h13M9 8.6l6.4 6.4"/></svg>';
const capitalize = value => value[0].toUpperCase() + value.slice(1);

// The sheet's canvas and its pens, for the message page and the reply tool.
export function sheetMarkup(label = 'Your message. Choose Type, then click anywhere to write there; or choose Draw to draw.') {
  const pens = PENS.map(pen => `<button type="button" class="message-pen" data-pen="${pen}" aria-pressed="${pen === 'ink'}" aria-label="${capitalize(pen)}" title="${capitalize(pen)}" style="color:var(--${pen === 'ink' ? 'ink' : `pen-${pen}`})"></button>`).join('');
  return `<canvas class="message-canvas" width="${PAD.width}" height="${PAD.height}" tabindex="0" aria-label="${escapeXml(label)}"></canvas>`
    + `<div class="message-pens" role="group" aria-label="Pen">${pens}<span class="message-pens-gap" aria-hidden="true"></span><button type="button" class="message-eraser" data-pen="eraser" aria-pressed="false">${ERASER_ICON}<span>Eraser</span></button><button type="button" class="message-clear" data-clear>Clear</button></div>`;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// One sheet to type and draw on. With Type, a click anywhere puts the cursor
// there; clicking earlier words edits them. With Draw, the pens and the eraser
// work on everything, typed words included. Pen colors apply to both.
export function installSheet({ document, window, pad, placeholder = '', onChange = () => {}, onTool = () => {}, say = () => {} }) {
  const canvas = pad.querySelector('canvas'), context = canvas.getContext('2d');
  const pens = [...pad.querySelectorAll('[data-pen]')];
  const font = `${TYPE.size}px ${TYPE.family}`;
  let strokes = [], colors = [], words = [], current = null, erasing = null, tool = 'type', pen = 'ink', inks = null, editing = null;

  const points = () => strokes.reduce((total, stroke) => total + stroke.length / 2, 0) + (current ? current.length / 2 : 0);
  const typed = () => words.reduce((total, word) => total + (editing?.word === word ? 0 : word.text.length), 0) + (editing ? editing.field.value.length : 0);
  const measure = value => { context.font = font; return context.measureText(value).width; };
  const scale = () => canvas.clientWidth / PAD.width;

  // Pen colors come from the page's styles, read again when the theme changes.
  // Colors read before messages.css arrives (likely on a slow phone) would all
  // be gray, so they are only kept once every pen has its color.
  function readInks() {
    const style = window.getComputedStyle(document.documentElement);
    const read = Object.fromEntries([...PENS, 'muted'].map(name => [name, style.getPropertyValue(name === 'ink' || name === 'muted' ? `--${name}` : `--pen-${name}`).trim()]));
    const complete = Object.values(read).every(Boolean);
    for (const name in read) read[name] ||= '#888';
    return complete ? read : { ...read, partial: true };
  }
  function paint() {
    if (!canvas.width) return;
    context.setTransform(canvas.width / PAD.width, 0, 0, canvas.height / PAD.height, 0, 0);
    context.clearRect(0, 0, PAD.width, PAD.height);
    if (!inks || inks.partial) inks = readInks();
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    const drawing = current ? { strokes: [...strokes, current], colors: [...colors, pen] } : { strokes, colors };
    for (const run of penRuns(drawing)) {
      context.strokeStyle = inks[run.pen];
      context.stroke(new window.Path2D(drawingPath(run)));
    }
    context.font = font;
    context.textBaseline = 'alphabetic';
    // The word being edited shows in its text field instead.
    for (const word of words) {
      if (editing?.word === word) continue;
      context.fillStyle = inks[word.pen ?? 'ink'];
      word.text.split('\n').forEach((line, index) => context.fillText(line, word.x, word.y + BASELINE + index * TYPE.line));
    }
    if (placeholder && tool === 'type' && !strokes.length && !words.length && !editing) {
      context.fillStyle = inks.muted;
      context.fillText(placeholder, 18, 16 + BASELINE);
    }
  }
  function fit() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    if (editing) place();
    paint();
  }

  // Typing: a text field floats over the sheet where the cursor goes, in the
  // sheet's own font and scale, and becomes part of the drawing when it closes.
  const room = word => PAD.width - word.x - 6;
  function place() {
    const { word, field } = editing, size = scale();
    // Phones zoom the page into text fields under 16px, so a small sheet's
    // field is set at 16px and scaled down to the sheet's size instead.
    editing.zoom = Math.min(1, TYPE.size * size / 16);
    const unit = size / editing.zoom;
    Object.assign(field.style, { left: `${canvas.offsetLeft + word.x * size}px`, top: `${canvas.offsetTop + word.y * size}px`, fontSize: `${TYPE.size * unit}px`, lineHeight: `${TYPE.line * unit}px`, transform: editing.zoom < 1 ? `scale(${editing.zoom})` : '', transformOrigin: '0 0' });
    grow();
  }
  // The field is as wide as its longest line plus room for the next few
  // letters, up to the sheet's right edge, where its lines wrap.
  function grow() {
    const { word, field, zoom = 1 } = editing, size = scale() / zoom;
    const longest = Math.max(0, ...field.value.split('\n').map(measure));
    field.style.width = `${Math.min(room(word), Math.max(TYPE.size * 4, longest + TYPE.size * 2)) * size}px`;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }
  function colorField() {
    const { word, field } = editing;
    field.style.color = `var(${(word.pen ?? 'ink') === 'ink' ? '--ink' : `--pen-${word.pen}`})`;
  }
  function open(word) {
    close();
    const field = document.createElement('textarea');
    field.className = 'message-type';
    field.rows = 1;
    field.spellcheck = true;
    field.setAttribute('aria-label', 'Your words');
    field.value = word.text;
    field.maxLength = Math.max(0, LIMITS.text - typed() + word.text.length);
    editing = { word, field };
    pad.append(field);
    colorField();
    place();
    field.addEventListener('input', () => { grow(); onChange(); });
    field.addEventListener('blur', () => close());
    field.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close();
      canvas.focus();
    });
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    paint();
    return field;
  }
  function close() {
    if (!editing) return;
    const { word, field } = editing;
    editing = null;
    field.remove();
    word.text = wrapLines(field.value.replace(/\s+$/, ''), room(word), measure).join('\n').replace(/\s+$/, '');
    words = words.filter(each => each !== word);
    if (word.text.trim()) words.push(word);
    paint();
    onChange();
  }
  // The typed words under a point, last written on top.
  function wordAt(x, y, reach = 4) {
    return [...words].reverse().find(word => {
      const lines = word.text.split('\n');
      const width = Math.max(...lines.map(measure));
      return x >= word.x - reach && x <= word.x + width + reach && y >= word.y - reach && y <= word.y + lines.length * TYPE.line + reach;
    });
  }
  // Where to start writing without a click: below everything typed so far.
  function nextSpot() {
    const below = words.reduce((lowest, word) => Math.max(lowest, word.y + word.text.split('\n').length * TYPE.line), 12);
    return { x: 18, y: Math.min(below, PAD.height - TYPE.line) };
  }
  function startWord(x, y) {
    if (words.length >= LIMITS.words) { say('That’s a lot of separate notes. Click an earlier one to add to it.'); return null; }
    if (typed() >= LIMITS.text) { say(`Messages can be up to ${LIMITS.text} characters.`); return null; }
    return open({ x: clamp(Math.round(x), 0, PAD.width - 40), y: clamp(Math.round(y), 0, PAD.height - TYPE.line), text: '', pen: pen === 'eraser' ? 'ink' : pen });
  }

  function setTool(next) {
    close();
    tool = next;
    if (tool === 'type' && pen === 'eraser') setPen('ink');
    pad.dataset.tool = tool === 'type' ? 'type' : pen === 'eraser' ? 'eraser' : 'pen';
    onTool(tool);
    paint();
  }
  function setPen(next) {
    if (next === 'eraser' && tool !== 'draw') { pen = next; setTool('draw'); }
    pen = next;
    pad.dataset.tool = tool === 'type' ? 'type' : pen === 'eraser' ? 'eraser' : 'pen';
    for (const button of pens) button.setAttribute('aria-pressed', String(button.dataset.pen === next));
    // A color chosen while typing recolors the words being typed.
    if (editing && next !== 'eraser') {
      editing.word.pen = next;
      colorField();
      editing.field.focus();
    }
  }
  for (const button of pens) {
    // Keep the text field open while a color is chosen.
    button.addEventListener('pointerdown', event => { if (editing) event.preventDefault(); });
    button.addEventListener('click', () => setPen(button.dataset.pen));
  }

  const at = event => {
    const rect = canvas.getBoundingClientRect();
    return [clamp(Math.round((event.clientX - rect.left) / rect.width * PAD.width), 0, PAD.width), clamp(Math.round((event.clientY - rect.top) / rect.height * PAD.height), 0, PAD.height)];
  };
  // The eraser rubs along the pointer's path in steps half its width, so a
  // quick swipe leaves nothing behind. Typed words it touches go whole.
  function rub([x, y]) {
    const [fromX, fromY] = erasing.last ?? [x, y];
    const steps = Math.max(1, Math.ceil(Math.hypot(x - fromX, y - fromY) / (ERASER / 2)));
    let drawing = { strokes, colors };
    for (let step = 1; step <= steps; step++) {
      const px = fromX + (x - fromX) * step / steps, py = fromY + (y - fromY) * step / steps;
      drawing = eraseAt(drawing, px, py);
      for (let word = wordAt(px, py, ERASER); word; word = wordAt(px, py, ERASER)) words = words.filter(each => each !== word);
    }
    // Cutting can split strokes; stop short of the stroke limit.
    if (drawing.strokes.length <= LIMITS.strokes) ({ strokes, colors } = drawing);
    erasing.last = [x, y];
  }
  canvas.addEventListener('pointerdown', event => {
    if (tool === 'type') return;
    close();
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
    const moves = event.getCoalescedEvents?.() ?? [];
    for (const move of moves.length ? moves : [event]) {
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
    onChange();
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  // With Type, a click puts the cursor where it lands, or into the words there.
  canvas.addEventListener('click', event => {
    if (tool !== 'type') return;
    const [x, y] = at(event);
    const word = wordAt(x, y);
    if (word) open(word);
    else startWord(x, y - TYPE.line / 2);
  });
  // From the keyboard, typing on the focused sheet starts below what is there.
  canvas.addEventListener('keydown', event => {
    if (tool !== 'type' || editing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key !== 'Enter' && event.key.length !== 1) return;
    event.preventDefault();
    const { x, y } = nextSpot();
    const field = startWord(x, y);
    if (field && event.key.length === 1) {
      field.value = event.key;
      grow();
      onChange();
    }
  });
  pad.querySelector('[data-clear]').addEventListener('click', () => clear());

  function clear() {
    close();
    strokes = [];
    colors = [];
    words = [];
    paint();
    onChange();
  }
  function load(drawing) {
    close();
    strokes = (drawing?.strokes ?? []).map(stroke => [...stroke]);
    colors = strokes.map((_, index) => drawing.colors?.[index] ?? 'ink');
    words = (drawing?.words ?? []).map(word => ({ ...word, text: wrapLines(word.text, room(word), measure).join('\n') }));
    paint();
  }

  window.addEventListener('resize', fit);
  window.addEventListener('load', () => { inks = null; paint(); });
  new window.MutationObserver(() => { inks = readInks(); paint(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // Typed words need the sheet's font before they can be drawn true to size.
  document.fonts?.load?.(font).then(paint, () => {});
  pad.dataset.tool = 'type';
  fit();

  return {
    fit, setTool, setPen, clear, load, paint,
    // Closes any open text field, so its words are part of the drawing.
    finish: () => close(),
    get tool() { return tool; },
    get typed() { return typed(); },
    get empty() { return !strokes.length && !words.length && !editing?.field.value.trim(); },
    get drawing() { return strokes.length || words.length ? { strokes, colors, words } : null; },
  };
}

export function installMessages({ document, window }) {
  const form = document.querySelector('[data-message-form]');
  if (!form) return null;
  // On the live site the form sends to the inbox service named in the page;
  // on this computer it always sends to the development server's inbox.
  const local = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
  const endpoint = local ? '/api/messages' : form.dataset.endpoint;
  const name = form.querySelector('#message-name'), trap = form.querySelector('#message-website');
  const pad = form.querySelector('[data-message-pad]');
  const switcher = form.querySelector('[data-message-modes]'), modes = [...switcher.querySelectorAll('[data-mode]')];
  const send = form.querySelector('[type="submit"]'), sendLabel = send.querySelector('[data-message-send-label]');
  const count = form.querySelector('[data-message-count]'), status = form.querySelector('[data-message-status]');
  const opened = Date.now();
  let resting = false;

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

  // The characters typed so far, shown once they near the limit.
  function update() {
    const used = sheet.typed;
    count.textContent = `${used} / ${LIMITS.text}`;
    count.hidden = used < LIMITS.text * 0.8;
    if (!resting) say('');
  }
  const sheet = installSheet({
    document, window, pad, say, onChange: () => update(),
    placeholder: 'Hi Jordan… (click anywhere to type)',
    onTool: tool => {
      switcher.dataset.current = tool;
      for (const button of modes) button.setAttribute('aria-pressed', String(button.dataset.mode === tool));
    },
  });
  for (const button of modes) button.addEventListener('click', () => sheet.setTool(button.dataset.mode));

  if (!endpoint) {
    send.disabled = true;
    resting = true;
    say('Messages open soon.');
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!endpoint) return;
    sheet.finish();
    const { message, error } = checkMessage({ name: name.value, text: '', drawing: sheet.drawing });
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
      sheet.clear();
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
  update();
  return sheet;
}

if (typeof window !== 'undefined') installMessages({ document, window });
