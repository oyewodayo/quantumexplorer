'use strict';
// Depends on: core/complex.js (C.*). Same shape as two-qubit.js's
// TwoQubitState, generalized from 4 to 8 amplitudes — every method here
// is that file's exact algorithm with one more bit threaded through the
// index math, not a different approach.

// ─── THREE-QUBIT STATE ─────────────────────────────────────────────────
/**
 * A three-qubit state |ψ⟩ = Σ c_b |b⟩ over b = 000..111, stored as a flat
 * 8-entry amplitude array indexed by (q0<<2)|(q1<<1)|q2 — i.e. amps[0]=|000⟩,
 * amps[1]=|001⟩, … amps[7]=|111⟩. Same normalization invariant as Qubit/
 * TwoQubitState: renormalized after every gate.
 */
class ThreeQubitState {
  constructor() {
    this.amps = [{ r: 1, i: 0 }, { r: 0, i: 0 }, { r: 0, i: 0 }, { r: 0, i: 0 },
                 { r: 0, i: 0 }, { r: 0, i: 0 }, { r: 0, i: 0 }, { r: 0, i: 0 }];
  }

  /** Applies a single-qubit 2x2 gate to just one of the three qubits
   *  (I⊗I⊗matrix etc., in whichever position qubitIndex names), leaving
   *  the other two untouched. */
  applySingleQubitGate(qubitIndex, matrix) {
    const next = new Array(8);
    for (let idx = 0; idx < 8; idx++) {
      const bits = [(idx >> 2) & 1, (idx >> 1) & 1, idx & 1];
      const targetBit = bits[qubitIndex];
      let sum = { r: 0, i: 0 };
      for (let srcBit = 0; srcBit < 2; srcBit++) {
        const srcBits = bits.slice();
        srcBits[qubitIndex] = srcBit;
        const srcIdx = (srcBits[0] << 2) | (srcBits[1] << 1) | srcBits[2];
        sum = C.add(sum, C.mul(matrix[targetBit][srcBit], this.amps[srcIdx]));
      }
      next[idx] = sum;
    }
    this.amps = next;
    this._normalize();
  }

  /** Controlled-NOT: flips `target`'s bit whenever `control`'s bit is 1
   *  (control, target ∈ {0,1,2}). A permutation of basis states — no
   *  amplitude mixing — same as TwoQubitState.applyCNOT. */
  applyCNOT(control, target) {
    const next = new Array(8);
    for (let idx = 0; idx < 8; idx++) {
      const bits = [(idx >> 2) & 1, (idx >> 1) & 1, idx & 1];
      if (bits[control] === 1) bits[target] = 1 - bits[target];
      const newIdx = (bits[0] << 2) | (bits[1] << 1) | bits[2];
      next[newIdx] = this.amps[idx];
    }
    this.amps = next;
  }

  /** Toffoli (CCNOT): flips `target`'s bit whenever BOTH `control1` and
   *  `control2` are 1 (all three ∈ {0,1,2}) — a permutation of basis
   *  states, same as applyCNOT just gated on two controls instead of
   *  one. This is the standard building block for classical logic
   *  embedded reversibly in a quantum circuit: with `target` starting at
   *  |0⟩, Toffoli(A, B, target) computes target = A AND B — the Carry
   *  half of a half adder (see CIRCUIT3_PRESETS' 'Half Adder' preset in
   *  circuit-multiqubit-tab.js). */
  applyToffoli(control1, control2, target) {
    const next = new Array(8);
    for (let idx = 0; idx < 8; idx++) {
      const bits = [(idx >> 2) & 1, (idx >> 1) & 1, idx & 1];
      if (bits[control1] === 1 && bits[control2] === 1) bits[target] = 1 - bits[target];
      const newIdx = (bits[0] << 2) | (bits[1] << 1) | bits[2];
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

  /** Grover oracle: flips the sign of one marked basis state's amplitude
   *  alone, leaving every probability (|amplitude|²) exactly unchanged —
   *  the general-N=8 twin of TwoQubitState's own applyPhaseFlip(), used
   *  by the same Grover's Search module for its second, non-exact demo
   *  mode (N=8, 2 iterations). */
  applyPhaseFlip(idx) {
    this.amps[idx] = C.scale(this.amps[idx], -1);
  }

  /** Grover diffusion's middle step, 2|000⟩⟨000| − I: diag(1,−1,…,−1) —
   *  every amplitude except |000⟩'s flips sign. Doesn't depend on which
   *  item is marked, or on how many Grover iterations have already run;
   *  only the surrounding H⊗3 (applied by the caller) does. See
   *  TwoQubitState.applyDiffusionReflect() for the N=4 case this
   *  generalizes — same operator, one more untouched basis state. */
  applyDiffusionReflect() {
    for (let idx = 1; idx < 8; idx++) this.amps[idx] = C.scale(this.amps[idx], -1);
  }

  /** Projectively measures `qubitIndex` in the computational basis: sums
   *  the Born-rule probability of that bit reading 0 across every joint
   *  value of the other two qubits, draws an outcome weighted by that
   *  probability, zeroes every amplitude inconsistent with the outcome,
   *  and renormalizes what's left — an honest partial-measurement
   *  collapse (used by the Teleport tab to measure Alice's two qubits
   *  mid-protocol), not just a read. Measuring a second qubit afterward
   *  is just another call to this — projective measurements onto
   *  different bit positions commute, so calling this twice in either
   *  order gives the same joint statistics as measuring both at once. */
  measureQubit(qubitIndex) {
    const shift = 2 - qubitIndex;
    let p0 = 0;
    for (let idx = 0; idx < 8; idx++) {
      if (((idx >> shift) & 1) === 0) p0 += this.prob(idx);
    }
    const outcome = Math.random() < p0 ? 0 : 1;
    for (let idx = 0; idx < 8; idx++) {
      if (((idx >> shift) & 1) !== outcome) this.amps[idx] = { r: 0, i: 0 };
    }
    this._normalize();
    return outcome;
  }

  /** Reduced single-qubit Bloch vector for `qubitIndex`, tracing out the
   *  other two qubits — same partial-trace idea as TwoQubitState's
   *  version, just summed over the other two qubits' 4 joint values
   *  instead of 1 qubit's 2. See that method's comment for what the
   *  resulting vector's length means (1 = pure/unentangled, shrinking
   *  toward 0 = increasingly entangled with the rest). */
  getSingleQubitBloch(qubitIndex) {
    const others = [0, 1, 2].filter(q => q !== qubitIndex);
    let rho00 = 0, rho11 = 0, rho01 = { r: 0, i: 0 };
    for (let s0 = 0; s0 < 2; s0++) {
      for (let s1 = 0; s1 < 2; s1++) {
        const bits0 = [0, 0, 0], bits1 = [0, 0, 0];
        bits0[others[0]] = bits1[others[0]] = s0;
        bits0[others[1]] = bits1[others[1]] = s1;
        bits0[qubitIndex] = 0;
        bits1[qubitIndex] = 1;
        const idx0 = (bits0[0] << 2) | (bits0[1] << 1) | bits0[2];
        const idx1 = (bits1[0] << 2) | (bits1[1] << 1) | bits1[2];
        const a0 = this.amps[idx0], a1 = this.amps[idx1];
        rho00 += C.mag(a0) ** 2;
        rho11 += C.mag(a1) ** 2;
        rho01 = C.add(rho01, C.mul(a0, C.conj(a1)));
      }
    }
    return { x: 2 * rho01.r, y: -2 * rho01.i, z: rho00 - rho11 };
  }

  getFormula() {
    const kets = ['000', '001', '010', '011', '100', '101', '110', '111'];
    let out = '';
    for (let i = 0; i < 8; i++) {
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
