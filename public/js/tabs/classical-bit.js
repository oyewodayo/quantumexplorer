'use strict';
// Depends on: app.js state (classicalBit).
// initClassicalBit() is called from app.js's DOMContentLoaded handler.

// ═══════════════════════════════════════════════════════════════════
// CLASSICAL BIT
// ═══════════════════════════════════════════════════════════════════
function initClassicalBit() {
  const toggle = document.getElementById('bit-toggle');
  toggle.addEventListener('change', () => {
    classicalBit = toggle.checked ? 1 : 0;
    updateClassicalUI();
  });

  document.getElementById('btn-classical-tryme').addEventListener('click', runClassicalTryMe);
}

const CLASSICAL_TRYME_FLIPS = 5;
const CLASSICAL_TRYME_INTERVAL_MS = 2600; // bumped from 1400 alongside the detailed per-step explanation below — needs real reading time, not just a glance at the flip

/** Auto-flips the bit back and forth CLASSICAL_TRYME_FLIPS times, then
 *  stops on its own — a passive demo of "always 0 or 1, never both"
 *  rather than something the learner has to keep clicking. Built on the
 *  shared runTryMeSequence() driver (qubit-tab.js — plain <script> tags
 *  share one global scope, and it's only ever called from inside a click
 *  handler, long after every script has loaded, so load order doesn't
 *  matter) rather than its own interval bookkeeping, so it gets the same
 *  disabled-button re-entrancy guard plus a step explainer + history
 *  trail for free, matching the One/Two Qubit Try Me runs. */
function runClassicalTryMe() {
  const toggle = document.getElementById('bit-toggle');
  const states = [];
  let bit = classicalBit;
  for (let i = 0; i < CLASSICAL_TRYME_FLIPS; i++) {
    bit = bit === 0 ? 1 : 0;
    states.push(bit);
  }

  runTryMeSequence({
    button: document.getElementById('btn-classical-tryme'),
    disableEls: [toggle],
    states,
    intervalMs: CLASSICAL_TRYME_INTERVAL_MS,
    applyState: bitVal => {
      classicalBit = bitVal;
      toggle.checked = classicalBit === 1;
      updateClassicalUI();
    },
    describeStep: (bitVal, i) => ({
      explain: `Step ${i + 1}: the bit is now <strong>${bitVal}</strong>. A classical bit is a real physical switch — a transistor either ` +
        `conducting or not, a magnetic domain pointing one way or the other — so it always holds one definite value at every instant. ` +
        `There's no "47% chance it's 1" reading for a classical bit the way there is for a qubit's superposition; it's cleanly ` +
        `${bitVal} — full stop — until something flips it again.`,
      historyLabel: String(bitVal),
      historyColor: bitVal === 0 ? 'var(--zero)' : 'var(--one)'
    }),
    explainerId: 'classical-tryme-explainer',
    historyId: 'classical-tryme-history'
  });
}

function updateClassicalUI() {
  const display = document.getElementById('classical-display');
  display.textContent = classicalBit;

  // Dim when 0, full brightness when 1 — visual metaphor for off/on
  display.classList.toggle('is-zero', classicalBit === 0);

  // Side labels: highlight the active side
  document.getElementById('lbl-zero').classList.toggle('active', classicalBit === 0);
  document.getElementById('lbl-one').classList.toggle('active',  classicalBit === 1);
}
