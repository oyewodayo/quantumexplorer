'use strict';
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
  const k = 2 * Math.PI / interferenceWavelen();
  const r1 = Math.hypot(geo.screenX - geo.sourceX, y - geo.y1);
  if (mode === 'single') return 1;
  const r2 = Math.hypot(geo.screenX - geo.sourceX, y - geo.y2);
  if (mode === 'which-path') return 2; // |A1|^2 + |A2|^2, cross term erased
  return 2 + 2 * Math.cos(k * (r1 - r2)); // coherent double-slit, range [0,4]
}

function interferenceMaxIntensity(mode) {
  return mode === 'single' ? 1 : mode === 'which-path' ? 2 : 4;
}

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
