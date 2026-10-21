// Guns for the homepage lander. The visitor aims with the mouse, fires with
// the right mouse button, and scrolls to change guns. This module decides
// what each gun fires, how its shots fly, its recoil, and the laser's energy;
// like the flight model, it has no DOM dependencies. drawShots() paints shots
// and the beam.

export const GUNS = [
  { id: 'blaster', name: 'Blaster', interval: 0.12, spread: [0], speed: 900, life: 2, recoil: 18 },
  { id: 'scatter', name: 'Scatter', interval: 0.5, spread: [-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36], speed: 780, life: 0.5, recoil: 110 },
  { id: 'rapid', name: 'Rapid', interval: 0.05, spread: [0], jitter: 0.06, speed: 1000, life: 1.6, recoil: 6 },
  // The laser pushes back steadily while it fires.
  { id: 'laser', name: 'Laser', beam: true, recoil: 160 },
  // Missiles leave alternately to each side, then home in and burst.
  { id: 'missiles', name: 'Missiles', interval: 0.45, spread: [-0.55, 0.55], alternate: true, speed: 260, life: 3, homing: true, splash: 64, recoil: 40 },
];
const MAX_SHOTS = 80, MUZZLE = 16, MISSILE_SPEED = 640, MISSILE_THRUST = 1100, MISSILE_TURN = 5;
// The laser drains its energy while firing, overheats when empty, and fires
// again once it has recharged a little. Its beam is wide and pierces.
export const LASER = { drain: 0.45, charge: 0.32, resume: 0.3, width: 7 };
const TAU = Math.PI * 2;

export function switchGun(flight, step) {
  flight.gun = (flight.gun + step + GUNS.length) % GUNS.length;
  flight.cooldown = Math.min(flight.cooldown, 0.12);
  return GUNS[flight.gun];
}

// Unit vector from the lander toward the mouse. It keeps the last direction
// while the mouse is on the lander, and points straight up until it moves.
export function aimOf(flight) {
  if (flight.aim) {
    const dx = flight.aim.x - flight.x, dy = flight.aim.y - flight.y, length = Math.hypot(dx, dy);
    if (length >= 8) flight.aimDirection = { x: dx / length, y: dy / length };
  }
  return flight.aimDirection ?? { x: 0, y: -1 };
}

// From the muzzle to the edge of the window.
function beamFrom(flight, aim, time) {
  const x0 = flight.x + aim.x * MUZZLE, y0 = flight.y + aim.y * MUZZLE;
  const reach = Math.max(0, Math.min(aim.y < 0 ? -y0 / aim.y : Infinity, aim.y > 0 ? (flight.height - y0) / aim.y : Infinity, aim.x < 0 ? -x0 / aim.x : Infinity, aim.x > 0 ? (flight.width - x0) / aim.x : Infinity));
  return { x0, y0, x1: x0 + aim.x * reach, y1: y0 + aim.y * reach, width: LASER.width, time };
}

// A missile locks onto the target nearest the mouse (or nearest ahead) and
// keeps that lock while the target lasts.
function steer(shot, targets, aimPoint, dt) {
  if (!targets.includes(shot.lock) || shot.lock.out !== null) {
    let best = Infinity;
    shot.lock = null;
    for (const each of targets) {
      if (each.out !== null) continue;
      const dx = each.x - shot.x, dy = each.y - shot.y;
      const cost = aimPoint ? Math.hypot(each.x - aimPoint.x, each.y - aimPoint.y) : Math.hypot(dx, dy) * (dx * shot.vx + dy * shot.vy < 0 ? 2.5 : 1);
      if (cost < best) { best = cost; shot.lock = each; }
    }
  }
  let heading = Math.atan2(shot.vy, shot.vx);
  if (shot.lock) {
    const turn = ((Math.atan2(shot.lock.y - shot.y, shot.lock.x - shot.x) - heading) % TAU + 3 * Math.PI) % TAU - Math.PI;
    heading += Math.max(-MISSILE_TURN * dt, Math.min(MISSILE_TURN * dt, turn));
  }
  const speed = Math.min(MISSILE_SPEED, Math.hypot(shot.vx, shot.vy) + MISSILE_THRUST * dt);
  shot.vx = Math.cos(heading) * speed;
  shot.vy = Math.sin(heading) * speed;
}

export function updateGuns(flight, game, dt, random = Math.random) {
  const events = [];
  for (const shot of flight.shots) {
    shot.px = shot.x;
    shot.py = shot.y;
    if (shot.homing) steer(shot, game.targets, flight.aim, dt);
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.age += dt;
    if (shot.homing && shot.age >= shot.life) events.push({ type: 'fizzle', x: shot.x, y: shot.y });
  }
  flight.shots = flight.shots.filter(shot => shot.age < shot.life && shot.x > -20 && shot.x < flight.width + 20 && shot.y > -20 && shot.y < flight.height + 20);

  const gun = GUNS[flight.gun], aim = aimOf(flight);
  const pulling = flight.piloting && flight.firing;
  const beaming = !!flight.beam;
  if (gun.beam && pulling && !flight.overheated) {
    flight.energy = Math.max(0, flight.energy - LASER.drain * dt);
    flight.beam = beamFrom(flight, aim, (flight.beam?.time ?? 0) + dt);
    flight.vx -= aim.x * gun.recoil * dt;
    flight.vy -= aim.y * gun.recoil * dt;
    if (flight.energy === 0) {
      flight.overheated = true;
      events.push({ type: 'overheat' });
    }
  } else {
    flight.beam = null;
    flight.energy = Math.min(1, flight.energy + LASER.charge * dt);
    if (flight.overheated && flight.energy >= LASER.resume) flight.overheated = false;
  }
  if (beaming !== !!flight.beam) events.push({ type: 'beam', on: !!flight.beam });

  // Reload time carries over between frames, so fire rates hold at any frame rate.
  flight.cooldown -= dt;
  if (!gun.beam && pulling && flight.cooldown <= 1e-9 && flight.shots.length < MAX_SHOTS) {
    const x = flight.x + aim.x * MUZZLE, y = flight.y + aim.y * MUZZLE, heading = Math.atan2(aim.y, aim.x);
    const spread = gun.alternate ? [gun.spread[flight.salvo++ % gun.spread.length]] : gun.spread;
    const shots = spread.map(angle => {
      const direction = heading + angle + (gun.jitter ? (random() - 0.5) * 2 * gun.jitter : 0);
      return {
        gun: gun.id, x, y, px: x, py: y, age: 0, life: gun.life, homing: !!gun.homing, splash: gun.splash ?? 0, lock: null,
        vx: gun.speed * Math.cos(direction) + flight.vx * 0.3, vy: gun.speed * Math.sin(direction) + flight.vy * 0.3,
      };
    });
    flight.shots.push(...shots);
    // Every shot kicks the lander back a little; Scatter kicks hard.
    flight.vx -= aim.x * gun.recoil;
    flight.vy -= aim.y * gun.recoil;
    flight.cooldown += gun.interval;
    events.push({ type: 'fire', gun: gun.id, x, y, aim, shots });
  }
  flight.cooldown = Math.max(0, flight.cooldown);
  return events;
}

// A glowing streak: a wide soft glow, the colored body, and a hot core.
function streak(context, shot, tail, width, colors) {
  const x0 = shot.x - shot.vx * tail, y0 = shot.y - shot.vy * tail;
  for (const [scale, alpha, color] of [[3, 0.18, colors.accent], [1.6, 0.6, colors.accent], [0.6, 1, colors.hot]]) {
    context.globalAlpha *= alpha;
    context.strokeStyle = color;
    context.lineWidth = width * scale;
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(shot.x, shot.y);
    context.stroke();
    context.globalAlpha /= alpha;
  }
}

function missile(context, shot, colors) {
  context.save();
  context.translate(shot.x, shot.y);
  context.rotate(Math.atan2(shot.vy, shot.vx));
  context.scale(1.3, 1.3);
  // A flickering flame, then the body with its fins.
  context.fillStyle = colors.flame;
  context.beginPath();
  context.moveTo(-5, -1.8);
  context.lineTo(-10 - Math.random() * 5, 0);
  context.lineTo(-5, 1.8);
  context.fill();
  context.fillStyle = colors.paper;
  context.strokeStyle = colors.ink;
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(7, 0);
  context.lineTo(3.5, -2);
  context.lineTo(-5, -2);
  context.lineTo(-6.5, -3.8);
  context.lineTo(-6.5, 3.8);
  context.lineTo(-5, 2);
  context.lineTo(3.5, 2);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

// The laser: a pulsing glow around a white-hot core, two strands of energy
// spiralling along it, and a flare with turning spikes at the muzzle. It
// grows to full width as it charges.
function beamOf(context, beam, colors, clock) {
  const length = Math.hypot(beam.x1 - beam.x0, beam.y1 - beam.y0);
  if (!length) return;
  const grow = Math.min(1, beam.time / 0.12), pulse = 0.85 + 0.15 * Math.sin(clock * 40) + Math.random() * 0.1;
  const width = beam.width * 2 * grow * pulse;
  context.save();
  context.translate(beam.x0, beam.y0);
  context.rotate(Math.atan2(beam.y1 - beam.y0, beam.x1 - beam.x0));
  context.globalCompositeOperation = colors.dark ? 'lighter' : 'source-over';
  context.lineCap = 'round';
  for (const [scale, alpha, color] of [[2.6, 0.12, colors.accent], [1.3, 0.45, colors.accent], [0.5, 1, colors.hot]]) {
    context.globalAlpha = alpha;
    context.strokeStyle = color;
    context.lineWidth = width * scale;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(length, 0);
    context.stroke();
  }
  context.globalAlpha = 0.75;
  context.strokeStyle = colors.hot;
  context.lineWidth = 1.3;
  for (const phase of [0, Math.PI]) {
    context.beginPath();
    for (let x = 0; x <= length; x += 6) context.lineTo(x, Math.sin(x * 0.07 - clock * 32 + phase) * width * 0.6);
    context.stroke();
  }
  const radius = (14 + 6 * grow) * pulse, flare = context.createRadialGradient(0, 0, 0, 0, 0, radius);
  flare.addColorStop(0, colors.hot);
  flare.addColorStop(0.35, colors.tail);
  flare.addColorStop(1, colors.clear);
  context.globalAlpha = 1;
  context.fillStyle = flare;
  context.beginPath();
  context.arc(0, 0, radius, 0, TAU);
  context.fill();
  context.globalAlpha = 0.8;
  context.lineWidth = 1.2;
  for (let spike = 0; spike < 4; spike++) {
    const angle = clock * 3 + spike * Math.PI / 2;
    context.beginPath();
    context.moveTo(Math.cos(angle) * 4, Math.sin(angle) * 4);
    context.lineTo(Math.cos(angle) * radius * 1.5, Math.sin(angle) * radius * 1.5);
    context.stroke();
  }
  context.restore();
}

export function drawShots(context, flight, colors, clock = 0) {
  context.lineCap = 'round';
  for (const shot of flight.shots) {
    context.globalAlpha = 1;
    if (shot.gun === 'missiles') missile(context, shot, colors);
    else if (shot.gun === 'rapid') {
      // Tracers: a thin trail behind a bright round.
      streak(context, shot, 0.02, 1.4, colors);
      context.fillStyle = colors.hot;
      context.beginPath();
      context.arc(shot.x, shot.y, 2.2, 0, TAU);
      context.fill();
    } else if (shot.gun === 'scatter') {
      // Scatter shots fade out at the end of their short range.
      context.globalAlpha = 1 - (shot.age / shot.life) ** 3;
      streak(context, shot, 0.012, 2.6, colors);
    } else streak(context, shot, 0.022, 2.6, colors);
  }
  context.globalAlpha = 1;
  if (flight.beam) beamOf(context, flight.beam, colors, clock);
}
