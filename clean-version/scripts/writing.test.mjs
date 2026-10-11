import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const script = await readFile(new URL('../assets/writing.js', import.meta.url), 'utf8');

function reader(initialScroll = 0, { mobile = false } = {}) {
  const handlers = {};
  const element = () => ({
    style: {}, attrs: {}, events: {},
    addEventListener(name, fn) { this.events[name] = fn; }, focus() {},
    setAttribute(name, value) { this.attrs[name] = value; },
    getAttribute(name) { return this.attrs[name]; },
    removeAttribute(name) { delete this.attrs[name]; },
  });
  const link = id => Object.assign(element(), { hash: `#${id}` });
  const sidebarLinks = ['policy-interface', 'observations', 'actions', 'learning-loop'].map(link);
  // The inline contents repeat only the parent sections, after the sidebar.
  const inlineLinks = ['policy-interface', 'learning-loop'].map(link);
  const links = [...sidebarLinks, ...inlineLinks];
  const classes = new Set(['no-writing-js', 'contents-hidden']);
  const root = { scrollHeight: 4000, classList: {
    remove: name => classes.delete(name),
    toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
    contains: name => classes.has(name),
  } };
  const sidebar = Object.assign(element(), { querySelectorAll: () => sidebarLinks, querySelector: () => sidebarLinks[0] });
  const main = element();
  const elements = Object.fromEntries([
    '[data-contents-toggle]', '.sidebar-shade', '.book-page', '[data-print]',
    '[data-reading-progress]', '[data-reading-label]',
  ].map(selector => [selector, element()]));
  let scroll = initialScroll;
  const headings = Object.fromEntries([
    ['policy-interface', 200], ['observations', 600], ['actions', 1000], ['learning-loop', 1500],
  ].map(([id, top]) => [id, { id, getBoundingClientRect: () => ({ top: top - scroll }) }]));
  const document = {
    documentElement: root,
    getElementById: id => id === 'writing-sidebar' ? sidebar : id === 'main' ? main : headings[id],
    querySelector: selector => elements[selector],
    querySelectorAll: selector => selector === '[data-section-link]' ? links : [],
    addEventListener() {},
  };
  const media = { matches: mobile, addEventListener: (name, fn) => { handlers.mediaChange = fn; } };
  const context = {
    document, innerHeight: 800, scrollY: scroll,
    matchMedia: () => media,
    addEventListener: (name, fn) => { handlers[name] = fn; },
    requestAnimationFrame: fn => fn(),
  };
  vm.runInNewContext(script, context);
  return {
    sidebarLinks, inlineLinks, root, sidebar,
    toggle: elements['[data-contents-toggle]'], page: elements['.book-page'],
    toggleContents() { elements['[data-contents-toggle]'].events.click(); },
    resizeToMobile(value) { media.matches = value; handlers.mediaChange(); },
    active: () => sidebarLinks.filter(link => link.attrs['aria-current'] === 'location').map(link => link.hash),
    scrollTo(value) { scroll = value; context.scrollY = value; handlers.scroll(); },
  };
}

test('Repeated inline parent links do not override the current subsection', () => {
  const page = reader();
  assert.deepEqual(page.active(), []);
  page.scrollTo(120);
  assert.deepEqual(page.active(), ['#policy-interface']);
  page.scrollTo(520);
  assert.deepEqual(page.active(), ['#observations']);
  assert.ok(page.inlineLinks.every(link => !link.attrs['aria-current']));
  page.scrollTo(760);
  assert.deepEqual(page.active(), ['#observations']);
  page.scrollTo(920);
  assert.deepEqual(page.active(), ['#actions']);
  page.scrollTo(1420);
  assert.deepEqual(page.active(), ['#learning-loop']);
  assert.equal(page.inlineLinks[1].attrs['aria-current'], 'location');
  page.scrollTo(520);
  assert.deepEqual(page.active(), ['#observations']);
});

test('An initial subsection position selects its exact sidebar entry', () => {
  assert.deepEqual(reader(520).active(), ['#observations']);
});

test('Writing pages start closed and open only after the contents button is used', () => {
  for (const mobile of [false, true]) {
    const page = reader(0, { mobile });
    assert.equal(page.toggle.hidden, false);
    assert.equal(page.toggle.attrs['aria-expanded'], 'false');
    assert.equal(page.sidebar.inert, true);
    assert.equal(page.page.inert, false);
    page.toggleContents();
    assert.equal(page.toggle.attrs['aria-expanded'], 'true');
    assert.equal(page.sidebar.inert, false);
    assert.equal(page.page.inert, mobile);
    page.toggleContents();
    assert.equal(page.toggle.attrs['aria-expanded'], 'false');
    assert.equal(page.sidebar.inert, true);
    assert.equal(page.page.inert, false);
  }
});

test('Resizing or loading another article does not open the sidebar by default', () => {
  const page = reader();
  page.resizeToMobile(true);
  page.resizeToMobile(false);
  assert.equal(page.toggle.attrs['aria-expanded'], 'false');
  assert.equal(page.root.classList.contains('contents-hidden'), true);
  page.toggleContents();
  assert.equal(page.toggle.attrs['aria-expanded'], 'true');
  assert.equal(reader().toggle.attrs['aria-expanded'], 'false');
});
