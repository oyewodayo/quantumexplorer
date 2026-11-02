'use strict';
// Depends on: app.js state (qubitNoise, rendererNoise), core/qubit.js
// (Qubit, blochVectorLabel), core/complex.js (C.fmt), core/dom-utils.js
// (setExplainer), core/tab-registry.js (registerTab). Registers onEnter/
// onLeave hooks that start/pause the rAF loop, same pattern as
// tunneling-tab.js.
//
// PHYSICS: the standard phenomenological T1/T2 (Bloch-Redfield) decay
// law — the same equations behind real NMR/ESR and superconducting-
// qubit coherence-time measurements, not a made-up animation curve:
//   x(t) = x0 e^(-t/T2eff),  y(t) = y0 e^(-t/T2eff),
//   z(t) = 1 + (z0 - 1) e^(-t/T1)
// z relaxes toward +1 (the |0⟩ ground state) — the standard "cold bath"
// convention. T2eff = min(T2, 2·T1): a real physical constraint
// (dephasing can never be slower than what energy relaxation alone
// implies), enforced here rather than just asserted in the copy. A
// shrinking Bloch vector is already this app's own convention for "mixed
// state" (see two-qubit.js/three-qubit.js's getSingleQubitBloch() for
// entangled qubits) — decoherence needed no new state representation,
// just this one new time-evolution law layered on top of it.

let noiseX0 = 0, noiseY0 = 1, noiseZ0 = 0; // initial Bloch vector, refreshed by noiseRestart()
let noiseT1 = 80, noiseT2 = 60;            // microseconds
let noiseElapsed = 0;                      // simulated microseconds since last restart
let noisePlaying = true;
let noiseSettled = false;
let noiseAnimId = null;
let noiseLastFrameTime = null;
const NOISE_US_PER_SEC = 40; // simulated-μs per real second — tuned so a ~80μs T1 visibly settles in a handful of seconds

function noiseT2Eff() { return Math.min(noiseT2, 2 * noiseT1); }

function noiseCompute(t) {
  const decayXY = Math.exp(-t / noiseT2Eff());
  const decayZ  = Math.exp(-t / noiseT1);
  return {
    x: noiseX0 * decayXY,
    y: noiseY0 * decayXY,
    z: 1 + (noiseZ0 - 1) * decayZ
  };
}

function setNoiseInitialState(theta, phi) {
  qubitNoise.setState(theta, phi);
  document.getElementById('sl-noise-theta').value = Math.round(theta * 1000);
  document.getElementById('sl-noise-phi').value   = Math.round(phi   * 1000);
  document.getElementById('val-noise-theta').textContent = Math.round(theta * 180 / Math.PI) + '°';
  document.getElementById('val-noise-phi').textContent   = Math.round(phi   * 180 / Math.PI) + '°';
  highlightMatchingPreset(document.querySelectorAll('[data-noise-preset]'), theta, phi);
  noiseRestart();
}

function noiseThetaPhiSliderUpdate() {
  const theta = parseInt(document.getElementById('sl-noise-theta').value, 10) / 1000;
  const phi   = parseInt(document.getElementById('sl-noise-phi').value, 10)   / 1000;
  setNoiseInitialState(theta, phi);
}

function noiseT1SliderUpdate() {
  noiseT1 = parseInt(document.getElementById('sl-noise-t1').value, 10);
  document.getElementById('val-noise-t1').textContent = noiseT1 + ' μs';
  noiseUpdateCapNote();
  noiseRestart();
}

function noiseT2SliderUpdate() {
  noiseT2 = parseInt(document.getElementById('sl-noise-t2').value, 10);
  document.getElementById('val-noise-t2').textContent = noiseT2 + ' μs';
  noiseUpdateCapNote();
  noiseRestart();
}

function noiseUpdateCapNote() {
  const eff = noiseT2Eff();
  const note = document.getElementById('noise-t2-cap-note');
  note.textContent = eff < noiseT2
    ? t('noise.t2CapNote', 'T₂ capped to {eff} μs (2×T₁) — dephasing can\'t outrun relaxation.').replace('{eff}', eff)
    : '';
}

function noiseUpdatePlayButton() {
  const btn = document.getElementById('noise-play-btn');
  btn.textContent = noisePlaying ? t('noise.pauseBtn', '⏸ Pause') : t('noise.playBtn', '▶ Play');
}

function noiseRender() {
  const { x, y, z } = noiseCompute(noiseElapsed);
  const r = Math.hypot(x, y, z);
  const purity = (1 + r * r) / 2;
  const label = blochVectorLabel(x, y, z);

  rendererNoise.draw(x, y, z, label);
  document.getElementById('bloch-noise').setAttribute('aria-label',
    `Bloch sphere for a decohering qubit. Elapsed ${noiseElapsed.toFixed(1)} microseconds, vector length ${r.toFixed(2)}, label ${label}.`);
  document.getElementById('label-noise').textContent = label;
  document.getElementById('noise-state-desc').textContent = label;
  document.getElementById('noise-elapsed-val').textContent = noiseElapsed.toFixed(1) + ' μs';
  document.getElementById('noise-r-val').textContent = r.toFixed(2);
  document.getElementById('noise-purity-val').textContent = Math.round(purity * 100) + '%';
  document.getElementById('noise-purity-fill').style.width = (purity * 100) + '%';

  // rho = (I + x*sigma_x + y*sigma_y + z*sigma_z) / 2
  document.getElementById('noise-rho-00').textContent = C.fmt({ r: (1 + z) / 2, i: 0 });
  document.getElementById('noise-rho-01').textContent = C.fmt({ r: x / 2, i: -y / 2 });
  document.getElementById('noise-rho-10').textContent = C.fmt({ r: x / 2, i: y / 2 });
  document.getElementById('noise-rho-11').textContent = C.fmt({ r: (1 - z) / 2, i: 0 });
}

function noiseAnimate(now) {
  if (noiseLastFrameTime === null) noiseLastFrameTime = now;
  const dtReal = (now - noiseLastFrameTime) / 1000;
  noiseLastFrameTime = now;

  if (noisePlaying && !noiseSettled) {
    noiseElapsed += dtReal * NOISE_US_PER_SEC;
    const horizon = 5 * Math.max(noiseT1, noiseT2Eff());
    if (noiseElapsed >= horizon) {
      noiseElapsed = horizon;
      noiseSettled = true;
      setExplainer('noise-explainer', t('noise.explainerSettled', "Settled at |0⟩ — and purity has actually climbed back near 100%, not bottomed out. That's not a rescue: T1 relaxation pulls a qubit toward its ground state, so given enough time it always ends up pure again, just pure and uninformative. A qubit sitting at |0⟩ looks identical whether it started as |+⟩, |−⟩, or anything else — the phase information T2 erased along the way never comes back, purity or no purity."));
    }
  }

  noiseRender();
  noiseAnimId = requestAnimationFrame(noiseAnimate);
}

function noiseRestart() {
  const b = qubitNoise.getBloch();
  noiseX0 = b.x; noiseY0 = b.y; noiseZ0 = b.z;
  noiseElapsed = 0;
  noiseSettled = false;
  noisePlaying = true;
  noiseUpdatePlayButton();
  setExplainer('noise-explainer', t('noise.explainerDefault', 'Watch the Bloch vector shrink and drift toward the north pole — that shrinkage is real information loss, not just a visual effect. A shorter vector means the qubit\'s state is genuinely less certain, exactly the same "mixed state" idea already used for entangled qubits elsewhere in this app.'));
  noiseRender();
}

function noiseTogglePlay() {
  noisePlaying = !noisePlaying;
  noiseUpdatePlayButton();
}

function ensureNoiseStarted() {
  if (!noiseAnimId) {
    noiseLastFrameTime = null;
    noiseAnimId = requestAnimationFrame(noiseAnimate);
  }
}

function stopNoiseSim() {
  if (noiseAnimId) {
    cancelAnimationFrame(noiseAnimId);
    noiseAnimId = null;
  }
}

function initNoiseTab() {
  document.getElementById('sl-noise-theta').addEventListener('input', noiseThetaPhiSliderUpdate);
  document.getElementById('sl-noise-phi').addEventListener('input', noiseThetaPhiSliderUpdate);
  document.querySelectorAll('[data-noise-preset]').forEach(btn => {
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => setNoiseInitialState(theta, phi));
  });
  document.getElementById('sl-noise-t1').addEventListener('input', noiseT1SliderUpdate);
  document.getElementById('sl-noise-t2').addEventListener('input', noiseT2SliderUpdate);
  document.getElementById('noise-play-btn').addEventListener('click', noiseTogglePlay);
  document.getElementById('btn-noise-restart').addEventListener('click', noiseRestart);

  qubitNoise.setState(Math.PI / 2, 0); // |+⟩ — shows both T1 (z moves) and T2 (x/y shrink) at once
  noiseUpdateCapNote();
  noiseRestart();
  registerTab('noise', { onEnter: ensureNoiseStarted, onLeave: stopNoiseSim });
}
