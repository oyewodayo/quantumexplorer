// Lightweight, dependency-free correctness checks for the quantum math
// core (complex arithmetic, Qubit, gate matrices, 2/3-qubit states and
// their measureQubit() collapse), the Teleportation and Superdense
// Coding protocols built on top of it, and the Tunnel tab's real
// Schrödinger solver (probability conservation, transmission scaling).
// Run with:
//   node tests/run.mjs
//
// js/core/*.js and js/tabs/tunneling-tab.js are written as plain browser
// globals (no module.exports), by design, so this loads them into a vm
// sandbox instead of `require`-ing them — the app files themselves stay
// untouched, browser-only scripts. tunneling-tab.js also touches
// `document` in its DOM-facing functions, so a minimal stub goes in
// before it loads — see the comment further down, above where it's
// loaded — letting the real physics functions run as production code
// rather than a parallel reimplementation that could quietly drift out
// of sync with them.

import assert from 'node:assert';
import { C } from '../src/core/complex.js';
import { Qubit } from '../src/core/qubit.js';
import { GATES, rotationMatrix } from '../src/core/gates.js';
import { TwoQubitState } from '../src/core/twoQubit.js';
import { ThreeQubitState } from '../src/core/threeQubit.js';
import { noiseCompute, noiseT2Eff } from '../src/core/noise.js';
import { interferenceIntensity, interferenceMaxIntensity } from '../src/core/interference.js';
import { TunnelSolver, TUNNEL_N } from '../src/core/tunnelSolver.js';



// The quantum math is imported straight from src/core (see the top).
// ─── TUNNEL SOLVER (src/core/tunnelSolver.js) ─────────────────────────
const solver = new TunnelSolver();
let sliderHeightPct = 100, sliderWidthCells = 14;
const setSliderValues = (heightPct, widthCells) => { sliderHeightPct = heightPct; sliderWidthCells = widthCells; };
let tunnelBarrier = null;
const runBarrier = () => { tunnelBarrier = solver.buildBarrier(sliderHeightPct / 100, sliderWidthCells); return tunnelBarrier; };
const tunnelLaunchWave = () => solver.launch();
const tunnelStep = () => solver.step();
const tunnelSplitProbs = () => solver.splitProbs(tunnelBarrier);
const getPsi = () => ({ psiR: solver.psiR, psiI: solver.psiI });

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  - ${name}`);
  } catch (e) {
    console.error(`FAIL - ${name}`);
    console.error(`       ${e.message}`);
    process.exitCode = 1;
  }
}

function approxEqual(a, b, eps, msg) {
  assert.ok(Math.abs(a - b) < eps, `${msg}: expected ${a} ≈ ${b}`);
}

// ── Complex arithmetic ──────────────────────────────────────────────
check('C.polar/C.mag/C.arg round-trip', () => {
  const z = C.polar(2, Math.PI / 3);
  approxEqual(C.mag(z), 2, 1e-9, 'magnitude');
  approxEqual(C.arg(z), Math.PI / 3, 1e-9, 'argument');
});

check('C.mul multiplies magnitudes and adds arguments', () => {
  const a = C.polar(2, 0.4);
  const b = C.polar(3, 0.9);
  const p = C.mul(a, b);
  approxEqual(C.mag(p), 6, 1e-9, 'product magnitude');
  approxEqual(C.arg(p), 1.3, 1e-9, 'product argument');
});

// ── Qubit invariants ─────────────────────────────────────────────────
check('fresh Qubit starts at |0⟩', () => {
  const q = new Qubit();
  approxEqual(q.prob0(), 1, 1e-9, 'prob0');
  approxEqual(q.prob1(), 0, 1e-9, 'prob1');
  assert.strictEqual(q.getLabel(), '|0⟩');
});

check('normalization invariant holds after any gate sequence', () => {
  const gateKeys = Object.keys(GATES);
  for (let trial = 0; trial < 200; trial++) {
    const q = new Qubit();
    const steps = 1 + Math.floor(Math.random() * 6);
    for (let i = 0; i < steps; i++) {
      const key = gateKeys[Math.floor(Math.random() * gateKeys.length)];
      q.applyGate(GATES[key].matrix);
    }
    approxEqual(q.prob0() + q.prob1(), 1, 1e-9, `trial ${trial}`);
  }
});

check('H creates an equal superposition', () => {
  const q = new Qubit();
  q.applyGate(GATES.H.matrix);
  approxEqual(q.prob0(), 0.5, 1e-9, 'prob0');
  approxEqual(q.prob1(), 0.5, 1e-9, 'prob1');
});

check('H is its own inverse (H·H = I)', () => {
  const q = new Qubit();
  q.applyGate(GATES.H.matrix);
  q.applyGate(GATES.H.matrix);
  approxEqual(q.prob0(), 1, 1e-9, 'prob0');
  approxEqual(q.prob1(), 0, 1e-9, 'prob1');
});

check('X flips |0⟩ to |1⟩', () => {
  const q = new Qubit();
  q.applyGate(GATES.X.matrix);
  approxEqual(q.prob0(), 0, 1e-9, 'prob0');
  approxEqual(q.prob1(), 1, 1e-9, 'prob1');
});

// ── Gate matrices must be unitary (M†M = I), or applying them would
//    silently leak or gain probability ─────────────────────────────────
check('every standard gate matrix is unitary', () => {
  const conj = z => ({ r: z.r, i: -z.i });
  Object.entries(GATES).forEach(([name, gate]) => {
    const m = gate.matrix;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        let sum = { r: 0, i: 0 };
        for (let k = 0; k < 2; k++) {
          sum = C.add(sum, C.mul(conj(m[k][i]), m[k][j]));
        }
        const expected = i === j ? 1 : 0;
        approxEqual(sum.r, expected, 1e-9, `${name} (M†M)[${i}][${j}].r`);
        approxEqual(sum.i, 0, 1e-9, `${name} (M†M)[${i}][${j}].i`);
      }
    }
  });
});

// ── Rotation gates ────────────────────────────────────────────────────
check('rotation gates are unitary for arbitrary angles', () => {
  const conj = z => ({ r: z.r, i: -z.i });
  ['X', 'Y', 'Z'].forEach(axis => {
    [0, 33, 90, 180, 271, 360].forEach(angleDeg => {
      const m = rotationMatrix(axis, angleDeg);
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          let sum = { r: 0, i: 0 };
          for (let k = 0; k < 2; k++) sum = C.add(sum, C.mul(conj(m[k][i]), m[k][j]));
          const expected = i === j ? 1 : 0;
          approxEqual(sum.r, expected, 1e-9, `R${axis}(${angleDeg}°) (M†M)[${i}][${j}].r`);
          approxEqual(sum.i, 0, 1e-9, `R${axis}(${angleDeg}°) (M†M)[${i}][${j}].i`);
        }
      }
    });
  });
});

check('Rx(360°) returns to the identity (up to global phase)', () => {
  const q = new Qubit();
  q.applyGate(rotationMatrix('X', 360));
  approxEqual(q.prob0(), 1, 1e-9, 'prob0');
  approxEqual(q.prob1(), 0, 1e-9, 'prob1');
});

// ── Two-qubit state / CNOT ────────────────────────────────────────────
check('fresh TwoQubitState starts at |00⟩', () => {
  const s = new TwoQubitState();
  approxEqual(s.prob(0), 1, 1e-9, 'prob(00)');
  approxEqual(s.prob(1) + s.prob(2) + s.prob(3), 0, 1e-9, 'other probs');
});

check('single-qubit gate on qubit 0 only touches that qubit (X on Q0: |00⟩ → |10⟩)', () => {
  const s = new TwoQubitState();
  s.applySingleQubitGate(0, GATES.X.matrix);
  approxEqual(s.prob(2), 1, 1e-9, 'prob(10)');
});

check('single-qubit gate on qubit 1 only touches that qubit (X on Q1: |00⟩ → |01⟩)', () => {
  const s = new TwoQubitState();
  s.applySingleQubitGate(1, GATES.X.matrix);
  approxEqual(s.prob(1), 1, 1e-9, 'prob(01)');
});

check('CNOT leaves |00⟩ unchanged (control is 0)', () => {
  const s = new TwoQubitState();
  s.applyCNOT(0, 1);
  approxEqual(s.prob(0), 1, 1e-9, 'prob(00)');
});

check('CNOT flips the target when the control is 1 (|10⟩ → |11⟩)', () => {
  const s = new TwoQubitState();
  s.applySingleQubitGate(0, GATES.X.matrix); // |00⟩ -> |10⟩
  s.applyCNOT(0, 1);
  approxEqual(s.prob(3), 1, 1e-9, 'prob(11)');
});

check('H on Q0 then CNOT Q0→Q1 builds the Bell state (|00⟩+|11⟩)/√2', () => {
  const s = new TwoQubitState();
  s.applySingleQubitGate(0, GATES.H.matrix);
  s.applyCNOT(0, 1);
  approxEqual(s.prob(0), 0.5, 1e-9, 'prob(00)');
  approxEqual(s.prob(3), 0.5, 1e-9, 'prob(11)');
  approxEqual(s.prob(1) + s.prob(2), 0, 1e-9, 'prob(01)+prob(10)');
});

check('TwoQubitState normalization invariant holds after any gate sequence', () => {
  const gateKeys = Object.keys(GATES);
  for (let trial = 0; trial < 200; trial++) {
    const s = new TwoQubitState();
    const steps = 1 + Math.floor(Math.random() * 6);
    for (let i = 0; i < steps; i++) {
      if (Math.random() < 0.3) {
        const control = Math.random() < 0.5 ? 0 : 1;
        s.applyCNOT(control, 1 - control);
      } else {
        const key = gateKeys[Math.floor(Math.random() * gateKeys.length)];
        s.applySingleQubitGate(Math.random() < 0.5 ? 0 : 1, GATES[key].matrix);
      }
    }
    const total = s.prob(0) + s.prob(1) + s.prob(2) + s.prob(3);
    approxEqual(total, 1, 1e-9, `trial ${trial}`);
  }
});

// ─── THREE-QUBIT STATE / measureQubit() (Teleport) ─────────────────────
check('ThreeQubitState.measureQubit() collapses consistently and stays normalized', () => {
  for (let trial = 0; trial < 100; trial++) {
    const s = new ThreeQubitState();
    s.applySingleQubitGate(0, GATES.H.matrix);
    s.applySingleQubitGate(1, GATES.H.matrix);
    s.applyCNOT(1, 2);
    const outcome = s.measureQubit(1);
    for (let idx = 0; idx < 8; idx++) {
      const bit = (idx >> 1) & 1;
      if (bit !== outcome) approxEqual(s.prob(idx), 0, 1e-12, `idx ${idx} should be zeroed`);
    }
    const total = [0,1,2,3,4,5,6,7].reduce((a, i) => a + s.prob(i), 0);
    approxEqual(total, 1, 1e-9, `trial ${trial} renormalized`);
  }
});

// ─── TWO-QUBIT STATE / measureQubit() (Superdense Coding) ──────────────
check('TwoQubitState.measureQubit() collapses consistently and stays normalized', () => {
  for (let trial = 0; trial < 100; trial++) {
    const s = new TwoQubitState();
    s.applySingleQubitGate(0, GATES.H.matrix);
    s.applyCNOT(0, 1);
    const outcome = s.measureQubit(0);
    for (let idx = 0; idx < 4; idx++) {
      const bit = (idx >> 1) & 1;
      if (bit !== outcome) approxEqual(s.prob(idx), 0, 1e-12, `idx ${idx} should be zeroed`);
    }
    approxEqual(s.prob(0) + s.prob(1) + s.prob(2) + s.prob(3), 1, 1e-9, `trial ${trial} renormalized`);
  }
});

// ─── TELEPORTATION PROTOCOL (Teleport tab) ──────────────────────────────
// Forces a specific (m0,m1) outcome by hand (test-only — production uses
// the real random measureQubit()) so every correction branch gets
// exercised, not just whichever one chance happens to land on.
function forceMeasure3(state, qubitIndex, outcome) {
  const shift = 2 - qubitIndex;
  for (let idx = 0; idx < 8; idx++) {
    if (((idx >> shift) & 1) !== outcome) state.amps[idx] = { r: 0, i: 0 };
  }
  state._normalize();
}

function runTeleport(theta, phi, m0, m1) {
  const msg = new Qubit();
  msg.setState(theta, phi);
  const state = new ThreeQubitState();
  state.amps[0] = { ...msg.alpha }; // |000>
  state.amps[4] = { ...msg.beta };  // |100>
  state.applySingleQubitGate(1, GATES.H.matrix);
  state.applyCNOT(1, 2);
  state.applyCNOT(0, 1);
  state.applySingleQubitGate(0, GATES.H.matrix);
  forceMeasure3(state, 0, m0);
  forceMeasure3(state, 1, m1);
  if (m0 === 1) state.applySingleQubitGate(2, GATES.Z.matrix);
  if (m1 === 1) state.applySingleQubitGate(2, GATES.X.matrix);
  return { bloch: state.getSingleQubitBloch(2), expected: msg.getBloch() };
}

check('Teleportation reproduces the original message exactly, all 4 correction branches, 40 random states', () => {
  for (let trial = 0; trial < 40; trial++) {
    const theta = Math.random() * Math.PI;
    const phi = Math.random() * 2 * Math.PI;
    for (const m0 of [0, 1]) {
      for (const m1 of [0, 1]) {
        const { bloch, expected } = runTeleport(theta, phi, m0, m1);
        const dist = Math.hypot(bloch.x - expected.x, bloch.y - expected.y, bloch.z - expected.z);
        // Qubit.getPhi() drops the phase when |alpha| < 0.001 (a point within ~0.002 rad of a pole,
        // where phi is physically meaningless), so allow that much slack there.
        const tol = Math.min(theta, Math.PI - theta) < 0.01 ? 3e-3 : 1e-6;
        assert.ok(dist < tol, `trial ${trial} m0=${m0} m1=${m1}: distance ${dist} too large`);
      }
    }
  }
});

// ─── SUPERDENSE CODING PROTOCOL ─────────────────────────────────────────
check('Superdense coding decodes all 4 messages exactly, with probability 1', () => {
  for (const b0 of [0, 1]) {
    for (const b1 of [0, 1]) {
      const state = new TwoQubitState();
      state.applySingleQubitGate(0, GATES.H.matrix);
      state.applyCNOT(0, 1);
      if (b1 === 1) state.applySingleQubitGate(0, GATES.X.matrix);
      if (b0 === 1) state.applySingleQubitGate(0, GATES.Z.matrix);
      state.applyCNOT(0, 1);
      state.applySingleQubitGate(0, GATES.H.matrix);
      const expectedIdx = (b0 << 1) | b1;
      approxEqual(state.prob(expectedIdx), 1, 1e-9, `message (${b0},${b1}) -> index ${expectedIdx}`);
      for (let idx = 0; idx < 4; idx++) {
        if (idx !== expectedIdx) approxEqual(state.prob(idx), 0, 1e-9, `message (${b0},${b1}) leak into index ${idx}`);
      }
    }
  }
});

// ─── GROVER'S SEARCH (js/core/two-qubit.js's applyPhaseFlip()/
//     applyDiffusionReflect(), added for this tab — js/tabs/grover-tab.js
//     is itself untested UI glue around exactly this sequence) ─────────
check('Grover oracle changes no probability, only phase, for all 4 possible marked items', () => {
  for (let target = 0; target < 4; target++) {
    const state = new TwoQubitState();
    state.applySingleQubitGate(0, GATES.H.matrix);
    state.applySingleQubitGate(1, GATES.H.matrix);
    const before = [0, 1, 2, 3].map(i => state.prob(i));
    state.applyPhaseFlip(target);
    const after = [0, 1, 2, 3].map(i => state.prob(i));
    before.forEach((p, i) => approxEqual(after[i], p, 1e-12, `target ${target}: prob(${i}) changed after oracle`));
  }
});

check('Grover diffusion (1 iteration, N=4) finds the marked item with probability 1, for all 4 possible targets', () => {
  for (let target = 0; target < 4; target++) {
    const state = new TwoQubitState();
    state.applySingleQubitGate(0, GATES.H.matrix);
    state.applySingleQubitGate(1, GATES.H.matrix);
    state.applyPhaseFlip(target);
    state.applySingleQubitGate(0, GATES.H.matrix);
    state.applySingleQubitGate(1, GATES.H.matrix);
    state.applyDiffusionReflect();
    state.applySingleQubitGate(0, GATES.H.matrix);
    state.applySingleQubitGate(1, GATES.H.matrix);
    approxEqual(state.prob(target), 1, 1e-9, `target ${target}: marked-item probability`);
    for (let idx = 0; idx < 4; idx++) {
      if (idx !== target) approxEqual(state.prob(idx), 0, 1e-9, `target ${target}: leak into index ${idx}`);
    }
  }
});

// N=8 (3 qubits) is the general-case demo mode: 1 iteration isn't enough
// and 2 iterations isn't exact — both genuinely different from N=4's
// one-shot-exact special case, which is the whole pedagogical point of
// offering it as a second mode.
function runGroverN8(target, iterations) {
  const state = new ThreeQubitState();
  state.applySingleQubitGate(0, GATES.H.matrix);
  state.applySingleQubitGate(1, GATES.H.matrix);
  state.applySingleQubitGate(2, GATES.H.matrix);
  for (let k = 0; k < iterations; k++) {
    state.applyPhaseFlip(target);
    state.applySingleQubitGate(0, GATES.H.matrix);
    state.applySingleQubitGate(1, GATES.H.matrix);
    state.applySingleQubitGate(2, GATES.H.matrix);
    state.applyDiffusionReflect();
    state.applySingleQubitGate(0, GATES.H.matrix);
    state.applySingleQubitGate(1, GATES.H.matrix);
    state.applySingleQubitGate(2, GATES.H.matrix);
  }
  return state;
}

check('Grover oracle (N=8) changes no probability, only phase, for all 8 possible marked items', () => {
  for (let target = 0; target < 8; target++) {
    const state = new ThreeQubitState();
    state.applySingleQubitGate(0, GATES.H.matrix);
    state.applySingleQubitGate(1, GATES.H.matrix);
    state.applySingleQubitGate(2, GATES.H.matrix);
    const before = Array.from({ length: 8 }, (_, i) => state.prob(i));
    state.applyPhaseFlip(target);
    const after = Array.from({ length: 8 }, (_, i) => state.prob(i));
    before.forEach((p, i) => approxEqual(after[i], p, 1e-12, `target ${target}: prob(${i}) changed after oracle`));
  }
});

check('Grover diffusion (N=8) reaches its analytic peak of ~94.5% after 2 iterations, for all 8 possible targets, and a 3rd iteration overshoots', () => {
  for (let target = 0; target < 8; target++) {
    const p2 = runGroverN8(target, 2).prob(target);
    assert.ok(p2 > 0.94 && p2 < 0.95, `target ${target}: expected ~94.5% after 2 iterations, got ${(p2 * 100).toFixed(2)}%`);
  }
  const p3 = runGroverN8(0, 3).prob(0);
  assert.ok(p3 < 0.4, `target 0: expected a 3rd iteration to overshoot past the peak (<40%), got ${(p3 * 100).toFixed(2)}%`);
});

// ─── TUNNEL SOLVER (js/tabs/tunneling-tab.js, loaded for real above) ───
// Backs up the "validated separately" claim in tunneling-tab.js's own
// header comment with an actual checked-in assertion, run every time
// instead of having been eyeballed once.
check('Tunnel solver conserves probability to <0.3% over a full run', () => {
  setSliderValues(100, 14); // V0 = 1.00×E, width 14 — the tab's own default
  const barrier = runBarrier();
  tunnelLaunchWave();
  const { psiR, psiI } = getPsi();
  let normBefore = 0;
  for (let j = 0; j < TUNNEL_N; j++) normBefore += (psiR[j] ** 2 + psiI[j] ** 2);
  for (let s = 0; s < 3200; s++) tunnelStep();
  let normAfter = 0;
  for (let j = 0; j < TUNNEL_N; j++) normAfter += (psiR[j] ** 2 + psiI[j] ** 2);
  const drift = Math.abs(normAfter - normBefore) / normBefore;
  assert.ok(drift < 0.003, `norm drifted by ${(drift * 100).toFixed(3)}%, expected <0.3%`);
});

check('Tunnel transmission probability falls as the barrier grows relative to the packet energy', () => {
  const transmissionAt = (heightPct) => {
    setSliderValues(heightPct, 14);
    runBarrier();
    tunnelLaunchWave();
    for (let s = 0; s < 3200; s++) tunnelStep();
    return tunnelSplitProbs().pRight;
  };
  const atEqualEnergy  = transmissionAt(100); // V0 = 1.00×E
  const atHigherEnergy = transmissionAt(250); // V0 = 2.50×E
  assert.ok(atEqualEnergy > 0.1, `expected noticeable tunneling at V0=E, got ${(atEqualEnergy * 100).toFixed(1)}%`);
  assert.ok(atHigherEnergy < atEqualEnergy, `raising the barrier should reduce transmission: ${(atHigherEnergy*100).toFixed(2)}% vs ${(atEqualEnergy*100).toFixed(2)}%`);
  assert.ok(atHigherEnergy < 0.02, `expected transmission near-zero at V0=2.5E, got ${(atHigherEnergy * 100).toFixed(2)}%`);
});

// ── Noise (T1/T2 decay) ─────────────────────────────────────────────
check('Noise: T2 is capped at 2*T1', () => {
  assert.strictEqual(noiseT2Eff(40, 200), 80);
  assert.strictEqual(noiseT2Eff(80, 60), 60);
});

check('Noise: equator state decays in x/y and z relaxes to +1', () => {
  const p = { x0: 1, y0: 0, z0: 0, t1: 80, t2: 60 };
  const start = noiseCompute(0, p);
  approxEqual(start.x, 1, 1e-12, 'x at t=0');
  approxEqual(start.z, 0, 1e-12, 'z at t=0');
  const late = noiseCompute(2000, p);
  approxEqual(late.x, 0, 1e-6, 'x at late time');
  approxEqual(late.z, 1, 1e-6, 'z at late time');
  approxEqual(noiseCompute(60, p).x, Math.exp(-1), 1e-12, 'x after one T2');
});

// ── Interference ────────────────────────────────────────────────────
check('Interference: coherent intensity spans [0,4]; single and which-path are flat', () => {
  const geo = { screenX: 400, sourceX: 100, y1: 90, y2: 110 };
  let lo = Infinity, hi = -Infinity;
  for (let y = 0; y < 200; y += 0.25) {
    const v = interferenceIntensity(y, geo, 'coherent', 6);
    lo = Math.min(lo, v); hi = Math.max(hi, v);
  }
  assert.ok(lo >= -1e-9 && hi <= 4 + 1e-9, 'range [' + lo + ', ' + hi + ']');
  assert.ok(lo < 0.1 && hi > 3.9, 'fringes should reach near 0 and near 4');
  assert.strictEqual(interferenceIntensity(50, geo, 'single', 6), 1);
  assert.strictEqual(interferenceIntensity(50, geo, 'which-path', 6), 2);
  assert.deepStrictEqual(['single', 'which-path', 'coherent'].map(interferenceMaxIntensity), [1, 2, 4]);
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error('Some checks FAILED.');
  process.exit(1);
} else {
  console.log('All checks passed.');
}
