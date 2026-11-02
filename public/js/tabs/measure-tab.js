'use strict';
// Depends on: core/dom-utils.js (setExplainer, drawCoin, animateCoinFlip —
// the coin is shared with tabs/entanglement-tab.js), core/theme.js
// (onThemeChange), core/tab-registry.js (registerTab), app.js state
// (qubitMeasure, measureCounts, measureCoinState, measureCoinAnimating).

// ═══════════════════════════════════════════════════════════════════
// MEASURE TAB
// ═══════════════════════════════════════════════════════════════════
function initMeasureTab() {
  document.getElementById('btn-measure').addEventListener('click', doMeasure);
  document.getElementById('btn-reset-stats').addEventListener('click', resetStats);
  document.querySelectorAll('#tab-measure .preset-btn').forEach(btn => {
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => setMeasureState(theta, phi));
  });
  document.querySelectorAll('[data-measure-n]').forEach(btn => {
    const n = parseInt(btn.dataset.measureN, 10);
    btn.addEventListener('click', () => measureMany(n));
  });

  const redrawCoin = () => drawCoin('coin-measure', measureCoinState);
  drawCoin('coin-measure', measureCoinState);
  // Same two reasons as the Entangle tab's own coins: a redraw is needed
  // both on re-entering this tab and on a theme change, since draw()
  // always reads the live isDark/coin state.
  registerTab('measure', { onEnter: redrawCoin });
  onThemeChange(redrawCoin);
}

const MEASURE_OPENERS = [
  'The universe rolled its dice —',
  'No more hedging —',
  'The coin finally landed —',
  'Asked, and answered —',
  'The blur snapped into focus —'
];

function setMeasureState(theta, phi) {
  qubitMeasure.setState(theta, phi);
  measureCounts = { 0: 0, 1: 0 };
  resetStats(); // also resets the coin to superposition — see resetStats() below
  updateMeasureUI();
  setExplainer('measure-explainer', 'Right now the qubit hasn\'t committed to anything — it genuinely holds both |0⟩ and |1⟩ at once, weighted by the bars on the left. Hit MEASURE and you\'re forcing it to answer a yes/no question it was actively avoiding.');
}

function updateMeasureUI() {
  const p0 = qubitMeasure.prob0() * 100;
  const p1 = qubitMeasure.prob1() * 100;
  document.getElementById('formula-measure').textContent = qubitMeasure.getFormula();
  document.getElementById('vbar0').style.height = p0 + '%';
  document.getElementById('vbar1').style.height = p1 + '%';
  document.getElementById('vpct0').textContent  = Math.round(p0) + '%';
  document.getElementById('vpct1').textContent  = Math.round(p1) + '%';
}

/** MEASURE — the coin spins through both faces (genuinely undecided,
 *  same visual as the Entangle tab's coins) before landing on the
 *  outcome, rather than snapping to a result instantly; measureCoinState
 *  then holds that result until the next state change or Reset puts the
 *  coin back into superposition (see setMeasureState()/resetStats()). */
async function doMeasure() {
  if (measureCoinAnimating || measureBatchAnimating) return;
  measureCoinAnimating = true;

  const p0before = Math.round(qubitMeasure.prob0() * 100);
  const p1before = Math.round(qubitMeasure.prob1() * 100);

  document.getElementById('measure-result').textContent = '';
  document.getElementById('coin-measure-label').textContent = t('measure.measuring', 'Measuring…');
  document.getElementById('btn-measure').disabled = true;

  await animateCoinFlip('coin-measure', 9, 55);

  const result = qubitMeasure.measure();
  measureCoinState = result;
  measureCounts[result]++;

  drawCoin('coin-measure', result);
  pulseElement(document.getElementById('coin-measure'), 'collapsing');
  document.getElementById('coin-measure-label').textContent = result === 0 ? '|0⟩' : '|1⟩';

  const resEl = document.getElementById('measure-result');
  resEl.style.color   = result === 0 ? 'var(--zero)' : 'var(--one)';
  resEl.style.opacity = '1';
  resEl.textContent   = result === 0 ? '|0⟩' : '|1⟩';
  pulseElement(resEl, 'collapsing', 500);

  // The bars themselves deliberately don't move — they show the fixed odds
  // of the prepared state, not "the answer" — but a flash on whichever
  // bar matched the outcome ties the abstract percentages to what just
  // actually happened.
  const winningTrack = document.getElementById(result === 0 ? 'vbar0' : 'vbar1').closest('.vbar-track');
  winningTrack.style.color = result === 0 ? 'var(--zero)' : 'var(--one)';
  pulseElement(winningTrack, 'collapsing', 600);
  document.getElementById('btn-measure').disabled = false;
  pulseElement(document.getElementById('btn-measure'), 'pulsing');

  updateHistogram();

  const opener = MEASURE_OPENERS[Math.floor(Math.random() * MEASURE_OPENERS.length)];
  const color  = result === 0 ? 'var(--zero)' : 'var(--one)';
  setExplainer('measure-explainer',
    `${opener} <strong style="color:${color}">|${result}⟩</strong>. A split second ago the odds were ${p0before}% / ${p1before}%, and both were equally real possibilities — not "secretly already |${result}⟩ and we just didn't know." The click is what forced a choice; the superposition is gone for good. Want to see it happen again? You'll need to re-prepare the exact same state from scratch.`
  );

  measureCoinAnimating = false;
}

// A batch runs its n trials in MEASURE_BATCH_STEPS chunks rather than one
// synchronous loop — with everything computed at once, .hist-bar's own
// CSS transition (measure.css) only ever gets one old-value-to-new-value
// jump to animate, which reads as snapping straight to the final split
// instead of visibly converging toward it the way the app's other
// repeated-random-event displays do (the Beam Splitter/Stern-Gerlach
// "accumulating plate" mechanic — see js/tabs/beam-splitter-tab.js). This
// keeps every trial genuine (still n real calls to qubitMeasure.measure(),
// just paced), so ×1000 doesn't mean 1000 real DOM updates either.
const MEASURE_BATCH_STEPS  = 10;
const MEASURE_BATCH_STEP_MS = 130;

async function measureMany(n) {
  if (measureCoinAnimating || measureBatchAnimating) return;
  measureBatchAnimating = true;
  document.querySelectorAll('[data-measure-n]').forEach(b => b.disabled = true);
  document.getElementById('btn-measure').disabled = true;
  document.getElementById('btn-reset-stats').disabled = true;

  const resEl = document.getElementById('measure-result');
  resEl.style.color = 'var(--text2)';

  const steps = Math.min(n, MEASURE_BATCH_STEPS);
  const stepBase = Math.floor(n / steps);
  let remainder  = n - stepBase * steps;

  for (let s = 0; s < steps; s++) {
    const stepCount = stepBase + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    for (let i = 0; i < stepCount; i++) measureCounts[qubitMeasure.measure()]++;

    const runningTotal = measureCounts[0] + measureCounts[1];
    resEl.textContent = `${runningTotal} total`;
    updateHistogram();
    if (s < steps - 1) await delay(MEASURE_BATCH_STEP_MS);
  }

  const total = measureCounts[0] + measureCounts[1];
  const p0 = Math.round((measureCounts[0] / total) * 100);
  const p1 = Math.round((measureCounts[1] / total) * 100);
  setExplainer('measure-explainer',
    `Just sent ${n} identical, freshly-prepared qubits through the same measurement — think of it as asking ${n} exact copies of the same question. None of them talk to each other or "remember" the last answer; each collapses on its own. Across ${total} trials so far the split landed near ${p0}% / ${p1}%, and it'll keep creeping toward the true odds the more you run.`
  );

  document.querySelectorAll('[data-measure-n]').forEach(b => b.disabled = false);
  document.getElementById('btn-measure').disabled = false;
  document.getElementById('btn-reset-stats').disabled = false;
  measureBatchAnimating = false;
}

function updateHistogram() {
  const total = measureCounts[0] + measureCounts[1];
  if (total === 0) return;
  const p0 = (measureCounts[0] / total) * 100;
  const p1 = (measureCounts[1] / total) * 100;
  document.getElementById('hist0').style.height = p0 + '%';
  document.getElementById('hist1').style.height = p1 + '%';
  document.getElementById('hpct0').textContent  = Math.round(p0) + '%';
  document.getElementById('hpct1').textContent  = Math.round(p1) + '%';
  document.getElementById('trial-count').textContent = `· ${total} trials`;

  const exp0 = Math.round(qubitMeasure.prob0() * 100);
  const exp1 = Math.round(qubitMeasure.prob1() * 100);
  document.getElementById('convergence-note').textContent =
    total >= 20 ? `Quantum prediction: |0⟩ → ${exp0}%  |1⟩ → ${exp1}%` : '';
}

function resetStats() {
  if (measureCoinAnimating || measureBatchAnimating) return;
  measureCounts = { 0: 0, 1: 0 };
  ['hist0','hist1'].forEach(id => document.getElementById(id).style.height = '0%');
  document.getElementById('hpct0').textContent          = '—';
  document.getElementById('hpct1').textContent          = '—';
  document.getElementById('trial-count').textContent    = '';
  document.getElementById('measure-result').textContent = '';
  document.getElementById('convergence-note').textContent = '';
  // Back to superposition — matches "Reset" conceptually undoing the last
  // collapse, not just clearing the histogram.
  measureCoinState = null;
  drawCoin('coin-measure', null);
  document.getElementById('coin-measure-label').textContent = t('measure.unmeasured', 'Unmeasured');
}
