'use strict';
// Depends on: core/gates.js (GATES), core/utils.js (delay),
// core/dom-utils.js (copyShareLink, buildGatePalette),
// app.js state (circuitGates, SLOT_COUNT, qubitCircuit, rendererCircuit).

// ═══════════════════════════════════════════════════════════════════
// CIRCUIT TAB
// ═══════════════════════════════════════════════════════════════════
/** Superposition (H's signature move), a blunt bit flip (X), and a
 *  Z-then-H sandwich that reveals Z's otherwise-invisible phase flip as
 *  an actual state change — echoes the Z gate's own "hand it to a
 *  Hadamard afterward" explain text in core/gates.js. */
const CIRCUIT_PRESETS = [
  { name: 'Superposition', gates: ['H'] },
  { name: 'Bit Flip',      gates: ['X'] },
  { name: 'Hidden Phase',  gates: ['H', 'Z', 'H'] }
];

function loadCircuitPreset(preset) {
  circuitGates = [...preset.gates];
  renderCircuitSlots();
  runCircuit();
}

function initCircuitTab() {
  document.getElementById('btn-run-circuit').addEventListener('click', runCircuit);
  document.getElementById('btn-clear-circuit').addEventListener('click', clearCircuit);
  document.getElementById('btn-share-circuit').addEventListener('click', e => {
    copyShareLink({ tab: 'circuit', circuit: circuitGates.join(',') }, e.currentTarget);
  });
  document.querySelectorAll('.mode-btn[data-circuit-domain]').forEach(btn =>
    btn.addEventListener('click', () => setCircuitDomain(btn.dataset.circuitDomain)));
  renderTryMe('circuit-try-me', CIRCUIT_PRESETS, loadCircuitPreset);
}

/** Top-level Classical/Quantum switch for the Circuits tab — sits above
 *  the quantum builder's own 1Q/2Q/3Q sub-toggle (see setCircuitMode() in
 *  circuit-multiqubit-tab.js), the same two-tier pattern the home page
 *  uses for Concept Map/My Progress. */
function setCircuitDomain(domain) {
  document.querySelectorAll('.mode-btn[data-circuit-domain]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.circuitDomain === domain));
  document.getElementById('circuit-classical-panel').style.display = domain === 'classical' ? '' : 'none';
  document.getElementById('circuit-quantum-panel').style.display   = domain === 'quantum'   ? '' : 'none';
  document.getElementById('circuit-compare-panel').style.display   = domain === 'compare'   ? '' : 'none';
}

function buildCircuitPalette() {
  buildGatePalette('circuit-palette', key => addGateToCircuit(key));
}

function buildCircuitSlots() {
  const el = document.getElementById('gate-slots');
  el.innerHTML = '';
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slot = document.createElement('div');
    slot.className     = 'gate-slot empty';
    slot.dataset.index = i;
    slot.title         = 'Click to remove';
    slot.addEventListener('click', () => removeCircuitGate(i));
    el.appendChild(slot);
  }
  renderCircuitSlots();
}

function addGateToCircuit(key) {
  if (circuitGates.length >= SLOT_COUNT) {
    setCircuitStatus('Circuit full — clear to reset');
    return;
  }
  circuitGates.push(key);
  renderCircuitSlots();
  setCircuitStatus('');
  setCircuitExplainer(
    circuitGates.length === 1
      ? `${GATES[key].name} takes the first checkpoint on the wire. The qubit hasn't moved yet, though — it's still sitting at |0⟩ until you hit Run and send it walking down the line.`
      : `Checkpoint ${circuitGates.length} is now ${GATES[key].name}. The route so far: ${circuitGates.map(k => GATES[k].name).join(' → ')}. Hit Run and the qubit will walk it start to finish.`
  );
}

function removeCircuitGate(i) {
  if (i < circuitGates.length) {
    circuitGates.splice(i, 1);
    renderCircuitSlots();
    setCircuitExplainer(
      circuitGates.length
        ? `Checkpoint removed. Remaining route: ${circuitGates.map(k => GATES[k].name).join(' → ')}.`
        : 'Route cleared — the wire is empty. Click gates above to lay down a new path.'
    );
  }
}

function renderCircuitSlots() {
  // Scoped to #gate-slots — the Classical Circuit builder (classical-
  // circuit-tab.js) has its own, separate set of .gate-slot elements on
  // the same page; an unscoped query here used to silently match those
  // first (they sit earlier in the DOM) and write gate labels into the
  // wrong wire, leaving this one always blank.
  const slots = document.querySelectorAll('#gate-slots .gate-slot');
  slots.forEach((slot, i) => {
    const key = circuitGates[i];
    if (key) {
      const g = GATES[key];
      slot.textContent      = g.name;
      slot.style.color       = g.color;
      slot.style.borderColor = g.color;
      slot.className = 'gate-slot filled';
    } else if (i === 0 && circuitGates.length === 0) {
      // Empty-state hint: the wire is otherwise just 8 blank dashed boxes
      // with no cue that clicking a palette gate above is what fills them.
      slot.textContent = '+';
      slot.style.color = '';
      slot.style.borderColor = '';
      slot.className = 'gate-slot empty gate-slot-hint';
    } else {
      slot.textContent       = '';
      slot.style.color       = '';
      slot.style.borderColor = '';
      slot.className = 'gate-slot empty';
    }
  });
}

// Run History (item: circuit-builder rollback) — a snapshot of the
// qubit's exact (theta, phi) after each step of the most recent Run,
// rendered as clickable numbered chips (reuses .hist-tag, same as every
// other rollback trail in the app). Rebuilt fresh at the start of each
// Run rather than accumulated across runs, same convention as the Try Me
// history strips. circuitRunning guards against a rollback click (or a
// second Run) racing the animation while one is already in progress.
let circuitRunHistory   = [];
let circuitHistoryCursor = -1;
let circuitRunning       = false;

async function runCircuit() {
  if (circuitRunning) return;
  if (circuitGates.length === 0) {
    setCircuitStatus('Add gates first');
    setCircuitExplainer('The wire is empty — there\'s no path to walk yet. Click gates in the palette above to lay one down, then press Run.');
    return;
  }
  circuitRunning = true;
  qubitCircuit = new Qubit();
  const slots  = document.querySelectorAll('#gate-slots .gate-slot'); // see renderCircuitSlots()'s comment above — same scoping fix
  setCircuitStatus('Running…');
  setCircuitExplainer('The qubit steps onto the wire at |0⟩ and starts walking the line, left to right…');
  circuitRunHistory = [];
  circuitHistoryCursor = -1;
  renderCircuitHistory();

  for (let i = 0; i < circuitGates.length; i++) {
    const key  = circuitGates[i];
    const gate = GATES[key];
    slots[i].classList.add('running');
    slots[i].style.color = gate.color;
    setCircuitExplainer(`Checkpoint ${i + 1} of ${circuitGates.length}: ${gate.name} — ${gate.desc.toLowerCase()}. ${gate.explain.split('.')[0]}.`);
    await delay(320);
    qubitCircuit.applyGate(gate.matrix);
    updateCircuitUI();
    const b = qubitCircuit.getBloch();
    const p0 = Math.round(qubitCircuit.prob0() * 100);
    const p1 = Math.round(qubitCircuit.prob1() * 100);
    const explain = `<strong style="color:${gate.color}">Step ${i + 1}: ${gate.name} — ${gate.desc}.</strong> ${gate.explain} <br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${qubitCircuit.getFormula()}</span> — ${p0}% |0⟩, ${p1}% |1⟩.`;
    circuitRunHistory.push({
      theta: b.theta, phi: b.phi, label: String(i + 1), color: gate.color,
      title: `Step ${i + 1}: ${gate.name} — ${qubitCircuit.getFormula()}`, explain
    });
    circuitHistoryCursor = circuitRunHistory.length - 1;
    renderCircuitHistory();
    await delay(130);
    slots[i].classList.remove('running');
    slots[i].style.boxShadow = '';
  }
  circuitRunning = false;
  setCircuitStatus(`Done · ${qubitCircuit.getLabel()}`);
  const p0 = Math.round(qubitCircuit.prob0() * 100);
  const p1 = Math.round(qubitCircuit.prob1() * 100);
  setCircuitExplainer(`Journey complete. After passing through ${circuitGates.map(k => GATES[k].name).join(' → ')}, the qubit arrives at ${qubitCircuit.getFormula()} — a ${p0}% / ${p1}% shot at |0⟩ vs |1⟩ if you measured it right now.`);
}

function renderCircuitHistory() {
  const hist = document.getElementById('circuit-history');
  if (!hist) return;
  if (!circuitRunHistory.length) { hist.innerHTML = '<span class="muted-text">—</span>'; return; }
  hist.innerHTML = '';
  circuitRunHistory.forEach((entry, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hist-tag' + (i === circuitHistoryCursor ? ' is-current' : '');
    chip.style.color = entry.color;
    chip.style.borderColor = entry.color + '44';
    chip.textContent = entry.label;
    chip.title = entry.title;
    chip.addEventListener('click', () => {
      if (circuitRunning) return;
      restoreCircuitHistoryStep(i);
    });
    hist.appendChild(chip);
  });
}

/** Rollback — jumps straight to step `i`'s recorded (theta, phi)
 *  snapshot rather than replaying gates from |0⟩, and restores the
 *  "What's going on" explainer to exactly what it said at that step
 *  (not just the state/formula) — same detailed, gate.explain-based
 *  writeup Run itself shows, not the terse "Checkpoint N of M" line. */
function restoreCircuitHistoryStep(i) {
  const entry = circuitRunHistory[i];
  if (!entry) return;
  circuitHistoryCursor = i;
  qubitCircuit.setState(entry.theta, entry.phi);
  updateCircuitUI();
  renderCircuitHistory();
  setCircuitStatus(`Step ${entry.label} of ${circuitRunHistory.length}`);
  setCircuitExplainer(entry.explain);
}

function clearCircuit() {
  circuitGates = [];
  qubitCircuit = new Qubit();
  buildCircuitSlots();
  updateCircuitUI();
  setCircuitStatus('');
  setCircuitExplainer('Route cleared. Lay down a path by clicking gates above — each one claims the next checkpoint on the wire. Press Run and the qubit walks it from |0⟩ to the end, one stop at a time.');
  circuitRunHistory = [];
  circuitHistoryCursor = -1;
  renderCircuitHistory();
}

function setCircuitExplainer(msg) {
  setExplainer('circuit-explainer', msg);
}

function updateCircuitUI() {
  const b  = qubitCircuit.getBloch();
  const p0 = qubitCircuit.prob0() * 100;
  const p1 = qubitCircuit.prob1() * 100;
  rendererCircuit.animateTo(b.x, b.y, b.z, qubitCircuit.getLabel());
  document.getElementById('bloch-circuit').setAttribute('aria-label',
    `Bloch sphere showing the circuit's output state. State: ${qubitCircuit.getFormula()}.`);
  document.getElementById('label-circuit').textContent = qubitCircuit.getLabel();
  document.getElementById('cfill0').style.width = p0 + '%';
  document.getElementById('cfill1').style.width = p1 + '%';
  document.getElementById('cpct0').textContent  = Math.round(p0) + '%';
  document.getElementById('cpct1').textContent  = Math.round(p1) + '%';
}

function setCircuitStatus(msg) {
  document.getElementById('circuit-status').textContent = msg;
}
