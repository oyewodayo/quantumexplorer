'use strict';
// Bootstrap file — must be the LAST <script> tag in index.html. It declares
// the shared app state (used by every tabs/*.js file) and wires up the
// theme toggle, tab switching, and initial UI render inside a single
// DOMContentLoaded listener, calling into every core/*.js and tabs/*.js
// build/init function. Keeping one linear init function here (rather than
// scattering DOMContentLoaded listeners across the tab files) makes the
// init order easy to reason about, since there's no module system to make
// per-file registration order predictable.
// Depends on: core/tab-registry.js (TABS) for switchToTab().

// ═══════════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════════
let qubitMain    = new Qubit();
let qubitCircuit = new Qubit();
let qubitMeasure = new Qubit();

// Two Qubits panel (Qubit tab) — independent, not entangled; see
// updateQubit2UI() in qubit-tab.js for the product-state math.
let qubit2A = new Qubit();
let qubit2B = new Qubit();

// Three Qubits panel (Qubit tab) — same "independent, not entangled"
// pattern as qubit2A/B above, just one more Qubit; see updateQubit3UI()
// in qubit-tab.js.
let qubit3A = new Qubit();
let qubit3B = new Qubit();
let qubit3C = new Qubit();

// Teleport tab — Alice's message qubit, set independently via its own
// sliders/drag/presets same as qubit2A/B above, not entangled with
// anything until fireTeleport() (teleport-tab.js) builds a fresh
// ThreeQubitState from its amplitudes each run.
let qubitTeleportMsg = new Qubit();

// Noise tab — the initial (pre-decoherence) state qubitNoise sets is what
// noise-tab.js's own rAF loop then evolves away from in real time; the
// evolving (x,y,z) itself isn't stored on a Qubit instance (decoherence
// takes it off the unit sphere, which Qubit's theta/phi model can't
// represent), just tracked as plain numbers inside noise-tab.js.
let qubitNoise = new Qubit();

let rendererMain    = null;
let rendererGates   = null;
let rendererCircuit = null;
let rendererQubit2A = null;
let rendererQubit2B = null;
let rendererQubit3A = null;
let rendererQubit3B = null;
let rendererQubit3C = null;
let rendererTeleportAlice = null;
let rendererTeleportBob   = null;
let rendererNoise = null;

// Reduced single-qubit Bloch spheres for the 2Q/3Q circuit builders (see
// TwoQubitState/ThreeQubitState.getSingleQubitBloch() and updateUI() in
// tabs/circuit-multiqubit-tab.js) — read-only outputs of each builder's
// own instance state, not independent state like rendererQubit2A/B.
let rendererCircuit2 = [null, null];
let rendererCircuit3 = [null, null, null];

let gateHistory  = [];
let circuitGates = [];
const SLOT_COUNT = 8;

let measureCounts = { 0: 0, 1: 0 };
// The Measure tab's coin — same null=unmeasured/0/1 convention as the
// Entangle tab's coin1State/coin2State below, and the same coinAnimating-
// style re-entrancy guard so a rapid double-click on MEASURE can't start
// a second flip animation mid-flight.
let measureCoinState     = null;
let measureCoinAnimating = false;
let measureBatchAnimating = false; // guards measureMany() — see measure-tab.js

let currentTab = 'qubit'; // matches the initially-active .tab/.tab-content in index.html

// ── Classical bit state ────────────────────────────────────────────
let classicalBit     = 1;

// ── Statevector widget (embedded in Maths Concept's State Vector
//    section — see tabs/statevector-tab.js) ─────────────────────────
let classicalSVState = 1;   // 0 or 1
let svTheta          = 0;   // angle controlling quantum state vector

// ── Entanglement tab ───────────────────────────────────────────────
let coin1State     = null;  // null=unmeasured, 0, 1
let coin2State     = null;
let coinAnimating  = false;
let entangleCounts = { '00': 0, '11': 0 };

/** Highlights whichever sidebar sub-link(s) under `tab` match `state` —
 *  called from each tab's own mode setter (setQubitMode/setQubitSubmode,
 *  setGatesDomain, setMathsSection) after it updates that tab's in-page
 *  toggle, so the sidebar stays correct no matter whether the state
 *  change came from the sidebar itself, the in-page toggle, or roadmap
 *  navigation. `state` maps each *mode* dataset key a .tab-sub might carry
 *  to its current value; a sub-link matches only if every mode key IT
 *  declares agrees — a link with just `gatesDomain` ignores qubitSubmode
 *  etc. MODE_KEYS is an explicit allowlist rather than "every dataset key
 *  but `tab`": every .tab-sub also carries a `data-i18n` translation key
 *  (core/i18n.js's applyTranslations() reads it, unrelated to navigation
 *  state), and an every()-over-all-keys match used to silently fail
 *  forever because `state.i18n` is never set — no sidebar sub-link ever
 *  highlighted, on any tab, once i18n.js started tagging these buttons. */
const SIDEBAR_SUB_MODE_KEYS = ['qubitMode', 'qubitSubmode', 'gatesDomain', 'mathsSection'];
function syncSidebarSub(tab, state) {
  document.querySelectorAll(`.tab-sub[data-tab="${tab}"]`).forEach(btn => {
    const keys = SIDEBAR_SUB_MODE_KEYS.filter(k => btn.dataset[k] !== undefined);
    const match = keys.length > 0 && keys.every(k => btn.dataset[k] === state[k]);
    btn.classList.toggle('active', match);
  });
}

/** Opens one sidebar subnav group (Bits & Qubits / Maths Concept / Gates),
 *  closing every other open one first — an accordion, so the dock never
 *  shows two expanded groups (and their sub-lists) at once. */
function openSidebarGroup(group) {
  document.querySelectorAll('.tab-group.open').forEach(g => {
    if (g !== group) g.classList.remove('open');
  });
  group.classList.add('open');
}

/** Switches the visible tab and fires the outgoing/incoming tab's
 *  registerTab() hooks (see core/tab-registry.js). */
function switchToTab(name) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('active', s.id === `tab-${name}`));

  const leaving = TABS[currentTab];
  if (leaving && leaving.onLeave) leaving.onLeave();

  currentTab = name;
  const entering = TABS[currentTab];
  if (entering && entering.onEnter) entering.onEnter();

  // Each tab is a plain block in document flow (the page itself scrolls,
  // not some inner wrapper) — without this, a tab entered while scrolled
  // halfway down the previous one starts halfway down too, since nothing
  // else resets window scroll on a tab swap.
  window.scrollTo(0, 0);
}

/** Fills in the footer's copyright line with the real current year rather
 *  than a hardcoded one that quietly goes stale — same
 *  t(key, fallback).replace('{token}', value) pattern roadmap.js uses for
 *  any other translated string that needs a runtime value spliced in.
 *  Registered with onLangChange() (core/i18n.js) since this text isn't
 *  reachable by the plain [data-i18n] walk in applyTranslations(). */
function renderFooter() {
  const el = document.getElementById('footer-copyright');
  if (!el) return;
  el.textContent = t('footer.copyright', 'Copyright © {year} QuantumExplorer').replace('{year}', new Date().getFullYear());
}

// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // Theme init — data-theme itself was already restored from localStorage
  // by the anti-flash script in index.html's <head>, before first paint.
  refreshThemeColors();
  syncThemeIcon();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Language init (core/i18n.js) — runs after every js/locales/*.js file
  // has already registered itself (script order in index.html), so every
  // language is available the first time applyTranslations() runs.
  initI18n();
  document.getElementById('lang-select').addEventListener('change', e => setLanguage(e.target.value));
  renderFooter();
  onLangChange(renderFooter);

  // Tab switching — each tab declares its own onEnter/onLeave via
  // registerTab() (see core/tab-registry.js), so this handler never needs
  // to know which tabs care about being entered/left, or why. Adding a
  // new tab means calling registerTab() once in its own file, not editing
  // this switch.
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      switchToTab(btn.dataset.tab);
      const group = btn.closest('.tab-group');
      if (group) openSidebarGroup(group);
    });
  });

  // Sidebar sub-links (Bits & Qubits / Maths Concept / Gates) — each
  // carries `data-tab` plus whichever mode/domain/section attribute its
  // target tab understands, mirroring the same fields goToLessonSimulation()
  // in roadmap.js applies for mind-map navigation.
  document.querySelectorAll('.tab-chevron').forEach(chevron => {
    chevron.addEventListener('click', e => {
      e.stopPropagation();
      const group = chevron.closest('.tab-group');
      if (group.classList.contains('open')) group.classList.remove('open');
      else openSidebarGroup(group);
    });
  });
  document.querySelectorAll('.tab-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      switchToTab(btn.dataset.tab);
      if (btn.dataset.qubitMode)     setQubitMode(btn.dataset.qubitMode);
      if (btn.dataset.qubitSubmode)  setQubitSubmode(btn.dataset.qubitSubmode);
      if (btn.dataset.gatesDomain)   setGatesDomain(btn.dataset.gatesDomain);
      if (btn.dataset.mathsSection)  setMathsSection(btn.dataset.mathsSection);
    });
  });

  // Bloch renderers — must exist before the initXTab() calls below: e.g.
  // initCircuit2Tab()/initCircuit3Tab() (tabs/circuit-multiqubit-tab.js)
  // call updateUI() during their own init, which reaches straight into
  // rendererCircuit2/rendererCircuit3 to draw the per-qubit mini-spheres.
  rendererMain    = new BlochRenderer(document.getElementById('bloch-main'));
  rendererGates   = new BlochRenderer(document.getElementById('bloch-gates'));
  rendererCircuit = new BlochRenderer(document.getElementById('bloch-circuit'));
  rendererQubit2A = new BlochRenderer(document.getElementById('bloch-2q-a'));
  rendererQubit2B = new BlochRenderer(document.getElementById('bloch-2q-b'));
  rendererQubit3A = new BlochRenderer(document.getElementById('bloch-3q-a'));
  rendererQubit3B = new BlochRenderer(document.getElementById('bloch-3q-b'));
  rendererQubit3C = new BlochRenderer(document.getElementById('bloch-3q-c'));
  rendererCircuit2 = [0, 1].map(i => new BlochRenderer(document.getElementById(`bloch-circuit-2q-${i}`)));
  rendererCircuit3 = [0, 1, 2].map(i => new BlochRenderer(document.getElementById(`bloch-circuit-3q-${i}`)));
  rendererTeleportAlice = new BlochRenderer(document.getElementById('bloch-teleport-alice'));
  rendererTeleportBob   = new BlochRenderer(document.getElementById('bloch-teleport-bob'));
  rendererNoise = new BlochRenderer(document.getElementById('bloch-noise'));

  // Only free-form inputs get drag — Gates/Circuit spheres are read-only
  // outputs of applying gates, so dragging them wouldn't map back to a
  // meaningful action, but the Two/Three Qubits spheres are inputs same
  // as the main one.
  rendererMain.enableDrag((theta, phi) => setMainState(theta, phi));
  rendererQubit2A.enableDrag((theta, phi) => { qubit2A.setState(theta, phi); updateQubit2UI(); });
  rendererQubit2B.enableDrag((theta, phi) => { qubit2B.setState(theta, phi); updateQubit2UI(); });
  rendererQubit3A.enableDrag((theta, phi) => { qubit3A.setState(theta, phi); updateQubit3UI(); });
  rendererQubit3B.enableDrag((theta, phi) => { qubit3B.setState(theta, phi); updateQubit3UI(); });
  rendererQubit3C.enableDrag((theta, phi) => { qubit3C.setState(theta, phi); updateQubit3UI(); });
  rendererTeleportAlice.enableDrag((theta, phi) => setTeleportAliceState(theta, phi));
  [rendererMain, rendererGates, rendererCircuit, rendererQubit2A, rendererQubit2B,
   rendererQubit3A, rendererQubit3B, rendererQubit3C, rendererTeleportAlice, rendererTeleportBob,
   rendererNoise, ...rendererCircuit2, ...rendererCircuit3].forEach(r => r.enableTooltips());

  // Redraw every sphere in place (same x/y/z, new theme colors) whenever
  // the theme toggles — see core/theme.js's onThemeChange().
  onThemeChange(() => {
    [rendererMain, rendererGates, rendererCircuit, rendererQubit2A, rendererQubit2B,
     rendererQubit3A, rendererQubit3B, rendererQubit3C, rendererTeleportAlice, rendererTeleportBob,
     rendererNoise, ...rendererCircuit2, ...rendererCircuit3].forEach(r => {
      if (r) r.draw(r.cur.x, r.cur.y, r.cur.z);
    });
  });

  // Build UI
  buildGateButtons();
  buildCircuitPalette();
  buildCircuitSlots();
  initClassicalBit();
  initQubitTab();
  initMathsConceptTab();
  initCircuitTab();
  initCircuit2Tab();
  initCircuit3Tab();
  initClassicalCircuitTab();
  initClassicalGatesTab();
  initMeasureTab();
  initStatevecTab();
  initEntangle();
  initBellStatesTab();
  initTunnelControls();
  initInterferenceControls();
  initBeamSplitterTab();
  initImportantConceptsZoom();
  initImportantConceptsSearch();
  initSternGerlachTab();
  initTeleportTab();
  initSuperdenseTab();
  initNoiseTab();
  initGroverTab();

  // Initial renders
  const b0 = qubitMain.getBloch();
  rendererMain.draw(b0.x, b0.y, b0.z, qubitMain.getLabel());
  rendererGates.draw(b0.x, b0.y, b0.z, qubitMain.getLabel());
  const bc = qubitCircuit.getBloch();
  rendererCircuit.draw(bc.x, bc.y, bc.z, qubitCircuit.getLabel());
  const b2a = qubit2A.getBloch(), b2b = qubit2B.getBloch();
  rendererQubit2A.draw(b2a.x, b2a.y, b2a.z, qubit2A.getLabel());
  rendererQubit2B.draw(b2b.x, b2b.y, b2b.z, qubit2B.getLabel());
  updateQubit2UI();
  const b3a = qubit3A.getBloch(), b3b = qubit3B.getBloch(), b3c = qubit3C.getBloch();
  rendererQubit3A.draw(b3a.x, b3a.y, b3a.z, qubit3A.getLabel());
  rendererQubit3B.draw(b3b.x, b3b.y, b3b.z, qubit3B.getLabel());
  rendererQubit3C.draw(b3c.x, b3c.y, b3c.z, qubit3C.getLabel());
  updateQubit3UI();

  updateQubitUI();
  updateGatesUI();
  updateCircuitUI();
  updateMeasureUI();
  updateClassicalUI();
  initRoadmap();
  setAppMode('roadmap'); // Roadmap is the default landing view — see index.html's
                          // matching hardcoded defaults (nav hidden, #roadmap-view
                          // .active) that avoid a Concepts-page flash before this runs.
  initModeGridThumbs();

  applySharedStateFromURL();
  startTourIfFirstVisit();
});

/** Restores a qubit state and/or circuit gate sequence encoded in the
 *  URL by copyShareLink() (see core/dom-utils.js), so a shared link
 *  reproduces what the sender saw. Unrecognized/missing params are
 *  silently ignored rather than treated as errors. */
function applySharedStateFromURL() {
  const params = new URLSearchParams(location.search);

  const theta = params.get('theta');
  const phi   = params.get('phi');
  if (theta !== null && phi !== null) {
    setMainState(parseFloat(theta), parseFloat(phi));
  }

  const circuit = params.get('circuit');
  if (circuit) {
    circuitGates = circuit.split(',').filter(key => GATES[key]).slice(0, SLOT_COUNT);
    buildCircuitSlots();
    updateCircuitUI();
  }

  const tab = params.get('tab');
  if (tab && document.querySelector(`.tab[data-tab="${tab}"]`)) {
    switchToTab(tab);
  }
}
