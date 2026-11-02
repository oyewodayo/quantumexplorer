'use strict';
// Depends on: core/dom-utils.js (setExplainer).
// The Classical Circuit builder — a half adder assembled by dragging
// gates from the palette into two slots (Sum, Carry), both wired to the
// same two inputs A/B. Not a sequence to walk (contrast the 1-qubit
// quantum circuit's linear "checkpoint wire" in tabs/circuit-tab.js) —
// a half adder needs two simultaneous outputs from one shared pair of
// inputs, which a single wire can't represent. Both outputs recompute
// live from whatever's actually placed in each slot, and nothing forces
// XOR/AND specifically — getting it "wrong" is exactly as informative as
// getting it right, checked against the target truth table on the right.

const CLASSICAL_GATES = {
  NOT:  { name: 'NOT',  inputs: 1, fn: (a) => 1 - a,        desc: 'Flips the single input',
    explain: 'NOT takes one input and flips it — the only gate here that doesn\'t need a second input at all. 0 becomes 1, 1 becomes 0, no exceptions.' },
  AND:  { name: 'AND',  inputs: 2, fn: (a, b) => a & b,     desc: 'Both must be 1',
    explain: 'AND only outputs 1 when every input is 1 — a strict, all-or-nothing gate. One 0 anywhere and the whole thing collapses to 0.' },
  OR:   { name: 'OR',   inputs: 2, fn: (a, b) => a | b,     desc: 'Either can be 1',
    explain: 'OR outputs 1 as soon as at least one input is 1 — the easiest gate to satisfy. Only both inputs being 0 gives a 0.' },
  XOR:  { name: 'XOR',  inputs: 2, fn: (a, b) => a ^ b,     desc: 'Exactly one is 1',
    explain: 'XOR (exclusive OR) outputs 1 only when the inputs disagree — one 0 and one 1. Two matching inputs, either 0,0 or 1,1, give a 0.' },
  NAND: { name: 'NAND', inputs: 2, fn: (a, b) => 1 - (a & b), desc: 'Opposite of AND',
    explain: 'NAND is AND with the output flipped — 0 only when both inputs are 1, and 1 in every other case. It\'s "universal": every other classical gate can be built from NANDs alone.' },
  NOR:  { name: 'NOR',  inputs: 2, fn: (a, b) => 1 - (a | b), desc: 'Opposite of OR',
    explain: 'NOR is OR with the output flipped — 1 only when both inputs are 0, and 0 as soon as either input is 1.' },
  XNOR: { name: 'XNOR', inputs: 2, fn: (a, b) => 1 - (a ^ b), desc: 'Opposite of XOR',
    explain: 'XNOR is XOR with the output flipped — 1 when the inputs agree (0,0 or 1,1), 0 when they differ. It\'s a literal equality check.' }
};

// ─── GATE SYMBOLS ───────────────────────────────────────────────────────
// Standard schematic shapes (AND's D-shape, OR/XOR's curved shield — XOR
// gets an extra back line — NOT's triangle+bubble; the N-prefixed
// negations reuse their un-negated body plus an output bubble), not
// letters, so the palette and the drop slots both read as real logic-gate
// symbols. Monochrome (currentColor) on purpose — real schematics don't
// color-code gates, unlike this app's quantum gates elsewhere.
const CLASSICAL_GATE_SHAPES = {
  NOT:  { body: 'not', bubble: true }, // the bubble is intrinsic to NOT's own symbol, not an "added negation" like N*-family gates below
  AND:  { body: 'and' },
  NAND: { body: 'and', bubble: true },
  OR:   { body: 'or' },
  NOR:  { body: 'or', bubble: true },
  XOR:  { body: 'xor' },
  XNOR: { body: 'xor', bubble: true }
};

/** Builds one gate's schematic symbol markup, in its native 64×40 box —
 *  input line(s) at local y=13/27 (2-input) or y=20 (NOT), the body path,
 *  an optional negation bubble, and an output line ending at local x=64.
 *  Split out from classicalGateIconSVG() so the big multi-gate circuit
 *  diagram (renderCircuitDiagram()) can embed the same markup as a <g> at
 *  each row's position, instead of only ever appearing inside its own
 *  standalone <svg>. */
function classicalGateInnerSVG(key) {
  const shape     = CLASSICAL_GATE_SHAPES[key].body;
  const hasBubble = !!CLASSICAL_GATE_SHAPES[key].bubble;
  const twoInput  = shape !== 'not';

  let body, tipX, backX;
  if (shape === 'not') {
    body  = '<path d="M16,6 L16,34 L44,20 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    tipX  = 44; backX = 16;
  } else if (shape === 'and') {
    body  = '<path d="M16,6 H32 A14,14 0 0 1 32,34 H16 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    tipX  = 46; backX = 16;
  } else {
    // OR/XOR: a curved "shield" — concave back, pointed front.
    body  = '<path d="M18,7 C28,7 40,10 50,20 C40,30 28,33 18,33 C24,26 24,14 18,7 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    if (shape === 'xor') {
      body += '<path d="M12,7 C18,14 18,26 12,33" fill="none" stroke="currentColor" stroke-width="2"/>';
    }
    tipX  = 50; backX = 18;
  }

  let outX = tipX, bubble = '';
  if (hasBubble) {
    bubble = `<circle cx="${tipX + 4}" cy="20" r="4" fill="none" stroke="currentColor" stroke-width="2"/>`;
    outX   = tipX + 8;
  }

  const inputs = twoInput
    ? `<line x1="0" y1="13" x2="${backX}" y2="13" stroke="currentColor" stroke-width="2"/>
       <line x1="0" y1="27" x2="${backX}" y2="27" stroke="currentColor" stroke-width="2"/>`
    : `<line x1="0" y1="20" x2="${backX}" y2="20" stroke="currentColor" stroke-width="2"/>`;

  const outputLine = `<line x1="${outX}" y1="20" x2="64" y2="20" stroke="currentColor" stroke-width="2"/>`;

  return `${inputs}${body}${bubble}${outputLine}`;
}

/** Renders one gate's schematic symbol as a standalone inline SVG string —
 *  shared by the Classical Gates tab's palette (classical-gates-tab.js,
 *  reusing this the same way it already reuses CLASSICAL_GATES) and this
 *  tab's own palette buttons. */
function classicalGateIconSVG(key) {
  return `<svg viewBox="0 0 64 40" class="classical-gate-icon" aria-hidden="true">${classicalGateInnerSVG(key)}</svg>`;
}

// ═══════════════════════════════════════════════════════════════════
// HALF ADDER CIRCUIT (drag-and-drop, unlimited gates, real wired diagram)
// ═══════════════════════════════════════════════════════════════════
// haGates holds every gate that's been added, in order — each becomes
// its own row in the diagram, wired to the shared A/B rails by real branch
// lines (see renderCircuitDiagram()), not clamped to exactly a Sum slot and
// a Carry slot. A correct half adder is just the recognizable case where an
// XOR row and an AND row both exist somewhere in the list — everything
// else (extra gates, missing ones, duplicates) is equally buildable and
// equally explained, checked against the fixed target truth table.
let halfAdderA = 0, halfAdderB = 0;
let haGates  = []; // [{ key }] — one entry per row, in the order added
let armedGateKey  = null; // set by clicking (not dragging) a palette button — placed on the next diagram click

// ─── circuit diagram geometry (all in SVG user units) ───
const HA_SVG_WIDTH   = 280;
const HA_ROW_HEIGHT  = 56;
const HA_TOP_PAD     = 20;
const HA_BOTTOM_PAD  = 18;
const HA_BUS_A_X     = 26;
const HA_BUS_B_X     = 42;
const HA_GATE_X      = 74; // local x=0 of the embedded 64x40 gate icon

function initClassicalCircuitTab() {
  buildClassicalGatePalette();
  initHalfAdderCircuit();

  document.getElementById('ha-input-a').addEventListener('change', e => {
    halfAdderA = e.target.checked ? 1 : 0;
    updateHalfAdder();
  });
  document.getElementById('ha-input-b').addEventListener('change', e => {
    halfAdderB = e.target.checked ? 1 : 0;
    updateHalfAdder();
  });
  document.getElementById('btn-clear-halfadder').addEventListener('click', () => {
    haGates = [];
    updateHalfAdder();
  });

  updateHalfAdder();
  renderHalfAdderCompareDiagrams();
}

function buildClassicalGatePalette() {
  const palette = document.getElementById('classical-gate-palette');
  Object.entries(CLASSICAL_GATES).forEach(([key, gate]) => {
    const btn = document.createElement('button');
    btn.className  = 'circuit-gate-btn classical-gate-palette-btn';
    btn.innerHTML  = `${classicalGateIconSVG(key)}<span class="circuit-gate-btn-label">${gate.name}</span>`;
    btn.title      = gate.desc;
    btn.draggable  = true;
    btn.dataset.gateKey = key;

    btn.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', key);
      e.dataTransfer.effectAllowed = 'copy';
    });

    // Click-to-arm — a drag-free fallback (touch/keyboard-friendly):
    // click a gate to arm it (outlined), then click the circuit board to
    // add it as a new row. Clicking the same gate again un-arms it.
    btn.addEventListener('click', () => {
      const wasArmed = armedGateKey === key;
      document.querySelectorAll('#classical-gate-palette .circuit-gate-btn').forEach(b => b.classList.remove('is-armed'));
      armedGateKey = wasArmed ? null : key;
      if (armedGateKey) btn.classList.add('is-armed');
    });

    palette.appendChild(btn);
  });
}

function initHalfAdderCircuit() {
  const drop = document.getElementById('halfadder-circuit-drop');

  drop.addEventListener('dragover', e => {
    e.preventDefault(); // required for 'drop' to fire at all
    e.dataTransfer.dropEffect = 'copy';
    drop.classList.add('drag-over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('drag-over');
    addHalfAdderGate(e.dataTransfer.getData('text/plain'));
  });

  drop.addEventListener('click', e => {
    // A click on an existing row's remove target takes priority over
    // "place the armed gate" — see the data-row-index overlay rendered
    // per row in renderCircuitDiagram().
    const rowEl = e.target.closest('[data-row-index]');
    if (rowEl) {
      removeHalfAdderGate(parseInt(rowEl.dataset.rowIndex, 10));
      return;
    }
    if (armedGateKey) {
      addHalfAdderGate(armedGateKey);
      armedGateKey = null;
      document.querySelectorAll('#classical-gate-palette .circuit-gate-btn').forEach(b => b.classList.remove('is-armed'));
    }
  });
  // Enter/Space activates the board the same as a click — it has
  // tabindex="0"/role="button" in index.html but no native activation.
  drop.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drop.click(); }
  });
}

/** Appends `key` (a CLASSICAL_GATES key) as a new row. Only 2-input gates
 *  make sense here — every row reads the same two rails, A and B — so
 *  NOT is rejected with an explainer message rather than silently
 *  accepted. */
function addHalfAdderGate(key) {
  if (!key) return;
  if (CLASSICAL_GATES[key].inputs !== 2) {
    setExplainer('halfadder-explainer',
      `${CLASSICAL_GATES[key].name} only takes one input — this circuit's rows each need a gate that reads both A and B (AND, OR, XOR, NAND, NOR, or XNOR).`);
    flashHalfAdderRejected();
    return;
  }
  haGates.push({ key });
  updateHalfAdder();
}

/** A drag/click that lands on the board but gets rejected (currently just
 *  a 1-input gate — see addHalfAdderGate() above) still needs to *look*
 *  like something happened right where the user was looking, not just in
 *  the explainer text below the palette — otherwise it reads as the drop
 *  simply not working. Restarts the CSS animation on repeat rejects by
 *  toggling the class off and forcing a reflow before re-adding it. */
function flashHalfAdderRejected() {
  const drop = document.getElementById('halfadder-circuit-drop');
  drop.classList.remove('drop-rejected');
  void drop.offsetWidth;
  drop.classList.add('drop-rejected');
  setTimeout(() => drop.classList.remove('drop-rejected'), 500);
}

function removeHalfAdderGate(index) {
  haGates.splice(index, 1);
  updateHalfAdder();
}

function updateHalfAdder() {
  document.getElementById('ha-lbl-a0').classList.toggle('active', halfAdderA === 0);
  document.getElementById('ha-lbl-a1').classList.toggle('active', halfAdderA === 1);
  document.getElementById('ha-lbl-b0').classList.toggle('active', halfAdderB === 0);
  document.getElementById('ha-lbl-b1').classList.toggle('active', halfAdderB === 1);

  renderCircuitDiagram();
  setExplainer('halfadder-explainer', describeHalfAdderState());
  renderHalfAdderTruthTable();
  renderHalfAdderCompareTable();

  const hasXor = haGates.some(g => g.key === 'XOR');
  const hasAnd = haGates.some(g => g.key === 'AND');
  const status = document.getElementById('halfadder-status');
  status.textContent = haGates.length === 0 ? ''
    : (hasXor && hasAnd) ? '✓ half adder present' : `${haGates.length} gate${haGates.length === 1 ? '' : 's'}`;
  status.style.color = (hasXor && hasAnd) ? 'var(--success)' : 'var(--text3)';
}

/** Builds the full circuit <svg> — two vertical rails (A, B) running down
 *  the left side, one row per placed gate branching off them via short
 *  horizontal stubs into the gate's two inputs, and the live output value
 *  labeled to the right of each gate (auto-named "Sum" for XOR, "Carry"
 *  for AND, or its own gate name otherwise). Each row sits behind an
 *  invisible clickable overlay (data-row-index) so clicking a row removes
 *  it — handled by the single delegated listener in initHalfAdderCircuit(). */
function renderCircuitDiagram() {
  const svg = document.getElementById('halfadder-circuit-svg');
  const n = haGates.length;

  if (n === 0) {
    svg.setAttribute('viewBox', `0 0 ${HA_SVG_WIDTH} 100`);
    svg.setAttribute('aria-label', 'Half adder circuit diagram, currently empty.');
    svg.innerHTML = `
      <rect x="10" y="10" width="${HA_SVG_WIDTH - 20}" height="80" rx="10" fill="none" stroke="var(--border2)" stroke-width="2" stroke-dasharray="6,5"/>
      <text x="${HA_SVG_WIDTH / 2}" y="46" text-anchor="middle" fill="var(--text3)" font-size="13" font-family="'JetBrains Mono', monospace">+</text>
      <text x="${HA_SVG_WIDTH / 2}" y="66" text-anchor="middle" fill="var(--text3)" font-size="10" font-family="'JetBrains Mono', monospace">drag a gate here</text>`;
    return;
  }

  const lastTapA = HA_TOP_PAD + (n - 1) * HA_ROW_HEIGHT + 13;
  const lastTapB = HA_TOP_PAD + (n - 1) * HA_ROW_HEIGHT + 27;
  const height   = HA_TOP_PAD + n * HA_ROW_HEIGHT + HA_BOTTOM_PAD;

  svg.setAttribute('viewBox', `0 0 ${HA_SVG_WIDTH} ${height}`);
  svg.setAttribute('aria-label', `Half adder circuit diagram with ${n} gate${n === 1 ? '' : 's'}.`);

  let markup = `
    <text x="${HA_BUS_A_X}" y="${HA_TOP_PAD - 8}" text-anchor="middle" fill="var(--zero)" font-size="11" font-weight="700" font-family="'JetBrains Mono', monospace">A=${halfAdderA}</text>
    <text x="${HA_BUS_B_X + 6}" y="${HA_TOP_PAD - 8}" text-anchor="middle" fill="var(--one)" font-size="11" font-weight="700" font-family="'JetBrains Mono', monospace">B=${halfAdderB}</text>
    <line x1="${HA_BUS_A_X}" y1="${HA_TOP_PAD}" x2="${HA_BUS_A_X}" y2="${lastTapA}" stroke="var(--zero)" stroke-width="2"/>
    <line x1="${HA_BUS_B_X}" y1="${HA_TOP_PAD}" x2="${HA_BUS_B_X}" y2="${lastTapB}" stroke="var(--one)" stroke-width="2"/>`;

  haGates.forEach((g, i) => {
    const rowY   = HA_TOP_PAD + i * HA_ROW_HEIGHT;
    const tapAY  = rowY + 13;
    const tapBY  = rowY + 27;
    const value  = CLASSICAL_GATES[g.key].fn(halfAdderA, halfAdderB);
    const label  = g.key === 'XOR' ? t('circuits.sum', 'Sum') : g.key === 'AND' ? t('circuits.carry', 'Carry') : CLASSICAL_GATES[g.key].name;
    const outX   = HA_GATE_X + 64 + 10;

    markup += `
      <line x1="${HA_BUS_A_X}" y1="${tapAY}" x2="${HA_GATE_X}" y2="${tapAY}" stroke="var(--zero)" stroke-width="2"/>
      <line x1="${HA_BUS_B_X}" y1="${tapBY}" x2="${HA_GATE_X}" y2="${tapBY}" stroke="var(--one)" stroke-width="2"/>
      <g transform="translate(${HA_GATE_X},${rowY})">${classicalGateInnerSVG(g.key)}</g>
      <text x="${outX}" y="${rowY + 24}" fill="${value ? 'var(--zero)' : 'var(--text3)'}" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">→ ${label} = ${value}</text>
      <rect data-row-index="${i}" x="0" y="${rowY}" width="${HA_SVG_WIDTH}" height="40" fill="transparent" style="cursor:pointer;">
        <title>${CLASSICAL_GATES[g.key].name} — click to remove</title>
      </rect>`;
  });

  svg.innerHTML = markup;
}

/** Narrates the current build state — empty, partial (no gates yet, or
 *  present but neither XOR nor AND), correct, or a circuit with other
 *  gates mixed in — rather than just reporting numbers, so a student
 *  dragging the "wrong" gate still gets a useful explanation of what
 *  happened instead of just a mismatched digit. */
function describeHalfAdderState() {
  if (haGates.length === 0) {
    return 'Drag a gate — or click one, then click the circuit board — to add it as a new row, wired to A and B automatically. A half adder needs one row computing Sum = A⊕B (XOR) and another computing Carry = A·B (AND), from the exact same two inputs.';
  }
  const hasXor = haGates.some(g => g.key === 'XOR');
  const hasAnd = haGates.some(g => g.key === 'AND');
  const sum   = hasXor ? CLASSICAL_GATES.XOR.fn(halfAdderA, halfAdderB) : null;
  const carry = hasAnd ? CLASSICAL_GATES.AND.fn(halfAdderA, halfAdderB) : null;

  if (hasXor && hasAnd) {
    const extra = haGates.length > 2 ? ` (plus ${haGates.length - 2} extra gate${haGates.length - 2 === 1 ? '' : 's'} — harmless, but not needed)` : '';
    return `<strong style="color:var(--success)">That's a correct half adder.</strong> A=${halfAdderA}, B=${halfAdderB} → Sum = ${sum}, Carry = ${carry}${extra}. XOR catches the bit-by-bit total, AND catches the overflow — together they're the two gates every full adder is built from.`;
  }
  if (!hasXor && !hasAnd) {
    return `A=${halfAdderA}, B=${halfAdderB} — ${haGates.length} gate${haGates.length === 1 ? '' : 's'} placed, but none of them are XOR or AND yet. Compare against the target truth table on the right: a true half adder needs an XOR row (for Sum) and an AND row (for Carry).`;
  }
  return `A=${halfAdderA}, B=${halfAdderB} — you've got ${hasXor ? 'the XOR (Sum)' : 'the AND (Carry)'} row, but still need ${hasXor ? 'an AND row for Carry' : 'an XOR row for Sum'} to complete the half adder.`;
}

function renderHalfAdderTruthTable() {
  const table = document.getElementById('ha-truth-table');
  if (!table) return;
  const rows = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => ({ a, b, sum: a ^ b, carry: a & b }));
  const header = `<tr><th>A</th><th>B</th><th>${t('circuits.sum', 'Sum')}</th><th>${t('circuits.carry', 'Carry')}</th></tr>`;
  table.innerHTML = header + rows.map(r => {
    const active = r.a === halfAdderA && r.b === halfAdderB;
    return `<tr class="${active ? 'truth-row-active' : ''}"><td>${r.a}</td><td>${r.b}</td><td>${r.sum}</td><td>${r.carry}</td></tr>`;
  }).join('');
}

/** The third table on this page (see index.html) — same four A,B rows as
 *  renderHalfAdderTruthTable() above, but with both a "classical" pair of
 *  columns (AND/XOR, as built in this panel) and a "quantum" pair (what
 *  the Quantum Circuit panel's 3-qubit Half Adder preset computes via X +
 *  Toffoli + CNOT). The numbers are identical by construction — a Toffoli
 *  reversibly computes the same AND, a CNOT the same XOR — which is the
 *  point being illustrated: two different physical mechanisms landing on
 *  the exact same truth table. */
function renderHalfAdderCompareTable() {
  const table = document.getElementById('ha-compare-table');
  if (!table) return;
  const rows = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => ({ a, b, sum: a ^ b, carry: a & b }));
  const header = `<tr><th>A</th><th>B</th>` +
    `<th>${t('circuits.sumClassical', 'Sum (Classical)')}</th><th>${t('circuits.carryClassical', 'Carry (Classical)')}</th>` +
    `<th>${t('circuits.sumQuantum', 'Sum (Quantum)')}</th><th>${t('circuits.carryQuantum', 'Carry (Quantum)')}</th></tr>`;
  table.innerHTML = header + rows.map(r => {
    const active = r.a === halfAdderA && r.b === halfAdderB;
    return `<tr class="${active ? 'truth-row-active' : ''}"><td>${r.a}</td><td>${r.b}</td>` +
      `<td>${r.sum}</td><td>${r.carry}</td><td>${r.sum}</td><td>${r.carry}</td></tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════
// COMPARE PANEL DIAGRAMS (fixed reference circuits, drawn once)
// ═══════════════════════════════════════════════════════════════════
// Unlike everything above, these two diagrams don't track any live state
// (haGates, halfAdderA/B) — they're the answer key, not the workspace, so
// they're rendered once at init and never touched again. A simple SVG
// "meter" glyph for the quantum diagram's two measurement steps, since
// nothing else in this app draws a measurement box yet.
const HA_METER_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path d="M4 18a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="2"/>
  <line x1="12" y1="18" x2="17" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="18" r="1.6" fill="currentColor"/>
</svg>`;

function renderHalfAdderCompareDiagrams() {
  renderCompareClassicalDiagram();
  renderCompareQuantumDiagram();
}

/** A fixed two-row gate-level schematic — A and B rails branch into an
 *  XOR row (Sum) and an AND row (Carry) — reusing classicalGateInnerSVG()
 *  so the symbols match the drag-and-drop builder's palette exactly, just
 *  laid out as the one canonical answer instead of whatever's been
 *  dragged in. */
function renderCompareClassicalDiagram() {
  const svg = document.getElementById('ha-compare-classical-svg');
  if (!svg) return;

  const rows      = [{ key: 'XOR', label: 'Sum' }, { key: 'AND', label: 'Carry' }];
  const busAX     = 20, busBX = 34, gateX = 56;
  const topPad    = 20, rowHeight = 56;
  const lastTapA  = topPad + (rows.length - 1) * rowHeight + 13;
  const lastTapB  = topPad + (rows.length - 1) * rowHeight + 27;

  let markup = `
    <text x="${busAX}" y="${topPad - 8}" text-anchor="middle" fill="var(--zero)" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">A</text>
    <text x="${busBX + 6}" y="${topPad - 8}" text-anchor="middle" fill="var(--one)" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">B</text>
    <line x1="${busAX}" y1="${topPad}" x2="${busAX}" y2="${lastTapA}" stroke="var(--zero)" stroke-width="2"/>
    <line x1="${busBX}" y1="${topPad}" x2="${busBX}" y2="${lastTapB}" stroke="var(--one)" stroke-width="2"/>`;

  rows.forEach((row, i) => {
    const rowY  = topPad + i * rowHeight;
    const tapAY = rowY + 13;
    const tapBY = rowY + 27;
    const outX  = gateX + 64 + 10;
    markup += `
      <line x1="${busAX}" y1="${tapAY}" x2="${gateX}" y2="${tapAY}" stroke="var(--zero)" stroke-width="2"/>
      <line x1="${busBX}" y1="${tapBY}" x2="${gateX}" y2="${tapBY}" stroke="var(--one)" stroke-width="2"/>
      <g transform="translate(${gateX},${rowY})">${classicalGateInnerSVG(row.key)}</g>
      <text x="${outX}" y="${rowY + 24}" fill="var(--text)" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">→ ${row.label}</text>`;
  });

  svg.innerHTML = markup;
}

/** A fixed 4-qubit circuit diagram, shown for A=1,B=1 — q0/q1 get X'd to
 *  hold A/B, two CNOTs copy their XOR into ancilla q2 (Sum), a Toffoli
 *  copies their AND into ancilla q3 (Carry), then both ancillas are
 *  measured out onto a 2-bit classical register. Built from the same
 *  .circuit2-* grid classes the 2Q/3Q circuit builders use (see
 *  renderDiagram() in circuit-multiqubit-tab.js) so it reads as the same
 *  kind of diagram as the rest of the app, plus three diagram-only
 *  additions this static reference needs but the interactive builders
 *  don't: a measurement box (.ha-meter), its dashed drop to the classical
 *  register (.ha-meter-drop), and the doubled classical wire itself
 *  (.ha-classical-wire) — see css/tabs/circuit.css. Plain <div>s, not
 *  <button>s — nothing here is clickable, it's the answer key. */
function renderCompareQuantumDiagram() {
  const container = document.getElementById('ha-compare-quantum-diagram');
  if (!container) return;

  let html = '';
  for (let row = 1; row <= 4; row++) {
    html += `<div class="circuit2-ket" style="grid-column:1;grid-row:${row};">|0⟩</div>`;
    html += `<div class="circuit2-wire" style="grid-column:2/-1;grid-row:${row};"></div>`;
  }
  html += `<div class="circuit2-ket" style="grid-column:1;grid-row:5;">c⫽2</div>`;
  html += `<div class="ha-classical-wire" style="grid-column:2/-1;grid-row:5;"></div>`;

  // Column 2 — X gates set q0 = A, q1 = B (this diagram shows A=1, B=1).
  html += `<div class="circuit2-cell circuit2-gate" style="grid-column:2;grid-row:1;color:${GATES.X.color};border-color:${GATES.X.color};" title="X — sets q0 = A">X</div>`;
  html += `<div class="circuit2-cell circuit2-gate" style="grid-column:2;grid-row:2;color:${GATES.X.color};border-color:${GATES.X.color};" title="X — sets q1 = B">X</div>`;

  // Column 3 — CNOT q0→q2 (first half of Sum = A⊕B into the ancilla).
  html += `<div class="circuit2-cnot-line" style="grid-column:3;grid-row:1/4;"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-dot" style="grid-column:3;grid-row:1;" title="CNOT q0→q2"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-target" style="grid-column:3;grid-row:3;" title="CNOT q0→q2">⊕</div>`;

  // Column 4 — CNOT q1→q2 (second half of Sum; q2 now holds A⊕B).
  html += `<div class="circuit2-cnot-line" style="grid-column:4;grid-row:2/4;"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-dot" style="grid-column:4;grid-row:2;" title="CNOT q1→q2"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-target" style="grid-column:4;grid-row:3;" title="CNOT q1→q2">⊕</div>`;

  // Column 5 — Toffoli q0,q1→q3 (q3 now holds Carry = A·B).
  html += `<div class="circuit2-cnot-line" style="grid-column:5;grid-row:1/5;"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-dot" style="grid-column:5;grid-row:1;" title="Toffoli q0,q1→q3"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-dot" style="grid-column:5;grid-row:2;" title="Toffoli q0,q1→q3"></div>`;
  html += `<div class="circuit2-cell circuit2-cnot-target" style="grid-column:5;grid-row:4;" title="Toffoli q0,q1→q3">⊕</div>`;

  // Column 6 — measure q2 (Sum) onto classical bit 0.
  html += `<div class="ha-meter-drop" style="grid-column:6;grid-row:3/6;"></div>`;
  html += `<div class="circuit2-cell ha-meter" style="grid-column:6;grid-row:3;" title="Measure q2 (Sum) → bit 0">${HA_METER_ICON}</div>`;
  html += `<div class="ha-meter-label" style="grid-column:6;grid-row:5;">0</div>`;

  // Column 7 — measure q3 (Carry) onto classical bit 1.
  html += `<div class="ha-meter-drop" style="grid-column:7;grid-row:4/6;"></div>`;
  html += `<div class="circuit2-cell ha-meter" style="grid-column:7;grid-row:4;" title="Measure q3 (Carry) → bit 1">${HA_METER_ICON}</div>`;
  html += `<div class="ha-meter-label" style="grid-column:7;grid-row:5;">1</div>`;

  container.innerHTML = html;
}
