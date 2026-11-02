'use strict';
// Depends on: core/tab-registry.js (registerTab), core/i18n.js (t()).
// The interactive "measure the pair" demo deliberately lives only on the
// Entangle tab (js/tabs/entanglement-tab.js) — repeating the same
// coin-flip UI here for Φ⁺ specifically would just duplicate it, so this
// tab instead illustrates all four states: a circuit diagram, a same/
// opposite-by-phase taxonomy grid, and the exact (not sampled) Born-rule
// probability split for whichever state is selected.

// ═══════════════════════════════════════════════════════════════════
// BELL STATES TAB
// ═══════════════════════════════════════════════════════════════════
const BELL_STATES = {
  phiplus:  { symbol: 'Φ⁺', ketA: '00', ketB: '11', correlation: 'same',
              formula: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2', needsXA: false, needsXB: false },
  phiminus: { symbol: 'Φ⁻', ketA: '00', ketB: '11', correlation: 'same',
              formula: '|Φ⁻⟩ = (|00⟩ − |11⟩) / √2', needsXA: true,  needsXB: false },
  psiplus:  { symbol: 'Ψ⁺', ketA: '01', ketB: '10', correlation: 'opposite',
              formula: '|Ψ⁺⟩ = (|01⟩ + |10⟩) / √2', needsXA: false, needsXB: true },
  psiminus: { symbol: 'Ψ⁻', ketA: '01', ketB: '10', correlation: 'opposite',
              formula: '|Ψ⁻⟩ = (|01⟩ − |10⟩) / √2', needsXA: true,  needsXB: true }
};

// English fallback for t() — actual copy lives in js/locales/*.js under
// the same bellstates.recipe.<key> keys.
const BELL_RECIPE_FALLBACK = {
  phiplus:  'Start at |00⟩, apply H to qubit A, then CNOT (A → B).',
  phiminus: 'Start at |00⟩, apply X to qubit A, then H to qubit A, then CNOT (A → B).',
  psiplus:  'Start at |00⟩, apply X to qubit B, then H to qubit A, then CNOT (A → B).',
  psiminus: 'Start at |00⟩, apply X to both qubits, then H to qubit A, then CNOT (A → B).'
};

let currentBellState = 'phiplus';
let bellAnimating = false;
const BELL_ANIM_STEP_MS = 700;
const BELL_TOKEN_BASE_X = 70; // matches the tokens' own cx/x in index.html — translateX is measured from here

function initBellStatesTab() {
  document.querySelectorAll('#bellstate-picker [data-bell], #bellstate-family [data-bell]').forEach(btn => {
    btn.addEventListener('click', () => setBellState(btn.dataset.bell));
  });
  document.getElementById('btn-run-bellstate').addEventListener('click', runBellStateCircuit);

  registerTab('bellstates', {});
  updateBellStateDisplay();
}

function setBellState(key) {
  if (bellAnimating) return; // mid-run — the picker/family buttons are disabled anyway, but guard directly too
  currentBellState = key;
  updateBellStateDisplay();
}

/* Refreshes every surface that depends on which Bell state is selected:
   the formula, the recipe text, the circuit diagram's X gates, the
   picker's and family grid's active highlight, and the exact probability
   split (no sampling — these are the Born-rule values themselves). */
function updateBellStateDisplay() {
  const s = BELL_STATES[currentBellState];

  document.getElementById('bellstate-formula').textContent = s.formula;
  document.getElementById('bellstate-recipe').textContent =
    t(`bellstates.recipe.${currentBellState}`, BELL_RECIPE_FALLBACK[currentBellState]);

  document.getElementById('bellstate-gate-xa').classList.toggle('circuit-gate-off', !s.needsXA);
  document.getElementById('bellstate-gate-xb').classList.toggle('circuit-gate-off', !s.needsXB);

  document.querySelectorAll('[data-bell]').forEach(b =>
    b.classList.toggle('active', b.dataset.bell === currentBellState));

  document.getElementById('bellstate-distribution-note').textContent =
    t('bellstates.distributionNote', 'Exact Born-rule probabilities for {symbol} — no sampling needed, these follow directly from squaring each amplitude.')
      .replace('{symbol}', `|${s.symbol}⟩`);

  ['00', '01', '10', '11'].forEach(k => {
    const pct = (k === s.ketA || k === s.ketB) ? 50 : 0;
    document.getElementById(`bstat-fill-${k}`).style.width = pct + '%';
    document.getElementById(`bstat-pct-${k}`).textContent = pct + '%';
  });

  document.querySelectorAll('#bell-stats-rows .prob-row').forEach(row => {
    const possible = row.dataset.ket === s.ketA || row.dataset.ket === s.ketB;
    row.classList.toggle('bell-impossible', !possible);
  });

  resetBellTokens();
}

// ═══════════════════════════════════════════════════════════════════
// CIRCUIT DIAGRAM — RUN ANIMATION
// ═══════════════════════════════════════════════════════════════════
// The always-on .circuit-gate-glow loop above is purely decorative
// "signal flow"; this is the actual thing it's gesturing at — a value
// token per wire, gliding through each gate and picking up that gate's
// real effect: X flips the label, H turns qubit A's token into a genuine
// dashed "superposed" look (not a definite digit — the entire point),
// and CNOT gives qubit B the same look plus a shared color and a
// connecting arc, since B is now correlated with A's superposition
// rather than independently random. Never collapses either token to one
// value at the end — that would misrepresent what the circuit actually
// leaves behind (an unmeasured entangled pair, not a fixed answer).

/** Moves one token to grid position `x` (one of the fixed checkpoints
 *  below) by translating from its base position in index.html —
 *  BELL_TOKEN_BASE_X — so this only ever needs one coordinate, not a
 *  running offset. */
function setBellTokenX(id, x) {
  document.getElementById(id).style.transform = `translateX(${x - BELL_TOKEN_BASE_X}px)`;
}

/** Restores both tokens to their pre-run look — hidden, back at the
 *  start, |0⟩, no superposed/entangled styling. Called whenever the
 *  selected state changes (mid-run switching is blocked in setBellState()
 *  already, but a state change between runs should always clear the
 *  previous run's leftover styling) and at the very start of a run. */
function resetBellTokens() {
  ['a', 'b'].forEach(wire => {
    const g = document.getElementById(`bellstate-token-${wire}`);
    g.classList.add('token-hidden');
    g.classList.remove('superposed', 'entangled', 'token-pulse');
    g.querySelector('.token-label').textContent = '0';
    setBellTokenX(`bellstate-token-${wire}`, BELL_TOKEN_BASE_X);
  });
  document.getElementById('bellstate-entangle-link').classList.remove('shown');
}

async function runBellStateCircuit() {
  if (bellAnimating) return;
  bellAnimating = true;

  const s = BELL_STATES[currentBellState];
  const runBtn = document.getElementById('btn-run-bellstate');
  runBtn.disabled = true;
  document.querySelectorAll('#bellstate-picker [data-bell], #bellstate-family [data-bell]').forEach(b => b.disabled = true);
  document.getElementById('bellstate-anim-status').textContent = t('common.running', 'running…');

  resetBellTokens();
  const tokenA = document.getElementById('bellstate-token-a');
  const tokenB = document.getElementById('bellstate-token-b');
  const labelA = tokenA.querySelector('.token-label');
  const labelB = tokenB.querySelector('.token-label');
  const setNarration = txt => { document.getElementById('bellstate-anim-explainer').textContent = txt; };

  tokenA.classList.remove('token-hidden');
  tokenB.classList.remove('token-hidden');
  setNarration(t('bellstates.animStart', 'Both qubits start at |0⟩ — watch the value on each wire as it moves through the gates.'));
  await delay(BELL_ANIM_STEP_MS);

  // ─── X gates — flip whichever wire(s) this state needs ───
  setBellTokenX('bellstate-token-a', 110);
  setBellTokenX('bellstate-token-b', 110);
  await delay(BELL_ANIM_STEP_MS);
  if (s.needsXA) {
    labelA.textContent = '1';
    tokenA.classList.add('token-pulse');
    setNarration(t('bellstates.animFlipA', 'X flips qubit A: 0 → 1.'));
    await delay(500);
    tokenA.classList.remove('token-pulse');
  }
  if (s.needsXB) {
    labelB.textContent = '1';
    tokenB.classList.add('token-pulse');
    setNarration(t('bellstates.animFlipB', 'X flips qubit B: 0 → 1.'));
    await delay(500);
    tokenB.classList.remove('token-pulse');
  }
  if (!s.needsXA && !s.needsXB) {
    setNarration(t('bellstates.animNoFlip', 'This state needs no X gate — both qubits stay at |0⟩ so far.'));
    await delay(400);
  }

  // ─── H on qubit A — a real superposition, not a coin-flip guess ───
  setBellTokenX('bellstate-token-a', 220);
  setBellTokenX('bellstate-token-b', 220);
  await delay(BELL_ANIM_STEP_MS);
  tokenA.classList.add('superposed');
  labelA.textContent = '0∕1';
  setNarration(t('bellstates.animSuperpose', 'H puts qubit A into a genuine superposition — no longer a definite 0 or 1, both at once.'));
  await delay(BELL_ANIM_STEP_MS);

  // ─── CNOT — entangles B with A's superposition ───
  setBellTokenX('bellstate-token-a', 320);
  setBellTokenX('bellstate-token-b', 320);
  await delay(BELL_ANIM_STEP_MS);
  tokenB.classList.add('superposed');
  labelB.textContent = '0∕1';
  tokenA.classList.add('entangled');
  tokenB.classList.add('entangled');
  setNarration(t('bellstates.animEntangle', 'CNOT entangles B with A — B is now correlated with A\'s superposition, not independently random.'));
  await delay(BELL_ANIM_STEP_MS);

  // ─── Final — still unmeasured, so both tokens stay superposed; the
  // arc is the only new thing, showing the two wires are now linked ───
  setBellTokenX('bellstate-token-a', 420);
  setBellTokenX('bellstate-token-b', 420);
  await delay(BELL_ANIM_STEP_MS);
  document.getElementById('bellstate-entangle-link').classList.add('shown');
  setNarration(t('bellstates.animDone', 'Final state: {formula} — A and B are perfectly correlated: measuring one instantly tells you the other.').replace('{formula}', s.formula));
  document.getElementById('bellstate-anim-status').textContent = '';

  runBtn.disabled = false;
  document.querySelectorAll('#bellstate-picker [data-bell], #bellstate-family [data-bell]').forEach(b => b.disabled = false);
  bellAnimating = false;
}
