'use strict';
// No file dependencies at load time. Theme-sensitive tabs/app.js register
// their own redraw via onThemeChange() below (called during their own init,
// which always runs inside DOMContentLoaded before toggleTheme() could ever
// fire from a user click) — this file never needs to know which tabs exist
// or what they draw, the same registration pattern core/tab-registry.js
// uses for onEnter/onLeave.

// ─── THEME SYSTEM ────────────────────────────────────────────────────
const THEME_STORAGE_KEY = 'qe-theme';

let isDark = false;
let BLOCH_COLORS = {};

// ─── THEME-CHANGE CALLBACKS ────────────────────────────────────────────
// Anything that draws with theme-dependent colors (a canvas, mainly)
// registers a redraw callback here instead of this file calling into
// tab-specific draw functions/state by name.
const themeChangeCallbacks = [];
function onThemeChange(fn) { themeChangeCallbacks.push(fn); }

function refreshThemeColors() {
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

// Sets the header icon to match whatever data-theme is currently active
// (called once on load, after the inline anti-flash script in <head> has
// already applied any saved preference — see index.html).
function syncThemeIcon() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  document.getElementById('theme-icon').textContent = dark ? '☀' : '☾';
}

function toggleTheme() {
  const root = document.documentElement;
  isDark = root.getAttribute('data-theme') !== 'light';
  const newTheme = isDark ? 'light' : 'dark';
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  document.getElementById('theme-icon').textContent = isDark ? '☾' : '☀';
  refreshThemeColors();
  themeChangeCallbacks.forEach(fn => fn());
}
