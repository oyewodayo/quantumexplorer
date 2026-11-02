'use strict';
// Depends on: core/gates.js (GATES, ROTATION_GATES, rotationMatrix),
// core/complex.js (C.fmt), core/dom-utils.js (setExplainer),
// core/tab-registry.js (registerTab), app.js state (qubitMain, gateHistory,
// rendererGates), tabs/qubit-tab.js (updateQubitUI, called after applying a gate).
//
// gateHistory entries carry a display label/color plus a snapshot of the
// qubit's exact (theta, phi) right after that step, the explainer HTML
// shown at the time, and enough to redraw that step's matrix (matrixKey
// for fixed gates; matrix/rotationAxis/rotationAngle for rotation gates)
// — see restoreGateHistoryStep() below. Snapshots rather than replayable
// operations because entries come from two different sources that behave
// differently: manual gate clicks compound on whatever state came
// before, while a Try Me run resets to |0⟩ before each step (see
// initGatesTryMe()) — a snapshot of the resulting state means rollback
// doesn't need to know or care which kind of entry it's restoring.
// gateHistoryCursor tracks which entry is currently on screen (not
// necessarily the last one, once a rollback click has fired).

// ═══════════════════════════════════════════════════════════════════
// GATES TAB
// ═══════════════════════════════════════════════════════════════════
/** Classical Gates/Quantum Gates/Compare switch for the Gates tab — same
 *  multi-panel toggle pattern as Circuits' domain toggle, extended to a
 *  third "Compare" panel (item 14) that needs both truth tables built
 *  once, on first visit, rather than every switch. */
function setGatesDomain(domain) {
  document.querySelectorAll('.mode-btn[data-gates-domain]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.gatesDomain === domain));
  document.getElementById('gates-classical-panel').style.display = domain === 'classical' ? '' : 'none';
  document.getElementById('gates-quantum-panel').style.display   = domain === 'quantum'   ? '' : 'none';
  document.getElementById('gates-compare-panel').style.display   = domain === 'compare'   ? '' : 'none';
  syncSidebarSub('gates', { gatesDomain: domain });
}

function buildGateButtons() {
  document.querySelectorAll('.mode-btn[data-gates-domain]').forEach(btn =>
    btn.addEventListener('click', () => setGatesDomain(btn.dataset.gatesDomain)));
  syncSidebarSub('gates', { gatesDomain: 'quantum' }); // matches the panel already active by default in index.html

  renderGateGrid();
  document.getElementById('btn-reset-gates').addEventListener('click', resetGates);
  buildRotationButtons();
  buildGateReference();
  initGatesTryMe();
  buildQuantumGateTruthTable('gates-truth-table');
  buildQuantumGateTruthTable('gates-compare-quantum-table');
  buildAllClassicalGatesTruthTables('gates-compare-classical-table');

  // The Gates-tab sphere mirrors qubitMain but is otherwise idle between
  // visits, so jump its animation state to the current qubit on entry
  // instead of tweening in from wherever it was last left.
  registerTab('gates', {
    onEnter: () => {
      const b = qubitMain.getBloch();
      rendererGates.cur = { ...b };
      rendererGates.draw(b.x, b.y, b.z, qubitMain.getLabel());
      document.getElementById('label-gates').textContent = qubitMain.getLabel();
    }
  });

  // gate.desc/formalName render translated text (see t() calls in
  // renderGateGrid/buildRotationButtons/buildGateReference below), so a
  // language switch needs these three rebuilt — each clears its own
  // container first, so calling them again is safe, not a duplicate-append.
  onLangChange(() => {
    renderGateGrid();
    buildRotationButtons();
    buildGateReference();
    buildQuantumGateTruthTable('gates-truth-table');
    buildQuantumGateTruthTable('gates-compare-quantum-table');
    buildAllClassicalGatesTruthTables('gates-compare-classical-table');
  });
}

// ─── TRUTH TABLE (item 13) ─────────────────────────────────────────────
/** Formats a basis-state output (two complex amplitudes) as a ket sum,
 *  e.g. (0.707)|0⟩ + (-0.707)|1⟩ — a coefficient of exactly 1 is shown as
 *  a bare ket (|1⟩, not (1)|1⟩) since that's the common case (X, Z, S, T
 *  acting on one of the two basis states). */
function formatKetOutput(c0, c1) {
  const parts = [];
  [c0, c1].forEach((c, k) => {
    if (C.mag(c) <= 0.0005) return;
    const coef = C.fmt(c);
    parts.push(coef === '1' ? `|${k}⟩` : `(${coef})|${k}⟩`);
  });
  return parts.length ? parts.join(' + ') : '0';
}

/** Renders a Gate/Input/Output table into `targetId` — every fixed GATES
 *  entry's action on both basis states |0⟩ and |1⟩, computed directly
 *  from its matrix (matrix[0][basis]/matrix[1][basis] are exactly the
 *  output amplitudes for a basis-state input, since matrix-vector
 *  multiplying by a basis vector just selects that column). Rotation
 *  gates are excluded — their matrix depends on a runtime angle, so
 *  there's no single fixed table to show. Called once per gates-tab.js
 *  page (the main Quantum Gates panel's own table, item 13, and the
 *  Compare panel's quantum-side table, item 14) plus again on every
 *  language change, since the header cells go through t(). */
function buildQuantumGateTruthTable(targetId) {
  const table = document.getElementById(targetId);
  if (!table) return;
  const rows = [];
  Object.entries(GATES).forEach(([key, gate]) => {
    [0, 1].forEach(basis => {
      const c0 = gate.matrix[0][basis];
      const c1 = gate.matrix[1][basis];
      rows.push({ gate, input: basis, output: formatKetOutput(c0, c1) });
    });
  });
  table.innerHTML = `<tr><th>${t('common.gate', 'Gate')}</th><th>${t('common.input', 'Input')}</th><th>${t('common.output', 'Output')}</th></tr>` +
    rows.map(r => `<tr><td style="color:${r.gate.color};font-weight:700;">${r.gate.name}</td><td>|${r.input}⟩</td><td>${r.output}</td></tr>`).join('');
}

/** Builds the "Apply Gate" button grid — split out from buildGateButtons()
 *  so a language switch can rebuild just this (clears the grid first,
 *  so calling it again is idempotent rather than duplicating buttons). */
function renderGateGrid() {
  const grid = document.getElementById('gate-grid');
  grid.innerHTML = '';
  Object.entries(GATES).forEach(([key, gate]) => {
    const btn = document.createElement('button');
    btn.className = 'gate-btn';
    btn.dataset.gateKey = key;
    btn.style.color       = gate.color;
    btn.style.borderColor = gate.color + '44';
    btn.innerHTML = `${gate.name}<span class="gate-sub">${t(`gates.${key}.desc`, gate.desc)}</span>`;
    btn.addEventListener('click', () => applyGate(key, btn));
    grid.appendChild(btn);
  });
}

function applyGate(key, btn) {
  const gate = GATES[key];
  qubitMain.applyGate(gate.matrix);
  showMatrix(key);
  updateQubitUI();
  if (btn) pulseElement(btn, 'pulsing');
  pulseElement(document.querySelector('#tab-gates .bloch-wrap'), 'pulsing', 550);

  const p0 = Math.round(qubitMain.prob0() * 100);
  const p1 = Math.round(qubitMain.prob1() * 100);
  const explain = `<strong style="color:${gate.color}">${gate.name} — ${gate.desc}.</strong> ${gate.explain} <br><br>New odds: ${p0}% |0⟩, ${p1}% |1⟩ — state is now <span style="font-family:'JetBrains Mono',monospace">${qubitMain.getFormula()}</span>.`;
  setExplainer('gate-explainer', explain);

  const b = qubitMain.getBloch();
  gateHistory.push({ label: gate.name, color: gate.color, theta: b.theta, phi: b.phi, matrixKey: key, explain });
  gateHistoryCursor = gateHistory.length - 1;
  updateGatesUI();
}

function showMatrix(key) {
  const gate = GATES[key];
  const [[a, b], [c, d]] = gate.matrixStr;
  document.getElementById('matrix-display').innerHTML = `
    <div class="matrix-name">${gate.name} =</div>
    <div class="matrix-body">
      <span class="matrix-bracket">[</span>
      <div class="matrix-cells">
        <span class="matrix-cell" style="color:${gate.color}">${a}</span>
        <span class="matrix-cell" style="color:${gate.color}">${b}</span>
        <span class="matrix-cell" style="color:${gate.color}">${c}</span>
        <span class="matrix-cell" style="color:${gate.color}">${d}</span>
      </div>
      <span class="matrix-bracket">]</span>
    </div>
  `;
}

// ─── ROTATION GATES ───────────────────────────────────────────────────
function buildRotationButtons() {
  const grid = document.getElementById('rotation-gate-grid');
  grid.innerHTML = '';
  Object.entries(ROTATION_GATES).forEach(([axis, gate]) => {
    const btn = document.createElement('button');
    btn.className = 'gate-btn';
    btn.style.color       = gate.color;
    btn.style.borderColor = gate.color + '44';
    btn.innerHTML = `${gate.label}<span class="gate-sub">${t(`rotationGates.${axis}.desc`, gate.desc)}</span>`;
    btn.addEventListener('click', () => {
      const angleDeg = parseInt(document.getElementById('rotation-angle').value, 10);
      applyRotationGate(axis, angleDeg, btn);
    });
    grid.appendChild(btn);
  });
  document.getElementById('rotation-angle').addEventListener('input', updateRotationAngleLabel);
}

function updateRotationAngleLabel() {
  const val = document.getElementById('rotation-angle').value;
  document.getElementById('rotation-angle-val').textContent = val + '°';
}

/* A permanent, always-visible glossary of what each gate letter stands
   for (Hadamard, the three Pauli gates, the phase gates) — the buttons
   above only show playful nicknames, so this is the one place a visitor
   can see the formal names without having to hover or apply a gate first. */
function buildGateReference() {
  const rows = [
    ...Object.entries(GATES).map(([key, g]) => ({ key, ns: 'gates', name: g.name, color: g.color, formalName: g.formalName, desc: g.desc })),
    ...Object.entries(ROTATION_GATES).map(([key, g]) => ({ key, ns: 'rotationGates', name: g.label, color: g.color, formalName: g.formalName, desc: g.desc }))
  ];
  document.getElementById('gate-reference-list').innerHTML = rows.map(g => `
    <div class="gate-reference-row">
      <span class="gate-reference-symbol" style="color:${g.color}">${g.name}</span>
      <span class="gate-reference-formal">${t(`${g.ns}.${g.key}.formalName`, g.formalName)}</span>
      <span class="gate-reference-nick">${t(`${g.ns}.${g.key}.desc`, g.desc)}</span>
    </div>
  `).join('');
}

function applyRotationGate(axis, angleDeg, btn) {
  const gate = ROTATION_GATES[axis];
  const matrix = rotationMatrix(axis, angleDeg);
  qubitMain.applyGate(matrix);
  showRotationMatrix(axis, angleDeg, matrix);
  updateQubitUI();
  if (btn) pulseElement(btn, 'pulsing');
  pulseElement(document.querySelector('#tab-gates .bloch-wrap'), 'pulsing', 550);

  const p0 = Math.round(qubitMain.prob0() * 100);
  const p1 = Math.round(qubitMain.prob1() * 100);
  const explain = `<strong style="color:${gate.color}">${gate.label}(${angleDeg}°) — ${gate.desc}.</strong> Unlike the fixed gates above, you choose exactly how far this one turns — drag the angle slider and apply it again to see the difference. <br><br>New odds: ${p0}% |0⟩, ${p1}% |1⟩ — state is now <span style="font-family:'JetBrains Mono',monospace">${qubitMain.getFormula()}</span>.`;
  setExplainer('gate-explainer', explain);

  const b = qubitMain.getBloch();
  gateHistory.push({ label: `${gate.label}(${angleDeg}°)`, color: gate.color, theta: b.theta, phi: b.phi, matrix, rotationAxis: axis, rotationAngle: angleDeg, explain });
  gateHistoryCursor = gateHistory.length - 1;
  updateGatesUI();
}

function showRotationMatrix(axis, angleDeg, matrix) {
  const gate = ROTATION_GATES[axis];
  const cells = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1]].map(z => C.fmt(z));
  document.getElementById('matrix-display').innerHTML = `
    <div class="matrix-name">${gate.label}(${angleDeg}°) =</div>
    <div class="matrix-body">
      <span class="matrix-bracket">[</span>
      <div class="matrix-cells">
        <span class="matrix-cell" style="color:${gate.color}">${cells[0]}</span>
        <span class="matrix-cell" style="color:${gate.color}">${cells[1]}</span>
        <span class="matrix-cell" style="color:${gate.color}">${cells[2]}</span>
        <span class="matrix-cell" style="color:${gate.color}">${cells[3]}</span>
      </div>
      <span class="matrix-bracket">]</span>
    </div>
  `;
}

let gateHistoryCursor = -1; // index of the entry currently on screen — not always the last one, once a rollback click has fired

function updateGatesUI() {
  const b = qubitMain.getBloch();
  rendererGates.animateTo(b.x, b.y, b.z, qubitMain.getLabel());
  document.getElementById('bloch-gates').setAttribute('aria-label',
    `Bloch sphere. State: ${qubitMain.getFormula()}.`);
  document.getElementById('label-gates').textContent = qubitMain.getLabel();
  renderGateHistory();
}

/** Renders gateHistory as clickable rollback chips (real <button>s, same
 *  .hist-tag/.is-current styling as every other Try Me's history — see
 *  components.css) — click any step, whether it came from manually
 *  clicking gates or from a Try Me run, and it restores that exact
 *  snapshot via restoreGateHistoryStep() below. */
function renderGateHistory() {
  const hist = document.getElementById('gate-history');
  if (!gateHistory.length) {
    hist.innerHTML = '<span class="muted-text">—</span>';
    return;
  }
  hist.innerHTML = '';
  gateHistory.forEach((entry, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hist-tag' + (i === gateHistoryCursor ? ' is-current' : '');
    chip.style.color = entry.color;
    chip.style.borderColor = entry.color + '44';
    chip.textContent = entry.label;
    chip.title = 'Click to revisit this step and re-read its explanation';
    chip.addEventListener('click', () => {
      // A Try Me run disables the gate/rotation buttons for its
      // duration (see initGatesTryMe()) — same signal doubles as the
      // "don't let a rollback click fight the next auto-play tick"
      // guard every other Try Me's chips use.
      if (document.getElementById('btn-gates-tryme').disabled) return;
      restoreGateHistoryStep(i);
    });
    hist.appendChild(chip);
  });
}

/** Rollback — jumps the qubit straight to history entry `i`'s recorded
 *  (theta, phi) snapshot rather than replaying gates, so it works the
 *  same whether that step came from a compounding manual sequence or a
 *  Try Me step that reset to |0⟩ first. Also restores the matrix display
 *  and explainer text exactly as they were at that step, and does NOT
 *  push a new history entry — rollback navigates the trail, it doesn't
 *  extend it. */
function restoreGateHistoryStep(i) {
  const entry = gateHistory[i];
  if (!entry) return;
  gateHistoryCursor = i;
  qubitMain.setState(entry.theta, entry.phi);
  if (entry.rotationAxis) showRotationMatrix(entry.rotationAxis, entry.rotationAngle, entry.matrix);
  else showMatrix(entry.matrixKey);
  setExplainer('gate-explainer', entry.explain);
  updateGatesUI();
  updateQubitUI();
}

const GATES_TRYME_INTERVAL_MS = 2800; // each step's explainer paragraph is a few sentences long — needs real reading time, not just animation-settle time

/** Tours every fixed gate (H, X, Y, Z, S, T) once, resetting to |0⟩
 *  before each so every gate's effect is shown against the same
 *  baseline instead of compounding on top of the last one — matching
 *  this tab's own framing ("Pick one gate and see its immediate
 *  effect"), not a sequence to chain. Reuses runTryMeSequence() from
 *  qubit-tab.js (loaded earlier, shared global scope) rather than
 *  duplicating its disable/loop/interval bookkeeping. */
function initGatesTryMe() {
  document.getElementById('btn-gates-tryme').addEventListener('click', () => {
    const gateBtns = document.querySelectorAll('#gate-grid .gate-btn');
    runTryMeSequence({
      button: document.getElementById('btn-gates-tryme'),
      disableEls: [
        ...gateBtns,
        ...document.querySelectorAll('#rotation-gate-grid .gate-btn'),
        document.getElementById('rotation-angle'),
        document.getElementById('btn-reset-gates')
      ],
      states: Object.keys(GATES),
      applyState: key => {
        qubitMain = new Qubit();
        applyGate(key, document.querySelector(`#gate-grid [data-gate-key="${key}"]`));
      },
      intervalMs: GATES_TRYME_INTERVAL_MS
    });
  });
}

function resetGates() {
  qubitMain   = new Qubit();
  gateHistory = [];
  gateHistoryCursor = -1;
  document.getElementById('matrix-display').innerHTML = '<span class="muted-text">← select a gate</span>';
  setExplainer('gate-explainer', 'Back to |0⟩ — the qubit points straight up on the sphere, no gates applied yet. Click one to send it rotating.');
  updateGatesUI();
  updateQubitUI();
}
