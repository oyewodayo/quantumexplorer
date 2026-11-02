'use strict';
// Depends on: core/two-qubit.js (TwoQubitState) and core/three-qubit.js
// (ThreeQubitState) — both gained the same two Grover primitives this
// term: applyPhaseFlip() (the oracle) and applyDiffusionReflect()
// (diffusion's fixed middle step). core/gates.js (GATES), core/utils.js
// (delay()), core/dom-utils.js (setExplainer), core/tab-registry.js
// (registerTab).
//
// ALGORITHM (verified computationally for every possible marked item, in
// both N=4 and N=8, before this UI was built — see tests/run.js):
//   Two selectable sizes, the same algorithm at two points on its own
//   accuracy curve, not two different ideas:
//     - N=4 (2 qubits), 1 iteration: exact. Probability at the marked
//       index is exactly 1 after one query — the textbook special case.
//     - N=8 (3 qubits), 2 iterations: the general case made visible.
//       Probability peaks at ~94.5%, not 1, and a 3rd iteration would
//       overshoot past that peak rather than improving on it.
//   Both run the same sequence: H on every qubit, then `iterations`
//   repetitions of [oracle: flip the marked item's amplitude sign alone
//   (applyPhaseFlip) — diffusion: H on every qubit, flip every amplitude
//   except |0...0⟩'s (applyDiffusionReflect), H on every qubit again],
//   then measure every qubit.

const GROVER_MODES = {
  n4: { qubits: 2, N: 4, iterations: 1 },
  n8: { qubits: 3, N: 8, iterations: 2 }
};
let groverMode = 'n4';
let groverTarget = '00';
let groverAnimating = false;
let groverSearchCount = 0;
let groverFoundCount = 0;
const GROVER_STEP_MS = 750;

function groverItems() {
  const { qubits, N } = GROVER_MODES[groverMode];
  return Array.from({ length: N }, (_, i) => i.toString(2).padStart(qubits, '0'));
}
function groverIdx(key) { return parseInt(key, 2); }
function groverNewState() { return groverMode === 'n8' ? new ThreeQubitState() : new TwoQubitState(); }
function groverSuffix() { return groverMode === 'n8' ? '-n8' : ''; }

function setGroverTarget(key) {
  if (groverAnimating) return;
  groverTarget = key;
  const suffix = groverSuffix();
  document.querySelectorAll('[data-grover-target]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.groverTarget === key));
  document.getElementById('grover-target-val').textContent = key;
  document.getElementById('grover-found-val').textContent = '?';
  document.getElementById('grover-found-val').classList.remove('set');
  document.getElementById(`grover-oracle-gate-target${suffix}`).textContent =
    t('grover.oracleMarks', 'marks {t}').replace('{t}', key);

  // A new target invalidates the previous run's results everywhere, not
  // just the Found chip — without this, picking a new item without
  // pressing Search again left the amplitude chart and the circuit's own
  // meter readout showing the old target's numbers next to the new
  // target's label, an actual mismatch rather than just an unrun state.
  const { qubits } = GROVER_MODES[groverMode];
  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = '?';
  }
  updateGroverBars(groverNewState());
}

/** Redraws every bar for the current mode's item set from a live state —
 *  bar height is the probability (|amplitude|²), the badge above it is
 *  the amplitude's sign. The two deliberately don't always move together:
 *  right after the oracle, every sign badge can change while every bar
 *  height stays exactly put — that gap is the entire point of the demo.
 *  Only touches the elements for the current mode's item keys, so the
 *  other mode's (hidden) chart is simply left alone. */
function updateGroverBars(state) {
  groverItems().forEach((key, idx) => {
    const histEl = document.getElementById(`grover-hist-${key}`);
    if (!histEl) return;
    const p = state.prob(idx) * 100;
    histEl.style.height = p + '%';
    document.getElementById(`grover-pct-${key}`).textContent = Math.round(p) + '%';
    const signEl = document.getElementById(`grover-sign-${key}`);
    const negative = state.amps[idx].r < -1e-9;
    signEl.textContent = negative ? '−' : '+';
    signEl.classList.toggle('grover-sign-neg', negative);
  });
}

function updateGroverTally() {
  const el = document.getElementById('grover-tally-text');
  if (!groverSearchCount) { el.textContent = ''; return; }
  const key = groverMode === 'n8' ? 'grover.tallyN8' : 'grover.tally';
  const fallback = groverMode === 'n8'
    ? '{n} searches · {found}/{n} found after 2 queries'
    : '{n} searches · {found}/{n} found on the first query';
  el.textContent = t(key, fallback)
    .replace('{n}', groverSearchCount).replace('{found}', groverFoundCount).replace('{n}', groverSearchCount);
}

/** One-shot spotlight on a circuit element for its ~700ms turn in the
 *  run — same pattern as Superdense Coding's own pulseStage(), reused
 *  here rather than reimplemented: .teleport-stage/.active (teleport.css)
 *  already defines the glow keyframe, so this only needs to toggle it. */
function pulseGroverStage(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 700);
}

/** Diffusion's own three gates (H, reflection, H) ripple left-to-right
 *  in the order they actually run, rather than one box standing in for
 *  all three — mode-aware since N=4 and N=8 use different element ids
 *  (and N=8 has a third wire's worth of H gates either side). */
function pulseGroverDiffuser(qubits, suffix) {
  for (let q = 0; q < qubits; q++) pulseGroverStage(`grover-gate-diffuse-h${q}a${suffix}`);
  setTimeout(() => pulseGroverStage(`grover-gate-reflect${suffix}`), 200);
  setTimeout(() => { for (let q = 0; q < qubits; q++) pulseGroverStage(`grover-gate-diffuse-h${q}b${suffix}`); }, 400);
}

async function runGrover() {
  if (groverAnimating) return;
  groverAnimating = true;
  document.getElementById('btn-grover-search').disabled = true;
  document.getElementById('btn-reset-grover').disabled = true;
  document.getElementById('grover-result').textContent = t('grover.resultRunning', 'running…');
  document.getElementById('grover-found-val').textContent = '?';
  document.getElementById('grover-found-val').classList.remove('set');

  const { qubits, N, iterations } = GROVER_MODES[groverMode];
  const suffix = groverSuffix();
  const targetIdx = groverIdx(groverTarget);
  const state = groverNewState();

  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = '?';
  }
  document.getElementById('grover-iteration-badge').textContent = '';

  setExplainer('grover-explainer', t('grover.stepStart', 'Every search starts at a definite, uninteresting state — all zeros, exactly like a classical register before you\'ve looked at anything.'));
  updateGroverBars(state);
  await delay(GROVER_STEP_MS);

  for (let q = 0; q < qubits; q++) {
    pulseGroverStage(`grover-gate-h${q}${suffix}`);
    state.applySingleQubitGate(q, GATES.H.matrix);
  }
  setExplainer('grover-explainer', t('grover.stepSuperpose', 'A Hadamard on each qubit spreads the amplitude equally across all {n} items at once — every candidate is "live" simultaneously, not checked one at a time.').replace('{n}', N));
  updateGroverBars(state);
  await delay(GROVER_STEP_MS);

  for (let iter = 1; iter <= iterations; iter++) {
    if (iterations > 1) {
      document.getElementById('grover-iteration-badge').textContent =
        t('grover.iterationBadge', 'Iteration {iter} of {total}').replace('{iter}', iter).replace('{total}', iterations);
    }

    pulseGroverStage(`grover-gate-oracle${suffix}`);
    state.applyPhaseFlip(targetIdx);
    setExplainer('grover-explainer', t('grover.stepOracle', 'The oracle recognizes the marked item and flips the sign of its amplitude alone. Look closely: none of the bars moved — a probability is the squared size of an amplitude, and a negative amplitude squares to exactly the same probability as a positive one the same size. This step is completely invisible to any measurement taken right now.'));
    updateGroverBars(state);
    await delay(GROVER_STEP_MS);

    pulseGroverDiffuser(qubits, suffix);
    for (let q = 0; q < qubits; q++) state.applySingleQubitGate(q, GATES.H.matrix);
    state.applyDiffusionReflect();
    for (let q = 0; q < qubits; q++) state.applySingleQubitGate(q, GATES.H.matrix);

    let diffuseMsg;
    if (iterations === 1) {
      diffuseMsg = t('grover.stepDiffuse', 'Diffusion reflects every amplitude about their shared average. The other amplitudes, already near that average, collapse toward zero; the marked one, sitting on the far side after its sign flipped, gets thrown past the average by twice the gap — turning that invisible phase flip into a visible answer.');
    } else {
      const pctNow = Math.round(state.prob(targetIdx) * 1000) / 10;
      diffuseMsg = t('grover.stepDiffuseIteration', 'Diffusion reflects every amplitude about their shared average, the same rule as always. Iteration {iter} of {total} complete: the marked item\'s probability is now {pct}%.')
        .replace('{iter}', iter).replace('{total}', iterations).replace('{pct}', pctNow);
      if (iter === iterations) {
        diffuseMsg += ' ' + t('grover.overshootNote', 'That\'s the peak for N=8 — a third iteration would overshoot past it, dropping the probability back down to about 33%, not up.');
      }
    }
    setExplainer('grover-explainer', diffuseMsg);
    updateGroverBars(state);
    await delay(GROVER_STEP_MS);
  }

  for (let q = 0; q < qubits; q++) pulseGroverStage(`grover-meter-${q}${suffix}`);
  const bits = [];
  for (let q = 0; q < qubits; q++) bits.push(state.measureQubit(q));
  const found = bits.join('');
  const match = found === groverTarget;

  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = bits[q];
  }
  document.getElementById('grover-found-val').textContent = found;
  document.getElementById('grover-found-val').classList.add('set');
  groverSearchCount++;
  if (match) groverFoundCount++;
  updateGroverTally();

  if (iterations === 1) {
    document.getElementById('grover-result').textContent = match
      ? t('grover.resultMatch', 'Found on the first query')
      : t('grover.resultMismatch', 'Missed — check the console, this should never happen for N=4');
    setExplainer('grover-explainer', t('grover.stepMeasure', 'One query, one measurement, done: {found} — for {n} items with 1 marked, exactly one Grover iteration gives the marked item probability 1, a real measurement over a distribution with no actual uncertainty left in it.').replace('{found}', found).replace('{n}', N));
  } else {
    document.getElementById('grover-result').textContent = match
      ? t('grover.resultMatchN8', 'Found after 2 queries')
      : t('grover.resultMismatchN8', 'Missed this time — genuinely possible about 1 time in 20 for N=8, not a bug');
    setExplainer('grover-explainer', t('grover.stepMeasureApprox', '2 queries, one measurement, done: {found} — for 8 items with 1 marked, 2 Grover iterations bring the marked item\'s probability to about 94.5%, not exactly 1 this time; measured this way, that\'s still a real Born-rule draw, just one where a small, genuine chance of missing remains.').replace('{found}', found));
  }

  groverAnimating = false;
  document.getElementById('btn-grover-search').disabled = false;
  document.getElementById('btn-reset-grover').disabled = false;
}

function resetGrover() {
  if (groverAnimating) return;
  groverSearchCount = 0;
  groverFoundCount = 0;
  updateGroverTally();
  document.getElementById('grover-found-val').textContent = '?';
  document.getElementById('grover-found-val').classList.remove('set');
  document.getElementById('grover-result').textContent = '—';
  document.getElementById('grover-iteration-badge').textContent = '';
  const { qubits } = GROVER_MODES[groverMode];
  const suffix = groverSuffix();
  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = '?';
  }
  updateGroverBars(groverNewState());
  setExplainer('grover-explainer', t('grover.explainerDefault', 'Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.'));
}

/** Switches which of the two (otherwise-identical) circuit/picker/chart
 *  pairs is visible — the two modes are the same algorithm at two sizes,
 *  not two different tabs, so this only ever toggles display, resets the
 *  shared state variables, and re-runs setGroverTarget() for the new
 *  mode's own all-zeros default rather than duplicating that reset logic. */
function setGroverMode(mode) {
  if (groverAnimating || mode === groverMode) return;
  groverMode = mode;
  document.querySelectorAll('[data-grover-mode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.groverMode === mode));

  document.getElementById('grover-circuit-n4-wrap').style.display = mode === 'n4' ? '' : 'none';
  document.getElementById('grover-circuit-n8-wrap').style.display = mode === 'n8' ? '' : 'none';
  document.getElementById('grover-target-picker').style.display = mode === 'n4' ? '' : 'none';
  document.getElementById('grover-target-picker-n8').style.display = mode === 'n8' ? '' : 'none';
  document.getElementById('grover-chart-n4').style.display = mode === 'n4' ? '' : 'none';
  document.getElementById('grover-chart-n8').style.display = mode === 'n8' ? '' : 'none';

  document.getElementById('grover-mode-desc').textContent = mode === 'n8'
    ? t('grover.modeN8Desc', '3 qubits, 1 marked item — needs 2 queries, and even then peaks below 100%.')
    : t('grover.modeN4Desc', '2 qubits, 1 marked item — a single query is exact.');

  groverSearchCount = 0;
  groverFoundCount = 0;
  updateGroverTally();
  setGroverTarget('0'.repeat(GROVER_MODES[mode].qubits));
  document.getElementById('grover-result').textContent = '—';
  setExplainer('grover-explainer', t('grover.explainerDefault', 'Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.'));
}

function initGroverTab() {
  document.querySelectorAll('[data-grover-target]').forEach(btn =>
    btn.addEventListener('click', () => setGroverTarget(btn.dataset.groverTarget)));
  document.querySelectorAll('[data-grover-mode]').forEach(btn =>
    btn.addEventListener('click', () => setGroverMode(btn.dataset.groverMode)));
  document.getElementById('btn-grover-search').addEventListener('click', runGrover);
  document.getElementById('btn-reset-grover').addEventListener('click', resetGrover);

  setGroverTarget('00');
  updateGroverTally();
  registerTab('grover', {});
}
