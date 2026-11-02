'use strict';
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
