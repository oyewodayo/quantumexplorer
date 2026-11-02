'use strict';
// Depends on: core/complex.js (C.*), used inside method bodies at call time.

// ─── QUBIT ────────────────────────────────────────────────────────────
/**
 * A single-qubit state |ψ⟩ = alpha|0⟩ + beta|1⟩.
 * Invariant: alpha/beta are renormalized (_normalize) after every
 * mutation, so |alpha|^2 + |beta|^2 == 1 always holds outside of a
 * gate application in progress. theta/phi follow the standard Bloch
 * sphere convention: alpha = cos(theta/2), beta = e^(i*phi) sin(theta/2).
 */
class Qubit {
  constructor() {
    this.alpha = { r: 1, i: 0 };
    this.beta  = { r: 0, i: 0 };
  }

  setState(theta, phi) {
    this.alpha = C.polar(Math.cos(theta / 2), 0);
    this.beta  = C.polar(Math.sin(theta / 2), phi);
    this._normalize();
  }

  applyGate(mat) {
    const na = C.add(C.mul(mat[0][0], this.alpha), C.mul(mat[0][1], this.beta));
    const nb = C.add(C.mul(mat[1][0], this.alpha), C.mul(mat[1][1], this.beta));
    this.alpha = na;
    this.beta  = nb;
    this._normalize();
  }

  _normalize() {
    const mag = Math.sqrt(C.mag(this.alpha)**2 + C.mag(this.beta)**2);
    if (mag > 1e-10) {
      this.alpha = C.scale(this.alpha, 1 / mag);
      this.beta  = C.scale(this.beta,  1 / mag);
    }
  }

  prob0() { return C.mag(this.alpha) ** 2; }
  prob1() { return C.mag(this.beta)  ** 2; }

  getTheta() {
    return 2 * Math.acos(Math.min(1, Math.max(0, C.mag(this.alpha))));
  }

  getPhi() {
    if (C.mag(this.alpha) < 0.001) return 0;
    const p = C.arg(this.beta) - C.arg(this.alpha);
    return ((p % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  }

  getBloch() {
    const theta = this.getTheta();
    const phi   = this.getPhi();
    return {
      x: Math.sin(theta) * Math.cos(phi),
      y: Math.sin(theta) * Math.sin(phi),
      z: Math.cos(theta),
      theta, phi
    };
  }

  measure() { return Math.random() < this.prob0() ? 0 : 1; }

  getLabel() {
    const p0  = this.prob0();
    const phi = this.getPhi();
    const eps = 0.012;
    if (p0 > 1 - eps) return '|0⟩';
    if (p0 < eps)     return '|1⟩';
    if (Math.abs(p0 - 0.5) < eps) {
      if (phi < eps || phi > 2*Math.PI - eps) return '|+⟩';
      if (Math.abs(phi - Math.PI)     < eps)  return '|-⟩';
      if (Math.abs(phi - Math.PI/2)   < eps)  return '|i⟩';
      if (Math.abs(phi - 3*Math.PI/2) < eps)  return '|-i⟩';
    }
    return '|ψ⟩';
  }

  getFormula() {
    const label = this.getLabel();
    if (label !== '|ψ⟩') return `|ψ⟩ = ${label}`;
    const a      = round2(Math.sqrt(this.prob0()));
    const b      = round2(Math.sqrt(this.prob1()));
    const phiDeg = Math.round(this.getPhi() * 180 / Math.PI);
    if (phiDeg === 0)   return `|ψ⟩ = ${a}|0⟩ + ${b}|1⟩`;
    if (phiDeg === 180) return `|ψ⟩ = ${a}|0⟩ − ${b}|1⟩`;
    return `|ψ⟩ = ${a}|0⟩ + e^(i${phiDeg}°)${b}|1⟩`;
  }

  clone() {
    const q = new Qubit();
    q.alpha = { ...this.alpha };
    q.beta  = { ...this.beta  };
    return q;
  }
}

function round2(x) { return Math.round(x * 100) / 100; }

/**
 * Labels a raw Bloch vector (x,y,z) rather than a Qubit instance — used
 * for the reduced single-qubit spheres in the 2/3-qubit circuit builders
 * (see TwoQubitState/ThreeQubitState.getSingleQubitBloch()), where the
 * vector isn't always unit length: entanglement with the rest of the
 * circuit shows up as a shrunken vector (a genuinely mixed reduced
 * state), which a pure state's theta/phi snapping can't label as a
 * clean ket. Below the 0.90 threshold this reports how mixed it is
 * instead of guessing a ket that isn't really there.
 */
function blochVectorLabel(x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r < 0.90) return `mixed (${Math.round(r * 100)}%)`;

  const p0  = (1 + z) / 2;
  const phi = ((Math.atan2(y, x) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const eps = 0.03;
  if (p0 > 1 - eps) return '|0⟩';
  if (p0 < eps)     return '|1⟩';
  if (Math.abs(p0 - 0.5) < eps) {
    if (phi < eps || phi > 2 * Math.PI - eps) return '|+⟩';
    if (Math.abs(phi - Math.PI)     < eps)    return '|-⟩';
    if (Math.abs(phi - Math.PI / 2) < eps)    return '|i⟩';
    if (Math.abs(phi - 3 * Math.PI / 2) < eps) return '|-i⟩';
  }
  return '|ψ⟩';
}
