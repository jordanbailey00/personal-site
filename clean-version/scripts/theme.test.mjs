import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import { posts } from '../content/writing/posts.mjs';
import { writingList } from './writing.mjs';

const script = await readFile(new URL('../assets/theme.js', import.meta.url), 'utf8');
function page({ saved = null, dark = false, blocked = false } = {}) {
  const handlers = {}, device = {}, pickerEvents = {};
  const root = { dataset: {} }, meta = {};
  const inputs = ['auto', 'light', 'rust', 'coal', 'navy', 'ayu'].map(value => ({ value, checked: false }));
  const summary = { focus() {} };
  const picker = { hidden: true, querySelectorAll: () => inputs, querySelector: () => summary, addEventListener: (name, fn) => { pickerEvents[name] = fn; }, contains: () => false };
  const system = { matches: dark, addEventListener: (name, fn) => { device[name] = fn; } };
  const document = { documentElement: root, querySelector: () => ({ setAttribute: (name, value) => { meta[name] = value; } }), querySelectorAll: () => [picker], addEventListener: (name, fn) => { handlers[name] = fn; } };
  const window = { matchMedia: () => system, addEventListener: (name, fn) => { handlers[name] = fn; } };
  const localStorage = { getItem() { if (blocked) throw Error('Storage unavailable'); return saved; }, setItem(key, value) { if (blocked) throw Error('Storage unavailable'); saved = value; } };
  vm.runInNewContext(script, { document, window, localStorage });
  const initial = root.dataset.theme;
  handlers.DOMContentLoaded();
  return {
    initial, root, picker, inputs, meta, saved: () => saved,
    choose(value) { pickerEvents.change({ target: { value, matches: () => true } }); },
    device(dark) { system.matches = dark; device.change(); },
    storage(value, key = 'jordan-bailey-theme') { handlers.storage({ key, newValue: value }); },
  };
}

test('Auto follows live device changes; explicit themes override the device', () => {
  const p = page();
  assert.equal(p.initial, 'light');
  p.device(true); assert.equal(p.root.dataset.theme, 'coal');
  p.choose('rust'); p.device(false); p.device(true);
  assert.equal(p.root.dataset.theme, 'rust');
  p.choose('auto'); assert.equal(p.root.dataset.theme, 'coal');
  assert.equal(p.saved(), 'auto');
});

test('Every explicit selection persists when another page loads', () => {
  for (const theme of ['light', 'rust', 'coal', 'navy', 'ayu']) {
    const first = page(); first.choose(theme);
    const next = page({ saved: first.saved(), dark: true });
    assert.equal(next.initial, theme);
    assert.equal(next.inputs.find(input => input.checked).value, theme);
    assert.equal(next.picker.hidden, false);
    assert.match(next.meta.content, /^#[0-9a-f]{6}$/);
  }
});

test('Old dark preference migrates; invalid or blocked storage still works', () => {
  assert.equal(page({ saved: 'dark' }).initial, 'coal');
  assert.equal(page({ saved: 'unknown', dark: true }).initial, 'coal');
  const p = page({ blocked: true }); p.choose('navy');
  assert.equal(p.root.dataset.theme, 'navy');
});

test('Cross-tab changes synchronize; unrelated storage events do not', () => {
  const p = page({ saved: 'light', dark: true });
  p.storage('ayu'); assert.equal(p.root.dataset.theme, 'ayu');
  p.storage('rust', 'unrelated'); assert.equal(p.root.dataset.theme, 'ayu');
  p.storage(null, null); assert.equal(p.root.dataset.theme, 'coal');
  assert.equal(p.inputs.find(input => input.checked).value, 'auto');
});

test('Hub supports multiple essays while homepage limits entries and excludes drafts', () => {
  const original = [...posts];
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  try {
    posts.splice(0, posts.length, { slug: 'fixture-base', title: 'First essay', subtitle: 'Example', date: '2026-10-03', status: 'published' });
    for (let i = 1; i <= 4; i++) posts.push({ slug: `fixture-${i}`, title: `Essay ${i}`, subtitle: 'A < B', date: '2026-10-03', status: i === 4 ? 'draft' : 'published' });
    const hub = writingList({ escape });
    const home = writingList({ escape, limit: 3 });
    assert.equal((hub.match(/<li>/g) || []).length, 4);
    assert.equal((home.match(/<li>/g) || []).length, 3);
    assert.ok(hub.includes('fixture-3/'));
    assert.ok(!home.includes('fixture-3/'));
    assert.ok(!hub.includes('fixture-4/'));
    assert.ok(hub.includes('A &lt; B'));
  } finally { posts.splice(0, posts.length, ...original); }
});
