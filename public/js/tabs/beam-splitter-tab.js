'use strict';
// Depends on: core/tab-registry.js (registerTab), core/dom-utils.js
// (pulseElement, used for the detector click ring). A single photon is
// fired at a 50/50 beam splitter and randomly reflected to detector A or
// transmitted to detector B — one photon, one random click, never a
// photon split in half. A faint "ghost" duplicate briefly travels the
// path NOT taken and fades out at the same time, visualizing the
// superposition that existed right up until the real photon landed. No
// qubit/Bloch state involved (see qubit.js) — this tab is a plain
// classical-probability animation, so it keeps its own small bit of
// local state instead.

let bsCountA = 0, bsCountB = 0, bsAnimating = false;

const BS_SOURCE = { x: 115, y: 280 };
const BS_SPLIT  = { x: 380, y: 280 };
const BS_DET_A  = { x: 380, y: 82  };
const BS_DET_B  = { x: 587, y: 280 };
const BS_MARK_MAX = 140; // caps SVG node count on the accumulation plates; oldest mark is dropped past this

/** Sum of three uniforms, centered on 0 and clamped to ±spread — same
 *  cheap stand-in for a normal distribution used by Stern-Gerlach's
 *  sgJitter(), so accumulated marks cluster toward the detector center
 *  and thin out toward the edges rather than landing uniformly. */
function bsJitter(spread) {
  return ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 2 * spread;
}

/** Appends one small dot to detector A or B's accumulation plate at a
 *  jittered position — visualizes the 50/50 split building up over many
 *  photons, the same "photographic plate" upgrade Stern-Gerlach's
 *  detectors got, rather than only ever showing the latest hit via the
 *  click flash. Oldest mark is dropped past BS_MARK_MAX so the SVG
 *  doesn't grow unbounded over a long session. */
function bsAddScreenMark(isA) {
  const group  = document.getElementById(isA ? 'bs-marks-a' : 'bs-marks-b');
  const center = isA ? BS_DET_A : BS_DET_B;
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('class', 'bs-mark');
  circle.setAttribute('cx', center.x + bsJitter(24));
  circle.setAttribute('cy', center.y + bsJitter(18));
  circle.setAttribute('r', 1.5 + Math.random() * 1.2);
  circle.setAttribute('fill', isA ? 'var(--zero)' : 'var(--one)');
  circle.setAttribute('opacity', 0.4 + Math.random() * 0.25);
  group.appendChild(circle);
  if (group.childElementCount > BS_MARK_MAX) group.removeChild(group.firstElementChild);
}

/** Wipes both accumulation plates — called alongside the tally reset,
 *  since a plate mixing marks from before and after a Reset would be
 *  exactly as misleading as a tally that didn't reset. */
function bsClearScreenMarks() {
  document.getElementById('bs-marks-a').replaceChildren();
  document.getElementById('bs-marks-b').replaceChildren();
}

function initBeamSplitterTab() {
  document.getElementById('btn-fire-photon').addEventListener('click', fireBeamSplitterPhoton);
  document.getElementById('btn-reset-beamsplitter').addEventListener('click', resetBeamSplitter);

  // No onLeave needed — a fire-and-forget animation this short (900ms)
  // isn't worth canceling on tab switch; onEnter just clears any photon
  // left mid-flight from a switch-away, so revisiting the tab never shows
  // it frozen partway down a path.
  registerTab('beamsplitter', { onEnter: resetBeamSplitterPhoton });
}

function resetBeamSplitterPhoton() {
  document.getElementById('bs-photon').setAttribute('opacity', 0);
  document.getElementById('bs-photon-ghost').setAttribute('opacity', 0);
  bsAnimating = false;
  document.getElementById('btn-fire-photon').disabled = false;
}

function bsLerp(a, b, t) { return a + (b - a) * t; }

/** Moves `el` (a <g>, translated as a group rather than repositioning
 *  individual circles via cx/cy — that's what lets one call move both
 *  the glow halo and bright core together) from (x0,y0) to (x1,y1) over
 *  `duration` ms, interpolating opacity from op0 to op1 at the same
 *  time. Reused for both the real photon (opacity held at 1 throughout)
 *  and the fading ghost duplicate (opacity 1 → 0), so there's one
 *  animation code path instead of two. */
function bsAnimateMove(el, x0, y0, x1, y1, op0, op1, duration, cb) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    el.setAttribute('transform', `translate(${bsLerp(x0, x1, t)},${bsLerp(y0, y1, t)})`);
    el.setAttribute('opacity', bsLerp(op0, op1, t));
    if (t < 1) requestAnimationFrame(step);
    else cb();
  }
  requestAnimationFrame(step);
}

function fireBeamSplitterPhoton() {
  if (bsAnimating) return;
  bsAnimating = true;
  document.getElementById('btn-fire-photon').disabled = true;
  document.getElementById('beamsplitter-result').textContent = 'traveling…';

  const photon = document.getElementById('bs-photon');
  const ghost  = document.getElementById('bs-photon-ghost');

  bsAnimateMove(photon, BS_SOURCE.x, BS_SOURCE.y, BS_SPLIT.x, BS_SPLIT.y, 1, 1, 450, () => {
    const isA       = Math.random() < 0.5;
    const winTarget  = isA ? BS_DET_A : BS_DET_B;
    const loseTarget = isA ? BS_DET_B : BS_DET_A;

    // The real photon continues on to whichever detector wins, while a
    // faint ghost simultaneously heads down the path NOT taken and fades
    // out over the same 450ms — both outcomes were possible right up
    // until this instant, and only one of them is actually happening.
    bsAnimateMove(ghost, BS_SPLIT.x, BS_SPLIT.y, loseTarget.x, loseTarget.y, 0.55, 0, 450, () => {
      ghost.setAttribute('opacity', 0);
    });

    bsAnimateMove(photon, BS_SPLIT.x, BS_SPLIT.y, winTarget.x, winTarget.y, 1, 1, 450, () => {
      photon.setAttribute('opacity', 0);
      const ping  = document.getElementById(isA ? 'bs-ping-a' : 'bs-ping-b');
      const flash = document.getElementById(isA ? 'bs-flashA' : 'bs-flashB');
      pulseElement(ping, 'active', 650);
      flash.setAttribute('opacity', 0.5);
      setTimeout(() => flash.setAttribute('opacity', 0), 400);
      bsAddScreenMark(isA);

      if (isA) bsCountA++; else bsCountB++;
      document.getElementById('beamsplitter-result').textContent = isA ? 'Detector A clicked' : 'Detector B clicked';
      setExplainer('beamsplitter-explainer', isA
        ? 'Detector A clicked — the photon reflected. Fire again and it could just as easily transmit through to B; each photon\'s path is decided fresh, not by any pattern in what came before.'
        : 'Detector B clicked — the photon transmitted straight through. Fire again and it could just as easily reflect to A; each photon\'s path is decided fresh, not by any pattern in what came before.');
      updateBeamSplitterHistogram();

      bsAnimating = false;
      document.getElementById('btn-fire-photon').disabled = false;
    });
  });
}

function updateBeamSplitterHistogram() {
  const total = bsCountA + bsCountB;
  const pA = total ? (bsCountA / total) * 100 : 0;
  const pB = total ? (bsCountB / total) * 100 : 0;
  document.getElementById('bs-hist-a').style.height = pA + '%';
  document.getElementById('bs-hist-b').style.height = pB + '%';
  document.getElementById('bs-pct-a').textContent = total ? Math.round(pA) + '%' : '—';
  document.getElementById('bs-pct-b').textContent = total ? Math.round(pB) + '%' : '—';
  document.getElementById('beamsplitter-trial-count').textContent = total ? `· ${total} photons` : '';
}

function resetBeamSplitter() {
  bsCountA = 0; bsCountB = 0;
  bsClearScreenMarks();
  updateBeamSplitterHistogram();
  document.getElementById('beamsplitter-result').textContent = '—';
  setExplainer('beamsplitter-explainer', 'A photon is about to launch toward the beam splitter. Fire it and watch which detector clicks.');
}
