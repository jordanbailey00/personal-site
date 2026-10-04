// Load the original 3D effect only when its theme is selected. Theme and style
// preferences remain owned by theme.js, including cross-tab synchronization.
export function installSupernova({ document, window, load = () => import('./starfield.js') }) {
  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let field = null;
  let modulePromise = null;
  let revision = 0;

  function dispose() {
    revision++;
    field?.dispose();
    field = null;
  }

  async function sync() {
    const current = ++revision;
    if (root.dataset.theme !== 'supernova') { dispose(); return; }
    if (document.hidden) { field?.setMotion(false); return; }
    if (!field) {
      try {
        const { createStarfield } = await (modulePromise ??= load());
        // A different theme, background tab, or navigation may supersede a load.
        if (current !== revision) return;
        field = createStarfield({ document, window });
      } catch {
        // Keep the readable black palette if WebGL or the module is unavailable.
        modulePromise = null;
        return;
      }
    }
    field.setMotion(!motion.matches);
  }

  const observer = new window.MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', dispose);
  window.addEventListener('pageshow', sync);
  sync();
}

if (typeof window !== 'undefined') installSupernova({ document, window });
