// The homepage shows one collection at a time under the intro. Each tab has
// its own address (/#writing), so a section can be linked to and the back
// button works; Projects is the default. The horizon line, like the one under
// links, slides to the chosen tab.
export function installHome({ document, window }) {
  const nav = document.querySelector('.hub-tabs');
  if (!nav) return null;
  const tabs = [...nav.querySelectorAll('[role="tab"]')];
  const keyOf = tab => tab.getAttribute('aria-controls');
  const find = key => tabs.find(tab => keyOf(tab) === key);

  function place() {
    const tab = tabs.find(each => each.getAttribute('aria-selected') === 'true');
    nav.style.setProperty('--x', `${tab.offsetLeft}px`);
    nav.style.setProperty('--w', `${tab.offsetWidth}px`);
  }
  function show(key, { focus = false } = {}) {
    const chosen = find(key) ?? tabs[0];
    for (const tab of tabs) {
      const on = tab === chosen;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(keyOf(tab)).hidden = !on;
    }
    if (focus) chosen.focus();
    place();
    return chosen;
  }
  // Clicks and arrow keys change the address without jumping the page.
  function choose(tab, options) {
    show(keyOf(tab), options);
    if (window.location.hash !== `#${keyOf(tab)}`) window.history.pushState(null, '', `#${keyOf(tab)}`);
  }
  for (const tab of tabs) {
    tab.addEventListener('click', event => {
      event.preventDefault();
      choose(tab);
    });
    tab.addEventListener('keydown', event => {
      const index = tabs.indexOf(tab);
      const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      choose(tabs[(next + tabs.length) % tabs.length], { focus: true });
    });
  }
  window.addEventListener('popstate', () => show(window.location.hash.slice(1)));
  window.addEventListener('resize', place);
  document.fonts?.ready.then(place);
  // A link to a section (/#writing) opens it with the tabs in view. The
  // browser's own jump to the panel can come later, so this repeats on load.
  const start = window.location.hash.slice(1);
  show(start);
  if (find(start)) {
    const reveal = () => nav.scrollIntoView({ block: 'start', behavior: 'instant' });
    reveal();
    if (document.readyState !== 'complete') window.addEventListener('load', () => window.requestAnimationFrame(reveal), { once: true });
  }
  return { show };
}

if (typeof window !== 'undefined') installHome({ document, window });
