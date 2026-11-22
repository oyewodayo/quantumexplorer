import { isDark } from './theme.ts';
import type { BlochVec } from './qubit.ts';
import { setupHiDPICanvas } from './canvasDpr.ts';

// Shared tooltip helper for Bloch sphere and mindmap nodes
let _blochTooltipEl: HTMLDivElement | null = null;

export function showBlochTooltip(text: string, clientX: number, clientY: number): void {
  if (!_blochTooltipEl) {
    _blochTooltipEl = document.createElement('div');
    _blochTooltipEl.className = 'bloch-tooltip';
    document.body.appendChild(_blochTooltipEl);
  }
  _blochTooltipEl.textContent = text;
  _blochTooltipEl.style.left = clientX + 'px';
  _blochTooltipEl.style.top = (clientY - 14) + 'px';
  _blochTooltipEl.classList.add('visible');
}

export function hideBlochTooltip(): void {
  if (_blochTooltipEl) _blochTooltipEl.classList.remove('visible');
}

export const blochHooks: {
  showTooltip: (text: string, clientX: number, clientY: number) => void;
  hideTooltip: () => void;
} = {
  showTooltip: showBlochTooltip,
  hideTooltip: hideBlochTooltip,
};

interface Hotspot {
  sx: number;
  sy: number;
  text: string;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function slerpBloch(a: BlochVec, b: BlochVec, t: number): BlochVec {
  const lenA = Math.hypot(a.x, a.y, a.z);
  const lenB = Math.hypot(b.x, b.y, b.z);
  const len = lenA + (lenB - lenA) * t;

  if (lenA < 1e-5 || lenB < 1e-5) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    };
  }

  const ax = a.x / lenA, ay = a.y / lenA, az = a.z / lenA;
  const bx = b.x / lenB, by = b.y / lenB, bz = b.z / lenB;
  const dot = Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz));

  if (dot > 0.9995) {
    const nx = ax + (bx - ax) * t;
    const ny = ay + (by - ay) * t;
    const nz = az + (bz - az) * t;
    const nl = Math.hypot(nx, ny, nz) || 1;
    return { x: (nx / nl) * len, y: (ny / nl) * len, z: (nz / nl) * len };
  }

  // Opposite poles (180° flip, e.g. X gate on |0⟩ → |1⟩): sweep cleanly along a meridian
  if (dot < -0.9995) {
    let px = -ay, py = ax, pz = 0;
    if (Math.hypot(px, py, pz) < 1e-3) {
      px = 1; py = 0; pz = 0;
    } else {
      const pl = Math.hypot(px, py, pz);
      px /= pl; py /= pl; pz /= pl;
    }
    const angle = Math.PI * t;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return {
      x: (ax * cosA + px * sinA) * len,
      y: (ay * cosA + py * sinA) * len,
      z: (az * cosA + pz * sinA) * len,
    };
  }

  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);
  const s0 = Math.sin((1 - t) * omega) / sinOmega;
  const s1 = Math.sin(t * omega) / sinOmega;
  return {
    x: (ax * s0 + bx * s1) * len,
    y: (ay * s0 + by * s1) * len,
    z: (az * s0 + bz * s1) * len,
  };
}

// ─── BLOCH RENDERER (HiDPI glass sphere, SLERP animation, theme-aware) ────
export class BlochRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cssWidth: number;
  cssHeight: number;
  cx: number;
  cy: number;
  r: number;
  cur: BlochVec;
  tgt: BlochVec;
  label: string;
  animId: number | null;
  hotspots: Hotspot[];
  trail: BlochVec[];
  _dragPrev: BlochVec | null;

  constructor(canvas: HTMLCanvasElement, cssWidth?: number, cssHeight?: number) {
    this.canvas = canvas;
    const w = cssWidth ?? (parseFloat(canvas.dataset.cssWidth || '') || canvas.width || 260);
    const h = cssHeight ?? (parseFloat(canvas.dataset.cssHeight || '') || canvas.height || 260);
    const setup = setupHiDPICanvas(canvas, w, h);
    this.ctx = setup ? setup.ctx : canvas.getContext('2d')!;
    this.cssWidth = w;
    this.cssHeight = h;
    this.cx = w / 2;
    this.cy = h / 2;
    this.r = Math.min(w, h) * 0.365;
    this.cur = { x: 0, y: 0, z: 1 };
    this.tgt = { x: 0, y: 0, z: 1 };
    this.label = '';
    this.animId = null;
    this.hotspots = [];
    this.trail = [];
    this._dragPrev = null;
  }

  resize(cssWidth: number, cssHeight: number): void {
    const setup = setupHiDPICanvas(this.canvas, cssWidth, cssHeight);
    if (setup) this.ctx = setup.ctx;
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;
    this.cx = cssWidth / 2;
    this.cy = cssHeight / 2;
    this.r = Math.min(cssWidth, cssHeight) * 0.365;
  }

  project(x: number, y: number, z: number): { sx: number; sy: number; d: number } {
    const az = -Math.PI / 6;
    const el = Math.PI / 9.5;
    const x1 = x * Math.cos(az) + y * Math.sin(az);
    const y1 = -x * Math.sin(az) + y * Math.cos(az);
    const z1 = z;
    const x2 = x1;
    const y2 = y1 * Math.cos(el) - z1 * Math.sin(el);
    const z2 = y1 * Math.sin(el) + z1 * Math.cos(el);
    return {
      sx: this.cx + x2 * this.r,
      sy: this.cy - z2 * this.r,
      d: y2,
    };
  }

  animateTo(x: number, y: number, z: number, label?: string): void {
    if (label !== undefined) this.label = label;
    this.tgt = { x, y, z };
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    const start: BlochVec = { ...this.cur };
    const dist = Math.hypot(x - start.x, y - start.y, z - start.z);
    if (dist < 0.001 || prefersReducedMotion()) {
      this.cur = { ...this.tgt };
      this.trail = [];
      this.draw(this.cur.x, this.cur.y, this.cur.z);
      return;
    }

    const durationMs = Math.min(460, Math.max(220, dist * 230));
    const t0 = performance.now();
    this.trail = [{ ...start }];

    const step = (now: number) => {
      const elapsed = now - t0;
      const raw = Math.min(1, elapsed / durationMs);
      // Smooth ease-out cubic
      const eased = 1 - Math.pow(1 - raw, 3);
      this.cur = slerpBloch(start, this.tgt, eased);
      this.trail.push({ ...this.cur });
      if (this.trail.length > 26) this.trail.shift();

      this.draw(this.cur.x, this.cur.y, this.cur.z);

      if (raw < 1) {
        this.animId = requestAnimationFrame(step);
      } else {
        this.cur = { ...this.tgt };
        this.trail = [];
        this.draw(this.cur.x, this.cur.y, this.cur.z);
        this.animId = null;
      }
    };
    this.animId = requestAnimationFrame(step);
  }

  drawCircle(
    paramFn: (t: number) => [number, number, number],
    colorFront: string,
    colorBack: string,
    wFront = 1,
    wBack = 0.7
  ): void {
    const ctx = this.ctx;
    const N = 128;
    const pts: Array<{ sx: number; sy: number; d: number }> = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * 2 * Math.PI;
      const [x, y, z] = paramFn(t);
      pts.push(this.project(x, y, z));
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = colorBack;
    ctx.lineWidth = wBack;
    ctx.beginPath();
    let inPath = false;
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].d > 0) { inPath = false; continue; }
      if (!inPath) { ctx.moveTo(pts[i].sx, pts[i].sy); inPath = true; }
      else ctx.lineTo(pts[i].sx, pts[i].sy);
    }
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = colorFront;
    ctx.lineWidth = wFront;
    ctx.beginPath();
    inPath = false;
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].d <= 0) { inPath = false; continue; }
      if (!inPath) { ctx.moveTo(pts[i].sx, pts[i].sy); inPath = true; }
      else ctx.lineTo(pts[i].sx, pts[i].sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawAxis(
    pos: [number, number, number],
    neg: [number, number, number],
    color: string,
    posLabel: string,
    negLabel: string,
    isPrimary = false
  ): void {
    const ctx = this.ctx;
    const p = this.project(...pos);
    const n = this.project(...neg);
    const o = this.project(0, 0, 0);
    const fs = Math.max(10, Math.round(this.r * 0.115));

    ctx.save();
    ctx.lineCap = 'round';
    // Positive half-axis (solid)
    ctx.strokeStyle = color;
    ctx.lineWidth = isPrimary ? 1.5 : 1.15;
    ctx.beginPath();
    ctx.moveTo(o.sx, o.sy);
    ctx.lineTo(p.sx, p.sy);
    ctx.stroke();

    // Negative half-axis (subtle dashed)
    ctx.setLineDash([3.5, 4.5]);
    ctx.lineWidth = isPrimary ? 1.0 : 0.85;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(o.sx, o.sy);
    ctx.lineTo(n.sx, n.sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Small pole anchor dots on the sphere surface
    const pSurf = this.project(pos[0] / 1.08, pos[1] / 1.08, pos[2] / 1.08);
    const nSurf = this.project(neg[0] / 1.08, neg[1] / 1.08, neg[2] / 1.08);
    ctx.fillStyle = color;
    [pSurf, nSurf].forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.sx, pt.sy, isPrimary ? 2.4 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Crisp labels positioned outside the sphere with clean backdrop halo
    ctx.font = `600 ${fs}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const labelAt = (pt: { sx: number; sy: number }, text: string) => {
      const dx = pt.sx - this.cx;
      const dy = pt.sy - this.cy;
      const d = Math.hypot(dx, dy) || 1;
      const lx = pt.sx + (dx / d) * (this.r * 0.145);
      const ly = pt.sy + (dy / d) * (this.r * 0.145);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = isDark ? 'rgba(13, 18, 30, 0.88)' : 'rgba(255, 255, 255, 0.92)';
      ctx.strokeText(text, lx, ly);
      ctx.fillStyle = isPrimary
        ? (isDark ? '#F1F5F9' : '#0F172A')
        : (isDark ? '#94A3B8' : '#475569');
      ctx.fillText(text, lx, ly);
      this.hotspots.push({ sx: lx, sy: ly, text });
    };

    labelAt(p, posLabel);
    labelAt(n, negLabel);
    ctx.restore();
  }

  drawEquatorialProjection(bx: number, by: number, bz: number): void {
    const xyLen = Math.hypot(bx, by);
    if (xyLen < 0.06) return;

    const ctx = this.ctx;
    const o = this.project(0, 0, 0);
    const tip = this.project(bx, by, bz);
    const eq = this.project(bx, by, 0);

    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(96, 165, 250, 0.42)' : 'rgba(37, 99, 235, 0.35)';
    ctx.lineWidth = 1.1;
    ctx.setLineDash([3, 3.5]);

    // Drop line from tip to equator plane
    ctx.beginPath();
    ctx.moveTo(tip.sx, tip.sy);
    ctx.lineTo(eq.sx, eq.sy);
    ctx.stroke();

    // Radial phase line on the XY plane from origin to equatorial projection
    ctx.beginPath();
    ctx.moveTo(o.sx, o.sy);
    ctx.lineTo(eq.sx, eq.sy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small dot on equator projection
    ctx.fillStyle = isDark ? 'rgba(96, 165, 250, 0.7)' : 'rgba(37, 99, 235, 0.6)';
    ctx.beginPath();
    ctx.arc(eq.sx, eq.sy, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawMotionTrail(): void {
    if (this.trail.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.project(this.trail[i - 1].x, this.trail[i - 1].y, this.trail[i - 1].z);
      const b = this.project(this.trail[i].x, this.trail[i].y, this.trail[i].z);
      const alpha = (i / this.trail.length) * 0.55;
      ctx.strokeStyle = isDark
        ? `rgba(251, 146, 60, ${alpha.toFixed(3)})`
        : `rgba(234, 88, 12, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.4 + (i / this.trail.length) * 1.4;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawStateVector(bx: number, by: number, bz: number, label: string): void {
    const ctx = this.ctx;
    const { r } = this;
    const o = this.project(0, 0, 0);
    const tip = this.project(bx, by, bz);
    const vecLen = Math.hypot(bx, by, bz);

    const accent = isDark ? '#FF7A59' : '#E5482B';
    const accentGlow = isDark ? 'rgba(255, 122, 89, 0.32)' : 'rgba(229, 72, 43, 0.24)';

    // Draw vector shaft from origin to state point
    ctx.save();
    if (vecLen > 0.04) {
      const dx = tip.sx - o.sx;
      const dy = tip.sy - o.sy;
      const screenLen = Math.hypot(dx, dy);

      // Soft vector glow
      ctx.strokeStyle = accentGlow;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(o.sx, o.sy);
      ctx.lineTo(tip.sx, tip.sy);
      ctx.stroke();

      // Crisp vector shaft
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(o.sx, o.sy);
      ctx.lineTo(tip.sx, tip.sy);
      ctx.stroke();

      // Subtle arrowhead near tip
      if (screenLen > 14) {
        const angle = Math.atan2(dy, dx);
        const headLen = Math.min(9, r * 0.105);
        const backX = tip.sx - Math.cos(angle) * (r * 0.045);
        const backY = tip.sy - Math.sin(angle) * (r * 0.045);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(backX, backY);
        ctx.lineTo(
          backX - headLen * Math.cos(angle - Math.PI / 6.5),
          backY - headLen * Math.sin(angle - Math.PI / 6.5)
        );
        ctx.lineTo(
          backX - headLen * Math.cos(angle + Math.PI / 6.5),
          backY - headLen * Math.sin(angle + Math.PI / 6.5)
        );
        ctx.closePath();
        ctx.fill();
      }
    }

    // Origin dot
    ctx.fillStyle = isDark ? '#CBD5E1' : '#334155';
    ctx.beginPath();
    ctx.arc(o.sx, o.sy, 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Glowing state marker sphere at tip
    const dotR = Math.max(4.5, r * 0.056);
    ctx.beginPath();
    ctx.arc(tip.sx, tip.sy, dotR + 3.5, 0, Math.PI * 2);
    ctx.fillStyle = accentGlow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tip.sx, tip.sy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    // Smart state badge: skip if it duplicates an axis label right next to the tip
    if (!label) return;
    const normalizedLabel = label.replace(/\s+/g, '');
    const nearDuplicateHotspot = this.hotspots.some(
      (h) => h.text.replace(/\s+/g, '') === normalizedLabel && Math.hypot(h.sx - tip.sx, h.sy - tip.sy) < r * 0.36
    );
    if (nearDuplicateHotspot) return;

    const fs = Math.max(10, Math.round(r * 0.105));
    ctx.save();
    ctx.font = `600 ${fs}px "JetBrains Mono", "Space Grotesk", sans-serif`;
    const padX = 7, padY = 4, margin = 6;
    const textW = ctx.measureText(label).width;
    const boxW = textW + padX * 2;
    const boxH = fs + padY * 2;

    // Position badge away from center and away from the closest hotspot
    const dx = tip.sx - this.cx;
    const dy = tip.sy - this.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ldx = dx / len;
    const ldy = dy / len;
    const leadLen = r * 0.34;
    let boxX = tip.sx + ldx * leadLen - (ldx < 0 ? boxW : 0);
    let boxY = tip.sy + ldy * leadLen - boxH / 2;

    // If near top/bottom pole, shift horizontally to avoid overlapping |0⟩ / |1⟩
    if (Math.abs(ldx) < 0.35) {
      boxX = tip.sx + r * 0.22;
      boxY = tip.sy - boxH / 2;
    }

    boxX = Math.min(Math.max(boxX, margin), this.cssWidth - boxW - margin);
    boxY = Math.min(Math.max(boxY, margin), this.cssHeight - boxH - margin);

    const boxCx = boxX + boxW / 2;
    const boxCy = boxY + boxH / 2;
    const edgeX = Math.min(Math.max(tip.sx, boxX), boxX + boxW);
    const edgeY = Math.min(Math.max(tip.sy, boxY), boxY + boxH);

    ctx.strokeStyle = isDark ? 'rgba(226, 232, 240, 0.35)' : 'rgba(15, 23, 42, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tip.sx, tip.sy);
    ctx.lineTo(edgeX, edgeY);
    ctx.stroke();

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.96)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    else ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.32)' : 'rgba(15, 23, 42, 0.14)';
    ctx.stroke();

    ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, boxCx, boxCy);
    ctx.restore();
  }

  draw(bx: number, by: number, bz: number, label?: string): void {
    if (label !== undefined) this.label = label;
    // Ensure crisp DPR transform in case DPR or canvas state changed
    const setup = setupHiDPICanvas(this.canvas, this.cssWidth, this.cssHeight);
    if (setup) this.ctx = setup.ctx;

    const ctx = this.ctx;
    const { cx, cy, r } = this;

    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
    this.hotspots.length = 0;

    // 1. Subtle ambient floor glow under the sphere
    ctx.save();
    const shadowGrad = ctx.createRadialGradient(cx, cy + r * 1.06, r * 0.08, cx, cy + r * 1.06, r * 0.72);
    shadowGrad.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(15, 23, 42, 0.09)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 1.06, r * 0.68, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Translucent glass sphere body
    const bodyGrad = ctx.createRadialGradient(
      cx - r * 0.34,
      cy - r * 0.36,
      r * 0.06,
      cx,
      cy,
      r * 1.02
    );
    if (isDark) {
      bodyGrad.addColorStop(0, 'rgba(96, 165, 250, 0.24)');
      bodyGrad.addColorStop(0.55, 'rgba(30, 58, 138, 0.22)');
      bodyGrad.addColorStop(1, 'rgba(15, 23, 42, 0.42)');
    } else {
      bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
      bodyGrad.addColorStop(0.52, 'rgba(219, 234, 254, 0.56)');
      bodyGrad.addColorStop(1, 'rgba(147, 197, 253, 0.34)');
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Crisp outer rim
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.36)' : 'rgba(37, 99, 235, 0.28)';
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // Soft top-left glass specular highlight
    ctx.save();
    const specGrad = ctx.createRadialGradient(
      cx - r * 0.35,
      cy - r * 0.38,
      r * 0.02,
      cx - r * 0.32,
      cy - r * 0.34,
      r * 0.45
    );
    specGrad.addColorStop(0, isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.75)');
    specGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Clean meridians & emphasized equator
    const eqFront = isDark ? 'rgba(147, 197, 253, 0.52)' : 'rgba(37, 99, 235, 0.42)';
    const eqBack = isDark ? 'rgba(147, 197, 253, 0.20)' : 'rgba(37, 99, 235, 0.16)';
    const merFront = isDark ? 'rgba(148, 163, 184, 0.20)' : 'rgba(51, 65, 85, 0.14)';
    const merBack = isDark ? 'rgba(148, 163, 184, 0.10)' : 'rgba(51, 65, 85, 0.07)';

    this.drawCircle((t) => [Math.cos(t), Math.sin(t), 0], eqFront, eqBack, 1.35, 0.8);
    this.drawCircle((t) => [Math.cos(t), 0, Math.sin(t)], merFront, merBack, 0.85, 0.55);
    this.drawCircle((t) => [0, Math.cos(t), Math.sin(t)], merFront, merBack, 0.85, 0.55);

    // Subtle ±45° latitude rings for clear 3D depth perception
    [50, 130].forEach((deg) => {
      const th = (deg * Math.PI) / 180;
      const z = Math.cos(th), rad = Math.sin(th);
      this.drawCircle((t) => [rad * Math.cos(t), rad * Math.sin(t), z], merBack, merBack, 0.6, 0.4);
    });

    // 4. Coordinate axes
    const zColor = isDark ? 'rgba(226, 232, 240, 0.82)' : 'rgba(15, 23, 42, 0.72)';
    const xyColor = isDark ? 'rgba(148, 163, 184, 0.62)' : 'rgba(71, 85, 105, 0.52)';
    this.drawAxis([0, 0, 1.08], [0, 0, -1.08], zColor, '|0⟩', '|1⟩', true);
    this.drawAxis([1.08, 0, 0], [-1.08, 0, 0], xyColor, '|+⟩', '|-⟩', false);
    this.drawAxis([0, 1.08, 0], [0, -1.08, 0], xyColor, '|i⟩', '|-i⟩', false);

    // 5. Equatorial projection, motion trail, and 3D state vector arrow
    this.drawEquatorialProjection(bx, by, bz);
    this.drawMotionTrail();
    this.drawStateVector(bx, by, bz, this.label);
  }

  unproject(mx: number, my: number): { theta: number; phi: number } {
    const az = -Math.PI / 6;
    const el = Math.PI / 9.5;
    let dx = (mx - this.cx) / this.r;
    let dz = (this.cy - my) / this.r;
    const rad2 = dx * dx + dz * dz;
    if (rad2 > 1) {
      const s = 1 / Math.sqrt(rad2);
      dx *= s; dz *= s;
    }
    const depth = Math.sqrt(Math.max(0, 1 - dx * dx - dz * dz));

    const toPoint = (y2: number): BlochVec => {
      const y1 = y2 * Math.cos(el) + dz * Math.sin(el);
      const z1 = -y2 * Math.sin(el) + dz * Math.cos(el);
      const x1 = dx;
      return {
        x: x1 * Math.cos(az) - y1 * Math.sin(az),
        y: x1 * Math.sin(az) + y1 * Math.cos(az),
        z: z1,
      };
    };

    let best = toPoint(depth);
    if (depth > 1e-6 && this._dragPrev) {
      const far = toPoint(-depth);
      const prev = this._dragPrev;
      const dot = (p: BlochVec) => p.x * prev.x + p.y * prev.y + p.z * prev.z;
      if (dot(far) > dot(best)) best = far;
    }
    this._dragPrev = best;

    const theta = Math.acos(Math.min(1, Math.max(-1, best.z)));
    let phi = Math.atan2(best.y, best.x);
    if (phi < 0) phi += 2 * Math.PI;
    return { theta, phi };
  }

  enableDrag(onDrag: (theta: number, phi: number) => void): () => void {
    const canvas = this.canvas;
    let dragging = false;

    const localPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const p = 'touches' in e ? e.touches[0] : e;
      return { mx: p.clientX - rect.left, my: p.clientY - rect.top };
    };
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const { mx, my } = localPos(e);
      const { theta, phi } = this.unproject(mx, my);
      onDrag(theta, phi);
      e.preventDefault();
    };
    const start = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      this._dragPrev = { ...this.cur };
      canvas.classList.add('dragging');
      move(e);
    };
    const end = () => {
      dragging = false;
      canvas.classList.remove('dragging');
    };

    canvas.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);

    return () => {
      canvas.removeEventListener('mousedown', start);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
  }

  enableTooltips(): () => void {
    const canvas = this.canvas;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = this.hotspots.find((h) => Math.hypot(h.sx - mx, h.sy - my) < 18);
      if (hit) {
        blochHooks.showTooltip(BLOCH_KET_MEANINGS[hit.text] || hit.text, e.clientX, e.clientY);
      } else {
        blochHooks.hideTooltip();
      }
    };
    const onLeave = () => blochHooks.hideTooltip();
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }
}

export const BLOCH_KET_MEANINGS: Record<string, string> = {
  '|0⟩': 'Definite 0 — the north pole. A classical bit can only ever be here or at |1⟩.',
  '|1⟩': 'Definite 1 — the south pole.',
  '|+⟩': 'Equal superposition (|0⟩ + |1⟩)/√2 — 50/50 odds, phase 0°.',
  '|-⟩': 'Equal superposition (|0⟩ − |1⟩)/√2 — 50/50 odds, phase 180°.',
  '|i⟩': 'Equal superposition (|0⟩ + i|1⟩)/√2 — 50/50 odds, phase 90°.',
  '|-i⟩': 'Equal superposition (|0⟩ − i|1⟩)/√2 — 50/50 odds, phase 270°.',
};
