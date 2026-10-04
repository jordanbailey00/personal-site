(() => {
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const colors = { light: '#ffffff', rust: '#e1e1db', coal: '#18191b', navy: '#161923', ayu: '#0f1419', supernova: '#000000' };
  const settings = {
    theme: { key: 'jordan-bailey-theme', normalize: value => value === 'dark' ? 'coal' : value === 'auto' || Object.hasOwn(colors, value) ? value : 'auto' },
    style: { key: 'jordan-bailey-style', normalize: value => value === 'fantasy' ? 'fantasy' : 'classic' },
  };
  const capitalize = value => value[0].toUpperCase() + value.slice(1);

  function apply(kind) {
    const { value } = settings[kind];
    const resolved = kind === 'theme' && value === 'auto' ? (system.matches ? 'coal' : 'light') : value;
    document.documentElement.dataset[kind] = resolved;
    if (kind === 'theme') document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[resolved]);
    document.querySelectorAll(`[data-${kind}-picker]`).forEach(picker => {
      picker.hidden = false;
      picker.querySelectorAll('input').forEach(input => { input.checked = input.value === value; });
      picker.querySelector('summary').title = `${capitalize(kind)}: ${capitalize(value)}`;
    });
  }

  // Both preferences resolve before CSS loads, independently and without a flash.
  for (const [kind, setting] of Object.entries(settings)) {
    let saved;
    try { saved = localStorage.getItem(setting.key); } catch { /* Defaults work without storage. */ }
    setting.value = setting.normalize(saved);
    apply(kind);
  }

  document.addEventListener('DOMContentLoaded', () => {
    for (const [kind, setting] of Object.entries(settings)) {
      apply(kind);
      document.querySelectorAll(`[data-${kind}-picker]`).forEach(picker => {
        picker.addEventListener('change', event => {
          if (!event.target.matches(`input[name="site-${kind}"]`)) return;
          setting.value = setting.normalize(event.target.value);
          try { localStorage.setItem(setting.key, setting.value); } catch { /* Selection still works for this page. */ }
          apply(kind);
        });
        picker.addEventListener('keydown', event => {
          if (event.key === 'Escape') { picker.open = false; picker.querySelector('summary').focus(); }
        });
        document.addEventListener('click', event => { if (!picker.contains(event.target)) picker.open = false; });
      });
    }
  }, { once: true });

  system.addEventListener('change', () => { if (settings.theme.value === 'auto') apply('theme'); });
  window.addEventListener('storage', event => {
    for (const [kind, setting] of Object.entries(settings)) {
      if (event.key === setting.key || event.key === null) {
        setting.value = setting.normalize(event.newValue);
        apply(kind);
      }
    }
  });
})();
