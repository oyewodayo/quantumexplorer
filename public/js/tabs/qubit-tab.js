'use strict';
// Depends on: app.js state (qubitMain, rendererMain), core/dom-utils.js
// (copyShareLink). initQubitTab() wires up the preset buttons, sliders,
// and share button declared in index.html — called once from app.js's
// DOMContentLoaded.

// ═══════════════════════════════════════════════════════════════════
// QUBIT TAB
// ═══════════════════════════════════════════════════════════════════
function initQubitTab() {
  // Scoped to #qubit-1q-panel (not the whole #tab-qubit) — the Two Qubits
  // panel added below has its own [data-qubit2] preset buttons that must
  // NOT also drive qubitMain.
  document.querySelectorAll('#qubit-1q-panel .preset-btn').forEach(btn => {
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => setMainState(theta, phi));
  });
  document.getElementById('sl-theta').addEventListener('input', sliderUpdate);
  document.getElementById('sl-phi').addEventListener('input', sliderUpdate);

  document.getElementById('btn-share-qubit').addEventListener('click', e => {
    const b = qubitMain.getBloch();
    copyShareLink({ tab: 'qubit', theta: b.theta.toFixed(4), phi: b.phi.toFixed(4) }, e.currentTarget);
  });

  // Keyboard control: the sphere is drag-only otherwise, which locks out
  // anyone not using a mouse/touchscreen. Arrow keys nudge theta/phi in
  // small steps; hold Shift for bigger steps.
  document.getElementById('bloch-main').addEventListener('keydown', e => {
    const step = e.shiftKey ? Math.PI / 6 : Math.PI / 36; // 30° or 5°
    const b = qubitMain.getBloch();
    let theta = b.theta, phi = b.phi;
    switch (e.key) {
      case 'ArrowUp':    theta = Math.max(0, theta - step); break;
      case 'ArrowDown':  theta = Math.min(Math.PI, theta + step); break;
      case 'ArrowLeft':  phi -= step; break;
      case 'ArrowRight': phi += step; break;
      default: return;
    }
    phi = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    e.preventDefault();
    setMainState(theta, phi);
  });

  document.querySelectorAll('.mode-btn[data-qubit-mode]').forEach(btn =>
    btn.addEventListener('click', () => setQubitMode(btn.dataset.qubitMode)));
  document.querySelectorAll('.mode-btn[data-qubit-submode]').forEach(btn =>
    btn.addEventListener('click', () => setQubitSubmode(btn.dataset.qubitSubmode)));
  initQubit2Panel();
  initQubit3Panel();

  document.getElementById('btn-qubit-tryme').addEventListener('click', () => {
    const presetBtns = document.querySelectorAll('#qubit-1q-panel .preset-btn');
    runTryMeSequence({
      button: document.getElementById('btn-qubit-tryme'),
      disableEls: [...presetBtns, document.getElementById('sl-theta'), document.getElementById('sl-phi')],
      states: QUBIT_TRYME_STATES,
      applyState: s => setMainState(s.theta, s.phi),
      describeStep: (s, i) => {
        const label  = QUBIT_TRYME_LABELS[i % QUBIT_TRYME_LABELS.length];
        const detail = QUBIT_TRYME_DETAILS[i % QUBIT_TRYME_DETAILS.length];
        const p0 = Math.round(qubitMain.prob0() * 100);
        const p1 = Math.round(qubitMain.prob1() * 100);
        return {
          explain: `<strong>${label}</strong> — ${detail} Right now that's ${p0}% |0⟩, ${p1}% |1⟩.`,
          historyLabel: label,
          historyColor: 'var(--zero)'
        };
      },
      explainerId: 'qubit-tryme-explainer',
      historyId: 'qubit-tryme-history'
    });
  });
}

/** |0⟩, |1⟩, |+⟩, |-⟩, |i⟩, |-i⟩ — the same six presets as the Basis
 *  States buttons above, in the same order, as (theta, phi) radians
 *  rather than the buttons' own theta/phi-mult-of-π attributes. Shared
 *  by both Try me buttons below — the Two Qubit one just uses the first
 *  four (it has no |i⟩/|-i⟩ presets of its own). */
const QUBIT_TRYME_STATES = [
  { theta: 0,         phi: 0 },
  { theta: Math.PI,   phi: 0 },
  { theta: Math.PI/2, phi: 0 },
  { theta: Math.PI/2, phi: Math.PI },
  { theta: Math.PI/2, phi: Math.PI/2 },
  { theta: Math.PI/2, phi: 1.5 * Math.PI }
];
// Same order as QUBIT_TRYME_STATES — used to label each step's history
// chip/explainer without re-deriving a ket label from (theta, phi).
const QUBIT_TRYME_LABELS = ['|0⟩', '|1⟩', '|+⟩', '|-⟩', '|i⟩', '|-i⟩'];
// Same order again — one detailed, physically-grounded sentence per basis
// state, shared by the One/Two/Three Qubit Try Me explainers below so the
// "what does this position mean" writeup only lives in one place.
const QUBIT_TRYME_DETAILS = [
  'the north pole of the Bloch sphere — the qubit\'s definite "off" state, with zero superposition at all.',
  'the south pole of the Bloch sphere — the definite "on" state, the exact opposite pole from |0⟩.',
  'sitting on the equator at phase φ=0° — an equal superposition. A measurement here is a genuine coin flip: before you measure, the qubit isn\'t secretly one value or the other, it truly holds both at once.',
  'also on the equator (the same 50/50 odds as |+⟩) but at phase φ=180°, so the |1⟩ amplitude points the opposite way. A single measurement can\'t tell |+⟩ and |-⟩ apart — only a Hadamard gate or an interference experiment reveals that hidden phase.',
  'on the equator at phase φ=90° — 50/50 odds again, but now with an imaginary relative phase between the amplitudes. This is a state a classical bit could never represent — the extra "twist" comes from the complex numbers underlying quantum amplitudes.',
  'on the equator at phase φ=270°, the mirror image of |i⟩ — same 50/50 measurement odds, opposite imaginary phase.'
];
const QUBIT_TRYME_INTERVAL_MS = 2800; // gives the detailed, multi-sentence per-step explanations below real reading time, not just sphere-settle time (same reasoning as GATES_TRYME_INTERVAL_MS)

/** Shared driver for every "Try me" button in the app (also used by
 *  gates-tab.js's Apply Gate demo — plain <script> tags share one global
 *  scope here, so this is reachable there too) — walks through `states`
 *  exactly once, applying each preset condition via `applyState`, and
 *  disables `button` + `disableEls` for the run so a manual click/drag
 *  can't fight the auto-cycle mid-sequence. A single deliberate pass
 *  through named presets, not a repeating loop — the student can revisit
 *  any earlier position afterward via the rollback history below instead
 *  of waiting for it to cycle back around. `intervalMs` defaults to this
 *  tab's own pacing but is overridable per call (the Gates tab's own demo
 *  wants more reading time for its longer per-gate paragraphs). Relies on
 *  the native disabled-button behavior (no click events fire) rather than
 *  its own re-entrancy flag, so clicking while running is simply a no-op
 *  until the run finishes.
 *
 *  `describeStep(state, idx)` is optional — when given, it may return
 *  `{ explain, historyLabel, historyColor }`. `explain` is written into
 *  `explainerId` via setExplainer() (same soft-fade update the Gates tab
 *  already uses); `historyLabel`/`historyColor` render one chip into
 *  `historyId`'s `.history-row`. Both target ids are optional
 *  independently of each other and of `describeStep` itself, so callers
 *  that don't need a running narration (the Gates tab's own Try Me, which
 *  already narrates via applyGate()) are unaffected. The history strip is
 *  cleared at the start of each run rather than accumulating across runs,
 *  so replaying Try me always starts from an empty trail.
 *
 *  Rollback: each history chip is a real button, not just a label — click
 *  one any time (mid-run or after it finishes) and it replays that exact
 *  step via the same showStep() the auto-play itself uses, so the student
 *  can jump back to any earlier position, re-read its explanation, and
 *  see the sphere/display land back exactly where it was there. showStep()
 *  also marks the clicked (or currently auto-playing) chip with
 *  `.is-current` so it's always clear which position is on screen. */
function runTryMeSequence({ button, disableEls, states, applyState, intervalMs = QUBIT_TRYME_INTERVAL_MS, describeStep = null, explainerId = null, historyId = null }) {
  button.disabled = true;
  disableEls.forEach(el => { el.disabled = true; });

  const historyEl = historyId ? document.getElementById(historyId) : null;
  if (historyEl) historyEl.innerHTML = '';

  function showStep(idx) {
    applyState(states[idx]);
    if (!describeStep) return null;
    const step = describeStep(states[idx], idx) || {};
    if (explainerId && step.explain) setExplainer(explainerId, step.explain);
    if (historyEl) {
      historyEl.querySelectorAll('.hist-tag').forEach(chip =>
        chip.classList.toggle('is-current', parseInt(chip.dataset.stepIdx, 10) === idx));
    }
    return step;
  }

  let idx = 0;
  const timer = setInterval(() => {
    const step = showStep(idx);
    if (historyEl && step && step.historyLabel) {
      const color = step.historyColor || 'var(--text2)';
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'hist-tag is-current';
      chip.dataset.stepIdx = idx;
      chip.style.color = color;
      chip.style.borderColor = color + '44';
      chip.textContent = step.historyLabel;
      chip.title = 'Click to revisit this step and re-read its explanation';
      chip.disabled = true; // enabled once the run finishes, below — no rollback mid-run
      const stepIdx = idx; // captured per-chip — idx itself keeps advancing
      chip.addEventListener('click', () => showStep(stepIdx));
      historyEl.appendChild(chip);
    }
    idx++;
    if (idx >= states.length) {
      clearInterval(timer);
      button.disabled = false;
      disableEls.forEach(el => { el.disabled = false; });
      if (historyEl) historyEl.querySelectorAll('.hist-tag').forEach(chip => { chip.disabled = false; });
    }
  }, intervalMs);
}

/** Classical/Quantum switch for the Bits tab. Classical is its own
 *  standalone page; Quantum reveals a second-level toggle for
 *  One Qubit / Two Qubit (see setQubitSubmode). Landing on Quantum
 *  always resets to the qubit explainer, regardless of whichever
 *  submode was last picked — callers that want a specific submode
 *  (e.g. roadmap navigation) call setQubitSubmode() right after. */
function setQubitMode(mode) {
  document.querySelectorAll('.mode-btn[data-qubit-mode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.qubitMode === mode));
  document.getElementById('qubit-classical-panel').style.display = mode === 'classical' ? '' : 'none';
  document.getElementById('qubit-quantum-panel').style.display   = mode === 'quantum'   ? '' : 'none';
  if (mode === 'quantum') setQubitSubmode(null);
  else syncSidebarSub('qubit', { qubitMode: mode, qubitSubmode: undefined });
}

/** One Qubit/Two Qubit switch nested inside the Quantum panel. Until one
 *  is picked, qubit-quantum-intro explains what a qubit is instead. */
function setQubitSubmode(submode) {
  document.querySelectorAll('.mode-btn[data-qubit-submode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.qubitSubmode === submode));
  document.getElementById('qubit-quantum-intro').style.display = submode ? 'none' : '';
  document.getElementById('qubit-1q-panel').style.display = submode === '1q' ? '' : 'none';
  document.getElementById('qubit-2q-panel').style.display = submode === '2q' ? '' : 'none';
  document.getElementById('qubit-3q-panel').style.display = submode === '3q' ? '' : 'none';
  syncSidebarSub('qubit', { qubitMode: 'quantum', qubitSubmode: submode || undefined });
}

/** Two independent Qubit instances (see app.js's qubit2A/qubit2B), each
 *  with its own Bloch sphere — deliberately not a shared TwoQubitState,
 *  since nothing here is entangled; the joint probabilities are just the
 *  product of each qubit's own, computed fresh in updateQubit2UI(). */
function initQubit2Panel() {
  const qubit2Btns = document.querySelectorAll('[data-qubit2]');
  qubit2Btns.forEach(btn => {
    const which = btn.dataset.qubit2;
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => {
      (which === 'a' ? qubit2A : qubit2B).setState(theta, phi);
      updateQubit2UI();
    });
  });

  document.getElementById('btn-qubit2-tryme').addEventListener('click', () => {
    runTryMeSequence({
      button: document.getElementById('btn-qubit2-tryme'),
      disableEls: [...qubit2Btns],
      states: QUBIT_TRYME_STATES.slice(0, 4), // |0⟩, |1⟩, |+⟩, |-⟩ — both qubits move together
      applyState: s => {
        qubit2A.setState(s.theta, s.phi);
        qubit2B.setState(s.theta, s.phi);
        updateQubit2UI();
      },
      describeStep: (s, i) => {
        const label  = QUBIT_TRYME_LABELS[i % 4];
        const detail = QUBIT_TRYME_DETAILS[i % 4];
        // Both qubits are always set identically here, so A's own odds
        // describe both — squaring/cross-multiplying them gives the exact
        // joint distribution, the concrete P(ab) = P(a) × P(b) at work.
        const p0 = qubit2A.prob0(), p1 = qubit2A.prob1();
        const pct = x => Math.round(x * 100);
        return {
          explain: `Both qubits set to <strong>${label}</strong> — ${detail} Since the two qubits are completely independent (not entangled), ` +
            `the joint state is the tensor product ${label}⊗${label}: ${pct(p0 * p0)}% |00⟩, ${pct(p0 * p1)}% |01⟩, ${pct(p1 * p0)}% |10⟩, ${pct(p1 * p1)}% |11⟩ — ` +
            `exactly P(ab) = P(a) × P(b).`,
          historyLabel: label,
          historyColor: 'var(--one)'
        };
      },
      explainerId: 'qubit2-tryme-explainer',
      historyId: 'qubit2-tryme-history'
    });
  });
}

// theta never wraps (its range is [0, π] by construction), but phi does
// — comparing raw values would treat 0 and 2π (the same angle) as far
// apart, so phi's diff is folded to the short way around the circle.
const PRESET_MATCH_EPS = 1e-3; // radians (~0.06°) — well past round-trip float noise, well under any deliberate drag

/** Toggles .is-active on whichever button in `presetBtns` matches
 *  (theta, phi) — at most one, since no two basis-state presets share a
 *  point on the sphere — so the preset grid always reflects the sphere's
 *  actual current state instead of only showing feedback for the instant
 *  a preset was clicked. */
function highlightMatchingPreset(presetBtns, theta, phi) {
  const twoPi = 2 * Math.PI;
  const normPhi = ((phi % twoPi) + twoPi) % twoPi;
  presetBtns.forEach(btn => {
    const bTheta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const bPhi   = ((parseFloat(btn.dataset.phiMult) * Math.PI % twoPi) + twoPi) % twoPi;
    const phiDiff = Math.min(Math.abs(bPhi - normPhi), twoPi - Math.abs(bPhi - normPhi));
    const match = Math.abs(bTheta - theta) < PRESET_MATCH_EPS && phiDiff < PRESET_MATCH_EPS;
    btn.classList.toggle('is-active', match);
  });
}

/** Three independent Qubit instances (see app.js's qubit3A/B/C), same
 *  "not entangled" pattern as initQubit2Panel() above — just one more
 *  qubit and an 8-row joint table instead of 4. */
function initQubit3Panel() {
  const qubit3Btns = document.querySelectorAll('[data-qubit3]');
  const qubitsByLetter = { a: qubit3A, b: qubit3B, c: qubit3C };
  qubit3Btns.forEach(btn => {
    const which = btn.dataset.qubit3;
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => {
      qubitsByLetter[which].setState(theta, phi);
      updateQubit3UI();
    });
  });

  document.getElementById('btn-qubit3-tryme').addEventListener('click', () => {
    runTryMeSequence({
      button: document.getElementById('btn-qubit3-tryme'),
      disableEls: [...qubit3Btns],
      states: QUBIT_TRYME_STATES.slice(0, 4), // |0⟩, |1⟩, |+⟩, |-⟩ — all three qubits move together
      applyState: s => {
        qubit3A.setState(s.theta, s.phi);
        qubit3B.setState(s.theta, s.phi);
        qubit3C.setState(s.theta, s.phi);
        updateQubit3UI();
      },
      describeStep: (s, i) => {
        const label  = QUBIT_TRYME_LABELS[i % 4];
        const detail = QUBIT_TRYME_DETAILS[i % 4];
        // Only ever |0⟩, |1⟩, |+⟩, or |-⟩ here (this slice's 4 states), so
        // the joint outcome is always exactly one of these two shapes:
        // fully deterministic (|0⟩/|1⟩) or a flat eighth each (|+⟩/|-⟩) —
        // no need to spell out all 8 percentages to be exact about it.
        const p0 = qubit3A.prob0(), p1 = qubit3A.prob1();
        const jointDesc = p0 > 0.999
          ? 'always |000⟩ — 100% certain, zero superposition anywhere in the joint state'
          : p1 > 0.999
            ? 'always |111⟩ — 100% certain, zero superposition anywhere in the joint state'
            : 'a flat 12.5% across all eight outcomes |000⟩ through |111⟩';
        return {
          explain: `All three qubits set to <strong>${label}</strong> — ${detail} Since all three are independent (not entangled), ` +
            `the joint state is the triple tensor product ${label}⊗${label}⊗${label}: ${jointDesc} — exactly P(abc) = P(a) × P(b) × P(c).`,
          historyLabel: label,
          historyColor: 'var(--zero)'
        };
      },
      explainerId: 'qubit3-tryme-explainer',
      historyId: 'qubit3-tryme-history'
    });
  });
}

const QUBIT3_KETS = ['000', '001', '010', '011', '100', '101', '110', '111'];

function updateQubit3UI() {
  const a = qubit3A.getBloch(), b = qubit3B.getBloch(), c = qubit3C.getBloch();
  rendererQubit3A.animateTo(a.x, a.y, a.z, qubit3A.getLabel());
  rendererQubit3B.animateTo(b.x, b.y, b.z, qubit3B.getLabel());
  rendererQubit3C.animateTo(c.x, c.y, c.z, qubit3C.getLabel());
  highlightMatchingPreset(document.querySelectorAll('[data-qubit3="a"]'), a.theta, a.phi);
  highlightMatchingPreset(document.querySelectorAll('[data-qubit3="b"]'), b.theta, b.phi);
  highlightMatchingPreset(document.querySelectorAll('[data-qubit3="c"]'), c.theta, c.phi);
  document.getElementById('label-3q-a').textContent   = qubit3A.getLabel();
  document.getElementById('label-3q-b').textContent   = qubit3B.getLabel();
  document.getElementById('label-3q-c').textContent   = qubit3C.getLabel();
  document.getElementById('formula-3q-a').textContent = qubit3A.getFormula();
  document.getElementById('formula-3q-b').textContent = qubit3B.getFormula();
  document.getElementById('formula-3q-c').textContent = qubit3C.getFormula();
  document.getElementById('bloch-3q-a').setAttribute('aria-label',
    `Bloch sphere for Qubit A. State: ${qubit3A.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);
  document.getElementById('bloch-3q-b').setAttribute('aria-label',
    `Bloch sphere for Qubit B. State: ${qubit3B.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);
  document.getElementById('bloch-3q-c').setAttribute('aria-label',
    `Bloch sphere for Qubit C. State: ${qubit3C.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);

  // Product state: three independent qubits, so the joint probability of
  // any three-bit outcome is just each qubit's own probability multiplied
  // together — same reasoning as updateQubit2UI() below, one more factor.
  const pA = [qubit3A.prob0(), qubit3A.prob1()];
  const pB = [qubit3B.prob0(), qubit3B.prob1()];
  const pC = [qubit3C.prob0(), qubit3C.prob1()];
  const last = QUBIT3_KETS.length - 1;
  const container = document.getElementById('qubit3-prob-rows');
  container.innerHTML = QUBIT3_KETS.map((ket, i) => {
    const bits = [(i >> 2) & 1, (i >> 1) & 1, i & 1];
    const p = pA[bits[0]] * pB[bits[1]] * pC[bits[2]];
    const pct = p * 100;
    const color     = i === 0 ? 'var(--zero)' : i === last ? 'var(--one)' : 'var(--text2)';
    const fillClass = i === 0 ? 'zero-fill'   : i === last ? 'one-fill'   : '';
    const fillStyle = fillClass ? '' : 'background:var(--text2);';
    return `
      <div class="prob-row">
        <span class="ket" style="color:${color}">|${ket}⟩</span>
        <div class="track"><div class="fill ${fillClass}" style="${fillStyle}width:${pct}%"></div></div>
        <span class="pct">${Math.round(pct)}%</span>
      </div>`;
  }).join('');
}

function updateQubit2UI() {
  const a = qubit2A.getBloch(), b = qubit2B.getBloch();
  rendererQubit2A.animateTo(a.x, a.y, a.z, qubit2A.getLabel());
  rendererQubit2B.animateTo(b.x, b.y, b.z, qubit2B.getLabel());
  highlightMatchingPreset(document.querySelectorAll('[data-qubit2="a"]'), a.theta, a.phi);
  highlightMatchingPreset(document.querySelectorAll('[data-qubit2="b"]'), b.theta, b.phi);
  document.getElementById('label-2q-a').textContent   = qubit2A.getLabel();
  document.getElementById('label-2q-b').textContent   = qubit2B.getLabel();
  document.getElementById('formula-2q-a').textContent = qubit2A.getFormula();
  document.getElementById('formula-2q-b').textContent = qubit2B.getFormula();
  document.getElementById('bloch-2q-a').setAttribute('aria-label',
    `Bloch sphere for Qubit A. State: ${qubit2A.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);
  document.getElementById('bloch-2q-b').setAttribute('aria-label',
    `Bloch sphere for Qubit B. State: ${qubit2B.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);

  // Product state: two independent qubits, so the joint probability of
  // any two-bit outcome is just each qubit's own probability multiplied
  // together — no entanglement math involved (contrast TwoQubitState in
  // the Circuit/Entangle tabs, which mixes amplitudes instead).
  const pA0 = qubit2A.prob0(), pA1 = qubit2A.prob1();
  const pB0 = qubit2B.prob0(), pB1 = qubit2B.prob1();
  const joint = { '00': pA0 * pB0, '01': pA0 * pB1, '10': pA1 * pB0, '11': pA1 * pB1 };
  Object.entries(joint).forEach(([ket, p]) => {
    const pct = p * 100;
    document.getElementById(`q2-fill-${ket}`).style.width = pct + '%';
    document.getElementById(`q2-pct-${ket}`).textContent  = Math.round(pct) + '%';
  });
}

function setMainState(theta, phi) {
  qubitMain.setState(theta, phi);
  document.getElementById('sl-theta').value = Math.round(theta * 1000);
  document.getElementById('sl-phi').value   = Math.round(phi   * 1000);
  updateQubitUI();
}

function sliderUpdate() {
  const theta = parseInt(document.getElementById('sl-theta').value) / 1000;
  const phi   = parseInt(document.getElementById('sl-phi').value)   / 1000;
  document.getElementById('val-theta').textContent = Math.round(theta * 180 / Math.PI) + '°';
  document.getElementById('val-phi').textContent   = Math.round(phi   * 180 / Math.PI) + '°';
  qubitMain.setState(theta, phi);
  updateQubitUI();
}

function updateQubitUI() {
  const b  = qubitMain.getBloch();
  const p0 = qubitMain.prob0() * 100;
  const p1 = qubitMain.prob1() * 100;

  rendererMain.animateTo(b.x, b.y, b.z, qubitMain.getLabel());
  document.getElementById('bloch-main').setAttribute('aria-label',
    `Bloch sphere. State: ${qubitMain.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`);
  document.getElementById('label-main').textContent   = qubitMain.getLabel();
  document.getElementById('formula-main').textContent = qubitMain.getFormula();
  document.getElementById('fill0-main').style.width   = p0 + '%';
  document.getElementById('fill1-main').style.width   = p1 + '%';
  document.getElementById('pct0-main').textContent    = Math.round(p0) + '%';
  document.getElementById('pct1-main').textContent    = Math.round(p1) + '%';
  document.getElementById('val-theta').textContent    = Math.round(b.theta * 180 / Math.PI) + '°';
  document.getElementById('val-phi').textContent      = Math.round(b.phi   * 180 / Math.PI) + '°';
  highlightMatchingPreset(document.querySelectorAll('#qubit-1q-panel .preset-btn'), b.theta, b.phi);
}
