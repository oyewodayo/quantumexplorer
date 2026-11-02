'use strict';
// Depends on: core/theme.js (isDark), read inside draw() at call time —
// kept after theme.js in load order for readability only. enableTooltips()
// also depends on core/dom-utils.js (showBlochTooltip/hideBlochTooltip),
// which loads before this file.
//
// Styled as an Earth globe (ocean gradient, simplified continents, a
// polar axle rod poking through top and bottom) rather than an abstract
// wireframe sphere — the state itself is a small pin sitting on the
// surface with a callout bubble, not a vector arrow from the center.
// The projection/drag math (project/unproject) is unchanged from the
// original wireframe version; only what gets drawn changed.

// ─── BLOCH RENDERER (theme-aware) ────────────────────────────────────
class BlochRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.cx     = canvas.width  / 2;
    this.cy     = canvas.height / 2;
    this.r      = Math.min(canvas.width, canvas.height) * 0.37;
    this.cur    = { x: 0, y: 0, z: 1 };
    this.tgt    = { x: 0, y: 0, z: 1 };
    this.label  = '';      // current state's short ket label, shown in the surface-pin callout
    this.animId = null;
    this.hotspots = [];   // axis-label screen positions, refreshed each draw() — used for hover tooltips
    this._dragPrev = null; // last 3D point during an active drag — used by unproject() for continuity
  }

  /**
   * Projects a 3D Bloch-sphere point to 2D canvas coordinates using a
   * fixed viewing angle (azimuth -30°, elevation 18°). Returns the
   * rotated depth `d` alongside screen coords `sx`/`sy` — `d` is used
   * by drawCircle() to split each great-circle into a solid front arc
   * (d > 0, facing the viewer) and a dashed back arc (d <= 0).
   */
  project(x, y, z) {
    const az = -Math.PI / 6;
    const el =  Math.PI / 10;
    const x1 =  x * Math.cos(az) + y * Math.sin(az);
    const y1 = -x * Math.sin(az) + y * Math.cos(az);
    const z1 = z;
    const x2 = x1;
    const y2 = y1 * Math.cos(el) - z1 * Math.sin(el);
    const z2 = y1 * Math.sin(el) + z1 * Math.cos(el);
    return {
      sx: this.cx + x2 * this.r,
      sy: this.cy - z2 * this.r,
      d:  y2
    };
  }

  /** `label`, if given, replaces the callout text and is remembered for
   *  later no-label draw()/animateTo() calls (e.g. the theme-toggle
   *  redraw in theme.js, which doesn't know any tab's current state). */
  animateTo(x, y, z, label) {
    if (label !== undefined) this.label = label;
    this.tgt = { x, y, z };
    if (this.animId) cancelAnimationFrame(this.animId);
    const step = () => {
      const t    = 0.14;
      this.cur.x = this.cur.x + (this.tgt.x - this.cur.x) * t;
      this.cur.y = this.cur.y + (this.tgt.y - this.cur.y) * t;
      this.cur.z = this.cur.z + (this.tgt.z - this.cur.z) * t;
      this.draw(this.cur.x, this.cur.y, this.cur.z);
      const dist = Math.abs(this.cur.x - this.tgt.x)
                 + Math.abs(this.cur.y - this.tgt.y)
                 + Math.abs(this.cur.z - this.tgt.z);
      if (dist > 0.0008) {
        this.animId = requestAnimationFrame(step);
      } else {
        this.cur = { ...this.tgt };
        this.draw(this.cur.x, this.cur.y, this.cur.z);
        this.animId = null;
      }
    };
    step();
  }

  drawCircle(paramFn, colorFront, colorBack, wFront = 1, wBack = 0.6) {
    const ctx = this.ctx;
    const N   = 128;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * 2 * Math.PI;
      const [x, y, z] = paramFn(t);
      pts.push(this.project(x, y, z));
    }

    ctx.save();
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = colorBack;
    ctx.lineWidth   = wBack;
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
    ctx.lineWidth   = wFront;
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

  /**
   * Extra latitude rings (parallels, fixed θ) and longitude rings
   * (meridians, fixed φ) beyond the equator/axis-meridian great circles
   * drawn separately — the standard globe-illustration graticule, at 30°
   * spacing like lines of latitude/longitude on Earth. Each meridian
   * pair (φ and φ+180°) is one closed great circle through both poles,
   * the same trick used for the |+⟩/|i⟩ axis meridians, so this reuses
   * drawCircle() rather than a different draw path.
   */
  drawGlobeGrid(color) {
    [30, 60, 120, 150].forEach(deg => {
      const theta = deg * Math.PI / 180;
      const z = Math.cos(theta), rad = Math.sin(theta);
      this.drawCircle(t => [rad * Math.cos(t), rad * Math.sin(t), z], color, color, 0.6, 0.35);
    });
    [30, 60, 120, 150].forEach(deg => {
      const phi = deg * Math.PI / 180;
      this.drawCircle(t => [Math.sin(t) * Math.cos(phi), Math.sin(t) * Math.sin(phi), Math.cos(t)], color, color, 0.6, 0.35);
    });
  }

  /**
   * The polar axle — drawn *before* the sphere fill, so the segment
   * between the two poles is hidden behind the opaque globe and only the
   * two protruding stubs (like a rod through a globe's mounting bracket)
   * show, top and bottom.
   */
  drawPolarRod() {
    const ctx = this.ctx;
    const topOut    = this.project(0, 0, 1.42);
    const topSphere = this.project(0, 0, 1.0);
    const botSphere = this.project(0, 0, -1.0);
    const botOut    = this.project(0, 0, -1.42);
    const rodColor  = isDark ? '#B8BEC9' : '#DEE2E7';
    const rodShadow = isDark ? '#6E7480' : '#AEB4BC';
    const rw = Math.max(3, this.r * 0.05);

    [[topOut, topSphere], [botSphere, botOut]].forEach(([a, b]) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = rodColor;
      ctx.lineWidth   = rw;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      // Thin shadow stripe down one side for a subtle cylindrical look.
      ctx.strokeStyle = rodShadow;
      ctx.lineWidth   = rw * 0.32;
      ctx.beginPath();
      ctx.moveTo(a.sx + rw * 0.24, a.sy);
      ctx.lineTo(b.sx + rw * 0.24, b.sy);
      ctx.stroke();
      ctx.restore();
    });
  }

  /**
   * A handful of simplified, deliberately non-geographic "continent"
   * blobs (θ/φ polygons in degrees) so the globe doesn't read as a flat
   * blue disc. Each blob is skipped once its average depth faces away
   * from the viewer — a cheap approximation (real per-edge clipping
   * against the terminator isn't worth it for decoration) that just pops
   * the whole shape out near the horizon instead of clipping smoothly.
   */
  drawContinents() {
    const ctx = this.ctx;
    const CONTINENTS = [
      [[50,255],[38,285],[52,312],[74,302],[96,283],[100,255],[84,236],[64,233]],
      [[42,8],[33,34],[48,56],[74,50],[94,28],[88,4],[68,-12],[54,-6]],
      [[52,108],[42,138],[58,164],[84,158],[108,138],[98,108],[78,92]]
    ];
    const color = isDark ? 'rgba(88,198,120,0.88)' : 'rgba(58,168,94,0.92)';
    CONTINENTS.forEach(poly => {
      const pts = poly.map(([thetaDeg, phiDeg]) => {
        const theta = thetaDeg * Math.PI / 180, phi = phiDeg * Math.PI / 180;
        return this.project(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta));
      });
      const avgD = pts.reduce((s, p) => s + p.d, 0) / pts.length;
      if (avgD <= 0.08) return;
      ctx.beginPath();
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  /** Small "N"/"S" tag sitting right on the sphere surface at each pole —
   *  the Earth-globe framing alongside the |0⟩/|1⟩ ket labels that carry
   *  the actual physics. */
  drawPoleMarker(pos, label) {
    const p  = this.project(...pos);
    const fs = Math.max(8, this.r * 0.076);
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.font = `600 ${fs}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = label === 'N' ? 'bottom' : 'top';
    const ly = p.sy + (label === 'N' ? -5 : 5);
    // Stroked outline behind the fill — without it this label is
    // invisible against the (also near-white) polar rod right behind it.
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeText(label, p.sx, ly);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(label, p.sx, ly);
    ctx.restore();
  }

  drawAxis(pos, neg, color, posLabel, negLabel) {
    const ctx = this.ctx;
    const p   = this.project(...pos);
    const n   = this.project(...neg);
    const o   = this.project(0, 0, 0);
    const fs  = Math.max(9, this.r * 0.088);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.3;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(o.sx, o.sy); ctx.lineTo(p.sx, p.sy); ctx.stroke();

    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(o.sx, o.sy); ctx.lineTo(n.sx, n.sy); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font         = `${fs}px "JetBrains Mono", monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const off = this.r * 0.16;
    const posX = p.sx + (p.sx > this.cx ?  off*0.7 : -off*0.7);
    const posY = p.sy + (p.sy < this.cy ? -off*0.4 :  off*0.4);
    const negX = n.sx + (n.sx > this.cx ?  off*0.7 : -off*0.7);
    const negY = n.sy + (n.sy < this.cy ? -off*0.4 :  off*0.4);
    // Stroked outline behind the fill, same reasoning as the N/S pole
    // tags — the Z axis's labels sit right where the polar rod pokes
    // out, close enough in tone (both near-white) that a plain fill
    // disappears against it.
    ctx.lineWidth   = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeText(posLabel, posX, posY);
    ctx.strokeText(negLabel, negX, negY);
    ctx.fillStyle = color;
    ctx.fillText(posLabel, posX, posY);
    ctx.fillText(negLabel, negX, negY);
    ctx.restore();

    this.hotspots.push({ sx: posX, sy: posY, text: posLabel });
    this.hotspots.push({ sx: negX, sy: negY, text: negLabel });
  }

  /**
   * The state itself: a small pin sitting directly on the globe's
   * surface at the qubit's point (rather than an arrow reaching out from
   * the center), plus a leader line to a rounded label bubble showing
   * its short ket — the callout offset direction follows the tip's own
   * direction from the sphere's center, so it always leans away from the
   * globe instead of overlapping it.
   */
  drawStateMarker(bx, by, bz, label) {
    const ctx = this.ctx;
    const { r } = this;
    const tip = this.project(bx, by, bz);

    ctx.save();
    ctx.beginPath();
    ctx.arc(tip.sx, tip.sy, r * 0.055, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF6B4A';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    if (!label) return;

    const dx = tip.sx - this.cx, dy = tip.sy - this.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ldx = dx / len, ldy = dy / len;
    const leadLen = r * 0.55;
    const lx = tip.sx + ldx * leadLen;
    const ly = tip.sy + ldy * leadLen - r * 0.18;

    const fs = Math.max(9, r * 0.1);
    ctx.save();
    ctx.font = `600 ${fs}px 'Space Grotesk', sans-serif`;
    const padX = 7, padY = 5, margin = 4;
    const textW = ctx.measureText(label).width;
    const boxW  = textW + padX * 2, boxH = fs + padY * 2;

    // Clamp the bubble to stay fully inside the canvas — a tip near the
    // sphere's edge (e.g. |+⟩-ish states) would otherwise push the
    // leader line and bubble straight off the side, same problem the
    // fixed-size canvas already has no scroll/overflow to recover from.
    let boxX = lx - (ldx < 0 ? boxW : 0);
    let boxY = ly - boxH / 2;
    boxX = Math.min(Math.max(boxX, margin), this.canvas.width  - boxW - margin);
    boxY = Math.min(Math.max(boxY, margin), this.canvas.height - boxH - margin);

    // Leader line always points from the pin to whichever edge of the
    // (possibly clamped) box is nearest, so it still reads as "this
    // label belongs to that pin" even after clamping moves the box.
    const boxCx = boxX + boxW / 2, boxCy = boxY + boxH / 2;
    const edgeX = Math.min(Math.max(tip.sx, boxX), boxX + boxW);
    const edgeY = Math.min(Math.max(tip.sy, boxY), boxY + boxH);

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tip.sx, tip.sy);
    ctx.lineTo(edgeX, edgeY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 5);
    else ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.stroke();

    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, boxCx, boxCy);
    ctx.restore();
  }

  /** `label`, if given, replaces the callout text (see the constructor's
   *  `this.label` comment) — omit it to redraw the last-known label
   *  unchanged, which is what the theme-toggle redraw in theme.js relies
   *  on. */
  draw(bx, by, bz, label) {
    if (label !== undefined) this.label = label;
    const ctx = this.ctx;
    const { cx, cy, r } = this;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hotspots.length = 0;

    // ── Polar axle (behind the globe — only its stubs will show) ──
    this.drawPolarRod();

    // ── Earth-like sphere ────────────────────────────────
    const grd = ctx.createRadialGradient(cx - r*0.32, cy - r*0.36, r*0.05, cx, cy, r*1.05);
    grd.addColorStop(0,    isDark ? '#6FA3E8' : '#8FC1F5');
    grd.addColorStop(0.55, isDark ? '#2F63B0' : '#3E7FD6');
    grd.addColorStop(1,    isDark ? '#132A52' : '#1D4A8C');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Continents ───────────────────────────────────────
    this.drawContinents();

    // ── Graticule (lat/long grid, on top of the ocean) ────
    const gridColor    = 'rgba(255,255,255,0.30)';
    const gridColorDim = 'rgba(255,255,255,0.16)';
    this.drawCircle(t => [Math.cos(t), Math.sin(t), 0], gridColor, gridColorDim, 1, 0.6);
    this.drawCircle(t => [Math.cos(t), 0, Math.sin(t)], gridColorDim, gridColorDim, 0.7, 0.4);
    this.drawCircle(t => [0, Math.cos(t), Math.sin(t)], gridColorDim, gridColorDim, 0.7, 0.4);
    this.drawGlobeGrid(gridColorDim);

    // ── Axis ket labels ──────────────────────────────────
    this.drawAxis([0, 0, 1.12], [0, 0, -1.12], '#ffffff',            '|0⟩', '|1⟩');
    this.drawAxis([1.12,0,0], [-1.12,0,0],     'rgba(255,255,255,0.72)', '|+⟩', '|-⟩');
    this.drawAxis([0, 1.12,0], [0,-1.12,0],    'rgba(255,255,255,0.72)', '|i⟩', '|-i⟩');

    // ── N/S pole tags ────────────────────────────────────
    this.drawPoleMarker([0, 0, 1],  'N');
    this.drawPoleMarker([0, 0, -1], 'S');

    // ── State marker + callout ───────────────────────────
    this.drawStateMarker(bx, by, bz, this.label);
  }

  /**
   * Inverse of project(): given a screen point, reconstructs the unit
   * Bloch vector whose projection lands there. The projection collapses
   * one dimension (depth), so each screen point actually matches two
   * possible sphere points (near/far side) — the ambiguity is resolved
   * by picking whichever candidate is closer to `_dragPrev` (the point
   * from the previous call), so a continuous drag traces a smooth path
   * across the sphere instead of snapping to a fixed hemisphere.
   */
  unproject(mx, my) {
    const az = -Math.PI / 6;
    const el =  Math.PI / 10;
    let dx = (mx - this.cx) / this.r;
    let dz = (this.cy - my) / this.r;
    const rad2 = dx * dx + dz * dz;
    if (rad2 > 1) {
      const s = 1 / Math.sqrt(rad2);
      dx *= s; dz *= s;
    }
    const depth = Math.sqrt(Math.max(0, 1 - dx * dx - dz * dz));

    const toPoint = y2 => {
      const y1 =  y2 * Math.cos(el) + dz * Math.sin(el);
      const z1 = -y2 * Math.sin(el) + dz * Math.cos(el);
      const x1 = dx;
      return {
        x: x1 * Math.cos(az) - y1 * Math.sin(az),
        y: x1 * Math.sin(az) + y1 * Math.cos(az),
        z: z1
      };
    };

    let best = toPoint(depth);
    if (depth > 1e-6 && this._dragPrev) {
      const far = toPoint(-depth);
      const dot = p => p.x * this._dragPrev.x + p.y * this._dragPrev.y + p.z * this._dragPrev.z;
      if (dot(far) > dot(best)) best = far;
    }
    this._dragPrev = best;

    const theta = Math.acos(Math.min(1, Math.max(-1, best.z)));
    let phi = Math.atan2(best.y, best.x);
    if (phi < 0) phi += 2 * Math.PI;
    return { theta, phi };
  }

  /**
   * Makes the sphere directly draggable: mousedown/touchstart begins
   * tracking from the currently-displayed state position (`this.cur`),
   * and onDrag(theta, phi) fires on every subsequent move.
   */
  enableDrag(onDrag) {
    const canvas = this.canvas;
    let dragging = false;

    const localPos = e => {
      const rect = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { mx: p.clientX - rect.left, my: p.clientY - rect.top };
    };
    const move = e => {
      if (!dragging) return;
      const { mx, my } = localPos(e);
      const { theta, phi } = this.unproject(mx, my);
      onDrag(theta, phi);
      e.preventDefault();
    };
    const start = e => {
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
  }

  /** Shows a small tooltip explaining an axis ket when the mouse hovers its label. */
  enableTooltips() {
    const canvas = this.canvas;
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = this.hotspots.find(h => Math.hypot(h.sx - mx, h.sy - my) < 16);
      if (hit) {
        showBlochTooltip(BLOCH_KET_MEANINGS[hit.text] || hit.text, e.clientX, e.clientY);
      } else {
        hideBlochTooltip();
      }
    });
    canvas.addEventListener('mouseleave', hideBlochTooltip);
  }
}

// Plain-language meaning of each basis-state label drawn on the sphere,
// shown in the hover tooltip enabled by enableTooltips().
const BLOCH_KET_MEANINGS = {
  '|0⟩':  'Definite 0 — the north pole. A classical bit can only ever be here or at |1⟩.',
  '|1⟩':  'Definite 1 — the south pole.',
  '|+⟩':  'Equal superposition (|0⟩ + |1⟩)/√2 — 50/50 odds, phase 0°.',
  '|-⟩':  'Equal superposition (|0⟩ − |1⟩)/√2 — 50/50 odds, phase 180°.',
  '|i⟩':  'Equal superposition (|0⟩ + i|1⟩)/√2 — 50/50 odds, phase 90°.',
  '|-i⟩': 'Equal superposition (|0⟩ − i|1⟩)/√2 — 50/50 odds, phase 270°.'
};
