/* eslint-disable */
// Imperative simulation engine, bundled from the original js/ scripts.
import { C } from '../core/complex.js';
import { INV2, GATES, ROTATION_GATES, rotationMatrix } from '../core/gates.js';
import { Qubit, round2, blochVectorLabel } from '../core/qubit.js';
import { TwoQubitState } from '../core/twoQubit.js';
import { ThreeQubitState } from '../core/threeQubit.js';
import { TunnelSolver, TUNNEL_N } from '../core/tunnelSolver.js';
import { SIDEBAR_ITEMS } from '../components/sidebarItems.js';
import { MINDMAP_NODE_BY_ID } from '../content/roadmapContent.js';
import { setNav, setTabSub, engineApi } from '../state/nav.js';
import { t, applyTranslations, onLangChange } from '../i18n/index.js';
import { isDark, BLOCH_COLORS, onThemeChange, refreshThemeColors } from '../core/theme.js';
import { noiseT2Eff as noiseT2EffOf, noiseCompute as noiseComputeAt } from '../core/noise.js';
import { interferenceIntensity as interferenceIntensityAt, interferenceMaxIntensity as interferenceMax } from '../core/interference.js';
import { BlochRenderer, blochHooks, BLOCH_KET_MEANINGS } from '../core/blochRenderer.js';

const tunnelSolver = new TunnelSolver();

// All files share one module scope exactly as they shared the global scope
// before; React mounts the markup, then calls startEngine() once.


// ════════ js/core/tab-registry.js ════════
// No dependencies. Loads before every tabs/*.js file, each of which calls
// registerTab() from its own init function (during app.js's
// DOMContentLoaded) to declare what should happen when its tab becomes
// visible/hidden. app.js's tab-switch handler looks entries up here
// instead of branching on tab name — adding a new tab never requires
// touching app.js's switch logic, only calling registerTab() once.

const TABS = {};

/**
 * Declares lifecycle hooks for a tab.
 * @param {string} name - matches a button's data-tab and its
 *   `tab-<name>` section id.
 * @param {{onEnter?: Function, onLeave?: Function}} handlers - onEnter
 *   fires every time the tab becomes visible (including page load, for
 *   the initially-active tab, if you call it yourself); onLeave fires
 *   right before switching away. Both are optional.
 */
function registerTab(name, handlers) {
  TABS[name] = handlers || {};
}


// ════════ js/core/dom-utils.js ════════
// buildGatePalette() reads GATES (core/gates.js, loaded after this file),
// drawCoin() reads isDark (core/theme.js), and animateCoinFlip() calls
// delay() (core/utils.js) — all loaded after this file, but only ever
// reached from inside a function body called during/after DOMContentLoaded
// — long after every script has run — so load order doesn't matter here.
// Used by nearly every tabs/*.js file.

/* Shared helper — briefly dims an explainer box then swaps its text in,
   so updates read as a soft "beat" rather than an abrupt jump-cut. */
function setExplainer(elId, html) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.style.opacity = '0.25';
  requestAnimationFrame(() => {
    el.innerHTML = html;
    el.style.opacity = '1';
  });
}

// ─── GOLD COIN (qubit state visual) ────────────────────────────────────
/* Draws a single qubit as an actual gold coin (radial-gradient body,
   raised rim, reeded edge, a glare highlight) rather than a flat UI disc
   — shared by the Entangle tab's two coins (tabs/entanglement-tab.js) and
   the Measure tab's single coin (tabs/measure-tab.js). state:
   null=superposition (faint overlapping 0/1 + "?"), 0 or 1 = collapsed/
   measured. The coin body itself is theme-independent (real gold reads
   the same in light or dark mode); only the engraved 0/1 digits still
   follow the app's --zero/--one convention (canvas fillStyle can't read
   CSS custom properties, so their resolved hex values are hardcoded here
   per theme). `canvasId` also picks the aria-label's subject — 'coin1'/
   'coin2' read as "Qubit A"/"Qubit B" (the Entangle tab's pair), anything
   else reads as "The qubit" (the Measure tab's single coin). */
function drawCoin(canvasId, state) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const who = canvasId === 'coin1' ? 'Qubit A' : canvasId === 'coin2' ? 'Qubit B' : 'The qubit';
  canvas.setAttribute('aria-label',
    state === null ? `${who}: unmeasured, in superposition.` : `${who}: measured as |${state}⟩.`);

  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r  = Math.min(w, h) / 2 - 6;

  ctx.clearRect(0, 0, w, h);

  // ── Gold coin body ── a radial gradient offset toward the upper-left
  // (a consistent "light source"), bright gold highlight fading to a
  // deeper amber edge.
  const bodyGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.08, cx, cy, r);
  bodyGrad.addColorStop(0,    '#FFEFB8');
  bodyGrad.addColorStop(0.45, '#F4C430');
  bodyGrad.addColorStop(1,    '#B8860B');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Raised rim — two concentric strokes, mimicking a real coin's milled edge.
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8B6508';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 5, 0, 2 * Math.PI);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(139,101,8,0.55)';
  ctx.stroke();

  // Reeded edge — short radial ticks around the circumference, like the
  // ridged side of a real coin.
  ctx.strokeStyle = 'rgba(139,101,8,0.4)';
  ctx.lineWidth = 1;
  const tickCount = 36;
  for (let i = 0; i < tickCount; i++) {
    const a  = (i / tickCount) * 2 * Math.PI;
    const x1 = cx + Math.cos(a) * (r - 1),   y1 = cy + Math.sin(a) * (r - 1);
    const x2 = cx + Math.cos(a) * (r - 4.5), y2 = cy + Math.sin(a) * (r - 4.5);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Glare — a soft bright ellipse near the light source, for a metallic sheen.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.32, cy - r * 0.38, r * 0.42, r * 0.22, -0.5, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();
  ctx.restore();

  // ── Engraved content — a faint dark offset "shadow" under the digit
  // gives it a stamped-into-metal look instead of sitting flat on top.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const engrave = (ch, x, y, size, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = '#5C3D00';
    ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
    ctx.fillText(ch, x + 1, y + 1.5);
    ctx.restore();
  };

  if (state === null) {
    // Superposition — faint overlapping 0 and 1
    const size = r * 0.52;
    engrave('0', cx - r * 0.14, cy, size, 0.5);
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#5B8DEF' : '#0033A0';
    ctx.fillText('0', cx - r * 0.14, cy);
    ctx.restore();

    engrave('1', cx + r * 0.14, cy, size, 0.5);
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#F472B6' : '#BE185D';
    ctx.fillText('1', cx + r * 0.14, cy);
    ctx.restore();

    // "?" on top
    ctx.font = `bold ${r * 0.5}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(92,61,0,0.55)';
    ctx.fillText('?', cx, cy);
  } else if (state === 0) {
    const size = r * 0.62;
    engrave('0', cx, cy, size);
    ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#5B8DEF' : '#0033A0';
    ctx.fillText('0', cx, cy);
  } else {
    const size = r * 0.62;
    engrave('1', cx, cy, size);
    ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#F472B6' : '#BE185D';
    ctx.fillText('1', cx, cy);
  }
}

/* Flip animation helper — rapidly alternates coin faces before landing,
   so a "measurement" reads as an actual coin toss rather than an instant
   snap — used by the Entangle tab (measureCoinA()) and the Measure tab
   (doMeasure()). */
async function animateCoinFlip(canvasId, flips = 10, intervalMs = 55) {
  for (let i = 0; i < flips; i++) {
    drawCoin(canvasId, i % 2);
    await delay(intervalMs);
  }
}

// ─── SHARED TOOLTIP (used by BlochRenderer.enableTooltips) ───────────
let _blochTooltipEl = null;

function showBlochTooltip(text, clientX, clientY) {
  if (!_blochTooltipEl) {
    _blochTooltipEl = document.createElement('div');
    _blochTooltipEl.className = 'bloch-tooltip';
    document.body.appendChild(_blochTooltipEl);
  }
  _blochTooltipEl.textContent = text;
  _blochTooltipEl.style.left = clientX + 'px';
  _blochTooltipEl.style.top  = (clientY - 14) + 'px';
  _blochTooltipEl.classList.add('visible');
}

function hideBlochTooltip() {
  if (_blochTooltipEl) _blochTooltipEl.classList.remove('visible');
}

// ─── CONFIRM MODAL ─────────────────────────────────────────────────────
/**
 * Custom replacement for the browser's native confirm() popup, styled to
 * match the app instead of the OS/browser chrome. Unlike confirm(), this
 * can't block synchronously, so the result comes back via `onConfirm`
 * rather than a return value — cancel (button, backdrop click, or Esc)
 * just does nothing. A fresh backdrop element is built and removed on
 * every call rather than reused, so there's never a stale listener left
 * over from a previous open. Pass `danger: true` to tint the confirm
 * button for destructive actions (see resetRoadmapProgress() in
 * roadmap.js).
 */
function showConfirmModal({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm }) {
  const el = document.createElement('div');
  el.className = 'confirm-modal-backdrop';
  el.innerHTML = `
    <div class="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div class="confirm-modal-title" id="confirm-modal-title">${title}</div>
      <p class="confirm-modal-message">${message}</p>
      <div class="confirm-modal-actions">
        <button class="btn-secondary" data-confirm-cancel>${cancelLabel}</button>
        <button class="btn-confirm${danger ? ' danger' : ''}" data-confirm-ok>${confirmLabel}</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));

  function close() {
    document.removeEventListener('keydown', onKey);
    el.remove();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  el.addEventListener('click', e => { if (e.target === el) close(); });
  el.querySelector('[data-confirm-cancel]').addEventListener('click', close);
  el.querySelector('[data-confirm-ok]').addEventListener('click', () => { close(); onConfirm(); });
  document.addEventListener('keydown', onKey);
  el.querySelector('[data-confirm-cancel]').focus();
}

// ─── SHAREABLE STATE LINKS ────────────────────────────────────────────
/* Builds a URL encoding `params` as a query string, copies it to the
   clipboard, and briefly swaps btn's own text to confirm — reused by the
   Qubit and Circuit tabs' "Share" buttons. */
async function copyShareLink(params, btn) {
  const url = `${location.origin}${location.pathname}?${new URLSearchParams(params).toString()}`;
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(url);
    btn.textContent = 'Copied!';
  } catch (e) {
    btn.textContent = 'Copy failed';
  }
  setTimeout(() => { btn.textContent = original; }, 1400);
}

// ─── ONE-SHOT PULSE ANIMATION ─────────────────────────────────────────
/* Adds `className` to `el` just long enough to play its CSS animation,
   then removes it — forcing a reflow first so re-triggering the same
   pulse on an element that's still mid-animation restarts it cleanly
   instead of being a no-op (adding a class that's already present
   doesn't restart a running CSS animation). Reused for gate-apply and
   measurement-collapse pulses. */
function pulseElement(el, className, duration = 450) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration);
}

// ─── GATE PALETTE ──────────────────────────────────────────────────────
/**
 * Builds one colored gate-palette button per GATES entry inside
 * `containerId`, calling `onKeyClick(key)` when clicked — the identical
 * button-building loop every quantum circuit builder (1/2/3-qubit) used
 * to copy-paste on its own. Deliberately narrow to GATES' own styling
 * convention (color + colored border, plain textContent, title tooltip):
 * the classical circuit/gate tabs use a different table (CLASSICAL_GATES,
 * no per-gate color) and gates-tab.js's own palette uses a richer
 * name+subtitle button, so neither goes through this helper — forcing
 * them through one options-flag-laden function would cost more
 * readability than the duplication it'd remove.
 */
function buildGatePalette(containerId, onKeyClick) {
  const container = document.getElementById(containerId);
  Object.entries(GATES).forEach(([key, gate]) => {
    const btn = document.createElement('button');
    btn.className         = 'circuit-gate-btn';
    btn.textContent       = gate.name;
    btn.style.color       = gate.color;
    btn.style.borderColor = gate.color + '55';
    btn.title             = t(`gates.${key}.desc`, gate.desc);
    btn.addEventListener('click', () => onKeyClick(key));
    container.appendChild(btn);
  });
}

// ─── TRY ME PRESETS ────────────────────────────────────────────────────
/**
 * Renders a collapsed "Try me" toggle into `containerId` that expands to
 * a row of named preset buttons — reused by all four circuit builders
 * (classical, 1Q/2Q/3Q quantum) so each just supplies its own preset
 * data and a callback to load+run it. `presets` is [{ name, ... }]; the
 * rest of each preset object is opaque here and passed straight to
 * `onSelect`.
 */
function renderTryMe(containerId, presets, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <button class="try-me-toggle" type="button">${t('common.tryMePresets', '🎲 Try me — preset circuits')}</button>
    <div class="try-me-presets" style="display:none;"></div>
  `;
  const toggle = container.querySelector('.try-me-toggle');
  const presetsWrap = container.querySelector('.try-me-presets');
  presetsWrap.innerHTML = presets.map((p, i) =>
    `<button class="try-preset-btn" data-i="${i}">${p.name}</button>`
  ).join('');
  toggle.addEventListener('click', () => {
    const isOpen = presetsWrap.style.display !== 'none';
    presetsWrap.style.display = isOpen ? 'none' : 'flex';
    toggle.classList.toggle('active', !isOpen);
  });
  presetsWrap.querySelectorAll('[data-i]').forEach(btn => {
    btn.addEventListener('click', () => onSelect(presets[parseInt(btn.dataset.i, 10)]));
  });
}

// ─── SEGMENTED-CONTROL SLIDING INDICATOR ──────────────────────────────
/**
 * Gives every `.mode-grid` toggle group (Concepts/Home, 1 Qubit/
 * 2 Qubits, the Interference mode switch, etc.) a single sliding
 * highlight instead of each button drawing its own background — a
 * MutationObserver watches the whole page for `class` changes and
 * repositions every thumb, so none of the functions that toggle `.active`
 * (setAppMode, setCircuitMode, the target-qubit handler,
 * setInterferenceMode) need to know this animation exists. Watching the
 * whole document rather than
 * each grid individually also catches the case a grid's *ancestor*
 * becomes visible (e.g. switching to the Circuit or Interference tab,
 * or into Roadmap mode) — most `.mode-grid`s start inside hidden
 * content, so their buttons report zero size until their tab/view is
 * actually shown; re-syncing on every class change (tab switches
 * included) catches that moment instead of leaving a stuck 0×0 thumb.
 * Called once from app.js's DOMContentLoaded, after all `.mode-grid`
 * markup already exists in the DOM.
 */
function initModeGridThumbs() {
  const grids  = [...document.querySelectorAll('.mode-grid')];
  const thumbs = grids.map(grid => {
    const thumb = document.createElement('div');
    thumb.className = 'mode-grid-thumb';
    grid.insertBefore(thumb, grid.firstChild);
    return thumb;
  });

  const syncAll = () => {
    grids.forEach((grid, i) => {
      const thumb  = thumbs[i];
      const active = grid.querySelector('.mode-btn.active');
      if (!active || active.offsetWidth === 0) { thumb.style.opacity = '0'; return; }
      thumb.style.opacity   = '1';
      thumb.style.width     = active.offsetWidth + 'px';
      thumb.style.height    = active.offsetHeight + 'px';
      thumb.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    });
  };

  new MutationObserver(syncAll).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
  syncAll();
  window.addEventListener('resize', syncAll);
}


// ════════ js/core/utils.js ════════
// No dependencies. Used by several tabs/*.js async flows (call-time only).

// ─── UTILITY ──────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }


// ════════ js/tabs/important-concepts.js ════════
// Important Concepts tab — the only interactive behavior on an otherwise
// static glossary page: a live search box that filters the glossary
// grids as you type (initImportantConceptsSearch()), and tapping a card
// to zoom it into a centered overlay for a bigger, easier read, dismissed
// via its own close button, Esc, or a backdrop click
// (initImportantConceptsZoom()/openConceptZoom()). The zoom overlay
// depends on: core/dom-utils.js's showConfirmModal for the sibling
// pattern it mirrors (fixed backdrop, Esc/backdrop-click to close, one
// fresh element per open rather than a reused hidden one).
// No registerTab() entry — this tab carries no simulation state to
// enter/leave, just these two delegated/one-time handlers.

/** Filters the glossary grids by re-reading each card's own live
 *  textContent on every keystroke — already-translated by i18n.js's
 *  applyTranslations(), so this needs no separate per-language search
 *  index and one onLangChange() re-run (below) keeps it correct across a
 *  language switch mid-search. A group's .section-label and
 *  .intro-glossary-grid are hidden together whenever every card inside
 *  it is filtered out, rather than leaving an empty heading floating
 *  above nothing. */
function initImportantConceptsSearch() {
  const input = document.getElementById('concept-search');
  if (!input) return;
  const clearBtn = document.getElementById('concept-search-clear');
  const emptyMsg = document.getElementById('concept-search-empty');
  const grids = Array.from(document.querySelectorAll('#tab-important-concepts .intro-glossary-grid'));
  const labels = Array.from(document.querySelectorAll('#tab-important-concepts .section-label'));

  function applyFilter() {
    const query = input.value.trim().toLowerCase();
    clearBtn.style.display = query ? '' : 'none';

    let totalVisible = 0;
    grids.forEach((grid, i) => {
      let groupVisible = 0;
      grid.querySelectorAll('.card').forEach(card => {
        const matches = !query || card.textContent.toLowerCase().includes(query);
        card.classList.toggle('concept-hidden', !matches);
        if (matches) groupVisible++;
      });
      grid.classList.toggle('concept-hidden', groupVisible === 0);
      if (labels[i]) labels[i].classList.toggle('concept-hidden', groupVisible === 0);
      totalVisible += groupVisible;
    });

    emptyMsg.style.display = totalVisible === 0 ? '' : 'none';
    if (totalVisible === 0) {
      emptyMsg.textContent = t('concepts.searchNoResults', 'No concepts match "{query}".').replace('{query}', input.value.trim());
    }
  }

  input.addEventListener('input', applyFilter);
  clearBtn.addEventListener('click', () => { input.value = ''; applyFilter(); input.focus(); });
  // Re-render the "no results" message (and, in principle, re-filter) so
  // switching language mid-search never leaves stale English text behind
  // — see core/i18n.js's onLangChange().
  onLangChange(applyFilter);
}

/** Wires a single delegated click handler on the whole Important Concepts
 *  section rather than one listener per card, so it keeps working
 *  regardless of how many glossary cards get added later. */
function initImportantConceptsZoom() {
  const section = document.getElementById('tab-important-concepts');
  if (!section) return;
  section.addEventListener('click', (e) => {
    const card = e.target.closest('.intro-glossary-grid .card');
    if (card) openConceptZoom(card);
  });
}

let activeConceptZoom = null; // { close } while a zoom overlay is open, else null

/**
 * FLIP transition: the overlay card is built at its real (bigger,
 * centered) size first, then instantly transformed (translate+scale) to
 * exactly overlay the clicked card's on-screen position/size, then that
 * transform is animated back to identity — so the very first frame looks
 * identical to the grid card sitting where it was, and it visibly grows
 * from there into the centered overlay, rather than just fading in
 * generically. Closing plays the same transform forward instead of
 * reversed-from-scratch, so it shrinks back into the same card.
 */
function openConceptZoom(card) {
  if (activeConceptZoom) return; // one overlay at a time
  const startRect = card.getBoundingClientRect();

  const backdrop = document.createElement('div');
  backdrop.className = 'concept-zoom-backdrop';
  backdrop.innerHTML = `
    <div class="concept-zoom-card" role="dialog" aria-modal="true">
      <button class="concept-zoom-close" type="button" aria-label="Close" data-zoom-close>✕</button>
      <div class="concept-zoom-body">${card.innerHTML}</div>
    </div>`;
  document.body.appendChild(backdrop);
  const modal = backdrop.querySelector('.concept-zoom-card');

  const endRect = modal.getBoundingClientRect();
  const scaleX = startRect.width / endRect.width;
  const scaleY = startRect.height / endRect.height;
  const dx = (startRect.left + startRect.width / 2) - (endRect.left + endRect.width / 2);
  const dy = (startRect.top + startRect.height / 2) - (endRect.top + endRect.height / 2);
  const fromCardTransform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    modal.style.transform = fromCardTransform;
    modal.style.opacity = '0.4';
  }
  void modal.offsetWidth; // force layout so the transform above paints before the transition below starts
  backdrop.classList.add('visible');
  requestAnimationFrame(() => {
    modal.style.transform = '';
    modal.style.opacity = '';
  });

  function close() {
    document.removeEventListener('keydown', onKey);
    activeConceptZoom = null;
    if (reduceMotion) { backdrop.remove(); return; }
    modal.style.transform = fromCardTransform;
    modal.style.opacity = '0.4';
    backdrop.classList.remove('visible');
    modal.addEventListener('transitionend', () => backdrop.remove(), { once: true });
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  modal.querySelector('[data-zoom-close]').addEventListener('click', close);
  document.addEventListener('keydown', onKey);

  activeConceptZoom = { close };
}


// ════════ js/tabs/classical-bit.js ════════
// Depends on: app.js state (classicalBit).
// initClassicalBit() is called from app.js's DOMContentLoaded handler.

// ═══════════════════════════════════════════════════════════════════
// CLASSICAL BIT
// ═══════════════════════════════════════════════════════════════════
function initClassicalBit() {
  const toggle = document.getElementById('bit-toggle');
  toggle.addEventListener('change', () => {
    classicalBit = toggle.checked ? 1 : 0;
    updateClassicalUI();
  });

  document.getElementById('btn-classical-tryme').addEventListener('click', runClassicalTryMe);
}

const CLASSICAL_TRYME_FLIPS = 5;
const CLASSICAL_TRYME_INTERVAL_MS = 2600; // bumped from 1400 alongside the detailed per-step explanation below — needs real reading time, not just a glance at the flip

/** Auto-flips the bit back and forth CLASSICAL_TRYME_FLIPS times, then
 *  stops on its own — a passive demo of "always 0 or 1, never both"
 *  rather than something the learner has to keep clicking. Built on the
 *  shared runTryMeSequence() driver (qubit-tab.js — plain <script> tags
 *  share one global scope, and it's only ever called from inside a click
 *  handler, long after every script has loaded, so load order doesn't
 *  matter) rather than its own interval bookkeeping, so it gets the same
 *  disabled-button re-entrancy guard plus a step explainer + history
 *  trail for free, matching the One/Two Qubit Try Me runs. */
function runClassicalTryMe() {
  const toggle = document.getElementById('bit-toggle');
  const states = [];
  let bit = classicalBit;
  for (let i = 0; i < CLASSICAL_TRYME_FLIPS; i++) {
    bit = bit === 0 ? 1 : 0;
    states.push(bit);
  }

  runTryMeSequence({
    button: document.getElementById('btn-classical-tryme'),
    disableEls: [toggle],
    states,
    intervalMs: CLASSICAL_TRYME_INTERVAL_MS,
    applyState: bitVal => {
      classicalBit = bitVal;
      toggle.checked = classicalBit === 1;
      updateClassicalUI();
    },
    describeStep: (bitVal, i) => ({
      explain: `Step ${i + 1}: the bit is now <strong>${bitVal}</strong>. A classical bit is a real physical switch — a transistor either ` +
        `conducting or not, a magnetic domain pointing one way or the other — so it always holds one definite value at every instant. ` +
        `There's no "47% chance it's 1" reading for a classical bit the way there is for a qubit's superposition; it's cleanly ` +
        `${bitVal} — full stop — until something flips it again.`,
      historyLabel: String(bitVal),
      historyColor: bitVal === 0 ? 'var(--zero)' : 'var(--one)'
    }),
    explainerId: 'classical-tryme-explainer',
    historyId: 'classical-tryme-history'
  });
}

function updateClassicalUI() {
  const display = document.getElementById('classical-display');
  display.textContent = classicalBit;

  // Dim when 0, full brightness when 1 — visual metaphor for off/on
  display.classList.toggle('is-zero', classicalBit === 0);

  // Side labels: highlight the active side
  document.getElementById('lbl-zero').classList.toggle('active', classicalBit === 0);
  document.getElementById('lbl-one').classList.toggle('active',  classicalBit === 1);
}


// ════════ js/tabs/qubit-tab.js ════════
// Depends on: app.js state (qubitMain, rendererMain), core/dom-utils.js
// (copyShareLink). initQubitTab() wires up the preset buttons, sliders,
// and share button declared in index.html — called once from app.js's
// DOMContentLoaded.

// ═══════════════════════════════════════════════════════════════════
// QUBIT TAB
// ═══════════════════════════════════════════════════════════════════
function initQubitTab() {
  // Scoped to #qubit-1q-panel (not the whole #tab-qubit) — the Two Qubits
  // panel added below has its own [data-qubit2] preset buttons that must
  // NOT also drive qubitMain.
  document.querySelectorAll('#qubit-1q-panel .preset-btn').forEach(btn => {
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => setMainState(theta, phi));
  });
  document.getElementById('sl-theta').addEventListener('input', sliderUpdate);
  document.getElementById('sl-phi').addEventListener('input', sliderUpdate);

  document.getElementById('btn-share-qubit').addEventListener('click', e => {
    const b = qubitMain.getBloch();
    copyShareLink({ tab: 'qubit', theta: b.theta.toFixed(4), phi: b.phi.toFixed(4) }, e.currentTarget);
  });

  // Keyboard control: the sphere is drag-only otherwise, which locks out
  // anyone not using a mouse/touchscreen. Arrow keys nudge theta/phi in
  // small steps; hold Shift for bigger steps.
  document.getElementById('bloch-main').addEventListener('keydown', e => {
    const step = e.shiftKey ? Math.PI / 6 : Math.PI / 36; // 30° or 5°
    const b = qubitMain.getBloch();
    let theta = b.theta, phi = b.phi;
    switch (e.key) {
      case 'ArrowUp':    theta = Math.max(0, theta - step); break;
      case 'ArrowDown':  theta = Math.min(Math.PI, theta + step); break;
      case 'ArrowLeft':  phi -= step; break;
      case 'ArrowRight': phi += step; break;
      default: return;
    }
    phi = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    e.preventDefault();
    setMainState(theta, phi);
  });

  document.querySelectorAll('.mode-btn[data-qubit-mode]').forEach(btn =>
    btn.addEventListener('click', () => setQubitMode(btn.dataset.qubitMode)));
  document.querySelectorAll('.mode-btn[data-qubit-submode]').forEach(btn =>
    btn.addEventListener('click', () => setQubitSubmode(btn.dataset.qubitSubmode)));
  initQubit2Panel();
  initQubit3Panel();

  document.getElementById('btn-qubit-tryme').addEventListener('click', () => {
    const presetBtns = document.querySelectorAll('#qubit-1q-panel .preset-btn');
    runTryMeSequence({
      button: document.getElementById('btn-qubit-tryme'),
      disableEls: [...presetBtns, document.getElementById('sl-theta'), document.getElementById('sl-phi')],
      states: QUBIT_TRYME_STATES,
      applyState: s => setMainState(s.theta, s.phi),
      describeStep: (s, i) => {
        const label  = QUBIT_TRYME_LABELS[i % QUBIT_TRYME_LABELS.length];
        const detail = QUBIT_TRYME_DETAILS[i % QUBIT_TRYME_DETAILS.length];
        const p0 = Math.round(qubitMain.prob0() * 100);
        const p1 = Math.round(qubitMain.prob1() * 100);
        return {
          explain: `<strong>${label}</strong> — ${detail} Right now that's ${p0}% |0⟩, ${p1}% |1⟩.`,
          historyLabel: label,
          historyColor: 'var(--zero)'
        };
      },
      explainerId: 'qubit-tryme-explainer',
      historyId: 'qubit-tryme-history'
    });
  });
}

/** |0⟩, |1⟩, |+⟩, |-⟩, |i⟩, |-i⟩ — the same six presets as the Basis
 *  States buttons above, in the same order, as (theta, phi) radians
 *  rather than the buttons' own theta/phi-mult-of-π attributes. Shared
 *  by both Try me buttons below — the Two Qubit one just uses the first
 *  four (it has no |i⟩/|-i⟩ presets of its own). */
const QUBIT_TRYME_STATES = [
  { theta: 0,         phi: 0 },
  { theta: Math.PI,   phi: 0 },
  { theta: Math.PI/2, phi: 0 },
  { theta: Math.PI/2, phi: Math.PI },
  { theta: Math.PI/2, phi: Math.PI/2 },
  { theta: Math.PI/2, phi: 1.5 * Math.PI }
];
// Same order as QUBIT_TRYME_STATES — used to label each step's history
// chip/explainer without re-deriving a ket label from (theta, phi).
const QUBIT_TRYME_LABELS = ['|0⟩', '|1⟩', '|+⟩', '|-⟩', '|i⟩', '|-i⟩'];
// Same order again — one detailed, physically-grounded sentence per basis
// state, shared by the One/Two/Three Qubit Try Me explainers below so the
// "what does this position mean" writeup only lives in one place.
const QUBIT_TRYME_DETAILS = [
  'the north pole of the Bloch sphere — the qubit\'s definite "off" state, with zero superposition at all.',
  'the south pole of the Bloch sphere — the definite "on" state, the exact opposite pole from |0⟩.',
  'sitting on the equator at phase φ=0° — an equal superposition. A measurement here is a genuine coin flip: before you measure, the qubit isn\'t secretly one value or the other, it truly holds both at once.',
  'also on the equator (the same 50/50 odds as |+⟩) but at phase φ=180°, so the |1⟩ amplitude points the opposite way. A single measurement can\'t tell |+⟩ and |-⟩ apart — only a Hadamard gate or an interference experiment reveals that hidden phase.',
  'on the equator at phase φ=90° — 50/50 odds again, but now with an imaginary relative phase between the amplitudes. This is a state a classical bit could never represent — the extra "twist" comes from the complex numbers underlying quantum amplitudes.',
  'on the equator at phase φ=270°, the mirror image of |i⟩ — same 50/50 measurement odds, opposite imaginary phase.'
];
const QUBIT_TRYME_INTERVAL_MS = 2800; // gives the detailed, multi-sentence per-step explanations below real reading time, not just sphere-settle time (same reasoning as GATES_TRYME_INTERVAL_MS)

/** Shared driver for every "Try me" button in the app (also used by
 *  gates-tab.js's Apply Gate demo — plain <script> tags share one global
 *  scope here, so this is reachable there too) — walks through `states`
 *  exactly once, applying each preset condition via `applyState`, and
 *  disables `button` + `disableEls` for the run so a manual click/drag
 *  can't fight the auto-cycle mid-sequence. A single deliberate pass
 *  through named presets, not a repeating loop — the student can revisit
 *  any earlier position afterward via the rollback history below instead
 *  of waiting for it to cycle back around. `intervalMs` defaults to this
 *  tab's own pacing but is overridable per call (the Gates tab's own demo
 *  wants more reading time for its longer per-gate paragraphs). Relies on
 *  the native disabled-button behavior (no click events fire) rather than
 *  its own re-entrancy flag, so clicking while running is simply a no-op
 *  until the run finishes.
 *
 *  `describeStep(state, idx)` is optional — when given, it may return
 *  `{ explain, historyLabel, historyColor }`. `explain` is written into
 *  `explainerId` via setExplainer() (same soft-fade update the Gates tab
 *  already uses); `historyLabel`/`historyColor` render one chip into
 *  `historyId`'s `.history-row`. Both target ids are optional
 *  independently of each other and of `describeStep` itself, so callers
 *  that don't need a running narration (the Gates tab's own Try Me, which
 *  already narrates via applyGate()) are unaffected. The history strip is
 *  cleared at the start of each run rather than accumulating across runs,
 *  so replaying Try me always starts from an empty trail.
 *
 *  Rollback: each history chip is a real button, not just a label — click
 *  one any time (mid-run or after it finishes) and it replays that exact
 *  step via the same showStep() the auto-play itself uses, so the student
 *  can jump back to any earlier position, re-read its explanation, and
 *  see the sphere/display land back exactly where it was there. showStep()
 *  also marks the clicked (or currently auto-playing) chip with
 *  `.is-current` so it's always clear which position is on screen. */
function runTryMeSequence({ button, disableEls, states, applyState, intervalMs = QUBIT_TRYME_INTERVAL_MS, describeStep = null, explainerId = null, historyId = null }) {
  button.disabled = true;
  disableEls.forEach(el => { el.disabled = true; });

  const historyEl = historyId ? document.getElementById(historyId) : null;
  if (historyEl) historyEl.innerHTML = '';

  function showStep(idx) {
    applyState(states[idx]);
    if (!describeStep) return null;
    const step = describeStep(states[idx], idx) || {};
    if (explainerId && step.explain) setExplainer(explainerId, step.explain);
    if (historyEl) {
      historyEl.querySelectorAll('.hist-tag').forEach(chip =>
        chip.classList.toggle('is-current', parseInt(chip.dataset.stepIdx, 10) === idx));
    }
    return step;
  }

  let idx = 0;
  const timer = setInterval(() => {
    const step = showStep(idx);
    if (historyEl && step && step.historyLabel) {
      const color = step.historyColor || 'var(--text2)';
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'hist-tag is-current';
      chip.dataset.stepIdx = idx;
      chip.style.color = color;
      chip.style.borderColor = color + '44';
      chip.textContent = step.historyLabel;
      chip.title = 'Click to revisit this step and re-read its explanation';
      chip.disabled = true; // enabled once the run finishes, below — no rollback mid-run
      const stepIdx = idx; // captured per-chip — idx itself keeps advancing
      chip.addEventListener('click', () => showStep(stepIdx));
      historyEl.appendChild(chip);
    }
    idx++;
    if (idx >= states.length) {
      clearInterval(timer);
      button.disabled = false;
      disableEls.forEach(el => { el.disabled = false; });
      if (historyEl) historyEl.querySelectorAll('.hist-tag').forEach(chip => { chip.disabled = false; });
    }
  }, intervalMs);
}

/** Classical/Quantum switch for the Bits tab. Classical is its own
 *  standalone page; Quantum reveals a second-level toggle for
 *  One Qubit / Two Qubit (see setQubitSubmode). Landing on Quantum
 *  always resets to the qubit explainer, regardless of whichever
 *  submode was last picked — callers that want a specific submode
 *  (e.g. roadmap navigation) call setQubitSubmode() right after. */
function setQubitMode(mode) {
  document.querySelectorAll('.mode-btn[data-qubit-mode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.qubitMode === mode));
  document.getElementById('qubit-classical-panel').style.display = mode === 'classical' ? '' : 'none';
  document.getElementById('qubit-quantum-panel').style.display   = mode === 'quantum'   ? '' : 'none';
  if (mode === 'quantum') setQubitSubmode(null);
  else syncSidebarSub('qubit', { qubitMode: mode, qubitSubmode: undefined });
}

/** One Qubit/Two Qubit switch nested inside the Quantum panel. Until one
 *  is picked, qubit-quantum-intro explains what a qubit is instead. */
function setQubitSubmode(submode) {
  document.querySelectorAll('.mode-btn[data-qubit-submode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.qubitSubmode === submode));
  document.getElementById('qubit-quantum-intro').style.display = submode ? 'none' : '';
  document.getElementById('qubit-1q-panel').style.display = submode === '1q' ? '' : 'none';
  document.getElementById('qubit-2q-panel').style.display = submode === '2q' ? '' : 'none';
  document.getElementById('qubit-3q-panel').style.display = submode === '3q' ? '' : 'none';
  syncSidebarSub('qubit', { qubitMode: 'quantum', qubitSubmode: submode || undefined });
}

/** Two independent Qubit instances (see app.js's qubit2A/qubit2B), each
 *  with its own Bloch sphere — deliberately not a shared TwoQubitState,
 *  since nothing here is entangled; the joint probabilities are just the
 *  product of each qubit's own, computed fresh in updateQubit2UI(). */
function initQubit2Panel() {
  const qubit2Btns = document.querySelectorAll('[data-qubit2]');
  qubit2Btns.forEach(btn => {
    const which = btn.dataset.qubit2;
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => {
      (which === 'a' ? qubit2A : qubit2B).setState(theta, phi);
      updateQubit2UI();
    });
  });

  document.getElementById('btn-qubit2-tryme').addEventListener('click', () => {
    runTryMeSequence({
      button: document.getElementById('btn-qubit2-tryme'),
      disableEls: [...qubit2Btns],
      states: QUBIT_TRYME_STATES.slice(0, 4), // |0⟩, |1⟩, |+⟩, |-⟩ — both qubits move together
      applyState: s => {
        qubit2A.setState(s.theta, s.phi);
        qubit2B.setState(s.theta, s.phi);
        updateQubit2UI();
      },
      describeStep: (s, i) => {
        const label  = QUBIT_TRYME_LABELS[i % 4];
        const detail = QUBIT_TRYME_DETAILS[i % 4];
        // Both qubits are always set identically here, so A's own odds
        // describe both — squaring/cross-multiplying them gives the exact
        // joint distribution, the concrete P(ab) = P(a) × P(b) at work.
        const p0 = qubit2A.prob0(), p1 = qubit2A.prob1();
        const pct = x => Math.round(x * 100);
        return {
          explain: `Both qubits set to <strong>${label}</strong> — ${detail} Since the two qubits are completely independent (not entangled), ` +
            `the joint state is the tensor product ${label}⊗${label}: ${pct(p0 * p0)}% |00⟩, ${pct(p0 * p1)}% |01⟩, ${pct(p1 * p0)}% |10⟩, ${pct(p1 * p1)}% |11⟩ — ` +
            `exactly P(ab) = P(a) × P(b).`,
          historyLabel: label,
          historyColor: 'var(--one)'
        };
      },
      explainerId: 'qubit2-tryme-explainer',
      historyId: 'qubit2-tryme-history'
    });
  });
}

// theta never wraps (its range is [0, π] by construction), but phi does
// — comparing raw values would treat 0 and 2π (the same angle) as far
// apart, so phi's diff is folded to the short way around the circle.
const PRESET_MATCH_EPS = 1e-3; // radians (~0.06°) — well past round-trip float noise, well under any deliberate drag

/** Toggles .is-active on whichever button in `presetBtns` matches
 *  (theta, phi) — at most one, since no two basis-state presets share a
 *  point on the sphere — so the preset grid always reflects the sphere's
 *  actual current state instead of only showing feedback for the instant
 *  a preset was clicked. */
function highlightMatchingPreset(presetBtns, theta, phi) {
  const twoPi = 2 * Math.PI;
  const normPhi = ((phi % twoPi) + twoPi) % twoPi;
  presetBtns.forEach(btn => {
    const bTheta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const bPhi   = ((parseFloat(btn.dataset.phiMult) * Math.PI % twoPi) + twoPi) % twoPi;
    const phiDiff = Math.min(Math.abs(bPhi - normPhi), twoPi - Math.abs(bPhi - normPhi));
    const match = Math.abs(bTheta - theta) < PRESET_MATCH_EPS && phiDiff < PRESET_MATCH_EPS;
    btn.classList.toggle('is-active', match);
  });
}

/** Three independent Qubit instances (see app.js's qubit3A/B/C), same
 *  "not entangled" pattern as initQubit2Panel() above — just one more
 *  qubit and an 8-row joint table instead of 4. */
function initQubit3Panel() {
  const qubit3Btns = document.querySelectorAll('[data-qubit3]');
  const qubitsByLetter = { a: qubit3A, b: qubit3B, c: qubit3C };
  qubit3Btns.forEach(btn => {
    const which = btn.dataset.qubit3;
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => {
      qubitsByLetter[which].setState(theta, phi);
      updateQubit3UI();
    });
  });

  document.getElementById('btn-qubit3-tryme').addEventListener('click', () => {
    runTryMeSequence({
      button: document.getElementById('btn-qubit3-tryme'),
      disableEls: [...qubit3Btns],
      states: QUBIT_TRYME_STATES.slice(0, 4), // |0⟩, |1⟩, |+⟩, |-⟩ — all three qubits move together
      applyState: s => {
        qubit3A.setState(s.theta, s.phi);
        qubit3B.setState(s.theta, s.phi);
        qubit3C.setState(s.theta, s.phi);
        updateQubit3UI();
      },
      describeStep: (s, i) => {
        const label  = QUBIT_TRYME_LABELS[i % 4];
        const detail = QUBIT_TRYME_DETAILS[i % 4];
        // Only ever |0⟩, |1⟩, |+⟩, or |-⟩ here (this slice's 4 states), so
        // the joint outcome is always exactly one of these two shapes:
        // fully deterministic (|0⟩/|1⟩) or a flat eighth each (|+⟩/|-⟩) —
        // no need to spell out all 8 percentages to be exact about it.
        const p0 = qubit3A.prob0(), p1 = qubit3A.prob1();
        const jointDesc = p0 > 0.999
          ? 'always |000⟩ — 100% certain, zero superposition anywhere in the joint state'
          : p1 > 0.999
            ? 'always |111⟩ — 100% certain, zero superposition anywhere in the joint state'
            : 'a flat 12.5% across all eight outcomes |000⟩ through |111⟩';
        return {
          explain: `All three qubits set to <strong>${label}</strong> — ${detail} Since all three are independent (not entangled), ` +
            `the joint state is the triple tensor product ${label}⊗${label}⊗${label}: ${jointDesc} — exactly P(abc) = P(a) × P(b) × P(c).`,
          historyLabel: label,
          historyColor: 'var(--zero)'
        };
      },
      explainerId: 'qubit3-tryme-explainer',
      historyId: 'qubit3-tryme-history'
    });
  });
}

const QUBIT3_KETS = ['000', '001', '010', '011', '100', '101', '110', '111'];

function updateQubit3UI() {
  const a = qubit3A.getBloch(), b = qubit3B.getBloch(), c = qubit3C.getBloch();
  rendererQubit3A.animateTo(a.x, a.y, a.z, qubit3A.getLabel());
  rendererQubit3B.animateTo(b.x, b.y, b.z, qubit3B.getLabel());
  rendererQubit3C.animateTo(c.x, c.y, c.z, qubit3C.getLabel());
  highlightMatchingPreset(document.querySelectorAll('[data-qubit3="a"]'), a.theta, a.phi);
  highlightMatchingPreset(document.querySelectorAll('[data-qubit3="b"]'), b.theta, b.phi);
  highlightMatchingPreset(document.querySelectorAll('[data-qubit3="c"]'), c.theta, c.phi);
  document.getElementById('label-3q-a').textContent   = qubit3A.getLabel();
  document.getElementById('label-3q-b').textContent   = qubit3B.getLabel();
  document.getElementById('label-3q-c').textContent   = qubit3C.getLabel();
  document.getElementById('formula-3q-a').textContent = qubit3A.getFormula();
  document.getElementById('formula-3q-b').textContent = qubit3B.getFormula();
  document.getElementById('formula-3q-c').textContent = qubit3C.getFormula();
  document.getElementById('bloch-3q-a').setAttribute('aria-label',
    `Bloch sphere for Qubit A. State: ${qubit3A.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);
  document.getElementById('bloch-3q-b').setAttribute('aria-label',
    `Bloch sphere for Qubit B. State: ${qubit3B.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);
  document.getElementById('bloch-3q-c').setAttribute('aria-label',
    `Bloch sphere for Qubit C. State: ${qubit3C.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);

  // Product state: three independent qubits, so the joint probability of
  // any three-bit outcome is just each qubit's own probability multiplied
  // together — same reasoning as updateQubit2UI() below, one more factor.
  const pA = [qubit3A.prob0(), qubit3A.prob1()];
  const pB = [qubit3B.prob0(), qubit3B.prob1()];
  const pC = [qubit3C.prob0(), qubit3C.prob1()];
  const last = QUBIT3_KETS.length - 1;
  const container = document.getElementById('qubit3-prob-rows');
  container.innerHTML = QUBIT3_KETS.map((ket, i) => {
    const bits = [(i >> 2) & 1, (i >> 1) & 1, i & 1];
    const p = pA[bits[0]] * pB[bits[1]] * pC[bits[2]];
    const pct = p * 100;
    const color     = i === 0 ? 'var(--zero)' : i === last ? 'var(--one)' : 'var(--text2)';
    const fillClass = i === 0 ? 'zero-fill'   : i === last ? 'one-fill'   : '';
    const fillStyle = fillClass ? '' : 'background:var(--text2);';
    return `
      <div class="prob-row">
        <span class="ket" style="color:${color}">|${ket}⟩</span>
        <div class="track"><div class="fill ${fillClass}" style="${fillStyle}width:${pct}%"></div></div>
        <span class="pct">${Math.round(pct)}%</span>
      </div>`;
  }).join('');
}

function updateQubit2UI() {
  const a = qubit2A.getBloch(), b = qubit2B.getBloch();
  rendererQubit2A.animateTo(a.x, a.y, a.z, qubit2A.getLabel());
  rendererQubit2B.animateTo(b.x, b.y, b.z, qubit2B.getLabel());
  highlightMatchingPreset(document.querySelectorAll('[data-qubit2="a"]'), a.theta, a.phi);
  highlightMatchingPreset(document.querySelectorAll('[data-qubit2="b"]'), b.theta, b.phi);
  document.getElementById('label-2q-a').textContent   = qubit2A.getLabel();
  document.getElementById('label-2q-b').textContent   = qubit2B.getLabel();
  document.getElementById('formula-2q-a').textContent = qubit2A.getFormula();
  document.getElementById('formula-2q-b').textContent = qubit2B.getFormula();
  document.getElementById('bloch-2q-a').setAttribute('aria-label',
    `Bloch sphere for Qubit A. State: ${qubit2A.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);
  document.getElementById('bloch-2q-b').setAttribute('aria-label',
    `Bloch sphere for Qubit B. State: ${qubit2B.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);

  // Product state: two independent qubits, so the joint probability of
  // any two-bit outcome is just each qubit's own probability multiplied
  // together — no entanglement math involved (contrast TwoQubitState in
  // the Circuit/Entangle tabs, which mixes amplitudes instead).
  const pA0 = qubit2A.prob0(), pA1 = qubit2A.prob1();
  const pB0 = qubit2B.prob0(), pB1 = qubit2B.prob1();
  const joint = { '00': pA0 * pB0, '01': pA0 * pB1, '10': pA1 * pB0, '11': pA1 * pB1 };
  Object.entries(joint).forEach(([ket, p]) => {
    const pct = p * 100;
    document.getElementById(`q2-fill-${ket}`).style.width = pct + '%';
    document.getElementById(`q2-pct-${ket}`).textContent  = Math.round(pct) + '%';
  });
}

function setMainState(theta, phi) {
  qubitMain.setState(theta, phi);
  document.getElementById('sl-theta').value = Math.round(theta * 1000);
  document.getElementById('sl-phi').value   = Math.round(phi   * 1000);
  updateQubitUI();
}

function sliderUpdate() {
  const theta = parseInt(document.getElementById('sl-theta').value) / 1000;
  const phi   = parseInt(document.getElementById('sl-phi').value)   / 1000;
  document.getElementById('val-theta').textContent = Math.round(theta * 180 / Math.PI) + '°';
  document.getElementById('val-phi').textContent   = Math.round(phi   * 180 / Math.PI) + '°';
  qubitMain.setState(theta, phi);
  updateQubitUI();
}

function updateQubitUI() {
  const b  = qubitMain.getBloch();
  const p0 = qubitMain.prob0() * 100;
  const p1 = qubitMain.prob1() * 100;

  rendererMain.animateTo(b.x, b.y, b.z, qubitMain.getLabel());
  document.getElementById('bloch-main').setAttribute('aria-label',
    `Bloch sphere. State: ${qubitMain.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);
  document.getElementById('label-main').textContent   = qubitMain.getLabel();
  document.getElementById('formula-main').textContent = qubitMain.getFormula();
  document.getElementById('fill0-main').style.width   = p0 + '%';
  document.getElementById('fill1-main').style.width   = p1 + '%';
  document.getElementById('pct0-main').textContent    = Math.round(p0) + '%';
  document.getElementById('pct1-main').textContent    = Math.round(p1) + '%';
  document.getElementById('val-theta').textContent    = Math.round(b.theta * 180 / Math.PI) + '°';
  document.getElementById('val-phi').textContent      = Math.round(b.phi   * 180 / Math.PI) + '°';
  highlightMatchingPreset(document.querySelectorAll('#qubit-1q-panel .preset-btn'), b.theta, b.phi);
}


// ════════ js/tabs/mathsconcept-tab.js ════════
// Mostly a reference tab — text + formulas, no state of its own — except
// the State Vector section, which also embeds the interactive
// classical-vs-quantum comparison widget from tabs/statevector-tab.js
// (wired up separately by that file's own initStatevecTab(), called
// alongside initMathsConceptTab() in app.js). Navigated exclusively via
// the sidebar's Maths Concept sub-links (see the generic .tab-sub
// handler in app.js), which call setMathsSection() directly, so there's
// no in-page toggle to wire up here.
// Depends on: core/tab-registry.js (registerTab), tabs/statevector-tab.js
// (redrawStatevecCanvases).

const MATHS_SECTIONS = ['complex', 'vectors', 'matrices', 'statevector', 'dirac', 'tensor'];

function initMathsConceptTab() {
  registerTab('mathsconcept', {});
  setMathsSection('complex'); // matches the panel already visible by default in index.html
}

/** Shows the one .maths-panel matching `section`, hides the rest. */
function setMathsSection(section) {
  MATHS_SECTIONS.forEach(name => {
    document.getElementById(`maths-${name}`).style.display = name === section ? '' : 'none';
  });
  syncSidebarSub('mathsconcept', { mathsSection: section });
  // The state-vector section's canvases (see tabs/statevector-tab.js)
  // don't redraw themselves while display:none, so opening this section
  // needs the same explicit redraw a tab visit used to trigger back when
  // this widget was its own top-level "Statevec" tab.
  if (section === 'statevector') redrawStatevecCanvases();
}


// ════════ js/tabs/gates-tab.js ════════
// Depends on: core/gates.js (GATES, ROTATION_GATES, rotationMatrix),
// core/complex.js (C.fmt), core/dom-utils.js (setExplainer),
// core/tab-registry.js (registerTab), app.js state (qubitMain, gateHistory,
// rendererGates), tabs/qubit-tab.js (updateQubitUI, called after applying a gate).
//
// gateHistory entries carry a display label/color plus a snapshot of the
// qubit's exact (theta, phi) right after that step, the explainer HTML
// shown at the time, and enough to redraw that step's matrix (matrixKey
// for fixed gates; matrix/rotationAxis/rotationAngle for rotation gates)
// — see restoreGateHistoryStep() below. Snapshots rather than replayable
// operations because entries come from two different sources that behave
// differently: manual gate clicks compound on whatever state came
// before, while a Try Me run resets to |0⟩ before each step (see
// initGatesTryMe()) — a snapshot of the resulting state means rollback
// doesn't need to know or care which kind of entry it's restoring.
// gateHistoryCursor tracks which entry is currently on screen (not
// necessarily the last one, once a rollback click has fired).

// ═══════════════════════════════════════════════════════════════════
// GATES TAB
// ═══════════════════════════════════════════════════════════════════
/** Classical Gates/Quantum Gates/Compare switch for the Gates tab — same
 *  multi-panel toggle pattern as Circuits' domain toggle, extended to a
 *  third "Compare" panel (item 14) that needs both truth tables built
 *  once, on first visit, rather than every switch. */
function setGatesDomain(domain) {
  document.querySelectorAll('.mode-btn[data-gates-domain]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.gatesDomain === domain));
  document.getElementById('gates-classical-panel').style.display = domain === 'classical' ? '' : 'none';
  document.getElementById('gates-quantum-panel').style.display   = domain === 'quantum'   ? '' : 'none';
  document.getElementById('gates-compare-panel').style.display   = domain === 'compare'   ? '' : 'none';
  syncSidebarSub('gates', { gatesDomain: domain });
}

function buildGateButtons() {
  document.querySelectorAll('.mode-btn[data-gates-domain]').forEach(btn =>
    btn.addEventListener('click', () => setGatesDomain(btn.dataset.gatesDomain)));
  syncSidebarSub('gates', { gatesDomain: 'quantum' }); // matches the panel already active by default in index.html

  renderGateGrid();
  document.getElementById('btn-reset-gates').addEventListener('click', resetGates);
  buildRotationButtons();
  buildGateReference();
  initGatesTryMe();
  buildQuantumGateTruthTable('gates-truth-table');
  buildQuantumGateTruthTable('gates-compare-quantum-table');
  buildAllClassicalGatesTruthTables('gates-compare-classical-table');

  // The Gates-tab sphere mirrors qubitMain but is otherwise idle between
  // visits, so jump its animation state to the current qubit on entry
  // instead of tweening in from wherever it was last left.
  registerTab('gates', {
    onEnter: () => {
      const b = qubitMain.getBloch();
      rendererGates.cur = { ...b };
      rendererGates.draw(b.x, b.y, b.z, qubitMain.getLabel());
      document.getElementById('label-gates').textContent = qubitMain.getLabel();
    }
  });

  // gate.desc/formalName render translated text (see t() calls in
  // renderGateGrid/buildRotationButtons/buildGateReference below), so a
  // language switch needs these three rebuilt — each clears its own
  // container first, so calling them again is safe, not a duplicate-append.
  onLangChange(() => {
    renderGateGrid();
    buildRotationButtons();
    buildGateReference();
    buildQuantumGateTruthTable('gates-truth-table');
    buildQuantumGateTruthTable('gates-compare-quantum-table');
    buildAllClassicalGatesTruthTables('gates-compare-classical-table');
  });
}

// ─── TRUTH TABLE (item 13) ─────────────────────────────────────────────
/** Formats a basis-state output (two complex amplitudes) as a ket sum,
 *  e.g. (0.707)|0⟩ + (-0.707)|1⟩ — a coefficient of exactly 1 is shown as
 *  a bare ket (|1⟩, not (1)|1⟩) since that's the common case (X, Z, S, T
 *  acting on one of the two basis states). */
function formatKetOutput(c0, c1) {
  const parts = [];
  [c0, c1].forEach((c, k) => {
    if (C.mag(c) <= 0.0005) return;
    const coef = C.fmt(c);
    parts.push(coef === '1' ? `|${k}⟩` : `(${coef})|${k}⟩`);
  });
  return parts.length ? parts.join(' + ') : '0';
}

/** Renders a Gate/Input/Output table into `targetId` — every fixed GATES
 *  entry's action on both basis states |0⟩ and |1⟩, computed directly
 *  from its matrix (matrix[0][basis]/matrix[1][basis] are exactly the
 *  output amplitudes for a basis-state input, since matrix-vector
 *  multiplying by a basis vector just selects that column). Rotation
 *  gates are excluded — their matrix depends on a runtime angle, so
 *  there's no single fixed table to show. Called once per gates-tab.js
 *  page (the main Quantum Gates panel's own table, item 13, and the
 *  Compare panel's quantum-side table, item 14) plus again on every
 *  language change, since the header cells go through t(). */
function buildQuantumGateTruthTable(targetId) {
  const table = document.getElementById(targetId);
  if (!table) return;
  const rows = [];
  Object.entries(GATES).forEach(([key, gate]) => {
    [0, 1].forEach(basis => {
      const c0 = gate.matrix[0][basis];
      const c1 = gate.matrix[1][basis];
      rows.push({ gate, input: basis, output: formatKetOutput(c0, c1) });
    });
  });
  table.innerHTML = `<tr><th>${t('common.gate', 'Gate')}</th><th>${t('common.input', 'Input')}</th><th>${t('common.output', 'Output')}</th></tr>` +
    rows.map(r => `<tr><td style="color:${r.gate.color};font-weight:700;">${r.gate.name}</td><td>|${r.input}⟩</td><td>${r.output}</td></tr>`).join('');
}

/** Builds the "Apply Gate" button grid — split out from buildGateButtons()
 *  so a language switch can rebuild just this (clears the grid first,
 *  so calling it again is idempotent rather than duplicating buttons). */
function renderGateGrid() {
  const grid = document.getElementById('gate-grid');
  grid.innerHTML = '';
  Object.entries(GATES).forEach(([key, gate]) => {
    const btn = document.createElement('button');
    btn.className = 'gate-btn';
    btn.dataset.gateKey = key;
    btn.style.color       = gate.color;
    btn.style.borderColor = gate.color + '44';
    btn.innerHTML = `${gate.name}<span class="gate-sub">${t(`gates.${key}.desc`, gate.desc)}</span>`;
    btn.addEventListener('click', () => applyGate(key, btn));
    grid.appendChild(btn);
  });
}

function applyGate(key, btn) {
  const gate = GATES[key];
  qubitMain.applyGate(gate.matrix);
  showMatrix(key);
  updateQubitUI();
  if (btn) pulseElement(btn, 'pulsing');
  pulseElement(document.querySelector('#tab-gates .bloch-wrap'), 'pulsing', 550);

  const p0 = Math.round(qubitMain.prob0() * 100);
  const p1 = Math.round(qubitMain.prob1() * 100);
  const explain = `<strong style="color:${gate.color}">${gate.name} — ${gate.desc}.</strong> ${gate.explain} <br><br>New odds: ${p0}% |0⟩, ${p1}% |1⟩ — state is now <span style="font-family:'JetBrains Mono',monospace">${qubitMain.getFormula()}</span>.`;
  setExplainer('gate-explainer', explain);

  const b = qubitMain.getBloch();
  gateHistory.push({ label: gate.name, color: gate.color, theta: b.theta, phi: b.phi, matrixKey: key, explain });
  gateHistoryCursor = gateHistory.length - 1;
  updateGatesUI();
}

function showMatrix(key) {
  const gate = GATES[key];
  const [[a, b], [c, d]] = gate.matrixStr;
  document.getElementById('matrix-display').innerHTML = `
    <div class="matrix-name">${gate.name} =</div>
    <div class="matrix-body">
      <span class="matrix-bracket">[</span>
      <div class="matrix-cells">
        <span class="matrix-cell" style="color:${gate.color}">${a}</span>
        <span class="matrix-cell" style="color:${gate.color}">${b}</span>
        <span class="matrix-cell" style="color:${gate.color}">${c}</span>
        <span class="matrix-cell" style="color:${gate.color}">${d}</span>
      </div>
      <span class="matrix-bracket">]</span>
    </div>
  `;
}

// ─── ROTATION GATES ───────────────────────────────────────────────────
function buildRotationButtons() {
  const grid = document.getElementById('rotation-gate-grid');
  grid.innerHTML = '';
  Object.entries(ROTATION_GATES).forEach(([axis, gate]) => {
    const btn = document.createElement('button');
    btn.className = 'gate-btn';
    btn.style.color       = gate.color;
    btn.style.borderColor = gate.color + '44';
    btn.innerHTML = `${gate.label}<span class="gate-sub">${t(`rotationGates.${axis}.desc`, gate.desc)}</span>`;
    btn.addEventListener('click', () => {
      const angleDeg = parseInt(document.getElementById('rotation-angle').value, 10);
      applyRotationGate(axis, angleDeg, btn);
    });
    grid.appendChild(btn);
  });
  document.getElementById('rotation-angle').addEventListener('input', updateRotationAngleLabel);
}

function updateRotationAngleLabel() {
  const val = document.getElementById('rotation-angle').value;
  document.getElementById('rotation-angle-val').textContent = val + '°';
}

/* A permanent, always-visible glossary of what each gate letter stands
   for (Hadamard, the three Pauli gates, the phase gates) — the buttons
   above only show playful nicknames, so this is the one place a visitor
   can see the formal names without having to hover or apply a gate first. */
function buildGateReference() {
  const rows = [
    ...Object.entries(GATES).map(([key, g]) => ({ key, ns: 'gates', name: g.name, color: g.color, formalName: g.formalName, desc: g.desc })),
    ...Object.entries(ROTATION_GATES).map(([key, g]) => ({ key, ns: 'rotationGates', name: g.label, color: g.color, formalName: g.formalName, desc: g.desc }))
  ];
  document.getElementById('gate-reference-list').innerHTML = rows.map(g => `
    <div class="gate-reference-row">
      <span class="gate-reference-symbol" style="color:${g.color}">${g.name}</span>
      <span class="gate-reference-formal">${t(`${g.ns}.${g.key}.formalName`, g.formalName)}</span>
      <span class="gate-reference-nick">${t(`${g.ns}.${g.key}.desc`, g.desc)}</span>
    </div>
  `).join('');
}

function applyRotationGate(axis, angleDeg, btn) {
  const gate = ROTATION_GATES[axis];
  const matrix = rotationMatrix(axis, angleDeg);
  qubitMain.applyGate(matrix);
  showRotationMatrix(axis, angleDeg, matrix);
  updateQubitUI();
  if (btn) pulseElement(btn, 'pulsing');
  pulseElement(document.querySelector('#tab-gates .bloch-wrap'), 'pulsing', 550);

  const p0 = Math.round(qubitMain.prob0() * 100);
  const p1 = Math.round(qubitMain.prob1() * 100);
  const explain = `<strong style="color:${gate.color}">${gate.label}(${angleDeg}°) — ${gate.desc}.</strong> Unlike the fixed gates above, you choose exactly how far this one turns — drag the angle slider and apply it again to see the difference. <br><br>New odds: ${p0}% |0⟩, ${p1}% |1⟩ — state is now <span style="font-family:'JetBrains Mono',monospace">${qubitMain.getFormula()}</span>.`;
  setExplainer('gate-explainer', explain);

  const b = qubitMain.getBloch();
  gateHistory.push({ label: `${gate.label}(${angleDeg}°)`, color: gate.color, theta: b.theta, phi: b.phi, matrix, rotationAxis: axis, rotationAngle: angleDeg, explain });
  gateHistoryCursor = gateHistory.length - 1;
  updateGatesUI();
}

function showRotationMatrix(axis, angleDeg, matrix) {
  const gate = ROTATION_GATES[axis];
  const cells = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1]].map(z => C.fmt(z));
  document.getElementById('matrix-display').innerHTML = `
    <div class="matrix-name">${gate.label}(${angleDeg}°) =</div>
    <div class="matrix-body">
      <span class="matrix-bracket">[</span>
      <div class="matrix-cells">
        <span class="matrix-cell" style="color:${gate.color}">${cells[0]}</span>
        <span class="matrix-cell" style="color:${gate.color}">${cells[1]}</span>
        <span class="matrix-cell" style="color:${gate.color}">${cells[2]}</span>
        <span class="matrix-cell" style="color:${gate.color}">${cells[3]}</span>
      </div>
      <span class="matrix-bracket">]</span>
    </div>
  `;
}

let gateHistoryCursor = -1; // index of the entry currently on screen — not always the last one, once a rollback click has fired

function updateGatesUI() {
  const b = qubitMain.getBloch();
  rendererGates.animateTo(b.x, b.y, b.z, qubitMain.getLabel());
  document.getElementById('bloch-gates').setAttribute('aria-label',
    `Bloch sphere. State: ${qubitMain.getFormula()}.`);
  document.getElementById('label-gates').textContent = qubitMain.getLabel();
  renderGateHistory();
}

/** Renders gateHistory as clickable rollback chips (real <button>s, same
 *  .hist-tag/.is-current styling as every other Try Me's history — see
 *  components.css) — click any step, whether it came from manually
 *  clicking gates or from a Try Me run, and it restores that exact
 *  snapshot via restoreGateHistoryStep() below. */
function renderGateHistory() {
  const hist = document.getElementById('gate-history');
  if (!gateHistory.length) {
    hist.innerHTML = '<span class="muted-text">—</span>';
    return;
  }
  hist.innerHTML = '';
  gateHistory.forEach((entry, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hist-tag' + (i === gateHistoryCursor ? ' is-current' : '');
    chip.style.color = entry.color;
    chip.style.borderColor = entry.color + '44';
    chip.textContent = entry.label;
    chip.title = 'Click to revisit this step and re-read its explanation';
    chip.addEventListener('click', () => {
      // A Try Me run disables the gate/rotation buttons for its
      // duration (see initGatesTryMe()) — same signal doubles as the
      // "don't let a rollback click fight the next auto-play tick"
      // guard every other Try Me's chips use.
      if (document.getElementById('btn-gates-tryme').disabled) return;
      restoreGateHistoryStep(i);
    });
    hist.appendChild(chip);
  });
}

/** Rollback — jumps the qubit straight to history entry `i`'s recorded
 *  (theta, phi) snapshot rather than replaying gates, so it works the
 *  same whether that step came from a compounding manual sequence or a
 *  Try Me step that reset to |0⟩ first. Also restores the matrix display
 *  and explainer text exactly as they were at that step, and does NOT
 *  push a new history entry — rollback navigates the trail, it doesn't
 *  extend it. */
function restoreGateHistoryStep(i) {
  const entry = gateHistory[i];
  if (!entry) return;
  gateHistoryCursor = i;
  qubitMain.setState(entry.theta, entry.phi);
  if (entry.rotationAxis) showRotationMatrix(entry.rotationAxis, entry.rotationAngle, entry.matrix);
  else showMatrix(entry.matrixKey);
  setExplainer('gate-explainer', entry.explain);
  updateGatesUI();
  updateQubitUI();
}

const GATES_TRYME_INTERVAL_MS = 2800; // each step's explainer paragraph is a few sentences long — needs real reading time, not just animation-settle time

/** Tours every fixed gate (H, X, Y, Z, S, T) once, resetting to |0⟩
 *  before each so every gate's effect is shown against the same
 *  baseline instead of compounding on top of the last one — matching
 *  this tab's own framing ("Pick one gate and see its immediate
 *  effect"), not a sequence to chain. Reuses runTryMeSequence() from
 *  qubit-tab.js (loaded earlier, shared global scope) rather than
 *  duplicating its disable/loop/interval bookkeeping. */
function initGatesTryMe() {
  document.getElementById('btn-gates-tryme').addEventListener('click', () => {
    const gateBtns = document.querySelectorAll('#gate-grid .gate-btn');
    runTryMeSequence({
      button: document.getElementById('btn-gates-tryme'),
      disableEls: [
        ...gateBtns,
        ...document.querySelectorAll('#rotation-gate-grid .gate-btn'),
        document.getElementById('rotation-angle'),
        document.getElementById('btn-reset-gates')
      ],
      states: Object.keys(GATES),
      applyState: key => {
        qubitMain = new Qubit();
        applyGate(key, document.querySelector(`#gate-grid [data-gate-key="${key}"]`));
      },
      intervalMs: GATES_TRYME_INTERVAL_MS
    });
  });
}

function resetGates() {
  qubitMain   = new Qubit();
  gateHistory = [];
  gateHistoryCursor = -1;
  document.getElementById('matrix-display').innerHTML = '<span class="muted-text">← select a gate</span>';
  setExplainer('gate-explainer', 'Back to |0⟩ — the qubit points straight up on the sphere, no gates applied yet. Click one to send it rotating.');
  updateGatesUI();
  updateQubitUI();
}


// ════════ js/tabs/circuit-tab.js ════════
// Depends on: core/gates.js (GATES), core/utils.js (delay),
// core/dom-utils.js (copyShareLink, buildGatePalette),
// app.js state (circuitGates, SLOT_COUNT, qubitCircuit, rendererCircuit).

// ═══════════════════════════════════════════════════════════════════
// CIRCUIT TAB
// ═══════════════════════════════════════════════════════════════════
/** Superposition (H's signature move), a blunt bit flip (X), and a
 *  Z-then-H sandwich that reveals Z's otherwise-invisible phase flip as
 *  an actual state change — echoes the Z gate's own "hand it to a
 *  Hadamard afterward" explain text in core/gates.js. */
const CIRCUIT_PRESETS = [
  { name: 'Superposition', gates: ['H'] },
  { name: 'Bit Flip',      gates: ['X'] },
  { name: 'Hidden Phase',  gates: ['H', 'Z', 'H'] }
];

function loadCircuitPreset(preset) {
  circuitGates = [...preset.gates];
  renderCircuitSlots();
  runCircuit();
}

function initCircuitTab() {
  document.getElementById('btn-run-circuit').addEventListener('click', runCircuit);
  document.getElementById('btn-clear-circuit').addEventListener('click', clearCircuit);
  document.getElementById('btn-share-circuit').addEventListener('click', e => {
    copyShareLink({ tab: 'circuit', circuit: circuitGates.join(',') }, e.currentTarget);
  });
  document.querySelectorAll('.mode-btn[data-circuit-domain]').forEach(btn =>
    btn.addEventListener('click', () => setCircuitDomain(btn.dataset.circuitDomain)));
  renderTryMe('circuit-try-me', CIRCUIT_PRESETS, loadCircuitPreset);
}

/** Top-level Classical/Quantum switch for the Circuits tab — sits above
 *  the quantum builder's own 1Q/2Q/3Q sub-toggle (see setCircuitMode() in
 *  circuit-multiqubit-tab.js), the same two-tier pattern the home page
 *  uses for Concept Map/My Progress. */
function setCircuitDomain(domain) {
  document.querySelectorAll('.mode-btn[data-circuit-domain]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.circuitDomain === domain));
  document.getElementById('circuit-classical-panel').style.display = domain === 'classical' ? '' : 'none';
  document.getElementById('circuit-quantum-panel').style.display   = domain === 'quantum'   ? '' : 'none';
  document.getElementById('circuit-compare-panel').style.display   = domain === 'compare'   ? '' : 'none';
}

function buildCircuitPalette() {
  buildGatePalette('circuit-palette', key => addGateToCircuit(key));
}

function buildCircuitSlots() {
  const el = document.getElementById('gate-slots');
  el.innerHTML = '';
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slot = document.createElement('div');
    slot.className     = 'gate-slot empty';
    slot.dataset.index = i;
    slot.title         = 'Click to remove';
    slot.addEventListener('click', () => removeCircuitGate(i));
    el.appendChild(slot);
  }
  renderCircuitSlots();
}

function addGateToCircuit(key) {
  if (circuitGates.length >= SLOT_COUNT) {
    setCircuitStatus('Circuit full — clear to reset');
    return;
  }
  circuitGates.push(key);
  renderCircuitSlots();
  setCircuitStatus('');
  setCircuitExplainer(
    circuitGates.length === 1
      ? `${GATES[key].name} takes the first checkpoint on the wire. The qubit hasn't moved yet, though — it's still sitting at |0⟩ until you hit Run and send it walking down the line.`
      : `Checkpoint ${circuitGates.length} is now ${GATES[key].name}. The route so far: ${circuitGates.map(k => GATES[k].name).join(' → ')}. Hit Run and the qubit will walk it start to finish.`
  );
}

function removeCircuitGate(i) {
  if (i < circuitGates.length) {
    circuitGates.splice(i, 1);
    renderCircuitSlots();
    setCircuitExplainer(
      circuitGates.length
        ? `Checkpoint removed. Remaining route: ${circuitGates.map(k => GATES[k].name).join(' → ')}.`
        : 'Route cleared — the wire is empty. Click gates above to lay down a new path.'
    );
  }
}

function renderCircuitSlots() {
  // Scoped to #gate-slots — the Classical Circuit builder (classical-
  // circuit-tab.js) has its own, separate set of .gate-slot elements on
  // the same page; an unscoped query here used to silently match those
  // first (they sit earlier in the DOM) and write gate labels into the
  // wrong wire, leaving this one always blank.
  const slots = document.querySelectorAll('#gate-slots .gate-slot');
  slots.forEach((slot, i) => {
    const key = circuitGates[i];
    if (key) {
      const g = GATES[key];
      slot.textContent      = g.name;
      slot.style.color       = g.color;
      slot.style.borderColor = g.color;
      slot.className = 'gate-slot filled';
    } else if (i === 0 && circuitGates.length === 0) {
      // Empty-state hint: the wire is otherwise just 8 blank dashed boxes
      // with no cue that clicking a palette gate above is what fills them.
      slot.textContent = '+';
      slot.style.color = '';
      slot.style.borderColor = '';
      slot.className = 'gate-slot empty gate-slot-hint';
    } else {
      slot.textContent       = '';
      slot.style.color       = '';
      slot.style.borderColor = '';
      slot.className = 'gate-slot empty';
    }
  });
}

// Run History (item: circuit-builder rollback) — a snapshot of the
// qubit's exact (theta, phi) after each step of the most recent Run,
// rendered as clickable numbered chips (reuses .hist-tag, same as every
// other rollback trail in the app). Rebuilt fresh at the start of each
// Run rather than accumulated across runs, same convention as the Try Me
// history strips. circuitRunning guards against a rollback click (or a
// second Run) racing the animation while one is already in progress.
let circuitRunHistory   = [];
let circuitHistoryCursor = -1;
let circuitRunning       = false;

async function runCircuit() {
  if (circuitRunning) return;
  if (circuitGates.length === 0) {
    setCircuitStatus('Add gates first');
    setCircuitExplainer('The wire is empty — there\'s no path to walk yet. Click gates in the palette above to lay one down, then press Run.');
    return;
  }
  circuitRunning = true;
  qubitCircuit = new Qubit();
  const slots  = document.querySelectorAll('#gate-slots .gate-slot'); // see renderCircuitSlots()'s comment above — same scoping fix
  setCircuitStatus('Running…');
  setCircuitExplainer('The qubit steps onto the wire at |0⟩ and starts walking the line, left to right…');
  circuitRunHistory = [];
  circuitHistoryCursor = -1;
  renderCircuitHistory();

  for (let i = 0; i < circuitGates.length; i++) {
    const key  = circuitGates[i];
    const gate = GATES[key];
    slots[i].classList.add('running');
    slots[i].style.color = gate.color;
    setCircuitExplainer(`Checkpoint ${i + 1} of ${circuitGates.length}: ${gate.name} — ${gate.desc.toLowerCase()}. ${gate.explain.split('.')[0]}.`);
    await delay(320);
    qubitCircuit.applyGate(gate.matrix);
    updateCircuitUI();
    const b = qubitCircuit.getBloch();
    const p0 = Math.round(qubitCircuit.prob0() * 100);
    const p1 = Math.round(qubitCircuit.prob1() * 100);
    const explain = `<strong style="color:${gate.color}">Step ${i + 1}: ${gate.name} — ${gate.desc}.</strong> ${gate.explain} <br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${qubitCircuit.getFormula()}</span> — ${p0}% |0⟩, ${p1}% |1⟩.`;
    circuitRunHistory.push({
      theta: b.theta, phi: b.phi, label: String(i + 1), color: gate.color,
      title: `Step ${i + 1}: ${gate.name} — ${qubitCircuit.getFormula()}`, explain
    });
    circuitHistoryCursor = circuitRunHistory.length - 1;
    renderCircuitHistory();
    await delay(130);
    slots[i].classList.remove('running');
    slots[i].style.boxShadow = '';
  }
  circuitRunning = false;
  setCircuitStatus(`Done · ${qubitCircuit.getLabel()}`);
  const p0 = Math.round(qubitCircuit.prob0() * 100);
  const p1 = Math.round(qubitCircuit.prob1() * 100);
  setCircuitExplainer(`Journey complete. After passing through ${circuitGates.map(k => GATES[k].name).join(' → ')}, the qubit arrives at ${qubitCircuit.getFormula()} — a ${p0}% / ${p1}% shot at |0⟩ vs |1⟩ if you measured it right now.`);
}

function renderCircuitHistory() {
  const hist = document.getElementById('circuit-history');
  if (!hist) return;
  if (!circuitRunHistory.length) { hist.innerHTML = '<span class="muted-text">—</span>'; return; }
  hist.innerHTML = '';
  circuitRunHistory.forEach((entry, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hist-tag' + (i === circuitHistoryCursor ? ' is-current' : '');
    chip.style.color = entry.color;
    chip.style.borderColor = entry.color + '44';
    chip.textContent = entry.label;
    chip.title = entry.title;
    chip.addEventListener('click', () => {
      if (circuitRunning) return;
      restoreCircuitHistoryStep(i);
    });
    hist.appendChild(chip);
  });
}

/** Rollback — jumps straight to step `i`'s recorded (theta, phi)
 *  snapshot rather than replaying gates from |0⟩, and restores the
 *  "What's going on" explainer to exactly what it said at that step
 *  (not just the state/formula) — same detailed, gate.explain-based
 *  writeup Run itself shows, not the terse "Checkpoint N of M" line. */
function restoreCircuitHistoryStep(i) {
  const entry = circuitRunHistory[i];
  if (!entry) return;
  circuitHistoryCursor = i;
  qubitCircuit.setState(entry.theta, entry.phi);
  updateCircuitUI();
  renderCircuitHistory();
  setCircuitStatus(`Step ${entry.label} of ${circuitRunHistory.length}`);
  setCircuitExplainer(entry.explain);
}

function clearCircuit() {
  circuitGates = [];
  qubitCircuit = new Qubit();
  buildCircuitSlots();
  updateCircuitUI();
  setCircuitStatus('');
  setCircuitExplainer('Route cleared. Lay down a path by clicking gates above — each one claims the next checkpoint on the wire. Press Run and the qubit walks it from |0⟩ to the end, one stop at a time.');
  circuitRunHistory = [];
  circuitHistoryCursor = -1;
  renderCircuitHistory();
}

function setCircuitExplainer(msg) {
  setExplainer('circuit-explainer', msg);
}

function updateCircuitUI() {
  const b  = qubitCircuit.getBloch();
  const p0 = qubitCircuit.prob0() * 100;
  const p1 = qubitCircuit.prob1() * 100;
  rendererCircuit.animateTo(b.x, b.y, b.z, qubitCircuit.getLabel());
  document.getElementById('bloch-circuit').setAttribute('aria-label',
    `Bloch sphere showing the circuit's output state. State: ${qubitCircuit.getFormula()}.`);
  document.getElementById('label-circuit').textContent = qubitCircuit.getLabel();
  document.getElementById('cfill0').style.width = p0 + '%';
  document.getElementById('cfill1').style.width = p1 + '%';
  document.getElementById('cpct0').textContent  = Math.round(p0) + '%';
  document.getElementById('cpct1').textContent  = Math.round(p1) + '%';
}

function setCircuitStatus(msg) {
  document.getElementById('circuit-status').textContent = msg;
}


// ════════ js/tabs/circuit-multiqubit-tab.js ════════
// Depends on: core/gates.js (GATES), core/qubit.js (blochVectorLabel),
// core/two-qubit.js (TwoQubitState), core/three-qubit.js (ThreeQubitState),
// core/dom-utils.js (setExplainer, renderTryMe, buildGatePalette),
// core/utils.js (delay), app.js state (rendererCircuit2, rendererCircuit3).
//
// The 2-qubit and 3-qubit circuit builders, reachable via the "2 Qubits"/
// "3 Qubits" mode toggle at the top of the Quantum Circuit panel (see
// setCircuitMode() below). Replaces what used to be two separate,
// ~90%-identical files (circuit2-tab.js/circuit3-tab.js) — same gate-entry
// data model (a flat, sequential array of
// {type:'single',qubit,key}/{type:'cnot',control,target} entries), same
// CSS-Grid diagram algorithm, same run/status/explainer pattern — with one
// shared implementation parameterized by a small per-qubit-count config
// (see CIRCUIT2_CONFIG/CIRCUIT3_CONFIG below) instead of copy-pasted code.
// makeMultiQubitCircuit(cfg) returns a plain "instance" object holding the
// mutable per-builder state (gates/targetQubit/state); the functions below
// take that instance as their first argument rather than being methods on
// it, matching this codebase's preference for plain functions over classes
// for UI-glue code (TwoQubitState/ThreeQubitState/BlochRenderer are real
// classes because they carry real invariants — this is just wiring).
//
// The single-qubit circuit (tabs/circuit-tab.js) is NOT part of this —
// it's a genuinely different UI (a linear "checkpoint wire", one Bloch
// sphere, no CNOT, no per-wire targeting), not a smaller copy of this one.
// Folding it in here would mean redesigning its markup to fit this grid-
// diagram shape, not just deduplicating code.

const CIRCUIT_MULTIQUBIT_MAX_STEPS = 10;

const CIRCUIT3_KETS = ['000', '001', '010', '011', '100', '101', '110', '111'];

/** A standard Bell pair, a same-basis flip that needs no entanglement at
 *  all, and an anti-correlated Bell variant (X on the target qubit before
 *  the CNOT flips which pairs show up) — three sequences that each land
 *  on a different, recognizable two-qubit state. */
const CIRCUIT2_PRESETS = [
  { name: 'Bell Pair',       gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'cnot', control: 0, target: 1 }] },
  { name: 'Flip Both',       gates: [{ type: 'single', qubit: 0, key: 'X' }, { type: 'single', qubit: 1, key: 'X' }] },
  { name: 'Anti-Correlated', gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'single', qubit: 1, key: 'X' }, { type: 'cnot', control: 0, target: 1 }] }
];

/** A star-topology GHZ state (one H, then CNOT out to each other qubit),
 *  a plain triple flip needing no entanglement, a Bell pair on just two
 *  of the three wires, and a Half Adder — Q0/Q1 are set to A=1/B=1 (via
 *  X), Toffoli(Q0,Q1,Q2) computes Carry = A·B into Q2 *before* Q1 is
 *  touched again, then CNOT(Q0,Q1) computes Sum = A⊕B into Q1 in place —
 *  the standard reversible-logic trick that fits a full half adder into
 *  exactly 3 qubits (Q0 keeps A unchanged, Q1 ends up holding Sum, Q2
 *  ends up holding Carry). Ends at |101⟩: A=1 (Q0), Sum=0 (Q1), Carry=1
 *  (Q2) — the one input combination where a half adder actually needs
 *  its Carry output. */
const CIRCUIT3_PRESETS = [
  { name: 'GHZ State',        gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'cnot', control: 0, target: 1 }, { type: 'cnot', control: 0, target: 2 }] },
  { name: 'Flip All Three',   gates: [{ type: 'single', qubit: 0, key: 'X' }, { type: 'single', qubit: 1, key: 'X' }, { type: 'single', qubit: 2, key: 'X' }] },
  { name: 'Partial Entangle', gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'cnot', control: 0, target: 1 }] },
  { name: 'Half Adder (A=1,B=1)', gates: [
      { type: 'single', qubit: 0, key: 'X' },
      { type: 'single', qubit: 1, key: 'X' },
      { type: 'toffoli', control1: 0, control2: 1, target: 2 },
      { type: 'cnot', control: 0, target: 1 }
    ] }
];

// ═══════════════════════════════════════════════════════════════════
// PER-QUBIT-COUNT CONFIG
// ═══════════════════════════════════════════════════════════════════
const CIRCUIT2_CONFIG = {
  n: 2,
  prefix: '2q',
  StateClass: TwoQubitState,
  kets: ['00', '01', '10', '11'],
  presets: CIRCUIT2_PRESETS,
  paletteId: 'circuit-2q-palette',
  // 2Q's target-qubit toggle uses a different HTML attribute name than
  // 3Q's (data-target-qubit vs data-target-qubit3, not just a different
  // value) — that's the only thing keeping an unscoped querySelectorAll
  // from matching both panels' buttons at once, so it's config, not a
  // shared constant.
  targetQubitSelector: '.mode-btn[data-target-qubit]',
  targetQubitDatasetKey: 'targetQubit',
  // 2 qubits only have 2 possible CNOT directions, so they get two fixed
  // buttons rather than 3Q's <select> pair (6 possible pairs is too many
  // for individual buttons).
  wireCnotControls(inst) {
    document.getElementById('btn-add-cnot-01').addEventListener('click', () => addGate(inst, { type: 'cnot', control: 0, target: 1 }));
    document.getElementById('btn-add-cnot-10').addEventListener('click', () => addGate(inst, { type: 'cnot', control: 1, target: 0 }));
  },
  startMessage: 'Both qubits start at |00⟩ and step through the sequence in order…',
  clearMessage: 'Two qubits, no entanglement yet. Try adding H to Qubit 0, then CNOT Q0→Q1, then press Run — that\'s the exact recipe behind the Bell state you saw in the Entangle tab, except this time you built it gate by gate.',
  describeOutcome(state) {
    const p00 = state.prob(0), p11 = state.prob(3);
    const entangled = p00 > 0.001 && p11 > 0.001 && state.prob(1) < 0.001 && state.prob(2) < 0.001;
    return entangled
      ? `That's an entangled pair: only |00⟩ (${Math.round(p00 * 100)}%) and |11⟩ (${Math.round(p11 * 100)}%) show up — measuring one qubit instantly tells you the other, exactly like the Entangle tab, except this time H + CNOT built it from scratch.`
      : `Sequence complete. Final state: ${state.getFormula()}.`;
  }
};

const CIRCUIT3_CONFIG = {
  n: 3,
  prefix: '3q',
  StateClass: ThreeQubitState,
  kets: CIRCUIT3_KETS,
  presets: CIRCUIT3_PRESETS,
  paletteId: 'circuit-3q-palette',
  targetQubitSelector: '.mode-btn[data-target-qubit3]',
  targetQubitDatasetKey: 'targetQubit3',
  wireCnotControls(inst) {
    const control = document.getElementById('cnot3-control');
    const target  = document.getElementById('cnot3-target');
    [control, target].forEach(sel => {
      sel.innerHTML = [0, 1, 2].map(q => `<option value="${q}">Qubit ${q}</option>`).join('');
    });
    target.value = '1'; // default control=0, target=1 — a usable pair out of the box
    document.getElementById('btn-add-cnot3').addEventListener('click', () => {
      const c = parseInt(control.value, 10);
      const t = parseInt(target.value, 10);
      if (c === t) { setStatus(inst, 'Control and target must be different qubits'); return; }
      addGate(inst, { type: 'cnot', control: c, target: t });
    });
  },
  // Toffoli (CCNOT) — 3Q-only (needs 3 distinct qubits: 2 controls + 1
  // target, exactly what this builder has), so this is its own config
  // field rather than something CIRCUIT2_CONFIG also defines; guarded by
  // an existence check in makeMultiQubitCircuit() below.
  wireToffoliControls(inst) {
    const control1 = document.getElementById('toffoli3-control1');
    const control2 = document.getElementById('toffoli3-control2');
    const target    = document.getElementById('toffoli3-target');
    [control1, control2, target].forEach(sel => {
      sel.innerHTML = [0, 1, 2].map(q => `<option value="${q}">Qubit ${q}</option>`).join('');
    });
    control2.value = '1'; target.value = '2'; // default controls=0,1 -> target=2, a usable triple out of the box
    document.getElementById('btn-add-toffoli3').addEventListener('click', () => {
      const c1 = parseInt(control1.value, 10);
      const c2 = parseInt(control2.value, 10);
      const t  = parseInt(target.value, 10);
      if (c1 === c2 || c1 === t || c2 === t) { setStatus(inst, 'Controls and target must all be different qubits'); return; }
      addGate(inst, { type: 'toffoli', control1: c1, control2: c2, target: t });
    });
  },
  startMessage: 'All three qubits start at |000⟩ and step through the sequence in order…',
  clearMessage: 'Three qubits, all starting at |000⟩. Try H on Qubit 0, then CNOT Q0→Q1, then CNOT Q0→Q2 — that recipe spreads one qubit\'s coin flip across all three, a three-way GHZ state.',
  describeOutcome(state) {
    const p000 = state.prob(0), p111 = state.prob(7);
    const others = [1, 2, 3, 4, 5, 6].every(i => state.prob(i) < 0.001);
    const ghz = p000 > 0.001 && p111 > 0.001 && others;
    return ghz
      ? `That's a GHZ state: only |000⟩ (${Math.round(p000 * 100)}%) and |111⟩ (${Math.round(p111 * 100)}%) show up — measuring any one of the three qubits instantly tells you all three, a three-way version of the entangled pair from the Entangle tab.`
      : `Sequence complete. Final state: ${state.getFormula()}.`;
  }
};

let circuit2, circuit3; // the two live instances, built by initCircuit2Tab()/initCircuit3Tab()

// ═══════════════════════════════════════════════════════════════════
// INSTANCE FACTORY
// ═══════════════════════════════════════════════════════════════════
function makeMultiQubitCircuit(cfg) {
  const inst = {
    n: cfg.n,
    prefix: cfg.prefix,
    kets: cfg.kets,
    cfg,
    gates: [],
    targetQubit: 0,
    state: new cfg.StateClass(),
    // Run History (rollback) — see runSequence()/renderHistory() below.
    history: [],
    historyCursor: -1,
    running: false
  };

  document.querySelectorAll(cfg.targetQubitSelector).forEach(btn => {
    btn.addEventListener('click', () => {
      inst.targetQubit = parseInt(btn.dataset[cfg.targetQubitDatasetKey], 10);
      document.querySelectorAll(cfg.targetQubitSelector).forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  buildGatePalette(cfg.paletteId, key => addGate(inst, { type: 'single', qubit: inst.targetQubit, key }));
  cfg.wireCnotControls(inst);
  if (cfg.wireToffoliControls) cfg.wireToffoliControls(inst);
  document.getElementById(`btn-run-circuit-${cfg.prefix}`).addEventListener('click', () => runSequence(inst));
  document.getElementById(`btn-clear-circuit-${cfg.prefix}`).addEventListener('click', () => clearSequence(inst));
  renderTryMe(`circuit-${cfg.prefix}-try-me`, cfg.presets, preset => loadPreset(inst, preset));

  renderDiagram(inst);
  updateUI(inst);
  renderHistory(inst);

  return inst;
}

/** 1Q/2Q/3Q panel switch nested inside the Quantum Circuit builder (see
 *  the "Quantum" domain of setCircuitDomain() in circuit-tab.js) — wired
 *  once, from initCircuit2Tab() below, since it isn't specific to either
 *  qubit-count instance. */
function setCircuitMode(mode) {
  document.querySelectorAll('.mode-btn[data-circuit-mode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.circuitMode === mode));
  document.getElementById('circuit-1q-panel').style.display = mode === '1q' ? '' : 'none';
  document.getElementById('circuit-2q-panel').style.display = mode === '2q' ? '' : 'none';
  document.getElementById('circuit-3q-panel').style.display = mode === '3q' ? '' : 'none';
}

function initCircuit2Tab() {
  document.querySelectorAll('.mode-btn[data-circuit-mode]').forEach(btn => {
    btn.addEventListener('click', () => setCircuitMode(btn.dataset.circuitMode));
  });
  circuit2 = makeMultiQubitCircuit(CIRCUIT2_CONFIG);
}

function initCircuit3Tab() {
  circuit3 = makeMultiQubitCircuit(CIRCUIT3_CONFIG);
}

// ═══════════════════════════════════════════════════════════════════
// SHARED LOGIC (operates on whichever instance is passed in)
// ═══════════════════════════════════════════════════════════════════
function entryLabel(entry) {
  if (entry.type === 'cnot') return `CNOT Q${entry.control}→Q${entry.target}`;
  if (entry.type === 'toffoli') return `Toffoli Q${entry.control1},Q${entry.control2}→Q${entry.target}`;
  return `${GATES[entry.key].name} on Q${entry.qubit}`;
}

function addGate(inst, entry) {
  if (inst.gates.length >= CIRCUIT_MULTIQUBIT_MAX_STEPS) {
    setStatus(inst, 'Sequence full — clear to reset');
    return;
  }
  inst.gates.push(entry);
  renderDiagram(inst);
  setStatus(inst, '');
}

function removeGate(inst, i) {
  inst.gates.splice(i, 1);
  renderDiagram(inst);
}

function loadPreset(inst, preset) {
  inst.gates = preset.gates.map(g => ({ ...g }));
  renderDiagram(inst);
  runSequence(inst);
}

/**
 * Renders inst.gates[] as an actual N-wire circuit diagram: one CSS Grid
 * with `inst.n` rows and CIRCUIT_MULTIQUBIT_MAX_STEPS columns. Each
 * gates[] entry owns one column, shared by every row — a CNOT's control
 * dot, target ⊕, and connecting line are separate grid items placed in
 * that same grid-column (their own rows, plus a line spanning between
 * them), which is what makes them line up under each other automatically
 * without any manual pixel math. Columns past inst.gates.length are empty
 * dashed placeholders.
 *
 * inst.n > 2 fills the *other* rows at a single-gate column with empty
 * placeholder cells too (so every column shows a full-height dashed
 * grid); at n=2 it doesn't (the other row gets nothing at that column) —
 * this is a real, pre-existing visual difference between the two
 * diagrams that predates this merge, preserved deliberately rather than
 * "fixed" into one look.
 */
function renderDiagram(inst) {
  const container = document.getElementById(`circuit-${inst.prefix}-diagram`);
  let html = '';

  for (let row = 1; row <= inst.n; row++) {
    html += `<div class="circuit2-ket" style="grid-column:1;grid-row:${row};">|0⟩</div>`;
    html += `<div class="circuit2-wire" style="grid-column:2/-1;grid-row:${row};"></div>`;
  }

  for (let c = 0; c < CIRCUIT_MULTIQUBIT_MAX_STEPS; c++) {
    const col   = c + 2; // grid-column 1 is the |0⟩ label
    const entry = inst.gates[c];

    if (!entry) {
      const isHint = c === 0 && inst.gates.length === 0;
      for (let row = 1; row <= inst.n; row++) {
        html += `<div class="circuit2-cell empty${isHint && row === 1 ? ' circuit2-cell-hint' : ''}" style="grid-column:${col};grid-row:${row};">${isHint && row === 1 ? '+' : ''}</div>`;
      }
      continue;
    }

    if (entry.type === 'single') {
      const g   = GATES[entry.key];
      const row = entry.qubit + 1;
      html += `<button class="circuit2-cell circuit2-gate" data-i="${c}" style="grid-column:${col};grid-row:${row};color:${g.color};border-color:${g.color}" title="${entryLabel(entry)} — click to remove">${g.name}</button>`;
      if (inst.n > 2) {
        for (let row2 = 1; row2 <= inst.n; row2++) {
          if (row2 === row) continue;
          html += `<div class="circuit2-cell empty" style="grid-column:${col};grid-row:${row2};"></div>`;
        }
      }
    } else if (entry.type === 'toffoli') {
      // Two control dots + one ⊕ target, connected by one line spanning
      // all three rows — same building blocks as CNOT below, just one
      // more control dot. Toffoli only exists in the 3Q builder (needs 3
      // distinct qubits), so the three rows always exactly cover 1..n —
      // no "row neither control nor target" placeholder loop needed here.
      const c1Row = entry.control1 + 1;
      const c2Row = entry.control2 + 1;
      const tRow  = entry.target + 1;
      const lineStart = Math.min(c1Row, c2Row, tRow);
      const lineEnd   = Math.max(c1Row, c2Row, tRow) + 1;
      html += `<div class="circuit2-cnot-line" style="grid-column:${col};grid-row:${lineStart}/${lineEnd};"></div>`;
      html += `<button class="circuit2-cell circuit2-cnot-dot" data-i="${c}" style="grid-column:${col};grid-row:${c1Row};" title="${entryLabel(entry)} — click to remove"></button>`;
      html += `<button class="circuit2-cell circuit2-cnot-dot" data-i="${c}" style="grid-column:${col};grid-row:${c2Row};" title="${entryLabel(entry)} — click to remove"></button>`;
      html += `<button class="circuit2-cell circuit2-cnot-target" data-i="${c}" style="grid-column:${col};grid-row:${tRow};" title="${entryLabel(entry)} — click to remove">⊕</button>`;
    } else {
      const controlRow = entry.control + 1;
      const targetRow  = entry.target + 1;
      const lineStart  = Math.min(controlRow, targetRow);
      const lineEnd    = Math.max(controlRow, targetRow) + 1;
      html += `<div class="circuit2-cnot-line" style="grid-column:${col};grid-row:${lineStart}/${lineEnd};"></div>`;
      html += `<button class="circuit2-cell circuit2-cnot-dot" data-i="${c}" style="grid-column:${col};grid-row:${controlRow};" title="${entryLabel(entry)} — click to remove"></button>`;
      html += `<button class="circuit2-cell circuit2-cnot-target" data-i="${c}" style="grid-column:${col};grid-row:${targetRow};" title="${entryLabel(entry)} — click to remove">⊕</button>`;
      // Any row that's neither control nor target gets an empty
      // placeholder too — zero iterations at n=2 (both rows are always
      // control/target at that size), exactly one at n=3.
      for (let row2 = 1; row2 <= inst.n; row2++) {
        if (row2 === controlRow || row2 === targetRow) continue;
        html += `<div class="circuit2-cell empty" style="grid-column:${col};grid-row:${row2};"></div>`;
      }
    }
  }

  container.innerHTML = html;
  container.querySelectorAll('[data-i]').forEach(el => {
    el.addEventListener('click', () => removeGate(inst, parseInt(el.dataset.i, 10)));
  });
}

// CNOT/Toffoli steps have no single GATES entry of their own to borrow a
// color from (they span multiple qubits) — these are just fixed,
// theme-legible colors for their history chips, not tied to any GATES color.
const CNOT_HIST_COLOR    = '#5B8DEF';
const TOFFOLI_HIST_COLOR = '#34D399';

function describeStepColor(entry) {
  if (entry.type === 'cnot') return CNOT_HIST_COLOR;
  if (entry.type === 'toffoli') return TOFFOLI_HIST_COLOR;
  return GATES[entry.key].color;
}

/** The detailed, per-step "What's going on" writeup stored on each Run
 *  History entry (see restoreHistoryStep()) as well as shown live during
 *  Run — same depth as every other gate/circuit explainer in the app,
 *  not just the terse "Step N of M" status line. */
function describeStepExplain(entry, i, formula) {
  const color = describeStepColor(entry);
  if (entry.type === 'cnot') {
    return `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)}.</strong> Flips Q${entry.target}'s bit whenever Q${entry.control} is |1⟩ — the entangling move behind every Bell pair and GHZ state. ` +
      `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`;
  }
  if (entry.type === 'toffoli') {
    return `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)}.</strong> Flips Q${entry.target}'s bit only when BOTH Q${entry.control1} and Q${entry.control2} are |1⟩ — with the target starting at |0⟩, that computes Q${entry.target} = Q${entry.control1} AND Q${entry.control2}, the Carry half of a half adder (a Toffoli is the reversible-logic stand-in for a classical AND gate). ` +
      `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`;
  }
  const gate = GATES[entry.key];
  return `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)} — ${gate.desc}.</strong> ${gate.explain} ` +
    `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`;
}

async function runSequence(inst) {
  if (inst.running) return;
  if (inst.gates.length === 0) {
    setStatus(inst, 'Add gates first');
    return;
  }
  inst.running = true;
  inst.state = new inst.cfg.StateClass();
  setStatus(inst, 'Running…');
  setExplainerFor(inst, inst.cfg.startMessage);
  inst.history = [];
  inst.historyCursor = -1;
  renderHistory(inst);

  for (let i = 0; i < inst.gates.length; i++) {
    const entry = inst.gates[i];
    const stepEls = document.querySelectorAll(`#circuit-${inst.prefix}-diagram [data-i="${i}"]`);
    stepEls.forEach(el => el.classList.add('running'));
    setExplainerFor(inst, `Step ${i + 1} of ${inst.gates.length}: ${entryLabel(entry)}.`);
    await delay(320);
    if (entry.type === 'cnot') {
      inst.state.applyCNOT(entry.control, entry.target);
    } else if (entry.type === 'toffoli') {
      inst.state.applyToffoli(entry.control1, entry.control2, entry.target);
    } else {
      inst.state.applySingleQubitGate(entry.qubit, GATES[entry.key].matrix);
    }
    updateUI(inst);
    inst.history.push({
      amps: inst.state.amps.map(a => ({ ...a })), // cloned — later steps mutate inst.state.amps in place
      label: String(i + 1),
      color: describeStepColor(entry),
      title: `Step ${i + 1}: ${entryLabel(entry)} — ${inst.state.getFormula()}`,
      explain: describeStepExplain(entry, i, inst.state.getFormula())
    });
    inst.historyCursor = inst.history.length - 1;
    renderHistory(inst);
    await delay(130);
    stepEls.forEach(el => el.classList.remove('running'));
  }

  inst.running = false;
  setStatus(inst, 'Done');
  setExplainerFor(inst, inst.cfg.describeOutcome(inst.state));
}

/** Renders inst.history as clickable rollback chips (same .hist-tag/
 *  .is-current pattern as every other Run History / Try Me trail). */
function renderHistory(inst) {
  const hist = document.getElementById(`circuit-${inst.prefix}-history`);
  if (!hist) return;
  if (!inst.history.length) { hist.innerHTML = '<span class="muted-text">—</span>'; return; }
  hist.innerHTML = '';
  inst.history.forEach((entry, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hist-tag' + (i === inst.historyCursor ? ' is-current' : '');
    chip.style.color = entry.color;
    chip.style.borderColor = entry.color + '44';
    chip.textContent = entry.label;
    chip.title = entry.title;
    chip.addEventListener('click', () => {
      if (inst.running) return;
      restoreHistoryStep(inst, i);
    });
    hist.appendChild(chip);
  });
}

/** Rollback — restores step `i`'s cloned amplitude snapshot directly
 *  rather than replaying gates, so it's correct regardless of how
 *  entangled the state became along the way — and restores the "What's
 *  going on" explainer to exactly what it said at that step, not just
 *  the state/formula. */
function restoreHistoryStep(inst, i) {
  const entry = inst.history[i];
  if (!entry) return;
  inst.historyCursor = i;
  inst.state.amps = entry.amps.map(a => ({ ...a }));
  updateUI(inst);
  renderHistory(inst);
  setStatus(inst, `Step ${entry.label} of ${inst.history.length}`);
  setExplainerFor(inst, entry.explain);
}

function clearSequence(inst) {
  inst.gates = [];
  inst.state = new inst.cfg.StateClass();
  renderDiagram(inst);
  updateUI(inst);
  setStatus(inst, '');
  setExplainerFor(inst, inst.cfg.clearMessage);
  inst.history = [];
  inst.historyCursor = -1;
  renderHistory(inst);
}

function setStatus(inst, msg) {
  document.getElementById(`circuit-${inst.prefix}-status`).textContent = msg;
}

function setExplainerFor(inst, msg) {
  setExplainer(`circuit-${inst.prefix}-explainer`, msg);
}

/** Updates the formula line, both/all per-qubit mini Bloch spheres (their
 *  own reduced single-qubit states — see TwoQubitState/
 *  ThreeQubitState.getSingleQubitBloch()), and the full joint-probability
 *  table, generated fresh from inst.kets every call (both circuit-2q-probs
 *  and circuit-3q-probs are empty containers in index.html — 2Q's 4 rows
 *  are just as easy to generate as 3Q's 8, so both go through the same
 *  code instead of 2Q having its own hand-written static markup). */
function updateUI(inst) {
  document.getElementById(`circuit-${inst.prefix}-formula`).textContent = inst.state.getFormula();

  const renderers = inst.n === 2 ? rendererCircuit2 : rendererCircuit3;
  for (let i = 0; i < inst.n; i++) {
    const b = inst.state.getSingleQubitBloch(i);
    const label = blochVectorLabel(b.x, b.y, b.z);
    renderers[i].animateTo(b.x, b.y, b.z, label);
    document.getElementById(`mini-label-${inst.prefix}-${i}`).textContent = label;
  }

  const last = inst.kets.length - 1;
  const container = document.getElementById(`circuit-${inst.prefix}-probs`);
  container.innerHTML = inst.kets.map((ket, i) => {
    const pct       = inst.state.prob(i) * 100;
    const color     = i === 0 ? 'var(--zero)' : i === last ? 'var(--one)' : 'var(--text2)';
    const fillClass = i === 0 ? 'zero-fill'   : i === last ? 'one-fill'   : '';
    const fillStyle = fillClass ? '' : 'background:var(--text2);';
    return `
      <div class="prob-row">
        <span class="ket" style="color:${color}">|${ket}⟩</span>
        <div class="track"><div class="fill ${fillClass}" style="${fillStyle}width:${pct}%" id="c${inst.n}-fill-${ket}"></div></div>
        <span class="pct" id="c${inst.n}-pct-${ket}">${Math.round(pct)}%</span>
      </div>`;
  }).join('');
}


// ════════ js/tabs/classical-circuit-tab.js ════════
// Depends on: core/dom-utils.js (setExplainer).
// The Classical Circuit builder — a half adder assembled by dragging
// gates from the palette into two slots (Sum, Carry), both wired to the
// same two inputs A/B. Not a sequence to walk (contrast the 1-qubit
// quantum circuit's linear "checkpoint wire" in tabs/circuit-tab.js) —
// a half adder needs two simultaneous outputs from one shared pair of
// inputs, which a single wire can't represent. Both outputs recompute
// live from whatever's actually placed in each slot, and nothing forces
// XOR/AND specifically — getting it "wrong" is exactly as informative as
// getting it right, checked against the target truth table on the right.

const CLASSICAL_GATES = {
  NOT:  { name: 'NOT',  inputs: 1, fn: (a) => 1 - a,        desc: 'Flips the single input',
    explain: 'NOT takes one input and flips it — the only gate here that doesn\'t need a second input at all. 0 becomes 1, 1 becomes 0, no exceptions.' },
  AND:  { name: 'AND',  inputs: 2, fn: (a, b) => a & b,     desc: 'Both must be 1',
    explain: 'AND only outputs 1 when every input is 1 — a strict, all-or-nothing gate. One 0 anywhere and the whole thing collapses to 0.' },
  OR:   { name: 'OR',   inputs: 2, fn: (a, b) => a | b,     desc: 'Either can be 1',
    explain: 'OR outputs 1 as soon as at least one input is 1 — the easiest gate to satisfy. Only both inputs being 0 gives a 0.' },
  XOR:  { name: 'XOR',  inputs: 2, fn: (a, b) => a ^ b,     desc: 'Exactly one is 1',
    explain: 'XOR (exclusive OR) outputs 1 only when the inputs disagree — one 0 and one 1. Two matching inputs, either 0,0 or 1,1, give a 0.' },
  NAND: { name: 'NAND', inputs: 2, fn: (a, b) => 1 - (a & b), desc: 'Opposite of AND',
    explain: 'NAND is AND with the output flipped — 0 only when both inputs are 1, and 1 in every other case. It\'s "universal": every other classical gate can be built from NANDs alone.' },
  NOR:  { name: 'NOR',  inputs: 2, fn: (a, b) => 1 - (a | b), desc: 'Opposite of OR',
    explain: 'NOR is OR with the output flipped — 1 only when both inputs are 0, and 0 as soon as either input is 1.' },
  XNOR: { name: 'XNOR', inputs: 2, fn: (a, b) => 1 - (a ^ b), desc: 'Opposite of XOR',
    explain: 'XNOR is XOR with the output flipped — 1 when the inputs agree (0,0 or 1,1), 0 when they differ. It\'s a literal equality check.' }
};

// ─── GATE SYMBOLS ───────────────────────────────────────────────────────
// Standard schematic shapes (AND's D-shape, OR/XOR's curved shield — XOR
// gets an extra back line — NOT's triangle+bubble; the N-prefixed
// negations reuse their un-negated body plus an output bubble), not
// letters, so the palette and the drop slots both read as real logic-gate
// symbols. Monochrome (currentColor) on purpose — real schematics don't
// color-code gates, unlike this app's quantum gates elsewhere.
const CLASSICAL_GATE_SHAPES = {
  NOT:  { body: 'not', bubble: true }, // the bubble is intrinsic to NOT's own symbol, not an "added negation" like N*-family gates below
  AND:  { body: 'and' },
  NAND: { body: 'and', bubble: true },
  OR:   { body: 'or' },
  NOR:  { body: 'or', bubble: true },
  XOR:  { body: 'xor' },
  XNOR: { body: 'xor', bubble: true }
};

/** Builds one gate's schematic symbol markup, in its native 64×40 box —
 *  input line(s) at local y=13/27 (2-input) or y=20 (NOT), the body path,
 *  an optional negation bubble, and an output line ending at local x=64.
 *  Split out from classicalGateIconSVG() so the big multi-gate circuit
 *  diagram (renderCircuitDiagram()) can embed the same markup as a <g> at
 *  each row's position, instead of only ever appearing inside its own
 *  standalone <svg>. */
function classicalGateInnerSVG(key) {
  const shape     = CLASSICAL_GATE_SHAPES[key].body;
  const hasBubble = !!CLASSICAL_GATE_SHAPES[key].bubble;
  const twoInput  = shape !== 'not';

  let body, tipX, backX;
  if (shape === 'not') {
    body  = '<path d="M16,6 L16,34 L44,20 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    tipX  = 44; backX = 16;
  } else if (shape === 'and') {
    body  = '<path d="M16,6 H32 A14,14 0 0 1 32,34 H16 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    tipX  = 46; backX = 16;
  } else {
    // OR/XOR: a curved "shield" — concave back, pointed front.
    body  = '<path d="M18,7 C28,7 40,10 50,20 C40,30 28,33 18,33 C24,26 24,14 18,7 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    if (shape === 'xor') {
      body += '<path d="M12,7 C18,14 18,26 12,33" fill="none" stroke="currentColor" stroke-width="2"/>';
    }
    tipX  = 50; backX = 18;
  }

  let outX = tipX, bubble = '';
  if (hasBubble) {
    bubble = `<circle cx="${tipX + 4}" cy="20" r="4" fill="none" stroke="currentColor" stroke-width="2"/>`;
    outX   = tipX + 8;
  }

  const inputs = twoInput
    ? `<line x1="0" y1="13" x2="${backX}" y2="13" stroke="currentColor" stroke-width="2"/>
       <line x1="0" y1="27" x2="${backX}" y2="27" stroke="currentColor" stroke-width="2"/>`
    : `<line x1="0" y1="20" x2="${backX}" y2="20" stroke="currentColor" stroke-width="2"/>`;

  const outputLine = `<line x1="${outX}" y1="20" x2="64" y2="20" stroke="currentColor" stroke-width="2"/>`;

  return `${inputs}${body}${bubble}${outputLine}`;
}

/** Renders one gate's schematic symbol as a standalone inline SVG string —
 *  shared by the Classical Gates tab's palette (classical-gates-tab.js,
 *  reusing this the same way it already reuses CLASSICAL_GATES) and this
 *  tab's own palette buttons. */
function classicalGateIconSVG(key) {
  return `<svg viewBox="0 0 64 40" class="classical-gate-icon" aria-hidden="true">${classicalGateInnerSVG(key)}</svg>`;
}

// ═══════════════════════════════════════════════════════════════════
// HALF ADDER CIRCUIT (drag-and-drop, unlimited gates, real wired diagram)
// ═══════════════════════════════════════════════════════════════════
// haGates holds every gate that's been added, in order — each becomes
// its own row in the diagram, wired to the shared A/B rails by real branch
// lines (see renderCircuitDiagram()), not clamped to exactly a Sum slot and
// a Carry slot. A correct half adder is just the recognizable case where an
// XOR row and an AND row both exist somewhere in the list — everything
// else (extra gates, missing ones, duplicates) is equally buildable and
// equally explained, checked against the fixed target truth table.
let halfAdderA = 0, halfAdderB = 0;
let haGates  = []; // [{ key }] — one entry per row, in the order added
let armedGateKey  = null; // set by clicking (not dragging) a palette button — placed on the next diagram click

// ─── circuit diagram geometry (all in SVG user units) ───
const HA_SVG_WIDTH   = 280;
const HA_ROW_HEIGHT  = 56;
const HA_TOP_PAD     = 20;
const HA_BOTTOM_PAD  = 18;
const HA_BUS_A_X     = 26;
const HA_BUS_B_X     = 42;
const HA_GATE_X      = 74; // local x=0 of the embedded 64x40 gate icon

function initClassicalCircuitTab() {
  buildClassicalGatePalette();
  initHalfAdderCircuit();

  document.getElementById('ha-input-a').addEventListener('change', e => {
    halfAdderA = e.target.checked ? 1 : 0;
    updateHalfAdder();
  });
  document.getElementById('ha-input-b').addEventListener('change', e => {
    halfAdderB = e.target.checked ? 1 : 0;
    updateHalfAdder();
  });
  document.getElementById('btn-clear-halfadder').addEventListener('click', () => {
    haGates = [];
    updateHalfAdder();
  });

  updateHalfAdder();
  renderHalfAdderCompareDiagrams();
}

function buildClassicalGatePalette() {
  const palette = document.getElementById('classical-gate-palette');
  Object.entries(CLASSICAL_GATES).forEach(([key, gate]) => {
    const btn = document.createElement('button');
    btn.className  = 'circuit-gate-btn classical-gate-palette-btn';
    btn.innerHTML  = `${classicalGateIconSVG(key)}<span class="circuit-gate-btn-label">${gate.name}</span>`;
    btn.title      = gate.desc;
    btn.draggable  = true;
    btn.dataset.gateKey = key;

    btn.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', key);
      e.dataTransfer.effectAllowed = 'copy';
    });

    // Click-to-arm — a drag-free fallback (touch/keyboard-friendly):
    // click a gate to arm it (outlined), then click the circuit board to
    // add it as a new row. Clicking the same gate again un-arms it.
    btn.addEventListener('click', () => {
      const wasArmed = armedGateKey === key;
      document.querySelectorAll('#classical-gate-palette .circuit-gate-btn').forEach(b => b.classList.remove('is-armed'));
      armedGateKey = wasArmed ? null : key;
      if (armedGateKey) btn.classList.add('is-armed');
    });

    palette.appendChild(btn);
  });
}

function initHalfAdderCircuit() {
  const drop = document.getElementById('halfadder-circuit-drop');

  drop.addEventListener('dragover', e => {
    e.preventDefault(); // required for 'drop' to fire at all
    e.dataTransfer.dropEffect = 'copy';
    drop.classList.add('drag-over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('drag-over');
    addHalfAdderGate(e.dataTransfer.getData('text/plain'));
  });

  drop.addEventListener('click', e => {
    // A click on an existing row's remove target takes priority over
    // "place the armed gate" — see the data-row-index overlay rendered
    // per row in renderCircuitDiagram().
    const rowEl = e.target.closest('[data-row-index]');
    if (rowEl) {
      removeHalfAdderGate(parseInt(rowEl.dataset.rowIndex, 10));
      return;
    }
    if (armedGateKey) {
      addHalfAdderGate(armedGateKey);
      armedGateKey = null;
      document.querySelectorAll('#classical-gate-palette .circuit-gate-btn').forEach(b => b.classList.remove('is-armed'));
    }
  });
  // Enter/Space activates the board the same as a click — it has
  // tabindex="0"/role="button" in index.html but no native activation.
  drop.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drop.click(); }
  });
}

/** Appends `key` (a CLASSICAL_GATES key) as a new row. Only 2-input gates
 *  make sense here — every row reads the same two rails, A and B — so
 *  NOT is rejected with an explainer message rather than silently
 *  accepted. */
function addHalfAdderGate(key) {
  if (!key) return;
  if (CLASSICAL_GATES[key].inputs !== 2) {
    setExplainer('halfadder-explainer',
      `${CLASSICAL_GATES[key].name} only takes one input — this circuit's rows each need a gate that reads both A and B (AND, OR, XOR, NAND, NOR, or XNOR).`);
    flashHalfAdderRejected();
    return;
  }
  haGates.push({ key });
  updateHalfAdder();
}

/** A drag/click that lands on the board but gets rejected (currently just
 *  a 1-input gate — see addHalfAdderGate() above) still needs to *look*
 *  like something happened right where the user was looking, not just in
 *  the explainer text below the palette — otherwise it reads as the drop
 *  simply not working. Restarts the CSS animation on repeat rejects by
 *  toggling the class off and forcing a reflow before re-adding it. */
function flashHalfAdderRejected() {
  const drop = document.getElementById('halfadder-circuit-drop');
  drop.classList.remove('drop-rejected');
  void drop.offsetWidth;
  drop.classList.add('drop-rejected');
  setTimeout(() => drop.classList.remove('drop-rejected'), 500);
}

function removeHalfAdderGate(index) {
  haGates.splice(index, 1);
  updateHalfAdder();
}

function updateHalfAdder() {
  document.getElementById('ha-lbl-a0').classList.toggle('active', halfAdderA === 0);
  document.getElementById('ha-lbl-a1').classList.toggle('active', halfAdderA === 1);
  document.getElementById('ha-lbl-b0').classList.toggle('active', halfAdderB === 0);
  document.getElementById('ha-lbl-b1').classList.toggle('active', halfAdderB === 1);

  renderCircuitDiagram();
  setExplainer('halfadder-explainer', describeHalfAdderState());
  renderHalfAdderTruthTable();
  renderHalfAdderCompareTable();

  const hasXor = haGates.some(g => g.key === 'XOR');
  const hasAnd = haGates.some(g => g.key === 'AND');
  const status = document.getElementById('halfadder-status');
  status.textContent = haGates.length === 0 ? ''
    : (hasXor && hasAnd) ? '✓ half adder present' : `${haGates.length} gate${haGates.length === 1 ? '' : 's'}`;
  status.style.color = (hasXor && hasAnd) ? 'var(--success)' : 'var(--text3)';
}

/** Builds the full circuit <svg> — two vertical rails (A, B) running down
 *  the left side, one row per placed gate branching off them via short
 *  horizontal stubs into the gate's two inputs, and the live output value
 *  labeled to the right of each gate (auto-named "Sum" for XOR, "Carry"
 *  for AND, or its own gate name otherwise). Each row sits behind an
 *  invisible clickable overlay (data-row-index) so clicking a row removes
 *  it — handled by the single delegated listener in initHalfAdderCircuit(). */
function renderCircuitDiagram() {
  const svg = document.getElementById('halfadder-circuit-svg');
  const n = haGates.length;

  if (n === 0) {
    svg.setAttribute('viewBox', `0 0 ${HA_SVG_WIDTH} 100`);
    svg.setAttribute('aria-label', 'Half adder circuit diagram, currently empty.');
    svg.innerHTML = `
      <rect x="10" y="10" width="${HA_SVG_WIDTH - 20}" height="80" rx="10" fill="none" stroke="var(--border2)" stroke-width="2" stroke-dasharray="6,5"/>
      <text x="${HA_SVG_WIDTH / 2}" y="46" text-anchor="middle" fill="var(--text3)" font-size="13" font-family="'JetBrains Mono', monospace">+</text>
      <text x="${HA_SVG_WIDTH / 2}" y="66" text-anchor="middle" fill="var(--text3)" font-size="10" font-family="'JetBrains Mono', monospace">drag a gate here</text>`;
    return;
  }

  const lastTapA = HA_TOP_PAD + (n - 1) * HA_ROW_HEIGHT + 13;
  const lastTapB = HA_TOP_PAD + (n - 1) * HA_ROW_HEIGHT + 27;
  const height   = HA_TOP_PAD + n * HA_ROW_HEIGHT + HA_BOTTOM_PAD;

  svg.setAttribute('viewBox', `0 0 ${HA_SVG_WIDTH} ${height}`);
  svg.setAttribute('aria-label', `Half adder circuit diagram with ${n} gate${n === 1 ? '' : 's'}.`);

  let markup = `
    <text x="${HA_BUS_A_X}" y="${HA_TOP_PAD - 8}" text-anchor="middle" fill="var(--zero)" font-size="11" font-weight="700" font-family="'JetBrains Mono', monospace">A=${halfAdderA}</text>
    <text x="${HA_BUS_B_X + 6}" y="${HA_TOP_PAD - 8}" text-anchor="middle" fill="var(--one)" font-size="11" font-weight="700" font-family="'JetBrains Mono', monospace">B=${halfAdderB}</text>
    <line x1="${HA_BUS_A_X}" y1="${HA_TOP_PAD}" x2="${HA_BUS_A_X}" y2="${lastTapA}" stroke="var(--zero)" stroke-width="2"/>
    <line x1="${HA_BUS_B_X}" y1="${HA_TOP_PAD}" x2="${HA_BUS_B_X}" y2="${lastTapB}" stroke="var(--one)" stroke-width="2"/>`;

  haGates.forEach((g, i) => {
    const rowY   = HA_TOP_PAD + i * HA_ROW_HEIGHT;
    const tapAY  = rowY + 13;
    const tapBY  = rowY + 27;
    const value  = CLASSICAL_GATES[g.key].fn(halfAdderA, halfAdderB);
    const label  = g.key === 'XOR' ? t('circuits.sum', 'Sum') : g.key === 'AND' ? t('circuits.carry', 'Carry') : CLASSICAL_GATES[g.key].name;
    const outX   = HA_GATE_X + 64 + 10;

    markup += `
      <line x1="${HA_BUS_A_X}" y1="${tapAY}" x2="${HA_GATE_X}" y2="${tapAY}" stroke="var(--zero)" stroke-width="2"/>
      <line x1="${HA_BUS_B_X}" y1="${tapBY}" x2="${HA_GATE_X}" y2="${tapBY}" stroke="var(--one)" stroke-width="2"/>
      <g transform="translate(${HA_GATE_X},${rowY})">${classicalGateInnerSVG(g.key)}</g>
      <text x="${outX}" y="${rowY + 24}" fill="${value ? 'var(--zero)' : 'var(--text3)'}" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">→ ${label} = ${value}</text>
      <rect data-row-index="${i}" x="0" y="${rowY}" width="${HA_SVG_WIDTH}" height="40" fill="transparent" style="cursor:pointer;">
        <title>${CLASSICAL_GATES[g.key].name} — click to remove</title>
      </rect>`;
  });

  svg.innerHTML = markup;
}

/** Narrates the current build state — empty, partial (no gates yet, or
 *  present but neither XOR nor AND), correct, or a circuit with other
 *  gates mixed in — rather than just reporting numbers, so a student
 *  dragging the "wrong" gate still gets a useful explanation of what
 *  happened instead of just a mismatched digit. */
function describeHalfAdderState() {
  if (haGates.length === 0) {
    return 'Drag a gate — or click one, then click the circuit board — to add it as a new row, wired to A and B automatically. A half adder needs one row computing Sum = A⊕B (XOR) and another computing Carry = A·B (AND), from the exact same two inputs.';
  }
  const hasXor = haGates.some(g => g.key === 'XOR');
  const hasAnd = haGates.some(g => g.key === 'AND');
  const sum   = hasXor ? CLASSICAL_GATES.XOR.fn(halfAdderA, halfAdderB) : null;
  const carry = hasAnd ? CLASSICAL_GATES.AND.fn(halfAdderA, halfAdderB) : null;

  if (hasXor && hasAnd) {
    const extra = haGates.length > 2 ? ` (plus ${haGates.length - 2} extra gate${haGates.length - 2 === 1 ? '' : 's'} — harmless, but not needed)` : '';
    return `<strong style="color:var(--success)">That's a correct half adder.</strong> A=${halfAdderA}, B=${halfAdderB} → Sum = ${sum}, Carry = ${carry}${extra}. XOR catches the bit-by-bit total, AND catches the overflow — together they're the two gates every full adder is built from.`;
  }
  if (!hasXor && !hasAnd) {
    return `A=${halfAdderA}, B=${halfAdderB} — ${haGates.length} gate${haGates.length === 1 ? '' : 's'} placed, but none of them are XOR or AND yet. Compare against the target truth table on the right: a true half adder needs an XOR row (for Sum) and an AND row (for Carry).`;
  }
  return `A=${halfAdderA}, B=${halfAdderB} — you've got ${hasXor ? 'the XOR (Sum)' : 'the AND (Carry)'} row, but still need ${hasXor ? 'an AND row for Carry' : 'an XOR row for Sum'} to complete the half adder.`;
}

function renderHalfAdderTruthTable() {
  const table = document.getElementById('ha-truth-table');
  if (!table) return;
  const rows = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => ({ a, b, sum: a ^ b, carry: a & b }));
  const header = `<tr><th>A</th><th>B</th><th>${t('circuits.sum', 'Sum')}</th><th>${t('circuits.carry', 'Carry')}</th></tr>`;
  table.innerHTML = header + rows.map(r => {
    const active = r.a === halfAdderA && r.b === halfAdderB;
    return `<tr class="${active ? 'truth-row-active' : ''}"><td>${r.a}</td><td>${r.b}</td><td>${r.sum}</td><td>${r.carry}</td></tr>`;
  }).join('');
}

/** The third table on this page (see index.html) — same four A,B rows as
 *  renderHalfAdderTruthTable() above, but with both a "classical" pair of
 *  columns (AND/XOR, as built in this panel) and a "quantum" pair (what
 *  the Quantum Circuit panel's 3-qubit Half Adder preset computes via X +
 *  Toffoli + CNOT). The numbers are identical by construction — a Toffoli
 *  reversibly computes the same AND, a CNOT the same XOR — which is the
 *  point being illustrated: two different physical mechanisms landing on
 *  the exact same truth table. */
function renderHalfAdderCompareTable() {
  const table = document.getElementById('ha-compare-table');
  if (!table) return;
  const rows = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => ({ a, b, sum: a ^ b, carry: a & b }));
  const header = `<tr><th>A</th><th>B</th>` +
    `<th>${t('circuits.sumClassical', 'Sum (Classical)')}</th><th>${t('circuits.carryClassical', 'Carry (Classical)')}</th>` +
    `<th>${t('circuits.sumQuantum', 'Sum (Quantum)')}</th><th>${t('circuits.carryQuantum', 'Carry (Quantum)')}</th></tr>`;
  table.innerHTML = header + rows.map(r => {
    const active = r.a === halfAdderA && r.b === halfAdderB;
    return `<tr class="${active ? 'truth-row-active' : ''}"><td>${r.a}</td><td>${r.b}</td>` +
      `<td>${r.sum}</td><td>${r.carry}</td><td>${r.sum}</td><td>${r.carry}</td></tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════
// COMPARE PANEL DIAGRAMS (fixed reference circuits, drawn once)
// ═══════════════════════════════════════════════════════════════════
// Unlike everything above, these two diagrams don't track any live state
// (haGates, halfAdderA/B) — they're the answer key, not the workspace, so
// they're rendered once at init and never touched again. A simple SVG
// "meter" glyph for the quantum diagram's two measurement steps, since
// nothing else in this app draws a measurement box yet.
const HA_METER_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path d="M4 18a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="2"/>
  <line x1="12" y1="18" x2="17" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="18" r="1.6" fill="currentColor"/>
</svg>`;

function renderHalfAdderCompareDiagrams() {
  renderCompareClassicalDiagram();
  renderCompareQuantumDiagram();
}

/** A fixed two-row gate-level schematic — A and B rails branch into an
 *  XOR row (Sum) and an AND row (Carry) — reusing classicalGateInnerSVG()
 *  so the symbols match the drag-and-drop builder's palette exactly, just
 *  laid out as the one canonical answer instead of whatever's been
 *  dragged in. */
function renderCompareClassicalDiagram() {
  const svg = document.getElementById('ha-compare-classical-svg');
  if (!svg) return;

  const rows      = [{ key: 'XOR', label: 'Sum' }, { key: 'AND', label: 'Carry' }];
  const busAX     = 20, busBX = 34, gateX = 56;
  const topPad    = 20, rowHeight = 56;
  const lastTapA  = topPad + (rows.length - 1) * rowHeight + 13;
  const lastTapB  = topPad + (rows.length - 1) * rowHeight + 27;

  let markup = `
    <text x="${busAX}" y="${topPad - 8}" text-anchor="middle" fill="var(--zero)" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">A</text>
    <text x="${busBX + 6}" y="${topPad - 8}" text-anchor="middle" fill="var(--one)" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">B</text>
    <line x1="${busAX}" y1="${topPad}" x2="${busAX}" y2="${lastTapA}" stroke="var(--zero)" stroke-width="2"/>
    <line x1="${busBX}" y1="${topPad}" x2="${busBX}" y2="${lastTapB}" stroke="var(--one)" stroke-width="2"/>`;

  rows.forEach((row, i) => {
    const rowY  = topPad + i * rowHeight;
    const tapAY = rowY + 13;
    const tapBY = rowY + 27;
    const outX  = gateX + 64 + 10;
    markup += `
      <line x1="${busAX}" y1="${tapAY}" x2="${gateX}" y2="${tapAY}" stroke="var(--zero)" stroke-width="2"/>
      <line x1="${busBX}" y1="${tapBY}" x2="${gateX}" y2="${tapBY}" stroke="var(--one)" stroke-width="2"/>
      <g transform="translate(${gateX},${rowY})">${classicalGateInnerSVG(row.key)}</g>
      <text x="${outX}" y="${rowY + 24}" fill="var(--text)" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">→ ${row.label}</text>`;
  });

  svg.innerHTML = markup;
}

/** A fixed 4-qubit circuit diagram, shown for A=1,B=1 — q0/q1 get X'd to
 *  hold A/B, two CNOTs copy their XOR into ancilla q2 (Sum), a Toffoli
 *  copies their AND into ancilla q3 (Carry), then both ancillas are
 *  measured out onto a 2-bit classical register. Built from the same
 *  .circuit2-* grid classes the 2Q/3Q circuit builders use (see
 *  renderDiagram() in circuit-multiqubit-tab.js) so it reads as the same
 *  kind of diagram as the rest of the app, plus three diagram-only
 *  additions this static reference needs but the interactive builders
 *  don't: a measurement box (.ha-meter), its dashed drop to the classical
 *  register (.ha-meter-drop), and the doubled classical wire itself
 *  (.ha-classical-wire) — see css/tabs/circuit.css. Plain <div>s, not
 *  <button>s — nothing here is clickable, it's the answer key. */
function renderCompareQuantumDiagram() {
  const container = document.getElementById('ha-compare-quantum-diagram');
  if (!container) return;

  let html = '';
  for (let row = 1; row <= 4; row++) {
    html += `<div class="circuit2-ket" style="grid-column:1;grid-row:${row};">|0⟩</div>`;
    html += `<div class="circuit2-wire" style="grid-column:2/-1;grid-row:${row};"></div>`;
  }
  html += `<div class="circuit2-ket" style="grid-column:1;grid-row:5;">c⫽2</div>`;
  html += `<div class="ha-classical-wire" style="grid-column:2/-1;grid-row:5;"></div>`;

  // Column 2 — X gates set q0 = A, q1 = B (this diagram shows A=1, B=1).
  html += `<div class="circuit2-cell circuit2-gate" style="grid-column:2;grid-row:1;color:${GATES.X.color};border-color:${GATES.X.color};" title="X — sets q0 = A">X</div>`;
  html += `<div class="circuit2-cell circuit2-gate" style="grid-column:2;grid-row:2;color:${GATES.X.color};border-color:${GATES.X.color};" title="X — sets q1 = B">X</div>`;

  // Column 3 — CNOT q0→q2 (first half of Sum = A⊕B into the ancilla).
  html += `<div class="circuit2-cnot-line" style="grid-column:3;grid-row:1/4;"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-dot" style="grid-column:3;grid-row:1;" title="CNOT q0→q2"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-target" style="grid-column:3;grid-row:3;" title="CNOT q0→q2">⊕</div>`;

  // Column 4 — CNOT q1→q2 (second half of Sum; q2 now holds A⊕B).
  html += `<div class="circuit2-cnot-line" style="grid-column:4;grid-row:2/4;"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-dot" style="grid-column:4;grid-row:2;" title="CNOT q1→q2"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-target" style="grid-column:4;grid-row:3;" title="CNOT q1→q2">⊕</div>`;

  // Column 5 — Toffoli q0,q1→q3 (q3 now holds Carry = A·B).
  html += `<div class="circuit2-cnot-line" style="grid-column:5;grid-row:1/5;"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-dot" style="grid-column:5;grid-row:1;" title="Toffoli q0,q1→q3"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-dot" style="grid-column:5;grid-row:2;" title="Toffoli q0,q1→q3"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-target" style="grid-column:5;grid-row:4;" title="Toffoli q0,q1→q3">⊕</div>`;

  // Column 6 — measure q2 (Sum) onto classical bit 0.
  html += `<div class="ha-meter-drop" style="grid-column:6;grid-row:3/6;"></div>`;
  html += `<div class="circuit2-cell ha-meter" style="grid-column:6;grid-row:3;" title="Measure q2 (Sum) → bit 0">${HA_METER_ICON}</div>`;
  html += `<div class="ha-meter-label" style="grid-column:6;grid-row:5;">0</div>`;

  // Column 7 — measure q3 (Carry) onto classical bit 1.
  html += `<div class="ha-meter-drop" style="grid-column:7;grid-row:4/6;"></div>`;
  html += `<div class="circuit2-cell ha-meter" style="grid-column:7;grid-row:4;" title="Measure q3 (Carry) → bit 1">${HA_METER_ICON}</div>`;
  html += `<div class="ha-meter-label" style="grid-column:7;grid-row:5;">1</div>`;

  container.innerHTML = html;
}


// ════════ js/tabs/classical-gates-tab.js ════════
// Depends on: tabs/classical-circuit-tab.js (CLASSICAL_GATES),
// core/dom-utils.js (setExplainer).
// The Gates tab's classical counterpart, reachable via its own
// Classical/Quantum domain toggle (see setGatesDomain() in gates-tab.js).
// Pick ONE gate and see its immediate effect — the same single-gate
// paradigm the quantum side of this tab already uses (apply one gate,
// read the result), as opposed to Circuits' build-a-sequence paradigm.
// Reuses CLASSICAL_GATES rather than redefining the gate table — script
// load order doesn't matter here since this only reads it from inside a
// function body, called after every script has already run.

let gatesClassicalGate = 'AND';
let gcInputA = 1;
let gcInputB = 1;

function initClassicalGatesTab() {
  buildClassicalGatesPalette();
  document.getElementById('gc-input-a').addEventListener('change', e => {
    gcInputA = e.target.checked ? 1 : 0;
    updateClassicalGatesUI();
  });
  document.getElementById('gc-input-b').addEventListener('change', e => {
    gcInputB = e.target.checked ? 1 : 0;
    updateClassicalGatesUI();
  });
  updateClassicalGatesUI();
}

function buildClassicalGatesPalette() {
  const palette = document.getElementById('gc-gate-palette');
  Object.entries(CLASSICAL_GATES).forEach(([key, gate]) => {
    const btn = document.createElement('button');
    btn.className    = 'circuit-gate-btn classical-gate-btn classical-gate-palette-btn';
    btn.innerHTML    = `${classicalGateIconSVG(key)}<span class="circuit-gate-btn-label">${gate.name}</span>`;
    btn.title        = gate.desc;
    btn.dataset.gate = key;
    btn.addEventListener('click', () => selectClassicalGatesGate(key));
    palette.appendChild(btn);
  });
  updateClassicalGatesPaletteActive();
}

function updateClassicalGatesPaletteActive() {
  document.querySelectorAll('#gc-gate-palette .classical-gate-btn').forEach(btn =>
    btn.classList.toggle('active-gate', btn.dataset.gate === gatesClassicalGate));
}

function selectClassicalGatesGate(key) {
  gatesClassicalGate = key;
  updateClassicalGatesPaletteActive();
  // NOT only ever reads input A — hide B rather than leave a switch on
  // screen that does nothing, same convention as the Circuits classical
  // builder.
  document.getElementById('gc-input-b-wrap').style.display = CLASSICAL_GATES[key].inputs === 1 ? 'none' : '';
  updateClassicalGatesUI();
}

function updateClassicalGatesUI() {
  const gate = CLASSICAL_GATES[gatesClassicalGate];
  const out  = gate.inputs === 1 ? gate.fn(gcInputA) : gate.fn(gcInputA, gcInputB);

  document.getElementById('gc-lbl-a0').classList.toggle('active', gcInputA === 0);
  document.getElementById('gc-lbl-a1').classList.toggle('active', gcInputA === 1);
  document.getElementById('gc-lbl-b0').classList.toggle('active', gcInputB === 0);
  document.getElementById('gc-lbl-b1').classList.toggle('active', gcInputB === 1);

  const display = document.getElementById('gc-output-display');
  display.textContent = out;
  display.classList.toggle('is-zero', out === 0);
  document.getElementById('gc-output-label').textContent =
    gate.inputs === 1 ? 'NOT A' : `A ${gate.name} B`;

  renderClassicalGatesTruthTable();
  setExplainer('gc-explainer', gate.explain);
}

function renderClassicalGatesTruthTable() {
  const gate  = CLASSICAL_GATES[gatesClassicalGate];
  const table = document.getElementById('gc-truth-table');
  const rows  = gate.inputs === 1
    ? [0, 1].map(a => ({ a, out: gate.fn(a) }))
    : [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => ({ a, b, out: gate.fn(a, b) }));

  const headCells = gate.inputs === 1 ? '<th>A</th>' : '<th>A</th><th>B</th>';
  let html = `<tr>${headCells}<th>Out</th></tr>`;
  html += rows.map(r => {
    const isCurrent = gate.inputs === 1
      ? r.a === gcInputA
      : r.a === gcInputA && r.b === gcInputB;
    const cells = gate.inputs === 1 ? `<td>${r.a}</td>` : `<td>${r.a}</td><td>${r.b}</td>`;
    return `<tr class="${isCurrent ? 'truth-row-active' : ''}">${cells}<td>${r.out}</td></tr>`;
  }).join('');

  table.innerHTML = html;
}

/** All-gates-at-once variant of renderClassicalGatesTruthTable() above —
 *  every CLASSICAL_GATES entry's full truth table, one after another,
 *  rather than just the currently-selected gate's. Built for the Gates
 *  tab's Compare panel (item 14), called once from gates-tab.js's
 *  buildGateButtons() plus again on every language change (the header
 *  cells go through t()). */
function buildAllClassicalGatesTruthTables(targetId) {
  const table = document.getElementById(targetId);
  if (!table) return;
  const rows = [];
  Object.entries(CLASSICAL_GATES).forEach(([key, gate]) => {
    const combos = gate.inputs === 1 ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
    combos.forEach(inputs => {
      const out = gate.inputs === 1 ? gate.fn(inputs[0]) : gate.fn(inputs[0], inputs[1]);
      rows.push({ name: gate.name, inputs: inputs.join(', '), out });
    });
  });
  table.innerHTML = `<tr><th>${t('common.gate', 'Gate')}</th><th>${t('common.input', 'Input')}</th><th>${t('common.output', 'Output')}</th></tr>` +
    rows.map(r => `<tr><td style="font-weight:700;">${r.name}</td><td>${r.inputs}</td><td>${r.out}</td></tr>`).join('');
}


// ════════ js/tabs/measure-tab.js ════════
// Depends on: core/dom-utils.js (setExplainer, drawCoin, animateCoinFlip —
// the coin is shared with tabs/entanglement-tab.js), core/theme.js
// (onThemeChange), core/tab-registry.js (registerTab), app.js state
// (qubitMeasure, measureCounts, measureCoinState, measureCoinAnimating).

// ═══════════════════════════════════════════════════════════════════
// MEASURE TAB
// ═══════════════════════════════════════════════════════════════════
function initMeasureTab() {
  document.getElementById('btn-measure').addEventListener('click', doMeasure);
  document.getElementById('btn-reset-stats').addEventListener('click', resetStats);
  document.querySelectorAll('#tab-measure .preset-btn').forEach(btn => {
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => setMeasureState(theta, phi));
  });
  document.querySelectorAll('[data-measure-n]').forEach(btn => {
    const n = parseInt(btn.dataset.measureN, 10);
    btn.addEventListener('click', () => measureMany(n));
  });

  const redrawCoin = () => drawCoin('coin-measure', measureCoinState);
  drawCoin('coin-measure', measureCoinState);
  // Same two reasons as the Entangle tab's own coins: a redraw is needed
  // both on re-entering this tab and on a theme change, since draw()
  // always reads the live isDark/coin state.
  registerTab('measure', { onEnter: redrawCoin });
  onThemeChange(redrawCoin);
}

const MEASURE_OPENERS = [
  'The universe rolled its dice —',
  'No more hedging —',
  'The coin finally landed —',
  'Asked, and answered —',
  'The blur snapped into focus —'
];

function setMeasureState(theta, phi) {
  qubitMeasure.setState(theta, phi);
  measureCounts = { 0: 0, 1: 0 };
  resetStats(); // also resets the coin to superposition — see resetStats() below
  updateMeasureUI();
  setExplainer('measure-explainer', 'Right now the qubit hasn\'t committed to anything — it genuinely holds both |0⟩ and |1⟩ at once, weighted by the bars on the left. Hit MEASURE and you\'re forcing it to answer a yes/no question it was actively avoiding.');
}

function updateMeasureUI() {
  const p0 = qubitMeasure.prob0() * 100;
  const p1 = qubitMeasure.prob1() * 100;
  document.getElementById('formula-measure').textContent = qubitMeasure.getFormula();
  document.getElementById('vbar0').style.height = p0 + '%';
  document.getElementById('vbar1').style.height = p1 + '%';
  document.getElementById('vpct0').textContent  = Math.round(p0) + '%';
  document.getElementById('vpct1').textContent  = Math.round(p1) + '%';
}

/** MEASURE — the coin spins through both faces (genuinely undecided,
 *  same visual as the Entangle tab's coins) before landing on the
 *  outcome, rather than snapping to a result instantly; measureCoinState
 *  then holds that result until the next state change or Reset puts the
 *  coin back into superposition (see setMeasureState()/resetStats()). */
async function doMeasure() {
  if (measureCoinAnimating || measureBatchAnimating) return;
  measureCoinAnimating = true;

  const p0before = Math.round(qubitMeasure.prob0() * 100);
  const p1before = Math.round(qubitMeasure.prob1() * 100);

  document.getElementById('measure-result').textContent = '';
  document.getElementById('coin-measure-label').textContent = t('measure.measuring', 'Measuring…');
  document.getElementById('btn-measure').disabled = true;

  await animateCoinFlip('coin-measure', 9, 55);

  const result = qubitMeasure.measure();
  measureCoinState = result;
  measureCounts[result]++;

  drawCoin('coin-measure', result);
  pulseElement(document.getElementById('coin-measure'), 'collapsing');
  document.getElementById('coin-measure-label').textContent = result === 0 ? '|0⟩' : '|1⟩';

  const resEl = document.getElementById('measure-result');
  resEl.style.color   = result === 0 ? 'var(--zero)' : 'var(--one)';
  resEl.style.opacity = '1';
  resEl.textContent   = result === 0 ? '|0⟩' : '|1⟩';
  pulseElement(resEl, 'collapsing', 500);

  // The bars themselves deliberately don't move — they show the fixed odds
  // of the prepared state, not "the answer" — but a flash on whichever
  // bar matched the outcome ties the abstract percentages to what just
  // actually happened.
  const winningTrack = document.getElementById(result === 0 ? 'vbar0' : 'vbar1').closest('.vbar-track');
  winningTrack.style.color = result === 0 ? 'var(--zero)' : 'var(--one)';
  pulseElement(winningTrack, 'collapsing', 600);
  document.getElementById('btn-measure').disabled = false;
  pulseElement(document.getElementById('btn-measure'), 'pulsing');

  updateHistogram();

  const opener = MEASURE_OPENERS[Math.floor(Math.random() * MEASURE_OPENERS.length)];
  const color  = result === 0 ? 'var(--zero)' : 'var(--one)';
  setExplainer('measure-explainer',
    `${opener} <strong style="color:${color}">|${result}⟩</strong>. A split second ago the odds were ${p0before}% / ${p1before}%, and both were equally real possibilities — not "secretly already |${result}⟩ and we just didn't know." The click is what forced a choice; the superposition is gone for good. Want to see it happen again? You'll need to re-prepare the exact same state from scratch.`
  );

  measureCoinAnimating = false;
}

// A batch runs its n trials in MEASURE_BATCH_STEPS chunks rather than one
// synchronous loop — with everything computed at once, .hist-bar's own
// CSS transition (measure.css) only ever gets one old-value-to-new-value
// jump to animate, which reads as snapping straight to the final split
// instead of visibly converging toward it the way the app's other
// repeated-random-event displays do (the Beam Splitter/Stern-Gerlach
// "accumulating plate" mechanic — see js/tabs/beam-splitter-tab.js). This
// keeps every trial genuine (still n real calls to qubitMeasure.measure(),
// just paced), so ×1000 doesn't mean 1000 real DOM updates either.
const MEASURE_BATCH_STEPS  = 10;
const MEASURE_BATCH_STEP_MS = 130;

async function measureMany(n) {
  if (measureCoinAnimating || measureBatchAnimating) return;
  measureBatchAnimating = true;
  document.querySelectorAll('[data-measure-n]').forEach(b => b.disabled = true);
  document.getElementById('btn-measure').disabled = true;
  document.getElementById('btn-reset-stats').disabled = true;

  const resEl = document.getElementById('measure-result');
  resEl.style.color = 'var(--text2)';

  const steps = Math.min(n, MEASURE_BATCH_STEPS);
  const stepBase = Math.floor(n / steps);
  let remainder  = n - stepBase * steps;

  for (let s = 0; s < steps; s++) {
    const stepCount = stepBase + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    for (let i = 0; i < stepCount; i++) measureCounts[qubitMeasure.measure()]++;

    const runningTotal = measureCounts[0] + measureCounts[1];
    resEl.textContent = `${runningTotal} total`;
    updateHistogram();
    if (s < steps - 1) await delay(MEASURE_BATCH_STEP_MS);
  }

  const total = measureCounts[0] + measureCounts[1];
  const p0 = Math.round((measureCounts[0] / total) * 100);
  const p1 = Math.round((measureCounts[1] / total) * 100);
  setExplainer('measure-explainer',
    `Just sent ${n} identical, freshly-prepared qubits through the same measurement — think of it as asking ${n} exact copies of the same question. None of them talk to each other or "remember" the last answer; each collapses on its own. Across ${total} trials so far the split landed near ${p0}% / ${p1}%, and it'll keep creeping toward the true odds the more you run.`
  );

  document.querySelectorAll('[data-measure-n]').forEach(b => b.disabled = false);
  document.getElementById('btn-measure').disabled = false;
  document.getElementById('btn-reset-stats').disabled = false;
  measureBatchAnimating = false;
}

function updateHistogram() {
  const total = measureCounts[0] + measureCounts[1];
  if (total === 0) return;
  const p0 = (measureCounts[0] / total) * 100;
  const p1 = (measureCounts[1] / total) * 100;
  document.getElementById('hist0').style.height = p0 + '%';
  document.getElementById('hist1').style.height = p1 + '%';
  document.getElementById('hpct0').textContent  = Math.round(p0) + '%';
  document.getElementById('hpct1').textContent  = Math.round(p1) + '%';
  document.getElementById('trial-count').textContent = `· ${total} trials`;

  const exp0 = Math.round(qubitMeasure.prob0() * 100);
  const exp1 = Math.round(qubitMeasure.prob1() * 100);
  document.getElementById('convergence-note').textContent =
    total >= 20 ? `Quantum prediction: |0⟩ → ${exp0}%  |1⟩ → ${exp1}%` : '';
}

function resetStats() {
  if (measureCoinAnimating || measureBatchAnimating) return;
  measureCounts = { 0: 0, 1: 0 };
  ['hist0','hist1'].forEach(id => document.getElementById(id).style.height = '0%');
  document.getElementById('hpct0').textContent          = '—';
  document.getElementById('hpct1').textContent          = '—';
  document.getElementById('trial-count').textContent    = '';
  document.getElementById('measure-result').textContent = '';
  document.getElementById('convergence-note').textContent = '';
  // Back to superposition — matches "Reset" conceptually undoing the last
  // collapse, not just clearing the histogram.
  measureCoinState = null;
  drawCoin('coin-measure', null);
  document.getElementById('coin-measure-label').textContent = t('measure.unmeasured', 'Unmeasured');
}


// ════════ js/tabs/statevector-tab.js ════════
// Depends on: core/qubit.js (round2), core/theme.js (isDark, BLOCH_COLORS,
// onThemeChange), app.js state (classicalSVState, svTheta). Formerly its
// own top-level "Statevec" tab; now the interactive "Compare the State
// Spaces" widget embedded in Maths Concept's State Vector section
// (#maths-statevector in index.html) — see setMathsSection() in
// mathsconcept-tab.js, which calls redrawStatevecCanvases() when that
// section is opened, taking over the redraw-on-entry job
// registerTab('statevec', ...) used to do back when this was its own tab.
// ═══════════════════════════════════════════════════════════════════
// STATEVECTOR WIDGET
// ═══════════════════════════════════════════════════════════════════
function initStatevecTab() {
  drawClassicalSV(classicalSVState);
  drawQuantumSV(svTheta);
  updateSVFormulas();
  document.getElementById('btn-toggle-classical-sv').addEventListener('click', toggleClassicalSV);
  document.getElementById('sv-theta-slider').addEventListener('input', svSliderUpdate);
  document.querySelectorAll('.mode-btn[data-statevec-mode]').forEach(btn =>
    btn.addEventListener('click', () => setStatevecMode(btn.dataset.statevecMode)));
  onThemeChange(redrawStatevecCanvases);
}

/** Canvases are static once drawn, but redraw on entry in case the theme
 *  changed while this section was hidden (draw() reads live isDark), or
 *  the panel that was hidden behind the other mode never got a
 *  proper-sized redraw while display:none. */
function redrawStatevecCanvases() {
  drawClassicalSV(classicalSVState);
  drawQuantumSV(svTheta);
}

/** Classical/Quantum switch for the State Vector tab — same two-tier
 *  pattern as Gates' domain toggle. Each was previously half of a
 *  side-by-side "vs" comparison; now they're standalone pages. */
function setStatevecMode(mode) {
  document.querySelectorAll('.mode-btn[data-statevec-mode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.statevecMode === mode));
  document.getElementById('statevec-classical-panel').style.display = mode === 'classical' ? '' : 'none';
  document.getElementById('statevec-quantum-panel').style.display   = mode === 'quantum'   ? '' : 'none';
  // Canvases don't redraw themselves while their panel is display:none,
  // so switching into a panel needs the same explicit redraw onEnter()
  // already does for tab-level visits.
  drawClassicalSV(classicalSVState);
  drawQuantumSV(svTheta);
}

function toggleClassicalSV() {
  classicalSVState = 1 - classicalSVState;
  drawClassicalSV(classicalSVState);
  document.getElementById('sv-classical-formula').textContent =
    `State = |${classicalSVState}⟩`;
}

function svSliderUpdate() {
  svTheta = parseInt(document.getElementById('sv-theta-slider').value) / 1000;
  document.getElementById('sv-theta-val').textContent =
    Math.round(svTheta * 180 / Math.PI) + '°';
  drawQuantumSV(svTheta);
  updateSVFormulas();
}

function updateSVFormulas() {
  const alpha = Math.cos(svTheta / 2);
  const beta  = Math.sin(svTheta / 2);
  const p0    = alpha * alpha * 100;
  const p1    = beta  * beta  * 100;
  const aStr  = round2(alpha), bStr = round2(beta);
  document.getElementById('sv-quantum-formula').textContent =
    `|ψ⟩ = ${aStr}|0⟩ + ${bStr}|1⟩`;
  document.getElementById('sv-fill0').style.width = p0 + '%';
  document.getElementById('sv-fill1').style.width = p1 + '%';
  document.getElementById('sv-pct0').textContent  = Math.round(p0) + '%';
  document.getElementById('sv-pct1').textContent  = Math.round(p1) + '%';
}

/* Classical state-vector canvas — vertical line, only two valid points */
function drawClassicalSV(state) {
  const canvas = document.getElementById('sv-classical');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const axisX = w / 2;
  const margin = 52;
  const topY   = margin;        // |1⟩
  const botY   = h - margin;    // |0⟩
  const midY   = (topY + botY) / 2;

  // Forbidden-zone shading between the two endpoints
  const fgrd = ctx.createLinearGradient(axisX - 28, 0, axisX + 28, 0);
  fgrd.addColorStop(0,   'transparent');
  fgrd.addColorStop(0.5, isDark ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.018)');
  fgrd.addColorStop(1,   'transparent');
  ctx.fillStyle = fgrd;
  ctx.fillRect(axisX - 28, topY, 56, botY - topY);

  // Crosshatch lines inside forbidden zone
  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)';
  ctx.lineWidth = 1;
  for (let y = topY + 14; y < botY - 4; y += 16) {
    ctx.beginPath();
    ctx.moveTo(axisX - 24, y);
    ctx.lineTo(axisX + 24, y + 16);
    ctx.stroke();
  }
  ctx.restore();

  // "Forbidden" label
  ctx.font = `9px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.60)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('forbidden', axisX, midY - 8);
  ctx.fillText('zone', axisX, midY + 8);

  // Axis spine
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.24)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(axisX, topY - 14);
  ctx.lineTo(axisX, botY + 14);
  ctx.stroke();

  // Ticks + ket labels
  [{ y: topY, ket: '|1⟩' }, { y: botY, ket: '|0⟩' }].forEach(({ y, ket }) => {
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(axisX - 10, y);
    ctx.lineTo(axisX + 10, y);
    ctx.stroke();
    ctx.font = `13px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.42)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ket, axisX + 16, y);
  });

  // State dot — large, bold, solid
  const stateY = state === 1 ? topY : botY;
  ctx.beginPath();
  ctx.arc(axisX, stateY, 13, 0, 2 * Math.PI);
  ctx.fillStyle = isDark ? '#EFEFEF' : '#0B0B0B';
  ctx.fill();

  // Digit inside dot
  ctx.font = `bold 12px 'JetBrains Mono', monospace`;
  ctx.fillStyle = isDark ? '#0B0B0B' : '#EFEFEF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state, axisX, stateY);
}

/* Quantum state-vector canvas — 2D amplitude space with unit arc */
function drawQuantumSV(theta) {
  const canvas = document.getElementById('sv-quantum');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const margin  = 52;
  const originX = margin;
  const originY = h - margin;
  const size    = Math.min(w - margin * 1.7, h - margin * 1.7);

  const alpha = Math.cos(theta / 2);
  const beta  = Math.sin(theta / 2);
  const tipX  = originX + alpha * size;
  const tipY  = originY - beta  * size;

  // ── Unit quarter-circle arc (the full state space) ──────────────
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(originX, originY, size, -Math.PI / 2, 0, false);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Axes ──────────────────────────────────────────────────────────
  const axCol = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  ctx.strokeStyle = axCol;
  ctx.lineWidth = 1.5;
  // X axis → |0⟩
  ctx.beginPath();
  ctx.moveTo(originX - 8, originY);
  ctx.lineTo(originX + size + 24, originY);
  ctx.stroke();
  // Y axis ↑ |1⟩
  ctx.beginPath();
  ctx.moveTo(originX, originY + 8);
  ctx.lineTo(originX, originY - size - 24);
  ctx.stroke();

  // Axis arrowheads
  const ah = 7;
  ctx.fillStyle = axCol;
  ctx.beginPath(); // X →
  ctx.moveTo(originX + size + 24, originY);
  ctx.lineTo(originX + size + 24 - ah, originY - 4);
  ctx.lineTo(originX + size + 24 - ah, originY + 4);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); // Y ↑
  ctx.moveTo(originX, originY - size - 24);
  ctx.lineTo(originX - 4, originY - size - 24 + ah);
  ctx.lineTo(originX + 4, originY - size - 24 + ah);
  ctx.closePath(); ctx.fill();

  // Unit marks at 1.0
  ctx.strokeStyle = axCol;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(originX + size, originY - 5); ctx.lineTo(originX + size, originY + 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(originX - 5, originY - size); ctx.lineTo(originX + 5, originY - size); ctx.stroke();

  // Axis labels
  ctx.font = `13px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = BLOCH_COLORS.axisZ;
  ctx.fillText('|0⟩', originX + size + 28, originY + 18);
  ctx.textBaseline = 'top';
  ctx.fillText('|1⟩', originX, originY - size - 28);

  // ── Projection dashes from tip to axes ───────────────────────────
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.13)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX, originY);    ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(originX, tipY);    ctx.stroke();
  ctx.setLineDash([]);

  // Projection dots on axes
  const pdot = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.28)';
  ctx.fillStyle = pdot;
  ctx.beginPath(); ctx.arc(tipX,    originY, 3, 0, 2*Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(originX, tipY,    3, 0, 2*Math.PI); ctx.fill();

  // α and β labels on axes
  if (alpha > 0.06) {
    ctx.font = `11px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#5B8DEF' : '#0033A0';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`α=${round2(alpha)}`, tipX, originY + 8);
  }
  if (beta > 0.06) {
    ctx.font = `11px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#F472B6' : '#BE185D';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(`β=${round2(beta)}`, originX - 8, tipY);
  }

  // θ/2 angle arc
  if (theta > 0.05) {
    const arcR = 34;
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.26)' : 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(originX, originY, arcR, -Math.PI / 2, -(Math.PI / 2 - theta / 2), false);
    ctx.stroke();
    const midAng = -Math.PI / 2 + theta / 4;
    ctx.font = `10px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.34)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lr = arcR + 14;
    ctx.fillText('θ/2', originX + lr * Math.cos(midAng), originY + lr * Math.sin(midAng));
  }

  // ── State vector arrow ───────────────────────────────────────────
  ctx.save();
  if (isDark) { ctx.shadowBlur = 14; ctx.shadowColor = BLOCH_COLORS.arrow; }
  ctx.strokeStyle = BLOCH_COLORS.arrow;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  const ang = Math.atan2(tipY - originY, tipX - originX);
  const as  = 10;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - as * Math.cos(ang - 0.4), tipY - as * Math.sin(ang - 0.4));
  ctx.lineTo(tipX - as * Math.cos(ang + 0.4), tipY - as * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fillStyle = BLOCH_COLORS.arrow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(tipX, tipY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = BLOCH_COLORS.tip;
  ctx.fill();
  ctx.restore();

  // Origin dot
  ctx.beginPath();
  ctx.arc(originX, originY, 3.5, 0, 2 * Math.PI);
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.38)';
  ctx.fill();
}


// ════════ js/tabs/entanglement-tab.js ════════
// Depends on: core/utils.js (delay), core/theme.js (onThemeChange),
// core/tab-registry.js (registerTab), core/dom-utils.js (drawCoin,
// animateCoinFlip — shared with tabs/measure-tab.js's own coin),
// app.js state (coin1State, coin2State, coinAnimating, entangleCounts).

// ═══════════════════════════════════════════════════════════════════
// ENTANGLEMENT TAB
// ═══════════════════════════════════════════════════════════════════
function initEntangle() {
  drawCoin('coin1', null);
  drawCoin('coin2', null);
  document.getElementById('btn-measure-both').addEventListener('click', flipEntangled);
  document.getElementById('btn-measure-a').addEventListener('click', measureCoinA);
  document.getElementById('btn-reset-entangle').addEventListener('click', resetEntangle);

  const redrawCoins = () => {
    drawCoin('coin1', coin1State);
    drawCoin('coin2', coin2State);
  };
  // Two different reasons a redraw is needed: entering this tab while it
  // was previously hidden (registerTab's onEnter), and the theme changing
  // while this tab may or may not be visible (onThemeChange) — both call
  // the same redraw since draw() always reads the live isDark/coin state.
  registerTab('entangle', { onEnter: redrawCoins });
  onThemeChange(redrawCoins);
}

/* MEASURE BOTH — simultaneous collapse of Bell state */
async function flipEntangled() {
  if (coinAnimating) return;
  coinAnimating = true;

  setEntangleNote('Measuring…');
  document.getElementById('entangle-result').textContent = '';
  document.getElementById('coin1-label').textContent = '…';
  document.getElementById('coin2-label').textContent = '…';

  // Both coins show superposition oscillation
  for (let i = 0; i < 10; i++) {
    drawCoin('coin1', i % 2);
    drawCoin('coin2', 1 - (i % 2));
    await delay(55);
  }

  // Wavefunction collapses — both get identical result
  const result = Math.random() < 0.5 ? 0 : 1;
  coin1State = result;
  coin2State = result;

  drawCoin('coin1', result);
  drawCoin('coin2', result);
  pulseElement(document.getElementById('coin1'), 'collapsing');
  pulseElement(document.getElementById('coin2'), 'collapsing');

  const ket = result === 0 ? '|0⟩' : '|1⟩';
  document.getElementById('coin1-label').textContent = ket;
  document.getElementById('coin2-label').textContent = ket;
  setEntangleNote('Both collapsed to the same state');

  const resEl = document.getElementById('entangle-result');
  resEl.textContent = `Outcome: |${result}${result}⟩`;
  resEl.style.color = result === 0 ? 'var(--zero)' : 'var(--one)';
  pulseElement(resEl, 'collapsing', 500);

  entangleCounts[result === 0 ? '00' : '11']++;
  updateEntangleStats();
  coinAnimating = false;
}

/* MEASURE A ONLY — demonstrates nonlocal correlation */
async function measureCoinA() {
  if (coinAnimating) return;
  coinAnimating = true;

  // Reset B to superposition while A is being measured
  coin1State = null;
  coin2State = null;
  drawCoin('coin2', null);
  document.getElementById('coin2-label').textContent = 'Entangled…';
  setEntangleNote('Measuring A…');
  document.getElementById('entangle-result').textContent = '';
  document.getElementById('coin1-label').textContent = 'Measuring…';

  // Animate only coin A
  await animateCoinFlip('coin1', 9, 62);

  const result = Math.random() < 0.5 ? 0 : 1;
  coin1State = result;
  drawCoin('coin1', result);
  pulseElement(document.getElementById('coin1'), 'collapsing');
  document.getElementById('coin1-label').textContent =
    `A = ${result === 0 ? '|0⟩' : '|1⟩'}`;

  setEntangleNote('A collapsed — B instantly determined!');

  await delay(580); // dramatic pause — represents "spooky action"

  // B collapses to same value with no communication
  coin2State = result;
  drawCoin('coin2', result);
  pulseElement(document.getElementById('coin2'), 'collapsing');
  document.getElementById('coin2-label').textContent =
    `B = ${result === 0 ? '|0⟩' : '|1⟩'}`;

  const resEl = document.getElementById('entangle-result');
  resEl.textContent = `|${result}${result}⟩ — no signal sent to B`;
  resEl.style.color = result === 0 ? 'var(--zero)' : 'var(--one)';
  pulseElement(resEl, 'collapsing', 500);
  setEntangleNote('Correlation holds regardless of distance');

  entangleCounts[result === 0 ? '00' : '11']++;
  updateEntangleStats();
  coinAnimating = false;
}

function resetEntangle() {
  if (coinAnimating) return;
  coin1State = null;
  coin2State = null;
  drawCoin('coin1', null);
  drawCoin('coin2', null);
  document.getElementById('coin1-label').textContent = 'Unmeasured';
  document.getElementById('coin2-label').textContent = 'Unmeasured';
  document.getElementById('entangle-result').textContent = '';
  setEntangleNote('Measuring A instantly determines B');
}

function setEntangleNote(msg) {
  const el = document.getElementById('entangle-note');
  if (el) el.innerHTML = msg;
}

function updateEntangleStats() {
  const n00   = entangleCounts['00'];
  const n11   = entangleCounts['11'];
  const total = n00 + n11;
  const p00   = total ? n00 / total * 100 : 0;
  const p11   = total ? n11 / total * 100 : 0;

  document.getElementById('estat-fill-00').style.width = p00 + '%';
  document.getElementById('estat-fill-11').style.width = p11 + '%';
  document.getElementById('estat-pct-00').textContent  = total ? Math.round(p00) + '%' : '—';
  document.getElementById('estat-pct-11').textContent  = total ? Math.round(p11) + '%' : '—';
  document.getElementById('entangle-trial-count').textContent = total ? `· ${total} trials` : '';

  if (total >= 10) {
    document.getElementById('entangle-convergence').textContent =
      `Always |00⟩ or |11⟩ — the perfect quantum correlation converges to 50/50`;
  }
}


// ════════ js/tabs/bell-states-tab.js ════════
// Depends on: core/tab-registry.js (registerTab), core/i18n.js (t()).
// The interactive "measure the pair" demo deliberately lives only on the
// Entangle tab (js/tabs/entanglement-tab.js) — repeating the same
// coin-flip UI here for Φ⁺ specifically would just duplicate it, so this
// tab instead illustrates all four states: a circuit diagram, a same/
// opposite-by-phase taxonomy grid, and the exact (not sampled) Born-rule
// probability split for whichever state is selected.

// ═══════════════════════════════════════════════════════════════════
// BELL STATES TAB
// ═══════════════════════════════════════════════════════════════════
const BELL_STATES = {
  phiplus:  { symbol: 'Φ⁺', ketA: '00', ketB: '11', correlation: 'same',
              formula: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2', needsXA: false, needsXB: false },
  phiminus: { symbol: 'Φ⁻', ketA: '00', ketB: '11', correlation: 'same',
              formula: '|Φ⁻⟩ = (|00⟩ − |11⟩) / √2', needsXA: true,  needsXB: false },
  psiplus:  { symbol: 'Ψ⁺', ketA: '01', ketB: '10', correlation: 'opposite',
              formula: '|Ψ⁺⟩ = (|01⟩ + |10⟩) / √2', needsXA: false, needsXB: true },
  psiminus: { symbol: 'Ψ⁻', ketA: '01', ketB: '10', correlation: 'opposite',
              formula: '|Ψ⁻⟩ = (|01⟩ − |10⟩) / √2', needsXA: true,  needsXB: true }
};

// English fallback for t() — actual copy lives in js/locales/*.js under
// the same bellstates.recipe.<key> keys.
const BELL_RECIPE_FALLBACK = {
  phiplus:  'Start at |00⟩, apply H to qubit A, then CNOT (A → B).',
  phiminus: 'Start at |00⟩, apply X to qubit A, then H to qubit A, then CNOT (A → B).',
  psiplus:  'Start at |00⟩, apply X to qubit B, then H to qubit A, then CNOT (A → B).',
  psiminus: 'Start at |00⟩, apply X to both qubits, then H to qubit A, then CNOT (A → B).'
};

let currentBellState = 'phiplus';
let bellAnimating = false;
const BELL_ANIM_STEP_MS = 700;
const BELL_TOKEN_BASE_X = 70; // matches the tokens' own cx/x in index.html — translateX is measured from here

function initBellStatesTab() {
  document.querySelectorAll('#bellstate-picker [data-bell], #bellstate-family [data-bell]').forEach(btn => {
    btn.addEventListener('click', () => setBellState(btn.dataset.bell));
  });
  document.getElementById('btn-run-bellstate').addEventListener('click', runBellStateCircuit);

  registerTab('bellstates', {});
  updateBellStateDisplay();
}

function setBellState(key) {
  if (bellAnimating) return; // mid-run — the picker/family buttons are disabled anyway, but guard directly too
  currentBellState = key;
  updateBellStateDisplay();
}

/* Refreshes every surface that depends on which Bell state is selected:
   the formula, the recipe text, the circuit diagram's X gates, the
   picker's and family grid's active highlight, and the exact probability
   split (no sampling — these are the Born-rule values themselves). */
function updateBellStateDisplay() {
  const s = BELL_STATES[currentBellState];

  document.getElementById('bellstate-formula').textContent = s.formula;
  document.getElementById('bellstate-recipe').textContent =
    t(`bellstates.recipe.${currentBellState}`, BELL_RECIPE_FALLBACK[currentBellState]);

  document.getElementById('bellstate-gate-xa').classList.toggle('circuit-gate-off', !s.needsXA);
  document.getElementById('bellstate-gate-xb').classList.toggle('circuit-gate-off', !s.needsXB);

  document.querySelectorAll('[data-bell]').forEach(b =>
    b.classList.toggle('active', b.dataset.bell === currentBellState));

  document.getElementById('bellstate-distribution-note').textContent =
    t('bellstates.distributionNote', 'Exact Born-rule probabilities for {symbol} — no sampling needed, these follow directly from squaring each amplitude.')
      .replace('{symbol}', `|${s.symbol}⟩`);

  ['00', '01', '10', '11'].forEach(k => {
    const pct = (k === s.ketA || k === s.ketB) ? 50 : 0;
    document.getElementById(`bstat-fill-${k}`).style.width = pct + '%';
    document.getElementById(`bstat-pct-${k}`).textContent = pct + '%';
  });

  document.querySelectorAll('#bell-stats-rows .prob-row').forEach(row => {
    const possible = row.dataset.ket === s.ketA || row.dataset.ket === s.ketB;
    row.classList.toggle('bell-impossible', !possible);
  });

  resetBellTokens();
}

// ═══════════════════════════════════════════════════════════════════
// CIRCUIT DIAGRAM — RUN ANIMATION
// ═══════════════════════════════════════════════════════════════════
// The always-on .circuit-gate-glow loop above is purely decorative
// "signal flow"; this is the actual thing it's gesturing at — a value
// token per wire, gliding through each gate and picking up that gate's
// real effect: X flips the label, H turns qubit A's token into a genuine
// dashed "superposed" look (not a definite digit — the entire point),
// and CNOT gives qubit B the same look plus a shared color and a
// connecting arc, since B is now correlated with A's superposition
// rather than independently random. Never collapses either token to one
// value at the end — that would misrepresent what the circuit actually
// leaves behind (an unmeasured entangled pair, not a fixed answer).

/** Moves one token to grid position `x` (one of the fixed checkpoints
 *  below) by translating from its base position in index.html —
 *  BELL_TOKEN_BASE_X — so this only ever needs one coordinate, not a
 *  running offset. */
function setBellTokenX(id, x) {
  document.getElementById(id).style.transform = `translateX(${x - BELL_TOKEN_BASE_X}px)`;
}

/** Restores both tokens to their pre-run look — hidden, back at the
 *  start, |0⟩, no superposed/entangled styling. Called whenever the
 *  selected state changes (mid-run switching is blocked in setBellState()
 *  already, but a state change between runs should always clear the
 *  previous run's leftover styling) and at the very start of a run. */
function resetBellTokens() {
  ['a', 'b'].forEach(wire => {
    const g = document.getElementById(`bellstate-token-${wire}`);
    g.classList.add('token-hidden');
    g.classList.remove('superposed', 'entangled', 'token-pulse');
    g.querySelector('.token-label').textContent = '0';
    setBellTokenX(`bellstate-token-${wire}`, BELL_TOKEN_BASE_X);
  });
  document.getElementById('bellstate-entangle-link').classList.remove('shown');
}

async function runBellStateCircuit() {
  if (bellAnimating) return;
  bellAnimating = true;

  const s = BELL_STATES[currentBellState];
  const runBtn = document.getElementById('btn-run-bellstate');
  runBtn.disabled = true;
  document.querySelectorAll('#bellstate-picker [data-bell], #bellstate-family [data-bell]').forEach(b => b.disabled = true);
  document.getElementById('bellstate-anim-status').textContent = t('common.running', 'running…');

  resetBellTokens();
  const tokenA = document.getElementById('bellstate-token-a');
  const tokenB = document.getElementById('bellstate-token-b');
  const labelA = tokenA.querySelector('.token-label');
  const labelB = tokenB.querySelector('.token-label');
  const setNarration = txt => { document.getElementById('bellstate-anim-explainer').textContent = txt; };

  tokenA.classList.remove('token-hidden');
  tokenB.classList.remove('token-hidden');
  setNarration(t('bellstates.animStart', 'Both qubits start at |0⟩ — watch the value on each wire as it moves through the gates.'));
  await delay(BELL_ANIM_STEP_MS);

  // ─── X gates — flip whichever wire(s) this state needs ───
  setBellTokenX('bellstate-token-a', 110);
  setBellTokenX('bellstate-token-b', 110);
  await delay(BELL_ANIM_STEP_MS);
  if (s.needsXA) {
    labelA.textContent = '1';
    tokenA.classList.add('token-pulse');
    setNarration(t('bellstates.animFlipA', 'X flips qubit A: 0 → 1.'));
    await delay(500);
    tokenA.classList.remove('token-pulse');
  }
  if (s.needsXB) {
    labelB.textContent = '1';
    tokenB.classList.add('token-pulse');
    setNarration(t('bellstates.animFlipB', 'X flips qubit B: 0 → 1.'));
    await delay(500);
    tokenB.classList.remove('token-pulse');
  }
  if (!s.needsXA && !s.needsXB) {
    setNarration(t('bellstates.animNoFlip', 'This state needs no X gate — both qubits stay at |0⟩ so far.'));
    await delay(400);
  }

  // ─── H on qubit A — a real superposition, not a coin-flip guess ───
  setBellTokenX('bellstate-token-a', 220);
  setBellTokenX('bellstate-token-b', 220);
  await delay(BELL_ANIM_STEP_MS);
  tokenA.classList.add('superposed');
  labelA.textContent = '0∕1';
  setNarration(t('bellstates.animSuperpose', 'H puts qubit A into a genuine superposition — no longer a definite 0 or 1, both at once.'));
  await delay(BELL_ANIM_STEP_MS);

  // ─── CNOT — entangles B with A's superposition ───
  setBellTokenX('bellstate-token-a', 320);
  setBellTokenX('bellstate-token-b', 320);
  await delay(BELL_ANIM_STEP_MS);
  tokenB.classList.add('superposed');
  labelB.textContent = '0∕1';
  tokenA.classList.add('entangled');
  tokenB.classList.add('entangled');
  setNarration(t('bellstates.animEntangle', 'CNOT entangles B with A — B is now correlated with A\'s superposition, not independently random.'));
  await delay(BELL_ANIM_STEP_MS);

  // ─── Final — still unmeasured, so both tokens stay superposed; the
  // arc is the only new thing, showing the two wires are now linked ───
  setBellTokenX('bellstate-token-a', 420);
  setBellTokenX('bellstate-token-b', 420);
  await delay(BELL_ANIM_STEP_MS);
  document.getElementById('bellstate-entangle-link').classList.add('shown');
  setNarration(t('bellstates.animDone', 'Final state: {formula} — A and B are perfectly correlated: measuring one instantly tells you the other.').replace('{formula}', s.formula));
  document.getElementById('bellstate-anim-status').textContent = '';

  runBtn.disabled = false;
  document.querySelectorAll('#bellstate-picker [data-bell], #bellstate-family [data-bell]').forEach(b => b.disabled = false);
  bellAnimating = false;
}


// ════════ js/tabs/tunneling-tab.js ════════
// Depends on: core/theme.js (isDark, BLOCH_COLORS.arrow), core/dom-utils.js
// (setExplainer), core/tab-registry.js (registerTab). Registers onEnter/
// onLeave hooks that start/pause the simulation loop when this tab
// becomes visible/hidden — tunnelAnimId itself stays private to this file.
// Every run that fully settles (not one abandoned mid-flight by a slider
// drag) also logs a {heightRatio, widthCells, reflPct, transPct} entry to
// tunnelHistory, rendered as the #tunnel-history strip — unlike Stern-
// Gerlach/Beam Splitter's per-atom randomness, this solver is fully
// deterministic, so the strip isn't building toward a probability; it's
// a record of your own exploration, letting "raise V0, watch transmitted
// shrink" be something you can see across runs instead of just read in
// the explainer text.

// ═══════════════════════════════════════════════════════════════════
// QUANTUM TUNNELING TAB
// Real time-dependent Schrodinger solver (staggered leapfrog), not a
// fake animation. Units: hbar = m = 1, so H = -0.5 d^2/dx^2 + V(x).
// Validated separately: probability stays conserved to <0.3% over a
// full run, and transmission falls off correctly as V0/E increases
// (23% at V0=E down to 0.1% at V0=2.5E).
// ═══════════════════════════════════════════════════════════════════
const TUNNEL_SUBSTEPS = 12;         // physics steps per rendered frame
const TUNNEL_MAX_STEPS = 3200;      // stop before packet reaches the wall

let tunnelCanvas = null, tunnelCtx = null;
let tunnelAnimId = null;
let tunnelPlaying = true;
let tunnelSettled = false;
let tunnelCrossed = false;
let tunnelElapsedSteps = 0;
let tunnelBarrier = null; // { heightRatio, widthCells, V0, center, half }
let tunnelInitialized = false;
let tunnelHistory = []; // completed runs only — [{ heightRatio, widthCells, reflPct, transPct }, ...]
const TUNNEL_HISTORY_MAX = 24;

/* Wires the static controls (sliders/buttons already in index.html) —
   called once from app.js's DOMContentLoaded. Safe to attach before the
   tab has ever been visited: these controls are only reachable once the
   Tunnel tab is active, and activating it runs ensureTunnelStarted()
   first, which allocates tunnelPsiR/I before any listener could fire. */
function initTunnelControls() {
  document.getElementById('tunnel-height').addEventListener('input', onTunnelSliderChange);
  document.getElementById('tunnel-width').addEventListener('input', onTunnelSliderChange);
  document.getElementById('tunnel-play-btn').addEventListener('click', toggleTunnelPlay);
  document.getElementById('btn-fire-tunnel').addEventListener('click', fireTunnelPacket);
  document.getElementById('btn-clear-tunnel-history').addEventListener('click', clearTunnelHistory);
  renderTunnelHistory();

  registerTab('tunnel', { onEnter: ensureTunnelStarted, onLeave: stopTunnelSim });
}

function drawTunnel() {
  const ctx = tunnelCtx;
  const w = tunnelCanvas.width, h = tunnelCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const baseline = h * 0.86;

  // ── barrier ─────────────────────────────────────────
  const bx1 = (tunnelBarrier.center - tunnelBarrier.half) / TUNNEL_N * w;
  const bx2 = (tunnelBarrier.center + tunnelBarrier.half) / TUNNEL_N * w;
  const barrierPxH = 14 + (tunnelBarrier.heightRatio / 2.5) * h * 0.55;
  const bw = Math.max(2, bx2 - bx1);
  const by = baseline - barrierPxH;

  // A solid-material gradient (bright top edge fading to a darker core)
  // instead of one flat tint — the same "lit from above" convention used
  // for every other apparatus part across the app (magnet poles, beam
  // splitter plate), so this classically-forbidden wall reads as
  // physical rather than a placeholder rectangle next to the genuinely
  // solved wavefunction beside it.
  const barrierGrad = ctx.createLinearGradient(0, by, 0, baseline);
  if (isDark) {
    barrierGrad.addColorStop(0,    'rgba(255,255,255,0.22)');
    barrierGrad.addColorStop(0.18, 'rgba(255,255,255,0.09)');
    barrierGrad.addColorStop(1,    'rgba(255,255,255,0.035)');
  } else {
    barrierGrad.addColorStop(0,    'rgba(0,0,0,0.16)');
    barrierGrad.addColorStop(0.18, 'rgba(0,0,0,0.065)');
    barrierGrad.addColorStop(1,    'rgba(0,0,0,0.03)');
  }
  ctx.fillStyle   = barrierGrad;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.24)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(bx1, by, bw, barrierPxH);
  ctx.fill(); ctx.stroke();

  // Diagonal hatching — the standard textbook symbol for "classically
  // forbidden / solid" regions in a potential-energy diagram, not just a
  // decorative texture.
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx1, by, bw, barrierPxH);
  ctx.clip();
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.13)';
  ctx.lineWidth = 1;
  const hatchGap = 7;
  for (let hx = bx1 - barrierPxH; hx < bx2 + barrierPxH; hx += hatchGap) {
    ctx.beginPath();
    ctx.moveTo(hx, baseline);
    ctx.lineTo(hx + barrierPxH, by);
    ctx.stroke();
  }
  ctx.restore();

  // A thin bright top edge, echoing the knife-edge highlight on the
  // Stern-Gerlach magnet poles — a cheap specular cue that this surface
  // is a real, solid boundary the wave has to contend with.
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx1, by);
  ctx.lineTo(bx2, by);
  ctx.stroke();

  ctx.font = `11px 'JetBrains Mono', monospace`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('V₀', (bx1 + bx2) / 2, baseline - barrierPxH - 5);

  // ── baseline axis ───────────────────────────────────
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)';
  ctx.beginPath(); ctx.moveTo(0, baseline); ctx.lineTo(w, baseline); ctx.stroke();

  // ── |psi(x)|^2 filled probability cloud ─────────────
  const glow = BLOCH_COLORS.arrow || (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.85)');
  ctx.beginPath();
  ctx.moveTo(0, baseline);
  for (let j = 0; j < TUNNEL_N; j++) {
    const prob = (tunnelSolver.psiR[j] ** 2 + tunnelSolver.psiI[j] ** 2) * tunnelSolver.drawScale;
    const px = (j / TUNNEL_N) * w;
    const py = baseline - prob * h;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(w, baseline);
  ctx.closePath();

  ctx.save();
  if (isDark) { ctx.shadowBlur = 16; ctx.shadowColor = glow; }
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  ctx.fill();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1.7;
  ctx.stroke();
  ctx.restore();

  // ── faint oscillating carrier wave inside the envelope ──
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  const carrierScale = Math.sqrt(tunnelSolver.drawScale) * h * 0.42;
  for (let j = 0; j < TUNNEL_N; j++) {
    const px = (j / TUNNEL_N) * w;
    const py = baseline - h * 0.02 - tunnelSolver.psiR[j] * carrierScale * 0.5 - h * 0.02;
    if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function updateTunnelStats(pLeft, pRight) {
  document.getElementById('tunnel-refl').textContent  = Math.round(pLeft * 100) + '%';
  document.getElementById('tunnel-trans').textContent = Math.round(pRight * 100) + '%';
}

/** Renders #tunnel-history from tunnelHistory — a plain rebuild each
 *  call rather than incremental DOM diffing, since the list is capped at
 *  TUNNEL_HISTORY_MAX (24) entries, cheap either way. Each bar's title
 *  attribute carries the exact numbers for anyone who wants to read a
 *  specific run rather than eyeball the strip. */
function renderTunnelHistory() {
  const wrap = document.getElementById('tunnel-history');
  wrap.replaceChildren();
  if (tunnelHistory.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'tunnel-history-empty';
    empty.textContent = t('tunnel.historyEmpty', 'No completed runs yet.');
    wrap.appendChild(empty);
  } else {
    tunnelHistory.forEach((run, i) => {
      const bar = document.createElement('div');
      bar.className = 'tunnel-history-bar' + (i === tunnelHistory.length - 1 ? ' latest' : '');
      bar.title = `V₀ = ${run.heightRatio.toFixed(2)}×E, w = ${run.widthCells} — ${run.transPct}% transmitted, ${run.reflPct}% reflected`;
      const segTrans = document.createElement('div');
      segTrans.className = 'seg-trans';
      segTrans.style.height = run.transPct + '%';
      const segRefl = document.createElement('div');
      segRefl.className = 'seg-refl';
      segRefl.style.height = run.reflPct + '%';
      bar.append(segTrans, segRefl);
      wrap.appendChild(bar);
    });
  }
  document.getElementById('tunnel-history-count').textContent = tunnelHistory.length
    ? t('tunnel.historyCount', '· {count} runs').replace('{count}', tunnelHistory.length)
    : '';
}

function clearTunnelHistory() {
  tunnelHistory = [];
  renderTunnelHistory();
}

function updateTunnelPlayButton() {
  const btn = document.getElementById('tunnel-play-btn');
  if (btn) btn.textContent = tunnelPlaying ? '⏸ Pause' : '▶ Play';
}

function fireTunnelPacket() {
  tunnelBarrier = tunnelSolver.buildBarrier(
    parseInt(document.getElementById('tunnel-height').value) / 100,
    parseInt(document.getElementById('tunnel-width').value));
  tunnelSolver.launch();
  tunnelSettled = false;
  tunnelCrossed = false;
  tunnelElapsedSteps = 0;
  tunnelPlaying = true;
  updateTunnelPlayButton();
  const el = document.getElementById('tunnel-height-val');
  if (el) el.textContent = tunnelBarrier.heightRatio.toFixed(2) + '×E';
  const wEl = document.getElementById('tunnel-width-val');
  if (wEl) wEl.textContent = tunnelBarrier.widthCells;
  updateTunnelStats(1, 0);

  setExplainer('tunnel-explainer',
    tunnelBarrier.heightRatio < 0.02
      ? 'No barrier at all right now — the packet should sail through essentially untouched. Bump the V₀ slider up to put a wall in its way.'
      : `Launching a wave packet at a barrier <strong>${tunnelBarrier.heightRatio.toFixed(2)}×</strong> its own energy. Classically that\'s an unbreakable wall — no bounce, no chance, full stop. Let\'s see what quantum mechanics has to say about that.`
  );
}

function toggleTunnelPlay() {
  tunnelPlaying = !tunnelPlaying;
  updateTunnelPlayButton();
}

function onTunnelSliderChange() {
  fireTunnelPacket();
}

function tunnelAnimate() {
  if (tunnelPlaying && !tunnelSettled) {
    for (let s = 0; s < TUNNEL_SUBSTEPS; s++) tunnelSolver.step();
    tunnelElapsedSteps += TUNNEL_SUBSTEPS;

    // narrative beat: packet has entered the classically forbidden zone
    if (!tunnelCrossed && tunnelBarrier.heightRatio > 0.02) {
      const peakIdx = tunnelSolver.peakIndex();
      if (peakIdx >= tunnelBarrier.center - tunnelBarrier.half) {
        tunnelCrossed = true;
        setExplainer('tunnel-explainer',
          'Now inside the barrier — the classically forbidden zone. Notice the cloud doesn\'t vanish here, it just decays. If the wall is thin enough, there\'s still some wave left by the time it reaches the far side.'
        );
      }
    }
  }

  drawTunnel();
  const { pLeft, pRight } = tunnelSolver.splitProbs(tunnelBarrier);
  updateTunnelStats(pLeft, pRight);

  if (!tunnelSettled && tunnelElapsedSteps >= TUNNEL_MAX_STEPS) {
    tunnelSettled = true;
    const transPct = Math.round(pRight * 100);
    const reflPct  = Math.round(pLeft * 100);

    // Only a run that actually finished gets logged — a slider drag
    // that re-fires mid-flight abandons the previous run without ever
    // reaching here, so the strip never shows an interrupted result.
    tunnelHistory.push({ heightRatio: tunnelBarrier.heightRatio, widthCells: tunnelBarrier.widthCells, reflPct, transPct });
    if (tunnelHistory.length > TUNNEL_HISTORY_MAX) tunnelHistory.shift();
    renderTunnelHistory();

    if (tunnelBarrier.heightRatio < 0.02) {
      setExplainer('tunnel-explainer', `No barrier, no contest — ${transPct}% sailed straight through. Turn up V₀ to actually test the wall.`);
    } else {
      setExplainer('tunnel-explainer',
        `Final tally: <strong style="color:var(--one)">${transPct}% tunneled</strong> clean through a wall it classically had no business crossing, and <strong style="color:var(--zero)">${reflPct}% bounced back</strong> as expected. Push the barrier higher and the escape odds shrink toward zero — but in principle, never quite reach it.`
      );
    }
  }

  tunnelAnimId = requestAnimationFrame(tunnelAnimate);
}

function ensureTunnelStarted() {
  if (!tunnelInitialized) {
    tunnelCanvas = document.getElementById('tunnel-canvas');
    tunnelCtx    = tunnelCanvas.getContext('2d');
    tunnelInitialized = true;
    fireTunnelPacket();
  }
  if (!tunnelAnimId) tunnelAnimId = requestAnimationFrame(tunnelAnimate);
}

/* Pauses the rAF loop while the Tunnel tab isn't visible — called by
   app.js's tab-switch handler instead of touching tunnelAnimId directly. */
function stopTunnelSim() {
  if (tunnelAnimId) {
    cancelAnimationFrame(tunnelAnimId);
    tunnelAnimId = null;
  }
}


// ════════ js/tabs/interference-tab.js ════════
// Depends on: core/theme.js (isDark), core/tab-registry.js (registerTab).
// Registers onEnter/onLeave hooks that start/pause the simulation loop
// when this tab becomes visible/hidden — interferenceAnimId itself stays
// private to this file.

// ═══════════════════════════════════════════════════════════════════
// WAVE INTERFERENCE TAB
// Two coherent point sources ripple in real time on the left; the
// right-hand "screen" accumulates individual hits sampled from the
// exact two-source intensity I = |e^(ikr1) + e^(ikr2)|^2, rejection-
// sampled point by point — the classic "one particle at a time"
// build-up demonstration, not a pre-rendered fringe image.
// ═══════════════════════════════════════════════════════════════════
const INTERFERENCE_WAVE_SPEED = 70;   // px per time unit
const INTERFERENCE_DT         = 0.045;
const INTERFERENCE_HITS_PER_FRAME = 3;
const INTERFERENCE_SOURCE_X   = 26;   // x position of the slit plate
const INTERFERENCE_GAP_HALF   = 6;    // half-width of each slit opening

let interferenceMode = 'double'; // 'double' | 'single' | 'which-path'
let interferenceTime = 0;
let interferenceHitCount = 0;
let interferenceAnimId = null;
let interferenceInitialized = false;
let rippleCanvas = null, rippleCtx = null, rippleImageData = null;
let screenCanvas = null, screenCtx = null;

/* Wires the static controls (mode buttons/sliders/reset already in
   index.html) — called once from app.js's DOMContentLoaded. Safe to
   attach before the tab has ever been visited, for the same reason as
   tabs/tunneling-tab.js's initTunnelControls(). */
function initInterferenceControls() {
  document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => setInterferenceMode(btn.dataset.mode));
  });
  document.getElementById('slit-sep').addEventListener('input', onInterferenceSliderChange);
  document.getElementById('wavelength').addEventListener('input', onInterferenceSliderChange);
  document.getElementById('btn-clear-screen').addEventListener('click', resetScreen);

  registerTab('interference', { onEnter: ensureInterferenceStarted, onLeave: stopInterferenceSim });
}

function interferenceSlitSep()  { return parseInt(document.getElementById('slit-sep').value); }
function interferenceWavelen()  { return parseInt(document.getElementById('wavelength').value); }

function interferenceGeometry() {
  const h = rippleCanvas.height;
  const centerY = h / 2;
  const sep = interferenceSlitSep();
  return {
    centerY,
    y1: centerY - sep / 2,
    y2: centerY + sep / 2,
    sourceX: INTERFERENCE_SOURCE_X,
    screenX: rippleCanvas.width - 4,
  };
}

/* Exact two-source intensity at a screen point, before normalization.
   'double'     -> coherent sum, produces fringes: I = 2 + 2cos(k*dr)
   'single'     -> only one slit contributes, no partner to interfere with
   'which-path' -> both slits open, but path info is known, so the
                   amplitudes add incoherently (no cross term) -> flat */
function interferenceIntensity(y, geo, mode) {
  return interferenceIntensityAt(y, geo, mode, interferenceWavelen());
}

function interferenceMaxIntensity(mode) { return interferenceMax(mode); }

function drawSlitPlate(geo) {
  const ctx = rippleCtx;
  const h = rippleCanvas.height;
  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(geo.sourceX, 0);
  ctx.lineTo(geo.sourceX, geo.y1 - INTERFERENCE_GAP_HALF);
  if (interferenceMode === 'single') {
    ctx.moveTo(geo.sourceX, geo.y1 + INTERFERENCE_GAP_HALF);
    ctx.lineTo(geo.sourceX, h);
  } else {
    ctx.moveTo(geo.sourceX, geo.y1 + INTERFERENCE_GAP_HALF);
    ctx.lineTo(geo.sourceX, geo.y2 - INTERFERENCE_GAP_HALF);
    ctx.moveTo(geo.sourceX, geo.y2 + INTERFERENCE_GAP_HALF);
    ctx.lineTo(geo.sourceX, h);
  }
  ctx.stroke();

  // small detector markers at each open slit in which-path mode
  if (interferenceMode === 'which-path') {
    ctx.fillStyle = isDark ? '#F472B6' : '#BE185D';
    [geo.y1, geo.y2].forEach(y => {
      ctx.beginPath();
      ctx.arc(geo.sourceX - 10, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
  ctx.restore();
}

function drawRipple(geo) {
  const w = rippleCanvas.width, h = rippleCanvas.height;
  if (!rippleImageData || rippleImageData.width !== w || rippleImageData.height !== h) {
    rippleImageData = rippleCtx.createImageData(w, h);
  }
  const data = rippleImageData.data;
  data.fill(0); // fully transparent by default

  const k = 2 * Math.PI / interferenceWavelen();
  const w_ = k * INTERFERENCE_WAVE_SPEED;
  const rgb = isDark ? [255, 255, 255] : [10, 10, 10];
  const step = 2; // sample every 2px, fill 2x2 blocks — 4x fewer sin() calls

  for (let py = 0; py < h; py += step) {
    for (let px = geo.sourceX; px < w; px += step) {
      const r1 = Math.hypot(px - geo.sourceX, py - geo.y1);
      let val = Math.sin(k * r1 - w_ * interferenceTime);
      let maxAmp = 1;
      if (interferenceMode !== 'single') {
        const r2 = Math.hypot(px - geo.sourceX, py - geo.y2);
        val += Math.sin(k * r2 - w_ * interferenceTime);
        maxAmp = 2;
      }
      const bright = Math.max(0, (val + maxAmp) / (2 * maxAmp)); // -> [0,1]
      const alpha = Math.floor(Math.pow(bright, 1.6) * 235);

      for (let yy = 0; yy < step && py + yy < h; yy++) {
        for (let xx = 0; xx < step && px + xx < w; xx++) {
          const idx = ((py + yy) * w + (px + xx)) * 4;
          data[idx]     = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
          data[idx + 3] = alpha;
        }
      }
    }
  }
  rippleCtx.putImageData(rippleImageData, 0, 0);
  drawSlitPlate(geo);
}

function interferenceAddHits(geo) {
  const h = rippleCanvas.height;
  const Imax = interferenceMaxIntensity(interferenceMode);
  const dotColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  screenCtx.fillStyle = dotColor;

  for (let i = 0; i < INTERFERENCE_HITS_PER_FRAME; i++) {
    // rejection sampling against the exact intensity curve. The 12-try
    // cap is a safety bound against low-acceptance-rate edge cases (e.g.
    // sampling right at a destructive-interference minimum) — not a
    // magic tuning constant, just "give up this frame and try next frame".
    let y, accepted = false, tries = 0;
    while (!accepted && tries < 12) {
      y = Math.random() * h;
      const I = interferenceIntensity(y, geo, interferenceMode);
      if (Math.random() * Imax < I) accepted = true;
      tries++;
    }
    if (!accepted) continue;
    const x = screenCanvas.width / 2 + (Math.random() - 0.5) * (screenCanvas.width * 0.5);
    screenCtx.beginPath();
    screenCtx.arc(x, y, 1.1, 0, 2 * Math.PI);
    screenCtx.fill();
    interferenceHitCount++;
  }
  if (interferenceHitCount % 15 < INTERFERENCE_HITS_PER_FRAME) {
    const el = document.getElementById('interference-count');
    if (el) el.textContent = `· ${interferenceHitCount} detected`;
  }
}

function interferenceAnimate() {
  interferenceTime += INTERFERENCE_DT;
  const geo = interferenceGeometry();
  drawRipple(geo);
  interferenceAddHits(geo);
  interferenceAnimId = requestAnimationFrame(interferenceAnimate);
}

function resetScreen() {
  if (screenCtx) screenCtx.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
  interferenceHitCount = 0;
  const el = document.getElementById('interference-count');
  if (el) el.textContent = '';
}

const INTERFERENCE_MODE_COPY = {
  double: 'Both slits are open and the paths are indistinguishable. Watch the dots pile up — one at a time, at random-looking positions — and slowly reveal stripes. That pattern is only possible because each particle had two paths available.',
  single: 'Only one path exists now — no partner wave to interfere with. The dots pile into a single soft blob, no stripes, exactly like tossing pebbles at a wall with one hole.',
  'which-path': 'Both slits are still open, but a detector at each one is now tagging which path every particle took. The stripes vanish, replaced by a plain double-humped pile — knowing the path, even in principle, is enough to destroy the interference.'
};

function setInterferenceMode(mode) {
  interferenceMode = mode;
  document.querySelectorAll('.mode-btn[data-mode]').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  resetScreen();
  setExplainer('interference-explainer', INTERFERENCE_MODE_COPY[mode]);
}

function onInterferenceSliderChange() {
  document.getElementById('slit-sep-val').textContent   = interferenceSlitSep();
  document.getElementById('wavelength-val').textContent = interferenceWavelen();
  resetScreen();
}

function ensureInterferenceStarted() {
  if (!interferenceInitialized) {
    rippleCanvas = document.getElementById('ripple-canvas');
    rippleCtx    = rippleCanvas.getContext('2d');
    screenCanvas = document.getElementById('screen-canvas');
    screenCtx    = screenCanvas.getContext('2d');
    interferenceInitialized = true;
  }
  if (!interferenceAnimId) interferenceAnimId = requestAnimationFrame(interferenceAnimate);
}

/* Pauses the rAF loop while the Interference tab isn't visible — called
   by app.js's tab-switch handler instead of touching interferenceAnimId
   directly. */
function stopInterferenceSim() {
  if (interferenceAnimId) {
    cancelAnimationFrame(interferenceAnimId);
    interferenceAnimId = null;
  }
}


// ════════ js/tabs/beam-splitter-tab.js ════════
// Depends on: core/tab-registry.js (registerTab), core/dom-utils.js
// (pulseElement, used for the detector click ring). A single photon is
// fired at a 50/50 beam splitter and randomly reflected to detector A or
// transmitted to detector B — one photon, one random click, never a
// photon split in half. A faint "ghost" duplicate briefly travels the
// path NOT taken and fades out at the same time, visualizing the
// superposition that existed right up until the real photon landed. No
// qubit/Bloch state involved (see qubit.js) — this tab is a plain
// classical-probability animation, so it keeps its own small bit of
// local state instead.

let bsCountA = 0, bsCountB = 0, bsAnimating = false;

const BS_SOURCE = { x: 115, y: 280 };
const BS_SPLIT  = { x: 380, y: 280 };
const BS_DET_A  = { x: 380, y: 82  };
const BS_DET_B  = { x: 587, y: 280 };
const BS_MARK_MAX = 140; // caps SVG node count on the accumulation plates; oldest mark is dropped past this

/** Sum of three uniforms, centered on 0 and clamped to ±spread — same
 *  cheap stand-in for a normal distribution used by Stern-Gerlach's
 *  sgJitter(), so accumulated marks cluster toward the detector center
 *  and thin out toward the edges rather than landing uniformly. */
function bsJitter(spread) {
  return ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 2 * spread;
}

/** Appends one small dot to detector A or B's accumulation plate at a
 *  jittered position — visualizes the 50/50 split building up over many
 *  photons, the same "photographic plate" upgrade Stern-Gerlach's
 *  detectors got, rather than only ever showing the latest hit via the
 *  click flash. Oldest mark is dropped past BS_MARK_MAX so the SVG
 *  doesn't grow unbounded over a long session. */
function bsAddScreenMark(isA) {
  const group  = document.getElementById(isA ? 'bs-marks-a' : 'bs-marks-b');
  const center = isA ? BS_DET_A : BS_DET_B;
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('class', 'bs-mark');
  circle.setAttribute('cx', center.x + bsJitter(24));
  circle.setAttribute('cy', center.y + bsJitter(18));
  circle.setAttribute('r', 1.5 + Math.random() * 1.2);
  circle.setAttribute('fill', isA ? 'var(--zero)' : 'var(--one)');
  circle.setAttribute('opacity', 0.4 + Math.random() * 0.25);
  group.appendChild(circle);
  if (group.childElementCount > BS_MARK_MAX) group.removeChild(group.firstElementChild);
}

/** Wipes both accumulation plates — called alongside the tally reset,
 *  since a plate mixing marks from before and after a Reset would be
 *  exactly as misleading as a tally that didn't reset. */
function bsClearScreenMarks() {
  document.getElementById('bs-marks-a').replaceChildren();
  document.getElementById('bs-marks-b').replaceChildren();
}

function initBeamSplitterTab() {
  document.getElementById('btn-fire-photon').addEventListener('click', fireBeamSplitterPhoton);
  document.getElementById('btn-reset-beamsplitter').addEventListener('click', resetBeamSplitter);

  // No onLeave needed — a fire-and-forget animation this short (900ms)
  // isn't worth canceling on tab switch; onEnter just clears any photon
  // left mid-flight from a switch-away, so revisiting the tab never shows
  // it frozen partway down a path.
  registerTab('beamsplitter', { onEnter: resetBeamSplitterPhoton });
}

function resetBeamSplitterPhoton() {
  document.getElementById('bs-photon').setAttribute('opacity', 0);
  document.getElementById('bs-photon-ghost').setAttribute('opacity', 0);
  bsAnimating = false;
  document.getElementById('btn-fire-photon').disabled = false;
}

function bsLerp(a, b, t) { return a + (b - a) * t; }

/** Moves `el` (a <g>, translated as a group rather than repositioning
 *  individual circles via cx/cy — that's what lets one call move both
 *  the glow halo and bright core together) from (x0,y0) to (x1,y1) over
 *  `duration` ms, interpolating opacity from op0 to op1 at the same
 *  time. Reused for both the real photon (opacity held at 1 throughout)
 *  and the fading ghost duplicate (opacity 1 → 0), so there's one
 *  animation code path instead of two. */
function bsAnimateMove(el, x0, y0, x1, y1, op0, op1, duration, cb) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    el.setAttribute('transform', `translate(${bsLerp(x0, x1, t)},${bsLerp(y0, y1, t)})`);
    el.setAttribute('opacity', bsLerp(op0, op1, t));
    if (t < 1) requestAnimationFrame(step);
    else cb();
  }
  requestAnimationFrame(step);
}

function fireBeamSplitterPhoton() {
  if (bsAnimating) return;
  bsAnimating = true;
  document.getElementById('btn-fire-photon').disabled = true;
  document.getElementById('beamsplitter-result').textContent = 'traveling…';

  const photon = document.getElementById('bs-photon');
  const ghost  = document.getElementById('bs-photon-ghost');

  bsAnimateMove(photon, BS_SOURCE.x, BS_SOURCE.y, BS_SPLIT.x, BS_SPLIT.y, 1, 1, 450, () => {
    const isA       = Math.random() < 0.5;
    const winTarget  = isA ? BS_DET_A : BS_DET_B;
    const loseTarget = isA ? BS_DET_B : BS_DET_A;

    // The real photon continues on to whichever detector wins, while a
    // faint ghost simultaneously heads down the path NOT taken and fades
    // out over the same 450ms — both outcomes were possible right up
    // until this instant, and only one of them is actually happening.
    bsAnimateMove(ghost, BS_SPLIT.x, BS_SPLIT.y, loseTarget.x, loseTarget.y, 0.55, 0, 450, () => {
      ghost.setAttribute('opacity', 0);
    });

    bsAnimateMove(photon, BS_SPLIT.x, BS_SPLIT.y, winTarget.x, winTarget.y, 1, 1, 450, () => {
      photon.setAttribute('opacity', 0);
      const ping  = document.getElementById(isA ? 'bs-ping-a' : 'bs-ping-b');
      const flash = document.getElementById(isA ? 'bs-flashA' : 'bs-flashB');
      pulseElement(ping, 'active', 650);
      flash.setAttribute('opacity', 0.5);
      setTimeout(() => flash.setAttribute('opacity', 0), 400);
      bsAddScreenMark(isA);

      if (isA) bsCountA++; else bsCountB++;
      document.getElementById('beamsplitter-result').textContent = isA ? 'Detector A clicked' : 'Detector B clicked';
      setExplainer('beamsplitter-explainer', isA
        ? 'Detector A clicked — the photon reflected. Fire again and it could just as easily transmit through to B; each photon\'s path is decided fresh, not by any pattern in what came before.'
        : 'Detector B clicked — the photon transmitted straight through. Fire again and it could just as easily reflect to A; each photon\'s path is decided fresh, not by any pattern in what came before.');
      updateBeamSplitterHistogram();

      bsAnimating = false;
      document.getElementById('btn-fire-photon').disabled = false;
    });
  });
}

function updateBeamSplitterHistogram() {
  const total = bsCountA + bsCountB;
  const pA = total ? (bsCountA / total) * 100 : 0;
  const pB = total ? (bsCountB / total) * 100 : 0;
  document.getElementById('bs-hist-a').style.height = pA + '%';
  document.getElementById('bs-hist-b').style.height = pB + '%';
  document.getElementById('bs-pct-a').textContent = total ? Math.round(pA) + '%' : '—';
  document.getElementById('bs-pct-b').textContent = total ? Math.round(pB) + '%' : '—';
  document.getElementById('beamsplitter-trial-count').textContent = total ? `· ${total} photons` : '';
}

function resetBeamSplitter() {
  bsCountA = 0; bsCountB = 0;
  bsClearScreenMarks();
  updateBeamSplitterHistogram();
  document.getElementById('beamsplitter-result').textContent = '—';
  setExplainer('beamsplitter-explainer', 'A photon is about to launch toward the beam splitter. Fire it and watch which detector clicks.');
}


// ════════ js/tabs/stern-gerlach-tab.js ════════
// Depends on: core/tab-registry.js (registerTab), core/dom-utils.js
// (pulseElement, setExplainer). One simulation, one magnet, drawn once —
// a "Number of magnets" toggle decides what feeds into it and how its
// outcome is decided, rather than adding a second magnet to the diagram:
//   1 magnet:  atoms come from the oven with an adjustable input angle θ
//              (the same Bloch-sphere θ used on the Bits & Qubits/State
//              Vector tabs); firing lands Up with probability cos²(θ/2)
//              and Down with sin²(θ/2), the same Born-rule split already
//              taught on the Measure tab, just with a physical stand-in
//              (a silver atom's spin) for "the qubit". #sg-intake-group
//              (oven + slits) is shown, #sg-prepared-group is hidden.
//   2 magnets: atoms instead come from a static "prepared: spin ↑ (Z),
//              down blocked" box — the textbook sequential-SG setup
//              asserts this first-magnet output rather than simulating
//              it — and the same magnet's axis toggles Z/X. Same axis as
//              preparation is deterministic (100% "+"); a different,
//              incompatible axis re-randomizes the result (50/50), even
//              though the incoming spin was perfectly definite a moment
//              before. #sg-prepared-group is shown, #sg-intake-group is
//              hidden.
// The magnet itself, the ghost paths, and both detectors are drawn once
// and never move — only their captions/labels/symbols change (see
// sgApplyMode()) — so firing, the tally, and the explainer all stay the
// same elements regardless of which mode is selected. No qubit/Bloch
// state object involved despite reusing the θ convention — like
// beam-splitter-tab.js, this is a plain probability animation with its
// own small bit of local state.

let sgMagnetCount = 1; // 1 or 2
let sgTheta = 0;       // radians, 0..π — only meaningful in 1-magnet mode
let sg2Axis = 'z';     // 'z' (same as preparation, deterministic) or 'x' (incompatible, 50/50) — only meaningful in 2-magnet mode
let sgCountA = 0, sgCountB = 0, sgAnimating = false;

const SG_SOURCE   = { x: 56,  y: 170 };
const SG_SPLIT    = { x: 600, y: 170 };
const SG_DET_UP   = { x: 770, y: 80  };
const SG_DET_DOWN = { x: 770, y: 260 };
const SG_MARK_MAX = 140; // caps SVG node count on the accumulation plates; oldest mark is dropped past this

function sgProbUp(theta)   { return Math.cos(theta / 2) ** 2; }
function sgProbDown(theta) { return Math.sin(theta / 2) ** 2; }

/** Sum of three uniforms, centered on 0 and clamped to ±spread — a cheap
 *  stand-in for a normal distribution (no need for true Box-Muller here)
 *  so accumulated marks cluster toward the detector center and thin out
 *  toward the edges, the way a real photographic plate's exposure does,
 *  rather than landing uniformly across the housing. */
function sgJitter(spread) {
  return ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 2 * spread;
}

/** Appends one small dot to the "up" or "down" detector's accumulation
 *  plate at a jittered position — the actual realism upgrade here: the
 *  real 1922 plate showed two banana-shaped smudges built up from many
 *  atoms, not a single point, so a single hit alone (the .sg-ping/
 *  .sg-flash click feedback) undersells the experiment. Oldest mark is
 *  dropped past SG_MARK_MAX so the SVG doesn't grow unbounded over a
 *  long session. */
function sgAddScreenMark(isUp) {
  const group  = document.getElementById(isUp ? 'sg-marks-up' : 'sg-marks-down');
  const center = isUp ? SG_DET_UP : SG_DET_DOWN;
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('class', 'sg-mark');
  circle.setAttribute('cx', center.x + sgJitter(24));
  circle.setAttribute('cy', center.y + sgJitter(16));
  circle.setAttribute('r', 1.5 + Math.random() * 1.2);
  circle.setAttribute('fill', isUp ? 'var(--zero)' : 'var(--one)');
  circle.setAttribute('opacity', 0.4 + Math.random() * 0.25);
  group.appendChild(circle);
  if (group.childElementCount > SG_MARK_MAX) group.removeChild(group.firstElementChild);
}

/** Wipes both accumulation plates — called alongside every tally reset
 *  (Reset button, mode switch, axis switch), since a plate mixing marks
 *  from two different configurations (different θ, or Z vs X axis) would
 *  be exactly as physically meaningless as a mixed tally. */
function sgClearScreenMarks() {
  document.getElementById('sg-marks-up').replaceChildren();
  document.getElementById('sg-marks-down').replaceChildren();
}

/** Reads the θ slider and refreshes the live theoretical P(↑)/P(↓)
 *  display (the .prob-rows bars) — distinct from the empirical detector
 *  tally histogram below it, which only updates when atoms are actually
 *  fired. Deliberately doesn't touch the tally, so moving the slider
 *  lets you compare "what theory predicts now" against "what you've
 *  measured so far" without losing earlier trials. */
function updateSGThetaDisplay() {
  const raw = parseInt(document.getElementById('sg-theta-slider').value, 10);
  sgTheta = raw / 1000;
  const deg = Math.round(sgTheta * 180 / Math.PI);
  document.getElementById('sg-theta-val').textContent = deg + '°';

  const pUp = sgProbUp(sgTheta) * 100;
  const pDown = 100 - pUp;
  document.getElementById('sg-fill-up').style.width = pUp + '%';
  document.getElementById('sg-fill-down').style.width = pDown + '%';
  document.getElementById('sg-pct-up-live').textContent = Math.round(pUp) + '%';
  document.getElementById('sg-pct-down-live').textContent = Math.round(pDown) + '%';
}

function sgLerp(a, b, t) { return a + (b - a) * t; }

/** Moves `el` (a <g>, translated as a group so the glow halo and bright
 *  core move together) from (x0,y0) to (x1,y1) over `duration` ms,
 *  interpolating opacity from op0 to op1 at the same time — identical
 *  shape to beam-splitter-tab.js's bsAnimateMove(), reused here under a
 *  different name for both the atom and its ghost. */
function sgAnimateMove(el, x0, y0, x1, y1, op0, op1, duration, cb) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    el.setAttribute('transform', `translate(${sgLerp(x0, x1, t)},${sgLerp(y0, y1, t)})`);
    el.setAttribute('opacity', sgLerp(op0, op1, t));
    if (t < 1) requestAnimationFrame(step);
    else cb();
  }
  requestAnimationFrame(step);
}

function fireSGAtom() {
  if (sgAnimating) return;
  sgAnimating = true;
  document.getElementById('btn-fire-atom').disabled = true;
  document.getElementById('sg-result').textContent = t('sterngerlach.resultTravelling', 'traveling…');

  const atom  = document.getElementById('sg-atom');
  const ghost = document.getElementById('sg-atom-ghost');

  sgAnimateMove(atom, SG_SOURCE.x, SG_SOURCE.y, SG_SPLIT.x, SG_SPLIT.y, 1, 1, 450, () => {
    // Decided at the magnet, from whatever θ/axis is dialed in right
    // now — not captured back at fire time — so changing a control
    // mid-flight (rare, but possible) still resolves against the
    // current odds.
    const isUp = sgMagnetCount === 1
      ? Math.random() < sgProbUp(sgTheta)
      : (sg2Axis === 'z' ? true : Math.random() < 0.5);
    const winTarget  = isUp ? SG_DET_UP : SG_DET_DOWN;
    const loseTarget = isUp ? SG_DET_DOWN : SG_DET_UP;

    sgAnimateMove(ghost, SG_SPLIT.x, SG_SPLIT.y, loseTarget.x, loseTarget.y, 0.55, 0, 450, () => {
      ghost.setAttribute('opacity', 0);
    });

    sgAnimateMove(atom, SG_SPLIT.x, SG_SPLIT.y, winTarget.x, winTarget.y, 1, 1, 450, () => {
      atom.setAttribute('opacity', 0);
      const ping  = document.getElementById(isUp ? 'sg-ping-up' : 'sg-ping-down');
      const flash = document.getElementById(isUp ? 'sg-flash-up' : 'sg-flash-down');
      pulseElement(ping, 'active', 650);
      flash.setAttribute('opacity', 0.5);
      setTimeout(() => flash.setAttribute('opacity', 0), 400);
      sgAddScreenMark(isUp);

      if (isUp) sgCountA++; else sgCountB++;
      if (sgMagnetCount === 1) {
        document.getElementById('sg-result').textContent = isUp
          ? t('sterngerlach.resultUp', 'Up detector clicked')
          : t('sterngerlach.resultDown', 'Down detector clicked');
        setExplainer('sg-explainer', isUp
          ? t('sterngerlach.explainerUp', 'Up detector clicked — one of exactly two possible outcomes, never a partial deflection. Fire again and the same atom state can still land Down; only the odds are fixed, not any single result.')
          : t('sterngerlach.explainerDown', 'Down detector clicked — one of exactly two possible outcomes, never a partial deflection. Fire again and the same atom state can still land Up; only the odds are fixed, not any single result.'));
      } else {
        document.getElementById('sg-result').textContent = isUp
          ? t('sterngerlach.result2Plus', '"+" detector clicked')
          : t('sterngerlach.result2Minus', '"−" detector clicked');
        setExplainer('sg-explainer', sg2Axis === 'z'
          ? t('sterngerlach.explainer2Z', 'Measuring the same axis twice in a row just confirms the earlier result — no surprise here. Fire again as many times as you like: it will always land "+".')
          : t('sterngerlach.explainer2X', 'Even though this atom had a perfectly definite spin along Z, measuring a different, incompatible axis (X) erased that information and produced a fresh, genuinely random result. This is the heart of the Stern–Gerlach discovery: measuring one property can disturb another that doesn\'t commute with it.'));
      }
      updateSGHistogram();

      sgAnimating = false;
      document.getElementById('btn-fire-atom').disabled = false;
    });
  });
}

function updateSGHistogram() {
  const total = sgCountA + sgCountB;
  const pA = total ? (sgCountA / total) * 100 : 0;
  const pB = total ? (sgCountB / total) * 100 : 0;
  document.getElementById('sg-hist-up').style.height = pA + '%';
  document.getElementById('sg-hist-down').style.height = pB + '%';
  document.getElementById('sg-pct-up').textContent = total ? Math.round(pA) + '%' : '—';
  document.getElementById('sg-pct-down').textContent = total ? Math.round(pB) + '%' : '—';
  document.getElementById('sg-trial-count').textContent = total ? t('sterngerlach.trialCount', '· {count} atoms').replace('{count}', total) : '';
}

function sgDefaultExplainer() {
  if (sgMagnetCount === 1) return t('sterngerlach.explainerDefault', 'An atom is about to enter the magnet. Fire it and watch which detector clicks.');
  return sg2Axis === 'z'
    ? t('sterngerlach.sequentialExplainerZ', 'Same axis as before — fire an atom to confirm it always lands the same way.')
    : t('sterngerlach.sequentialExplainerX', 'A different axis this time — fire an atom to see what happens to a spin that was already definite along Z.');
}

/** Relabels the magnet caption, the detector symbols/captions, and the
 *  tally's ket glyphs to match the current mode/axis — the one place
 *  that keeps the shared SVG elements in sync with sgMagnetCount /
 *  sg2Axis. */
function sgUpdateCaptions() {
  const seq = sgMagnetCount === 2;
  document.getElementById('sg-magnet-caption').textContent = !seq
    ? t('sterngerlach.magnetLabel', 'Inhomogeneous field')
    : (sg2Axis === 'z' ? t('sterngerlach.magnet2AxisZ', 'Magnet 2 — Z axis') : t('sterngerlach.magnet2AxisX', 'Magnet 2 — X axis'));

  const symUp = seq ? '+' : '↑', symDown = seq ? '−' : '↓';
  document.getElementById('sg-det-up-symbol').textContent = symUp;
  document.getElementById('sg-det-down-symbol').textContent = symDown;
  document.getElementById('sg-det-up-caption').textContent = seq
    ? t('sterngerlach.detectorPlus', '"+" detector') : t('sterngerlach.detectorUp', 'Up detector');
  document.getElementById('sg-det-down-caption').textContent = seq
    ? t('sterngerlach.detectorMinus', '"−" detector') : t('sterngerlach.detectorDown', 'Down detector');
  document.getElementById('sg-tally-sym-up').textContent = symUp;
  document.getElementById('sg-tally-sym-down').textContent = symDown;
}

function setSGMagnetCount(n) {
  sgMagnetCount = n;
  document.querySelectorAll('.mode-btn[data-sg-magnets]').forEach(btn =>
    btn.classList.toggle('active', Number(btn.dataset.sgMagnets) === n));
  document.getElementById('sg-theta-block').style.display = n === 1 ? '' : 'none';
  document.getElementById('sg-axis-block').style.display  = n === 2 ? '' : 'none';
  document.getElementById('sg-intake-group').style.display   = n === 1 ? '' : 'none';
  document.getElementById('sg-prepared-group').style.display = n === 2 ? '' : 'none';

  sgUpdateCaptions();
  sgCountA = 0; sgCountB = 0;
  sgClearScreenMarks();
  updateSGHistogram();
  document.getElementById('sg-result').textContent = '—';
  setExplainer('sg-explainer', sgDefaultExplainer());
}

/** Switches the magnet's axis (2-magnet mode only), re-labels its
 *  caption, resets the tally (mixing Z-axis and X-axis trials in one
 *  histogram would be physically meaningless — they're two different
 *  experiments), and resets the explainer to describe what's about to
 *  happen rather than what already did. */
function setSG2Axis(axis) {
  sg2Axis = axis;
  document.querySelectorAll('.mode-btn[data-sg-axis]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.sgAxis === axis));
  sgUpdateCaptions();

  sgCountA = 0; sgCountB = 0;
  sgClearScreenMarks();
  updateSGHistogram();
  document.getElementById('sg-result').textContent = '—';
  setExplainer('sg-explainer', sgDefaultExplainer());
}

function resetSternGerlach() {
  sgCountA = 0; sgCountB = 0;
  sgClearScreenMarks();
  updateSGHistogram();
  document.getElementById('sg-result').textContent = '—';
  setExplainer('sg-explainer', sgDefaultExplainer());
}

/** Clears any atom left mid-flight from a switch-away — same reasoning
 *  as beam-splitter-tab.js's resetBeamSplitterPhoton(): the animation is
 *  short enough (900ms) that canceling mid-flight on tab-leave isn't
 *  worth an onLeave hook, but revisiting the tab should never show a
 *  frozen atom stuck partway down a path. Doesn't touch the tally — that
 *  only resets via the Reset button or a mode/axis switch. */
function resetSternGerlachAtoms() {
  ['sg-atom', 'sg-atom-ghost'].forEach(id =>
    document.getElementById(id).setAttribute('opacity', 0));
  sgAnimating = false;
  document.getElementById('btn-fire-atom').disabled = false;
}

function initSternGerlachTab() {
  document.getElementById('sg-theta-slider').addEventListener('input', updateSGThetaDisplay);
  document.getElementById('btn-fire-atom').addEventListener('click', fireSGAtom);
  document.getElementById('btn-reset-sterngerlach').addEventListener('click', resetSternGerlach);

  document.querySelectorAll('.mode-btn[data-sg-magnets]').forEach(btn =>
    btn.addEventListener('click', () => setSGMagnetCount(Number(btn.dataset.sgMagnets))));
  document.querySelectorAll('.mode-btn[data-sg-axis]').forEach(btn =>
    btn.addEventListener('click', () => setSG2Axis(btn.dataset.sgAxis)));

  updateSGThetaDisplay();
  setSGMagnetCount(1);
  registerTab('sterngerlach', { onEnter: resetSternGerlachAtoms });
}


// ════════ js/tabs/teleport-tab.js ════════
// Depends on: app.js state (qubitTeleportMsg, rendererTeleportAlice,
// rendererTeleportBob), core/three-qubit.js (ThreeQubitState, including
// measureQubit() — added specifically for this tab), core/gates.js
// (GATES), core/qubit.js (Qubit, blochVectorLabel), core/utils.js
// (delay()), core/dom-utils.js (setExplainer), core/tab-registry.js
// (registerTab), qubit-tab.js (highlightMatchingPreset — a plain global,
// reused as-is).
//
// PROTOCOL (verified against 500+ random states + all 4 measurement
// branches with a standalone script before this UI was built — see the
// derivation below for why the correction is m0→Z, m1→X, applied
// Z-then-X):
//   1. Alice's message qubit (q0) is set directly from qubitTeleportMsg's
//      amplitudes; q1 (Alice's half of the pair) and q2 (Bob's half)
//      start at |0⟩.
//   2. H(q1); CNOT(q1→q2) — entangles q1/q2 into a Bell pair, in advance,
//      before any message exists. Tracing out q0 and q1, q2's reduced
//      Bloch vector is now (0,0,0): maximally mixed, genuinely carrying
//      zero information on its own.
//   3. CNOT(q0→q1); H(q0) — puts q0 and q1 into the Bell basis. Expanding
//      the state out by hand (see the comment in fireTeleport() below)
//      shows q2's four possible reduced states, one per (m0,m1) outcome,
//      are exactly I/X/Z/ZX applied to the original message — q2 is
//      still fully mixed from Bob's point of view, but the correlation
//      to fix it is now sitting in q0/q1, waiting to be read out.
//   4. Measure q0→m0, q1→m1 (ThreeQubitState.measureQubit(), a real
//      Born-rule collapse). q2 collapses too, to a definite but
//      (usually) wrong state — Bob's reduced Bloch vector jumps from the
//      origin to the sphere's surface, just not at ψ yet.
//   5. Alice sends m0,m1 to Bob classically. Bob applies Z if m0=1, then
//      X if m1=1 (in that order — the m0=m1=1 branch works out to ZX·ψ,
//      not XZ·ψ, up to an unobservable global phase either way, but only
//      Z-then-X reproduces ψ exactly with no stray phase). q2 now equals
//      the original message exactly.

let teleportAnimating = false;
let teleportCounts = { '00': 0, '01': 0, '10': 0, '11': 0 };
const TELEPORT_STEP_MS = 750;

function setTeleportAliceState(theta, phi) {
  qubitTeleportMsg.setState(theta, phi);
  document.getElementById('sl-teleport-theta').value = Math.round(theta * 1000);
  document.getElementById('sl-teleport-phi').value   = Math.round(phi   * 1000);
  updateTeleportAliceUI();
}

function teleportSliderUpdate() {
  const theta = parseInt(document.getElementById('sl-teleport-theta').value, 10) / 1000;
  const phi   = parseInt(document.getElementById('sl-teleport-phi').value, 10)   / 1000;
  qubitTeleportMsg.setState(theta, phi);
  updateTeleportAliceUI();
}

function updateTeleportAliceUI() {
  const b = qubitTeleportMsg.getBloch();
  rendererTeleportAlice.animateTo(b.x, b.y, b.z, qubitTeleportMsg.getLabel());
  document.getElementById('bloch-teleport-alice').setAttribute('aria-label',
    `Bloch sphere for Alice's message qubit. State: ${qubitTeleportMsg.getFormula()}. Draggable, or focus and use arrow keys, to set its state.`);
  document.getElementById('label-teleport-alice').textContent   = qubitTeleportMsg.getLabel();
  document.getElementById('formula-teleport-alice').textContent = qubitTeleportMsg.getFormula();
  document.getElementById('val-teleport-theta').textContent = Math.round(b.theta * 180 / Math.PI) + '°';
  document.getElementById('val-teleport-phi').textContent   = Math.round(b.phi   * 180 / Math.PI) + '°';
  highlightMatchingPreset(document.querySelectorAll('[data-teleport-preset]'), b.theta, b.phi);
}

/** Draws Bob's sphere from a raw (x,y,z) — a length near 0 (the origin)
 *  means "genuinely undetermined right now", not just "|0⟩", so it's
 *  labeled and captioned as such rather than reusing Qubit's own
 *  labeling (which assumes a unit-length vector). Anything else is
 *  reconstructed into a temporary Qubit via its θ/φ so the formula line
 *  reads exactly like Alice's, for a direct side-by-side comparison. */
function updateTeleportBobSphere(bloch, animate) {
  const r = Math.hypot(bloch.x, bloch.y, bloch.z);
  let label, formula;
  if (r < 0.05) {
    label = '?';
    formula = t('teleport.bobFormulaUndetermined', '|ψ⟩ = ?');
  } else {
    const theta = Math.acos(Math.max(-1, Math.min(1, bloch.z / r)));
    const phi = ((Math.atan2(bloch.y, bloch.x) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const tmp = new Qubit();
    tmp.setState(theta, phi);
    label = tmp.getLabel();
    formula = tmp.getFormula();
  }
  if (animate) rendererTeleportBob.animateTo(bloch.x, bloch.y, bloch.z, label);
  else rendererTeleportBob.draw(bloch.x, bloch.y, bloch.z, label);
  document.getElementById('label-teleport-bob').textContent = label;
  document.getElementById('formula-teleport-bob').textContent = formula;
}

/** One-shot spotlight on a protocol stage — .active plays a single 0.7s
 *  glow (see .teleport-stage.active in teleport.css), then gets removed
 *  so the next run can retrigger it; unlike Bell States' circuit, this
 *  diagram is illustrating one event playing out, not an always-flowing
 *  recipe. */
function pulseStage(id) {
  const el = document.getElementById(id);
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 700);
}

function updateTeleportHistogram() {
  const total = Object.values(teleportCounts).reduce((a, b) => a + b, 0);
  ['00', '01', '10', '11'].forEach(k => {
    const pct = total ? (teleportCounts[k] / total) * 100 : 0;
    document.getElementById(`teleport-hist-${k}`).style.height = pct + '%';
    document.getElementById(`teleport-pct-${k}`).textContent = total ? Math.round(pct) + '%' : '—';
  });
  document.getElementById('teleport-trial-count').textContent = total
    ? t('teleport.trialCount', '· {count} runs').replace('{count}', total) : '';
}

async function fireTeleport() {
  if (teleportAnimating) return;
  teleportAnimating = true;
  document.getElementById('btn-teleport').disabled = true;
  document.getElementById('teleport-result').textContent = t('teleport.resultRunning', 'running…');

  document.getElementById('teleport-m0').textContent = '?';
  document.getElementById('teleport-m1').textContent = '?';
  document.getElementById('teleport-m0').classList.remove('set');
  document.getElementById('teleport-m1').classList.remove('set');
  document.getElementById('teleport-gate-z').classList.add('circuit-gate-off');
  document.getElementById('teleport-gate-x').classList.add('circuit-gate-off');
  document.getElementById('teleport-bob-desc').textContent = t('teleport.bobDescEntangled', 'Entangled with Alice — undetermined on its own');

  const state = new ThreeQubitState();
  state.amps[0] = { ...qubitTeleportMsg.alpha }; // |000>
  state.amps[4] = { ...qubitTeleportMsg.beta };  // |100>

  // Stage 1 — create the entangled pair
  pulseStage('teleport-stage-pair');
  setExplainer('teleport-explainer', t('teleport.stepPair', 'Alice and Bob share an entangled pair, prepared before any message existed.'));
  await delay(TELEPORT_STEP_MS);
  state.applySingleQubitGate(1, GATES.H.matrix);
  state.applyCNOT(1, 2);
  updateTeleportBobSphere(state.getSingleQubitBloch(2), true);

  // Stage 2 — Alice puts her message qubit into the Bell basis with her
  // half of the pair
  pulseStage('teleport-stage-bellmeas');
  setExplainer('teleport-explainer', t('teleport.stepBell', "Alice entangles her message qubit with her half of the pair — this reads ψ out against the entanglement, it doesn't copy it."));
  await delay(TELEPORT_STEP_MS);
  state.applyCNOT(0, 1);
  state.applySingleQubitGate(0, GATES.H.matrix);
  updateTeleportBobSphere(state.getSingleQubitBloch(2), true); // still the origin — no news for Bob yet

  // Stage 3 — measure both of Alice's qubits
  pulseStage('teleport-stage-measure');
  setExplainer('teleport-explainer', t('teleport.stepMeasure', "Alice measures both her qubits, collapsing them to two genuinely random classical bits — and collapsing Bob's qubit to a definite state in the same instant."));
  await delay(TELEPORT_STEP_MS);
  const m0 = state.measureQubit(0);
  const m1 = state.measureQubit(1);
  document.getElementById('teleport-m0').textContent = m0;
  document.getElementById('teleport-m1').textContent = m1;
  document.getElementById('teleport-m0').classList.add('set');
  document.getElementById('teleport-m1').classList.add('set');
  document.getElementById('teleport-bob-desc').textContent = t('teleport.bobDescWrong', "Definite now, but not yet ψ — waiting on Alice's bits");
  updateTeleportBobSphere(state.getSingleQubitBloch(2), true);

  // Stage 4 — send the classical bits, then Bob corrects
  document.getElementById('teleport-cwire-0').classList.add('sending');
  document.getElementById('teleport-cwire-1').classList.add('sending');
  setExplainer('teleport-explainer', t('teleport.stepSend', "Alice sends her two classical bits to Bob — an ordinary channel, no faster than light. He conditionally applies Z and/or X to fix his qubit up."));
  await delay(TELEPORT_STEP_MS);
  document.getElementById('teleport-cwire-0').classList.remove('sending');
  document.getElementById('teleport-cwire-1').classList.remove('sending');
  document.getElementById('teleport-gate-z').classList.toggle('circuit-gate-off', m0 !== 1);
  document.getElementById('teleport-gate-x').classList.toggle('circuit-gate-off', m1 !== 1);
  if (m0 === 1) state.applySingleQubitGate(2, GATES.Z.matrix);
  if (m1 === 1) state.applySingleQubitGate(2, GATES.X.matrix);
  document.getElementById('teleport-bob-desc').textContent = t('teleport.bobDescMatch', "Matches Alice's message exactly");
  updateTeleportBobSphere(state.getSingleQubitBloch(2), true);

  const key = `${m0}${m1}`;
  teleportCounts[key]++;
  updateTeleportHistogram();
  document.getElementById('teleport-result').textContent = t('teleport.resultDone', 'Teleportation complete');
  setExplainer('teleport-explainer',
    t('teleport.stepDone', "Bob's qubit now equals Alice's original message exactly — teleported, not cloned: her own qubit was destroyed by measurement back in step 2, so the no-cloning theorem stays intact. Alice never learned ψ either; she just relayed two random bits, m₀={m0}, m₁={m1}, that happened to be exactly what Bob needed.")
      .replace('{m0}', m0).replace('{m1}', m1));

  teleportAnimating = false;
  document.getElementById('btn-teleport').disabled = false;
}

function resetTeleport() {
  teleportCounts = { '00': 0, '01': 0, '10': 0, '11': 0 };
  updateTeleportHistogram();
  document.getElementById('teleport-m0').textContent = '?';
  document.getElementById('teleport-m1').textContent = '?';
  document.getElementById('teleport-m0').classList.remove('set');
  document.getElementById('teleport-m1').classList.remove('set');
  document.getElementById('teleport-gate-z').classList.add('circuit-gate-off');
  document.getElementById('teleport-gate-x').classList.add('circuit-gate-off');
  document.getElementById('teleport-result').textContent = '—';
  document.getElementById('teleport-bob-desc').textContent = t('teleport.bobDescWaiting', 'Not entangled yet — press Teleport');
  updateTeleportBobSphere({ x: 0, y: 0, z: 0 }, false);
  setExplainer('teleport-explainer', t('teleport.explainerDefault', "Set Alice's message state above, then press Teleport. Watch Bob's sphere: it starts undetermined, jumps to some definite but wrong point the instant Alice measures, then snaps to match Alice's exactly once her classical bits arrive and Bob corrects for them."));
}

function initTeleportTab() {
  document.getElementById('sl-teleport-theta').addEventListener('input', teleportSliderUpdate);
  document.getElementById('sl-teleport-phi').addEventListener('input', teleportSliderUpdate);
  document.querySelectorAll('[data-teleport-preset]').forEach(btn => {
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => setTeleportAliceState(theta, phi));
  });
  document.getElementById('btn-teleport').addEventListener('click', fireTeleport);
  document.getElementById('btn-reset-teleport').addEventListener('click', resetTeleport);

  updateTeleportAliceUI();
  updateTeleportBobSphere({ x: 0, y: 0, z: 0 }, false);
  updateTeleportHistogram();
  registerTab('teleport', {});
}


// ════════ js/tabs/superdense-tab.js ════════
// Depends on: core/two-qubit.js (TwoQubitState, including measureQubit()
// — added specifically for this tab, mirroring three-qubit.js's own
// addition for Teleport), core/gates.js (GATES), core/utils.js (delay()),
// core/dom-utils.js (setExplainer), core/tab-registry.js (registerTab).
//
// PROTOCOL (verified computationally for all 4 messages, exact 0/1
// probabilities, before this UI was built — see the standalone script's
// output: every message decodes to itself with certainty):
//   1. H(q0); CNOT(q0→q1) — the same Bell-pair creation Teleport uses.
//   2. Alice encodes her 2-bit message (b0,b1) onto q0 alone: X if b1=1,
//      then Z if b0=1. The four (b0,b1) choices land the pair on the
//      four Bell states Φ+/Ψ+/Φ-/Ψ- respectively — mutually orthogonal,
//      which is exactly what makes them perfectly distinguishable later.
//   3. Alice physically sends q0 to Bob — the one step with no classical
//      substitute; a real qubit has to travel for this protocol to work.
//   4. Bob, now holding both qubits, runs CNOT(q0→q1) then H(q0) — the
//      same Bell-basis circuit Teleport's Alice used on her side, just
//      run by the receiver here instead of the sender — then measures
//      both qubits (TwoQubitState.measureQubit()) to read (b0,b1) back
//      exactly. Because the state landed on one of 4 mutually orthogonal
//      basis states, that "measurement" has probability 1 at a single
//      outcome — a real Born-rule draw, just over a distribution with no
//      actual uncertainty left in it.

let superdenseMsg = '00';
let superdenseAnimating = false;
let superdenseSentCount = 0;
let superdenseMatchCount = 0;
const SUPERDENSE_STEP_MS = 700;

/** Toggles which encode gates are shown live, the moment a message is
 *  picked — unlike Teleport's correction gates (which can't be known
 *  until after a random measurement), superdense coding's encoding is
 *  chosen up front, so the preview doesn't need to wait for Send. */
function setSuperdenseMessage(msg) {
  superdenseMsg = msg;
  const b0 = msg[0], b1 = msg[1];
  document.querySelectorAll('[data-superdense-msg]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.superdenseMsg === msg));
  document.getElementById('superdense-gate-x').classList.toggle('circuit-gate-off', b1 !== '1');
  document.getElementById('superdense-gate-z').classList.toggle('circuit-gate-off', b0 !== '1');
  document.getElementById('superdense-sent-val').textContent = msg;
  document.getElementById('superdense-received-val').textContent = '?';
  document.getElementById('superdense-received-val').classList.remove('set');
}

function updateSuperdenseTally() {
  document.getElementById('superdense-tally-text').textContent = superdenseSentCount
    ? t('superdense.tally', '{sent} sent · {match}/{sent} decoded correctly')
        .replace('{sent}', superdenseSentCount).replace('{match}', superdenseMatchCount).replace('{sent}', superdenseSentCount)
    : '';
}

async function sendSuperdense() {
  if (superdenseAnimating) return;
  superdenseAnimating = true;
  document.getElementById('btn-superdense-send').disabled = true;
  document.getElementById('superdense-result').textContent = t('superdense.resultRunning', 'running…');
  document.getElementById('superdense-received-val').textContent = '?';
  document.getElementById('superdense-received-val').classList.remove('set');

  const b0 = superdenseMsg[0] === '1' ? 1 : 0;
  const b1 = superdenseMsg[1] === '1' ? 1 : 0;

  pulseStage('superdense-stage-pair');
  setExplainer('superdense-explainer', t('superdense.stepPair', 'Alice and Bob share an entangled pair, prepared in advance.'));
  await delay(SUPERDENSE_STEP_MS);
  const state = new TwoQubitState();
  state.applySingleQubitGate(0, GATES.H.matrix);
  state.applyCNOT(0, 1);

  setExplainer('superdense-explainer', t('superdense.stepEncode', 'Alice encodes her message onto her own qubit alone — Bob\'s half of the pair is never touched.'));
  await delay(SUPERDENSE_STEP_MS);
  if (b1 === 1) state.applySingleQubitGate(0, GATES.X.matrix);
  if (b0 === 1) state.applySingleQubitGate(0, GATES.Z.matrix);

  document.getElementById('superdense-channel').classList.add('sending');
  setExplainer('superdense-explainer', t('superdense.stepSend', 'Alice physically sends that one qubit to Bob over a real quantum channel — the one step with no classical substitute.'));
  await delay(SUPERDENSE_STEP_MS);
  document.getElementById('superdense-channel').classList.remove('sending');

  pulseStage('superdense-stage-decode');
  setExplainer('superdense-explainer', t('superdense.stepDecode', 'Bob, now holding both qubits, runs the same Bell-basis circuit Teleport\'s Alice used — a CNOT then a Hadamard — to tell the four possible messages apart.'));
  await delay(SUPERDENSE_STEP_MS);
  state.applyCNOT(0, 1);
  state.applySingleQubitGate(0, GATES.H.matrix);

  pulseStage('superdense-stage-measure');
  setExplainer('superdense-explainer', t('superdense.stepMeasure', 'Bob measures both qubits and reads off Alice\'s exact two bits.'));
  await delay(SUPERDENSE_STEP_MS);
  const d0 = state.measureQubit(0);
  const d1 = state.measureQubit(1);
  const received = `${d0}${d1}`;
  const match = received === superdenseMsg;

  document.getElementById('superdense-received-val').textContent = received;
  document.getElementById('superdense-received-val').classList.add('set');
  superdenseSentCount++;
  if (match) superdenseMatchCount++;
  updateSuperdenseTally();

  document.getElementById('superdense-result').textContent = match
    ? t('superdense.resultMatch', 'Decoded exactly right')
    : t('superdense.resultMismatch', 'Mismatch — check the console, this should never happen');
  setExplainer('superdense-explainer', t('superdense.stepDone', 'Bob decoded {received} — exactly what Alice sent, {sent}. Nothing here was random: the four possible messages land on four mutually orthogonal states, so Bob\'s measurement has zero uncertainty left in it once the qubit arrives.')
    .replace('{received}', received).replace('{sent}', superdenseMsg));

  superdenseAnimating = false;
  document.getElementById('btn-superdense-send').disabled = false;
}

function resetSuperdense() {
  superdenseSentCount = 0;
  superdenseMatchCount = 0;
  updateSuperdenseTally();
  document.getElementById('superdense-received-val').textContent = '?';
  document.getElementById('superdense-received-val').classList.remove('set');
  document.getElementById('superdense-result').textContent = '—';
  setExplainer('superdense-explainer', t('superdense.explainerDefault', "Pick a 2-bit message above, then press Send. Watch Alice encode it onto her own qubit alone, physically hand that one qubit to Bob, and Bob decode both bits back out exactly — nothing here is random."));
}

function initSuperdenseTab() {
  document.querySelectorAll('[data-superdense-msg]').forEach(btn =>
    btn.addEventListener('click', () => setSuperdenseMessage(btn.dataset.superdenseMsg)));
  document.getElementById('btn-superdense-send').addEventListener('click', sendSuperdense);
  document.getElementById('btn-reset-superdense').addEventListener('click', resetSuperdense);

  setSuperdenseMessage('00');
  updateSuperdenseTally();
  registerTab('superdense', {});
}


// ════════ js/tabs/noise-tab.js ════════
// Depends on: app.js state (qubitNoise, rendererNoise), core/qubit.js
// (Qubit, blochVectorLabel), core/complex.js (C.fmt), core/dom-utils.js
// (setExplainer), core/tab-registry.js (registerTab). Registers onEnter/
// onLeave hooks that start/pause the rAF loop, same pattern as
// tunneling-tab.js.
//
// PHYSICS: the standard phenomenological T1/T2 (Bloch-Redfield) decay
// law — the same equations behind real NMR/ESR and superconducting-
// qubit coherence-time measurements, not a made-up animation curve:
//   x(t) = x0 e^(-t/T2eff),  y(t) = y0 e^(-t/T2eff),
//   z(t) = 1 + (z0 - 1) e^(-t/T1)
// z relaxes toward +1 (the |0⟩ ground state) — the standard "cold bath"
// convention. T2eff = min(T2, 2·T1): a real physical constraint
// (dephasing can never be slower than what energy relaxation alone
// implies), enforced here rather than just asserted in the copy. A
// shrinking Bloch vector is already this app's own convention for "mixed
// state" (see two-qubit.js/three-qubit.js's getSingleQubitBloch() for
// entangled qubits) — decoherence needed no new state representation,
// just this one new time-evolution law layered on top of it.

let noiseX0 = 0, noiseY0 = 1, noiseZ0 = 0; // initial Bloch vector, refreshed by noiseRestart()
let noiseT1 = 80, noiseT2 = 60;            // microseconds
let noiseElapsed = 0;                      // simulated microseconds since last restart
let noisePlaying = true;
let noiseSettled = false;
let noiseAnimId = null;
let noiseLastFrameTime = null;
const NOISE_US_PER_SEC = 40; // simulated-μs per real second — tuned so a ~80μs T1 visibly settles in a handful of seconds

function noiseT2Eff() { return noiseT2EffOf(noiseT1, noiseT2); }

function noiseCompute(t) {
  return noiseComputeAt(t, { x0: noiseX0, y0: noiseY0, z0: noiseZ0, t1: noiseT1, t2: noiseT2 });
}

function setNoiseInitialState(theta, phi) {
  qubitNoise.setState(theta, phi);
  document.getElementById('sl-noise-theta').value = Math.round(theta * 1000);
  document.getElementById('sl-noise-phi').value   = Math.round(phi   * 1000);
  document.getElementById('val-noise-theta').textContent = Math.round(theta * 180 / Math.PI) + '°';
  document.getElementById('val-noise-phi').textContent   = Math.round(phi   * 180 / Math.PI) + '°';
  highlightMatchingPreset(document.querySelectorAll('[data-noise-preset]'), theta, phi);
  noiseRestart();
}

function noiseThetaPhiSliderUpdate() {
  const theta = parseInt(document.getElementById('sl-noise-theta').value, 10) / 1000;
  const phi   = parseInt(document.getElementById('sl-noise-phi').value, 10)   / 1000;
  setNoiseInitialState(theta, phi);
}

function noiseT1SliderUpdate() {
  noiseT1 = parseInt(document.getElementById('sl-noise-t1').value, 10);
  document.getElementById('val-noise-t1').textContent = noiseT1 + ' μs';
  noiseUpdateCapNote();
  noiseRestart();
}

function noiseT2SliderUpdate() {
  noiseT2 = parseInt(document.getElementById('sl-noise-t2').value, 10);
  document.getElementById('val-noise-t2').textContent = noiseT2 + ' μs';
  noiseUpdateCapNote();
  noiseRestart();
}

function noiseUpdateCapNote() {
  const eff = noiseT2Eff();
  const note = document.getElementById('noise-t2-cap-note');
  note.textContent = eff < noiseT2
    ? t('noise.t2CapNote', 'T₂ capped to {eff} μs (2×T₁) — dephasing can\'t outrun relaxation.').replace('{eff}', eff)
    : '';
}

function noiseUpdatePlayButton() {
  const btn = document.getElementById('noise-play-btn');
  btn.textContent = noisePlaying ? t('noise.pauseBtn', '⏸ Pause') : t('noise.playBtn', '▶ Play');
}

function noiseRender() {
  const { x, y, z } = noiseCompute(noiseElapsed);
  const r = Math.hypot(x, y, z);
  const purity = (1 + r * r) / 2;
  const label = blochVectorLabel(x, y, z);

  rendererNoise.draw(x, y, z, label);
  document.getElementById('bloch-noise').setAttribute('aria-label',
    `Bloch sphere for a decohering qubit. Elapsed ${noiseElapsed.toFixed(1)} microseconds, vector length ${r.toFixed(2)}, label ${label}.`);
  document.getElementById('label-noise').textContent = label;
  document.getElementById('noise-state-desc').textContent = label;
  document.getElementById('noise-elapsed-val').textContent = noiseElapsed.toFixed(1) + ' μs';
  document.getElementById('noise-r-val').textContent = r.toFixed(2);
  document.getElementById('noise-purity-val').textContent = Math.round(purity * 100) + '%';
  document.getElementById('noise-purity-fill').style.width = (purity * 100) + '%';

  // rho = (I + x*sigma_x + y*sigma_y + z*sigma_z) / 2
  document.getElementById('noise-rho-00').textContent = C.fmt({ r: (1 + z) / 2, i: 0 });
  document.getElementById('noise-rho-01').textContent = C.fmt({ r: x / 2, i: -y / 2 });
  document.getElementById('noise-rho-10').textContent = C.fmt({ r: x / 2, i: y / 2 });
  document.getElementById('noise-rho-11').textContent = C.fmt({ r: (1 - z) / 2, i: 0 });
}

function noiseAnimate(now) {
  if (noiseLastFrameTime === null) noiseLastFrameTime = now;
  const dtReal = (now - noiseLastFrameTime) / 1000;
  noiseLastFrameTime = now;

  if (noisePlaying && !noiseSettled) {
    noiseElapsed += dtReal * NOISE_US_PER_SEC;
    const horizon = 5 * Math.max(noiseT1, noiseT2Eff());
    if (noiseElapsed >= horizon) {
      noiseElapsed = horizon;
      noiseSettled = true;
      setExplainer('noise-explainer', t('noise.explainerSettled', "Settled at |0⟩ — and purity has actually climbed back near 100%, not bottomed out. That's not a rescue: T1 relaxation pulls a qubit toward its ground state, so given enough time it always ends up pure again, just pure and uninformative. A qubit sitting at |0⟩ looks identical whether it started as |+⟩, |−⟩, or anything else — the phase information T2 erased along the way never comes back, purity or no purity."));
    }
  }

  noiseRender();
  noiseAnimId = requestAnimationFrame(noiseAnimate);
}

function noiseRestart() {
  const b = qubitNoise.getBloch();
  noiseX0 = b.x; noiseY0 = b.y; noiseZ0 = b.z;
  noiseElapsed = 0;
  noiseSettled = false;
  noisePlaying = true;
  noiseUpdatePlayButton();
  setExplainer('noise-explainer', t('noise.explainerDefault', 'Watch the Bloch vector shrink and drift toward the north pole — that shrinkage is real information loss, not just a visual effect. A shorter vector means the qubit\'s state is genuinely less certain, exactly the same "mixed state" idea already used for entangled qubits elsewhere in this app.'));
  noiseRender();
}

function noiseTogglePlay() {
  noisePlaying = !noisePlaying;
  noiseUpdatePlayButton();
}

function ensureNoiseStarted() {
  if (!noiseAnimId) {
    noiseLastFrameTime = null;
    noiseAnimId = requestAnimationFrame(noiseAnimate);
  }
}

function stopNoiseSim() {
  if (noiseAnimId) {
    cancelAnimationFrame(noiseAnimId);
    noiseAnimId = null;
  }
}

function initNoiseTab() {
  document.getElementById('sl-noise-theta').addEventListener('input', noiseThetaPhiSliderUpdate);
  document.getElementById('sl-noise-phi').addEventListener('input', noiseThetaPhiSliderUpdate);
  document.querySelectorAll('[data-noise-preset]').forEach(btn => {
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => setNoiseInitialState(theta, phi));
  });
  document.getElementById('sl-noise-t1').addEventListener('input', noiseT1SliderUpdate);
  document.getElementById('sl-noise-t2').addEventListener('input', noiseT2SliderUpdate);
  document.getElementById('noise-play-btn').addEventListener('click', noiseTogglePlay);
  document.getElementById('btn-noise-restart').addEventListener('click', noiseRestart);

  qubitNoise.setState(Math.PI / 2, 0); // |+⟩ — shows both T1 (z moves) and T2 (x/y shrink) at once
  noiseUpdateCapNote();
  noiseRestart();
  registerTab('noise', { onEnter: ensureNoiseStarted, onLeave: stopNoiseSim });
}


// ════════ js/tabs/grover-tab.js ════════
// Depends on: core/two-qubit.js (TwoQubitState) and core/three-qubit.js
// (ThreeQubitState) — both gained the same two Grover primitives this
// term: applyPhaseFlip() (the oracle) and applyDiffusionReflect()
// (diffusion's fixed middle step). core/gates.js (GATES), core/utils.js
// (delay()), core/dom-utils.js (setExplainer), core/tab-registry.js
// (registerTab).
//
// ALGORITHM (verified computationally for every possible marked item, in
// both N=4 and N=8, before this UI was built — see tests/run.js):
//   Two selectable sizes, the same algorithm at two points on its own
//   accuracy curve, not two different ideas:
//     - N=4 (2 qubits), 1 iteration: exact. Probability at the marked
//       index is exactly 1 after one query — the textbook special case.
//     - N=8 (3 qubits), 2 iterations: the general case made visible.
//       Probability peaks at ~94.5%, not 1, and a 3rd iteration would
//       overshoot past that peak rather than improving on it.
//   Both run the same sequence: H on every qubit, then `iterations`
//   repetitions of [oracle: flip the marked item's amplitude sign alone
//   (applyPhaseFlip) — diffusion: H on every qubit, flip every amplitude
//   except |0...0⟩'s (applyDiffusionReflect), H on every qubit again],
//   then measure every qubit.

const GROVER_MODES = {
  n4: { qubits: 2, N: 4, iterations: 1 },
  n8: { qubits: 3, N: 8, iterations: 2 }
};
let groverMode = 'n4';
let groverTarget = '00';
let groverAnimating = false;
let groverSearchCount = 0;
let groverFoundCount = 0;
const GROVER_STEP_MS = 750;

function groverItems() {
  const { qubits, N } = GROVER_MODES[groverMode];
  return Array.from({ length: N }, (_, i) => i.toString(2).padStart(qubits, '0'));
}
function groverIdx(key) { return parseInt(key, 2); }
function groverNewState() { return groverMode === 'n8' ? new ThreeQubitState() : new TwoQubitState(); }
function groverSuffix() { return groverMode === 'n8' ? '-n8' : ''; }

function setGroverTarget(key) {
  if (groverAnimating) return;
  groverTarget = key;
  const suffix = groverSuffix();
  document.querySelectorAll('[data-grover-target]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.groverTarget === key));
  document.getElementById('grover-target-val').textContent = key;
  document.getElementById('grover-found-val').textContent = '?';
  document.getElementById('grover-found-val').classList.remove('set');
  document.getElementById(`grover-oracle-gate-target${suffix}`).textContent =
    t('grover.oracleMarks', 'marks {t}').replace('{t}', key);

  // A new target invalidates the previous run's results everywhere, not
  // just the Found chip — without this, picking a new item without
  // pressing Search again left the amplitude chart and the circuit's own
  // meter readout showing the old target's numbers next to the new
  // target's label, an actual mismatch rather than just an unrun state.
  const { qubits } = GROVER_MODES[groverMode];
  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = '?';
  }
  updateGroverBars(groverNewState());
}

/** Redraws every bar for the current mode's item set from a live state —
 *  bar height is the probability (|amplitude|²), the badge above it is
 *  the amplitude's sign. The two deliberately don't always move together:
 *  right after the oracle, every sign badge can change while every bar
 *  height stays exactly put — that gap is the entire point of the demo.
 *  Only touches the elements for the current mode's item keys, so the
 *  other mode's (hidden) chart is simply left alone. */
function updateGroverBars(state) {
  groverItems().forEach((key, idx) => {
    const histEl = document.getElementById(`grover-hist-${key}`);
    if (!histEl) return;
    const p = state.prob(idx) * 100;
    histEl.style.height = p + '%';
    document.getElementById(`grover-pct-${key}`).textContent = Math.round(p) + '%';
    const signEl = document.getElementById(`grover-sign-${key}`);
    const negative = state.amps[idx].r < -1e-9;
    signEl.textContent = negative ? '−' : '+';
    signEl.classList.toggle('grover-sign-neg', negative);
  });
}

function updateGroverTally() {
  const el = document.getElementById('grover-tally-text');
  if (!groverSearchCount) { el.textContent = ''; return; }
  const key = groverMode === 'n8' ? 'grover.tallyN8' : 'grover.tally';
  const fallback = groverMode === 'n8'
    ? '{n} searches · {found}/{n} found after 2 queries'
    : '{n} searches · {found}/{n} found on the first query';
  el.textContent = t(key, fallback)
    .replace('{n}', groverSearchCount).replace('{found}', groverFoundCount).replace('{n}', groverSearchCount);
}

/** One-shot spotlight on a circuit element for its ~700ms turn in the
 *  run — same pattern as Superdense Coding's own pulseStage(), reused
 *  here rather than reimplemented: .teleport-stage/.active (teleport.css)
 *  already defines the glow keyframe, so this only needs to toggle it. */
function pulseGroverStage(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 700);
}

/** Diffusion's own three gates (H, reflection, H) ripple left-to-right
 *  in the order they actually run, rather than one box standing in for
 *  all three — mode-aware since N=4 and N=8 use different element ids
 *  (and N=8 has a third wire's worth of H gates either side). */
function pulseGroverDiffuser(qubits, suffix) {
  for (let q = 0; q < qubits; q++) pulseGroverStage(`grover-gate-diffuse-h${q}a${suffix}`);
  setTimeout(() => pulseGroverStage(`grover-gate-reflect${suffix}`), 200);
  setTimeout(() => { for (let q = 0; q < qubits; q++) pulseGroverStage(`grover-gate-diffuse-h${q}b${suffix}`); }, 400);
}

async function runGrover() {
  if (groverAnimating) return;
  groverAnimating = true;
  document.getElementById('btn-grover-search').disabled = true;
  document.getElementById('btn-reset-grover').disabled = true;
  document.getElementById('grover-result').textContent = t('grover.resultRunning', 'running…');
  document.getElementById('grover-found-val').textContent = '?';
  document.getElementById('grover-found-val').classList.remove('set');

  const { qubits, N, iterations } = GROVER_MODES[groverMode];
  const suffix = groverSuffix();
  const targetIdx = groverIdx(groverTarget);
  const state = groverNewState();

  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = '?';
  }
  document.getElementById('grover-iteration-badge').textContent = '';

  setExplainer('grover-explainer', t('grover.stepStart', 'Every search starts at a definite, uninteresting state — all zeros, exactly like a classical register before you\'ve looked at anything.'));
  updateGroverBars(state);
  await delay(GROVER_STEP_MS);

  for (let q = 0; q < qubits; q++) {
    pulseGroverStage(`grover-gate-h${q}${suffix}`);
    state.applySingleQubitGate(q, GATES.H.matrix);
  }
  setExplainer('grover-explainer', t('grover.stepSuperpose', 'A Hadamard on each qubit spreads the amplitude equally across all {n} items at once — every candidate is "live" simultaneously, not checked one at a time.').replace('{n}', N));
  updateGroverBars(state);
  await delay(GROVER_STEP_MS);

  for (let iter = 1; iter <= iterations; iter++) {
    if (iterations > 1) {
      document.getElementById('grover-iteration-badge').textContent =
        t('grover.iterationBadge', 'Iteration {iter} of {total}').replace('{iter}', iter).replace('{total}', iterations);
    }

    pulseGroverStage(`grover-gate-oracle${suffix}`);
    state.applyPhaseFlip(targetIdx);
    setExplainer('grover-explainer', t('grover.stepOracle', 'The oracle recognizes the marked item and flips the sign of its amplitude alone. Look closely: none of the bars moved — a probability is the squared size of an amplitude, and a negative amplitude squares to exactly the same probability as a positive one the same size. This step is completely invisible to any measurement taken right now.'));
    updateGroverBars(state);
    await delay(GROVER_STEP_MS);

    pulseGroverDiffuser(qubits, suffix);
    for (let q = 0; q < qubits; q++) state.applySingleQubitGate(q, GATES.H.matrix);
    state.applyDiffusionReflect();
    for (let q = 0; q < qubits; q++) state.applySingleQubitGate(q, GATES.H.matrix);

    let diffuseMsg;
    if (iterations === 1) {
      diffuseMsg = t('grover.stepDiffuse', 'Diffusion reflects every amplitude about their shared average. The other amplitudes, already near that average, collapse toward zero; the marked one, sitting on the far side after its sign flipped, gets thrown past the average by twice the gap — turning that invisible phase flip into a visible answer.');
    } else {
      const pctNow = Math.round(state.prob(targetIdx) * 1000) / 10;
      diffuseMsg = t('grover.stepDiffuseIteration', 'Diffusion reflects every amplitude about their shared average, the same rule as always. Iteration {iter} of {total} complete: the marked item\'s probability is now {pct}%.')
        .replace('{iter}', iter).replace('{total}', iterations).replace('{pct}', pctNow);
      if (iter === iterations) {
        diffuseMsg += ' ' + t('grover.overshootNote', 'That\'s the peak for N=8 — a third iteration would overshoot past it, dropping the probability back down to about 33%, not up.');
      }
    }
    setExplainer('grover-explainer', diffuseMsg);
    updateGroverBars(state);
    await delay(GROVER_STEP_MS);
  }

  for (let q = 0; q < qubits; q++) pulseGroverStage(`grover-meter-${q}${suffix}`);
  const bits = [];
  for (let q = 0; q < qubits; q++) bits.push(state.measureQubit(q));
  const found = bits.join('');
  const match = found === groverTarget;

  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = bits[q];
  }
  document.getElementById('grover-found-val').textContent = found;
  document.getElementById('grover-found-val').classList.add('set');
  groverSearchCount++;
  if (match) groverFoundCount++;
  updateGroverTally();

  if (iterations === 1) {
    document.getElementById('grover-result').textContent = match
      ? t('grover.resultMatch', 'Found on the first query')
      : t('grover.resultMismatch', 'Missed — check the console, this should never happen for N=4');
    setExplainer('grover-explainer', t('grover.stepMeasure', 'One query, one measurement, done: {found} — for {n} items with 1 marked, exactly one Grover iteration gives the marked item probability 1, a real measurement over a distribution with no actual uncertainty left in it.').replace('{found}', found).replace('{n}', N));
  } else {
    document.getElementById('grover-result').textContent = match
      ? t('grover.resultMatchN8', 'Found after 2 queries')
      : t('grover.resultMismatchN8', 'Missed this time — genuinely possible about 1 time in 20 for N=8, not a bug');
    setExplainer('grover-explainer', t('grover.stepMeasureApprox', '2 queries, one measurement, done: {found} — for 8 items with 1 marked, 2 Grover iterations bring the marked item\'s probability to about 94.5%, not exactly 1 this time; measured this way, that\'s still a real Born-rule draw, just one where a small, genuine chance of missing remains.').replace('{found}', found));
  }

  groverAnimating = false;
  document.getElementById('btn-grover-search').disabled = false;
  document.getElementById('btn-reset-grover').disabled = false;
}

function resetGrover() {
  if (groverAnimating) return;
  groverSearchCount = 0;
  groverFoundCount = 0;
  updateGroverTally();
  document.getElementById('grover-found-val').textContent = '?';
  document.getElementById('grover-found-val').classList.remove('set');
  document.getElementById('grover-result').textContent = '—';
  document.getElementById('grover-iteration-badge').textContent = '';
  const { qubits } = GROVER_MODES[groverMode];
  const suffix = groverSuffix();
  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = '?';
  }
  updateGroverBars(groverNewState());
  setExplainer('grover-explainer', t('grover.explainerDefault', 'Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.'));
}

/** Switches which of the two (otherwise-identical) circuit/picker/chart
 *  pairs is visible — the two modes are the same algorithm at two sizes,
 *  not two different tabs, so this only ever toggles display, resets the
 *  shared state variables, and re-runs setGroverTarget() for the new
 *  mode's own all-zeros default rather than duplicating that reset logic. */
function setGroverMode(mode) {
  if (groverAnimating || mode === groverMode) return;
  groverMode = mode;
  document.querySelectorAll('[data-grover-mode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.groverMode === mode));

  document.getElementById('grover-circuit-n4-wrap').style.display = mode === 'n4' ? '' : 'none';
  document.getElementById('grover-circuit-n8-wrap').style.display = mode === 'n8' ? '' : 'none';
  document.getElementById('grover-target-picker').style.display = mode === 'n4' ? '' : 'none';
  document.getElementById('grover-target-picker-n8').style.display = mode === 'n8' ? '' : 'none';
  document.getElementById('grover-chart-n4').style.display = mode === 'n4' ? '' : 'none';
  document.getElementById('grover-chart-n8').style.display = mode === 'n8' ? '' : 'none';

  document.getElementById('grover-mode-desc').textContent = mode === 'n8'
    ? t('grover.modeN8Desc', '3 qubits, 1 marked item — needs 2 queries, and even then peaks below 100%.')
    : t('grover.modeN4Desc', '2 qubits, 1 marked item — a single query is exact.');

  groverSearchCount = 0;
  groverFoundCount = 0;
  updateGroverTally();
  setGroverTarget('0'.repeat(GROVER_MODES[mode].qubits));
  document.getElementById('grover-result').textContent = '—';
  setExplainer('grover-explainer', t('grover.explainerDefault', 'Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.'));
}

function initGroverTab() {
  document.querySelectorAll('[data-grover-target]').forEach(btn =>
    btn.addEventListener('click', () => setGroverTarget(btn.dataset.groverTarget)));
  document.querySelectorAll('[data-grover-mode]').forEach(btn =>
    btn.addEventListener('click', () => setGroverMode(btn.dataset.groverMode)));
  document.getElementById('btn-grover-search').addEventListener('click', runGrover);
  document.getElementById('btn-reset-grover').addEventListener('click', resetGrover);

  setGroverTarget('00');
  updateGroverTally();
  registerTab('grover', {});
}


// ════════ Home / Concepts mode and concept-map navigation ════════
// The concept map, lessons, quizzes and progress now live in React
// (components/RoadmapView.jsx, LessonEmbed.jsx, state/progress.js). What
// remains here is the part that has to drive the legacy tab controllers.

/** Top-level Concepts/Home switch. Never changes which tab carries
 *  .active, so returning to 'sim' restores the tab that was open. */
function setAppMode(mode) {
  setNav({ mode });
  document.querySelectorAll('.tab-content').forEach(s => { s.style.display = mode === 'sim' ? '' : 'none'; });
  window.scrollTo(0, 0);
  syncLocationAndTitle();
}

/** Opens a concept-map node's simulation, applying any builder state its
 *  sub-branch targets (e.g. Circuits > Quantum > Two Qubits). */
function goToLessonSimulation(nodeId) {
  const node = MINDMAP_NODE_BY_ID[nodeId];
  if (!node || !node.tab) return;
  setAppMode('sim');
  switchToTab(node.tab);
  if (node.circuitDomain) setCircuitDomain(node.circuitDomain);
  if (node.circuitMode) setCircuitMode(node.circuitMode);
  if (node.qubitMode) setQubitMode(node.qubitMode);
  if (node.qubitSubmode) setQubitSubmode(node.qubitSubmode);
  if (node.gatesDomain) setGatesDomain(node.gatesDomain);
  if (node.statevecMode) setStatevecMode(node.statevecMode);
  if (node.mathsSection) setMathsSection(node.mathsSection);
}

// ════════ js/tour.js ════════
// First-run guided tour — shown once per browser (tracked via
// localStorage) to orient new visitors. Depends on app.js's
// switchToTab()/currentTab and core/tab-registry.js indirectly through
// that. Loads right before app.js and is kicked off from app.js's
// DOMContentLoaded, once every other tab is fully initialized.

const TOUR_STORAGE_KEY = 'qe-tour-seen';

const TOUR_STEPS = [
  {
    tab: 'qubit',
    selector: '#tab-sidebar',
    text: 'Each tab explores one quantum concept, building from a single qubit up to entanglement and wave phenomena. Click through them anytime.'
  },
  {
    tab: 'qubit',
    selector: '#bloch-main',
    text: 'This is the Bloch sphere. Try dragging the arrow directly — it sets the qubit\'s state in real time.'
  },
  {
    tab: 'qubit',
    selector: '#theme-toggle',
    text: 'Toggle light or dark mode here — your choice is remembered next time you visit.'
  }
];

let tourIndex = 0;
let tourBackdrop = null;
let tourPopover  = null;
let tourHighlightEl = null;

function startTourIfFirstVisit() {
  if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
  tourIndex = 0;
  // Every step targets a Concepts-page element (nav, #bloch-main,
  // #theme-toggle) — since Roadmap is the default landing view, switch
  // there explicitly rather than relying on whatever mode happened to be
  // active, so the tour never tries to highlight a 0x0 hidden element.
  setAppMode('sim');
  buildTourDOM();
  showTourStep();
}

function buildTourDOM() {
  tourBackdrop = document.createElement('div');
  tourBackdrop.className = 'tour-backdrop';
  tourPopover = document.createElement('div');
  tourPopover.className = 'tour-popover';
  document.body.appendChild(tourBackdrop);
  document.body.appendChild(tourPopover);
}

function clearTourHighlight() {
  if (tourHighlightEl) tourHighlightEl.classList.remove('tour-highlight');
  tourHighlightEl = null;
  document.querySelectorAll('.tour-raise-header').forEach(el => el.classList.remove('tour-raise-header'));
}

function showTourStep() {
  clearTourHighlight();
  const step = TOUR_STEPS[tourIndex];
  if (currentTab !== step.tab) switchToTab(step.tab);

  requestAnimationFrame(() => {
    const target = document.querySelector(step.selector);
    if (!target) { endTour(); return; }

    target.classList.add('tour-highlight');
    tourHighlightEl = target;
    // Elements inside <header> live in its own stacking context (it's
    // position:fixed with its own z-index), so a highlighted child can't
    // out-rank the backdrop just by raising its own z-index — the whole
    // header needs to be raised instead.
    const headerAncestor = target.closest('header');
    if (headerAncestor) headerAncestor.classList.add('tour-raise-header');

    const rect = target.getBoundingClientRect();
    tourPopover.innerHTML = `
      <div class="tour-step-count">Step ${tourIndex + 1} of ${TOUR_STEPS.length}</div>
      <p>${step.text}</p>
      <div class="tour-actions">
        <button class="btn-secondary" id="tour-skip">Skip</button>
        <button class="btn-run" id="tour-next">${tourIndex === TOUR_STEPS.length - 1 ? 'Done' : 'Next'}</button>
      </div>
    `;
    // Usually anchored below the target, but a tall element (e.g. the
    // full-height #tab-sidebar) leaves no room below it — fall back to
    // anchoring beside it instead of letting the popover run off-screen.
    const popoverH = 170;
    let top, left;
    if (rect.bottom + 12 + popoverH <= window.innerHeight) {
      top  = rect.bottom + 12;
      left = Math.min(window.innerWidth - 300, Math.max(12, rect.left));
    } else {
      top  = Math.min(window.innerHeight - popoverH - 12, Math.max(12, rect.top));
      left = Math.min(window.innerWidth - 300, rect.right + 12);
    }
    tourPopover.style.top  = top + 'px';
    tourPopover.style.left = left + 'px';

    document.getElementById('tour-next').addEventListener('click', nextTourStep);
    document.getElementById('tour-skip').addEventListener('click', endTour);
  });
}

function nextTourStep() {
  tourIndex++;
  if (tourIndex >= TOUR_STEPS.length) { endTour(); return; }
  showTourStep();
}

function endTour() {
  clearTourHighlight();
  if (tourBackdrop) tourBackdrop.remove();
  if (tourPopover) tourPopover.remove();
  tourBackdrop = null;
  tourPopover  = null;
  localStorage.setItem(TOUR_STORAGE_KEY, '1');
}


// ════════ js/app.js ════════
// Bootstrap file — must be the LAST <script> tag in index.html. It declares
// the shared app state (used by every tabs/*.js file) and wires up the
// theme toggle, tab switching, and initial UI render inside a single
// DOMContentLoaded listener, calling into every core/*.js and tabs/*.js
// build/init function. Keeping one linear init function here (rather than
// scattering DOMContentLoaded listeners across the tab files) makes the
// init order easy to reason about, since there's no module system to make
// per-file registration order predictable.
// Depends on: core/tab-registry.js (TABS) for switchToTab().

// ═══════════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════════
let qubitMain    = new Qubit();
let qubitCircuit = new Qubit();
let qubitMeasure = new Qubit();

// Two Qubits panel (Qubit tab) — independent, not entangled; see
// updateQubit2UI() in qubit-tab.js for the product-state math.
let qubit2A = new Qubit();
let qubit2B = new Qubit();

// Three Qubits panel (Qubit tab) — same "independent, not entangled"
// pattern as qubit2A/B above, just one more Qubit; see updateQubit3UI()
// in qubit-tab.js.
let qubit3A = new Qubit();
let qubit3B = new Qubit();
let qubit3C = new Qubit();

// Teleport tab — Alice's message qubit, set independently via its own
// sliders/drag/presets same as qubit2A/B above, not entangled with
// anything until fireTeleport() (teleport-tab.js) builds a fresh
// ThreeQubitState from its amplitudes each run.
let qubitTeleportMsg = new Qubit();

// Noise tab — the initial (pre-decoherence) state qubitNoise sets is what
// noise-tab.js's own rAF loop then evolves away from in real time; the
// evolving (x,y,z) itself isn't stored on a Qubit instance (decoherence
// takes it off the unit sphere, which Qubit's theta/phi model can't
// represent), just tracked as plain numbers inside noise-tab.js.
let qubitNoise = new Qubit();

let rendererMain    = null;
let rendererGates   = null;
let rendererCircuit = null;
let rendererQubit2A = null;
let rendererQubit2B = null;
let rendererQubit3A = null;
let rendererQubit3B = null;
let rendererQubit3C = null;
let rendererTeleportAlice = null;
let rendererTeleportBob   = null;
let rendererNoise = null;

// Reduced single-qubit Bloch spheres for the 2Q/3Q circuit builders (see
// TwoQubitState/ThreeQubitState.getSingleQubitBloch() and updateUI() in
// tabs/circuit-multiqubit-tab.js) — read-only outputs of each builder's
// own instance state, not independent state like rendererQubit2A/B.
let rendererCircuit2 = [null, null];
let rendererCircuit3 = [null, null, null];

let gateHistory  = [];
let circuitGates = [];
const SLOT_COUNT = 8;

let measureCounts = { 0: 0, 1: 0 };
// The Measure tab's coin — same null=unmeasured/0/1 convention as the
// Entangle tab's coin1State/coin2State below, and the same coinAnimating-
// style re-entrancy guard so a rapid double-click on MEASURE can't start
// a second flip animation mid-flight.
let measureCoinState     = null;
let measureCoinAnimating = false;
let measureBatchAnimating = false; // guards measureMany() — see measure-tab.js

let currentTab = 'qubit'; // matches the initially-active .tab/.tab-content in index.html

// ── Classical bit state ────────────────────────────────────────────
let classicalBit     = 1;

// ── Statevector widget (embedded in Maths Concept's State Vector
//    section — see tabs/statevector-tab.js) ─────────────────────────
let classicalSVState = 1;   // 0 or 1
let svTheta          = 0;   // angle controlling quantum state vector

// ── Entanglement tab ───────────────────────────────────────────────
let coin1State     = null;  // null=unmeasured, 0, 1
let coin2State     = null;
let coinAnimating  = false;
let entangleCounts = { '00': 0, '11': 0 };

/** Highlights whichever sidebar sub-link(s) under `tab` match `state` —
 *  called from each tab's own mode setter (setQubitMode/setQubitSubmode,
 *  setGatesDomain, setMathsSection) after it updates that tab's in-page
 *  toggle, so the sidebar stays correct no matter whether the state
 *  change came from the sidebar itself, the in-page toggle, or roadmap
 *  navigation. `state` maps each *mode* dataset key a .tab-sub might carry
 *  to its current value; a sub-link matches only if every mode key IT
 *  declares agrees — a link with just `gatesDomain` ignores qubitSubmode
 *  etc. MODE_KEYS is an explicit allowlist rather than "every dataset key
 *  but `tab`": every .tab-sub also carries a `data-i18n` translation key
 *  (core/i18n.js's applyTranslations() reads it, unrelated to navigation
 *  state), and an every()-over-all-keys match used to silently fail
 *  forever because `state.i18n` is never set — no sidebar sub-link ever
 *  highlighted, on any tab, once i18n.js started tagging these buttons. */
/** Records a tab's current mode so the React sidebar can highlight the
 *  matching sub-link. */
function syncSidebarSub(tab, state) {
  setTabSub(tab, state);
}

/** Applies the mode a sidebar sub-link selects. */
function applySidebarSub(mode) {
  if (mode.qubitMode)     setQubitMode(mode.qubitMode);
  if (mode.qubitSubmode)  setQubitSubmode(mode.qubitSubmode);
  if (mode.gatesDomain)   setGatesDomain(mode.gatesDomain);
  if (mode.mathsSection)  setMathsSection(mode.mathsSection);
}

/** Switches the visible tab and fires the outgoing/incoming tab's
 *  registerTab() hooks (see core/tab-registry.js). */
function switchToTab(name) {
  document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('active', s.id === `tab-${name}`));

  const leaving = TABS[currentTab];
  if (leaving && leaving.onLeave) leaving.onLeave();

  currentTab = name;
  setNav({ tab: name });
  const entering = TABS[currentTab];
  if (entering && entering.onEnter) entering.onEnter();

  // Each tab is a plain block in document flow (the page itself scrolls,
  // not some inner wrapper) — without this, a tab entered while scrolled
  // halfway down the previous one starts halfway down too, since nothing
  // else resets window scroll on a tab swap.
  window.scrollTo(0, 0);
  syncLocationAndTitle();
}

/** Keeps the address bar (?tab=…) and document title describing the page
 *  being viewed, so the URL can be bookmarked/shared and the tab title is
 *  meaningful. Home mode clears the query. */
function syncLocationAndTitle() {
  const base = 'Quantum Explorer';
  const home = document.getElementById('roadmap-view')?.classList.contains('active');
  const params = new URLSearchParams(location.search);
  let title = base;
  if (home) {
    ['tab', 'theta', 'phi', 'circuit'].forEach(k => params.delete(k));
  } else {
    const label = document.querySelector(`.tab[data-tab="${currentTab}"] .tab-label`)?.textContent.trim();
    if (label) title = `${label} · ${base}`;
    if (params.get('tab') !== currentTab) {
      ['theta', 'phi', 'circuit'].forEach(k => params.delete(k));
      params.set('tab', currentTab);
    }
  }
  document.title = title;
  const qs = params.toString();
  try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch (e) { /* sandboxed */ }
}

/** Fills in the footer's copyright line with the real current year rather
 *  than a hardcoded one that quietly goes stale — same
 *  t(key, fallback).replace('{token}', value) pattern roadmap.js uses for
 *  any other translated string that needs a runtime value spliced in.
 *  Registered with onLangChange() (core/i18n.js) since this text isn't
 *  reachable by the plain [data-i18n] walk in applyTranslations(). */

// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════
export function startEngine() {
  blochHooks.showTooltip = showBlochTooltip;
  blochHooks.hideTooltip = hideBlochTooltip;


  // Theme init — data-theme itself was already restored from localStorage
  // by the anti-flash script in index.html's <head>, before first paint.
  refreshThemeColors();

  // Language init (core/i18n.js) — runs after every js/locales/*.js file
  // has already registered itself (script order in index.html), so every
  // language is available the first time applyTranslations() runs.

  // The sidebar is a React component; it drives the engine through this API.
  engineApi.switchToTab = switchToTab;
  engineApi.applySub = applySidebarSub;
  engineApi.setAppMode = setAppMode;
  engineApi.goToNode = goToLessonSimulation;
  engineApi.showTooltip = showBlochTooltip;
  engineApi.hideTooltip = hideBlochTooltip;

  // Bloch renderers — must exist before the initXTab() calls below: e.g.
  // initCircuit2Tab()/initCircuit3Tab() (tabs/circuit-multiqubit-tab.js)
  // call updateUI() during their own init, which reaches straight into
  // rendererCircuit2/rendererCircuit3 to draw the per-qubit mini-spheres.
  rendererMain    = new BlochRenderer(document.getElementById('bloch-main'));
  rendererGates   = new BlochRenderer(document.getElementById('bloch-gates'));
  rendererCircuit = new BlochRenderer(document.getElementById('bloch-circuit'));
  rendererQubit2A = new BlochRenderer(document.getElementById('bloch-2q-a'));
  rendererQubit2B = new BlochRenderer(document.getElementById('bloch-2q-b'));
  rendererQubit3A = new BlochRenderer(document.getElementById('bloch-3q-a'));
  rendererQubit3B = new BlochRenderer(document.getElementById('bloch-3q-b'));
  rendererQubit3C = new BlochRenderer(document.getElementById('bloch-3q-c'));
  rendererCircuit2 = [0, 1].map(i => new BlochRenderer(document.getElementById(`bloch-circuit-2q-${i}`)));
  rendererCircuit3 = [0, 1, 2].map(i => new BlochRenderer(document.getElementById(`bloch-circuit-3q-${i}`)));
  rendererTeleportAlice = new BlochRenderer(document.getElementById('bloch-teleport-alice'));
  rendererTeleportBob   = new BlochRenderer(document.getElementById('bloch-teleport-bob'));
  rendererNoise = new BlochRenderer(document.getElementById('bloch-noise'));

  // Only free-form inputs get drag — Gates/Circuit spheres are read-only
  // outputs of applying gates, so dragging them wouldn't map back to a
  // meaningful action, but the Two/Three Qubits spheres are inputs same
  // as the main one.
  rendererMain.enableDrag((theta, phi) => setMainState(theta, phi));
  rendererQubit2A.enableDrag((theta, phi) => { qubit2A.setState(theta, phi); updateQubit2UI(); });
  rendererQubit2B.enableDrag((theta, phi) => { qubit2B.setState(theta, phi); updateQubit2UI(); });
  rendererQubit3A.enableDrag((theta, phi) => { qubit3A.setState(theta, phi); updateQubit3UI(); });
  rendererQubit3B.enableDrag((theta, phi) => { qubit3B.setState(theta, phi); updateQubit3UI(); });
  rendererQubit3C.enableDrag((theta, phi) => { qubit3C.setState(theta, phi); updateQubit3UI(); });
  rendererTeleportAlice.enableDrag((theta, phi) => setTeleportAliceState(theta, phi));
  [rendererMain, rendererGates, rendererCircuit, rendererQubit2A, rendererQubit2B,
   rendererQubit3A, rendererQubit3B, rendererQubit3C, rendererTeleportAlice, rendererTeleportBob,
   rendererNoise, ...rendererCircuit2, ...rendererCircuit3].forEach(r => r.enableTooltips());

  // Redraw every sphere in place (same x/y/z, new theme colors) whenever
  // the theme toggles — see core/theme.js's onThemeChange().
  onThemeChange(() => {
    [rendererMain, rendererGates, rendererCircuit, rendererQubit2A, rendererQubit2B,
     rendererQubit3A, rendererQubit3B, rendererQubit3C, rendererTeleportAlice, rendererTeleportBob,
     rendererNoise, ...rendererCircuit2, ...rendererCircuit3].forEach(r => {
      if (r) r.draw(r.cur.x, r.cur.y, r.cur.z);
    });
  });

  // Build UI
  buildGateButtons();
  buildCircuitPalette();
  buildCircuitSlots();
  initClassicalBit();
  initQubitTab();
  initMathsConceptTab();
  initCircuitTab();
  initCircuit2Tab();
  initCircuit3Tab();
  initClassicalCircuitTab();
  initClassicalGatesTab();
  initMeasureTab();
  initStatevecTab();
  initEntangle();
  initBellStatesTab();
  initTunnelControls();
  initInterferenceControls();
  initBeamSplitterTab();
  initImportantConceptsZoom();
  initImportantConceptsSearch();
  initSternGerlachTab();
  initTeleportTab();
  initSuperdenseTab();
  initNoiseTab();
  initGroverTab();

  // Initial renders
  const b0 = qubitMain.getBloch();
  rendererMain.draw(b0.x, b0.y, b0.z, qubitMain.getLabel());
  rendererGates.draw(b0.x, b0.y, b0.z, qubitMain.getLabel());
  const bc = qubitCircuit.getBloch();
  rendererCircuit.draw(bc.x, bc.y, bc.z, qubitCircuit.getLabel());
  const b2a = qubit2A.getBloch(), b2b = qubit2B.getBloch();
  rendererQubit2A.draw(b2a.x, b2a.y, b2a.z, qubit2A.getLabel());
  rendererQubit2B.draw(b2b.x, b2b.y, b2b.z, qubit2B.getLabel());
  updateQubit2UI();
  const b3a = qubit3A.getBloch(), b3b = qubit3B.getBloch(), b3c = qubit3C.getBloch();
  rendererQubit3A.draw(b3a.x, b3a.y, b3a.z, qubit3A.getLabel());
  rendererQubit3B.draw(b3b.x, b3b.y, b3b.z, qubit3B.getLabel());
  rendererQubit3C.draw(b3c.x, b3c.y, b3c.z, qubit3C.getLabel());
  updateQubit3UI();

  updateQubitUI();
  updateGatesUI();
  updateCircuitUI();
  updateMeasureUI();
  updateClassicalUI();
  setAppMode('roadmap'); // Roadmap is the default landing view — see index.html's
                          // matching hardcoded defaults (nav hidden, #roadmap-view
                          // .active) that avoid a Concepts-page flash before this runs.
  initModeGridThumbs();

  const openedSharedLink = applySharedStateFromURL();
  if (!openedSharedLink) startTourIfFirstVisit();
}

/** Restores a qubit state and/or circuit gate sequence encoded in the
 *  URL by copyShareLink() (see core/dom-utils.js), so a shared link
 *  reproduces what the sender saw. Unrecognized/missing params are
 *  silently ignored rather than treated as errors. */
const SIDEBAR_TAB_IDS = new Set(SIDEBAR_ITEMS.map((i) => i.tab));

// Captured before setAppMode()/switchToTab() rewrite the address bar.
const INITIAL_SEARCH = location.search;

function applySharedStateFromURL() {
  const params = new URLSearchParams(INITIAL_SEARCH);

  const theta = params.get('theta');
  const phi   = params.get('phi');
  if (theta !== null && phi !== null) {
    setMainState(parseFloat(theta), parseFloat(phi));
  }

  const circuit = params.get('circuit');
  if (circuit) {
    circuitGates = circuit.split(',').filter(key => GATES[key]).slice(0, SLOT_COUNT);
    buildCircuitSlots();
    updateCircuitUI();
  }

  const tab = params.get('tab');
  if (tab && SIDEBAR_TAB_IDS.has(tab)) {
    // A shared link lands inside the simulation, not on the Home map, and
    // skips the first-visit tour so the recipient sees what was shared.
    setAppMode('sim');
    switchToTab(tab);
    setNav({ openGroup: tab });
    try { history.replaceState(null, '', location.pathname + INITIAL_SEARCH); } catch (e) { /* sandboxed */ }
    return true;
  }
  return false;
}

