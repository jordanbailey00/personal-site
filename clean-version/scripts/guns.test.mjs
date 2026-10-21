import assert from 'node:assert/strict';
import test from 'node:test';
import { createFlight, pilot, release } from '../assets/lander.js';
import { GUNS, LASER, switchGun, updateGuns } from '../assets/guns.js';
import { createGame, startGame, updateGame, POINTS } from '../assets/space-targets.js';

// Small deterministic generator for repeatable volleys.
const random = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
function setup(gun = 'blaster', { width = 1280, height = 800, x = 640, y = 600 } = {}) {
  const flight = createFlight(width, height), game = createGame();
  pilot(flight);
  Object.assign(flight, { x, y, landed: false, gun: GUNS.findIndex(each => each.id === gun) });
  startGame(game);
  game.spawnIn = Infinity;
  return { flight, game };
}
// Guns move and fire, then the game checks for hits, as each animation frame
// does. Shots are recorded as they were when fired.
function run(flight, game, seconds, each) {
  const events = [], next = random(7);
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    each?.(i);
    events.push(...updateGuns(flight, game, 1 / 60, next).map(event => event.shots ? { ...event, shots: event.shots.map(shot => ({ ...shot })) } : event));
    events.push(...updateGame(game, flight, 1 / 60, next));
  }
  return events;
}
const shots = events => events.filter(event => event.type === 'fire').flatMap(event => event.shots);
const still = (kind, x, y) => ({ kind, x, y, vx: 0, vy: 0, radius: { satellite: 15, ufo: 13 }[kind], points: POINTS[kind], age: 1, angle: 0, spin: 0, appear: 0, life: Infinity, out: null, baseY: y });

test('The blaster fires steadily from the nose, and only a pilot can fire', () => {
  const { flight, game } = setup();
  flight.firing = true;
  const fired = shots(run(flight, game, 1));
  assert.ok(Math.abs(fired.length - 1 / GUNS[0].interval) <= 1.5, `${fired.length} shots in a second`);
  assert.ok(fired.every(shot => shot.vy < -600 && shot.y < flight.y), 'shots leave the docking port upward');
  flight.firing = false;
  run(flight, game, 2);
  assert.equal(flight.shots.length, 0, 'shots leave the page');
  release(flight);
  flight.firing = true;
  assert.equal(shots(run(flight, game, 1)).length, 0);
});

test('Shots fly toward the mouse, and every shot kicks the lander back', () => {
  const { flight, game } = setup();
  flight.aim = { x: flight.x + 300, y: flight.y };
  flight.firing = true;
  const [shot] = shots(run(flight, game, 1 / 60));
  assert.ok(shot.vx > 850 && Math.abs(shot.vy) < 1, 'straight toward the mouse on the right');
  assert.ok(shot.x > flight.x, 'from the side facing the mouse');
  assert.ok(flight.vx < 0, 'recoil pushes the lander away from its aim');
  // With the mouse over the lander, it keeps its last direction.
  flight.aim = { x: flight.x + 2, y: flight.y - 3 };
  flight.cooldown = 0;
  const [next] = shots(run(flight, game, 1 / 60));
  assert.ok(next.vx > 850);
});

test('Scatter fires a short-range fan; Rapid fires quickly with a little spread', () => {
  const scatter = setup('scatter');
  scatter.flight.firing = true;
  const volley = shots(run(scatter.flight, scatter.game, 1 / 60));
  assert.equal(volley.length, 7);
  assert.deepEqual(volley.map(shot => Math.sign(Math.round(shot.vx))), [-1, -1, -1, 0, 1, 1, 1]);
  assert.ok(scatter.flight.vy > 100, 'Scatter kicks hard');
  scatter.flight.firing = false;
  run(scatter.flight, scatter.game, 0.6);
  assert.equal(scatter.flight.shots.length, 0, 'scatter shots fade out after their short range');

  const rapid = setup('rapid');
  rapid.flight.firing = true;
  const stream = shots(run(rapid.flight, rapid.game, 1));
  assert.ok(stream.length >= 17 && stream.length <= 22, `${stream.length} rapid shots in a second`);
  const angles = stream.map(shot => Math.atan2(shot.vx, -shot.vy));
  assert.ok(angles.every(angle => Math.abs(angle) <= 0.06 + 0.01), 'within the spread, allowing for recoil drift');
  assert.ok(new Set(angles.map(angle => angle.toFixed(3))).size > 5, 'shots spread a little');
});

test('Scrolling cycles through every gun in both directions', () => {
  const { flight } = setup();
  flight.cooldown = 0.5;
  assert.equal(switchGun(flight, -1).id, 'missiles', 'wraps from the first gun to the last');
  assert.equal(flight.cooldown, 0.12);
  assert.deepEqual(GUNS.map(() => switchGun(flight, 1).id), ['blaster', 'scatter', 'rapid', 'laser', 'missiles']);
});

test('The laser beams while held, overheats when drained, and recovers', () => {
  const { flight, game } = setup('laser');
  flight.firing = true;
  const events = run(flight, game, 1);
  assert.equal(shots(events).length, 0, 'no projectiles');
  assert.ok(flight.beam && flight.beam.y1 === 0 && flight.beam.x1 === flight.x, 'the beam runs to the top of the window');
  assert.ok(Math.abs(flight.energy - (1 - LASER.drain)) < 0.02);
  const drained = run(flight, game, 1 / LASER.drain - 1 + 0.05);
  assert.deepEqual([flight.overheated, flight.beam], [true, null]);
  assert.deepEqual(drained.filter(event => event.type === 'overheat' || event.type === 'beam').map(event => event.type), ['overheat', 'beam']);
  // Still holding Space, it recharges until it can fire again.
  run(flight, game, LASER.resume / LASER.charge + 0.1);
  assert.equal(flight.overheated, false);
  assert.notEqual(flight.beam, null);
  flight.firing = false;
  run(flight, game, 5);
  assert.equal(flight.energy, 1);
});

test('The laser burns through everything its width touches', () => {
  const { flight, game } = setup('laser');
  game.targets.push(still('satellite', 640, 200), still('satellite', 655, 300), still('satellite', 700, 250));
  flight.firing = true;
  const hits = run(flight, game, 1 / 60).filter(event => event.type === 'hit');
  assert.deepEqual(hits.map(event => [event.target.y, event.by]), [[200, 'laser'], [300, 'laser']], 'both in line, not the one beside it');
  assert.equal(flight.beam.y1, 0, 'the beam reaches the edge of the window');
  assert.equal(game.score, 2 * POINTS.satellite);
});

test('Missiles leave from alternate sides and home in on a target', () => {
  const { flight, game } = setup('missiles');
  game.targets.push(still('ufo', 1000, 250));
  flight.firing = true;
  const pair = shots(run(flight, game, 0.5));
  assert.deepEqual(pair.map(shot => Math.sign(shot.vx)), [-1, 1]);
  flight.firing = false;
  const events = run(flight, game, 3);
  assert.ok(events.some(event => event.type === 'hit' && event.target.kind === 'ufo'), 'a missile found the saucer');
  assert.ok(events.some(event => event.type === 'explode'));
  assert.equal(game.score, POINTS.ufo);
});

test('Missiles go after the target nearest the mouse', () => {
  const { flight, game } = setup('missiles');
  game.targets.push(still('ufo', 300, 300), still('satellite', 1000, 300));
  flight.aim = { x: 980, y: 320 };
  flight.firing = true;
  run(flight, game, 1 / 60);
  flight.firing = false;
  const hits = run(flight, game, 3).filter(event => event.type === 'hit');
  assert.deepEqual(hits.map(event => event.target.kind), ['satellite']);
});

test('A missile burst takes out neighbors; a missile with nothing to hit fizzles', () => {
  const { flight, game } = setup('missiles');
  game.targets.push(still('satellite', 600, 250), still('satellite', 640, 260));
  flight.firing = true;
  run(flight, game, 1 / 60);
  flight.firing = false;
  const hits = run(flight, game, 3).filter(event => event.type === 'hit');
  assert.equal(hits.length, 2, 'one burst destroys both satellites');
  assert.equal(game.score, 2 * POINTS.satellite);

  const lonely = setup('missiles', { width: 4000, height: 4000, x: 2000, y: 3500 });
  lonely.flight.firing = true;
  run(lonely.flight, lonely.game, 1 / 60);
  lonely.flight.firing = false;
  const events = run(lonely.flight, lonely.game, 3.2);
  assert.equal(events.filter(event => event.type === 'fizzle').length, 1);
  assert.equal(lonely.flight.shots.length, 0);
});
