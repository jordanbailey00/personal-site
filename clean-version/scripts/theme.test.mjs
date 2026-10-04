import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import { posts } from '../content/writing/posts.mjs';
import { writingList } from './writing.mjs';

const script = await readFile(new URL('../assets/theme.js', import.meta.url), 'utf8');
function page({ saved = null, savedStyle = null, dark = false, blocked = false } = {}) {
  const handlers = {}, device = {}, pickerEvents = {};
  const root = { dataset: {} }, meta = {};
  const stored = { 'jordan-bailey-theme': saved, 'jordan-bailey-style': savedStyle };
  const pickers = {};
  for (const [kind, values] of Object.entries({ theme: ['auto', 'light', 'rust', 'coal', 'navy', 'ayu', 'supernova'], style: ['classic', 'fantasy'] })) {
    const inputs = values.map(value => ({ value, checked: false }));
    const summary = { focus() { summary.focused = true; } };
    pickerEvents[kind] = {};
    pickers[kind] = { hidden: true, inputs, summary, querySelectorAll: () => inputs, querySelector: () => summary, addEventListener: (name, fn) => { pickerEvents[kind][name] = fn; }, contains: () => false };
  }
  const system = { matches: dark, addEventListener: (name, fn) => { device[name] = fn; } };
  const document = { documentElement: root, querySelector: () => ({ setAttribute: (name, value) => { meta[name] = value; } }), querySelectorAll: selector => [pickers[selector === '[data-theme-picker]' ? 'theme' : 'style']], addEventListener: (name, fn) => { (handlers[name] ??= []).push(fn); } };
  const window = { matchMedia: () => system, addEventListener: (name, fn) => { (handlers[name] ??= []).push(fn); } };
  const localStorage = { getItem(key) { if (blocked) throw Error('Storage unavailable'); return stored[key]; }, setItem(key, value) { if (blocked) throw Error('Storage unavailable'); stored[key] = value; } };
  vm.runInNewContext(script, { document, window, localStorage });
  const initial = root.dataset.theme, initialStyle = root.dataset.style;
  handlers.DOMContentLoaded.forEach(fn => fn());
  return {
    initial, initialStyle, root, pickers, picker: pickers.theme, inputs: pickers.theme.inputs, meta, saved: () => stored['jordan-bailey-theme'], savedStyle: () => stored['jordan-bailey-style'],
    choose(value, kind = 'theme') { pickerEvents[kind].change({ target: { value, matches: selector => selector === `input[name="site-${kind}"]` } }); },
    escape(kind) { pickerEvents[kind].keydown({ key: 'Escape' }); },
    outsideClick() { handlers.click.forEach(fn => fn({ target: {} })); },
    device(dark) { system.matches = dark; device.change(); },
    storage(value, key = 'jordan-bailey-theme') { handlers.storage.forEach(fn => fn({ key, newValue: value })); },
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
  for (const theme of ['light', 'rust', 'coal', 'navy', 'ayu', 'supernova']) {
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


test('Both styles persist independently for every theme, including Auto', () => {
  for (const theme of ['auto', 'light', 'rust', 'coal', 'navy', 'ayu', 'supernova']) {
    const p = page(); p.choose(theme);
    const resolved = p.root.dataset.theme, color = p.meta.content;
    for (const style of ['fantasy', 'classic']) {
      p.choose(style, 'style');
      assert.equal(p.root.dataset.theme, resolved);
      assert.equal(p.meta.content, color);
      const next = page({ saved: p.saved(), savedStyle: p.savedStyle() });
      assert.equal(next.initialStyle, style);
      assert.equal(next.initial, resolved);
      assert.equal(next.pickers.style.inputs.find(input => input.checked).value, style);
      next.choose('navy'); assert.equal(next.root.dataset.style, style);
    }
  }
});

test('Style defaults safely, handles unavailable storage, and syncs without changing theme', () => {
  assert.equal(page().initialStyle, 'classic');
  assert.equal(page({ savedStyle: 'unknown' }).initialStyle, 'classic');
  const p = page({ saved: 'rust', savedStyle: 'fantasy' });
  p.storage('classic', 'jordan-bailey-style');
  assert.equal(p.root.dataset.style, 'classic');
  assert.equal(p.root.dataset.theme, 'rust');
  p.choose('fantasy', 'style'); p.storage('ayu');
  assert.equal(p.root.dataset.style, 'fantasy');
  p.storage(null, null);
  assert.deepEqual({ ...p.root.dataset }, { theme: 'light', style: 'classic' });
  const blocked = page({ blocked: true }); blocked.choose('fantasy', 'style'); blocked.choose('coal');
  assert.equal(blocked.root.dataset.style, 'fantasy');
  assert.equal(blocked.root.dataset.theme, 'coal');
});

test('Both menus close on Escape with focus returned, and on outside clicks', () => {
  const p = page();
  for (const kind of ['theme', 'style']) {
    p.pickers[kind].open = true; p.escape(kind);
    assert.equal(p.pickers[kind].open, false);
    assert.equal(p.pickers[kind].summary.focused, true);
    p.pickers[kind].open = true; p.outsideClick();
    assert.equal(p.pickers[kind].open, false);
  }
});
