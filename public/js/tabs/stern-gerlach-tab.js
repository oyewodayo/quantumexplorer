'use strict';
// Depends on: core/tab-registry.js (registerTab), core/dom-utils.js
// (pulseElement, setExplainer). One simulation, one magnet, drawn once —
// a "Number of magnets" toggle decides what feeds into it and how its
// outcome is decided, rather than adding a second magnet to the diagram:
//   1 magnet:  atoms come from the oven with an adjustable input angle θ
//              (the same Bloch-sphere θ used on the Bits & Qubits/State
//              Vector tabs); firing lands Up with probability cos²(θ/2)
//              and Down with sin²(θ/2), the same Born-rule split already
//              taught on the Measure tab, just with a physical stand-in
//              (a silver atom's spin) for "the qubit". #sg-intake-group
//              (oven + slits) is shown, #sg-prepared-group is hidden.
//   2 magnets: atoms instead come from a static "prepared: spin ↑ (Z),
//              down blocked" box — the textbook sequential-SG setup
//              asserts this first-magnet output rather than simulating
//              it — and the same magnet's axis toggles Z/X. Same axis as
//              preparation is deterministic (100% "+"); a different,
//              incompatible axis re-randomizes the result (50/50), even
//              though the incoming spin was perfectly definite a moment
//              before. #sg-prepared-group is shown, #sg-intake-group is
//              hidden.
// The magnet itself, the ghost paths, and both detectors are drawn once
// and never move — only their captions/labels/symbols change (see
// sgApplyMode()) — so firing, the tally, and the explainer all stay the
// same elements regardless of which mode is selected. No qubit/Bloch
// state object involved despite reusing the θ convention — like
// beam-splitter-tab.js, this is a plain probability animation with its
// own small bit of local state.

let sgMagnetCount = 1; // 1 or 2
let sgTheta = 0;       // radians, 0..π — only meaningful in 1-magnet mode
let sg2Axis = 'z';     // 'z' (same as preparation, deterministic) or 'x' (incompatible, 50/50) — only meaningful in 2-magnet mode
let sgCountA = 0, sgCountB = 0, sgAnimating = false;

const SG_SOURCE   = { x: 56,  y: 170 };
const SG_SPLIT    = { x: 600, y: 170 };
const SG_DET_UP   = { x: 770, y: 80  };
const SG_DET_DOWN = { x: 770, y: 260 };
const SG_MARK_MAX = 140; // caps SVG node count on the accumulation plates; oldest mark is dropped past this

function sgProbUp(theta)   { return Math.cos(theta / 2) ** 2; }
function sgProbDown(theta) { return Math.sin(theta / 2) ** 2; }

/** Sum of three uniforms, centered on 0 and clamped to ±spread — a cheap
 *  stand-in for a normal distribution (no need for true Box-Muller here)
 *  so accumulated marks cluster toward the detector center and thin out
 *  toward the edges, the way a real photographic plate's exposure does,
 *  rather than landing uniformly across the housing. */
function sgJitter(spread) {
  return ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 2 * spread;
}

/** Appends one small dot to the "up" or "down" detector's accumulation
 *  plate at a jittered position — the actual realism upgrade here: the
 *  real 1922 plate showed two banana-shaped smudges built up from many
 *  atoms, not a single point, so a single hit alone (the .sg-ping/
 *  .sg-flash click feedback) undersells the experiment. Oldest mark is
 *  dropped past SG_MARK_MAX so the SVG doesn't grow unbounded over a
 *  long session. */
function sgAddScreenMark(isUp) {
  const group  = document.getElementById(isUp ? 'sg-marks-up' : 'sg-marks-down');
  const center = isUp ? SG_DET_UP : SG_DET_DOWN;
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('class', 'sg-mark');
  circle.setAttribute('cx', center.x + sgJitter(24));
  circle.setAttribute('cy', center.y + sgJitter(16));
  circle.setAttribute('r', 1.5 + Math.random() * 1.2);
  circle.setAttribute('fill', isUp ? 'var(--zero)' : 'var(--one)');
  circle.setAttribute('opacity', 0.4 + Math.random() * 0.25);
  group.appendChild(circle);
  if (group.childElementCount > SG_MARK_MAX) group.removeChild(group.firstElementChild);
}

/** Wipes both accumulation plates — called alongside every tally reset
 *  (Reset button, mode switch, axis switch), since a plate mixing marks
 *  from two different configurations (different θ, or Z vs X axis) would
 *  be exactly as physically meaningless as a mixed tally. */
function sgClearScreenMarks() {
  document.getElementById('sg-marks-up').replaceChildren();
  document.getElementById('sg-marks-down').replaceChildren();
}

/** Reads the θ slider and refreshes the live theoretical P(↑)/P(↓)
 *  display (the .prob-rows bars) — distinct from the empirical detector
 *  tally histogram below it, which only updates when atoms are actually
 *  fired. Deliberately doesn't touch the tally, so moving the slider
 *  lets you compare "what theory predicts now" against "what you've
 *  measured so far" without losing earlier trials. */
function updateSGThetaDisplay() {
  const raw = parseInt(document.getElementById('sg-theta-slider').value, 10);
  sgTheta = raw / 1000;
  const deg = Math.round(sgTheta * 180 / Math.PI);
  document.getElementById('sg-theta-val').textContent = deg + '°';

  const pUp = sgProbUp(sgTheta) * 100;
  const pDown = 100 - pUp;
  document.getElementById('sg-fill-up').style.width = pUp + '%';
  document.getElementById('sg-fill-down').style.width = pDown + '%';
  document.getElementById('sg-pct-up-live').textContent = Math.round(pUp) + '%';
  document.getElementById('sg-pct-down-live').textContent = Math.round(pDown) + '%';
}

function sgLerp(a, b, t) { return a + (b - a) * t; }

/** Moves `el` (a <g>, translated as a group so the glow halo and bright
 *  core move together) from (x0,y0) to (x1,y1) over `duration` ms,
 *  interpolating opacity from op0 to op1 at the same time — identical
 *  shape to beam-splitter-tab.js's bsAnimateMove(), reused here under a
 *  different name for both the atom and its ghost. */
function sgAnimateMove(el, x0, y0, x1, y1, op0, op1, duration, cb) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    el.setAttribute('transform', `translate(${sgLerp(x0, x1, t)},${sgLerp(y0, y1, t)})`);
    el.setAttribute('opacity', sgLerp(op0, op1, t));
    if (t < 1) requestAnimationFrame(step);
    else cb();
  }
  requestAnimationFrame(step);
}

function fireSGAtom() {
  if (sgAnimating) return;
  sgAnimating = true;
  document.getElementById('btn-fire-atom').disabled = true;
  document.getElementById('sg-result').textContent = t('sterngerlach.resultTravelling', 'traveling…');

  const atom  = document.getElementById('sg-atom');
  const ghost = document.getElementById('sg-atom-ghost');

  sgAnimateMove(atom, SG_SOURCE.x, SG_SOURCE.y, SG_SPLIT.x, SG_SPLIT.y, 1, 1, 450, () => {
    // Decided at the magnet, from whatever θ/axis is dialed in right
    // now — not captured back at fire time — so changing a control
    // mid-flight (rare, but possible) still resolves against the
    // current odds.
    const isUp = sgMagnetCount === 1
      ? Math.random() < sgProbUp(sgTheta)
      : (sg2Axis === 'z' ? true : Math.random() < 0.5);
    const winTarget  = isUp ? SG_DET_UP : SG_DET_DOWN;
    const loseTarget = isUp ? SG_DET_DOWN : SG_DET_UP;

    sgAnimateMove(ghost, SG_SPLIT.x, SG_SPLIT.y, loseTarget.x, loseTarget.y, 0.55, 0, 450, () => {
      ghost.setAttribute('opacity', 0);
    });

    sgAnimateMove(atom, SG_SPLIT.x, SG_SPLIT.y, winTarget.x, winTarget.y, 1, 1, 450, () => {
      atom.setAttribute('opacity', 0);
      const ping  = document.getElementById(isUp ? 'sg-ping-up' : 'sg-ping-down');
      const flash = document.getElementById(isUp ? 'sg-flash-up' : 'sg-flash-down');
      pulseElement(ping, 'active', 650);
      flash.setAttribute('opacity', 0.5);
      setTimeout(() => flash.setAttribute('opacity', 0), 400);
      sgAddScreenMark(isUp);

      if (isUp) sgCountA++; else sgCountB++;
      if (sgMagnetCount === 1) {
        document.getElementById('sg-result').textContent = isUp
          ? t('sterngerlach.resultUp', 'Up detector clicked')
          : t('sterngerlach.resultDown', 'Down detector clicked');
        setExplainer('sg-explainer', isUp
          ? t('sterngerlach.explainerUp', 'Up detector clicked — one of exactly two possible outcomes, never a partial deflection. Fire again and the same atom state can still land Down; only the odds are fixed, not any single result.')
          : t('sterngerlach.explainerDown', 'Down detector clicked — one of exactly two possible outcomes, never a partial deflection. Fire again and the same atom state can still land Up; only the odds are fixed, not any single result.'));
      } else {
        document.getElementById('sg-result').textContent = isUp
          ? t('sterngerlach.result2Plus', '"+" detector clicked')
          : t('sterngerlach.result2Minus', '"−" detector clicked');
        setExplainer('sg-explainer', sg2Axis === 'z'
          ? t('sterngerlach.explainer2Z', 'Measuring the same axis twice in a row just confirms the earlier result — no surprise here. Fire again as many times as you like: it will always land "+".')
          : t('sterngerlach.explainer2X', 'Even though this atom had a perfectly definite spin along Z, measuring a different, incompatible axis (X) erased that information and produced a fresh, genuinely random result. This is the heart of the Stern–Gerlach discovery: measuring one property can disturb another that doesn\'t commute with it.'));
      }
      updateSGHistogram();

      sgAnimating = false;
      document.getElementById('btn-fire-atom').disabled = false;
    });
  });
}

function updateSGHistogram() {
  const total = sgCountA + sgCountB;
  const pA = total ? (sgCountA / total) * 100 : 0;
  const pB = total ? (sgCountB / total) * 100 : 0;
  document.getElementById('sg-hist-up').style.height = pA + '%';
  document.getElementById('sg-hist-down').style.height = pB + '%';
  document.getElementById('sg-pct-up').textContent = total ? Math.round(pA) + '%' : '—';
  document.getElementById('sg-pct-down').textContent = total ? Math.round(pB) + '%' : '—';
  document.getElementById('sg-trial-count').textContent = total ? t('sterngerlach.trialCount', '· {count} atoms').replace('{count}', total) : '';
}

function sgDefaultExplainer() {
  if (sgMagnetCount === 1) return t('sterngerlach.explainerDefault', 'An atom is about to enter the magnet. Fire it and watch which detector clicks.');
  return sg2Axis === 'z'
    ? t('sterngerlach.sequentialExplainerZ', 'Same axis as before — fire an atom to confirm it always lands the same way.')
    : t('sterngerlach.sequentialExplainerX', 'A different axis this time — fire an atom to see what happens to a spin that was already definite along Z.');
}

/** Relabels the magnet caption, the detector symbols/captions, and the
 *  tally's ket glyphs to match the current mode/axis — the one place
 *  that keeps the shared SVG elements in sync with sgMagnetCount /
 *  sg2Axis. */
function sgUpdateCaptions() {
  const seq = sgMagnetCount === 2;
  document.getElementById('sg-magnet-caption').textContent = !seq
    ? t('sterngerlach.magnetLabel', 'Inhomogeneous field')
    : (sg2Axis === 'z' ? t('sterngerlach.magnet2AxisZ', 'Magnet 2 — Z axis') : t('sterngerlach.magnet2AxisX', 'Magnet 2 — X axis'));

  const symUp = seq ? '+' : '↑', symDown = seq ? '−' : '↓';
  document.getElementById('sg-det-up-symbol').textContent = symUp;
  document.getElementById('sg-det-down-symbol').textContent = symDown;
  document.getElementById('sg-det-up-caption').textContent = seq
    ? t('sterngerlach.detectorPlus', '"+" detector') : t('sterngerlach.detectorUp', 'Up detector');
  document.getElementById('sg-det-down-caption').textContent = seq
    ? t('sterngerlach.detectorMinus', '"−" detector') : t('sterngerlach.detectorDown', 'Down detector');
  document.getElementById('sg-tally-sym-up').textContent = symUp;
  document.getElementById('sg-tally-sym-down').textContent = symDown;
}

function setSGMagnetCount(n) {
  sgMagnetCount = n;
  document.querySelectorAll('.mode-btn[data-sg-magnets]').forEach(btn =>
    btn.classList.toggle('active', Number(btn.dataset.sgMagnets) === n));
  document.getElementById('sg-theta-block').style.display = n === 1 ? '' : 'none';
  document.getElementById('sg-axis-block').style.display  = n === 2 ? '' : 'none';
  document.getElementById('sg-intake-group').style.display   = n === 1 ? '' : 'none';
  document.getElementById('sg-prepared-group').style.display = n === 2 ? '' : 'none';

  sgUpdateCaptions();
  sgCountA = 0; sgCountB = 0;
  sgClearScreenMarks();
  updateSGHistogram();
  document.getElementById('sg-result').textContent = '—';
  setExplainer('sg-explainer', sgDefaultExplainer());
}

/** Switches the magnet's axis (2-magnet mode only), re-labels its
 *  caption, resets the tally (mixing Z-axis and X-axis trials in one
 *  histogram would be physically meaningless — they're two different
 *  experiments), and resets the explainer to describe what's about to
 *  happen rather than what already did. */
function setSG2Axis(axis) {
  sg2Axis = axis;
  document.querySelectorAll('.mode-btn[data-sg-axis]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.sgAxis === axis));
  sgUpdateCaptions();

  sgCountA = 0; sgCountB = 0;
  sgClearScreenMarks();
  updateSGHistogram();
  document.getElementById('sg-result').textContent = '—';
  setExplainer('sg-explainer', sgDefaultExplainer());
}

function resetSternGerlach() {
  sgCountA = 0; sgCountB = 0;
  sgClearScreenMarks();
  updateSGHistogram();
  document.getElementById('sg-result').textContent = '—';
  setExplainer('sg-explainer', sgDefaultExplainer());
}

/** Clears any atom left mid-flight from a switch-away — same reasoning
 *  as beam-splitter-tab.js's resetBeamSplitterPhoton(): the animation is
 *  short enough (900ms) that canceling mid-flight on tab-leave isn't
 *  worth an onLeave hook, but revisiting the tab should never show a
 *  frozen atom stuck partway down a path. Doesn't touch the tally — that
 *  only resets via the Reset button or a mode/axis switch. */
function resetSternGerlachAtoms() {
  ['sg-atom', 'sg-atom-ghost'].forEach(id =>
    document.getElementById(id).setAttribute('opacity', 0));
  sgAnimating = false;
  document.getElementById('btn-fire-atom').disabled = false;
}

function initSternGerlachTab() {
  document.getElementById('sg-theta-slider').addEventListener('input', updateSGThetaDisplay);
  document.getElementById('btn-fire-atom').addEventListener('click', fireSGAtom);
  document.getElementById('btn-reset-sterngerlach').addEventListener('click', resetSternGerlach);

  document.querySelectorAll('.mode-btn[data-sg-magnets]').forEach(btn =>
    btn.addEventListener('click', () => setSGMagnetCount(Number(btn.dataset.sgMagnets))));
  document.querySelectorAll('.mode-btn[data-sg-axis]').forEach(btn =>
    btn.addEventListener('click', () => setSG2Axis(btn.dataset.sgAxis)));

  updateSGThetaDisplay();
  setSGMagnetCount(1);
  registerTab('sterngerlach', { onEnter: resetSternGerlachAtoms });
}
