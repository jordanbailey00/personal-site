(() => {
  const key = 'jordan-bailey-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;

  const validTheme = value => value === 'light' || value === 'dark' ? value : null;
  try { preference = validTheme(localStorage.getItem(key)); } catch { /* Storage may be disabled. */ }

  function applyTheme() {
    const theme = preference || (system.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#18191b' : '#ffffff');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
      button.hidden = false;
    });
  }

  // Run before the stylesheet loads to avoid flashing the wrong theme.
  applyTheme();
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(key, preference); } catch { /* The toggle still works without storage. */ }
        applyTheme();
      });
    });
  }, { once: true });

  system.addEventListener('change', () => { if (!preference) applyTheme(); });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      preference = validTheme(event.newValue);
      applyTheme();
    }
  });
})();
