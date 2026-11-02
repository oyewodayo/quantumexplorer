// Theme state. Canvas-drawing code reads `isDark` and `BLOCH_COLORS` (live
// bindings) at draw time and registers a redraw with onThemeChange().
// React components use the useTheme() hook, which subscribes the same way.

export const THEME_STORAGE_KEY = 'qe-theme';

export let isDark = false;
export let BLOCH_COLORS = {};

const themeChangeCallbacks = new Set();

/** Registers a callback fired after every theme change; returns an unsubscribe. */
export function onThemeChange(fn) {
  themeChangeCallbacks.add(fn);
  return () => themeChangeCallbacks.delete(fn);
}

/** Re-reads the theme from <html data-theme> and the CSS color tokens. */
export function refreshThemeColors() {
  isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const s = getComputedStyle(document.documentElement);
  const g = name => s.getPropertyValue(name).trim();
  BLOCH_COLORS = {
    arrow:       g('--bloch-arrow'),
    sphereBg:    g('--bloch-sphere-bg'),
    sphereRing:  g('--bloch-sphere-ring'),
    grid:        g('--bloch-grid'),
    gridBack:    g('--bloch-grid-back'),
    axisZ:       g('--bloch-axis-z'),
    axisMuted:   g('--bloch-axis-other'),
    proj:        g('--bloch-proj'),
    tip:         g('--bloch-tip'),
  };
}

export function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') !== 'light' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* private mode */ }
  refreshThemeColors();
  themeChangeCallbacks.forEach(fn => fn());
}
