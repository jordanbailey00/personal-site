(() => {
  const root = document.documentElement;
  const mobile = matchMedia('(max-width: 800px)');
  const sidebar = document.getElementById('writing-sidebar');
  const toggle = document.querySelector('[data-contents-toggle]');
  const shade = document.querySelector('.sidebar-shade');
  const page = document.querySelector('.book-page');
  const main = document.getElementById('main');
  root.classList.remove('no-writing-js');
  let desktopOpen = true;

  function setContents(open, returnFocus = false) {
    root.classList.toggle('contents-open', mobile.matches && open);
    root.classList.toggle('contents-hidden', !mobile.matches && !open);
    sidebar.inert = !open;
    page.inert = mobile.matches && open;
    if (mobile.matches && open) { sidebar.setAttribute('role', 'dialog'); sidebar.setAttribute('aria-modal', 'true'); }
    else { sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal'); }
    shade.hidden = !mobile.matches || !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (returnFocus) toggle.focus();
  }
  toggle.hidden = false;
  setContents(!mobile.matches);
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    if (!mobile.matches) desktopOpen = open;
    setContents(open);
    if (mobile.matches && open) sidebar.querySelector('a').focus();
  });
  shade.addEventListener('click', () => setContents(false, true));
  mobile.addEventListener('change', () => setContents(mobile.matches ? false : desktopOpen));
  document.addEventListener('keydown', event => {
    if (!mobile.matches || !root.classList.contains('contents-open')) return;
    if (event.key === 'Escape') { setContents(false, true); return; }
    if (event.key === 'Tab') {
      const links = [...sidebar.querySelectorAll('a[href], button:not([hidden])')];
      if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); links.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); links[0].focus(); }
    }
  });
  sidebar.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    if (mobile.matches) { setContents(false); main.focus({ preventScroll: true }); }
  }));
  const print = document.querySelector('[data-print]');
  print.hidden = false;
  print.addEventListener('click', () => window.print());

  document.querySelectorAll('[data-copy-code]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const code = button.closest('.notebook').querySelector('code');
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = 'Copied';
        document.querySelector('[data-reader-status]').textContent = 'Code copied to clipboard.';
      } catch {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = 'Code selected';
        document.querySelector('[data-reader-status]').textContent = 'Copy unavailable. Code selected; use your keyboard to copy.';
      }
      setTimeout(() => { button.textContent = 'Copy code'; }, 2500);
    });
  });

  const links = [...document.querySelectorAll('[data-section-link]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
  const progress = document.querySelector('[data-reading-progress]');
  const label = document.querySelector('[data-reading-label]');
  let pending = false;
  function updateReading() {
    const length = document.documentElement.scrollHeight - innerHeight;
    const percent = length > 0 ? Math.min(100, Math.max(0, Math.round(scrollY / length * 100))) : 0;
    progress.style.width = `${percent}%`;
    label.textContent = sections.length ? `${percent}%` : '';
    let active = null;
    for (const section of sections) if (section.getBoundingClientRect().top <= 140) active = section.id;
    links.forEach(link => { if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    pending = false;
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(updateReading); } }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  updateReading();
})();
