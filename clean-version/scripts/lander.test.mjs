import assert from 'node:assert/strict';
import test from 'node:test';
import { createFlight, step, pilot, release, resize, resting, home, surfaceAt, installLander, SIZE, SAFE_LANDING } from '../assets/lander.js';

const HALF = SIZE / 2;
const run = (flight, seconds, each, platforms = []) => {
  const events = [];
  for (let i = 0; i < Math.round(seconds * 60); i++) { each?.(flight, i); events.push(...step(flight, 1 / 60, platforms)); }
  return events;
};
const hold = (flight, keys) => { for (const key in flight.input) flight.input[key] = keys.includes(key); };
const onPage = flight => flight.x >= HALF && flight.x <= flight.width - HALF && flight.y >= HALF && flight.y <= home(flight).y;
// Small deterministic generator for random flights.
const random = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

test('The lander starts parked on its bottom-right pad and stays there', () => {
  const flight = createFlight(1280, 800);
  assert.deepEqual([flight.x, flight.y], [1280 - 28 - HALF, 800 - 6 - HALF]);
  assert.equal(resting(flight), true);
  run(flight, 2);
  assert.deepEqual([flight.x, flight.y, flight.vx, flight.vy, flight.tilt], [home(flight).x, home(flight).y, 0, 0, 0]);
  assert.equal(resting(flight), true);
});

test('The main engine lifts off; gravity brings a gentle descent back to rest', () => {
  const flight = createFlight(1280, 800);
  pilot(flight);
  hold(flight, ['up']);
  run(flight, 0.6);
  assert.ok(flight.y < home(flight).y - 30, 'lifted off');
  hold(flight, ['up', 'left']);
  run(flight, 0.4);
  assert.ok(flight.x < home(flight).x - 20, 'moved left');
  assert.ok(flight.tilt < 0, 'leans into the turn');
  hold(flight, []);
  const events = run(flight, 6);
  assert.equal(flight.landed, true);
  assert.equal(flight.tilt, 0);
  assert.equal(events.at(-1).type, 'touchdown', 'settles after any bounce');
});

test('No combination of keys flies the lander off the page', () => {
  const next = random(7);
  const flight = createFlight(1024, 700);
  pilot(flight);
  run(flight, 60, (f, i) => {
    if (i % 20 === 0) hold(f, ['up', 'down', 'left', 'right'].filter(() => next() < 0.45));
    f.firing = next() < 0.5;
    assert.ok(onPage(f), `on page at frame ${i}`);
  });
});

test('Hard landings bounce and soft landings settle', () => {
  const flight = createFlight(1280, 800);
  pilot(flight);
  Object.assign(flight, { y: 100, vy: 0, landed: false });
  const hard = run(flight, 7);
  assert.ok(hard.some(event => event.type === 'bounce' && event.speed > SAFE_LANDING));
  assert.equal(flight.landed, true);
  Object.assign(flight, { y: home(flight).y - 10, vy: 60, landed: false });
  const soft = run(flight, 1);
  assert.deepEqual(soft.map(event => event.type), ['touchdown']);
});

test('Letting go flies the lander home from anywhere and parks it on the pad', () => {
  for (const [x, y, vx, vy] of [[40, 40, 0, 0], [640, 300, 300, -200], [40, 772, 0, 0], [1200, 100, -400, 300], [1230, 600, 0, 0]]) {
    const flight = createFlight(1280, 800);
    pilot(flight);
    Object.assign(flight, { x, y, vx, vy, landed: false });
    release(flight);
    let touchdown = 0;
    const events = run(flight, 15, f => { if (!f.returning) return; assert.ok(onPage(f)); });
    for (const event of events) if (event.type === 'touchdown' || event.type === 'bounce') touchdown = Math.max(touchdown, event.speed);
    assert.equal(flight.returning, false, `parked from ${x},${y}`);
    assert.deepEqual([flight.x, flight.y], [home(flight).x, home(flight).y]);
    assert.ok(touchdown < 80, `touched down gently from ${x},${y}`);
    assert.equal(resting(flight), true);
  }
});

test('Reduced motion parks the lander immediately', () => {
  const flight = createFlight(1280, 800);
  pilot(flight);
  Object.assign(flight, { x: 300, y: 200, landed: false });
  release(flight, { instant: true });
  assert.deepEqual([flight.x, flight.y, flight.returning], [home(flight).x, home(flight).y, false]);
});

test('Resizing keeps a parked lander on its pad and a flying one on the page', () => {
  const flight = createFlight(1280, 800);
  assert.equal(resize(flight, 1000, 600), true);
  assert.deepEqual([flight.x, flight.y], [home(flight).x, home(flight).y]);
  pilot(flight);
  Object.assign(flight, { x: 950, y: 100, landed: false });
  assert.equal(resize(flight, 900, 500), false);
  assert.ok(onPage(flight));
});

test('A pilot lands on an image or divider from above and can fly up through it', () => {
  const flight = createFlight(1280, 800);
  const image = { id: 'image', left: 500, right: 740, top: 400 };
  pilot(flight);
  Object.assign(flight, { x: 620, y: 200, landed: false });
  const events = run(flight, 4, null, [image]);
  assert.equal(flight.perch, 'image');
  assert.equal(flight.y + SIZE / 2, 400, 'feet rest on the image');
  assert.equal(events.at(-1).floor, 400);
  assert.equal(resting(flight), true);
  // Taking off again, then climbing from underneath, passes through.
  Object.assign(flight, { y: 500, vy: 0, perch: null, landed: false });
  hold(flight, ['up']);
  run(flight, 1.2, null, [image]);
  assert.ok(flight.y < 350, 'flew up through the image');
  // Holding Down drops through it; letting go lands on the next surface.
  hold(flight, []);
  run(flight, 7, null, [image]);
  assert.equal(flight.perch, 'image');
  hold(flight, ['down']);
  run(flight, 0.3, null, [image]);
  hold(flight, []);
  run(flight, 4, null, [image]);
  assert.equal(flight.perch, null);
  assert.equal(flight.y, home(flight).y, 'dropped to the bottom of the window');
});

test('A perched lander rides its platform as the page scrolls, and falls when it leaves', () => {
  const flight = createFlight(1280, 800);
  const divider = { id: 'divider', left: 100, right: 900, top: 500 };
  pilot(flight);
  Object.assign(flight, { x: 400, y: 300, landed: false });
  run(flight, 4, null, [divider]);
  assert.equal(flight.perch, 'divider');
  for (const top of [440, 520, 300]) {
    divider.top = top;
    run(flight, 0.1, null, [divider]);
    assert.equal(flight.y + SIZE / 2, top, `follows the divider to ${top}`);
  }
  divider.top = 20; // Scrolled out of the top of the window.
  run(flight, 6, null, [divider]);
  assert.equal(flight.perch, null);
  assert.equal(flight.y, home(flight).y, 'fell to the bottom of the window');
});

test('Sliding off a platform edge drops the lander; round images hold it only on top', () => {
  const flight = createFlight(1280, 800);
  const cover = { id: 'cover', left: 300, right: 400, top: 500 };
  pilot(flight);
  Object.assign(flight, { x: 390, y: 400, landed: false });
  run(flight, 3, null, [cover]);
  assert.equal(flight.perch, 'cover');
  hold(flight, ['right']);
  run(flight, 1.5, null, [cover]);
  hold(flight, []);
  run(flight, 4, null, [cover]);
  assert.equal(flight.perch, null);
  assert.equal(flight.y, home(flight).y);
  const portrait = { left: 100, right: 220, top: 100, round: true };
  assert.equal(surfaceAt(portrait, 160), 100);
  assert.ok(surfaceAt(portrait, 180) > 100 && surfaceAt(portrait, 180) < 104);
  assert.equal(surfaceAt(portrait, 110), null, 'too steep near the edge');
});

test('The autopilot flies home through platforms', () => {
  const flight = createFlight(1280, 800);
  const shelf = { id: 'shelf', left: 0, right: 1280, top: 600 };
  pilot(flight);
  Object.assign(flight, { x: 300, y: 300, landed: false });
  run(flight, 4, null, [shelf]);
  assert.equal(flight.perch, 'shelf');
  release(flight);
  run(flight, 15, null, [shelf]);
  assert.deepEqual([flight.x, flight.y, flight.returning], [home(flight).x, home(flight).y, false]);
});

function page({ usable = true, reduced = false, stored = {} } = {}) {
  let frames = [], now = 0;
  const media = query => ({ matches: query.includes('reduced-motion') ? reduced : usable, addEventListener() {} });
  const nodes = [], windowListeners = {};
  const gradient = { addColorStop() {} };
  const context = new Proxy({}, { get: (target, name) => name in target ? target[name] : () => gradient });
  const event = (type, init) => ({ type, defaultPrevented: false, timeStamp: now, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; }, ...init });
  const document = {
    documentElement: { clientWidth: 1280, clientHeight: 800, dataset: { theme: 'light' }, classList: classes() },
    body: { append: (...children) => nodes.push(...children) },
    elementFromPoint: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    createElement(tag) {
      const listeners = {}, list = classes();
      const node = {
        tag, style: {}, attributes: {}, children: [], width: 0, height: 0, textContent: '', innerHTML: '', classList: list,
        setAttribute(name, value) { this.attributes[name] = String(value); },
        set className(value) { value.split(' ').forEach(name => list.add(name)); },
        append(...children) { this.children.push(...children); },
        addEventListener(name, fn) { (listeners[name] ??= []).push(fn); },
        dispatch(type, init = {}) {
          const fired = event(type, init);
          (listeners[type] || []).forEach(fn => fn(fired));
          return fired;
        },
        matches: () => false,
        getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0, width: 0 }),
        focus() { document.activeElement = node; },
        blur() { if (document.activeElement === node) document.activeElement = null; },
        getContext: () => context,
      };
      return node;
    },
  };
  function classes() {
    const names = new Set();
    return { add: name => names.add(name), remove: name => names.delete(name), contains: name => names.has(name), toggle: (name, on) => (on ? names.add(name) : names.delete(name)) };
  }
  const window = {
    devicePixelRatio: 1, matchMedia: media,
    requestAnimationFrame: fn => frames.push(fn), cancelAnimationFrame() {},
    getComputedStyle: () => ({ getPropertyValue: () => '#3b6a86', colorScheme: 'light' }),
    MutationObserver: class { observe() {} },
    addEventListener(name, fn) { (windowListeners[name] ??= new Set()).add(fn); },
    removeEventListener(name, fn) { windowListeners[name]?.delete(fn); },
    clearTimeout() {},
    setTimeout: (fn, delay) => { if (delay === 0) fn(); return 0; },
    localStorage: { getItem: name => stored[name] ?? null, setItem: (name, value) => { stored[name] = String(value); } },
  };
  const { flight, game } = installLander({ document, window });
  const find = name => nodes.find(node => node.classList.contains(name));
  const button = find('lander'), hint = find('lander-hint'), score = find('lander-score'), bar = find('lander-guns'), results = find('lander-results'), status = find('lander-status');
  // Tests name keys by their physical code, as the lander reads them.
  const keyOf = { Space: ' ', KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyM: 'm' };
  const key = (type, code, init) => button.dispatch(type, { code, key: keyOf[code] ?? code, ...init }).defaultPrevented;
  return {
    flight, game, button, document, stored, root: document.documentElement, hint, score, bar, results, status, pending: () => frames.length,
    press: (code, init) => key('keydown', code, init), lift: code => key('keyup', code),
    // Mouse and wheel events reach the window, as in a browser.
    mouse(type, init = {}) {
      const fired = event(type, { button: 0, buttons: 0, clientX: 0, clientY: 0, ...init });
      for (const fn of windowListeners[type] ?? []) fn(fired);
      return fired.defaultPrevented;
    },
    click(init = {}) {
      const fired = event('click', { detail: 1, ...init });
      for (const fn of windowListeners.click ?? []) fn(fired);
      return fired;
    },
    current: () => bar.children.findIndex(slot => slot.classList.contains('is-current')),
    advance(seconds) {
      for (let i = 0; i < Math.round(seconds * 60) && frames.length; i++) {
        const due = frames; frames = []; now += 1000 / 60;
        due.forEach(fn => fn(now));
      }
    },
  };
}

test('Flight keys and the mouse keep working on the page until a visitor chooses to fly', () => {
  const p = page();
  assert.equal(p.pending(), 0, 'a parked lander does not animate');
  assert.equal(p.press('KeyW'), false);
  assert.equal(p.press('Space'), false);
  assert.deepEqual([p.mouse('mousedown', { button: 2 }), p.mouse('mousedown'), p.mouse('contextmenu'), p.mouse('wheel', { deltaY: 100 })], [false, false, false, false]);
  assert.equal(p.click().defaultPrevented, false, 'links still follow clicks');
  p.lift('Space');
  assert.equal(p.flight.piloting, false);
  p.button.dispatch('click');
  assert.equal(p.button.attributes['aria-pressed'], 'true');
  assert.equal(p.root.classList.contains('lander-aiming'), true, 'the crosshair replaces the cursor');
  assert.equal(p.press('KeyW'), true);
  assert.equal(p.press('ArrowUp'), false, 'the arrow keys stay with the page');
  p.advance(0.5);
  assert.ok(p.flight.y < home(p.flight).y - 20);
  p.lift('KeyW');
  assert.equal(p.press('Escape'), true);
  assert.equal(p.button.attributes['aria-pressed'], 'false');
  assert.equal(p.root.classList.contains('lander-aiming'), false);
  assert.equal(p.press('KeyS'), false, 'keys return to the page');
  assert.deepEqual([p.mouse('mousedown', { button: 2 }), p.mouse('mousedown'), p.mouse('contextmenu'), p.mouse('wheel', { deltaY: 100 })], [false, false, false, false], 'and so does the mouse');
  assert.equal(p.click().defaultPrevented, false);
  p.advance(20);
  assert.equal(p.pending(), 0, 'the animation sleeps once the lander is parked and targets are gone');
  assert.deepEqual([p.flight.x, p.flight.y, p.game.targets.length], [home(p.flight).x, home(p.flight).y, 0]);
});

test('The mouse aims, either button fires, and Space does not', () => {
  const p = page();
  p.button.dispatch('click');
  p.game.spawnIn = Infinity;
  assert.equal(p.press('Space'), true, 'Space neither scrolls nor lands');
  assert.equal(p.lift('Space'), true);
  p.advance(0.3);
  assert.equal(p.flight.shots.length, 0);
  p.mouse('mousemove', { clientX: p.flight.x - 400, clientY: p.flight.y });
  assert.equal(p.mouse('contextmenu'), true, 'no context menu while flying');
  assert.equal(p.mouse('mousedown', { button: 2, clientX: p.flight.x - 400, clientY: p.flight.y }), true, 'focus stays on the lander');
  p.advance(0.3);
  assert.ok(p.flight.shots.length > 1);
  assert.ok(p.flight.shots.every(shot => shot.vx < -700), 'shots fly toward the mouse');
  p.mouse('mouseup', { button: 2 });
  const fired = p.flight.shots.length;
  p.advance(0.3);
  assert.ok(p.flight.shots.length <= fired, 'releasing the button stops firing');
  // The left button fires too, and keeps firing while either button is held.
  assert.equal(p.mouse('mousedown', { button: 0, clientX: p.flight.x + 400, clientY: p.flight.y }), true, 'no text selection or focus change');
  p.mouse('mousedown', { button: 2 });
  p.mouse('mouseup', { button: 2, buttons: 1 });
  assert.equal(p.flight.firing, true);
  p.mouse('mouseup', { button: 0, buttons: 0 });
  assert.equal(p.flight.firing, false);
  // A click while flying fires instead of following a link or landing.
  const click = p.click();
  assert.deepEqual([click.defaultPrevented, click.stopped, p.flight.piloting], [true, true, true]);
  assert.equal(p.click({ detail: 0 }).defaultPrevented, false, 'Enter on the lander still lands it');
});

test('The wheel changes guns once per notch, and the gun bar shows the choice', () => {
  const p = page();
  assert.equal(p.bar.classList.contains('is-shown'), false);
  p.button.dispatch('click');
  assert.equal(p.bar.classList.contains('is-shown'), true);
  assert.deepEqual(p.bar.children.map(slot => slot.innerHTML.match(/<span>(.*)<\/span>/)[1]), ['Blaster', 'Scatter', 'Rapid', 'Laser', 'Missiles']);
  assert.equal(p.current(), 0);
  assert.equal(p.mouse('wheel', { deltaY: 100 }), true, 'the page does not scroll');
  assert.equal(p.current(), 1);
  p.advance(0.1);
  p.mouse('wheel', { deltaY: -100 });
  p.advance(0.1);
  p.mouse('wheel', { deltaY: -100 });
  assert.equal(p.current(), 4, 'wraps around to the last gun');
  assert.match(p.status.textContent, /Missiles selected/);
  p.advance(0.1);
  for (let i = 0; i < 4; i++) p.mouse('wheel', { deltaY: 12 });
  assert.equal(p.current(), 4, 'small trackpad movements add up first');
  p.mouse('wheel', { deltaY: 12 });
  assert.equal(p.current(), 0);
  assert.equal(p.mouse('wheel', { deltaY: 100, ctrlKey: true }), false, 'Control-scroll still zooms');
  assert.equal(p.mouse('wheel', { deltaMode: 1, deltaY: 3 }), true, 'line-based wheels count too');
  assert.equal(p.current(), 0, 'but not twice within a moment');
  p.advance(0.1);
  p.mouse('wheel', { deltaMode: 1, deltaY: 3 });
  assert.equal(p.current(), 1);
});

test('The laser fires with the right button and drains its meter in the gun bar', () => {
  const p = page();
  p.button.dispatch('click');
  for (let i = 0; i < 3; i++) { p.mouse('wheel', { deltaY: 100 }); p.advance(0.1); }
  assert.equal(p.current(), 3);
  p.mouse('mousedown', { button: 2, clientX: p.flight.x, clientY: 0 });
  p.advance(1);
  assert.ok(p.flight.beam, 'the laser fires');
  const meter = p.bar.children[3].children[0].children[0];
  assert.match(meter.style.width, /^\d+%$/);
  assert.ok(parseInt(meter.style.width) < 70);
  p.mouse('mouseup', { button: 2 });
  p.advance(0.1);
  assert.equal(p.flight.beam, null);
});

test('Each round lasts a minute; the result and best score follow', () => {
  const p = page();
  p.button.dispatch('click');
  p.game.spawnIn = Infinity;
  assert.equal(p.score.classList.contains('is-shown'), true);
  assert.deepEqual(p.score.children.map(child => child.textContent), ['Score', '0', '', '1:00']);
  p.game.targets.push({ kind: 'satellite', x: p.flight.x, y: p.flight.y - 150, vx: 0, vy: 0, radius: 15, points: 25, age: 1, angle: 0, spin: 0, appear: 0, life: Infinity, out: null });
  p.mouse('mousedown', { button: 2, clientX: p.flight.x, clientY: p.flight.y - 300 });
  p.advance(0.5);
  p.mouse('mouseup', { button: 2 });
  assert.equal(p.game.score, 25);
  assert.deepEqual(p.score.children.slice(1, 3).map(child => child.textContent), ['25', 'Best 25']);
  p.advance(51);
  assert.equal(p.score.children[3].textContent, '0:09');
  assert.equal(p.score.children[3].classList.contains('is-ending'), true, 'the last seconds stand out');
  p.advance(9);
  assert.equal(p.flight.piloting, false, 'time is up');
  assert.match(p.results.innerHTML, /Time’s up!.*<strong>25<\/strong>.*New best!/);
  assert.equal(p.results.classList.contains('is-shown'), true);
  assert.equal(p.bar.classList.contains('is-shown'), false);
  assert.match(p.status.textContent, /Time’s up\. 25 points, a new best\./);
  p.button.dispatch('click');
  assert.deepEqual([p.game.score, p.game.remaining, p.score.children[2].textContent], [0, 60, 'Best 25']);
  p.press('Escape');
  assert.match(p.results.innerHTML, /Landed.*<strong>0<\/strong>.*Best 25/);
});

test('A note points first-time visitors at the lander until they fly', () => {
  const p = page();
  assert.equal(p.hint.hidden, false);
  assert.match(p.hint.innerHTML, /<svg viewBox="0 0 150 80"/);
  assert.equal(p.hint.attributes['aria-hidden'], 'true', 'the lander itself is labeled for screen readers');
  p.button.dispatch('click');
  assert.equal(p.hint.hidden, true);
  assert.equal(p.stored['jordan-bailey-lander-played'], 'true');
  p.press('Escape');
  assert.equal(p.hint.hidden, true, 'it does not come back');
  assert.equal(page({ stored: { 'jordan-bailey-lander-played': 'true' } }).hint.hidden, true, 'nor on later visits');
});

test('M mutes and unmutes the sound, and the choice is remembered', () => {
  const p = page();
  p.button.dispatch('click');
  assert.equal(p.press('KeyM'), true);
  assert.match(p.status.textContent, /Sound off/);
  assert.equal(p.press('KeyM', { repeat: true }), true, 'holding M does not flip it back');
  assert.match(p.status.textContent, /Sound off/);
  assert.equal(p.stored['jordan-bailey-lander-muted'], 'true');
  p.press('KeyM');
  assert.match(p.status.textContent, /Sound on/);
  assert.equal(p.stored['jordan-bailey-lander-muted'], 'false');
});

test('Focus leaving the lander or a second click hands control back', () => {
  const p = page();
  p.button.dispatch('click');
  p.button.dispatch('blur');
  assert.equal(p.flight.piloting, true, 'switching windows keeps the lander focused');
  p.document.activeElement = null;
  p.button.dispatch('blur');
  assert.equal(p.flight.piloting, false);
  assert.equal(p.game.playing, false);
  p.button.dispatch('click');
  p.button.dispatch('click');
  assert.equal(p.flight.piloting, false);
  assert.equal(p.press('KeyA'), false);
});

test('Mouse pilots get Space back after landing; keyboard pilots keep focus', () => {
  const mouse = page();
  mouse.button.dispatch('click', { detail: 1 });
  assert.equal(mouse.document.activeElement, mouse.button);
  mouse.press('Escape');
  assert.equal(mouse.document.activeElement, null, 'Space scrolls the page instead of relaunching');
  mouse.button.dispatch('click', { detail: 1 });
  mouse.button.dispatch('click', { detail: 1 });
  assert.equal([mouse.flight.piloting, mouse.document.activeElement].join(), 'false,');
  const keyboard = page();
  keyboard.button.dispatch('click', { detail: 0 });
  keyboard.press('Escape');
  assert.equal(keyboard.document.activeElement, keyboard.button);
});

test('Browser shortcuts with modifier keys still work while flying', () => {
  const p = page();
  p.button.dispatch('click');
  assert.equal(p.press('KeyA', { ctrlKey: true }), false, 'Ctrl+A still selects');
  assert.equal(p.press('KeyW', { metaKey: true }), false, 'Cmd+W still closes the tab');
  assert.equal(p.press('KeyD', { altKey: true }), false);
});

test('Touch-only or narrow screens never take the keyboard or mouse', () => {
  const p = page({ usable: false });
  p.button.dispatch('click');
  assert.equal(p.flight.piloting, false);
  assert.equal(p.press('KeyW'), false);
  assert.equal(p.mouse('contextmenu'), false);
  assert.equal(p.pending(), 0);
});
