'use strict';
// Depends on: core/complex.js (C.*).

// ─── TWO-QUBIT STATE ──────────────────────────────────────────────────
/**
 * A two-qubit state |ψ⟩ = c00|00⟩ + c01|01⟩ + c10|10⟩ + c11|11⟩, stored
 * as a flat 4-entry amplitude array indexed by (qubit0 << 1) | qubit1 —
 * i.e. amps[0]=|00⟩, amps[1]=|01⟩, amps[2]=|10⟩, amps[3]=|11⟩.
 * Same normalization invariant as Qubit: renormalized after every gate.
 */
class TwoQubitState {
  constructor() {
    this.amps = [{ r: 1, i: 0 }, { r: 0, i: 0 }, { r: 0, i: 0 }, { r: 0, i: 0 }];
  }

  /** Applies a single-qubit 2x2 gate to just one of the two qubits
   *  (i.e. matrix⊗I or I⊗matrix), leaving the other untouched. */
  applySingleQubitGate(qubitIndex, matrix) {
    const next = [null, null, null, null];
    for (let q0 = 0; q0 < 2; q0++) {
      for (let q1 = 0; q1 < 2; q1++) {
        let sum = { r: 0, i: 0 };
        if (qubitIndex === 0) {
          for (let q0p = 0; q0p < 2; q0p++) {
            sum = C.add(sum, C.mul(matrix[q0][q0p], this.amps[q0p * 2 + q1]));
          }
        } else {
          for (let q1p = 0; q1p < 2; q1p++) {
            sum = C.add(sum, C.mul(matrix[q1][q1p], this.amps[q0 * 2 + q1p]));
          }
        }
        next[q0 * 2 + q1] = sum;
      }
    }
    this.amps = next;
    this._normalize();
  }

  /** Controlled-NOT: flips `target`'s bit whenever `control`'s bit is 1.
   *  A CNOT is just a permutation of basis states — no amplitude mixing —
   *  so this remaps each amplitude to its flipped index rather than doing
   *  a matrix multiply. */
  applyCNOT(control, target) {
    const next = [null, null, null, null];
    for (let idx = 0; idx < 4; idx++) {
      const bits = [idx >> 1, idx & 1];
      if (bits[control] === 1) bits[target] = 1 - bits[target];
      const newIdx = (bits[0] << 1) | bits[1];
      next[newIdx] = this.amps[idx];
    }
    this.amps = next;
  }

  _normalize() {
    let magSq = 0;
    for (const a of this.amps) magSq += C.mag(a) ** 2;
    const mag = Math.sqrt(magSq);
    if (mag > 1e-10) this.amps = this.amps.map(a => C.scale(a, 1 / mag));
  }

  prob(idx) { return C.mag(this.amps[idx]) ** 2; }

  /** Grover oracle: flips the sign of one marked basis state's amplitude,
   *  leaving every probability (|amplitude|²) exactly unchanged — a phase
   *  kick, invisible to any measurement taken right after this call. The
   *  primitive the Grover tab's "Oracle" step is built on. */
  applyPhaseFlip(idx) {
    this.amps[idx] = C.scale(this.amps[idx], -1);
  }

  /** Grover diffusion's middle step, 2|00⟩⟨00| − I in the computational
   *  basis: diag(1,−1,−1,−1) — every amplitude except |00⟩'s flips sign.
   *  Doesn't depend on which item is marked; only the surrounding H⊗H
   *  (applied by the caller with the app's own GATES.H.matrix, same as
   *  every other module) does. Sandwiched between those two H⊗H calls,
   *  this reflects every amplitude about their shared mean — "inversion
   *  about the mean" is the standard closed-form description of exactly
   *  what that three-step sandwich computes. */
  applyDiffusionReflect() {
    for (let idx = 1; idx < 4; idx++) this.amps[idx] = C.scale(this.amps[idx], -1);
  }

  /** Projectively measures `qubitIndex` in the computational basis — same
   *  algorithm as ThreeQubitState.measureQubit(), one fewer bit threaded
   *  through the index math: sums the Born-rule probability of that bit
   *  reading 0, draws an outcome weighted by it, zeroes every amplitude
   *  inconsistent with the outcome, and renormalizes. Used by the
   *  Superdense Coding tab to read Bob's two decoded bits off a state
   *  that (for a correctly-run protocol) is already an exact eigenstate
   *  of this measurement — so the "random" draw always lands on the
   *  same outcome with probability 1, but goes through a genuine
   *  measurement rather than a shortcut read of the amplitudes. */
  measureQubit(qubitIndex) {
    const shift = 1 - qubitIndex;
    let p0 = 0;
    for (let idx = 0; idx < 4; idx++) {
      if (((idx >> shift) & 1) === 0) p0 += this.prob(idx);
    }
    const outcome = Math.random() < p0 ? 0 : 1;
    for (let idx = 0; idx < 4; idx++) {
      if (((idx >> shift) & 1) !== outcome) this.amps[idx] = { r: 0, i: 0 };
    }
    this._normalize();
    return outcome;
  }

  /**
   * Reduced single-qubit Bloch vector for `qubitIndex`, found by tracing
   * out the other qubit: rho00/rho11 are just the summed probabilities
   * of that qubit reading 0/1 regardless of the other qubit's value, and
   * rho01 is the coherence term (Σ amp(this=0,other=s) · conj(amp(this=1,other=s))) —
   * the same rho01 role alpha·conj(beta) plays in Qubit.getBloch(), just
   * summed over the traced-out qubit's two possibilities. When the two
   * qubits are entangled, this vector shrinks below the sphere's surface
   * (down to dead-center for a maximal Bell pair) rather than sitting on
   * it — that shrinkage IS the entanglement, visible as a genuinely mixed
   * single-qubit state even though the two-qubit state as a whole is pure.
   */
  getSingleQubitBloch(qubitIndex) {
    let rho00 = 0, rho11 = 0, rho01 = { r: 0, i: 0 };
    for (let s = 0; s < 2; s++) {
      const idx0 = qubitIndex === 0 ? (0 << 1) | s : (s << 1) | 0;
      const idx1 = qubitIndex === 0 ? (1 << 1) | s : (s << 1) | 1;
      const a0 = this.amps[idx0], a1 = this.amps[idx1];
      rho00 += C.mag(a0) ** 2;
      rho11 += C.mag(a1) ** 2;
      rho01 = C.add(rho01, C.mul(a0, C.conj(a1)));
    }
    return { x: 2 * rho01.r, y: -2 * rho01.i, z: rho00 - rho11 };
  }

  getFormula() {
    const kets = ['00', '01', '10', '11'];
    let out = '';
    for (let i = 0; i < 4; i++) {
      const a = this.amps[i];
      if (C.mag(a) <= 0.0005) continue;
      const isNegativeReal = a.r < 0 && Math.abs(a.i) < 0.0005;
      const term = isNegativeReal
        ? `${C.fmt(C.scale(a, -1))}|${kets[i]}⟩`
        : `${C.fmt(a)}|${kets[i]}⟩`;
      if (out === '') out = term;
      else out += (isNegativeReal ? ' − ' : ' + ') + term;
    }
    return `|ψ⟩ = ${out || '0'}`;
  }
}
