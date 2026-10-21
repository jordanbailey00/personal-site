// A little lunar lander parked in the homepage's bottom-right corner. It flies
// only after a visitor chooses it (click, or Enter on the focused lander), so
// Space and other keys keep working on the page for everyone else. Flying
// starts a game: shoot space targets for points.
// The flight model has no DOM dependencies and is tested directly.
import { createGame, startGame, endGame, updateGame, drawTargets, targetPalette } from './space-targets.js';

export const SIZE = 44;
const HALF = SIZE / 2;
const UNIT = SIZE / 48; // The sprite is drawn on a 48-unit grid.
export const GRAVITY = 150; // px/s²: a slow, lunar fall.
const MAIN_THRUST = 420, DOWN_THRUST = 220, SIDE_THRUST = 340, MAX_SPEED = 480;
const DRAG_X = 1.2, DRAG_Y = 0.25, GROUND_FRICTION = 10;
export const SAFE_LANDING = 170; // Faster touchdowns bounce.
export const SHOT_INTERVAL = 0.14;
const SHOT_SPEED = 760, SHOT_LIFE = 2.5, MAX_SHOTS = 24;
const HOME_MARGIN = 28, GROUND_MARGIN = 6;
// Sprite landmarks relative to its center, in CSS pixels.
const NOSE = 13.5 * UNIT, NOZZLE = 18 * UNIT, RCS_X = 12.5 * UNIT, RCS_Y = -4.5 * UNIT, FOOT_X = 19.5 * UNIT;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ground = flight => flight.height - GROUND_MARGIN - HALF;

export const home = flight => ({ x: flight.width - HOME_MARGIN - HALF, y: ground(flight) });

export function park(flight) {
  Object.assign(flight, home(flight), { vx: 0, vy: 0, tilt: 0, landed: true, returning: false, perch: null });
  return flight;
}

export function createFlight(width, height) {
  return park({
    width, height, piloting: false, firing: false, cooldown: 0, shots: [],
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

export function pilot(flight) {
  flight.piloting = true;
  flight.returning = false;
}

// Letting go flies the lander back to its pad, or parks it at once.
export function release(flight, { instant = false } = {}) {
  flight.piloting = false;
  flight.firing = false;
  for (const key in flight.input) flight.input[key] = false;
  if (instant || (flight.landed && !flight.perch && Math.abs(flight.x - home(flight).x) < 3)) park(flight);
  else flight.returning = true;
}

export function resting(flight) {
  const engaged = flight.piloting && (flight.firing || Object.values(flight.input).some(Boolean));
  return !engaged && !flight.returning && flight.landed && flight.vx === 0 && flight.tilt === 0 && !flight.shots.length;
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

  for (const shot of flight.shots) { shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.age += dt; }
  flight.shots = flight.shots.filter(shot => shot.age < SHOT_LIFE && shot.x > -20 && shot.x < flight.width + 20 && shot.y > -20 && shot.y < flight.height + 20);
  flight.cooldown = Math.max(0, flight.cooldown - dt);
  if (flight.piloting && flight.firing && flight.cooldown === 0 && flight.shots.length < MAX_SHOTS) {
    // Shots leave the docking port along the lander's lean.
    const sin = Math.sin(flight.tilt), cos = Math.cos(flight.tilt);
    const shot = { x: flight.x + NOSE * sin, y: flight.y - NOSE * cos, vx: SHOT_SPEED * sin + flight.vx * 0.4, vy: -SHOT_SPEED * cos + flight.vy * 0.4, age: 0 };
    flight.shots.push(shot);
    flight.cooldown = SHOT_INTERVAL;
    events.push({ type: 'shot', shot });
  }
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
const CONTROLS = '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> fly · <kbd>Space</kbd> fires · <kbd>Esc</kbd> lands';
// Physical key positions, so other keyboard layouts fly the same way. The
// arrow keys stay free for the page (and later, for choosing weapons).
const KEYS = { KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right' };
const controlFor = event => KEYS[event.code] ?? KEYS[`Key${(event.key || '').toUpperCase()}`];
const isFire = event => event.code === 'Space' || event.key === ' ';
const BEST = 'jordan-bailey-lander-best';
// Shots spark on compact page elements; text blocks are wider than their words.
const SOLID = 'img, .social a, .name';
const PERCHES = 'main img, .section-title, .writing-heading';
const FLAME = ['#fff1c1', '#ffb13b', '#ff6a2b'];

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
  // The score sits in the top-right corner; the status line tells screen
  // readers the result when the lander lands.
  const score = make('div', 'lander-score', { 'aria-hidden': 'true' });
  const scoreLabel = make('span', 'lander-score-label'), scoreValue = make('strong', 'lander-score-value'), bestValue = make('span', 'lander-score-best');
  const status = make('p', 'lander-status', { role: 'status' });
  scoreLabel.textContent = 'Score';
  score.append(scoreLabel, scoreValue, bestValue);
  button.innerHTML = SPRITE;
  help.textContent = 'Click to fly';
  canvas.hidden = true;
  document.body.append(canvas, pad, button, help, score, status);
  const context = canvas.getContext('2d');
  const flight = createFlight(root.clientWidth, root.clientHeight);
  const game = createGame();
  try { game.best = Number(window.localStorage.getItem(BEST)) || 0; } catch { /* Storage may be unavailable. */ }
  let particles = [], popups = [], frame = null, last = null, scale = 1, colors = null, helpTimer = null, scoreTimer = null;

  const rand = (min, max) => min + Math.random() * (max - min);
  const count = rate => Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
  const at = (x, y) => {
    const sin = Math.sin(flight.tilt), cos = Math.cos(flight.tilt);
    return { x: flight.x + x * cos - y * sin, y: flight.y + x * sin + y * cos };
  };
  const emit = (kind, x, y, vx, vy, life, size, floor) => { if (particles.length < 600) particles.push({ kind, x, y, vx, vy, life, size, floor, age: 0 }); };
  function burst(kind, x, y, number, speed, life, size) {
    for (let i = 0; i < number; i++) {
      const angle = rand(0, Math.PI * 2), velocity = rand(speed * 0.3, speed);
      emit(kind, x, y, Math.cos(angle) * velocity, Math.sin(angle) * velocity, rand(life * 0.5, life), rand(size * 0.6, size));
    }
  }
  function dust(x, floor, number, spread) {
    for (let i = 0; i < number; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      emit('dust', x + rand(-spread, spread), floor - 1, side * rand(50, 170), -rand(5, 35), rand(0.4, 0.8), rand(1.5, 3), floor);
    }
  }
  // Images and section dividers are landing platforms while a visitor flies.
  const perches = [...document.querySelectorAll(PERCHES)].filter(node => !node.matches('.writing-heading .section-title'));
  function platforms() {
    if (!flight.piloting) return [];
    const list = [];
    for (const node of perches) {
      const rect = node.getBoundingClientRect();
      if (!rect.width || rect.bottom < 0 || rect.top > flight.height) continue;
      // Dividers are each block's 1px bottom border.
      const top = node.tagName === 'IMG' ? rect.top : rect.bottom - 1;
      list.push({ id: node, left: rect.left, right: rect.right, top, round: node.classList.contains('portrait') });
    }
    return list;
  }
  function readColors() {
    const style = window.getComputedStyle(root);
    const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    return { ...targetPalette(read), dark: style.colorScheme === 'dark' };
  }

  function place() {
    button.style.transform = `translate(${(flight.x - HALF).toFixed(2)}px, ${(flight.y - HALF).toFixed(2)}px) rotate(${flight.tilt.toFixed(4)}rad)`;
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
  }

  function showScore() {
    scoreValue.textContent = String(game.score);
    bestValue.textContent = game.best ? `Best ${game.best}` : '';
  }
  function saveBest() {
    try { window.localStorage.setItem(BEST, String(game.best)); } catch { /* The best score still lasts for this visit. */ }
  }

  function react(event) {
    if (event.type === 'shot') burst('spark', event.shot.x, event.shot.y, 3, 70, 0.18, 1.6);
    if (event.type === 'hit') {
      const { target, points } = event;
      burst('spark', target.x, target.y, 16, 240, 0.6, 2.4);
      burst('puff', target.x, target.y, 10, 90, 0.6, 2.6);
      emit('flash', target.x, target.y, 0, 0, 0.3, target.radius / 8);
      popups.push({ x: target.x, y: target.y - target.radius - 6, text: `+${points}`, age: 0, life: 0.9 });
      showScore();
      if (!reducedMotion.matches) scoreValue.animate?.([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
    }
    if (event.type === 'touchdown' || event.type === 'bounce') {
      const strength = Math.min(1, event.speed / 160);
      for (const side of [-1, 1]) dust(at(side * FOOT_X, HALF).x, event.floor, Math.round((event.type === 'bounce' ? 10 : 6) * strength), 4);
    }
  }

  function strike() {
    flight.shots = flight.shots.filter(shot => {
      const target = document.elementFromPoint(shot.x, shot.y)?.closest(SOLID);
      if (!target) return true;
      burst('spark', shot.x, shot.y, 12, 220, 0.5, 2.2);
      emit('flash', shot.x, shot.y, 0, 0, 0.22, 1);
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
    }
    particles = particles.filter(particle => particle.age < particle.life);
    for (const popup of popups) popup.age += dt;
    popups = popups.filter(popup => popup.age < popup.life);
  }

  function draw() {
    colors ??= readColors();
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, flight.width, flight.height);
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
    for (const particle of particles) {
      const t = particle.age / particle.life;
      context.globalCompositeOperation = particle.kind === 'flame' && colors.dark ? 'lighter' : 'source-over';
      if (particle.kind === 'flash') {
        context.globalAlpha = 1 - t;
        context.strokeStyle = colors.accent;
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(particle.x, particle.y, 3 + 14 * t * particle.size, 0, Math.PI * 2);
        context.stroke();
        continue;
      }
      context.globalAlpha = particle.kind === 'flame' ? 1 - t : particle.kind === 'spark' ? 1 - t * t : 0.55 * (1 - t);
      context.fillStyle = particle.kind === 'flame' ? FLAME[Math.min(2, Math.floor(t * 3))] : particle.kind === 'spark' ? colors.accent : colors.smoke;
      const radius = particle.kind === 'flame' ? particle.size * (1 - t * 0.5) : particle.kind === 'spark' ? particle.size : particle.size * (1 + t * 1.5);
      context.beginPath();
      context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = colors.accent;
    context.lineCap = 'round';
    for (const shot of flight.shots) {
      for (const [width, alpha] of [[5, 0.25], [2, 1]]) {
        context.globalAlpha = alpha;
        context.lineWidth = width;
        context.beginPath();
        context.moveTo(shot.x - shot.vx * 0.016, shot.y - shot.vy * 0.016);
        context.lineTo(shot.x, shot.y);
        context.stroke();
      }
    }
    // Points float up from each hit.
    context.font = '600 13px "Ubuntu Sans", Arial, sans-serif';
    context.textAlign = 'center';
    context.fillStyle = colors.accent;
    for (const popup of popups) {
      const t = popup.age / popup.life;
      context.globalAlpha = 1 - t * t;
      context.fillText(popup.text, popup.x, popup.y - 26 * t);
    }
    context.globalAlpha = 1;
  }

  function tick(now) {
    frame = null;
    if (!usable.matches) return sleep();
    const dt = last === null ? 1 / 60 : clamp((now - last) / 1000, 0, 1 / 30);
    last = now;
    const surfaces = platforms();
    for (const event of step(flight, dt, surfaces)) react(event);
    for (const event of updateGame(game, flight, dt)) react(event);
    exhaust(dt, surfaces);
    strike();
    age(dt);
    place();
    draw();
    if (!game.playing && !game.targets.length && resting(flight) && !particles.length && !popups.length) return sleep();
    frame = window.requestAnimationFrame(tick);
  }

  const idleHint = () => { help.textContent = button.matches?.(':focus-visible') ? 'Press Enter to fly' : 'Click to fly'; };
  function showHelp(flying) {
    window.clearTimeout(helpTimer);
    if (flying) help.innerHTML = CONTROLS;
    else idleHint();
    help.classList.toggle('is-shown', flying);
    if (flying) helpTimer = window.setTimeout(() => help.classList.remove('is-shown'), 4000);
  }
  function takeControl() {
    if (!usable.matches) return;
    pilot(flight);
    startGame(game);
    button.setAttribute('aria-pressed', 'true');
    showHelp(true);
    showScore();
    window.clearTimeout(scoreTimer);
    score.classList.add('is-shown');
    status.textContent = '';
    wake();
  }
  // Landing ends the game; the final score stays up for a few seconds.
  function letGo() {
    if (!flight.piloting) return;
    release(flight, { instant: reducedMotion.matches });
    endGame(game);
    saveBest();
    button.setAttribute('aria-pressed', 'false');
    showHelp(false);
    status.textContent = `Landed with ${game.score} points. Best ${game.best}.`;
    scoreTimer = window.setTimeout(() => score.classList.remove('is-shown'), 5000);
    place();
    wake();
  }

  // Mouse pilots get the page's keys back on landing; keyboard pilots keep
  // their place on the lander.
  let byPointer = false;
  const land = () => { letGo(); if (byPointer) button.blur(); };
  button.addEventListener('click', event => {
    byPointer = event.detail > 0;
    // Safari does not focus clicked buttons; keys must reach the lander.
    button.focus({ preventScroll: true });
    if (flight.piloting) land(); else takeControl();
  });
  button.addEventListener('focus', () => { if (!flight.piloting) idleHint(); });
  button.addEventListener('keydown', event => {
    if (!flight.piloting || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') { event.preventDefault(); land(); return; }
    const control = controlFor(event);
    if (control) { event.preventDefault(); flight.input[control] = true; wake(); }
    else if (isFire(event)) { event.preventDefault(); flight.firing = true; wake(); }
  });
  button.addEventListener('keyup', event => {
    const control = controlFor(event);
    if (control) flight.input[control] = false;
    else if (isFire(event)) {
      flight.firing = false;
      // Keep a held fire button from also toggling the lander.
      if (flight.piloting) event.preventDefault();
    }
  });
  // Clicking or tabbing elsewhere hands the keys back to the page. Switching
  // windows keeps the lander focused, so flying resumes on return.
  button.addEventListener('blur', () => window.setTimeout(() => { if (document.activeElement !== button) letGo(); }, 0));
  window.addEventListener('blur', () => {
    flight.firing = false;
    for (const key in flight.input) flight.input[key] = false;
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
    letGo();
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
