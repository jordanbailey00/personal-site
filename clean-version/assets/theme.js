(() => {
  const key = 'jordan-bailey-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const colors = { light: '#ffffff', rust: '#e1e1db', coal: '#18191b', navy: '#161923', ayu: '#0f1419' };
  const normalize = value => value === 'dark' ? 'coal' : value === 'auto' || Object.hasOwn(colors, value) ? value : 'auto';
  let preference = 'auto';
  try { preference = normalize(localStorage.getItem(key)); } catch { /* Follow the device when storage is unavailable. */ }

  function applyTheme() {
    const theme = preference === 'auto' ? (system.matches ? 'coal' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[theme]);
    document.querySelectorAll('[data-theme-picker]').forEach(picker => {
      picker.hidden = false;
      picker.querySelectorAll('input').forEach(input => { input.checked = input.value === preference; });
      picker.querySelector('summary').title = `Theme: ${preference[0].toUpperCase()}${preference.slice(1)}`;
    });
  }

  // Resolve the shared preference before styles load to avoid a theme flash.
  applyTheme();
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    document.querySelectorAll('[data-theme-picker]').forEach(picker => {
      picker.addEventListener('change', event => {
        if (!event.target.matches('input[name="site-theme"]')) return;
        preference = normalize(event.target.value);
        try { localStorage.setItem(key, preference); } catch { /* Selection still works for this page. */ }
        applyTheme();
      });
      picker.addEventListener('keydown', event => {
        if (event.key === 'Escape') { picker.open = false; picker.querySelector('summary').focus(); }
      });
      document.addEventListener('click', event => { if (!picker.contains(event.target)) picker.open = false; });
    });
  }, { once: true });

  system.addEventListener('change', () => { if (preference === 'auto') applyTheme(); });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { preference = normalize(event.newValue); applyTheme(); }
  });
})();
