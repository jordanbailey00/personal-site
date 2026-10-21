// Space targets for the homepage lander game: what appears while a visitor
// flies, how it moves, what a shot hits, and what each target is worth. Like
// the flight model, the game state has no DOM dependencies and is tested
// directly; drawTargets() paints it with the page's palette.

const KINDS = {
  asteroid: { radius: 18, points: 10 },
  rock: { radius: 10, points: 15 },
  satellite: { radius: 15, points: 25 },
  ufo: { radius: 13, points: 50 },
  comet: { radius: 9, points: 100 },
};
export const POINTS = Object.fromEntries(Object.entries(KINDS).map(([kind, { points }]) => [kind, points]));
const APPEAR = 0.35, VANISH = 0.35, MAX_TARGETS = 6, TAU = Math.PI * 2;

export const createGame = () => ({ playing: false, time: 0, score: 0, best: 0, targets: [], spawnIn: 0 });

export function startGame(game) {
  Object.assign(game, { playing: true, time: 0, score: 0, spawnIn: 0.6 });
}

// Targets still on screen warp out when the pilot lands.
export function endGame(game) {
  game.playing = false;
  for (const target of game.targets) target.out ??= 0;
}

function target(kind, x, y, vx, vy, random, details = {}) {
  return { kind, x, y, vx, vy, ...KINDS[kind], age: 0, angle: random() * TAU, spin: (random() - 0.5) * 1.4, appear: APPEAR, life: Infinity, out: null, ...details };
}

// An irregular outline and a few craters, as fractions of the radius.
function rocky(random, corners, craters) {
  return {
    shape: Array.from({ length: corners }, () => 0.72 + random() * 0.36),
    craters: Array.from({ length: craters }, () => [(random() - 0.5) * 0.9, (random() - 0.5) * 0.9, 0.12 + random() * 0.1]),
  };
}

function spawn(game, flight, random) {
  const { width, height } = flight;
  const roll = random();
  if (roll < 0.06 && game.time > 8 && !game.targets.some(other => other.kind === 'comet')) {
    // A rare comet streaks across the top of the window.
    const fromLeft = random() < 0.5, vx = (fromLeft ? 1 : -1) * (260 + random() * 80), vy = 30 + random() * 40;
    return target('comet', fromLeft ? -20 : width + 20, 50 + random() * height * 0.2, vx, vy, random, { angle: Math.atan2(vy, vx), spin: 0, appear: 0 });
  }
  if (roll < 0.28) {
    // A saucer crosses the window, bobbing as it goes.
    const fromLeft = random() < 0.5, y = 80 + random() * height * 0.4;
    return target('ufo', fromLeft ? -20 : width + 20, y, (fromLeft ? 1 : -1) * (110 + random() * 60), 0, random, { baseY: y, angle: 0, spin: 0, appear: 0 });
  }
  // Asteroids and satellites warp in somewhere open, away from the lander.
  let x, y;
  for (let tries = 0; tries < 12; tries++) {
    x = 40 + random() * (width - 80);
    y = 80 + random() * Math.max(40, height * 0.65 - 80);
    if (Math.hypot(x - flight.x, y - flight.y) > 160) break;
  }
  const kind = roll < 0.53 ? 'satellite' : 'asteroid', heading = random() * TAU, speed = 12 + random() * 28;
  return target(kind, x, y, Math.cos(heading) * speed, Math.sin(heading) * speed, random, { life: 9 + random() * 4, ...(kind === 'asteroid' ? rocky(random, 9, 2) : {}) });
}

// Distance from a target's center to the path a shot took this frame, so
// fast shots cannot skip over small targets.
function reach(x, y, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, length = dx * dx + dy * dy;
  const along = length ? Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / length)) : 0;
  return Math.hypot(x - x0 - along * dx, y - y0 - along * dy);
}

export function updateGame(game, flight, dt, random = Math.random) {
  const events = [];
  if (game.playing) {
    game.time += dt;
    game.spawnIn -= dt;
    // Longer flights bring more targets, sooner.
    const room = Math.min(MAX_TARGETS, 3 + Math.floor(game.time / 20)) - game.targets.filter(other => other.out === null).length;
    if (game.spawnIn <= 0 && room > 0) {
      const spawned = spawn(game, flight, random);
      game.targets.push(spawned);
      events.push({ type: 'spawn', target: spawned });
      game.spawnIn = (0.8 + random() * 1.2) * Math.max(0.5, 1 - game.time / 180);
    }
  }
  for (const each of game.targets) {
    each.age += dt;
    each.x += each.vx * dt;
    each.y = each.kind === 'ufo' ? each.baseY + Math.sin(each.age * 2.4) * 16 : each.y + each.vy * dt;
    each.angle = each.kind === 'ufo' ? Math.cos(each.age * 2.4) * 0.12 : each.angle + each.spin * dt;
    if (each.out !== null) each.out += dt;
    else if (each.age > each.life) each.out = 0;
  }
  flight.shots = flight.shots.filter(shot => {
    const x0 = shot.x - shot.vx * dt, y0 = shot.y - shot.vy * dt;
    const struck = game.targets.find(each => each.out === null && each.age >= each.appear * 0.4 && reach(each.x, each.y, x0, y0, shot.x, shot.y) <= each.radius + 2);
    if (!struck) return true;
    game.targets.splice(game.targets.indexOf(struck), 1);
    game.score += struck.points;
    game.best = Math.max(game.best, game.score);
    events.push({ type: 'hit', target: struck, points: struck.points });
    if (struck.kind === 'asteroid') {
      // Big asteroids break into two smaller, faster rocks.
      const heading = random() * TAU;
      for (const turn of [0, Math.PI]) {
        const speed = 45 + random() * 30;
        game.targets.push(target('rock', struck.x, struck.y, struck.vx + Math.cos(heading + turn) * speed, struck.vy + Math.sin(heading + turn) * speed, random, { appear: 0, life: 6 + random() * 2, ...rocky(random, 7, 1) }));
      }
    }
    return false;
  });
  const margin = 60;
  game.targets = game.targets.filter(each => (each.out === null || each.out < VANISH) && each.x > -margin && each.x < flight.width + margin && each.y > -margin && each.y < flight.height + margin);
  return events;
}

// Theme colors arrive as CSS hex values; canvas gradients need explicit alpha.
function channels(color) {
  const hex = color.replace('#', '');
  const full = hex.length <= 4 ? [...hex].map(digit => digit + digit).join('') : hex;
  return [0, 2, 4, 6].map(index => parseInt(full.slice(index, index + 2) || 'ff', 16) / (index === 6 ? 255 : 1));
}
const css = ([r, g, b, a]) => [r, g, b, a].some(Number.isNaN) ? null : `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(3)})`;
const withAlpha = (color, alpha) => css(channels(color).map((value, index) => index === 3 ? value * alpha : value)) ?? color;
const blend = (color, base, amount) => css(channels(color).map((value, index) => value * amount + channels(base)[index] * (1 - amount))) ?? color;

export function targetPalette(read) {
  const ink = read('--ink', '#262626'), paper = read('--paper', '#ffffff'), accent = read('--focus', '#3b6a86');
  return {
    ink, paper, accent, surface: read('--surface', '#fafafa'), smoke: read('--muted', '#888888'),
    foil: blend(read('--badge-ink', '#856315'), paper, 0.4), panel: withAlpha(accent, 0.35),
    tail: withAlpha(accent, 0.55), clear: withAlpha(accent, 0),
  };
}

function rock(context, each, colors) {
  context.beginPath();
  each.shape.forEach((scale, index) => {
    const angle = index / each.shape.length * TAU;
    context.lineTo(Math.cos(angle) * scale * each.radius, Math.sin(angle) * scale * each.radius);
  });
  context.closePath();
  context.fillStyle = colors.surface;
  context.fill();
  context.stroke();
  context.lineWidth = 1;
  context.strokeStyle = colors.smoke;
  for (const [x, y, size] of each.craters) {
    context.beginPath();
    context.arc(x * each.radius, y * each.radius, size * each.radius, 0, TAU);
    context.stroke();
  }
}

function satellite(context, each, colors) {
  for (const side of [-1, 1]) {
    // Solar panels on short struts.
    const x = side < 0 ? -21 : 8;
    context.beginPath();
    context.moveTo(side * 5, 0);
    context.lineTo(side * 8, 0);
    context.stroke();
    context.fillStyle = colors.paper;
    context.fillRect(x, -5, 13, 10);
    context.fillStyle = colors.panel;
    context.fillRect(x, -5, 13, 10);
    context.strokeRect(x, -5, 13, 10);
    context.lineWidth = 0.8;
    context.beginPath();
    context.moveTo(x + 6.5, -5);
    context.lineTo(x + 6.5, 5);
    context.moveTo(x, 0);
    context.lineTo(x + 13, 0);
    context.stroke();
    context.lineWidth = 1.4;
  }
  context.fillStyle = colors.foil;
  context.fillRect(-5, -6, 10, 12);
  context.strokeRect(-5, -6, 10, 12);
  // An antenna dish on top.
  context.beginPath();
  context.moveTo(0, -6);
  context.lineTo(0, -9);
  context.stroke();
  context.beginPath();
  context.arc(0, -12, 3.2, 0.1 * Math.PI, 0.9 * Math.PI);
  context.stroke();
}

function ufo(context, each, colors) {
  context.fillStyle = colors.surface;
  context.beginPath();
  context.ellipse(0, -3, 7, 6.5, 0, Math.PI, TAU);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = colors.paper;
  context.beginPath();
  context.ellipse(0, 0, 15, 4.5, 0, 0, TAU);
  context.fill();
  context.stroke();
  // Lights chase around the rim.
  for (let index = 0; index < 3; index++) {
    context.fillStyle = Math.floor(each.age * 6) % 3 === index ? colors.accent : colors.surface;
    context.beginPath();
    context.arc((index - 1) * 7, 0.5, 1.6, 0, TAU);
    context.fill();
  }
}

// Drawn travelling along +x, with its tail streaming behind.
function comet(context, each, colors) {
  const tail = context.createLinearGradient(0, 0, -46, 0);
  tail.addColorStop(0, colors.tail);
  tail.addColorStop(1, colors.clear);
  context.fillStyle = tail;
  context.beginPath();
  context.moveTo(0, -4.5);
  context.lineTo(-46, 0);
  context.lineTo(0, 4.5);
  context.closePath();
  context.fill();
  context.fillStyle = colors.paper;
  context.strokeStyle = colors.accent;
  context.beginPath();
  context.arc(0, 0, 4.5, 0, TAU);
  context.fill();
  context.stroke();
}

const DRAW = { asteroid: rock, rock, satellite, ufo, comet };

export function drawTargets(context, game, colors) {
  context.lineJoin = 'round';
  context.lineCap = 'round';
  for (const each of game.targets) {
    // Targets grow in from a ring of light and swell as they fade away.
    const grow = each.appear ? Math.min(1, each.age / each.appear) : 1;
    const fade = each.out === null ? 1 : Math.max(0, 1 - each.out / VANISH);
    const size = each.out === null ? 1 - (1 - grow) ** 3 : 1 + 0.5 * (1 - fade);
    context.save();
    context.globalAlpha = Math.min(1, grow * 1.5) * fade;
    context.translate(each.x, each.y);
    context.rotate(each.angle);
    context.scale(size, size);
    context.lineWidth = 1.4;
    context.strokeStyle = colors.ink;
    DRAW[each.kind](context, each, colors);
    context.restore();
    if (grow < 1) {
      context.globalAlpha = 1 - grow;
      context.strokeStyle = colors.accent;
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(each.x, each.y, each.radius * (0.6 + 1.4 * grow), 0, TAU);
      context.stroke();
    }
  }
  context.globalAlpha = 1;
}
