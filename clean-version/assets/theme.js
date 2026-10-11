(() => {
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const colors = { light: '#ffffff', rust: '#e1e1db', coal: '#18191b', navy: '#161923', ayu: '#0f1419', supernova: '#000000', novasuper: '#ffffff' };
  const key = 'jordan-bailey-theme';
  const normalize = value => value === 'dark' ? 'coal' : value === 'auto' || Object.hasOwn(colors, value) ? value : 'auto';
  const capitalize = value => value[0].toUpperCase() + value.slice(1);
  let value = 'auto';

  function apply() {
    const resolved = value === 'auto' ? (system.matches ? 'coal' : 'light') : value;
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[resolved]);
    document.querySelectorAll('[data-theme-picker]').forEach(picker => {
      picker.hidden = false;
      picker.querySelectorAll('input').forEach(input => { input.checked = input.value === value; });
      picker.querySelector('summary').title = `Theme: ${capitalize(value)}`;
    });
  }

  // Retire saved Fantasy selections; the site now has one shared typography.
  delete document.documentElement.dataset.style;
  try { localStorage.removeItem('jordan-bailey-style'); } catch { /* Storage may be unavailable. */ }
  // Resolve the theme before CSS loads to avoid a flash of the wrong palette.
  try { value = normalize(localStorage.getItem(key)); } catch { /* Auto works without storage. */ }
  apply();

  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelectorAll('[data-theme-picker]').forEach(picker => {
      picker.addEventListener('change', event => {
        if (!event.target.matches('input[name="site-theme"]')) return;
        value = normalize(event.target.value);
        try { localStorage.setItem(key, value); } catch { /* Selection still works for this page. */ }
        apply();
      });
      picker.addEventListener('keydown', event => {
        if (event.key === 'Escape') { picker.open = false; picker.querySelector('summary').focus(); }
      });
      document.addEventListener('click', event => { if (!picker.contains(event.target)) picker.open = false; });
    });
  }, { once: true });

  system.addEventListener('change', () => { if (value === 'auto') apply(); });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      value = normalize(event.newValue);
      apply();
    }
  });
})();
