import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, startGame, endGame, updateGame, targetPalette, POINTS } from '../assets/space-targets.js';

// Small deterministic generator for repeatable games.
const random = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const flightAt = (x = 1200, y = 750) => ({ x, y, width: 1280, height: 800, shots: [] });
// Shots move as the flight model moves them, then the game checks for hits.
const run = (game, flight, seconds, next = random(3), each) => {
  const events = [];
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    each?.(i);
    for (const shot of flight.shots) { shot.x += shot.vx / 60; shot.y += shot.vy / 60; }
    events.push(...updateGame(game, flight, 1 / 60, next));
  }
  return events;
};
const still = (kind, x, y, details = {}) => ({ kind, x, y, vx: 0, vy: 0, radius: { asteroid: 18, rock: 10, satellite: 15, ufo: 13, comet: 9 }[kind], points: POINTS[kind], age: 1, angle: 0, spin: 0, appear: 0.35, life: Infinity, out: null, shape: [1, 1, 1, 1, 1, 1, 1], craters: [], ...details });
// A shot fired straight up from below a point, as the lander fires it.
const shotBelow = (x, y, distance = 60) => ({ x, y: y + distance, vx: 0, vy: -760, age: 0 });

test('Targets appear only during a game, up to a limit that grows with time', () => {
  const game = createGame(), flight = flightAt();
  run(game, flight, 5);
  assert.equal(game.targets.length, 0, 'nothing appears before the visitor flies');
  startGame(game);
  let most = 0;
  run(game, flight, 15, random(9), () => { most = Math.max(most, game.targets.filter(each => each.out === null).length); });
  assert.ok(most > 0 && most <= 3, `${most} targets in the first 15 seconds`);
  run(game, flight, 120, random(11), () => { most = Math.max(most, game.targets.filter(each => each.out === null).length); });
  assert.ok(most > 3 && most <= 6, `${most} targets at most`);
  assert.ok(game.targets.every(each => each.x > -60 && each.x < 1340 && each.y > -60 && each.y < 860));
});

test('New targets warp in clear of the lander', () => {
  const game = createGame(), flight = flightAt(640, 300);
  startGame(game);
  const next = random(5), spawned = [];
  for (let i = 0; i < 90 * 60; i++) {
    for (const event of updateGame(game, flight, 1 / 60, next)) if (event.type === 'spawn') spawned.push({ ...event.target });
  }
  assert.ok(spawned.length > 20);
  for (const each of spawned.filter(each => each.appear > 0)) assert.ok(Math.hypot(each.x - 640, each.y - 300) > 160, `${each.kind} at ${Math.round(each.x)},${Math.round(each.y)}`);
  assert.deepEqual(new Set(spawned.map(each => each.kind)), new Set(['asteroid', 'satellite', 'ufo', 'comet']));
});

test('A shot that crosses a target scores its points; asteroids break into rocks', () => {
  const game = createGame(), flight = flightAt();
  startGame(game);
  game.spawnIn = Infinity;
  game.targets.push(still('asteroid', 400, 300), still('satellite', 900, 200));
  flight.shots.push(shotBelow(400, 300), shotBelow(900, 200), shotBelow(100, 100));
  const hits = run(game, flight, 0.2).filter(event => event.type === 'hit');
  assert.deepEqual(hits.map(event => [event.target.kind, event.points]), [['asteroid', 10], ['satellite', 25]]);
  assert.equal(game.score, 35);
  assert.deepEqual(game.targets.map(each => each.kind), ['rock', 'rock']);
  assert.equal(flight.shots.length, 1, 'the miss keeps flying');
});

test('Fast shots cannot skip over small targets between frames', () => {
  const game = createGame(), flight = flightAt();
  startGame(game);
  game.spawnIn = Infinity;
  game.targets.push(still('comet', 500, 300));
  // Placed so neither this frame's start nor end point is inside the comet.
  flight.shots.push({ x: 500, y: 290, vx: 0, vy: -1200, age: 0 });
  assert.deepEqual(updateGame(game, flight, 1 / 60, random(1)).map(event => event.type), ['hit']);
  assert.equal(game.score, 100);
});

test('Targets warp out when their time is up or the pilot lands, and cannot be hit while leaving', () => {
  const game = createGame(), flight = flightAt();
  startGame(game);
  game.spawnIn = Infinity;
  game.targets.push(still('satellite', 300, 300, { life: 3 }), still('ufo', 700, 300, { baseY: 300 }));
  run(game, flight, 2.1);
  assert.notEqual(game.targets[0].out, null, 'the satellite is leaving');
  flight.shots.push(shotBelow(300, 300, 20));
  run(game, flight, 0.1);
  assert.equal(game.score, 0);
  run(game, flight, 0.5);
  assert.deepEqual(game.targets.map(each => each.kind), ['ufo']);
  endGame(game);
  run(game, flight, 0.5);
  assert.equal(game.targets.length, 0);
});

test('The best score outlasts each game', () => {
  const game = createGame(), flight = flightAt();
  startGame(game);
  game.spawnIn = Infinity;
  game.targets.push(still('ufo', 500, 300, { baseY: 300 }));
  flight.shots.push(shotBelow(500, 300));
  run(game, flight, 0.2);
  endGame(game);
  startGame(game);
  assert.deepEqual([game.score, game.best], [0, 50]);
});

test('Theme colors become canvas colors, including translucent accents', () => {
  const css = { '--ink': '#262626', '--paper': '#fff', '--focus': '#3b6a86', '--muted': '#0006', '--badge-ink': '#856315' };
  const colors = targetPalette((name, fallback) => css[name] ?? fallback);
  assert.equal(colors.panel, 'rgba(59, 106, 134, 0.35)');
  assert.equal(colors.clear, 'rgba(59, 106, 134, 0)');
  assert.equal(colors.foil, 'rgba(206, 193, 161, 1)');
  assert.equal(targetPalette(() => 'rgb(1, 2, 3)').panel, 'rgb(1, 2, 3)', 'non-hex colors pass through');
});
