'use strict';
// Depends on: core/two-qubit.js (TwoQubitState, including measureQubit()
// — added specifically for this tab, mirroring three-qubit.js's own
// addition for Teleport), core/gates.js (GATES), core/utils.js (delay()),
// core/dom-utils.js (setExplainer), core/tab-registry.js (registerTab).
//
// PROTOCOL (verified computationally for all 4 messages, exact 0/1
// probabilities, before this UI was built — see the standalone script's
// output: every message decodes to itself with certainty):
//   1. H(q0); CNOT(q0→q1) — the same Bell-pair creation Teleport uses.
//   2. Alice encodes her 2-bit message (b0,b1) onto q0 alone: X if b1=1,
//      then Z if b0=1. The four (b0,b1) choices land the pair on the
//      four Bell states Φ+/Ψ+/Φ-/Ψ- respectively — mutually orthogonal,
//      which is exactly what makes them perfectly distinguishable later.
//   3. Alice physically sends q0 to Bob — the one step with no classical
//      substitute; a real qubit has to travel for this protocol to work.
//   4. Bob, now holding both qubits, runs CNOT(q0→q1) then H(q0) — the
//      same Bell-basis circuit Teleport's Alice used on her side, just
//      run by the receiver here instead of the sender — then measures
//      both qubits (TwoQubitState.measureQubit()) to read (b0,b1) back
//      exactly. Because the state landed on one of 4 mutually orthogonal
//      basis states, that "measurement" has probability 1 at a single
//      outcome — a real Born-rule draw, just over a distribution with no
//      actual uncertainty left in it.

let superdenseMsg = '00';
let superdenseAnimating = false;
let superdenseSentCount = 0;
let superdenseMatchCount = 0;
const SUPERDENSE_STEP_MS = 700;

/** Toggles which encode gates are shown live, the moment a message is
 *  picked — unlike Teleport's correction gates (which can't be known
 *  until after a random measurement), superdense coding's encoding is
 *  chosen up front, so the preview doesn't need to wait for Send. */
function setSuperdenseMessage(msg) {
  superdenseMsg = msg;
  const b0 = msg[0], b1 = msg[1];
  document.querySelectorAll('[data-superdense-msg]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.superdenseMsg === msg));
  document.getElementById('superdense-gate-x').classList.toggle('circuit-gate-off', b1 !== '1');
  document.getElementById('superdense-gate-z').classList.toggle('circuit-gate-off', b0 !== '1');
  document.getElementById('superdense-sent-val').textContent = msg;
  document.getElementById('superdense-received-val').textContent = '?';
  document.getElementById('superdense-received-val').classList.remove('set');
}

function pulseStage(id) {
  const el = document.getElementById(id);
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 700);
}

function updateSuperdenseTally() {
  document.getElementById('superdense-tally-text').textContent = superdenseSentCount
    ? t('superdense.tally', '{sent} sent · {match}/{sent} decoded correctly')
        .replace('{sent}', superdenseSentCount).replace('{match}', superdenseMatchCount).replace('{sent}', superdenseSentCount)
    : '';
}

async function sendSuperdense() {
  if (superdenseAnimating) return;
  superdenseAnimating = true;
  document.getElementById('btn-superdense-send').disabled = true;
  document.getElementById('superdense-result').textContent = t('superdense.resultRunning', 'running…');
  document.getElementById('superdense-received-val').textContent = '?';
  document.getElementById('superdense-received-val').classList.remove('set');

  const b0 = superdenseMsg[0] === '1' ? 1 : 0;
  const b1 = superdenseMsg[1] === '1' ? 1 : 0;

  pulseStage('superdense-stage-pair');
  setExplainer('superdense-explainer', t('superdense.stepPair', 'Alice and Bob share an entangled pair, prepared in advance.'));
  await delay(SUPERDENSE_STEP_MS);
  const state = new TwoQubitState();
  state.applySingleQubitGate(0, GATES.H.matrix);
  state.applyCNOT(0, 1);

  setExplainer('superdense-explainer', t('superdense.stepEncode', 'Alice encodes her message onto her own qubit alone — Bob\'s half of the pair is never touched.'));
  await delay(SUPERDENSE_STEP_MS);
  if (b1 === 1) state.applySingleQubitGate(0, GATES.X.matrix);
  if (b0 === 1) state.applySingleQubitGate(0, GATES.Z.matrix);

  document.getElementById('superdense-channel').classList.add('sending');
  setExplainer('superdense-explainer', t('superdense.stepSend', 'Alice physically sends that one qubit to Bob over a real quantum channel — the one step with no classical substitute.'));
  await delay(SUPERDENSE_STEP_MS);
  document.getElementById('superdense-channel').classList.remove('sending');

  pulseStage('superdense-stage-decode');
  setExplainer('superdense-explainer', t('superdense.stepDecode', 'Bob, now holding both qubits, runs the same Bell-basis circuit Teleport\'s Alice used — a CNOT then a Hadamard — to tell the four possible messages apart.'));
  await delay(SUPERDENSE_STEP_MS);
  state.applyCNOT(0, 1);
  state.applySingleQubitGate(0, GATES.H.matrix);

  pulseStage('superdense-stage-measure');
  setExplainer('superdense-explainer', t('superdense.stepMeasure', 'Bob measures both qubits and reads off Alice\'s exact two bits.'));
  await delay(SUPERDENSE_STEP_MS);
  const d0 = state.measureQubit(0);
  const d1 = state.measureQubit(1);
  const received = `${d0}${d1}`;
  const match = received === superdenseMsg;

  document.getElementById('superdense-received-val').textContent = received;
  document.getElementById('superdense-received-val').classList.add('set');
  superdenseSentCount++;
  if (match) superdenseMatchCount++;
  updateSuperdenseTally();

  document.getElementById('superdense-result').textContent = match
    ? t('superdense.resultMatch', 'Decoded exactly right')
    : t('superdense.resultMismatch', 'Mismatch — check the console, this should never happen');
  setExplainer('superdense-explainer', t('superdense.stepDone', 'Bob decoded {received} — exactly what Alice sent, {sent}. Nothing here was random: the four possible messages land on four mutually orthogonal states, so Bob\'s measurement has zero uncertainty left in it once the qubit arrives.')
    .replace('{received}', received).replace('{sent}', superdenseMsg));

  superdenseAnimating = false;
  document.getElementById('btn-superdense-send').disabled = false;
}

function resetSuperdense() {
  superdenseSentCount = 0;
  superdenseMatchCount = 0;
  updateSuperdenseTally();
  document.getElementById('superdense-received-val').textContent = '?';
  document.getElementById('superdense-received-val').classList.remove('set');
  document.getElementById('superdense-result').textContent = '—';
  setExplainer('superdense-explainer', t('superdense.explainerDefault', "Pick a 2-bit message above, then press Send. Watch Alice encode it onto her own qubit alone, physically hand that one qubit to Bob, and Bob decode both bits back out exactly — nothing here is random."));
}

function initSuperdenseTab() {
  document.querySelectorAll('[data-superdense-msg]').forEach(btn =>
    btn.addEventListener('click', () => setSuperdenseMessage(btn.dataset.superdenseMsg)));
  document.getElementById('btn-superdense-send').addEventListener('click', sendSuperdense);
  document.getElementById('btn-reset-superdense').addEventListener('click', resetSuperdense);

  setSuperdenseMessage('00');
  updateSuperdenseTally();
  registerTab('superdense', {});
}
