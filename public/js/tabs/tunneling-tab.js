'use strict';
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
const TUNNEL_N   = 320;
const TUNNEL_DX  = 1 / TUNNEL_N;
const TUNNEL_DT  = 0.4 * TUNNEL_DX * TUNNEL_DX;
const TUNNEL_K0  = 90;              // carrier wavenumber -> E = k0^2 / 2
const TUNNEL_SIGMA = 0.045;         // initial packet width
const TUNNEL_X0   = 0.16;           // launch position
const TUNNEL_BARRIER_FRAC = 0.55;   // barrier center, fraction of domain
const TUNNEL_SUBSTEPS = 12;         // physics steps per rendered frame
const TUNNEL_MAX_STEPS = 3200;      // stop before packet reaches the wall

let tunnelPsiR = null, tunnelPsiI = null, tunnelV = null, tunnelHtmp = null;
let tunnelCanvas = null, tunnelCtx = null;
let tunnelAnimId = null;
let tunnelPlaying = true;
let tunnelSettled = false;
let tunnelCrossed = false;
let tunnelElapsedSteps = 0;
let tunnelDrawScale = 1;
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

function tunnelEnergy() { return TUNNEL_K0 * TUNNEL_K0 / 2; }

/**
 * Applies the discretized Hamiltonian H = -0.5 d^2/dx^2 + V(x) to `psi`
 * via a centered finite difference, writing the result into `out`.
 * Boundaries are fixed to zero (infinite well), so waves don't wrap.
 */
function tunnelHpsi(psi, out) {
  const c = 0.5 / (TUNNEL_DX * TUNNEL_DX);
  for (let j = 1; j < TUNNEL_N - 1; j++) {
    out[j] = -c * (psi[j + 1] - 2 * psi[j] + psi[j - 1]) + tunnelV[j] * psi[j];
  }
  out[0] = 0; out[TUNNEL_N - 1] = 0;
}

function tunnelBuildBarrier() {
  const heightRatio = parseInt(document.getElementById('tunnel-height').value) / 100;
  const widthCells  = parseInt(document.getElementById('tunnel-width').value);
  const V0     = heightRatio * tunnelEnergy();
  const center = Math.floor(TUNNEL_N * TUNNEL_BARRIER_FRAC);
  const half   = Math.floor(widthCells / 2);
  tunnelV.fill(0);
  for (let j = Math.max(0, center - half); j < Math.min(TUNNEL_N, center + half); j++) tunnelV[j] = V0;
  return { heightRatio, widthCells, V0, center, half };
}

function tunnelLaunchWave() {
  for (let j = 0; j < TUNNEL_N; j++) {
    const x = j * TUNNEL_DX;
    const env = Math.exp(-((x - TUNNEL_X0) ** 2) / (2 * TUNNEL_SIGMA * TUNNEL_SIGMA));
    tunnelPsiR[j] = env * Math.cos(TUNNEL_K0 * x);
    tunnelPsiI[j] = env * Math.sin(TUNNEL_K0 * x);
  }
  let norm = 0;
  for (let j = 0; j < TUNNEL_N; j++) norm += (tunnelPsiR[j] ** 2 + tunnelPsiI[j] ** 2) * TUNNEL_DX;
  norm = Math.sqrt(norm);
  for (let j = 0; j < TUNNEL_N; j++) { tunnelPsiR[j] /= norm; tunnelPsiI[j] /= norm; }

  // stagger psi_i by half a time step (required for the leapfrog scheme):
  // psiR and psiI are updated on interleaved half-steps in tunnelStep(),
  // so psiI must start life already offset by -dt/2 relative to psiR.
  tunnelHpsi(tunnelPsiR, tunnelHtmp);
  for (let j = 0; j < TUNNEL_N; j++) tunnelPsiI[j] -= 0.5 * TUNNEL_DT * tunnelHtmp[j];

  // scale the draw height so the packet's peak fills ~70% of the plot on launch
  let peak = 0;
  for (let j = 0; j < TUNNEL_N; j++) {
    const p = tunnelPsiR[j] ** 2 + tunnelPsiI[j] ** 2;
    if (p > peak) peak = p;
  }
  tunnelDrawScale = peak > 0 ? (0.62 * 0.68) / peak : 1; // 0.68 of canvas height reserved for the plot

  tunnelSettled = false;
  tunnelCrossed = false;
  tunnelElapsedSteps = 0;
}

/* One leapfrog step: advance psiR using the (already half-step-ahead)
   psiI, then advance psiI using the freshly-updated psiR — each half of
   the wavefunction always "sees" the other at the correct interleaved
   time, which is what keeps this scheme both stable and norm-conserving. */
function tunnelStep() {
  tunnelHpsi(tunnelPsiI, tunnelHtmp);
  for (let j = 0; j < TUNNEL_N; j++) tunnelPsiR[j] += TUNNEL_DT * tunnelHtmp[j];
  tunnelHpsi(tunnelPsiR, tunnelHtmp);
  for (let j = 0; j < TUNNEL_N; j++) tunnelPsiI[j] -= TUNNEL_DT * tunnelHtmp[j];
}

function tunnelSplitProbs() {
  let pLeft = 0, pRight = 0;
  const splitIdx = tunnelBarrier.center + tunnelBarrier.half + 2;
  for (let j = 0; j < TUNNEL_N; j++) {
    const p = (tunnelPsiR[j] ** 2 + tunnelPsiI[j] ** 2) * TUNNEL_DX;
    if (j < splitIdx) pLeft += p; else pRight += p;
  }
  return { pLeft, pRight };
}

function tunnelPeakIndex() {
  let best = 0, bestVal = -1;
  for (let j = 0; j < TUNNEL_N; j++) {
    const p = tunnelPsiR[j] ** 2 + tunnelPsiI[j] ** 2;
    if (p > bestVal) { bestVal = p; best = j; }
  }
  return best;
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
    const prob = (tunnelPsiR[j] ** 2 + tunnelPsiI[j] ** 2) * tunnelDrawScale;
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
  const carrierScale = Math.sqrt(tunnelDrawScale) * h * 0.42;
  for (let j = 0; j < TUNNEL_N; j++) {
    const px = (j / TUNNEL_N) * w;
    const py = baseline - h * 0.02 - tunnelPsiR[j] * carrierScale * 0.5 - h * 0.02;
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
  tunnelBarrier = tunnelBuildBarrier();
  tunnelLaunchWave();
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
    for (let s = 0; s < TUNNEL_SUBSTEPS; s++) tunnelStep();
    tunnelElapsedSteps += TUNNEL_SUBSTEPS;

    // narrative beat: packet has entered the classically forbidden zone
    if (!tunnelCrossed && tunnelBarrier.heightRatio > 0.02) {
      const peakIdx = tunnelPeakIndex();
      if (peakIdx >= tunnelBarrier.center - tunnelBarrier.half) {
        tunnelCrossed = true;
        setExplainer('tunnel-explainer',
          'Now inside the barrier — the classically forbidden zone. Notice the cloud doesn\'t vanish here, it just decays. If the wall is thin enough, there\'s still some wave left by the time it reaches the far side.'
        );
      }
    }
  }

  drawTunnel();
  const { pLeft, pRight } = tunnelSplitProbs();
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
    tunnelPsiR = new Float64Array(TUNNEL_N);
    tunnelPsiI = new Float64Array(TUNNEL_N);
    tunnelV    = new Float64Array(TUNNEL_N);
    tunnelHtmp = new Float64Array(TUNNEL_N);
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
