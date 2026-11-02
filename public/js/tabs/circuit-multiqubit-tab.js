'use strict';
// Depends on: core/gates.js (GATES), core/qubit.js (blochVectorLabel),
// core/two-qubit.js (TwoQubitState), core/three-qubit.js (ThreeQubitState),
// core/dom-utils.js (setExplainer, renderTryMe, buildGatePalette),
// core/utils.js (delay), app.js state (rendererCircuit2, rendererCircuit3).
//
// The 2-qubit and 3-qubit circuit builders, reachable via the "2 Qubits"/
// "3 Qubits" mode toggle at the top of the Quantum Circuit panel (see
// setCircuitMode() below). Replaces what used to be two separate,
// ~90%-identical files (circuit2-tab.js/circuit3-tab.js) — same gate-entry
// data model (a flat, sequential array of
// {type:'single',qubit,key}/{type:'cnot',control,target} entries), same
// CSS-Grid diagram algorithm, same run/status/explainer pattern — with one
// shared implementation parameterized by a small per-qubit-count config
// (see CIRCUIT2_CONFIG/CIRCUIT3_CONFIG below) instead of copy-pasted code.
// makeMultiQubitCircuit(cfg) returns a plain "instance" object holding the
// mutable per-builder state (gates/targetQubit/state); the functions below
// take that instance as their first argument rather than being methods on
// it, matching this codebase's preference for plain functions over classes
// for UI-glue code (TwoQubitState/ThreeQubitState/BlochRenderer are real
// classes because they carry real invariants — this is just wiring).
//
// The single-qubit circuit (tabs/circuit-tab.js) is NOT part of this —
// it's a genuinely different UI (a linear "checkpoint wire", one Bloch
// sphere, no CNOT, no per-wire targeting), not a smaller copy of this one.
// Folding it in here would mean redesigning its markup to fit this grid-
// diagram shape, not just deduplicating code.

const CIRCUIT_MULTIQUBIT_MAX_STEPS = 10;

const CIRCUIT3_KETS = ['000', '001', '010', '011', '100', '101', '110', '111'];

/** A standard Bell pair, a same-basis flip that needs no entanglement at
 *  all, and an anti-correlated Bell variant (X on the target qubit before
 *  the CNOT flips which pairs show up) — three sequences that each land
 *  on a different, recognizable two-qubit state. */
const CIRCUIT2_PRESETS = [
  { name: 'Bell Pair',       gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'cnot', control: 0, target: 1 }] },
  { name: 'Flip Both',       gates: [{ type: 'single', qubit: 0, key: 'X' }, { type: 'single', qubit: 1, key: 'X' }] },
  { name: 'Anti-Correlated', gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'single', qubit: 1, key: 'X' }, { type: 'cnot', control: 0, target: 1 }] }
];

/** A star-topology GHZ state (one H, then CNOT out to each other qubit),
 *  a plain triple flip needing no entanglement, a Bell pair on just two
 *  of the three wires, and a Half Adder — Q0/Q1 are set to A=1/B=1 (via
 *  X), Toffoli(Q0,Q1,Q2) computes Carry = A·B into Q2 *before* Q1 is
 *  touched again, then CNOT(Q0,Q1) computes Sum = A⊕B into Q1 in place —
 *  the standard reversible-logic trick that fits a full half adder into
 *  exactly 3 qubits (Q0 keeps A unchanged, Q1 ends up holding Sum, Q2
 *  ends up holding Carry). Ends at |101⟩: A=1 (Q0), Sum=0 (Q1), Carry=1
 *  (Q2) — the one input combination where a half adder actually needs
 *  its Carry output. */
const CIRCUIT3_PRESETS = [
  { name: 'GHZ State',        gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'cnot', control: 0, target: 1 }, { type: 'cnot', control: 0, target: 2 }] },
  { name: 'Flip All Three',   gates: [{ type: 'single', qubit: 0, key: 'X' }, { type: 'single', qubit: 1, key: 'X' }, { type: 'single', qubit: 2, key: 'X' }] },
  { name: 'Partial Entangle', gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'cnot', control: 0, target: 1 }] },
  { name: 'Half Adder (A=1,B=1)', gates: [
      { type: 'single', qubit: 0, key: 'X' },
      { type: 'single', qubit: 1, key: 'X' },
      { type: 'toffoli', control1: 0, control2: 1, target: 2 },
      { type: 'cnot', control: 0, target: 1 }
    ] }
];

// ═══════════════════════════════════════════════════════════════════
// PER-QUBIT-COUNT CONFIG
// ═══════════════════════════════════════════════════════════════════
const CIRCUIT2_CONFIG = {
  n: 2,
  prefix: '2q',
  StateClass: TwoQubitState,
  kets: ['00', '01', '10', '11'],
  presets: CIRCUIT2_PRESETS,
  paletteId: 'circuit-2q-palette',
  // 2Q's target-qubit toggle uses a different HTML attribute name than
  // 3Q's (data-target-qubit vs data-target-qubit3, not just a different
  // value) — that's the only thing keeping an unscoped querySelectorAll
  // from matching both panels' buttons at once, so it's config, not a
  // shared constant.
  targetQubitSelector: '.mode-btn[data-target-qubit]',
  targetQubitDatasetKey: 'targetQubit',
  // 2 qubits only have 2 possible CNOT directions, so they get two fixed
  // buttons rather than 3Q's <select> pair (6 possible pairs is too many
  // for individual buttons).
  wireCnotControls(inst) {
    document.getElementById('btn-add-cnot-01').addEventListener('click', () => addGate(inst, { type: 'cnot', control: 0, target: 1 }));
    document.getElementById('btn-add-cnot-10').addEventListener('click', () => addGate(inst, { type: 'cnot', control: 1, target: 0 }));
  },
  startMessage: 'Both qubits start at |00⟩ and step through the sequence in order…',
  clearMessage: 'Two qubits, no entanglement yet. Try adding H to Qubit 0, then CNOT Q0→Q1, then press Run — that\'s the exact recipe behind the Bell state you saw in the Entangle tab, except this time you built it gate by gate.',
  describeOutcome(state) {
    const p00 = state.prob(0), p11 = state.prob(3);
    const entangled = p00 > 0.001 && p11 > 0.001 && state.prob(1) < 0.001 && state.prob(2) < 0.001;
    return entangled
      ? `That's an entangled pair: only |00⟩ (${Math.round(p00 * 100)}%) and |11⟩ (${Math.round(p11 * 100)}%) show up — measuring one qubit instantly tells you the other, exactly like the Entangle tab, except this time H + CNOT built it from scratch.`
      : `Sequence complete. Final state: ${state.getFormula()}.`;
  }
};

const CIRCUIT3_CONFIG = {
  n: 3,
  prefix: '3q',
  StateClass: ThreeQubitState,
  kets: CIRCUIT3_KETS,
  presets: CIRCUIT3_PRESETS,
  paletteId: 'circuit-3q-palette',
  targetQubitSelector: '.mode-btn[data-target-qubit3]',
  targetQubitDatasetKey: 'targetQubit3',
  wireCnotControls(inst) {
    const control = document.getElementById('cnot3-control');
    const target  = document.getElementById('cnot3-target');
    [control, target].forEach(sel => {
      sel.innerHTML = [0, 1, 2].map(q => `<option value="${q}">Qubit ${q}</option>`).join('');
    });
    target.value = '1'; // default control=0, target=1 — a usable pair out of the box
    document.getElementById('btn-add-cnot3').addEventListener('click', () => {
      const c = parseInt(control.value, 10);
      const t = parseInt(target.value, 10);
      if (c === t) { setStatus(inst, 'Control and target must be different qubits'); return; }
      addGate(inst, { type: 'cnot', control: c, target: t });
    });
  },
  // Toffoli (CCNOT) — 3Q-only (needs 3 distinct qubits: 2 controls + 1
  // target, exactly what this builder has), so this is its own config
  // field rather than something CIRCUIT2_CONFIG also defines; guarded by
  // an existence check in makeMultiQubitCircuit() below.
  wireToffoliControls(inst) {
    const control1 = document.getElementById('toffoli3-control1');
    const control2 = document.getElementById('toffoli3-control2');
    const target    = document.getElementById('toffoli3-target');
    [control1, control2, target].forEach(sel => {
      sel.innerHTML = [0, 1, 2].map(q => `<option value="${q}">Qubit ${q}</option>`).join('');
    });
    control2.value = '1'; target.value = '2'; // default controls=0,1 -> target=2, a usable triple out of the box
    document.getElementById('btn-add-toffoli3').addEventListener('click', () => {
      const c1 = parseInt(control1.value, 10);
      const c2 = parseInt(control2.value, 10);
      const t  = parseInt(target.value, 10);
      if (c1 === c2 || c1 === t || c2 === t) { setStatus(inst, 'Controls and target must all be different qubits'); return; }
      addGate(inst, { type: 'toffoli', control1: c1, control2: c2, target: t });
    });
  },
  startMessage: 'All three qubits start at |000⟩ and step through the sequence in order…',
  clearMessage: 'Three qubits, all starting at |000⟩. Try H on Qubit 0, then CNOT Q0→Q1, then CNOT Q0→Q2 — that recipe spreads one qubit\'s coin flip across all three, a three-way GHZ state.',
  describeOutcome(state) {
    const p000 = state.prob(0), p111 = state.prob(7);
    const others = [1, 2, 3, 4, 5, 6].every(i => state.prob(i) < 0.001);
    const ghz = p000 > 0.001 && p111 > 0.001 && others;
    return ghz
      ? `That's a GHZ state: only |000⟩ (${Math.round(p000 * 100)}%) and |111⟩ (${Math.round(p111 * 100)}%) show up — measuring any one of the three qubits instantly tells you all three, a three-way version of the entangled pair from the Entangle tab.`
      : `Sequence complete. Final state: ${state.getFormula()}.`;
  }
};

let circuit2, circuit3; // the two live instances, built by initCircuit2Tab()/initCircuit3Tab()

// ═══════════════════════════════════════════════════════════════════
// INSTANCE FACTORY
// ═══════════════════════════════════════════════════════════════════
function makeMultiQubitCircuit(cfg) {
  const inst = {
    n: cfg.n,
    prefix: cfg.prefix,
    kets: cfg.kets,
    cfg,
    gates: [],
    targetQubit: 0,
    state: new cfg.StateClass(),
    // Run History (rollback) — see runSequence()/renderHistory() below.
    history: [],
    historyCursor: -1,
    running: false
  };

  document.querySelectorAll(cfg.targetQubitSelector).forEach(btn => {
    btn.addEventListener('click', () => {
      inst.targetQubit = parseInt(btn.dataset[cfg.targetQubitDatasetKey], 10);
      document.querySelectorAll(cfg.targetQubitSelector).forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  buildGatePalette(cfg.paletteId, key => addGate(inst, { type: 'single', qubit: inst.targetQubit, key }));
  cfg.wireCnotControls(inst);
  if (cfg.wireToffoliControls) cfg.wireToffoliControls(inst);
  document.getElementById(`btn-run-circuit-${cfg.prefix}`).addEventListener('click', () => runSequence(inst));
  document.getElementById(`btn-clear-circuit-${cfg.prefix}`).addEventListener('click', () => clearSequence(inst));
  renderTryMe(`circuit-${cfg.prefix}-try-me`, cfg.presets, preset => loadPreset(inst, preset));

  renderDiagram(inst);
  updateUI(inst);
  renderHistory(inst);

  return inst;
}

/** 1Q/2Q/3Q panel switch nested inside the Quantum Circuit builder (see
 *  the "Quantum" domain of setCircuitDomain() in circuit-tab.js) — wired
 *  once, from initCircuit2Tab() below, since it isn't specific to either
 *  qubit-count instance. */
function setCircuitMode(mode) {
  document.querySelectorAll('.mode-btn[data-circuit-mode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.circuitMode === mode));
  document.getElementById('circuit-1q-panel').style.display = mode === '1q' ? '' : 'none';
  document.getElementById('circuit-2q-panel').style.display = mode === '2q' ? '' : 'none';
  document.getElementById('circuit-3q-panel').style.display = mode === '3q' ? '' : 'none';
}

function initCircuit2Tab() {
  document.querySelectorAll('.mode-btn[data-circuit-mode]').forEach(btn => {
    btn.addEventListener('click', () => setCircuitMode(btn.dataset.circuitMode));
  });
  circuit2 = makeMultiQubitCircuit(CIRCUIT2_CONFIG);
}

function initCircuit3Tab() {
  circuit3 = makeMultiQubitCircuit(CIRCUIT3_CONFIG);
}

// ═══════════════════════════════════════════════════════════════════
// SHARED LOGIC (operates on whichever instance is passed in)
// ═══════════════════════════════════════════════════════════════════
function entryLabel(entry) {
  if (entry.type === 'cnot') return `CNOT Q${entry.control}→Q${entry.target}`;
  if (entry.type === 'toffoli') return `Toffoli Q${entry.control1},Q${entry.control2}→Q${entry.target}`;
  return `${GATES[entry.key].name} on Q${entry.qubit}`;
}

function addGate(inst, entry) {
  if (inst.gates.length >= CIRCUIT_MULTIQUBIT_MAX_STEPS) {
    setStatus(inst, 'Sequence full — clear to reset');
    return;
  }
  inst.gates.push(entry);
  renderDiagram(inst);
  setStatus(inst, '');
}

function removeGate(inst, i) {
  inst.gates.splice(i, 1);
  renderDiagram(inst);
}

function loadPreset(inst, preset) {
  inst.gates = preset.gates.map(g => ({ ...g }));
  renderDiagram(inst);
  runSequence(inst);
}

/**
 * Renders inst.gates[] as an actual N-wire circuit diagram: one CSS Grid
 * with `inst.n` rows and CIRCUIT_MULTIQUBIT_MAX_STEPS columns. Each
 * gates[] entry owns one column, shared by every row — a CNOT's control
 * dot, target ⊕, and connecting line are separate grid items placed in
 * that same grid-column (their own rows, plus a line spanning between
 * them), which is what makes them line up under each other automatically
 * without any manual pixel math. Columns past inst.gates.length are empty
 * dashed placeholders.
 *
 * inst.n > 2 fills the *other* rows at a single-gate column with empty
 * placeholder cells too (so every column shows a full-height dashed
 * grid); at n=2 it doesn't (the other row gets nothing at that column) —
 * this is a real, pre-existing visual difference between the two
 * diagrams that predates this merge, preserved deliberately rather than
 * "fixed" into one look.
 */
function renderDiagram(inst) {
  const container = document.getElementById(`circuit-${inst.prefix}-diagram`);
  let html = '';

  for (let row = 1; row <= inst.n; row++) {
    html += `<div class="circuit2-ket" style="grid-column:1;grid-row:${row};">|0⟩</div>`;
    html += `<div class="circuit2-wire" style="grid-column:2/-1;grid-row:${row};"></div>`;
  }

  for (let c = 0; c < CIRCUIT_MULTIQUBIT_MAX_STEPS; c++) {
    const col   = c + 2; // grid-column 1 is the |0⟩ label
    const entry = inst.gates[c];

    if (!entry) {
      const isHint = c === 0 && inst.gates.length === 0;
      for (let row = 1; row <= inst.n; row++) {
        html += `<div class="circuit2-cell empty${isHint && row === 1 ? ' circuit2-cell-hint' : ''}" style="grid-column:${col};grid-row:${row};">${isHint && row === 1 ? '+' : ''}</div>`;
      }
      continue;
    }

    if (entry.type === 'single') {
      const g   = GATES[entry.key];
      const row = entry.qubit + 1;
      html += `<button class="circuit2-cell circuit2-gate" data-i="${c}" style="grid-column:${col};grid-row:${row};color:${g.color};border-color:${g.color}" title="${entryLabel(entry)} — click to remove">${g.name}</button>`;
      if (inst.n > 2) {
        for (let row2 = 1; row2 <= inst.n; row2++) {
          if (row2 === row) continue;
          html += `<div class="circuit2-cell empty" style="grid-column:${col};grid-row:${row2};"></div>`;
        }
      }
    } else if (entry.type === 'toffoli') {
      // Two control dots + one ⊕ target, connected by one line spanning
      // all three rows — same building blocks as CNOT below, just one
      // more control dot. Toffoli only exists in the 3Q builder (needs 3
      // distinct qubits), so the three rows always exactly cover 1..n —
      // no "row neither control nor target" placeholder loop needed here.
      const c1Row = entry.control1 + 1;
      const c2Row = entry.control2 + 1;
      const tRow  = entry.target + 1;
      const lineStart = Math.min(c1Row, c2Row, tRow);
      const lineEnd   = Math.max(c1Row, c2Row, tRow) + 1;
      html += `<div class="circuit2-cnot-line" style="grid-column:${col};grid-row:${lineStart}/${lineEnd};"></div>`;
      html += `<button class="circuit2-cell circuit2-cnot-dot" data-i="${c}" style="grid-column:${col};grid-row:${c1Row};" title="${entryLabel(entry)} — click to remove"></button>`;
      html += `<button class="circuit2-cell circuit2-cnot-dot" data-i="${c}" style="grid-column:${col};grid-row:${c2Row};" title="${entryLabel(entry)} — click to remove"></button>`;
      html += `<button class="circuit2-cell circuit2-cnot-target" data-i="${c}" style="grid-column:${col};grid-row:${tRow};" title="${entryLabel(entry)} — click to remove">⊕</button>`;
    } else {
      const controlRow = entry.control + 1;
      const targetRow  = entry.target + 1;
      const lineStart  = Math.min(controlRow, targetRow);
      const lineEnd    = Math.max(controlRow, targetRow) + 1;
      html += `<div class="circuit2-cnot-line" style="grid-column:${col};grid-row:${lineStart}/${lineEnd};"></div>`;
      html += `<button class="circuit2-cell circuit2-cnot-dot" data-i="${c}" style="grid-column:${col};grid-row:${controlRow};" title="${entryLabel(entry)} — click to remove"></button>`;
      html += `<button class="circuit2-cell circuit2-cnot-target" data-i="${c}" style="grid-column:${col};grid-row:${targetRow};" title="${entryLabel(entry)} — click to remove">⊕</button>`;
      // Any row that's neither control nor target gets an empty
      // placeholder too — zero iterations at n=2 (both rows are always
      // control/target at that size), exactly one at n=3.
      for (let row2 = 1; row2 <= inst.n; row2++) {
        if (row2 === controlRow || row2 === targetRow) continue;
        html += `<div class="circuit2-cell empty" style="grid-column:${col};grid-row:${row2};"></div>`;
      }
    }
  }

  container.innerHTML = html;
  container.querySelectorAll('[data-i]').forEach(el => {
    el.addEventListener('click', () => removeGate(inst, parseInt(el.dataset.i, 10)));
  });
}

// CNOT/Toffoli steps have no single GATES entry of their own to borrow a
// color from (they span multiple qubits) — these are just fixed,
// theme-legible colors for their history chips, not tied to any GATES color.
const CNOT_HIST_COLOR    = '#5B8DEF';
const TOFFOLI_HIST_COLOR = '#34D399';

function describeStepColor(entry) {
  if (entry.type === 'cnot') return CNOT_HIST_COLOR;
  if (entry.type === 'toffoli') return TOFFOLI_HIST_COLOR;
  return GATES[entry.key].color;
}

/** The detailed, per-step "What's going on" writeup stored on each Run
 *  History entry (see restoreHistoryStep()) as well as shown live during
 *  Run — same depth as every other gate/circuit explainer in the app,
 *  not just the terse "Step N of M" status line. */
function describeStepExplain(entry, i, formula) {
  const color = describeStepColor(entry);
  if (entry.type === 'cnot') {
    return `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)}.</strong> Flips Q${entry.target}'s bit whenever Q${entry.control} is |1⟩ — the entangling move behind every Bell pair and GHZ state. ` +
      `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`;
  }
  if (entry.type === 'toffoli') {
    return `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)}.</strong> Flips Q${entry.target}'s bit only when BOTH Q${entry.control1} and Q${entry.control2} are |1⟩ — with the target starting at |0⟩, that computes Q${entry.target} = Q${entry.control1} AND Q${entry.control2}, the Carry half of a half adder (a Toffoli is the reversible-logic stand-in for a classical AND gate). ` +
      `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`;
  }
  const gate = GATES[entry.key];
  return `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)} — ${gate.desc}.</strong> ${gate.explain} ` +
    `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`;
}

async function runSequence(inst) {
  if (inst.running) return;
  if (inst.gates.length === 0) {
    setStatus(inst, 'Add gates first');
    return;
  }
  inst.running = true;
  inst.state = new inst.cfg.StateClass();
  setStatus(inst, 'Running…');
  setExplainerFor(inst, inst.cfg.startMessage);
  inst.history = [];
  inst.historyCursor = -1;
  renderHistory(inst);

  for (let i = 0; i < inst.gates.length; i++) {
    const entry = inst.gates[i];
    const stepEls = document.querySelectorAll(`#circuit-${inst.prefix}-diagram [data-i="${i}"]`);
    stepEls.forEach(el => el.classList.add('running'));
    setExplainerFor(inst, `Step ${i + 1} of ${inst.gates.length}: ${entryLabel(entry)}.`);
    await delay(320);
    if (entry.type === 'cnot') {
      inst.state.applyCNOT(entry.control, entry.target);
    } else if (entry.type === 'toffoli') {
      inst.state.applyToffoli(entry.control1, entry.control2, entry.target);
    } else {
      inst.state.applySingleQubitGate(entry.qubit, GATES[entry.key].matrix);
    }
    updateUI(inst);
    inst.history.push({
      amps: inst.state.amps.map(a => ({ ...a })), // cloned — later steps mutate inst.state.amps in place
      label: String(i + 1),
      color: describeStepColor(entry),
      title: `Step ${i + 1}: ${entryLabel(entry)} — ${inst.state.getFormula()}`,
      explain: describeStepExplain(entry, i, inst.state.getFormula())
    });
    inst.historyCursor = inst.history.length - 1;
    renderHistory(inst);
    await delay(130);
    stepEls.forEach(el => el.classList.remove('running'));
  }

  inst.running = false;
  setStatus(inst, 'Done');
  setExplainerFor(inst, inst.cfg.describeOutcome(inst.state));
}

/** Renders inst.history as clickable rollback chips (same .hist-tag/
 *  .is-current pattern as every other Run History / Try Me trail). */
function renderHistory(inst) {
  const hist = document.getElementById(`circuit-${inst.prefix}-history`);
  if (!hist) return;
  if (!inst.history.length) { hist.innerHTML = '<span class="muted-text">—</span>'; return; }
  hist.innerHTML = '';
  inst.history.forEach((entry, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hist-tag' + (i === inst.historyCursor ? ' is-current' : '');
    chip.style.color = entry.color;
    chip.style.borderColor = entry.color + '44';
    chip.textContent = entry.label;
    chip.title = entry.title;
    chip.addEventListener('click', () => {
      if (inst.running) return;
      restoreHistoryStep(inst, i);
    });
    hist.appendChild(chip);
  });
}

/** Rollback — restores step `i`'s cloned amplitude snapshot directly
 *  rather than replaying gates, so it's correct regardless of how
 *  entangled the state became along the way — and restores the "What's
 *  going on" explainer to exactly what it said at that step, not just
 *  the state/formula. */
function restoreHistoryStep(inst, i) {
  const entry = inst.history[i];
  if (!entry) return;
  inst.historyCursor = i;
  inst.state.amps = entry.amps.map(a => ({ ...a }));
  updateUI(inst);
  renderHistory(inst);
  setStatus(inst, `Step ${entry.label} of ${inst.history.length}`);
  setExplainerFor(inst, entry.explain);
}

function clearSequence(inst) {
  inst.gates = [];
  inst.state = new inst.cfg.StateClass();
  renderDiagram(inst);
  updateUI(inst);
  setStatus(inst, '');
  setExplainerFor(inst, inst.cfg.clearMessage);
  inst.history = [];
  inst.historyCursor = -1;
  renderHistory(inst);
}

function setStatus(inst, msg) {
  document.getElementById(`circuit-${inst.prefix}-status`).textContent = msg;
}

function setExplainerFor(inst, msg) {
  setExplainer(`circuit-${inst.prefix}-explainer`, msg);
}

/** Updates the formula line, both/all per-qubit mini Bloch spheres (their
 *  own reduced single-qubit states — see TwoQubitState/
 *  ThreeQubitState.getSingleQubitBloch()), and the full joint-probability
 *  table, generated fresh from inst.kets every call (both circuit-2q-probs
 *  and circuit-3q-probs are empty containers in index.html — 2Q's 4 rows
 *  are just as easy to generate as 3Q's 8, so both go through the same
 *  code instead of 2Q having its own hand-written static markup). */
function updateUI(inst) {
  document.getElementById(`circuit-${inst.prefix}-formula`).textContent = inst.state.getFormula();

  const renderers = inst.n === 2 ? rendererCircuit2 : rendererCircuit3;
  for (let i = 0; i < inst.n; i++) {
    const b = inst.state.getSingleQubitBloch(i);
    const label = blochVectorLabel(b.x, b.y, b.z);
    renderers[i].animateTo(b.x, b.y, b.z, label);
    document.getElementById(`mini-label-${inst.prefix}-${i}`).textContent = label;
  }

  const last = inst.kets.length - 1;
  const container = document.getElementById(`circuit-${inst.prefix}-probs`);
  container.innerHTML = inst.kets.map((ket, i) => {
    const pct       = inst.state.prob(i) * 100;
    const color     = i === 0 ? 'var(--zero)' : i === last ? 'var(--one)' : 'var(--text2)';
    const fillClass = i === 0 ? 'zero-fill'   : i === last ? 'one-fill'   : '';
    const fillStyle = fillClass ? '' : 'background:var(--text2);';
    return `
      <div class="prob-row">
        <span class="ket" style="color:${color}">|${ket}⟩</span>
        <div class="track"><div class="fill ${fillClass}" style="${fillStyle}width:${pct}%" id="c${inst.n}-fill-${ket}"></div></div>
        <span class="pct" id="c${inst.n}-pct-${ket}">${Math.round(pct)}%</span>
      </div>`;
  }).join('');
}
