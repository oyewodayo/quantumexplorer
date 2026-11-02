'use strict';
// Depends on: app.js state (qubitTeleportMsg, rendererTeleportAlice,
// rendererTeleportBob), core/three-qubit.js (ThreeQubitState, including
// measureQubit() — added specifically for this tab), core/gates.js
// (GATES), core/qubit.js (Qubit, blochVectorLabel), core/utils.js
// (delay()), core/dom-utils.js (setExplainer), core/tab-registry.js
// (registerTab), qubit-tab.js (highlightMatchingPreset — a plain global,
// reused as-is).
//
// PROTOCOL (verified against 500+ random states + all 4 measurement
// branches with a standalone script before this UI was built — see the
// derivation below for why the correction is m0→Z, m1→X, applied
// Z-then-X):
//   1. Alice's message qubit (q0) is set directly from qubitTeleportMsg's
//      amplitudes; q1 (Alice's half of the pair) and q2 (Bob's half)
//      start at |0⟩.
//   2. H(q1); CNOT(q1→q2) — entangles q1/q2 into a Bell pair, in advance,
//      before any message exists. Tracing out q0 and q1, q2's reduced
//      Bloch vector is now (0,0,0): maximally mixed, genuinely carrying
//      zero information on its own.
//   3. CNOT(q0→q1); H(q0) — puts q0 and q1 into the Bell basis. Expanding
//      the state out by hand (see the comment in fireTeleport() below)
//      shows q2's four possible reduced states, one per (m0,m1) outcome,
//      are exactly I/X/Z/ZX applied to the original message — q2 is
//      still fully mixed from Bob's point of view, but the correlation
//      to fix it is now sitting in q0/q1, waiting to be read out.
//   4. Measure q0→m0, q1→m1 (ThreeQubitState.measureQubit(), a real
//      Born-rule collapse). q2 collapses too, to a definite but
//      (usually) wrong state — Bob's reduced Bloch vector jumps from the
//      origin to the sphere's surface, just not at ψ yet.
//   5. Alice sends m0,m1 to Bob classically. Bob applies Z if m0=1, then
//      X if m1=1 (in that order — the m0=m1=1 branch works out to ZX·ψ,
//      not XZ·ψ, up to an unobservable global phase either way, but only
//      Z-then-X reproduces ψ exactly with no stray phase). q2 now equals
//      the original message exactly.

let teleportAnimating = false;
let teleportCounts = { '00': 0, '01': 0, '10': 0, '11': 0 };
const TELEPORT_STEP_MS = 750;

function setTeleportAliceState(theta, phi) {
  qubitTeleportMsg.setState(theta, phi);
  document.getElementById('sl-teleport-theta').value = Math.round(theta * 1000);
  document.getElementById('sl-teleport-phi').value   = Math.round(phi   * 1000);
  updateTeleportAliceUI();
}

function teleportSliderUpdate() {
  const theta = parseInt(document.getElementById('sl-teleport-theta').value, 10) / 1000;
  const phi   = parseInt(document.getElementById('sl-teleport-phi').value, 10)   / 1000;
  qubitTeleportMsg.setState(theta, phi);
  updateTeleportAliceUI();
}

function updateTeleportAliceUI() {
  const b = qubitTeleportMsg.getBloch();
  rendererTeleportAlice.animateTo(b.x, b.y, b.z, qubitTeleportMsg.getLabel());
  document.getElementById('bloch-teleport-alice').setAttribute('aria-label',
    `Bloch sphere for Alice's message qubit. State: ${qubitTeleportMsg.getFormula()}. Draggable, or focus and use arrow keys, to set its state.`);
  document.getElementById('label-teleport-alice').textContent   = qubitTeleportMsg.getLabel();
  document.getElementById('formula-teleport-alice').textContent = qubitTeleportMsg.getFormula();
  document.getElementById('val-teleport-theta').textContent = Math.round(b.theta * 180 / Math.PI) + '°';
  document.getElementById('val-teleport-phi').textContent   = Math.round(b.phi   * 180 / Math.PI) + '°';
  highlightMatchingPreset(document.querySelectorAll('[data-teleport-preset]'), b.theta, b.phi);
}

/** Draws Bob's sphere from a raw (x,y,z) — a length near 0 (the origin)
 *  means "genuinely undetermined right now", not just "|0⟩", so it's
 *  labeled and captioned as such rather than reusing Qubit's own
 *  labeling (which assumes a unit-length vector). Anything else is
 *  reconstructed into a temporary Qubit via its θ/φ so the formula line
 *  reads exactly like Alice's, for a direct side-by-side comparison. */
function updateTeleportBobSphere(bloch, animate) {
  const r = Math.hypot(bloch.x, bloch.y, bloch.z);
  let label, formula;
  if (r < 0.05) {
    label = '?';
    formula = t('teleport.bobFormulaUndetermined', '|ψ⟩ = ?');
  } else {
    const theta = Math.acos(Math.max(-1, Math.min(1, bloch.z / r)));
    const phi = ((Math.atan2(bloch.y, bloch.x) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const tmp = new Qubit();
    tmp.setState(theta, phi);
    label = tmp.getLabel();
    formula = tmp.getFormula();
  }
  if (animate) rendererTeleportBob.animateTo(bloch.x, bloch.y, bloch.z, label);
  else rendererTeleportBob.draw(bloch.x, bloch.y, bloch.z, label);
  document.getElementById('label-teleport-bob').textContent = label;
  document.getElementById('formula-teleport-bob').textContent = formula;
}

/** One-shot spotlight on a protocol stage — .active plays a single 0.7s
 *  glow (see .teleport-stage.active in teleport.css), then gets removed
 *  so the next run can retrigger it; unlike Bell States' circuit, this
 *  diagram is illustrating one event playing out, not an always-flowing
 *  recipe. */
function pulseStage(id) {
  const el = document.getElementById(id);
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 700);
}

function updateTeleportHistogram() {
  const total = Object.values(teleportCounts).reduce((a, b) => a + b, 0);
  ['00', '01', '10', '11'].forEach(k => {
    const pct = total ? (teleportCounts[k] / total) * 100 : 0;
    document.getElementById(`teleport-hist-${k}`).style.height = pct + '%';
    document.getElementById(`teleport-pct-${k}`).textContent = total ? Math.round(pct) + '%' : '—';
  });
  document.getElementById('teleport-trial-count').textContent = total
    ? t('teleport.trialCount', '· {count} runs').replace('{count}', total) : '';
}

async function fireTeleport() {
  if (teleportAnimating) return;
  teleportAnimating = true;
  document.getElementById('btn-teleport').disabled = true;
  document.getElementById('teleport-result').textContent = t('teleport.resultRunning', 'running…');

  document.getElementById('teleport-m0').textContent = '?';
  document.getElementById('teleport-m1').textContent = '?';
  document.getElementById('teleport-m0').classList.remove('set');
  document.getElementById('teleport-m1').classList.remove('set');
  document.getElementById('teleport-gate-z').classList.add('circuit-gate-off');
  document.getElementById('teleport-gate-x').classList.add('circuit-gate-off');
  document.getElementById('teleport-bob-desc').textContent = t('teleport.bobDescEntangled', 'Entangled with Alice — undetermined on its own');

  const state = new ThreeQubitState();
  state.amps[0] = { ...qubitTeleportMsg.alpha }; // |000>
  state.amps[4] = { ...qubitTeleportMsg.beta };  // |100>

  // Stage 1 — create the entangled pair
  pulseStage('teleport-stage-pair');
  setExplainer('teleport-explainer', t('teleport.stepPair', 'Alice and Bob share an entangled pair, prepared before any message existed.'));
  await delay(TELEPORT_STEP_MS);
  state.applySingleQubitGate(1, GATES.H.matrix);
  state.applyCNOT(1, 2);
  updateTeleportBobSphere(state.getSingleQubitBloch(2), true);

  // Stage 2 — Alice puts her message qubit into the Bell basis with her
  // half of the pair
  pulseStage('teleport-stage-bellmeas');
  setExplainer('teleport-explainer', t('teleport.stepBell', "Alice entangles her message qubit with her half of the pair — this reads ψ out against the entanglement, it doesn't copy it."));
  await delay(TELEPORT_STEP_MS);
  state.applyCNOT(0, 1);
  state.applySingleQubitGate(0, GATES.H.matrix);
  updateTeleportBobSphere(state.getSingleQubitBloch(2), true); // still the origin — no news for Bob yet

  // Stage 3 — measure both of Alice's qubits
  pulseStage('teleport-stage-measure');
  setExplainer('teleport-explainer', t('teleport.stepMeasure', "Alice measures both her qubits, collapsing them to two genuinely random classical bits — and collapsing Bob's qubit to a definite state in the same instant."));
  await delay(TELEPORT_STEP_MS);
  const m0 = state.measureQubit(0);
  const m1 = state.measureQubit(1);
  document.getElementById('teleport-m0').textContent = m0;
  document.getElementById('teleport-m1').textContent = m1;
  document.getElementById('teleport-m0').classList.add('set');
  document.getElementById('teleport-m1').classList.add('set');
  document.getElementById('teleport-bob-desc').textContent = t('teleport.bobDescWrong', "Definite now, but not yet ψ — waiting on Alice's bits");
  updateTeleportBobSphere(state.getSingleQubitBloch(2), true);

  // Stage 4 — send the classical bits, then Bob corrects
  document.getElementById('teleport-cwire-0').classList.add('sending');
  document.getElementById('teleport-cwire-1').classList.add('sending');
  setExplainer('teleport-explainer', t('teleport.stepSend', "Alice sends her two classical bits to Bob — an ordinary channel, no faster than light. He conditionally applies Z and/or X to fix his qubit up."));
  await delay(TELEPORT_STEP_MS);
  document.getElementById('teleport-cwire-0').classList.remove('sending');
  document.getElementById('teleport-cwire-1').classList.remove('sending');
  document.getElementById('teleport-gate-z').classList.toggle('circuit-gate-off', m0 !== 1);
  document.getElementById('teleport-gate-x').classList.toggle('circuit-gate-off', m1 !== 1);
  if (m0 === 1) state.applySingleQubitGate(2, GATES.Z.matrix);
  if (m1 === 1) state.applySingleQubitGate(2, GATES.X.matrix);
  document.getElementById('teleport-bob-desc').textContent = t('teleport.bobDescMatch', "Matches Alice's message exactly");
  updateTeleportBobSphere(state.getSingleQubitBloch(2), true);

  const key = `${m0}${m1}`;
  teleportCounts[key]++;
  updateTeleportHistogram();
  document.getElementById('teleport-result').textContent = t('teleport.resultDone', 'Teleportation complete');
  setExplainer('teleport-explainer',
    t('teleport.stepDone', "Bob's qubit now equals Alice's original message exactly — teleported, not cloned: her own qubit was destroyed by measurement back in step 2, so the no-cloning theorem stays intact. Alice never learned ψ either; she just relayed two random bits, m₀={m0}, m₁={m1}, that happened to be exactly what Bob needed.")
      .replace('{m0}', m0).replace('{m1}', m1));

  teleportAnimating = false;
  document.getElementById('btn-teleport').disabled = false;
}

function resetTeleport() {
  teleportCounts = { '00': 0, '01': 0, '10': 0, '11': 0 };
  updateTeleportHistogram();
  document.getElementById('teleport-m0').textContent = '?';
  document.getElementById('teleport-m1').textContent = '?';
  document.getElementById('teleport-m0').classList.remove('set');
  document.getElementById('teleport-m1').classList.remove('set');
  document.getElementById('teleport-gate-z').classList.add('circuit-gate-off');
  document.getElementById('teleport-gate-x').classList.add('circuit-gate-off');
  document.getElementById('teleport-result').textContent = '—';
  document.getElementById('teleport-bob-desc').textContent = t('teleport.bobDescWaiting', 'Not entangled yet — press Teleport');
  updateTeleportBobSphere({ x: 0, y: 0, z: 0 }, false);
  setExplainer('teleport-explainer', t('teleport.explainerDefault', "Set Alice's message state above, then press Teleport. Watch Bob's sphere: it starts undetermined, jumps to some definite but wrong point the instant Alice measures, then snaps to match Alice's exactly once her classical bits arrive and Bob corrects for them."));
}

function initTeleportTab() {
  document.getElementById('sl-teleport-theta').addEventListener('input', teleportSliderUpdate);
  document.getElementById('sl-teleport-phi').addEventListener('input', teleportSliderUpdate);
  document.querySelectorAll('[data-teleport-preset]').forEach(btn => {
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => setTeleportAliceState(theta, phi));
  });
  document.getElementById('btn-teleport').addEventListener('click', fireTeleport);
  document.getElementById('btn-reset-teleport').addEventListener('click', resetTeleport);

  updateTeleportAliceUI();
  updateTeleportBobSphere({ x: 0, y: 0, z: 0 }, false);
  updateTeleportHistogram();
  registerTab('teleport', {});
}
