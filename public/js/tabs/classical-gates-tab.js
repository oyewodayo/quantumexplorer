'use strict';
// Depends on: tabs/classical-circuit-tab.js (CLASSICAL_GATES),
// core/dom-utils.js (setExplainer).
// The Gates tab's classical counterpart, reachable via its own
// Classical/Quantum domain toggle (see setGatesDomain() in gates-tab.js).
// Pick ONE gate and see its immediate effect — the same single-gate
// paradigm the quantum side of this tab already uses (apply one gate,
// read the result), as opposed to Circuits' build-a-sequence paradigm.
// Reuses CLASSICAL_GATES rather than redefining the gate table — script
// load order doesn't matter here since this only reads it from inside a
// function body, called after every script has already run.

let gatesClassicalGate = 'AND';
let gcInputA = 1;
let gcInputB = 1;

function initClassicalGatesTab() {
  buildClassicalGatesPalette();
  document.getElementById('gc-input-a').addEventListener('change', e => {
    gcInputA = e.target.checked ? 1 : 0;
    updateClassicalGatesUI();
  });
  document.getElementById('gc-input-b').addEventListener('change', e => {
    gcInputB = e.target.checked ? 1 : 0;
    updateClassicalGatesUI();
  });
  updateClassicalGatesUI();
}

function buildClassicalGatesPalette() {
  const palette = document.getElementById('gc-gate-palette');
  Object.entries(CLASSICAL_GATES).forEach(([key, gate]) => {
    const btn = document.createElement('button');
    btn.className    = 'circuit-gate-btn classical-gate-btn classical-gate-palette-btn';
    btn.innerHTML    = `${classicalGateIconSVG(key)}<span class="circuit-gate-btn-label">${gate.name}</span>`;
    btn.title        = gate.desc;
    btn.dataset.gate = key;
    btn.addEventListener('click', () => selectClassicalGatesGate(key));
    palette.appendChild(btn);
  });
  updateClassicalGatesPaletteActive();
}

function updateClassicalGatesPaletteActive() {
  document.querySelectorAll('#gc-gate-palette .classical-gate-btn').forEach(btn =>
    btn.classList.toggle('active-gate', btn.dataset.gate === gatesClassicalGate));
}

function selectClassicalGatesGate(key) {
  gatesClassicalGate = key;
  updateClassicalGatesPaletteActive();
  // NOT only ever reads input A — hide B rather than leave a switch on
  // screen that does nothing, same convention as the Circuits classical
  // builder.
  document.getElementById('gc-input-b-wrap').style.display = CLASSICAL_GATES[key].inputs === 1 ? 'none' : '';
  updateClassicalGatesUI();
}

function updateClassicalGatesUI() {
  const gate = CLASSICAL_GATES[gatesClassicalGate];
  const out  = gate.inputs === 1 ? gate.fn(gcInputA) : gate.fn(gcInputA, gcInputB);

  document.getElementById('gc-lbl-a0').classList.toggle('active', gcInputA === 0);
  document.getElementById('gc-lbl-a1').classList.toggle('active', gcInputA === 1);
  document.getElementById('gc-lbl-b0').classList.toggle('active', gcInputB === 0);
  document.getElementById('gc-lbl-b1').classList.toggle('active', gcInputB === 1);

  const display = document.getElementById('gc-output-display');
  display.textContent = out;
  display.classList.toggle('is-zero', out === 0);
  document.getElementById('gc-output-label').textContent =
    gate.inputs === 1 ? 'NOT A' : `A ${gate.name} B`;

  renderClassicalGatesTruthTable();
  setExplainer('gc-explainer', gate.explain);
}

function renderClassicalGatesTruthTable() {
  const gate  = CLASSICAL_GATES[gatesClassicalGate];
  const table = document.getElementById('gc-truth-table');
  const rows  = gate.inputs === 1
    ? [0, 1].map(a => ({ a, out: gate.fn(a) }))
    : [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => ({ a, b, out: gate.fn(a, b) }));

  const headCells = gate.inputs === 1 ? '<th>A</th>' : '<th>A</th><th>B</th>';
  let html = `<tr>${headCells}<th>Out</th></tr>`;
  html += rows.map(r => {
    const isCurrent = gate.inputs === 1
      ? r.a === gcInputA
      : r.a === gcInputA && r.b === gcInputB;
    const cells = gate.inputs === 1 ? `<td>${r.a}</td>` : `<td>${r.a}</td><td>${r.b}</td>`;
    return `<tr class="${isCurrent ? 'truth-row-active' : ''}">${cells}<td>${r.out}</td></tr>`;
  }).join('');

  table.innerHTML = html;
}

/** All-gates-at-once variant of renderClassicalGatesTruthTable() above —
 *  every CLASSICAL_GATES entry's full truth table, one after another,
 *  rather than just the currently-selected gate's. Built for the Gates
 *  tab's Compare panel (item 14), called once from gates-tab.js's
 *  buildGateButtons() plus again on every language change (the header
 *  cells go through t()). */
function buildAllClassicalGatesTruthTables(targetId) {
  const table = document.getElementById(targetId);
  if (!table) return;
  const rows = [];
  Object.entries(CLASSICAL_GATES).forEach(([key, gate]) => {
    const combos = gate.inputs === 1 ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
    combos.forEach(inputs => {
      const out = gate.inputs === 1 ? gate.fn(inputs[0]) : gate.fn(inputs[0], inputs[1]);
      rows.push({ name: gate.name, inputs: inputs.join(', '), out });
    });
  });
  table.innerHTML = `<tr><th>${t('common.gate', 'Gate')}</th><th>${t('common.input', 'Input')}</th><th>${t('common.output', 'Output')}</th></tr>` +
    rows.map(r => `<tr><td style="font-weight:700;">${r.name}</td><td>${r.inputs}</td><td>${r.out}</td></tr>`).join('');
}
