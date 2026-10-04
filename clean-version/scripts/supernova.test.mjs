import assert from 'node:assert/strict';
import test from 'node:test';
import { installSupernova } from '../assets/supernova.js';

const settle = () => new Promise(resolve => setImmediate(resolve));
function page({ theme = 'light', reduced = false, hidden = false, pending = false, unavailable = false } = {}) {
  const documentEvents = {}, windowEvents = {};
  let observe, mediaChange, finishLoad;
  let loads = 0;
  const instances = [];
  const document = {
    documentElement: { dataset: { theme } }, hidden,
    addEventListener(name, fn) { documentEvents[name] = fn; },
  };
  const media = { matches: reduced, addEventListener(name, fn) { mediaChange = fn; } };
  const window = {
    matchMedia: () => media,
    MutationObserver: class { constructor(fn) { observe = fn; } observe() {} },
    addEventListener(name, fn) { windowEvents[name] = fn; },
  };
  const module = { createStarfield() {
    if (unavailable) throw Error('WebGL unavailable');
    const field = { moving: false, disposed: false,
      setMotion(value) { this.moving = value; },
      dispose() { this.moving = false; this.disposed = true; },
    };
    instances.push(field);
    return field;
  } };
  installSupernova({ document, window, load: () => {
    loads++;
    return pending ? new Promise(resolve => { finishLoad = () => resolve(module); }) : Promise.resolve(module);
  } });
  return {
    instances, loads: () => loads,
    choose(value) { document.documentElement.dataset.theme = value; observe(); },
    visibility(value) { document.hidden = value; documentEvents.visibilitychange(); },
    reduce(value) { media.matches = value; mediaChange(); },
    navigate() { windowEvents.pagehide(); },
    restore() { windowEvents.pageshow(); },
    finish() { finishLoad(); },
  };
}

test('Other themes never load 3D code; Supernova starts and disposes on deselection', async () => {
  const p = page(); await settle();
  assert.equal(p.loads(), 0);
  p.choose('supernova'); await settle();
  assert.equal(p.instances.length, 1);
  assert.equal(p.instances[0].moving, true);
  p.choose('coal');
  assert.equal(p.instances[0].disposed, true);
  p.choose('supernova'); await settle();
  assert.equal(p.loads(), 1);
  assert.equal(p.instances.length, 2);
});

test('Saved Supernova respects reduced motion and live motion/visibility changes', async () => {
  const p = page({ theme: 'supernova', reduced: true }); await settle();
  assert.equal(p.instances[0].moving, false);
  p.reduce(false); await settle();
  assert.equal(p.instances[0].moving, true);
  p.visibility(true); await settle();
  assert.equal(p.instances[0].moving, false);
  p.visibility(false); await settle();
  assert.equal(p.instances[0].moving, true);
  p.reduce(true); await settle();
  assert.equal(p.instances[0].moving, false);
  assert.equal(p.instances.length, 1);
});

test('Hidden pages defer loading; navigating away disposes and back navigation restores', async () => {
  const p = page({ theme: 'supernova', hidden: true }); await settle();
  assert.equal(p.loads(), 0);
  p.visibility(false); await settle();
  p.navigate();
  assert.equal(p.instances[0].disposed, true);
  p.restore(); await settle();
  assert.equal(p.instances.length, 2);
  assert.equal(p.instances[1].moving, true);
});

test('Switching away or navigating during a slow load cannot start a stale animation', async () => {
  for (const abandon of [p => p.choose('light'), p => p.navigate(), p => p.visibility(true)]) {
    const p = page({ theme: 'supernova', pending: true });
    abandon(p); p.finish(); await settle();
    assert.equal(p.instances.length, 0);
  }
  const p = page({ theme: 'supernova', pending: true });
  p.choose('light'); p.choose('supernova'); p.finish(); await settle();
  assert.equal(p.instances.length, 1);
});

test('Unavailable graphics fail without breaking theme selection or retrying continuously', async () => {
  const p = page({ theme: 'supernova', unavailable: true }); await settle();
  assert.equal(p.instances.length, 0);
  assert.equal(p.loads(), 1);
  p.choose('light'); await settle();
  assert.equal(p.loads(), 1);
});
