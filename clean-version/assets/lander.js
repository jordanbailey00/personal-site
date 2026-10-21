// A little lunar lander parked in the homepage's bottom-right corner. It flies
// only after a visitor chooses it (click, or Enter on the focused lander), so
// keys, clicks, and scrolling keep working on the page for everyone else.
// Flying starts a one-minute round: aim with the mouse, fire with either
// button, and scroll to change guns while shooting space targets for points.
// The flight model has no DOM dependencies and is tested directly.
import { createGame, startGame, endGame, updateGame, drawTargets, targetPalette } from './space-targets.js';
import { GUNS, switchGun, updateGuns, drawShots } from './guns.js';
import { createSounds } from './lander-sound.js';

export const SIZE = 44;
const HALF = SIZE / 2;
const UNIT = SIZE / 48; // The sprite is drawn on a 48-unit grid.
export const GRAVITY = 150; // px/s²: a slow, lunar fall.
const MAIN_THRUST = 420, DOWN_THRUST = 220, SIDE_THRUST = 340, MAX_SPEED = 480;
const DRAG_X = 1.2, DRAG_Y = 0.25, GROUND_FRICTION = 10;
export const SAFE_LANDING = 170; // Faster touchdowns bounce.
const HOME_MARGIN = 28, GROUND_MARGIN = 6;
// Sprite landmarks relative to its center, in CSS pixels.
const NOZZLE = 18 * UNIT, RCS_X = 12.5 * UNIT, RCS_Y = -4.5 * UNIT, FOOT_X = 19.5 * UNIT;
const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ground = flight => flight.height - GROUND_MARGIN - HALF;

export const home = flight => ({ x: flight.width - HOME_MARGIN - HALF, y: ground(flight) });

export function park(flight) {
  Object.assign(flight, home(flight), { vx: 0, vy: 0, tilt: 0, landed: true, returning: false, perch: null });
  return flight;
}

export function createFlight(width, height) {
  return park({
    width, height, piloting: false, firing: false, shots: [],
    // Gun state: where the mouse is, the chosen gun, its reload, the laser's
    // beam and energy, and which side the next missile leaves from.
    aim: null, aimDirection: null, gun: 0, cooldown: 0, beam: null, energy: 1, overheated: false, salvo: 0,
    input: { up: false, down: false, left: false, right: false },
    engine: { main: 0, down: 0, left: 0, right: 0 },
  });
}

// A parked lander follows its pad; a flying one stays on the page.
export function resize(flight, width, height) {
  const parked = !flight.piloting && !flight.returning && flight.landed && flight.x === home(flight).x;
  flight.width = width;
  flight.height = height;
  if (parked) { park(flight); return true; }
  flight.x = clamp(flight.x, HALF, width - HALF);
  flight.y = clamp(flight.y, HALF, ground(flight));
  flight.landed = flight.landed && flight.y === ground(flight);
  return false;
}

// Platforms are page elements in window coordinates: { id, left, right, top },
// plus round: true for a circle's top. They can only be landed on from above.
export function surfaceAt(platform, x) {
  const { left, right, top, round } = platform;
  if (!round) return x >= left && x <= right ? top : null;
  // Only a circle's flattish crown can hold the lander.
  const radius = (right - left) / 2, dx = x - left - radius;
  return Math.abs(dx) <= radius * 0.45 ? top + radius - Math.sqrt(radius * radius - dx * dx) : null;
}

// The nearest surface under the lander at x: a platform or the window floor.
export function floorBelow(flight, platforms = [], x = flight.x) {
  let floor = flight.height - GROUND_MARGIN;
  for (const platform of flight.piloting ? platforms : []) {
    const surface = surfaceAt(platform, x);
    if (surface !== null && surface >= flight.y + HALF - 1 && surface < floor) floor = surface;
  }
  return floor;
}

// How far to scroll the page this frame so a pilot can keep flying past the
// top of the window, or dive past the bottom while holding S, until the page
// itself ends. The lander keeps its place on the page while the page moves
// under it, and the page never moves faster than the lander (or a gentle
// catch-up pace when it starts a dive from the window's floor).
export function cameraShift(flight, scrollTop, scrollRoom, dt = 1 / 60) {
  if (!flight.piloting) return 0;
  const zone = Math.max(110, flight.height * 0.22), most = Math.max(Math.abs(flight.vy), 400) * dt;
  if (flight.vy < 0 && flight.y < zone) {
    const up = Math.max(0, Math.min(scrollTop, zone - flight.y, most));
    return up ? -up : 0;
  }
  if (flight.input.down && flight.y > flight.height - zone) return Math.max(0, Math.min(scrollRoom - scrollTop, flight.y - (flight.height - zone), most));
  return 0;
}

export function pilot(flight) {
  flight.piloting = true;
  flight.returning = false;
}

// Letting go flies the lander back to its pad, or parks it at once.
export function release(flight, { instant = false } = {}) {
  flight.piloting = false;
  flight.firing = false;
  flight.beam = null;
  for (const key in flight.input) flight.input[key] = false;
  if (instant || (flight.landed && !flight.perch && Math.abs(flight.x - home(flight).x) < 3)) park(flight);
  else flight.returning = true;
}

export function resting(flight) {
  const engaged = flight.piloting && (flight.firing || Object.values(flight.input).some(Boolean));
  return !engaged && !flight.returning && flight.landed && flight.vx === 0 && flight.tilt === 0 && !flight.shots.length && !flight.beam;
}

// Cruise a little above the ground, then settle gently onto the pad.
function autopilot(flight) {
  const target = home(flight);
  const dx = target.x - flight.x;
  const over = Math.abs(dx) < 3 && Math.abs(flight.vx) < 20;
  const cruise = target.y - clamp(Math.abs(dx) * 0.4, 18, 90);
  const wantVx = clamp(dx * 2.2, -300, 300);
  const wantVy = over ? clamp((target.y - flight.y) * 1.5, 45, 140) : clamp((cruise - flight.y) * 1.6, -240, 160);
  const ax = clamp((wantVx - flight.vx) * 4, -SIDE_THRUST, SIDE_THRUST);
  const lift = GRAVITY - (wantVy - flight.vy) * 4; // Positive: main engine. Negative: down thrusters.
  return { main: clamp(lift / MAIN_THRUST, 0, 1), down: clamp(-lift / DOWN_THRUST, 0, 1), left: clamp(-ax / SIDE_THRUST, 0, 1), right: clamp(ax / SIDE_THRUST, 0, 1) };
}

function controls(flight) {
  if (flight.piloting) {
    const { up, down, left, right } = flight.input;
    return { main: +up, down: +down, left: +left, right: +right };
  }
  return flight.returning ? autopilot(flight) : { main: 0, down: 0, left: 0, right: 0 };
}

export function step(flight, dt, platforms = []) {
  const events = [];
  const engine = flight.engine = controls(flight);
  const previousFeet = flight.y + HALF;
  flight.vx += (engine.right - engine.left) * SIDE_THRUST * dt;
  flight.vy += (GRAVITY - engine.main * MAIN_THRUST + engine.down * DOWN_THRUST) * dt;
  // A little drag keeps a page-sized flight controllable.
  flight.vx *= Math.exp(-DRAG_X * dt);
  flight.vy *= Math.exp(-DRAG_Y * dt);
  const speed = Math.hypot(flight.vx, flight.vy);
  if (speed > MAX_SPEED) { flight.vx *= MAX_SPEED / speed; flight.vy *= MAX_SPEED / speed; }
  flight.x += flight.vx * dt;
  flight.y += flight.vy * dt;
  // The page edges are soft walls; the bottom of the window is the ground.
  if (flight.x < HALF) { flight.x = HALF; flight.vx = Math.abs(flight.vx) * 0.3; }
  if (flight.x > flight.width - HALF) { flight.x = flight.width - HALF; flight.vx = -Math.abs(flight.vx) * 0.3; }
  if (flight.y < HALF) { flight.y = HALF; flight.vy = Math.abs(flight.vy) * 0.3; }
  // A pilot can also land on platforms descended onto this frame. A lander
  // already standing on one rides it as the page scrolls. Holding Down drops
  // through platforms, and the autopilot ignores them on its way home.
  const feet = flight.y + HALF;
  let floor = flight.height - GROUND_MARGIN, perch = null;
  for (const platform of flight.piloting && !flight.input.down ? platforms : []) {
    const surface = surfaceAt(platform, flight.x);
    if (surface === null || surface >= floor || surface < SIZE) continue;
    const riding = platform.id === flight.perch && flight.vy >= 0;
    if (riding || (previousFeet <= surface + 0.5 && feet >= surface)) { floor = surface; perch = platform.id; }
  }
  flight.landed = false;
  flight.perch = null;
  if (feet >= floor || perch !== null) {
    flight.y = floor - HALF;
    if (flight.vy > SAFE_LANDING) {
      events.push({ type: 'bounce', speed: flight.vy, floor });
      flight.vy *= -0.35;
    } else if (flight.vy >= 0) {
      if (flight.vy > 30) events.push({ type: 'touchdown', speed: flight.vy, floor });
      flight.vy = 0;
      flight.landed = true;
      flight.perch = perch;
      flight.vx *= Math.exp(-GROUND_FRICTION * dt);
      if (!engine.left && !engine.right && Math.abs(flight.vx) < 2) flight.vx = 0;
    }
  }
  // Lean into sideways motion; stand level on the ground.
  const lean = flight.landed ? 0 : clamp(flight.vx / MAX_SPEED * 0.6 + (engine.right - engine.left) * 0.12, -0.45, 0.45);
  flight.tilt += (lean - flight.tilt) * (1 - Math.exp(-8 * dt));
  if (flight.landed && Math.abs(flight.tilt) < 0.002) flight.tilt = 0;

  if (flight.returning && flight.landed && Math.abs(home(flight).x - flight.x) < 3) {
    park(flight);
    events.push({ type: 'parked' });
  }
  return events;
}

const SPRITE = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 28 5 47m31-19 7 19M14.5 36 7.5 39.5m26-3.5 7 3.5M2.5 47.2h5m33 0h5"/>
<path class="lander-foil" d="M13 26h22l2 2v7l-2 2H13l-2-2v-7z"/><path d="M19 26v11m10-11v11" stroke-width=".8"/>
<path class="lander-engine" d="M21 37h6l2 5H19z"/>
<path class="lander-cabin" d="M13 26v-7l4-5.5h14l4 5.5v7z"/>
<path class="lander-window" d="M18 17h3.5L18 20zm12 0h-3.5l3.5 3z" stroke-width="1"/>
<path d="M21 13.5v-3h6v3m4.5 0 3.3-4.8M10 19.5h3m22 0h3M11.5 18v3m25-3v3"/>
<circle class="lander-beacon" cx="35.6" cy="7.6" r="1.6"/>
</svg>`;
const CONTROLS = '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> fly · <kbd>Mouse</kbd> aims · <kbd>Click</kbd> fires · <kbd>Scroll</kbd> changes guns · <kbd>M</kbd> sound · <kbd>Esc</kbd> lands';
// Physical key positions, so other keyboard layouts fly the same way.
const KEYS = { KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right' };
const controlFor = event => KEYS[event.code] ?? KEYS[`Key${(event.key || '').toUpperCase()}`];
const isSpace = event => event.code === 'Space' || event.key === ' ';
// Either main mouse button fires.
const isTrigger = event => event.button === 0 || event.button === 2;
const BEST = 'jordan-bailey-lander-best-60', MUTED = 'jordan-bailey-lander-muted', PLAYED = 'jordan-bailey-lander-played';
// The "play here" note's arrow: a curving shaft and its head, drawn on the
// note's 150 × 80 grid and ending just above the middle of the parked lander.
const ARROW = ['M111 13C140 12 164 30 166 60', 'M161.2 52.4Q163.8 56.5 166 60Q167.6 56 169.7 51.8'];
// Shots spark on compact page elements; text blocks are wider than their words.
const SOLID = 'img, .social a, .name';
const DIVIDERS = '.section-title, .writing-heading';
const FLAME = ['#fff1c1', '#ffb13b', '#ff6a2b'];
// How hard each gun shakes the game when it fires.
const KICK = { blaster: 1.2, scatter: 5, rapid: 0.8, missiles: 2 };
// Gun bar icons, on the site's 24-unit icon grid.
const ICONS = {
  blaster: '<path d="M5 19 15 9"/><circle cx="17.5" cy="6.5" r="2.5"/>',
  scatter: '<path d="M5 19 9 5M5 19 15 8M5 19l14-5"/>',
  rapid: '<path d="m3 21 2-2m3.5-3.5 2-2m3.5-3.5 2-2"/><circle cx="6.5" cy="17.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="17.5" cy="6.5" r="1.6" fill="currentColor"/>',
  laser: '<path d="M4 20 15 9" stroke-width="3"/><path d="M18 2v3m0 4v3m-6-6h3m4 0h3"/>',
  missiles: '<path d="M20 4c-5 0-9 3-11 8l3 3c5-2 8-6 8-11Z"/><path d="M9 12 5 13l-1 3 3-1m5 0-1 4 3-1 1-3"/><circle cx="15.5" cy="8.5" r="1.2"/>',
};

export function installLander({ document, window }) {
  const root = document.documentElement;
  // Hidden by CSS on touch-only or narrow screens, where it cannot be flown or would cover text.
  const usable = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const make = (tag, className, attributes = {}) => {
    const node = document.createElement(tag);
    node.className = className;
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    return node;
  };
  const canvas = make('canvas', 'lander-effects', { 'aria-hidden': 'true' });
  const pad = make('div', 'lander-pad', { 'aria-hidden': 'true' });
  const button = make('button', 'lander', { type: 'button', 'aria-label': 'Fly the lunar lander', 'aria-pressed': 'false', 'aria-describedby': 'lander-help' });
  const help = make('p', 'lander-help', { id: 'lander-help' });
  // The score, best score, and time left sit in the top-right corner.
  const score = make('div', 'lander-score', { 'aria-hidden': 'true' });
  const scoreLabel = make('span', 'lander-score-label'), scoreValue = make('strong', 'lander-score-value'), bestValue = make('span', 'lander-score-best'), timeValue = make('span', 'lander-score-time');
  scoreLabel.textContent = 'Score';
  score.append(scoreLabel, scoreValue, bestValue, timeValue);
  // The gun bar sits at the bottom center: every gun, with the chosen one
  // raised and the laser's energy under its slot.
  const bar = make('ol', 'lander-guns', { 'aria-hidden': 'true' });
  const slots = GUNS.map(gun => {
    const slot = make('li', `lander-gun gun-${gun.id}`);
    slot.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[gun.id]}</svg><span>${gun.name}</span>`;
    bar.append(slot);
    return slot;
  });
  const laserSlot = slots[GUNS.findIndex(gun => gun.beam)], energy = make('span', 'lander-gun-energy'), energyFill = make('i', 'lander-gun-charge');
  energy.append(energyFill);
  laserSlot.append(energy);
  // After a round, the result shows where the gun bar was; the status line
  // tells screen readers.
  const results = make('p', 'lander-results', { 'aria-hidden': 'true' });
  const status = make('p', 'lander-status', { role: 'status' });
  button.innerHTML = SPRITE;
  help.textContent = 'Click to fly';
  canvas.hidden = true;
  // First-time visitors see a handwritten note pointing at the lander until they fly it.
  const hint = make('div', 'lander-hint', { 'aria-hidden': 'true' });
  hint.innerHTML = `<span class="lander-hint-text">play here</span><svg viewBox="0 0 150 80" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ARROW.map((d, index) => `<path pathLength="1" style="--stroke:${index}" d="${d}"/>`).join('')}</svg>`;
  document.body.append(canvas, pad, button, help, hint, score, bar, results, status);
  const context = canvas.getContext('2d');
  const flight = createFlight(root.clientWidth, root.clientHeight);
  const game = createGame(), sounds = createSounds(window);
  try {
    game.best = Number(window.localStorage.getItem(BEST)) || 0;
    sounds.muted = window.localStorage.getItem(MUTED) === 'true';
    hint.hidden = window.localStorage.getItem(PLAYED) === 'true';
  } catch { /* Storage may be unavailable. */ }
  // The note waits for its handwriting font, so it never appears in a
  // fallback face, and loads the font only where the note can show.
  const roomy = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1240px)');
  function prepareHint() {
    if (hint.hidden || !roomy.matches || hint.classList.contains('is-ready')) return;
    const show = () => hint.classList.add('is-ready');
    if (!document.fonts?.load) return show();
    Promise.race([document.fonts.load('34px "Reenie Beanie"'), new Promise(resolve => window.setTimeout(resolve, 1500))]).then(show, show);
  }
  prepareHint();
  roomy.addEventListener('change', prepareHint);
  let particles = [], popups = [], frame = null, last = null, scale = 1, colors = null, helpTimer = null, endTimer = null;
  let shownEnergy = null, shownSecond = null, startBest = 0, shake = 0, offsetX = 0, offsetY = 0, clock = 0, wheel = 0, lastWheel = -Infinity;

  const rand = (min, max) => min + Math.random() * (max - min);
  const count = rate => Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
  const at = (x, y) => {
    const sin = Math.sin(flight.tilt), cos = Math.cos(flight.tilt);
    return { x: flight.x + x * cos - y * sin, y: flight.y + x * sin + y * cos };
  };
  const emit = (kind, x, y, vx, vy, life, size, details) => { if (particles.length < 700) particles.push({ kind, x, y, vx, vy, life, size, age: 0, ...details }); };
  function burst(kind, x, y, number, speed, life, size) {
    for (let i = 0; i < number; i++) {
      const angle = rand(0, TAU), velocity = rand(speed * 0.3, speed);
      emit(kind, x, y, Math.cos(angle) * velocity, Math.sin(angle) * velocity, rand(life * 0.5, life), rand(size * 0.6, size));
    }
  }
  function dust(x, floor, number, spread) {
    for (let i = 0; i < number; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      emit('dust', x + rand(-spread, spread), floor - 1, side * rand(50, 170), -rand(5, 35), rand(0.4, 0.8), rand(1.5, 3), { floor });
    }
  }
  // Sounds pan toward where they happen.
  const panOf = x => clamp(x / flight.width * 2 - 1, -1, 1) * 0.7;
  // Shake the game layer (never the page) for heavy guns and explosions.
  const jolt = amount => { if (!reducedMotion.matches) shake = Math.min(12, shake + amount); };
  // Images, section dividers, and the gun bar are landing platforms while a visitor flies.
  const perches = [...document.querySelectorAll(`main img, ${DIVIDERS}`)].filter(node => !node.matches('.writing-heading .section-title'));
  perches.push(bar);
  function platforms() {
    if (!flight.piloting) return [];
    const list = [];
    for (const node of perches) {
      const rect = node.getBoundingClientRect();
      if (!rect.width || rect.bottom < 0 || rect.top > flight.height) continue;
      // Dividers are each block's 1px bottom border.
      const top = node.matches(DIVIDERS) ? rect.bottom - 1 : rect.top;
      list.push({ id: node, left: rect.left, right: rect.right, top, round: node.classList.contains('portrait') });
    }
    return list;
  }
  function readColors() {
    const style = window.getComputedStyle(root);
    const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    return { ...targetPalette(read), flame: FLAME[1], dark: style.colorScheme === 'dark' };
  }

  function place() {
    button.style.transform = `translate(${(flight.x - HALF + offsetX).toFixed(2)}px, ${(flight.y - HALF + offsetY).toFixed(2)}px) rotate(${flight.tilt.toFixed(4)}rad)`;
  }
  function placePad() {
    const target = home(flight);
    pad.style.transform = `translate(${target.x - 28}px, ${target.y + HALF}px)`;
  }
  function fit() {
    scale = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(flight.width * scale), height = Math.round(flight.height * scale);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  }
  // Release the full-window canvas whenever nothing is moving.
  function sleep() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    last = null;
    canvas.hidden = true;
    canvas.width = 0;
    canvas.height = 0;
  }
  function wake() {
    if (frame !== null || !usable.matches) return;
    canvas.hidden = false;
    fit();
    frame = window.requestAnimationFrame(tick);
  }

  function exhaust(dt, surfaces) {
    const { main, down, left, right } = flight.engine;
    const sin = Math.sin(flight.tilt), cos = Math.cos(flight.tilt);
    if (main > 0.05) {
      const nozzle = at(0, NOZZLE);
      for (let i = count(110 * main * dt); i > 0; i--) {
        const angle = flight.tilt + rand(-0.3, 0.3), velocity = rand(110, 210);
        emit('flame', nozzle.x, nozzle.y, -Math.sin(angle) * velocity + flight.vx, Math.cos(angle) * velocity + flight.vy, rand(0.16, 0.34), rand(1.6, 2.8));
      }
      // The plume kicks up dust from whatever is below.
      const floor = floorBelow(flight, surfaces, nozzle.x), altitude = floor - nozzle.y;
      if (altitude < 80) dust(nozzle.x, floor, count(70 * main * (1 - altitude / 80) * dt), 5);
    }
    const puff = (x, y, dx, dy, power) => {
      for (let i = count(45 * power * dt); i > 0; i--) {
        const velocity = rand(50, 110);
        emit('puff', x, y, dx * velocity + rand(-12, 12) + flight.vx, dy * velocity + rand(-12, 12) + flight.vy, rand(0.15, 0.32), rand(1.2, 2));
      }
    };
    // Reaction-control jets fire on the side opposite the push.
    const leftJet = at(-RCS_X, RCS_Y), rightJet = at(RCS_X, RCS_Y);
    if (left > 0.05) puff(rightJet.x, rightJet.y, cos, sin, left);
    if (right > 0.05) puff(leftJet.x, leftJet.y, -cos, -sin, right);
    if (down > 0.05) { puff(leftJet.x, leftJet.y, sin, -cos, down); puff(rightJet.x, rightJet.y, sin, -cos, down); }
    // Missiles leave a smoke trail.
    for (const shot of flight.shots) {
      if (!shot.homing) continue;
      const speed = Math.hypot(shot.vx, shot.vy) || 1, tailX = shot.x - shot.vx / speed * 9, tailY = shot.y - shot.vy / speed * 9;
      for (let i = count(70 * dt); i > 0; i--) emit('puff', tailX, tailY, rand(-15, 15) - shot.vx * 0.1, rand(-15, 15) - shot.vy * 0.1, rand(0.3, 0.6), rand(1.2, 2.2));
    }
  }

  // The laser shakes the game, throws sparks from the muzzle, and sheds
  // motes along its length.
  function laserEffects(dt) {
    const { x0, y0, x1, y1 } = flight.beam, length = Math.hypot(x1 - x0, y1 - y0) || 1;
    const ux = (x1 - x0) / length, uy = (y1 - y0) / length;
    shake = Math.max(shake, reducedMotion.matches ? 0 : 2.2);
    sounds.energy(flight.energy);
    for (let i = count(45 * dt); i > 0; i--) {
      const angle = Math.atan2(uy, ux) + rand(-0.9, 0.9), velocity = rand(120, 320);
      emit('spark', x0, y0, Math.cos(angle) * velocity, Math.sin(angle) * velocity, rand(0.1, 0.3), rand(1, 1.8));
    }
    for (let i = count(70 * dt); i > 0; i--) {
      const along = Math.random() * length, side = rand(-1, 1);
      emit('spark', x0 + ux * along, y0 + uy * along, -uy * side * 90 + ux * 40, ux * side * 90 + uy * 40, rand(0.15, 0.4), rand(0.8, 1.6));
    }
  }

  function showScore() {
    scoreValue.textContent = String(game.score);
    bestValue.textContent = game.best ? `Best ${game.best}` : '';
  }
  function showTime() {
    const seconds = Math.ceil(game.remaining);
    if (seconds === shownSecond) return;
    // The last five seconds tick.
    if (game.playing && shownSecond !== null && seconds < shownSecond && seconds <= 5) sounds.tick();
    shownSecond = seconds;
    timeValue.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    timeValue.classList.toggle('is-ending', seconds <= 10);
  }
  function showGun() {
    slots.forEach((slot, index) => slot.classList.toggle('is-current', index === flight.gun));
  }
  // The laser's meter changes every frame it fires or recharges.
  function showEnergy() {
    const percent = Math.round(flight.energy * 100);
    if (percent === shownEnergy) return;
    shownEnergy = percent;
    energyFill.style.width = `${percent}%`;
    laserSlot.classList.toggle('is-overheated', flight.overheated);
  }
  function saveBest() {
    try { window.localStorage.setItem(BEST, String(game.best)); } catch { /* The best score still lasts for this visit. */ }
  }
  function chooseGun(step) {
    const gun = switchGun(flight, step);
    showGun();
    sounds.select();
    popups.push({ x: flight.x, y: flight.y - HALF - 10, text: gun.name, color: 'ink', size: 13, age: 0, life: 0.9 });
    status.textContent = `${gun.name} selected.`;
    wake();
  }
  function toggleSound() {
    sounds.muted = !sounds.muted;
    try { window.localStorage.setItem(MUTED, String(sounds.muted)); } catch { /* The choice still lasts for this visit. */ }
    const text = sounds.muted ? 'Sound off' : 'Sound on';
    popups.push({ x: flight.x, y: flight.y - HALF - 10, text, color: 'ink', size: 13, age: 0, life: 0.9 });
    status.textContent = `${text}.`;
    wake();
  }

  function fired({ gun, x, y, aim, shots }) {
    sounds.fire(gun, panOf(x));
    jolt(KICK[gun]);
    // A muzzle flash, bigger for heavier guns, and sparks thrown forward.
    const heading = Math.atan2(aim.y, aim.x);
    emit('muzzle', x, y, flight.vx, flight.vy, gun === 'scatter' ? 0.1 : 0.06, gun === 'scatter' ? 18 : gun === 'rapid' ? 7 : 11);
    for (let i = gun === 'scatter' ? 12 : gun === 'rapid' ? 1 : 3; i > 0; i--) {
      const angle = heading + rand(-0.5, 0.5), velocity = rand(80, 280);
      emit('spark', x, y, Math.cos(angle) * velocity, Math.sin(angle) * velocity, rand(0.08, 0.22), rand(1, 1.8));
    }
    if (gun === 'scatter') {
      for (let i = 0; i < 10; i++) {
        const angle = heading + rand(-0.4, 0.4), velocity = rand(120, 260);
        emit('flame', x, y, Math.cos(angle) * velocity, Math.sin(angle) * velocity, rand(0.08, 0.18), rand(2, 3.4));
      }
    }
    if (gun === 'missiles') for (const shot of shots) burst('puff', shot.x, shot.y, 6, 60, 0.4, 2);
  }
  // A destroyed target bursts into sparks, smoke, and pieces in its own colors.
  function shatter({ target, points }) {
    const { x, y, radius, kind } = target;
    sounds.hit(kind, panOf(x));
    jolt(2 + radius / 8);
    burst('spark', x, y, 18, 280, 0.6, 2.4);
    burst('puff', x, y, 10, 90, 0.7, 2.8);
    emit('flash', x, y, 0, 0, 0.32, radius / 8);
    emit('ring', x, y, 0, 0, 0.4, radius * 2.4);
    const tones = { satellite: [colors.foil, colors.accent], ufo: [colors.paper, colors.accent], comet: [colors.hot, colors.accent] }[kind] ?? [colors.surface, colors.smoke];
    for (let i = 0; i < 5 + Math.round(radius / 3); i++) {
      const angle = rand(0, TAU), velocity = rand(60, 230);
      emit('chunk', x, y, Math.cos(angle) * velocity + target.vx, Math.sin(angle) * velocity + target.vy, rand(0.5, 0.9), rand(2, 2 + radius / 5), { angle: rand(0, TAU), spin: rand(-12, 12), color: tones[i % 2] });
    }
    popups.push({ x, y: y - radius - 6, text: `+${points}`, color: 'accent', size: points >= 50 ? 20 : 16, age: 0, life: 1 });
    showScore();
    if (!reducedMotion.matches) scoreValue.animate?.([{ transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
  }
  function blast(x, y, radius) {
    jolt(radius / 9);
    emit('flash', x, y, 0, 0, 0.35, radius / 14);
    emit('ring', x, y, 0, 0, 0.45, radius * 1.1);
    burst('spark', x, y, 22, 300, 0.7, 2.6);
    burst('flame', x, y, 22, 170, 0.45, 3.4);
    burst('puff', x, y, 16, 120, 0.9, 3.4);
  }

  function react(event) {
    if (event.type === 'fire') fired(event);
    if (event.type === 'hit') shatter(event);
    if (event.type === 'explode') { blast(event.x, event.y, event.radius); sounds.boom(1, panOf(event.x)); }
    if (event.type === 'fizzle') { blast(event.x, event.y, 20); sounds.boom(0.3, panOf(event.x)); }
    if (event.type === 'beam') sounds.laser(event.on, panOf(flight.x));
    if (event.type === 'overheat') {
      // Steam vents from the lander until the laser cools.
      sounds.overheat();
      burst('puff', flight.x, flight.y, 16, 90, 1, 3);
    }
    if (event.type === 'timeup') finish('time');
    if (event.type === 'touchdown' || event.type === 'bounce') {
      const strength = Math.min(1, event.speed / 160);
      for (const side of [-1, 1]) dust(at(side * FOOT_X, HALF).x, event.floor, Math.round((event.type === 'bounce' ? 10 : 6) * strength), 4);
    }
  }

  // Scroll the page with a lander flying past the top (or diving past the
  // bottom with S); the targets and effects stay with the window.
  function follow(dt) {
    const scroller = document.scrollingElement ?? root, before = scroller.scrollTop || 0;
    const shift = cameraShift(flight, before, (scroller.scrollHeight || 0) - (scroller.clientHeight || 0), dt);
    if (!shift) return;
    window.scrollBy({ top: shift, behavior: 'instant' });
    flight.y -= (scroller.scrollTop || 0) - before;
  }

  function strike() {
    flight.shots = flight.shots.filter(shot => {
      const target = document.elementFromPoint(shot.x, shot.y)?.closest(SOLID);
      if (!target) return true;
      if (shot.homing) { blast(shot.x, shot.y, 24); sounds.boom(0.4, panOf(shot.x)); }
      else {
        burst('spark', shot.x, shot.y, 12, 220, 0.5, 2.2);
        emit('flash', shot.x, shot.y, 0, 0, 0.22, 1);
      }
      if (!reducedMotion.matches) target.animate?.([{ translate: '0 0' }, { translate: '-2px 1px' }, { translate: '2px -1px' }, { translate: '0 0' }], { duration: 180, easing: 'ease-out' });
      return false;
    });
  }

  function age(dt) {
    for (const particle of particles) {
      particle.age += dt;
      const drag = Math.exp(-(particle.kind === 'flame' ? 3 : 2.4) * dt);
      particle.vx *= drag;
      particle.vy = particle.vy * drag + (particle.kind === 'spark' ? 140 : particle.kind === 'dust' ? 25 : 0) * dt;
      particle.x += particle.vx * dt;
      particle.y = particle.kind === 'dust' ? Math.min(particle.floor - 0.5, particle.y + particle.vy * dt) : particle.y + particle.vy * dt;
      if (particle.spin) particle.angle += particle.spin * dt;
    }
    particles = particles.filter(particle => particle.age < particle.life);
    for (const popup of popups) popup.age += dt;
    popups = popups.filter(popup => popup.age < popup.life);
  }

  function drawParticle(particle) {
    const t = particle.age / particle.life;
    context.globalCompositeOperation = (particle.kind === 'flame' || particle.kind === 'muzzle') && colors.dark ? 'lighter' : 'source-over';
    if (particle.kind === 'flash' || particle.kind === 'ring') {
      // Flashes widen quickly; shockwave rings sweep out and thin.
      context.globalAlpha = 1 - t;
      context.strokeStyle = colors.accent;
      context.lineWidth = particle.kind === 'ring' ? 3 * (1 - t) + 0.5 : 1.5;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.kind === 'ring' ? particle.size * (0.3 + 0.7 * Math.sqrt(t)) : 3 + 14 * t * particle.size, 0, TAU);
      context.stroke();
      return;
    }
    if (particle.kind === 'muzzle') {
      const radius = particle.size * (1 - t * 0.5), glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius);
      glow.addColorStop(0, colors.hot);
      glow.addColorStop(0.4, colors.tail);
      glow.addColorStop(1, colors.clear);
      context.globalAlpha = 1 - t;
      context.fillStyle = glow;
      context.beginPath();
      context.arc(particle.x, particle.y, radius, 0, TAU);
      context.fill();
      return;
    }
    if (particle.kind === 'chunk') {
      const size = particle.size;
      context.save();
      context.globalAlpha = t > 0.6 ? (1 - t) / 0.4 : 1;
      context.translate(particle.x, particle.y);
      context.rotate(particle.angle);
      context.fillStyle = particle.color;
      context.strokeStyle = colors.ink;
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(size, 0);
      context.lineTo(-size * 0.6, size * 0.75);
      context.lineTo(-size * 0.5, -size * 0.65);
      context.closePath();
      context.fill();
      context.stroke();
      context.restore();
      return;
    }
    context.globalAlpha = particle.kind === 'flame' ? 1 - t : particle.kind === 'spark' ? 1 - t * t : 0.55 * (1 - t);
    context.fillStyle = particle.kind === 'flame' ? FLAME[Math.min(2, Math.floor(t * 3))] : particle.kind === 'spark' ? colors.accent : colors.smoke;
    const radius = particle.kind === 'flame' ? particle.size * (1 - t * 0.5) : particle.kind === 'spark' ? particle.size : particle.size * (1 + t * 1.5);
    context.beginPath();
    context.arc(particle.x, particle.y, radius, 0, TAU);
    context.fill();
  }

  // A crosshair where the mouse aims; it does not shake.
  function reticle() {
    if (!flight.piloting || !flight.aim) return;
    const { x, y } = flight.aim, radius = flight.firing ? 11 : 9;
    context.globalAlpha = 0.9;
    context.strokeStyle = colors.accent;
    context.fillStyle = colors.accent;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(x, y, radius, 0, TAU);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      context.moveTo(x + dx * (radius - 3), y + dy * (radius - 3));
      context.lineTo(x + dx * (radius + 5), y + dy * (radius + 5));
    }
    context.stroke();
    context.beginPath();
    context.arc(x, y, 1.4, 0, TAU);
    context.fill();
    context.globalAlpha = 1;
  }

  function draw() {
    context.setTransform(scale, 0, 0, scale, offsetX * scale, offsetY * scale);
    context.clearRect(-20, -20, flight.width + 40, flight.height + 40);
    drawTargets(context, game, colors);
    const { main } = flight.engine;
    if (main > 0.05) {
      // A flickering plume under the engine bell; particles carry the exhaust away.
      const nozzle = at(0, NOZZLE), length = (8 + 14 * main) * rand(0.8, 1.15), width = 3.2;
      context.save();
      context.translate(nozzle.x, nozzle.y);
      context.rotate(flight.tilt);
      const plume = context.createLinearGradient(0, 0, 0, length);
      plume.addColorStop(0, 'rgba(255, 244, 210, 0.95)');
      plume.addColorStop(0.35, 'rgba(255, 170, 50, 0.9)');
      plume.addColorStop(1, 'rgba(255, 90, 30, 0)');
      context.beginPath();
      context.moveTo(-width, 0);
      context.quadraticCurveTo(-width * 0.8, length * 0.55, 0, length);
      context.quadraticCurveTo(width * 0.8, length * 0.55, width, 0);
      context.closePath();
      context.fillStyle = plume;
      context.fill();
      context.restore();
    }
    for (const particle of particles) drawParticle(particle);
    context.globalCompositeOperation = 'source-over';
    drawShots(context, flight, colors, clock);
    // Points pop up from each hit; gun names and sound changes from the lander.
    context.textAlign = 'center';
    for (const popup of popups) {
      const t = popup.age / popup.life;
      context.globalAlpha = 1 - t * t;
      context.fillStyle = colors[popup.color];
      context.font = `600 ${(popup.size * (1 + 0.5 * Math.max(0, 1 - t * 6))).toFixed(1)}px "Ubuntu Sans", Arial, sans-serif`;
      context.fillText(popup.text, popup.x, popup.y - 26 * t);
    }
    context.globalAlpha = 1;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    reticle();
  }

  function tick(now) {
    frame = null;
    if (!usable.matches) return sleep();
    const dt = last === null ? 1 / 60 : clamp((now - last) / 1000, 0, 1 / 30);
    last = now;
    clock += dt;
    colors ??= readColors();
    const surfaces = platforms();
    for (const event of step(flight, dt, surfaces)) react(event);
    follow(dt);
    for (const event of updateGuns(flight, game, dt)) react(event);
    for (const event of updateGame(game, flight, dt)) react(event);
    if (flight.beam) laserEffects(dt);
    exhaust(dt, surfaces);
    strike();
    age(dt);
    showEnergy();
    showTime();
    shake = reducedMotion.matches || shake < 0.05 ? 0 : shake * Math.exp(-10 * dt);
    offsetX = shake ? rand(-shake, shake) : 0;
    offsetY = shake ? rand(-shake, shake) : 0;
    place();
    draw();
    if (!game.playing && !game.targets.length && resting(flight) && !particles.length && !popups.length && !shake) return sleep();
    // Ending a round inside this frame may already have asked for the next.
    if (frame === null) frame = window.requestAnimationFrame(tick);
  }

  const idleHint = () => { help.textContent = button.matches?.(':focus-visible') ? 'Press Enter to fly' : 'Click to fly'; };
  function showHelp(flying) {
    window.clearTimeout(helpTimer);
    if (flying) help.innerHTML = CONTROLS;
    else idleHint();
    help.classList.toggle('is-flying', flying);
    help.classList.toggle('is-shown', flying);
    if (flying) helpTimer = window.setTimeout(() => help.classList.remove('is-shown'), 6000);
  }
  function showResults(reason) {
    const best = game.score > startBest;
    results.innerHTML = `<span>${reason === 'time' ? 'Time’s up!' : 'Landed'}</span><strong>${game.score}</strong><span>${best ? '<em>New best!</em>' : `points · Best ${game.best}`}</span>`;
    results.classList.add('is-shown');
    status.textContent = `${reason === 'time' ? 'Time’s up.' : 'Landed.'} ${game.score} points${best ? ', a new best' : `. Best ${game.best}`}.`;
  }

  // While flying, the mouse aims, either button fires, and the wheel changes
  // guns. These listeners exist only during a flight.
  const mouse = [
    ['mousemove', event => { flight.aim = { x: event.clientX, y: event.clientY }; }, { passive: true }],
    ['mousedown', event => {
      if (!isTrigger(event)) return;
      // Keep focus, and the keys, on the lander, and select nothing.
      event.preventDefault();
      flight.aim = { x: event.clientX, y: event.clientY };
      flight.firing = true;
      wake();
    }, { capture: true }],
    // Firing continues while either button is still held.
    ['mouseup', event => { flight.firing = (event.buttons & 3) !== 0; }, { capture: true }],
    // Clicks fire instead of following links or landing; Enter on the
    // lander, which clicks without a pointer, still lands it.
    ['click', event => {
      if (!event.detail) return;
      event.preventDefault();
      event.stopPropagation();
    }, { capture: true }],
    ['contextmenu', event => event.preventDefault(), { capture: true }],
    ['wheel', event => {
      // Control-scroll still zooms the page.
      if (event.ctrlKey) return;
      event.preventDefault();
      // A notch, or a trackpad's worth of scrolling, changes gun once.
      wheel += event.deltaY * (event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? 800 : 1);
      if (Math.abs(wheel) < 50) return;
      const step = Math.sign(wheel);
      wheel = 0;
      if (event.timeStamp - lastWheel < 60) return;
      lastWheel = event.timeStamp;
      chooseGun(step);
    }, { passive: false }],
  ];

  function takeControl() {
    if (!usable.matches) return;
    sounds.start();
    pilot(flight);
    startGame(game);
    startBest = game.best;
    shownSecond = null;
    hint.hidden = true;
    try { window.localStorage.setItem(PLAYED, 'true'); } catch { /* The note still goes away for this visit. */ }
    wheel = 0;
    button.setAttribute('aria-pressed', 'true');
    root.classList.add('lander-aiming');
    showHelp(true);
    showScore();
    showTime();
    showGun();
    window.clearTimeout(endTimer);
    score.classList.add('is-shown');
    bar.classList.add('is-shown');
    results.classList.remove('is-shown');
    status.textContent = '';
    for (const [name, listener, options] of mouse) window.addEventListener(name, listener, options);
    wake();
  }
  // A round ends when time runs out or the visitor lands. The result stays up
  // for a few seconds; mouse pilots get the page's keys back.
  function finish(reason) {
    if (!flight.piloting) return;
    release(flight, { instant: reducedMotion.matches });
    endGame(game);
    saveBest();
    sounds.laser(false);
    if (reason === 'time') sounds.finish();
    for (const [name, listener, options] of mouse) window.removeEventListener(name, listener, options);
    root.classList.remove('lander-aiming');
    button.setAttribute('aria-pressed', 'false');
    showHelp(false);
    bar.classList.remove('is-shown');
    showResults(reason);
    endTimer = window.setTimeout(() => {
      score.classList.remove('is-shown');
      results.classList.remove('is-shown');
    }, 6000);
    if (byPointer) button.blur();
    place();
    wake();
  }

  let byPointer = false;
  button.addEventListener('click', event => {
    byPointer = event.detail > 0;
    // Safari does not focus clicked buttons; keys must reach the lander.
    button.focus({ preventScroll: true });
    if (flight.piloting) finish('landed');
    else {
      if (byPointer) flight.aim = { x: event.clientX, y: event.clientY };
      takeControl();
    }
  });
  button.addEventListener('focus', () => { if (!flight.piloting) idleHint(); });
  button.addEventListener('keydown', event => {
    if (!flight.piloting || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') { event.preventDefault(); finish('landed'); return; }
    if (event.code === 'KeyM' || event.key === 'm' || event.key === 'M') {
      event.preventDefault();
      if (!event.repeat) toggleSound();
      return;
    }
    // Space no longer fires; keep it from scrolling the page or landing.
    if (isSpace(event)) { event.preventDefault(); return; }
    const control = controlFor(event);
    if (control) { event.preventDefault(); flight.input[control] = true; wake(); }
  });
  button.addEventListener('keyup', event => {
    const control = controlFor(event);
    if (control) flight.input[control] = false;
    else if (isSpace(event) && flight.piloting) event.preventDefault();
  });
  // Clicking or tabbing elsewhere hands the keys back to the page. Switching
  // windows keeps the lander focused, so flying resumes on return.
  button.addEventListener('blur', () => window.setTimeout(() => { if (document.activeElement !== button) finish('landed'); }, 0));
  window.addEventListener('blur', () => {
    flight.firing = false;
    for (const key in flight.input) flight.input[key] = false;
  });
  // A hidden tab stops drawing frames, so silence the laser directly.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    flight.firing = false;
    sounds.laser(false);
  });
  window.addEventListener('resize', () => {
    const parked = resize(flight, root.clientWidth, root.clientHeight);
    placePad();
    place();
    if (frame !== null) fit();
    if (!parked) wake();
  });
  // Scrolling moves a perch; the lander rides it, or falls when it leaves.
  window.addEventListener('scroll', () => { if (flight.perch) wake(); }, { passive: true });
  usable.addEventListener('change', () => {
    if (usable.matches) return;
    finish('landed');
    park(flight);
    flight.shots = [];
    game.targets = [];
    particles = [];
    popups = [];
    place();
  });
  window.addEventListener('pagehide', saveBest);
  new window.MutationObserver(() => { colors = null; }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  placePad();
  place();
  return { flight, game };
}

if (typeof window !== 'undefined') installLander({ document, window });
