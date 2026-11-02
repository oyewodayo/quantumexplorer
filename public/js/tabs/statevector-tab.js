'use strict';
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
