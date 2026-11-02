import { isDark } from './theme.js';

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
export function drawCoin(target, state) {
  const canvas = typeof target === 'string' ? document.getElementById(target) : target;
  if (!canvas) return;

  const id = canvas.id;
  const who = id === 'coin1' ? 'Qubit A' : id === 'coin2' ? 'Qubit B' : 'The qubit';
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
export async function animateCoinFlip(target, flips = 10, intervalMs = 55) {
  for (let i = 0; i < flips; i++) {
    drawCoin(target, i % 2);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
