/* eslint-disable */
// Imperative simulation engine, bundled from the original js/ scripts.
import { C } from '../core/complex.js';
import { INV2, GATES, ROTATION_GATES, rotationMatrix } from '../core/gates.js';
import { Qubit, round2, blochVectorLabel } from '../core/qubit.js';
import { TwoQubitState } from '../core/twoQubit.js';
import { ThreeQubitState } from '../core/threeQubit.js';
import { TunnelSolver, TUNNEL_N } from '../core/tunnelSolver.js';

const tunnelSolver = new TunnelSolver();

// All files share one module scope exactly as they shared the global scope
// before; React mounts the markup, then calls startEngine() once.


// ════════ js/core/tab-registry.js ════════
// No dependencies. Loads before every tabs/*.js file, each of which calls
// registerTab() from its own init function (during app.js's
// DOMContentLoaded) to declare what should happen when its tab becomes
// visible/hidden. app.js's tab-switch handler looks entries up here
// instead of branching on tab name — adding a new tab never requires
// touching app.js's switch logic, only calling registerTab() once.

const TABS = {};

/**
 * Declares lifecycle hooks for a tab.
 * @param {string} name - matches a button's data-tab and its
 *   `tab-<name>` section id.
 * @param {{onEnter?: Function, onLeave?: Function}} handlers - onEnter
 *   fires every time the tab becomes visible (including page load, for
 *   the initially-active tab, if you call it yourself); onLeave fires
 *   right before switching away. Both are optional.
 */
function registerTab(name, handlers) {
  TABS[name] = handlers || {};
}


// ════════ js/core/i18n.js ════════
// No dependencies. Loaded before js/locales/*.js (each of which calls
// registerLocale() at its own top level) and before app.js (which calls
// initI18n() once from DOMContentLoaded, the same place it calls
// refreshThemeColors()/syncThemeIcon() — see core/theme.js for the
// sibling pattern this file deliberately mirrors: a localStorage-backed
// preference, an attribute on <html>, and a callback registry so parts of
// the app that need to react to a change don't have to be known by name
// here.
//
// Scope: this drives translation of static content only — page chrome
// (index.html's [data-i18n] elements), the roadmap lesson/quiz text, and
// gate descriptions (see js/roadmap.js and js/core/gates.js, which read
// through t() with their existing English string as the fallback). It
// does NOT cover the sentences individual tabs build at runtime by
// mixing a variable into a template literal (e.g. circuit-tab.js's
// "Checkpoint 3 is now H." narration) — those stay English; translating
// them safely means restructuring each call site into a template+params
// form, not just swapping a string, and is out of scope here.

// ─── LOCALE REGISTRY ────────────────────────────────────────────────────
const LOCALES = {};
const I18N_STORAGE_KEY = 'qe-lang';
const I18N_DEFAULT = 'en';
let currentLang = I18N_DEFAULT;

/** Called once per language, at the top level of each js/locales/*.js
 *  file — e.g. registerLocale('fr', { nav: {...}, lessons: {...}, ... }). */
function registerLocale(code, data) {
  LOCALES[code] = data;
}

/** Dotted-path lookup (e.g. 'lessons.qubit.title') into the active
 *  locale. Falls back to the English locale if the active one is missing
 *  the key, then to `fallback` (the string already hardcoded at the call
 *  site before i18n existed) if English is missing it too — so a typo'd
 *  key or an incomplete translation degrades to correct English instead
 *  of a blank string or a raw dotted key leaking into the UI. */
function t(key, fallback) {
  const lookup = (localeCode) => {
    const locale = LOCALES[localeCode];
    if (!locale) return undefined;
    return key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : undefined, locale);
  };
  const active = lookup(currentLang);
  if (active !== undefined) return active;
  const english = lookup(I18N_DEFAULT);
  if (english !== undefined) return english;
  return fallback !== undefined ? fallback : key;
}

// ─── APPLYING TRANSLATIONS TO THE DOM ──────────────────────────────────
/** Walks every [data-i18n] element under `root` and sets its text (or,
 *  for [data-i18n-attr="aria-label"] etc., that attribute instead) from
 *  t(key). `root` defaults to the whole document but can be scoped to a
 *  freshly-rendered subtree (e.g. roadmap.js re-renders the mind-map on
 *  every expand/collapse — no need to re-walk the entire page for that).
 *  A handful of elements carry inline markup inside their translatable
 *  text (a <b> emphasis, a <ul> list — e.g. the Introduction tab) — those
 *  add [data-i18n-html] so the locale value is trusted, hand-written
 *  markup (not user input) and gets set via innerHTML instead of
 *  textContent. */
function applyTranslations(root) {
  (root || document).querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const value = t(key, el.dataset.i18nDefault);
    if (el.dataset.i18nAttr) {
      el.setAttribute(el.dataset.i18nAttr, value);
    } else if (el.dataset.i18nHtml !== undefined) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });
}

// ─── LANGUAGE-CHANGE CALLBACKS ──────────────────────────────────────────
// Anything that renders translatable text into markup i18n.js can't
// reach with a static [data-i18n] walk (e.g. roadmap.js's mind-map, built
// fresh from JS on every render) registers a re-render callback here
// instead of this file needing to know those renderers by name.
const langChangeCallbacks = [];
function onLangChange(fn) { langChangeCallbacks.push(fn); }

/** Switches the active language, persists it, updates <html lang>, and
 *  re-renders every translatable surface. Falls back to English for an
 *  unrecognized code (e.g. a locale file that failed to load) rather
 *  than leaving the page in a half-translated state. */
function setLanguage(code) {
  currentLang = LOCALES[code] ? code : I18N_DEFAULT;
  localStorage.setItem(I18N_STORAGE_KEY, currentLang);
  document.documentElement.setAttribute('lang', currentLang);
  const select = document.getElementById('lang-select');
  if (select) select.value = currentLang;
  applyTranslations();
  langChangeCallbacks.forEach(fn => fn());
}

/** Restores a saved language preference (falling back to English if none
 *  is saved, or if the saved code's locale file didn't register — e.g.
 *  it was removed) and does the initial translation pass. Called once
 *  from app.js's DOMContentLoaded, after every locales/*.js file has run. */
function initI18n() {
  const saved = localStorage.getItem(I18N_STORAGE_KEY);
  currentLang = (saved && LOCALES[saved]) ? saved : I18N_DEFAULT;
  document.documentElement.setAttribute('lang', currentLang);
  const select = document.getElementById('lang-select');
  if (select) select.value = currentLang;
  applyTranslations();
}


// ════════ js/locales/en.js ════════
// English — the canonical locale. Every key here should also exist in
// fr.js/es.js; core/i18n.js's t() falls back to this file first if the
// active language is missing a key, so this file effectively defines the
// full set of translatable keys for the app.
registerLocale('en', {
  header: {
    tag: 'Quantum Explorer · CERN',
    themeToggle: 'Toggle light / dark'
  },
  footer: {
    tagline: 'An interactive platform for learning quantum computing & quantum mechanics',
    cernLink: 'CERN official site',
    copyright: 'Copyright © {year} CERN'
  },
  nav: {
    home: 'Home',
    introduction: 'Introduction',
    importantConcepts: 'Important Concepts',
    bitsQubits: 'Bits & Qubits',
    mathsConcept: 'Maths Concept',
    gates: 'Gates',
    circuits: 'Circuits',
    measure: 'Measure',
    entangle: 'Entangle',
    bellStates: 'Bell States',
    tunnel: 'Tunnel',
    interference: 'Interference',
    beamSplitter: 'Beam Splitter',
    sternGerlach: 'Stern–Gerlach',
    teleport: 'Teleport',
    superdense: 'Superdense Coding',
    noise: 'Noise',
    grover: 'Grover\'s Search'
  },
  qubitTab: {
    classical: 'Classical',
    oneQubit: 'One Qubit',
    twoQubit: 'Two Qubit',
    threeQubit: 'Three Qubit',
    pageTitle: 'Bits & Qubits',
    pageSubtitle: 'Learn classical and quantum information by exploring a bit, a single qubit, or a two-qubit system.',
    classicalBitBadge: 'Classical Bit',
    classicalBitDesc: 'A bit is the smallest unit of information in a classical computer. Unlike a qubit, a classical bit never exists in both states simultaneously.',
    currentBit: 'Current bit',
    possibleValues: 'Possible values',
    classicalExplainer: 'Toggle the switch to change the bit. Notice it is always either 0 or 1, never both.',
    qubitBadge: 'Qubit',
    qubitDesc: 'A qubit is the fundamental unit of quantum information. Unlike a classical bit, it can exist in a superposition of both 0 and 1 at once — its state is described by two complex amplitudes, α and β, until the moment it\'s measured.',
    qubitIntroExplainer: 'Pick a mode below: explore a single qubit\'s superposition on the Bloch sphere, or see how two independent qubits combine into a joint state.',
    oneQubitDesc: 'A superposition of both 0 and 1',
    exploreBlochSphere: 'Explore the Bloch Sphere',
    oneQubitExplainer: 'A qubit can be in a superposition of |0⟩ and |1⟩ simultaneously. Drag the sliders to explore every possible state on the Bloch sphere — each point is a valid qubit state inaccessible to any classical bit.',
    qubitABadge: 'Qubit A',
    qubitADesc: 'Independent — not entangled with B',
    qubitBBadge: 'Qubit B',
    qubitBDesc: 'Independent — not entangled with A',
    jointState: 'Joint State — |ψ_A⟩ ⊗ |ψ_B⟩',
    twoQubitExplainer: 'Two qubits, each dragged independently — the joint state above is just the product of their individual odds, P(ab) = P(a) × P(b). Nothing here is correlated yet; that\'s exactly the ingredient the Entangle tab adds with a CNOT.',
    classicalTryMeIdle: 'Click Try me to watch the bit flip back and forth.',
    oneQubitTryMeIdle: 'Click Try me to cycle through the six basis states.',
    twoQubitTryMeIdle: 'Click Try me to move both qubits together through the four basis states.',
    whatIsQubitBody: 'A qubit is often described as "0 and 1 at the same time," but that\'s shorthand for something more precise: its state is a <span class="key-term">superposition</span> — a weighted combination — of the two basis outcomes |0⟩ and |1⟩, set by two <span class="key-term">complex amplitudes</span> α and β. Squaring the size of each amplitude gives the probability of that outcome when measured — but before measurement, the qubit genuinely hasn\'t picked one. A classical bit has exactly two states. A qubit has infinitely many: every point on the surface of the Bloch sphere below is a valid state, not just its two poles.',
    blochEarthTitle: 'The Bloch Sphere — Think of Planet Earth',
    blochEarthBody: 'The sphere your qubit lives on works like a globe. The <span class="key-term">north pole</span> is |0⟩ and the <span class="key-term">south pole</span> is |1⟩ — θ (theta) is "latitude," how far the qubit has tilted from the |0⟩ pole toward |1⟩. Sitting right on the <span class="key-term">equator</span> (θ = 90°) means an equal 50/50 <span class="key-term">superposition</span> of both. φ (phi) is "longitude" — it never changes the measurement odds, only the relative <span class="key-term">phase</span> between the two amplitudes, which is invisible to a single measurement but is exactly what drives interference elsewhere in this app.',
    qubitCBadge: 'Qubit C',
    qubitA3Desc: 'Independent — not entangled with B or C',
    qubitB3Desc: 'Independent — not entangled with A or C',
    qubitC3Desc: 'Independent — not entangled with A or B',
    jointState3: 'Joint State — |ψ_A⟩ ⊗ |ψ_B⟩ ⊗ |ψ_C⟩',
    threeQubitExplainer: 'Three qubits, each dragged independently — the joint state above is just the product of all three individual odds, P(abc) = P(a) × P(b) × P(c). Still nothing correlated here; scale this same idea up with a CNOT and you get the GHZ states in the Circuit tab\'s 3-qubit builder.',
    threeQubitTryMeIdle: 'Click Try me to move all three qubits together through the four basis states.'
  },
  maths: {
    title: 'Maths Concept',
    subtitle: 'The mathematical language behind qubits — complex numbers, vectors, matrices, state vectors, Dirac notation, and tensor products.',
    complexBody1: 'A qubit\'s amplitudes aren\'t plain real numbers — they\'re complex numbers, each with a real part and an imaginary part. That extra dimension is what makes phase (and interference) possible.',
    complexFormula1: 'z = a + bi,&nbsp;&nbsp; i² = −1',
    complexFormula2: 'Modulus: |z| = √(a² + b²)',
    complexFormula3: 'Polar form: z = r·e<sup>iθ</sup> = r(cos θ + i sin θ)',
    complexBody2: 'A qubit state α|0⟩ + β|1⟩ has complex amplitudes α, β. Only their squared moduli |α|², |β|² are directly observable (as measurement probabilities) — the relative phase between them is invisible to a single measurement but drives interference.',
    vectorsBody1: 'A qubit\'s state is a vector in a 2-dimensional complex vector space, written as a column of its two amplitudes.',
    vectorsFormula1: '|0⟩ = [1, 0]<sup>T</sup>&nbsp;&nbsp;&nbsp; |1⟩ = [0, 1]<sup>T</sup>',
    vectorsFormula2: '|ψ⟩ = α|0⟩ + β|1⟩ = [α, β]<sup>T</sup>',
    vectorsFormula3: 'Normalization: |α|² + |β|² = 1',
    vectorsFormula4: 'Inner product: ⟨φ|ψ⟩ = φ<sub>0</sub>*ψ<sub>0</sub> + φ<sub>1</sub>*ψ<sub>1</sub>',
    vectorsBody2: 'Normalization keeps total probability at 100% — it\'s why every point you can drag to on the Bloch sphere is automatically a valid state. The inner product measures how much two states overlap; orthogonal states (like |0⟩ and |1⟩) have inner product 0.',
    matricesBody1: 'Every quantum gate is a matrix. Applying a gate to a qubit is just matrix-vector multiplication — the gate matrix times the state vector gives the new state vector.',
    matricesFormula1: 'Pauli-X = [[0, 1], [1, 0]]',
    matricesFormula2: 'X|0⟩ = [[0,1],[1,0]]·[1,0]<sup>T</sup> = [0,1]<sup>T</sup> = |1⟩',
    matricesFormula3: 'Unitary condition: U†U = I',
    matricesBody2: '"Unitary" is the constraint every quantum gate must satisfy — U† (the conjugate transpose) undoes U exactly. It\'s what guarantees a gate never destroys or creates probability: the output state is always normalized whenever the input was.',
    svBody1: 'The state vector |ψ⟩ is the complete description of a qubit — everything you can ever predict about it (measurement odds, how it responds to a gate) is computed from these two amplitudes.',
    svFormula1: '|ψ⟩ = α|0⟩ + β|1⟩',
    svFormula2: 'Bloch form: |ψ⟩ = cos(θ/2)|0⟩ + e<sup>iφ</sup>sin(θ/2)|1⟩',
    svFormula3: 'P(0) = |α|²&nbsp;&nbsp;&nbsp; P(1) = |β|²',
    svBody2: 'θ and φ are exactly the two sliders on the Bits & Qubits Bloch sphere — every state vector corresponds to one point on that sphere, and vice versa.',
    compareStateSpaces: 'Compare the State Spaces',
    compareStateSpacesBody: 'A classical bit is a point on a line; a qubit is a vector tip on a unit arc — pick a view below.',
    svClassicalDesc: 'Two discrete endpoints only',
    toggleBit: 'Toggle bit',
    currentState: 'Current State',
    stateSpace: 'State Space',
    stateSpaceBody: 'Only the two endpoints |0⟩ and |1⟩ are valid. The region between is physically forbidden — there is no "47% |1⟩" for a classical bit.',
    svQuantumDesc: 'Any point on the unit arc',
    keyInsight: 'Key Insight',
    keyInsightBody: 'The tip of the state vector must sit on the unit arc (α² + β² = 1). Every point on that arc is a distinct, valid quantum state. The classical bit only ever occupies the two corners.',
    diracBody1: 'The |·⟩ and ⟨·| symbols used everywhere in this app are Dirac\'s "bra-ket" notation — a compact shorthand for vectors and their inner products.',
    diracFormula1: 'Ket: |ψ⟩ — a column vector (a state)',
    diracFormula2: 'Bra: ⟨ψ| — the conjugate-transpose row vector',
    diracFormula3: 'Bra-ket: ⟨φ|ψ⟩ — an inner product (a number)',
    diracFormula4: '⟨0|0⟩ = 1&nbsp;&nbsp;&nbsp; ⟨0|1⟩ = 0&nbsp;&nbsp;&nbsp; ⟨1|1⟩ = 1',
    diracFormula5: 'Ket-bra: |ψ⟩⟨φ| — an outer product (a matrix/operator)',
    diracBody2: '|0⟩ and |1⟩ are orthonormal — each has unit length and zero overlap with the other — which is exactly why measuring always returns a clean 0 or 1, never something in between.',
    tensorBody1: 'The tensor product (⊗) is how two independent vector spaces combine into one larger joint space — stack every entry of the first vector against every entry of the second, multiplying each pair. An n-dimensional vector combined with an m-dimensional one produces an n×m-dimensional vector.',
    tensorFormula1: '[a, b]<sup>T</sup> ⊗ [c, d]<sup>T</sup> = [ac, ad, bc, bd]<sup>T</sup>',
    tensorBody2: 'Two independent qubits combine exactly this way: each is a 2-entry vector, so their joint state is a 4-entry vector — one entry for each combination of basis states, |00⟩, |01⟩, |10⟩, |11⟩.',
    tensorFormula2: '|0⟩⊗|0⟩ = [1,0]<sup>T</sup>⊗[1,0]<sup>T</sup> = [1,0,0,0]<sup>T</sup> = |00⟩',
    tensorBody3: 'Every state built by tensoring two single-qubit states can always be factored back apart into those same two qubits. Not every 4-entry vector can be factored that way, though — a joint state that can\'t be split back into a tensor product of two single-qubit states is exactly what\'s called entangled, explored hands-on on the Entangle tab.'
  },
  gates: {
    title: 'Gates',
    subtitle: 'Pick one gate and see its immediate effect — classical or quantum',
    classicalGates: 'Classical Gates',
    quantumGates: 'Quantum Gates',
    compareGates: 'Compare',
    quantumTruthTableNote: 'Each fixed gate\'s action on the two basis states — rotation gates (Rx/Ry/Rz) aren\'t included since their output depends on a runtime angle, not a fixed table.',
    compareClassicalDesc: 'NOT/AND/OR/XOR and their negations — strict, destructive rules',
    compareQuantumDesc: 'H/X/Y/Z/S/T — always reversible, can create superposition',
    compareInsightTitle: 'The Key Difference',
    compareInsightBody: 'Every classical row above collapses information — AND, OR, and friends all map multiple input combinations onto the same output, so there\'s no way back to the input from the output alone. Every quantum row is reversible: each is a unitary matrix, so running its own conjugate transpose afterward always recovers the exact input. Classical gates can also only ever output a definite 0 or 1; quantum gates like H can output a genuine superposition of both.',
    pickGate: 'Gate — click to choose',
    inputA: 'Input A',
    inputB: 'Input B',
    resetToZero: 'Reset to |0⟩',
    applyGate: 'Apply Gate',
    gateReference: 'Gate Reference',
    rotationGates: 'Rotation Gates',
    gateMatrix: 'Gate Matrix',
    selectAGate: '← select a gate',
    whyReversibleTitle: 'Why Every Gate Is Reversible',
    whyReversibleBody: 'Every gate on the left is a unitary matrix (U†U = I) — not by convention, but because a gate is really just the qubit\'s own Schrödinger-equation time evolution, which always preserves total probability. One direct consequence: quantum gates never destroy information. Apply any gate, then its conjugate transpose, and the qubit lands back exactly where it started — there\'s no quantum equivalent of a classical AND gate quietly throwing a bit away.',
    // Nicknames/formal names for the six fixed gates (js/core/gates.js's
    // GATES) — `name` (the bare letter H/X/Y/Z/S/T) is notation, never
    // translated. `explain`'s full paragraph is dynamic-narration text
    // (built into an interpolated sentence at the moment a gate is
    // applied, see gates-tab.js's applyGate()) and is out of scope, same
    // as the rest of that category app-wide.
    H: { desc: 'The Coin Spinner', formalName: 'Hadamard gate' },
    X: { desc: 'The Light Switch', formalName: 'Pauli-X gate' },
    Y: { desc: 'The Cartwheel', formalName: 'Pauli-Y gate' },
    Z: { desc: 'The Ghost Move', formalName: 'Pauli-Z gate' },
    S: { desc: 'The Quarter Turn', formalName: 'Phase gate (√Z)' },
    T: { desc: 'The Whisper Nudge', formalName: 'T gate (√S)' }
  },
  // Rx/Ry/Rz (js/core/gates.js's ROTATION_GATES) — separate from `gates`
  // above since both use plain axis keys (X/Y/Z) that would otherwise
  // collide with the fixed Pauli-X/Y/Z gates' own entries there.
  rotationGates: {
    X: { desc: 'Rotate around the X axis', formalName: 'X-axis rotation' },
    Y: { desc: 'Rotate around the Y axis', formalName: 'Y-axis rotation' },
    Z: { desc: 'Rotate around the Z axis', formalName: 'Z-axis rotation' }
  },
  circuits: {
    title: 'Circuits',
    subtitle: 'Classical gates combine bits with strict rules; quantum circuits walk a qubit through a route of gates, picking up rotations — pick a builder below',
    classicalCircuit: 'Classical Circuit',
    quantumCircuit: 'Quantum Circuit',
    compareHalfAdder: 'Compare',
    gatePalette: 'Gate Palette — click to add',
    circuitWire: 'Circuit Wire',
    whatsGoingOn: 'What\'s going on',
    oneQubit: '1 Qubit',
    twoQubits: '2 Qubits',
    threeQubits: '3 Qubits',
    outputState: 'Output State',
    targetQubit2: 'Target Qubit — new gates apply to',
    gatePaletteTarget: 'Gate Palette — click to add to target qubit',
    circuitDiagram: 'Circuit Diagram',
    outputState2Q: 'Output State (2 Qubits)',
    perQubitBlochSpheres: 'Per-Qubit Bloch Spheres — shrink toward center when entangled',
    targetQubit3: 'Target Qubit — new single-qubit gates apply to',
    addCnot: 'Add CNOT',
    addToffoli: 'Add Toffoli (2 controls → 1 target)',
    outputState3Q: 'Output State (3 Qubits)',
    runHistory: 'Run History — click a step to revisit it',
    gatePaletteDrag: 'Gate Palette — drag onto the circuit (or click, then click the circuit)',
    halfAdderCircuit: 'Circuit — drag gates here, A and B wire into every one',
    sum: 'Sum',
    carry: 'Carry',
    truthTableHalfAdder: 'Target Truth Table — A, B → Sum, Carry',
    halfAdderCompareTitle: 'Classical vs Quantum — Same Half Adder',
    halfAdderCompareBody: 'The classical circuit reaches Sum/Carry with AND/XOR gates. The quantum circuit above (shown for A=1, B=1) reaches the exact same two numbers using only reversible gates: X gates set q0=A and q1=B, two CNOTs copy their XOR into ancilla q2 for Sum = A⊕B, and a Toffoli copies their AND into ancilla q3 for Carry = A·B — then q2 and q3 are measured out. You can build a related reversible half adder yourself, gate by gate, under Quantum Circuit → 3 Qubits → Try me → Half Adder.',
    compareClassicalDesc: 'XOR and AND gates, wired straight to A and B',
    compareQuantumDesc: 'X, CNOT and Toffoli — reversible gates reaching the same answer',
    sumClassical: 'Sum (Classical)',
    carryClassical: 'Carry (Classical)',
    sumQuantum: 'Sum (Quantum)',
    carryQuantum: 'Carry (Quantum)'
  },
  common: {
    run: '▶ Run',
    running: 'running…',
    clear: 'Clear',
    add: 'Add',
    reset: 'Reset',
    controls: 'Controls',
    detector: 'Detector',
    tryMe: 'Try me',
    tryMePresets: '🎲 Try me — preset circuits',
    classical: 'Classical',
    quantum: 'Quantum',
    stateVector: 'State Vector',
    copyShareableLink: 'Copy shareable link',
    basisStates: 'Basis States',
    possibleStates: 'Possible states',
    uncertainty: 'Uncertainty',
    uncertaintyFundamental: 'Fundamental — until measured',
    representation: 'Representation',
    output: 'Output',
    whatJustHappened: 'What just happened',
    truthTable: 'Truth Table',
    appliedSequence: 'Applied Sequence',
    gate: 'Gate',
    input: 'Input'
  },
  mathsTab: {
    complexNumbers: 'Complex Numbers',
    vectors: 'Vectors',
    matrices: 'Matrices',
    stateVector: 'State Vector',
    diracNotation: 'Dirac Notation',
    tensorProducts: 'Tensor Products'
  },
  gatesTab: {
    classical: 'Classical',
    quantum: 'Quantum',
    compare: 'Compare'
  },
  roadmap: {
    title: 'Quantum Concepts',
    subtitle: 'Click any concept to open its simulation',
    conceptMap: 'Concept Map',
    myProgress: 'My Progress',
    lessonsCompleted: 'Lessons Completed',
    quickCheckScore: 'Quick Check Score',
    lessonChecklist: 'Lesson Checklist',
    resetProgress: 'Reset progress',
    read: 'read',
    markUnread: 'Mark unread',
    markAsRead: 'Mark as read',
    start: 'Start →',
    quickCheck: 'Quick check',
    correct: 'correct',
    review: 'review',
    notAttempted: 'Not attempted yet.',
    quizScoreSummary: '{correct} / {answered} quick checks correct so far ({total} concepts total).',
    centerTooltip: '{count} core quantum computing concepts, from a single qubit to entanglement and wave interference — click any topic to explore it.'
  },
  mindmap: {
    quantumWorld: 'Quantum World',
    introduction: 'Introduction',
    classical: 'Classical',
    quantum: 'Quantum',
    oneQubit: 'One Qubit',
    twoQubits: 'Two Qubits',
    threeQubits: 'Three Qubits'
  },
  intro: {
    title: 'Introduction',
    subtitle: 'New to quantum computing? Start here — no physics or programming background needed.',
    classicalTitle: 'INTRODUCTION TO QUANTUM COMPUTING?',
    classicalBody: 'Before learning about quantum computers, let\'s start with classical computers. Your phone and computer use bits to process information. A bit has only two possible states: <b>0 (OFF) and 1 (ON)</b>',
    whatIsTitle: 'WHAT IS QUANTUM COMPUTING?',
    whatIsBody: 'Quantum computing uses the principles of quantum mechanics to solve certain problems faster than classical computers.',
    bitsToQubitsTitle: 'From Bits to Qubits',
    bitsToQubitsBody: 'Unlike a bit, which is either 0 or 1, a qubit can exist in both states at the same time. This is called superposition.',
    superpositionTitle: 'Superposition: Multiple Possibilities',
    superpositionBody: 'Imagine flipping a coin. While it\'s spinning, it represents both heads and tails. Similarly, a qubit can represent both 0 and 1 until it is measured.',
    entanglementTitle: 'Entanglement: Connected Quantum Information',
    entanglementBody: 'Entanglement links two or more qubits together. Changes to one qubit are correlated with the others, allowing quantum computers to process information in powerful new ways.',
    whyMattersTitle: 'Why Quantum Computing Matters',
    whyMattersBody: 'Quantum computers are not designed to replace laptops or smartphones. They are built to solve complex problems, such as: <ul class="quantum-list"><li>🧪 Simulating molecules</li><li>⚙️ Optimizing large systems</li><li>🔐 Improving cryptography</li><li>🌦️ Solving complex scientific and engineering problems</li></ul>',
    howAppWorksTitle: 'How this app works',
    howAppWorksBody: 'Each tab combines a short lesson with an interactive simulation and a quick check. Explore concepts by moving Bloch spheres, applying gates, and running circuits while seeing results update in real time. Your progress is tracked as you learn.',
    suggestedPath: 'Suggested learning path'
  },
  // Static glossary page (tab-important-concepts in index.html) — no
  // simulation, no ROADMAP_LESSONS entry. mechanicsGroupTitle/computingGroupTitle
  // head the two .intro-glossary-grid sections; every other key is a
  // <Term>Title/<Term>Body pair for one glossary card.
  concepts: {
    title: 'Important Concepts',
    subtitle: 'A glossary of the essential ideas behind quantum mechanics and quantum computing — the vocabulary the rest of this app builds on.',
    searchPlaceholder: 'Search concepts…',
    searchNoResults: 'No concepts match "{query}".',
    mechanicsGroupTitle: 'Quantum Mechanics Fundamentals',
    computingGroupTitle: 'Quantum Computing Concepts',
    superpositionTitle: 'Superposition',
    superpositionBody: 'A quantum system can exist in a combination of multiple states at once, rather than being locked into just one — like a qubit being part |0⟩ and part |1⟩ simultaneously. It\'s not that the system is secretly in one state and we just don\'t know which; the combination is the actual physical state, until a measurement forces it to commit to an outcome.',
    waveParticleTitle: 'Wave-Particle Duality',
    waveParticleBody: 'Every quantum object — electrons, photons, even qubits — behaves like a wave in some experiments (spreading out, interfering with itself) and like a discrete particle in others (arriving at a detector as one localized click). Which behavior shows up depends on what you measure, not on the object switching identities.',
    quantumStateTitle: 'Quantum State (Wavefunction)',
    quantumStateBody: 'The complete mathematical description of a quantum system — everything that can ever be predicted about it, encoded in a set of complex amplitudes. For a qubit, that\'s the two-amplitude state vector |ψ⟩ = α|0⟩ + β|1⟩ explored throughout this app\'s Bits & Qubits and Maths Concept tabs.',
    bornRuleTitle: 'The Born Rule',
    bornRuleBody: 'The rule connecting a quantum state\'s amplitudes to measurement probabilities: squaring the size of an amplitude gives the chance of observing that outcome. For a qubit α|0⟩ + β|1⟩, that\'s P(0) = |α|² and P(1) = |β|² — see the Measure tab for this in action.',
    collapseTitle: 'Wavefunction Collapse',
    collapseBody: 'The moment a measurement happens, a quantum state stops being a mix of possibilities and becomes one definite outcome — irreversibly. The other possibilities aren\'t hidden somewhere; they\'re simply gone, which is what makes quantum measurement fundamentally different from just checking a value that was already fixed.',
    uncertaintyTitle: 'Heisenberg Uncertainty Principle',
    uncertaintyBody: 'Certain pairs of properties — like a particle\'s position and momentum — can never both be known to arbitrary precision at the same time. This isn\'t a limitation of our instruments; it\'s a built-in feature of how quantum states are described.',
    entanglementTitle: 'Quantum Entanglement',
    entanglementBody: 'Quantum entanglement is a phenomenon in which two or more quantum particles become linked so that the state of one particle cannot be described independently of the others, even when they are separated by large distances. Instead, they share a single joint quantum state.'
      + '<br><br>Measuring one of the entangled particles instantly reveals what the others will show, no matter how far apart they are — yet no signal or energy actually travels between them at the moment of measurement. This can look like faster-than-light communication, but it isn\'t: each individual measurement outcome is still genuinely random, so there\'s no way to encode a message using entanglement alone. Explored in depth on the Entangle tab.',
    interferenceTitle: 'Quantum Interference',
    interferenceBody: 'When a quantum system has more than one indistinguishable path to the same outcome, the paths\' amplitudes combine — reinforcing each other in some places and canceling out in others — producing patterns (like the stripes in the double-slit experiment) that neither path could produce alone. See the Interference and Beam Splitter tabs.',
    tunnelingTitle: 'Quantum Tunneling',
    tunnelingBody: 'A quantum particle has a nonzero chance of appearing on the far side of an energy barrier it classically shouldn\'t be able to cross, because its wavefunction doesn\'t stop dead at the barrier — it decays through it instead of bouncing off. See the Tunnel tab for an interactive wave packet hitting a barrier.',
    decoherenceTitle: 'Decoherence',
    decoherenceBody: 'The process by which a quantum system\'s fragile superposition and entanglement leak away through unavoidable interaction with its surrounding environment, making it behave more and more like a classical system. It\'s the main practical obstacle to building large, reliable quantum computers.',
    schrodingerTitle: 'The Schrödinger Equation',
    schrodingerBody: 'The master equation of quantum mechanics — it describes exactly how a quantum state evolves smoothly over time, the same way Newton\'s laws describe how a classical object moves. Every quantum gate in this app is really just a snapshot of this equation\'s evolution over a fixed slice of time, which is also why gates are reversible: the equation never destroys information, only reshapes it.',
    bellTheoremTitle: 'Bell\'s Theorem & the EPR Paradox',
    bellTheoremBody: 'Einstein, Podolsky, and Rosen argued in 1935 that quantum mechanics must be incomplete — entangled particles\' correlations, they reasoned, could be explained by some shared "hidden variable" fixed in advance, without any real spookiness. Bell\'s theorem (1964) proved this wrong: no theory based on hidden variables can ever reproduce every correlation quantum mechanics predicts, and decades of experiments have confirmed quantum mechanics\' predictions, not the hidden-variable ones.',
    zenoTitle: 'Quantum Zeno Effect',
    zenoBody: 'Measuring a quantum system frequently enough can effectively freeze its evolution — each measurement collapses the state back toward what it already was, before it has a chance to evolve away. Named after Zeno\'s paradox of the arrow that never seems to move, it\'s a direct consequence of wavefunction collapse: a "watched" quantum state changes far more slowly than an unwatched one.',
    hilbertSpaceTitle: 'Hilbert Space',
    hilbertSpaceBody: 'The mathematical "space" where every quantum state lives. Each possible quantum state is represented as a vector in a Hilbert space, and the rules of quantum mechanics — superposition, measurement, and evolution — are all expressed as operations on these vectors. A single qubit lives in a two-dimensional Hilbert space, while an n-qubit system lives in a 2ⁿ-dimensional one.',
    linearOperatorsTitle: 'Linear Operators',
    linearOperatorsBody: 'Physical quantities and quantum gates are represented by linear operators acting on quantum states. Applying an operator transforms one valid quantum state into another, making linear algebra the language of quantum mechanics.',
    observableTitle: 'Observable',
    observableBody: 'An observable is any measurable physical property — such as position, momentum, spin, or energy. Every observable is represented by a Hermitian operator whose eigenvalues are the only measurement outcomes that can ever occur.',
    eigenstatesTitle: 'Eigenstates & Eigenvalues',
    eigenstatesBody: 'If measuring an observable always produces the same result for a particular quantum state, that state is an eigenstate of the observable. The measurement result is the corresponding eigenvalue. Measuring an eigenstate leaves it unchanged, whereas measuring a superposition generally causes wavefunction collapse.',
    expectationValueTitle: 'Expectation Value',
    expectationValueBody: 'Rather than predicting one definite measurement result, quantum mechanics predicts the average value obtained after repeating the same experiment many times on identically prepared systems. This average is called the expectation value.',
    probabilityAmplitudesTitle: 'Probability Amplitudes',
    probabilityAmplitudesBody: 'Unlike ordinary probabilities, quantum mechanics assigns complex probability amplitudes to possible outcomes. These amplitudes can interfere constructively or destructively, and only their squared magnitudes become observable probabilities through the Born Rule.',
    phaseTitle: 'Phase',
    phaseBody: 'A quantum state\'s phase is invisible in a single measurement but determines how amplitudes interfere. Relative phase — not absolute phase — is what gives quantum interference and many quantum algorithms their power.',
    globalPhaseTitle: 'Global Phase vs Relative Phase',
    globalPhaseBody: 'Multiplying an entire quantum state by the same complex phase changes nothing physically; this is called a global phase. Changing the phase between components of a superposition changes observable interference patterns and therefore has physical consequences.',
    spinTitle: 'Spin',
    spinBody: 'Spin is an intrinsic form of angular momentum carried by quantum particles. Unlike ordinary rotation, spin is a fundamental quantum property that comes only in discrete values. Electron spin is the physical realization of many experimental qubits.',
    pauliExclusionTitle: 'Pauli Exclusion Principle',
    pauliExclusionBody: 'No two identical fermions can occupy the same quantum state simultaneously. This simple rule explains the structure of atoms, chemistry, and why matter remains stable.',
    identicalParticlesTitle: 'Identical Particles',
    identicalParticlesBody: 'Particles of the same type are fundamentally indistinguishable. Swapping two identical particles does not create a new physical state — it only changes the wavefunction by a sign (fermions) or not at all (bosons).',
    bosonsFermionsTitle: 'Bosons & Fermions',
    bosonsFermionsBody: 'Bosons can share the same quantum state, allowing phenomena like lasers and Bose–Einstein condensates. Fermions obey the Pauli exclusion principle, giving rise to atomic structure and electronic materials.',
    densityMatrixTitle: 'Density Matrix',
    densityMatrixBody: 'Not every quantum system is perfectly isolated. A density matrix describes both pure quantum states and statistical mixtures, making it the standard tool for describing noisy or partially known quantum systems.',
    mixedStatesTitle: 'Mixed States',
    mixedStatesBody: 'Unlike a superposition, which is genuinely quantum, a mixed state represents classical uncertainty about which quantum state a system is actually in. Density matrices distinguish between these two very different situations.',
    measurementBasisTitle: 'Measurement Basis',
    measurementBasisBody: 'A quantum measurement is always made relative to a chosen basis. The same state may look definite in one basis but exist as a superposition in another, making basis choice central to quantum computing.',
    sternGerlachExpTitle: 'Stern–Gerlach Experiment',
    sternGerlachExpBody: 'The Stern–Gerlach experiment (1922), performed by Otto Stern and Walther Gerlach, demonstrated that angular momentum is quantized — showing that particles such as electrons possess an intrinsic property called spin that can only take discrete values when measured along a chosen axis. It\'s one of the foundational experiments of quantum mechanics.'
      + '<ul class="quantum-list">'
      + '<li><b>Objective:</b> to determine whether an atom\'s magnetic moment could point in any direction, as classical physics predicted, or only in specific, quantized orientations.</li>'
      + '<li><b>Why silver atoms?</b> Silver has a single unpaired outer electron and effectively zero net orbital angular momentum, so the measured magnetic moment comes almost entirely from that one electron\'s spin — making the result far easier to interpret.</li>'
      + '<li><b>Classical prediction:</b> a randomly-oriented magnetic moment should deflect by any amount, smearing the beam into a continuous band on the screen.</li>'
      + '<li><b>What was actually observed:</b> the beam split into exactly two distinct spots, not a continuous band — showing only two spin orientations are possible along the measurement axis, spin up (+ħ/2) and spin down (−ħ/2).</li>'
      + '</ul>'
      + 'Explore this yourself, including what happens when you measure spin along a second, incompatible axis, on the Stern–Gerlach tab.',
    eprParadoxTitle: 'EPR Paradox',
    eprParadoxBody: 'The EPR paradox (1935), proposed by Albert Einstein, Boris Podolsky, and Nathan Rosen, is a thought experiment arguing that quantum mechanics, as it stood, must be an incomplete description of physical reality — not because its predictions were wrong, but because of what those predictions seemed to imply.'
      + '<ul class="quantum-list">'
      + '<li><b>Objective:</b> to show that if quantum mechanics is correct and "local realism" holds — that a particle has definite properties independent of measurement, and no influence travels faster than light — then quantum mechanics must be missing something.</li>'
      + '<li><b>The setup:</b> two particles are prepared in an entangled state and separated by an arbitrarily large distance. Measuring a property of one instantly tells you the corresponding property of the other, with certainty.</li>'
      + '<li><b>The argument:</b> since measuring particle A lets you predict particle B\'s outcome with certainty without ever touching B, EPR reasoned that property of B must already have been fixed before the measurement — otherwise measuring A would have to instantly affect B, which looked like "spooky action at a distance."</li>'
      + '<li><b>The paradox:</b> quantum mechanics says the two particles share one undetermined joint state right up until measurement. EPR\'s own reasoning said that\'s impossible if locality holds — so either quantum mechanics is incomplete, or nature really is nonlocal in this specific sense.</li>'
      + '</ul>'
      + 'For thirty years this stayed a question of interpretation with no experimental answer — until Bell\'s Theorem (see above) turned it into a testable one, and the experiments came down decisively against Einstein\'s hidden-variable intuition.',
    qubitTitle: 'Qubit',
    qubitBody: 'The basic unit of quantum information — like a classical bit, but able to exist in a superposition of 0 and 1 rather than being locked to one value. A qubit\'s exact state is described by two complex amplitudes and visualized as a point on the Bloch sphere, explored on the Bits & Qubits tab.',
    blochSphereTitle: 'Bloch Sphere',
    blochSphereBody: 'A geometric picture of every possible single-qubit state as a point on the surface of a sphere — the north and south poles are |0⟩ and |1⟩, and every other point is some superposition of the two. It turns the abstract algebra of amplitudes into something you can literally see and drag around.',
    gateTitle: 'Quantum Gate',
    gateBody: 'The quantum equivalent of a classical logic gate — an operation that transforms a qubit\'s state, geometrically a rotation of its point on the Bloch sphere. Unlike classical gates, every quantum gate is reversible: none of them ever throw information away. See the Gates tab for the six fixed gates (H, X, Y, Z, S, T) and their effects.',
    unitarityTitle: 'Unitarity & Reversibility',
    unitarityBody: 'Every valid quantum gate must be a unitary matrix (U†U = I) — the mathematical condition that guarantees it preserves total probability and can always be undone by its own conjugate transpose. This is why quantum computation, unlike classical AND/OR logic, never destroys information along the way.',
    circuitTitle: 'Quantum Circuit',
    circuitBody: 'A sequence of quantum gates applied to one or more qubits, read left to right — the quantum equivalent of a classical logic circuit. Because gate order generally matters (rotations don\'t commute), the same set of gates in a different sequence can land the qubits in an entirely different final state; build one yourself on the Circuits tab.',
    bellGhzTitle: 'Bell States & GHZ States',
    bellGhzBody: 'Bell states are the four specific, maximally entangled two-qubit states — Φ⁺, Φ⁻, Ψ⁺, and Ψ⁻ — forming a foundational orthonormal basis in quantum information and the core resource behind protocols like quantum teleportation and superdense coding. All four are produced by the same two-gate recipe (a Hadamard on one qubit, then a CNOT controlled by it), just starting from a different one of the four two-qubit basis states.'
      + '<br><br>The four Bell states are:'
      + '<ul class="quantum-list">'
      + '<li><b>Φ⁺ = (|00⟩ + |11⟩)/√2</b> — qubits match and stay in phase.</li>'
      + '<li><b>Φ⁻ = (|00⟩ − |11⟩)/√2</b> — qubits match, with a phase flip.</li>'
      + '<li><b>Ψ⁺ = (|01⟩ + |10⟩)/√2</b> — qubits are opposite and in phase.</li>'
      + '<li><b>Ψ⁻ = (|01⟩ − |10⟩)/√2</b> — qubits are opposite, with a phase flip.</li>'
      + '</ul>'
      + 'Measuring one qubit in any of the four instantly determines the other\'s outcome. GHZ states generalize the same idea to three or more qubits, all correlated together — build Bell pairs and GHZ triples from scratch with Hadamard and CNOT gates on the Circuits tab.',
    noCloningTitle: 'No-Cloning Theorem',
    noCloningBody: 'It\'s physically impossible to create an exact, independent copy of an arbitrary unknown quantum state — a direct consequence of quantum mechanics being linear. This is why quantum information has to be handled so differently from classical bits, which can always be freely copied.',
    algorithmsTitle: 'Quantum Algorithms',
    algorithmsBody: 'Step-by-step procedures built from quantum gates that exploit superposition and interference to solve certain problems dramatically faster than any known classical algorithm — Shor\'s algorithm factors large numbers efficiently, and Grover\'s algorithm searches an unsorted list quadratically faster than any classical search.',
    errorCorrectionTitle: 'Quantum Error Correction',
    errorCorrectionBody: 'A set of techniques for protecting fragile quantum information from decoherence and noise by spreading a single logical qubit\'s state redundantly across many physical qubits, without ever directly measuring — and so collapsing — the information itself. One of the central engineering challenges standing between today\'s noisy quantum computers and large-scale, reliable ones.',
    supremacyTitle: 'Quantum Supremacy / Advantage',
    supremacyBody: 'The milestone at which a quantum computer performs a specific task faster than any classical supercomputer could feasibly manage — "supremacy" for a (possibly contrived) benchmark task, "advantage" for a practically useful one. It demonstrates that quantum effects can be harnessed for real computational power, not just simulated on a classical machine.',
    teleportationTitle: 'Quantum Teleportation',
    teleportationBody: 'A protocol for transferring an unknown qubit\'s exact state to a distant qubit, using a shared entangled pair plus two classical bits of communication — without ever measuring (and so destroying) the original state directly. Despite the name, nothing travels faster than light: the receiver can\'t reconstruct the state until the ordinary classical bits arrive, and the original qubit\'s state is unavoidably destroyed in the process, consistent with the No-Cloning Theorem.',
    qkdTitle: 'Quantum Cryptography (QKD)',
    qkdBody: 'Quantum key distribution lets two parties agree on a shared secret key with security guaranteed by physics rather than computational difficulty — protocols like BB84 encode key bits in qubit states such that any eavesdropper\'s measurement unavoidably disturbs them, exposing the intrusion. It\'s a direct practical payoff of the No-Cloning Theorem: an eavesdropper can\'t secretly copy the qubits to inspect them undetected.',
    qftTitle: 'Quantum Fourier Transform (QFT)',
    qftBody: 'The quantum analog of the classical discrete Fourier transform, implemented as a quantum circuit that runs exponentially faster than any classical equivalent. It\'s the key subroutine inside Shor\'s algorithm — the step that extracts the hidden periodicity used to factor large numbers — and appears throughout quantum algorithms wherever a hidden pattern needs to be read out of a superposition.',
    tensorProductTitle: 'Tensor Product',
    tensorProductBody: 'Multiple qubits combine through the tensor product rather than ordinary addition. Two qubits therefore require four amplitudes, three qubits require eight, and n qubits require 2ⁿ, which is the origin of quantum computing\'s enormous state space.',
    multiQubitStatesTitle: 'Multi-Qubit States',
    multiQubitStatesBody: 'A system of several qubits cannot always be described as independent single-qubit states. Some states factor into separate qubits, while others become entangled and require one combined description.',
    controlledGatesTitle: 'Controlled Gates',
    controlledGatesBody: 'Controlled gates perform an operation only when another qubit has a particular value. The CNOT gate is the simplest example and is the essential building block for creating entanglement.',
    swapGateTitle: 'SWAP Gate',
    swapGateBody: 'The SWAP gate exchanges the quantum states of two qubits without measuring them. It is widely used to move information around a quantum processor.',
    universalGateSetsTitle: 'Universal Gate Sets',
    universalGateSetsBody: 'A small collection of gates is sufficient to approximate any quantum computation to arbitrary accuracy. Examples include {H, T, CNOT} and {Rx, Ry, CNOT}.',
    quantumParallelismTitle: 'Quantum Parallelism',
    quantumParallelismBody: 'Because a quantum computer can prepare a superposition of many inputs simultaneously, one operation acts on all of them at once. The challenge is extracting useful information through interference rather than trying to read every result.',
    oracleTitle: 'Oracle',
    oracleBody: 'Many quantum algorithms treat part of a problem as a black-box function called an oracle. The algorithm gains speed by querying the oracle in quantum superposition.',
    ancillaQubitsTitle: 'Ancilla Qubits',
    ancillaQubitsBody: 'Ancilla qubits are temporary helper qubits used during computations, error correction, and arithmetic before being reset or discarded.',
    quantumMeasurementTitle: 'Quantum Measurement',
    quantumMeasurementBody: 'Although measurement appears earlier, quantum computing treats it operationally. Measuring a qubit converts fragile quantum information into an ordinary classical bit, ending coherent evolution.',
    midCircuitMeasurementTitle: 'Mid-Circuit Measurement',
    midCircuitMeasurementBody: 'Some quantum computers allow measurements during computation rather than only at the end. Later gates can depend on these measurement outcomes, enabling error correction and adaptive algorithms.',
    classicalFeedforwardTitle: 'Classical Feedforward',
    classicalFeedforwardBody: 'Measurement results obtained during a quantum circuit can determine which later gates should be applied, combining classical control with quantum evolution.',
    quantumInfoGroupTitle: 'Quantum Information Theory',
    quantumInformationTitle: 'Quantum Information',
    quantumInformationBody: 'Quantum information is information stored in quantum states. Unlike classical information, it can exploit superposition and entanglement, enabling entirely new forms of computation and communication.',
    quantumChannelTitle: 'Quantum Channel',
    quantumChannelBody: 'A quantum channel mathematically describes how quantum information changes while traveling through space or interacting with noise.',
    fidelityTitle: 'Fidelity',
    fidelityBody: 'Fidelity measures how similar two quantum states are. It is widely used to benchmark quantum hardware, gates, and error correction.',
    traceDistanceTitle: 'Trace Distance',
    traceDistanceBody: 'Trace distance quantifies how distinguishable two quantum states are. It gives the maximum probability of telling them apart using any possible measurement.',
    entanglementEntropyTitle: 'Entanglement Entropy',
    entanglementEntropyBody: 'A numerical measure of how strongly different parts of a quantum system are entangled. It plays a central role in condensed matter physics, quantum field theory, and quantum gravity.',
    stateTomographyTitle: 'Quantum State Tomography',
    stateTomographyBody: 'A technique for reconstructing an unknown quantum state by making many measurements in different bases.',
    processTomographyTitle: 'Process Tomography',
    processTomographyBody: 'Rather than reconstructing a state, process tomography reconstructs an unknown quantum gate or operation by studying how it transforms many known input states.',
    advancedGroupTitle: 'Advanced Quantum Computing',
    vqeQaoaTitle: 'Variational Quantum Algorithms (VQE & QAOA)',
    vqeQaoaBody: 'Variational quantum algorithms are hybrid quantum–classical algorithms in which a quantum computer prepares parameterized quantum states while a classical computer repeatedly adjusts those parameters to optimize a desired objective. This iterative feedback loop makes them well suited to today\'s noisy quantum hardware (NISQ devices).'
      + '<br><br>The two best-known examples are:'
      + '<ul class="quantum-list">'
      + '<li><b>Variational Quantum Eigensolver (VQE):</b> Designed to estimate the lowest-energy (ground) state of a quantum system. It is widely used in quantum chemistry, materials science, and Hamiltonian simulation to study molecules and quantum materials.</li>'
      + '<li><b>Quantum Approximate Optimization Algorithm (QAOA):</b> Designed to find high-quality approximate solutions to difficult combinatorial optimization problems, such as routing, scheduling, graph partitioning, and portfolio optimization, by alternating between problem-specific and mixing quantum operations.</li>'
      + '</ul>'
      + 'VQE and QAOA are among the most promising quantum algorithms for today\'s noisy intermediate-scale quantum (NISQ) computers because they reduce the depth of quantum circuits while leveraging classical optimization.',
    nisqTitle: 'NISQ Computing',
    nisqBody: 'The current era of quantum computers is called the Noisy Intermediate-Scale Quantum (NISQ) era: devices contain tens to thousands of imperfect qubits but cannot yet run fully fault-tolerant algorithms.',
    faultTolerantTitle: 'Fault-Tolerant Quantum Computing',
    faultTolerantBody: 'A future generation of quantum computers capable of performing arbitrarily long computations despite hardware errors through quantum error correction.',
    surfaceCodeTitle: 'Surface Code',
    surfaceCodeBody: 'The leading quantum error-correcting code, encoding one logical qubit into many physical qubits arranged on a two-dimensional lattice.',
    logicalPhysicalQubitsTitle: 'Logical vs Physical Qubits',
    logicalPhysicalQubitsBody: 'Physical qubits are the hardware qubits that suffer from noise. Logical qubits are protected, error-corrected qubits encoded across many physical ones.',
    magicStatesTitle: 'Magic States',
    magicStatesBody: 'Certain quantum gates cannot be implemented directly in many fault-tolerant architectures. Instead, specially prepared "magic states" are consumed to perform them, making magic-state distillation one of the largest costs in scalable quantum computing.',
    hamiltonianSimulationTitle: 'Hamiltonian Simulation',
    hamiltonianSimulationBody: 'One of quantum computing\'s original motivations: efficiently simulating the dynamics of molecules, materials, and quantum field theories governed by a Hamiltonian. Many researchers — including those working on lattice field theories and quantum chemistry — consider this one of the most important long-term applications of quantum computers.',
    qpeTitle: 'Quantum Phase Estimation (QPE)',
    qpeBody: 'A foundational quantum algorithm for estimating the eigenvalues of unitary operators. It underpins Shor\'s algorithm and many algorithms for quantum chemistry and Hamiltonian simulation.',
    adiabaticQCTitle: 'Adiabatic Quantum Computing',
    adiabaticQCBody: 'A computational model in which the system remains in its ground state while its Hamiltonian changes slowly. If the evolution is slow enough, the final ground state encodes the solution to an optimization problem.',
    mbqcTitle: 'Measurement-Based Quantum Computing',
    mbqcBody: 'Instead of computing primarily with gates, computation proceeds by preparing a large entangled resource state (a cluster state) and then performing carefully chosen measurements. The measurements themselves drive the computation.'
  },
  measure: {
    title: 'Measurement',
    subtitle: 'The bars below are odds, not a preview — measuring forces the qubit to answer a question it was genuinely undecided about, and there\'s no taking it back',
    quantumState: 'Quantum State',
    measureButton: 'MEASURE',
    postulateTitle: 'The Measurement Postulate',
    postulateBody1: 'This isn\'t just an app simplification — it\'s one of the axioms of quantum mechanics. Measuring a qubit |ψ⟩ = α|0⟩ + β|1⟩ returns 0 with probability |α|² and 1 with probability |β|² (the Born rule), and immediately afterward the state has collapsed to whichever outcome came up — the other possibility is simply gone, not just hidden.',
    postulateFormula: 'P(0) = |α|²&nbsp;&nbsp;&nbsp; P(1) = |β|²&nbsp;&nbsp;&nbsp; α|0⟩ + β|1⟩ → |0⟩ or |1⟩',
    postulateBody2: 'Note what\'s absent: nothing in this rule says which outcome you\'ll get on any single run — only the odds across many identical qubits, which is exactly what the histogram below is for.',
    measurementStatistics: 'Measurement Statistics',
    confirmOddsBody: 'This is the only way to actually confirm those odds — ask the same question of many identical qubits and watch the histogram settle into the predicted split. A single qubit only ever gives you one answer; the pattern only shows up across a crowd.',
    unmeasured: 'Unmeasured',
    measuring: 'Measuring…'
  },
  entangle: {
    title: 'Quantum Entanglement',
    subtitle: 'Bell state (|00⟩ + |11⟩)/√2 — neither qubit has a definite state alone; measuring one instantly determines the other',
    bannerAlt: 'Illustration of the coin-flip analogy for quantum entanglement: two people each flip a coin at separate detectors, connected by a glowing sphere of correlation cones — whichever way Coin A lands, Coin B instantly lands the opposite way, with the state indeterminate until measured.',
    jointStateLabel: 'joint state of both qubits',
    explainerTitle: 'What Is Quantum Entanglement?',
    explainerBody1: 'Quantum entanglement is a phenomenon in which two or more particles become linked so that their quantum states can no longer be described independently of one another — even when the particles are separated by enormous distances. Instead of two separate qubits each carrying their own state, the pair shares a single joint state, like the Bell state (|00⟩ + |11⟩)/√2 shown above: a 50/50 mix of "both measured 0" and "both measured 1," with no way to break it down into what qubit A or qubit B is doing on its own.',
    explainerBody2: 'Entanglement isn\'t produced by some mysterious force reaching between the particles — it\'s created locally, the moment two qubits interact (here, with a Hadamard gate followed by a CNOT — build the same recipe gate by gate on the Circuits tab), and it persists afterward no matter how far apart the qubits later travel. Einstein famously called the resulting correlations "spooky action at a distance," since measuring one qubit appears to instantly affect the other.',
    explainerBody3: 'The two cards below work out the details behind that intuition: why a state like this genuinely can\'t be described as two separate qubits, and why the instant correlation still can\'t be used to send a signal faster than light.',
    mapCaption: 'Two different locations, arbitrarily far apart — the correlation holds regardless of the distance between them.',
    entangledLabel: 'Entangled',
    measureBoth: 'Measure Both',
    measureAOnly: 'Measure A Only',
    tensorTitle: 'Why Isn\'t This Just Two Qubits? (Tensor Products)',
    tensorBody1: 'Two independent qubits always combine by <span class="key-term">tensor product</span> (⊗): stack qubit A\'s 2-entry vector against qubit B\'s, multiplying every pair of entries to build a 4-entry joint vector. Every product state — anything you could build in the Two Qubit panel on the Bits & Qubits tab — factors apart into two separate qubits this way:',
    tensorFormula1: '|0⟩⊗|0⟩ = [1,0]<sup>T</sup>⊗[1,0]<sup>T</sup> = [1,0,0,0]<sup>T</sup> = |00⟩',
    tensorBody2: 'The Bell state above is also a 4-entry vector — [1,0,0,1]<sup>T</sup>/√2 — but try to factor it back into [a,b]<sup>T</sup>⊗[c,d]<sup>T</sup> = [ac,ad,bc,bd]<sup>T</sup> and there\'s no solution: <em>ad</em> = 0 and <em>bc</em> = 0 force one of each pair to be zero, which would also zero out <em>ac</em> or <em>bd</em> — no single-qubit states A and B multiply together to reproduce it.',
    tensorFormula2: '(|00⟩ + |11⟩) / √2 = [1, 0, 0, 1]ᵀ/√2 ≠ [a,b]ᵀ ⊗ [c,d]ᵀ for any a, b, c, d',
    tensorBody3: 'That\'s the literal, checkable definition of entanglement: a joint state that can\'t be split back into two independent single-qubit factors. Neither qubit alone has a well-defined state — only the pair does.',
    relativityTitle: 'Why This Doesn\'t Break Relativity',
    relativityBody1: 'This setup is a version of the Einstein-Podolsky-Rosen (EPR) thought experiment: Alice measures Qubit A and instantly knows Qubit B\'s outcome, even if B is light-years away. It looks like faster-than-light signaling — but it isn\'t.',
    relativityBody2: 'Alice can\'t choose which outcome she gets — that\'s still random, same 50/50 odds as any single qubit. So there\'s nothing for her to control, and therefore nothing she can encode into a message. The correlation is only visible after the fact, once Alice and Bob compare notes over an ordinary (slower-than-light) channel. No energy, no information, and no signal actually crosses the distance between them at the moment of measurement.',
    cernTitle: 'Why CERN Cares About Entanglement',
    cernBody1: 'This isn\'t only a teaching example. Physicists at the LHC have measured genuine quantum entanglement directly in the particles produced by proton-proton collisions — most notably between a top quark and its antiquark, created and decaying within a fraction of a trillionth of a trillionth of a second. The same Bell-state math on this page, (|00⟩ + |11⟩)/√2, describes a real, measured correlation in the highest-energy environment humans have ever built.',
    cernBody2: 'CERN\'s Quantum Technology Initiative treats entanglement and superposition as engineering resources, not just curiosities: quantum computers for simulating the quantum field theories behind particle physics itself — a problem classical computers scale badly on — and quantum sensors built from entangled or squeezed states, aimed at the kind of extreme-precision measurements that searches for dark matter and other new physics depend on.'
  },
  bellstates: {
    title: 'Bell States',
    subtitle: 'The four maximally entangled two-qubit states — pick one to see how it\'s built, how it\'s classified, and exactly what it predicts',
    pickTitle: 'Choose a Bell State',
    circuitTitle: 'Circuit Diagram',
    animStart: 'Both qubits start at |0⟩ — watch the value on each wire as it moves through the gates.',
    animFlipA: 'X flips qubit A: 0 → 1.',
    animFlipB: 'X flips qubit B: 0 → 1.',
    animNoFlip: 'This state needs no X gate — both qubits stay at |0⟩ so far.',
    animSuperpose: 'H puts qubit A into a genuine superposition — no longer a definite 0 or 1, both at once.',
    animEntangle: 'CNOT entangles B with A — B is now correlated with A\'s superposition, not independently random.',
    animDone: 'Final state: {formula} — A and B are perfectly correlated: measuring one instantly tells you the other.',
    recipe: {
      phiplus: 'Start at |00⟩, apply H to qubit A, then CNOT (A → B).',
      phiminus: 'Start at |00⟩, apply X to qubit A, then H to qubit A, then CNOT (A → B).',
      psiplus: 'Start at |00⟩, apply X to qubit B, then H to qubit A, then CNOT (A → B).',
      psiminus: 'Start at |00⟩, apply X to both qubits, then H to qubit A, then CNOT (A → B).'
    },
    familyTitle: 'The Bell Family',
    familyBody: 'Every Bell state sits at one of four corners, set by two independent choices: which row (same or opposite measurement outcomes) and which column (a + or − relative phase). Click any corner to prepare it.',
    plusPhase: '+ phase',
    minusPhase: '− phase',
    sameRow: 'Same',
    oppositeRow: 'Opposite',
    distributionTitle: 'Probability Distribution',
    distributionNote: 'Exact Born-rule probabilities for {symbol} — no sampling needed, these follow directly from squaring each amplitude.',
    definitionsTitle: 'The Four Bell States',
    definitionsBody: 'All four are built from the same |00⟩ starting point with the same two-gate recipe — a Hadamard on qubit A, then a CNOT controlled by it — just preceded by an X gate on whichever qubit(s) need flipping first:'
      + '<ul class="quantum-list">'
      + '<li><b>Φ⁺ = (|00⟩ + |11⟩)/√2</b> — no X gates. Outcomes always match.</li>'
      + '<li><b>Φ⁻ = (|00⟩ − |11⟩)/√2</b> — X on qubit A first. Outcomes always match.</li>'
      + '<li><b>Ψ⁺ = (|01⟩ + |10⟩)/√2</b> — X on qubit B first. Outcomes always opposite.</li>'
      + '<li><b>Ψ⁻ = (|01⟩ − |10⟩)/√2</b> — X on both qubits first. Outcomes always opposite.</li>'
      + '</ul>'
      + 'Together they form a complete orthonormal basis for two qubits — the core resource behind quantum teleportation and superdense coding.',
    phaseNoteTitle: 'Why Doesn\'t the Minus Sign Show Up?',
    phaseNoteBody: 'Φ⁺ and Φ⁻ (and likewise Ψ⁺ and Ψ⁻) give identical probability distributions above, because a relative phase — the − sign — doesn\'t change any computational-basis probability, only |amplitude|² does. The two states are still physically distinct: the phase becomes visible the moment you interfere the qubits with each other, for example by applying a Hadamard to each qubit before measuring — that\'s exactly the extra step Bell-inequality tests and superdense coding rely on to tell all four states apart.'
  },
  tunnel: {
    title: 'Quantum Tunneling',
    subtitle: 'Fire a wave packet at a wall taller than its own energy. Classically it always bounces. Quantum mechanically, a piece of it slips through anyway',
    reflected: 'Reflected',
    transmitted: 'Transmitted',
    barrier: 'Barrier',
    fireAgain: '↻ Fire again',
    runHistory: 'Run history',
    clearHistory: 'Clear',
    historyEmpty: 'No completed runs yet.',
    historyCount: '· {count} runs',
    validationNote: 'Solver validated automatically: probability conserved to <0.3% over a full run; transmission correctly falls from >10% at V₀=E to <2% at V₀=2.5E.'
  },
  interference: {
    title: 'Wave Interference',
    subtitle: 'Two open paths and a screen keeping score. Every dot on the right is one particle landing — yet together they paint a wave',
    screen: 'Screen',
    setup: 'Setup',
    doubleSlit: 'Double slit',
    singleSlit: 'Single slit',
    whichPath: 'Which-path',
    wave: 'Wave',
    clearAccumulation: 'Clear accumulation',
    physicsInDetail: 'The Physics, In Detail',
    body1: 'Every dot on the screen is one particle landing at one spot — that part is completely ordinary. What isn\'t ordinary is <em>where</em> those dots are allowed to land. Fire particles at the double slit one at a time, with no way for two particles to ever meet mid-flight, and the dots still pile up into stripes. There\'s no crowd of particles interfering with each other — each individual particle\'s own wavefunction passes through <em>both</em> slits at once and interferes with itself. That\'s the actual mystery here, not just "waves make patterns."',
    formula: 'I(y) = |A<sub>1</sub>(y) + A<sub>2</sub>(y)|² = |A<sub>1</sub>|² + |A<sub>2</sub>|² + 2|A<sub>1</sub>||A<sub>2</sub>|cos φ(y)',
    body2: 'A<sub>1</sub> and A<sub>2</sub> are the amplitudes for "the particle went through slit 1" and "through slit 2," and φ(y) is the extra distance one path travels to reach point y, converted to a phase. Classical probabilities would just add: P = P<sub>1</sub> + P<sub>2</sub>, a flat pile with no stripes. Quantum amplitudes add first and get squared afterward — and squaring a sum produces that <strong>2|A<sub>1</sub>||A<sub>2</sub>|cos φ</strong> cross term, which is positive at some y (bright fringes), negative at others (dark fringes), and is the entire reason stripes exist at all.',
    body3: '<strong>Double slit</strong> — both paths stay open and genuinely indistinguishable, so the cross term survives and you get fringes. <strong>Single slit</strong> — only one amplitude exists at all, so there\'s nothing for it to interfere with; I = |A<sub>1</sub>|², a plain diffraction blob. <strong>Which-path</strong> — both slits are still physically open, but tagging each particle\'s path (the small detector dots on the plate) means a which-path measurement now exists for every hit. Averaged over those measurements the cross term cancels exactly, leaving the flat I = |A<sub>1</sub>|² + |A<sub>2</sub>|² you\'d expect from ordinary particles — two humps, no stripes. Nothing needs to physically jostle the particle for this to happen; merely making the path <em>knowable in principle</em> is enough to erase the pattern.',
    body4: 'That\'s why the ripple animation on the left and the dot-by-dot screen on the right are shown side by side: the ripples are the continuous wave picture that predicts where the cross term is constructive or destructive, and the screen is what actually gets measured — one random, all-or-nothing click at a time. The wave never lands anywhere; only the particle does. The stripes are the wave\'s fingerprint on where the particles were and weren\'t allowed to click.'
  },
  beamsplitter: {
    title: 'Beam Splitter',
    subtitle: 'A single photon hits a 50/50 beam splitter and is randomly reflected to detector A or transmitted to detector B — one photon, one random outcome, never a photon split in half',
    svgAlt: 'Diagram of a photon source firing at a 50/50 beam splitter, randomly reflected up to detector A or transmitted right to detector B. A faint duplicate briefly appears on the path not taken, illustrating the superposition that existed before the photon was detected.',
    photonSource: 'Photon source',
    reflected: 'reflected',
    transmitted: 'transmitted',
    beamSplitterLabel: 'Beam splitter',
    detectorA: 'Photon detector A',
    detectorB: 'Photon detector B',
    firePhoton: 'Fire photon',
    detectorTally: 'Detector Tally'
  },
  sterngerlach: {
    title: 'Stern–Gerlach Experiment',
    subtitle: 'Send atoms one at a time through a magnetic field and watch spin — a purely quantum property — reveal itself as a small number of discrete spots, never a continuous smear',
    definitionTitle: 'What Is Spin?',
    definitionBody1: 'Spin is an intrinsic form of angular momentum carried by every elementary particle and atom — not a literal physical rotation, but a genuine, permanent property present even for a particle with no internal structure to spin. It is quantized: a measurement of spin along any chosen axis can return only one of a small, fixed set of discrete values, never a continuously variable one. For a spin-½ particle, such as the unpaired electron responsible for a silver atom\'s magnetic moment, that measurement has exactly two possible outcomes — conventionally labeled "up" and "down" along the measured axis — with the probability of each fixed by the atom\'s quantum state via the Born rule, the same rule that governs every measurement outcome elsewhere in this app.',
    definitionBody2: 'The Stern–Gerlach experiment (1922) was the first direct observation of this quantization: a beam of silver atoms sent through a magnetic field with a strong spatial gradient split into exactly two discrete spots on a detector screen, rather than the continuous smear a classical, arbitrarily-oriented magnetic moment would have produced. The interactive apparatus below reproduces that same measurement, one atom at a time.',
    svgAlt: 'Diagram of silver atoms entering a Stern-Gerlach magnet with a sharp knife-edge south pole above and a broad curved north pole below, splitting the beam toward an Up or Down outcome. The atoms can come straight from an oven with adjustable input spin, or already pre-measured with the axis of this magnet selectable, to test whether a second measurement disturbs a spin that was already definite.',
    atomSource: 'Oven',
    silverAtomsArrow: 'Silver atoms',
    collimatingSlits: 'Collimating slits',
    magnetLabel: 'Inhomogeneous field',
    detectorUp: 'Up detector',
    detectorDown: 'Down detector',
    detectorPlus: '"+" detector',
    detectorMinus: '"−" detector',
    fireAtom: 'Fire atom',
    magnetCountTitle: 'Number of Magnets',
    oneMagnet: '1 magnet',
    twoMagnets: '2 magnets (sequential)',
    inputSpinTitle: 'Input Spin Angle',
    inputSpinBody: 'Same θ as the Bloch sphere — θ = 0° prepares spin certainly up, θ = 180° certainly down, and anything in between is a genuine superposition of the two.',
    detectorTally: 'Detector Tally',
    whyTwoSpotsTitle: 'Why Only Two Spots?',
    whyTwoSpotsBody: 'The deflecting force comes from the field\'s <em>gradient</em>, not just its strength: F<sub>z</sub> ≈ μ<sub>z</sub>·∂B<sub>z</sub>/∂z, where μ<sub>z</sub> is the atom\'s magnetic moment along the field axis. A uniform field (∂B<sub>z</sub>/∂z = 0) would exert no net force at all, no matter which way the moment pointed — which is exactly why the two poles above are shaped differently instead of just being strong magnets: only a genuinely inhomogeneous field produces any deflection.',
    whyTwoSpotsFormula: 'F<sub>z</sub> ≈ μ<sub>z</sub> (∂B<sub>z</sub> / ∂z) &nbsp;&nbsp;&nbsp; if B is uniform ⇒ F = 0',
    whyTwoSpotsBody2: 'Classically, μ<sub>z</sub> could point in any direction, so a beam of randomly-oriented atoms should smear continuously across the screen, from fully deflected up to fully deflected down. When Stern and Gerlach actually ran this experiment in 1922, silver atoms landed in exactly two discrete spots — nothing in between, no matter how the magnet was tilted. That\'s the same quantization already built into every qubit in this app: a measurement returns one of exactly two outcomes, never a partial result.',
    sequentialTitle: 'Measuring Twice: Why Order Matters',
    sequentialIntro: 'The atom above already has a definite spin — it\'s the "up" output of a first magnet (not shown), with the "down" half physically blocked. Choose this magnet\'s axis to see whether measuring it again disturbs that spin.',
    sameAxis: 'Same axis (Z)',
    differentAxis: 'Different axis (X)',
    preparedLabel: 'prepared: spin ↑ (Z)',
    blockedLabel: '("down" half blocked)',
    magnet2AxisZ: 'Magnet 2 — Z axis',
    magnet2AxisX: 'Magnet 2 — X axis',
    resultTravelling: 'traveling…',
    resultUp: 'Up detector clicked',
    resultDown: 'Down detector clicked',
    explainerUp: 'Up detector clicked — one of exactly two possible outcomes, never a partial deflection. Fire again and the same atom state can still land Down; only the odds are fixed, not any single result.',
    explainerDown: 'Down detector clicked — one of exactly two possible outcomes, never a partial deflection. Fire again and the same atom state can still land Up; only the odds are fixed, not any single result.',
    explainerDefault: 'An atom is about to enter the magnet. Fire it and watch which detector clicks.',
    trialCount: '· {count} atoms',
    sequentialExplainerZ: 'Same axis as before — fire an atom to confirm it always lands the same way.',
    sequentialExplainerX: 'A different axis this time — fire an atom to see what happens to a spin that was already definite along Z.',
    result2Plus: '"+" detector clicked',
    result2Minus: '"−" detector clicked',
    explainer2Z: 'Measuring the same axis twice in a row just confirms the earlier result — no surprise here. Fire again as many times as you like: it will always land "+".',
    explainer2X: 'Even though this atom had a perfectly definite spin along Z, measuring a different, incompatible axis (X) erased that information and produced a fresh, genuinely random result. This is the heart of the Stern–Gerlach discovery: measuring one property can disturb another that doesn\'t commute with it.'
  },
  teleport: {
    title: 'Quantum Teleportation',
    subtitle: 'Transferring a qubit\'s exact state onto a second, physically separate qubit — using a shared entangled pair and two classical bits, without ever transporting the qubit itself',
    definitionTitle: 'What Is Quantum Teleportation?',
    definitionBody1: 'Quantum teleportation is a protocol for transferring the exact state of one qubit onto a second, physically separate qubit, using a previously shared pair of entangled qubits together with two bits of classical communication — without the original qubit ever being physically transported or directly measured. It moves quantum information, not matter or energy, and it cannot be used to send a signal faster than light: recovering the transferred state at the receiving end requires those two classical bits to actually arrive, and they travel no faster than any ordinary signal.',
    definitionBody2: 'Nor does it create a copy. The source qubit\'s own state is necessarily destroyed by the measurement the protocol requires, consistent with the no-cloning theorem, which forbids any procedure from duplicating an unknown quantum state while leaving the original intact. In the walkthrough below, the two parties exchanging the qubit are given the conventional labels used throughout quantum information theory — Alice for the sender, Bob for the receiver.',
    circuitTitle: 'The Protocol',
    svgAlt: 'Circuit diagram: Alice\'s message qubit and two halves of an entangled pair. A Hadamard and CNOT create the entangled pair between Alice\'s second qubit and Bob\'s qubit. A CNOT and Hadamard put Alice\'s message qubit and her half of the pair into the Bell basis. Both are measured, and the two classical results travel down double lines to conditionally-applied Z and X correction gates on Bob\'s qubit.',
    finalLabel: 'Bob\'s qubit ≡ ψ',
    teleportBtn: 'Teleport',
    aliceBadge: 'Alice\'s message',
    aliceDesc: 'Set any state — this is what gets teleported',
    bobBadge: 'Bob\'s qubit',
    bobDescWaiting: 'Not entangled yet — press Teleport',
    bobDescEntangled: 'Entangled with Alice — undetermined on its own',
    bobDescWrong: 'Definite now, but not yet ψ — waiting on Alice\'s bits',
    bobDescMatch: 'Matches Alice\'s message exactly',
    bobFormulaUndetermined: '|ψ⟩ = ?',
    classicalBitsTitle: 'Classical Bits',
    classicalBitsBody: 'Alice must physically send these two bits to Bob — by phone, radio, the postal service, anything classical. Without them, Bob\'s qubit is useless to him even though it\'s already sitting right there.',
    outcomeTally: 'Outcome Tally',
    resultRunning: 'running…',
    resultDone: 'Teleportation complete',
    stepPair: 'Alice and Bob share an entangled pair, prepared before any message existed.',
    stepBell: 'Alice entangles her message qubit with her half of the pair — this reads ψ out against the entanglement, it doesn\'t copy it.',
    stepMeasure: 'Alice measures both her qubits, collapsing them to two genuinely random classical bits — and collapsing Bob\'s qubit to a definite state in the same instant.',
    stepSend: 'Alice sends her two classical bits to Bob — an ordinary channel, no faster than light. He conditionally applies Z and/or X to fix his qubit up.',
    stepDone: 'Bob\'s qubit now equals Alice\'s original message exactly — teleported, not cloned: her own qubit was destroyed by measurement back in step 2, so the no-cloning theorem stays intact. Alice never learned ψ either; she just relayed two random bits, m₀={m0}, m₁={m1}, that happened to be exactly what Bob needed.',
    explainerDefault: 'Set Alice\'s message state above, then press Teleport. Watch Bob\'s sphere: it starts undetermined, jumps to some definite but wrong point the instant Alice measures, then snaps to match Alice\'s exactly once her classical bits arrive and Bob corrects for them.',
    trialCount: '· {count} runs',
    whyNotFtlTitle: 'Why This Isn\'t Faster-Than-Light',
    whyNotFtlBody: 'The instant Alice measures her two qubits, Bob\'s qubit does become a definite state — but which one is anyone\'s guess without Alice\'s two classical bits, and those can only travel at the speed of light or slower, same as a phone call. Until they arrive, Bob\'s qubit reads as pure noise: measuring it himself early would just give a random 50/50 result, no matter what ψ was. The entanglement makes teleportation possible; it doesn\'t make it instant.',
    noCloningTitle: 'Not a Copy — the No-Cloning Theorem',
    noCloningBody: 'Alice\'s original message qubit doesn\'t survive this: her Bell-basis measurement in Step 2 collapses it along with her half of the pair, permanently erasing whatever ψ used to be on her side. That\'s not a limitation of this particular protocol — the no-cloning theorem proves <em>no</em> quantum procedure can ever copy an unknown state while leaving the original intact. Teleportation moves a state; it never duplicates one.'
  },
  superdense: {
    title: 'Superdense Coding',
    subtitle: 'Transmitting two classical bits of information by physically sending only one qubit, given a shared entangled pair prepared in advance',
    definitionTitle: 'What Is Superdense Coding?',
    definitionBody1: 'Superdense coding is a quantum communication protocol that transmits two classical bits of information by physically sending only a single qubit, provided the sender and receiver already share one half each of an entangled pair prepared in advance. It is the logical converse of quantum teleportation: teleportation spends two classical bits and a shared entangled pair to move one qubit of quantum information, while superdense coding spends one qubit and that same kind of shared pair to move two classical bits.',
    definitionBody2: 'It is not a loophole in classical communication limits — an actual physical qubit still has to travel from sender to receiver for the protocol to work, so the transmission remains bounded by ordinary signal speed. As in the Teleportation tab, the two parties below are given their conventional quantum-information-theory labels: Alice for the sender, Bob for the receiver.',
    circuitTitle: 'The Protocol',
    svgAlt: 'Circuit diagram: Alice\'s qubit and Bob\'s qubit. A Hadamard and CNOT create an entangled pair. Alice conditionally applies X and/or Z to her own qubit only, encoding two classical bits. She then physically sends that qubit to Bob over a quantum channel. Bob, now holding both qubits, applies a CNOT and Hadamard to decode, then measures both to recover Alice\'s exact two bits.',
    channelLabel: 'quantum channel',
    finalLabelA: 'd₀',
    finalLabelB: 'd₁',
    sendBtn: 'Send',
    messageTitle: 'Message to Send',
    messageBody: 'Pick any 2-bit message — this is what Alice encodes onto her single qubit before sending it to Bob.',
    sentLabel: 'Alice sent',
    receivedLabel: 'Bob decoded',
    resultRunning: 'running…',
    resultMatch: 'Decoded exactly right',
    resultMismatch: 'Mismatch — check the console, this should never happen',
    stepPair: 'Alice and Bob share an entangled pair, prepared in advance.',
    stepEncode: 'Alice encodes her message onto her own qubit alone — Bob\'s half of the pair is never touched.',
    stepSend: 'Alice physically sends that one qubit to Bob over a real quantum channel — the one step with no classical substitute.',
    stepDecode: 'Bob, now holding both qubits, runs the same Bell-basis circuit Teleport\'s Alice used — a CNOT then a Hadamard — to tell the four possible messages apart.',
    stepMeasure: 'Bob measures both qubits and reads off Alice\'s exact two bits.',
    stepDone: 'Bob decoded {received} — exactly what Alice sent, {sent}. Nothing here was random: the four possible messages land on four mutually orthogonal states, so Bob\'s measurement has zero uncertainty left in it once the qubit arrives.',
    explainerDefault: 'Pick a 2-bit message above, then press Send. Watch Alice encode it onto her own qubit alone, physically hand that one qubit to Bob, and Bob decode both bits back out exactly — nothing here is random.',
    tally: '{sent} sent · {match}/{sent} decoded correctly',
    whyChannelTitle: 'Why This Still Needs a Quantum Channel',
    whyChannelBody: 'Teleportation moved a qubit\'s worth of information using only classical bits, which is why it can\'t outrun the speed of light. Superdense coding runs the opposite direction — it moves 2 classical bits using only 1 qubit of communication, which sounds like it\'s beating the classical limit, but it isn\'t a loophole: an actual physical qubit still has to travel from Alice to Bob for this to work. The "savings" is real (1 qubit instead of 2 classical bits\' worth of separate signal), but it\'s still bounded by however fast that qubit itself can travel.',
    compareTitle: 'Teleportation vs. Superdense Coding',
    compareBody: 'Same resource — one pre-shared entangled pair — spent in opposite directions. Teleportation sends 1 qubit of quantum information using 2 classical bits; superdense coding sends 2 classical bits of information using 1 qubit. Both need that entangled pair set up in advance, and both end by running essentially the same Bell-basis circuit (a CNOT then a Hadamard) — teleportation runs it on the sending side to read a state out, superdense coding runs it on the receiving side to read a message in.'
  },
  noise: {
    title: 'Noise & Decoherence',
    subtitle: 'The loss of quantum coherence through unwanted interaction with the environment — the dominant practical obstacle to building reliable, large-scale quantum computers',
    definitionTitle: 'What Is Quantum Decoherence?',
    definitionBody1: 'Quantum decoherence is the loss of quantum coherence: the process by which a system\'s phase information leaks into its surrounding environment through unwanted interaction, so that a state genuinely in superposition comes to behave, for all practical purposes, like a definite classical mixture. A system that is perfectly isolated stays in a pure state — one exactly described by a single state vector |ψ⟩ — indefinitely. Once it interacts with an uncontrolled environment, that guarantee no longer holds: the system becomes entangled with the environment\'s own many degrees of freedom, and tracing out everything except the system itself leaves a mixed state, described by a density matrix ρ rather than a single vector. Every other tab in this app treats gates and qubits as perfectly isolated in exactly that first sense; this one models what happens once they aren\'t.',
    definitionBody2: 'On the Bloch sphere already used throughout this app, that loss of purity shows up as a shrinking vector — the same signature already seen for a qubit entangled with another (see the Entangle and Circuits tabs\' reduced Bloch spheres), just caused here by an uncontrolled environment instead of a deliberate second qubit. Decoherence is the dominant practical obstacle to building large-scale, reliable quantum computers: every gate in a real circuit has to complete before the coherence it depends on has leaked away. The simulation below models two of its standard phenomenological channels, T₁ (relaxation) and T₂ (dephasing), evolving a single qubit\'s Bloch vector in real time.',
    qubitBadge: 'Decohering qubit',
    statsTitle: 'Live Readout',
    elapsed: 'Elapsed time',
    vectorLength: 'Bloch vector length',
    purity: 'Purity Tr(ρ²)',
    densityMatrix: 'Density Matrix ρ',
    initialStateTitle: 'Initial State',
    decayTimesTitle: 'Decay Times',
    t2CapNote: 'T₂ capped to {eff} μs (2×T₁) — dephasing can\'t outrun relaxation.',
    pauseBtn: '⏸ Pause',
    playBtn: '▶ Play',
    restartBtn: '↻ Restart',
    explainerDefault: 'Watch the Bloch vector shrink and drift toward the north pole — that shrinkage is real information loss, not just a visual effect. A shorter vector means the qubit\'s state is genuinely less certain, exactly the same "mixed state" idea already used for entangled qubits elsewhere in this app.',
    explainerSettled: 'Settled at |0⟩ — and purity has actually climbed back near 100%, not bottomed out. That\'s not a rescue: T1 relaxation pulls a qubit toward its ground state, so given enough time it always ends up pure again, just pure and uninformative. A qubit sitting at |0⟩ looks identical whether it started as |+⟩, |−⟩, or anything else — the phase information T2 erased along the way never comes back, purity or no purity.',
    t1t2Title: 'T₁ vs. T₂ — Two Different Ways to Forget',
    t1t2Body: 'T₁ (relaxation) is how long the qubit takes to leak energy into its environment and settle toward |0⟩ — it\'s why the z-component of the Bloch vector drifts toward the north pole. T₂ (dephasing) is how long the qubit keeps track of the relative phase between |0⟩ and |1⟩ — it\'s why the x/y components, the part that actually carries superposition information, shrink away. Losing T₂ is often the bigger practical problem: a qubit can still "mostly" be |0⟩ or |1⟩ long after it\'s lost every trace of being in a genuine superposition.',
    t1t2Formula: 'T₂ ≤ 2×T₁ &nbsp;&nbsp;&nbsp; (dephasing can never be slower than relaxation allows)',
    whyMattersTitle: 'Why This Fight Never Stops on Real Hardware',
    whyMattersBody: 'Every other simulation in this app runs gates and measurements as mathematically perfect operations, because that\'s the right way to learn the ideas first. Real quantum processors — including the superconducting and trapped-ion devices CERN\'s own Quantum Technology Initiative experiments with for particle-physics simulation — only stay coherent for a limited window measured in exactly these T₁/T₂ numbers, typically tens to hundreds of microseconds. Every gate in a real circuit has to finish well inside that window, which is the entire reason quantum error correction and hardware-aware circuit design are active engineering problems, not solved ones.'
  },
  grover: {
    title: 'Grover\'s Search',
    subtitle: 'Finding one marked item among four with a single query, by amplifying its amplitude rather than checking items one at a time',
    definitionTitle: 'What Is Grover\'s Search?',
    definitionBody1: 'Grover\'s algorithm searches an unsorted list of N items for one marked entry using roughly √N oracle queries, instead of the up to N a classical search needs in the worst case. It works by amplitude amplification: start every item in equal superposition, use an oracle to flip the sign of the marked item\'s amplitude alone, then use a fixed "diffusion" step to turn that invisible sign flip into a visible boost in measurement probability.',
    definitionBody2: 'Toggle below between two concrete cases. N = 4 (2 qubits) is the smallest case where the result is exact: a single query brings the marked item\'s probability to exactly 1. N = 8 (3 qubits) is the smallest case where it visibly isn\'t: it takes two queries to reach a peak of only about 94.5%, and — proof this isn\'t just "not enough queries yet" — a third query would overshoot past that peak rather than improving on it.',
    targetTitle: 'Item to Find',
    targetBody: 'Pick which item is "marked" — this is what the oracle recognizes, and what the search below should find.',
    targetLabel: 'Marked item',
    foundLabel: 'Found',
    circuitTitle: 'The Circuit',
    oracleGateLabel: 'Oracle',
    diffuserGateLabel: 'Diffuser',
    oracleMarks: 'marks {t}',
    repeatBracketLabel: 'repeat ×2',
    iterationBadge: 'Iteration {iter} of {total}',
    modeN4Btn: 'N = 4 (exact)',
    modeN8Btn: 'N = 8 (2 iterations)',
    modeN4Desc: '2 qubits, 1 marked item — a single query is exact.',
    modeN8Desc: '3 qubits, 1 marked item — needs 2 queries, and even then peaks below 100%.',
    chartTitle: 'Amplitudes Through the Search',
    searchBtn: 'Search',
    resultRunning: 'running…',
    resultMatch: 'Found on the first query',
    resultMismatch: 'Missed — check the console, this should never happen for N=4',
    resultMatchN8: 'Found after 2 queries',
    resultMismatchN8: 'Missed this time — genuinely possible about 1 time in 20 for N=8, not a bug',
    stepStart: 'Every search starts at a definite, uninteresting state — all zeros, exactly like a classical register before you\'ve looked at anything.',
    stepSuperpose: 'A Hadamard on each qubit spreads the amplitude equally across all {n} items at once — every candidate is "live" simultaneously, not checked one at a time.',
    stepOracle: 'The oracle recognizes the marked item and flips the sign of its amplitude alone. Look closely: none of the bars moved — a probability is the squared size of an amplitude, and a negative amplitude squares to exactly the same probability as a positive one the same size. This step is completely invisible to any measurement taken right now.',
    stepDiffuse: 'Diffusion reflects every amplitude about their shared average. The other amplitudes, already near that average, collapse toward zero; the marked one, sitting on the far side after its sign flipped, gets thrown past the average by twice the gap — turning that invisible phase flip into a visible answer.',
    stepDiffuseIteration: 'Diffusion reflects every amplitude about their shared average, the same rule as always. Iteration {iter} of {total} complete: the marked item\'s probability is now {pct}%.',
    overshootNote: 'That\'s the peak for N=8 — a third iteration would overshoot past it, dropping the probability back down to about 33%, not up.',
    stepMeasure: 'One query, one measurement, done: {found} — for {n} items with 1 marked, exactly one Grover iteration gives the marked item probability 1, a real measurement over a distribution with no actual uncertainty left in it.',
    stepMeasureApprox: '2 queries, one measurement, done: {found} — for 8 items with 1 marked, 2 Grover iterations bring the marked item\'s probability to about 94.5%, not exactly 1 this time; measured this way, that\'s still a real Born-rule draw, just one where a small, genuine chance of missing remains.',
    explainerDefault: 'Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.',
    tally: '{n} searches · {found}/{n} found on the first query',
    tallyN8: '{n} searches · {found}/{n} found after 2 queries',
    whyFasterTitle: 'Why One Query Is Genuinely Faster',
    whyFasterBody: 'Classically, finding one marked item among 4 by checking them one at a time takes up to 3 actual look-ups in the worst case — if the first 3 you check aren\'t it, you only know the 4th is the answer by elimination, but you still needed those 3 real queries to get there. Grover\'s algorithm needs exactly 1 oracle call for this same N = 4 case. The gap widens, not narrows, as the list grows: for N items, classical search needs on the order of N queries in the worst case, while Grover\'s algorithm needs only on the order of √N — the same quadratic speedup already described in this app\'s own Algorithms overview.',
    whyFasterBodyN8: 'The N = 8 mode above is what that general pattern actually looks like: 2 queries instead of up to 7, a real quadratic head start — but Grover\'s algorithm doesn\'t promise certainty in general, only that head start. Its own probability peaks at about 94.5% and would fall if pushed further; N = 4 is the special, smaller case where 1 query happens to land exactly on that peak instead of merely near it.'
  },
  // Mirrors ROADMAP_LESSONS in js/roadmap.js exactly (same ids, same
  // title/body content) — that file keeps its own English copies as the
  // t()-lookup fallback (see buildLessonInfoHTML()), so the two only ever
  // need to match at this initial extraction, not stay hand-synced later.
  lessons: {
    qubit: {
      title: 'Bits',
      body: 'A classical bit is always definitively 0 or 1. A qubit can be in a superposition of both at once, described by two amplitudes rather than a single value. The Bloch sphere gives every possible qubit state a point on its surface.'
    },
    'maths-complex': {
      title: 'Complex Numbers',
      body: 'A qubit\'s amplitudes are complex numbers, not just real ones — each has a real and imaginary part, z = a + bi. Only the squared modulus |z|² is directly observable as a probability; the phase is invisible to a single measurement but is exactly what drives interference.'
    },
    'maths-vectors': {
      title: 'Vectors',
      body: 'A qubit\'s state is a column vector [α, β] in a 2D complex vector space, with |0⟩ and |1⟩ as the basis. Normalization |α|² + |β|² = 1 keeps total probability at 100%, and the inner product measures how much two states overlap.'
    },
    'maths-matrices': {
      title: 'Matrices',
      body: 'Every quantum gate is a unitary matrix (U†U = I) acting on the state vector by matrix multiplication. Unitarity guarantees a gate never destroys or creates probability — which is exactly why every quantum gate is reversible.'
    },
    'maths-statevector': {
      title: 'State Vector',
      body: 'The state vector |ψ⟩ = α|0⟩ + β|1⟩ is the complete description of a qubit. In Bloch-sphere form, |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩ — θ and φ are exactly the two sliders on the Bits & Qubits Bloch sphere.'
    },
    'maths-dirac': {
      title: 'Dirac Notation',
      body: 'Dirac\'s bra-ket notation is shorthand for vectors and their inner products: |ψ⟩ is a ket, ⟨ψ| its bra, and ⟨φ|ψ⟩ their inner product. |0⟩ and |1⟩ are orthonormal — ⟨0|1⟩ = 0, ⟨0|0⟩ = ⟨1|1⟩ = 1.'
    },
    'maths-tensor': {
      title: 'Tensor Products',
      body: 'Two independent vectors combine via the tensor product (⊗) into one larger joint vector — stack every entry of the first against every entry of the second, multiplying each pair. Two qubits combine this way into a 4-entry joint state; not every joint state can be split back apart, and the ones that can\'t are exactly the entangled ones.'
    },
    gates: {
      title: 'Quantum Gates',
      body: 'Gates are the operations that move a qubit around the Bloch sphere — reversible rotations rather than the destructive logic of classical gates. Each one (H, X, Y, Z, S, T) has a precise geometric effect you can watch happen.'
    },
    circuit: {
      title: 'Circuits',
      body: 'A circuit is a sequence of gates applied left to right. In a classical circuit, logic gates like AND/OR/XOR combine bits by strict rules — the same input always gives the same output. In a quantum circuit, order matters in a deeper way: running the same gates in a different sequence can land the qubit in a completely different state, just like turns in a route. Switch to 2 or 3 Qubits and add CNOT to build entangled states — Bell pairs and GHZ states — gate by gate, the same recipes behind the Entangle tab.'
    },
    measure: {
      title: 'Measurement',
      body: 'Measuring a qubit forces it to commit to a definite outcome, 0 or 1, with probabilities set by its amplitudes just before measurement. This is the collapse of superposition — irreversible and probabilistic, not a hidden pre-existing value.'
    },
    entangle: {
      title: 'Entanglement',
      body: 'Two qubits can be linked so that measuring one instantly determines the other\'s outcome, no matter how far apart they are. This correlation is stronger than anything possible between classical bits.'
    },
    bellstates: {
      title: 'Bell States',
      body: 'The four Bell states — Φ⁺, Φ⁻, Ψ⁺, and Ψ⁻ — are the maximally entangled two-qubit states, all built from the same Hadamard-then-CNOT recipe starting from a different one of the four basis states. Φ⁺/Φ⁻ always measure to matching outcomes, Ψ⁺/Ψ⁻ always to opposite ones — the relative phase behind each ± sign is invisible to a direct measurement, only showing up once the qubits are interfered with each other.'
    },
    tunnel: {
      title: 'Quantum Tunneling',
      body: 'A quantum wave packet has a nonzero chance of appearing on the far side of a barrier it classically shouldn\'t be able to cross, because its probability cloud extends through the barrier rather than stopping at it.'
    },
    interference: {
      title: 'Interference',
      body: 'When two paths to the same outcome are indistinguishable, their probability amplitudes combine and can reinforce or cancel — producing stripes on a screen instead of two simple piles. Marking which path was taken destroys the pattern.'
    },
    beamsplitter: {
      title: 'Beam Splitter',
      body: 'A 50/50 beam splitter sends a single photon down one of two paths with equal probability — reflected to one detector or transmitted to the other. The photon isn\'t secretly divided between both paths; only one detector ever clicks per photon, and which one is genuinely random each time.'
    },
    sterngerlach: {
      title: 'Stern–Gerlach Experiment',
      body: 'A beam of silver atoms passing through an inhomogeneous magnetic field splits into exactly two discrete spots, never a continuous smear — direct evidence that spin is quantized, with only two possible outcomes along any measurement axis, exactly like a qubit\'s own |0⟩/|1⟩ measurement results.'
    },
    teleport: {
      title: 'Quantum Teleportation',
      body: 'Alice can send Bob the exact state of a qubit without ever sending the qubit itself — using one pre-shared entangled pair and two classical bits. Her own qubit is destroyed by the measurement this requires, so no copy ever exists at both ends at once, exactly as the no-cloning theorem demands.'
    },
    superdense: {
      title: 'Superdense Coding',
      body: 'Teleportation\'s mirror image: Alice sends Bob two classical bits using only one qubit, by encoding her message onto her half of a pre-shared entangled pair and physically sending Bob that single qubit. Bob decodes both bits exactly, every time — nothing about this protocol is probabilistic.'
    },
    noise: {
      title: 'Noise & Decoherence',
      body: 'Real qubits aren\'t perfectly isolated: T₁ relaxation lets them leak energy toward |0⟩, and T₂ dephasing erases the relative phase that makes a superposition meaningful. Both shrink the Bloch vector toward the center — the same "mixed state" signature already seen when tracing out an entangled qubit, just caused by an uncontrolled environment instead of a deliberate measurement.'
    },
    grover: {
      title: 'Grover\'s Search',
      body: 'Grover\'s algorithm finds one marked item among N by amplitude amplification rather than checking items one at a time: an oracle flips the marked item\'s amplitude sign (invisible to any measurement, since probability only depends on the amplitude\'s size), then a fixed "diffusion" step turns that invisible flip into a visible boost. For N=4 with one marked item, a single query brings its measurement probability to exactly 1 — a real quadratic speedup over the best any classical search can do.'
    }
  },
  // Mirrors ROADMAP_QUIZ in js/roadmap.js exactly — same lessonIds as
  // the `lessons` keys above, same q/options/explanation content.
  quiz: {
    qubit: {
      q: 'A classical bit and a qubit both start in a definite state. What is the key difference between them?',
      options: ['Qubits can hold a superposition of 0 and 1 at once', 'Qubits are just faster bits', 'Qubits can only be measured once, ever', 'There is no real difference'],
      explanation: 'A qubit\'s amplitudes let it genuinely be a mix of both basis states until measured — a classical bit never has that option.'
    },
    'maths-complex': {
      q: 'Why do qubit amplitudes need to be complex numbers rather than just real numbers?',
      options: ['Complex numbers are more precise than real numbers', 'The extra phase in a complex number is what makes interference between paths possible', 'Real numbers can\'t be negative', 'It\'s just a mathematical convention with no physical meaning'],
      explanation: 'Two real amplitudes could still cancel by sign, but only a complex phase lets amplitudes reinforce or cancel at any relative angle — that richer freedom is exactly what interference exploits.'
    },
    'maths-vectors': {
      q: 'What does the normalization condition |α|² + |β|² = 1 guarantee about a qubit state?',
      options: ['That the qubit is entangled', 'That the total measurement probability across |0⟩ and |1⟩ adds up to exactly 100%', 'That the qubit has been measured', 'That α and β are both real numbers'],
      explanation: 'P(0) + P(1) = |α|² + |β|² must equal 1 for the Born rule to make sense as a probability distribution — every valid point on the Bloch sphere already satisfies this automatically.'
    },
    'maths-matrices': {
      q: 'What property must every valid quantum gate matrix U satisfy?',
      options: ['det(U) = 0', 'U†U = I (U is unitary)', 'U must be a real-valued matrix', 'U must have exactly two rows'],
      explanation: 'Unitarity is what keeps the state vector normalized after the gate is applied — it\'s also exactly the condition that makes every quantum gate reversible, unlike a classical AND gate.'
    },
    'maths-statevector': {
      q: 'In the Bloch-sphere form |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩, what do θ and φ correspond to?',
      options: ['Two independent qubits', 'The exact same θ/φ sliders used to set a state on the Bloch sphere', 'The number of gates applied so far', 'The measurement outcome'],
      explanation: 'Every point on the Bloch sphere is just this equation with one (θ,φ) pair plugged in — the sphere is a picture of the formula, not a separate thing.'
    },
    'maths-dirac': {
      q: 'What does it mean that ⟨0|1⟩ = 0?',
      options: ['|0⟩ and |1⟩ are the same state', '|0⟩ and |1⟩ are orthogonal — completely distinguishable outcomes', 'The qubit is in superposition', 'A measurement error occurred'],
      explanation: 'Orthogonality is exactly why measurement always returns a clean 0 or 1, never something "in between" — |0⟩ and |1⟩ share zero overlap.'
    },
    'maths-tensor': {
      q: 'Two independent qubits, each a 2-entry vector, combine via the tensor product into a joint state. How many entries does that joint state have?',
      options: ['2', '4', '8', 'It depends on the qubits\' amplitudes'],
      explanation: 'The tensor product of a 2-entry vector with another 2-entry vector always has 2×2 = 4 entries — one for each combination of basis outcomes, |00⟩, |01⟩, |10⟩, |11⟩ — regardless of what the actual amplitudes are.'
    },
    gates: {
      q: 'What does the Hadamard (H) gate do to a qubit starting at |0⟩?',
      options: ['Flips it directly to |1⟩', 'Puts it into an equal superposition of |0⟩ and |1⟩', 'Measures it immediately', 'Entangles it with another qubit'],
      explanation: 'H rotates |0⟩ to the equator of the Bloch sphere — 50/50 odds, with a fixed phase relationship between the two amplitudes.'
    },
    circuit: {
      q: 'In a quantum circuit, why does the order of gates matter?',
      options: ['It doesn\'t — gates always commute', 'Each gate rotates the state, and rotations generally don\'t commute', 'Only the last gate has any effect', 'Order only matters for measurement'],
      explanation: 'Each gate is a rotation of the Bloch sphere, and 3D rotations don\'t generally commute — X then Z lands somewhere different than Z then X.'
    },
    measure: {
      q: 'What happens to a qubit\'s superposition when you measure it?',
      options: ['Nothing changes', 'It collapses to a single definite outcome', 'It splits into two qubits', 'It becomes entangled automatically'],
      explanation: 'There\'s no hidden fact about which outcome it "really" was beforehand — measuring is what produces a definite answer, weighted by the amplitudes.'
    },
    entangle: {
      q: 'Two qubits are entangled. You measure the first and get |1⟩. What happens to the second?',
      options: ['Nothing — they are independent', 'Its outcome is now instantly correlated with the first, per their entangled state', 'It is destroyed', 'It becomes a classical bit'],
      explanation: 'Their amplitudes were linked the moment they became entangled — measuring one doesn\'t send a signal, it just reveals a correlation baked in from the start.'
    },
    bellstates: {
      q: 'Φ⁺ = (|00⟩ + |11⟩)/√2 and Φ⁻ = (|00⟩ − |11⟩)/√2 are different states, yet measuring either one in this demo gives identical statistics. Why?',
      options: ['They are actually the same state written two ways', 'A relative phase (the − sign) doesn\'t change any computational-basis probability, only |amplitude|² does', 'The demo has a bug and can\'t tell them apart', 'Only Φ⁺ is a real Bell state'],
      explanation: 'Probabilities come from |amplitude|², which is identical for +1/√2 and −1/√2. The two states are still physically distinct — the phase becomes visible once the qubits are interfered with each other, e.g. by applying a Hadamard to each before measuring.'
    },
    tunnel: {
      q: 'What is quantum tunneling?',
      options: ['A qubit teleporting instantly across space', 'A wave packet having nonzero probability of appearing beyond a classically-forbidden barrier', 'A gate that deletes a qubit', 'A measurement error'],
      explanation: 'The wavefunction doesn\'t stop dead at a barrier — it decays exponentially inside it, so a thin enough barrier still leaves nonzero amplitude on the far side.'
    },
    interference: {
      q: 'In the double-slit experiment, what causes the interference stripes on the screen?',
      options: ['Two separate particles colliding', 'Probability amplitudes from indistinguishable paths adding or canceling', 'The screen material', 'Measurement collapse happening early'],
      explanation: 'Each screen point has two possible paths; when they\'re indistinguishable their amplitudes add and can reinforce or cancel, producing the fringes.'
    },
    beamsplitter: {
      q: 'A single photon hits a 50/50 beam splitter. What actually happens?',
      options: ['The photon splits in half, with half going to each detector', 'The photon goes to exactly one detector, chosen at random with 50/50 odds', 'Both detectors always click together', 'Neither detector clicks unless you measure twice'],
      explanation: 'A photon is never divided between paths — the beam splitter puts it into a superposition of "reflected" and "transmitted", and measuring (the detector clicking) forces one definite outcome, same as measuring a qubit.'
    },
    sterngerlach: {
      q: 'A beam of silver atoms passes through a Stern–Gerlach magnet. What does the experiment actually show on the detector screen?',
      options: ['A continuous smear from one extreme to the other', 'Exactly two discrete spots, never anything in between', 'A single spot in the exact center', 'No pattern at all — the atoms are absorbed'],
      explanation: 'Classically, a randomly-oriented magnetic dipole should deflect by any amount, producing a continuous smear. Stern and Gerlach found only two discrete spots — direct evidence that spin, like a qubit\'s own measurement outcomes, is quantized into just two possibilities along any axis.'
    },
    teleport: {
      q: 'After Bob applies his correction gates, how does his qubit compare to Alice\'s original message?',
      options: ['It\'s a good approximation, close but not exact', 'It exactly matches — same amplitudes, same state', 'It\'s a classical copy, not a real quantum state', 'It only matches half the time'],
      explanation: 'Once the correct Z/X correction is applied, Bob\'s qubit equals Alice\'s original exactly, not approximately — that\'s the whole point of the protocol\'s classically-controlled correction step.'
    },
    superdense: {
      q: 'In superdense coding, what actually has to physically travel from Alice to Bob?',
      options: ['Two classical bits, sent by radio or phone', 'A single qubit', 'Nothing — the entangled pair alone is enough', 'Four qubits, one per possible message'],
      explanation: 'Only Alice\'s one qubit ever travels. The entangled pair was shared in advance, and her message is encoded onto that single qubit before she sends it — that\'s what makes it "superdense": 2 bits of information from just 1 qubit of communication.'
    },
    noise: {
      q: 'A qubit starts in a genuine superposition. After it fully decoheres (T₂ has elapsed many times over), what happens to its Bloch vector?',
      options: ['Nothing — decoherence only affects measurement, not the state', 'It shrinks toward the center, the same signature as a mixed/entangled state', 'It grows longer than 1', 'It instantly jumps to the south pole'],
      explanation: 'Losing coherence to the environment is mathematically identical to becoming entangled with something you can\'t track — both leave the qubit\'s own Bloch vector shorter than 1, a genuinely mixed state, not just a randomized pure one.'
    },
    grover: {
      q: 'Right after Grover\'s oracle flips the marked item\'s amplitude sign, what happens to the measured probability of finding it?',
      options: ['It jumps straight to 1', 'It stays exactly the same as before the oracle ran', 'It drops to 0', 'It becomes random'],
      explanation: 'Probability comes from |amplitude|², and a sign flip alone doesn\'t change that: (−0.5)² = (0.5)². The oracle\'s phase kick is completely invisible to a measurement until the diffusion step turns it into an actual probability boost.'
    }
  }
});


// ════════ js/locales/fr.js ════════
// Français — traduction complète de la locale canonique en.js. Chaque clé
// présente ici doit exister à l'identique dans en.js ; core/i18n.js's t()
// se rabat sur en.js si la langue active (ici le français) n'a pas la clé
// demandée. Seules les valeurs (le texte) sont traduites — les noms de
// clés restent strictement identiques à ceux de en.js.
registerLocale('fr', {
  header: {
    tag: 'Quantum Explorer · CERN',
    themeToggle: 'Basculer thème clair / sombre'
  },
  footer: {
    tagline: 'Une plateforme interactive pour apprendre l\'informatique quantique et la mécanique quantique',
    cernLink: 'Site officiel du CERN',
    copyright: 'Copyright © {year} CERN'
  },
  nav: {
    home: 'Accueil',
    introduction: 'Introduction',
    importantConcepts: 'Concepts importants',
    bitsQubits: 'Bits & Qubits',
    mathsConcept: 'Concept mathématique',
    gates: 'Portes',
    circuits: 'Circuits',
    measure: 'Mesure',
    entangle: 'Intrication',
    bellStates: 'États de Bell',
    tunnel: 'Effet tunnel',
    interference: 'Interférence',
    beamSplitter: 'Séparateur de faisceau',
    sternGerlach: 'Stern–Gerlach',
    teleport: 'Téléporter',
    superdense: 'Codage Superdense',
    noise: 'Bruit',
    grover: 'Recherche de Grover'
  },
  qubitTab: {
    classical: 'Classique',
    oneQubit: 'Un qubit',
    twoQubit: 'Deux qubits',
    threeQubit: 'Trois qubits',
    pageTitle: 'Bits & Qubits',
    pageSubtitle: 'Découvrez l\'information classique et quantique en explorant un bit, un qubit unique, ou un système à deux qubits.',
    classicalBitBadge: 'Bit classique',
    classicalBitDesc: 'Un bit est la plus petite unité d\'information dans un ordinateur classique. Contrairement à un qubit, un bit classique n\'existe jamais dans les deux états à la fois.',
    currentBit: 'Bit actuel',
    possibleValues: 'Valeurs possibles',
    classicalExplainer: 'Actionnez l\'interrupteur pour changer le bit. Remarquez qu\'il vaut toujours 0 ou 1, jamais les deux.',
    qubitBadge: 'Qubit',
    qubitDesc: 'Un qubit est l\'unité fondamentale de l\'information quantique. Contrairement à un bit classique, il peut exister en superposition de 0 et de 1 à la fois — son état est décrit par deux amplitudes complexes, α et β, jusqu\'au moment où il est mesuré.',
    qubitIntroExplainer: 'Choisissez un mode ci-dessous : explorez la superposition d\'un qubit unique sur la sphère de Bloch, ou observez comment deux qubits indépendants se combinent en un état conjoint.',
    oneQubitDesc: 'Une superposition de 0 et de 1 à la fois',
    exploreBlochSphere: 'Explorer la sphère de Bloch',
    oneQubitExplainer: 'Un qubit peut être en superposition de |0⟩ et |1⟩ simultanément. Faites glisser les curseurs pour explorer chaque état possible sur la sphère de Bloch — chaque point est un état de qubit valide, inaccessible à tout bit classique.',
    qubitABadge: 'Qubit A',
    qubitADesc: 'Indépendant — non intriqué avec B',
    qubitBBadge: 'Qubit B',
    qubitBDesc: 'Indépendant — non intriqué avec A',
    jointState: 'État conjoint — |ψ_A⟩ ⊗ |ψ_B⟩',
    twoQubitExplainer: 'Deux qubits, chacun manipulé indépendamment — l\'état conjoint ci-dessus n\'est que le produit de leurs probabilités individuelles, P(ab) = P(a) × P(b). Rien n\'est encore corrélé ici ; c\'est exactement l\'ingrédient qu\'ajoute l\'onglet Intrication avec une porte CNOT.',
    classicalTryMeIdle: 'Cliquez sur Essayez-moi pour voir le bit basculer d\'avant en arrière.',
    oneQubitTryMeIdle: 'Cliquez sur Essayez-moi pour parcourir les six états de base.',
    twoQubitTryMeIdle: 'Cliquez sur Essayez-moi pour faire parcourir aux deux qubits les quatre états de base ensemble.',
    whatIsQubitBody: 'Un qubit est souvent décrit comme « 0 et 1 en même temps », mais c\'est un raccourci pour quelque chose de plus précis : son état est une <span class="key-term">superposition</span> — une combinaison pondérée — des deux résultats de base |0⟩ et |1⟩, fixée par deux <span class="key-term">amplitudes complexes</span> α et β. Élever au carré la taille de chaque amplitude donne la probabilité de ce résultat lors de la mesure — mais avant la mesure, le qubit n\'en a véritablement choisi aucun. Un bit classique a exactement deux états. Un qubit en a une infinité : chaque point à la surface de la sphère de Bloch ci-dessous est un état valide, pas seulement ses deux pôles.',
    blochEarthTitle: 'La sphère de Bloch — pensez à la planète Terre',
    blochEarthBody: 'La sphère sur laquelle vit votre qubit fonctionne comme un globe. Le <span class="key-term">pôle nord</span> est |0⟩ et le <span class="key-term">pôle sud</span> est |1⟩ — θ (thêta) est la « latitude », c\'est-à-dire à quel point le qubit s\'est incliné du pôle |0⟩ vers |1⟩. Se trouver exactement sur l\'<span class="key-term">équateur</span> (θ = 90°) signifie une <span class="key-term">superposition</span> égale 50/50 des deux. φ (phi) est la « longitude » — elle ne change jamais les probabilités de mesure, seulement la <span class="key-term">phase</span> relative entre les deux amplitudes, invisible lors d\'une seule mesure mais c\'est exactement ce qui provoque l\'interférence ailleurs dans l\'application.',
    qubitCBadge: 'Qubit C',
    qubitA3Desc: 'Indépendant — non intriqué avec B ou C',
    qubitB3Desc: 'Indépendant — non intriqué avec A ou C',
    qubitC3Desc: 'Indépendant — non intriqué avec A ou B',
    jointState3: 'État conjoint — |ψ_A⟩ ⊗ |ψ_B⟩ ⊗ |ψ_C⟩',
    threeQubitExplainer: 'Trois qubits, chacun manipulé indépendamment — l\'état conjoint ci-dessus n\'est que le produit des trois probabilités individuelles, P(abc) = P(a) × P(b) × P(c). Rien n\'est encore corrélé ici ; en généralisant cette même idée avec une porte CNOT, on obtient les états GHZ dans le constructeur à 3 qubits de l\'onglet Circuits.',
    threeQubitTryMeIdle: 'Cliquez sur Essayez-moi pour faire parcourir aux trois qubits les quatre états de base ensemble.'
  },
  maths: {
    title: 'Concept mathématique',
    subtitle: 'Le langage mathématique derrière les qubits — nombres complexes, vecteurs, matrices, vecteurs d\'état, notation de Dirac, et produits tensoriels.',
    complexBody1: 'Les amplitudes d\'un qubit ne sont pas de simples nombres réels — ce sont des nombres complexes, chacun avec une partie réelle et une partie imaginaire. Cette dimension supplémentaire est ce qui rend la phase (et l\'interférence) possible.',
    complexFormula1: 'z = a + bi,&nbsp;&nbsp; i² = −1',
    complexFormula2: 'Module : |z| = √(a² + b²)',
    complexFormula3: 'Forme polaire : z = r·e<sup>iθ</sup> = r(cos θ + i sin θ)',
    complexBody2: 'Un état de qubit α|0⟩ + β|1⟩ a des amplitudes complexes α, β. Seuls leurs modules au carré |α|², |β|² sont directement observables (en tant que probabilités de mesure) — la phase relative entre elles est invisible à une seule mesure, mais c\'est elle qui entraîne l\'interférence.',
    vectorsBody1: 'L\'état d\'un qubit est un vecteur dans un espace vectoriel complexe à 2 dimensions, écrit comme une colonne de ses deux amplitudes.',
    vectorsFormula1: '|0⟩ = [1, 0]<sup>T</sup>&nbsp;&nbsp;&nbsp; |1⟩ = [0, 1]<sup>T</sup>',
    vectorsFormula2: '|ψ⟩ = α|0⟩ + β|1⟩ = [α, β]<sup>T</sup>',
    vectorsFormula3: 'Normalisation : |α|² + |β|² = 1',
    vectorsFormula4: 'Produit scalaire : ⟨φ|ψ⟩ = φ<sub>0</sub>*ψ<sub>0</sub> + φ<sub>1</sub>*ψ<sub>1</sub>',
    vectorsBody2: 'La normalisation maintient la probabilité totale à 100 % — c\'est pourquoi chaque point que vous pouvez atteindre sur la sphère de Bloch est automatiquement un état valide. Le produit scalaire mesure à quel point deux états se recouvrent ; des états orthogonaux (comme |0⟩ et |1⟩) ont un produit scalaire de 0.',
    matricesBody1: 'Chaque porte quantique est une matrice. Appliquer une porte à un qubit revient à une multiplication matrice-vecteur — la matrice de la porte multipliée par le vecteur d\'état donne le nouveau vecteur d\'état.',
    matricesFormula1: 'Pauli-X = [[0, 1], [1, 0]]',
    matricesFormula2: 'X|0⟩ = [[0,1],[1,0]]·[1,0]<sup>T</sup> = [0,1]<sup>T</sup> = |1⟩',
    matricesFormula3: 'Condition d\'unitarité : U†U = I',
    matricesBody2: '« Unitaire » est la contrainte que doit satisfaire toute porte quantique — U† (la transposée conjuguée) annule exactement U. C\'est ce qui garantit qu\'une porte ne détruit ni ne crée de probabilité : l\'état de sortie est toujours normalisé dès lors que l\'état d\'entrée l\'était.',
    svBody1: 'Le vecteur d\'état |ψ⟩ est la description complète d\'un qubit — tout ce que l\'on peut jamais prédire à son sujet (probabilités de mesure, réponse à une porte) se calcule à partir de ces deux amplitudes.',
    svFormula1: '|ψ⟩ = α|0⟩ + β|1⟩',
    svFormula2: 'Forme de Bloch : |ψ⟩ = cos(θ/2)|0⟩ + e<sup>iφ</sup>sin(θ/2)|1⟩',
    svFormula3: 'P(0) = |α|²&nbsp;&nbsp;&nbsp; P(1) = |β|²',
    svBody2: 'θ et φ sont exactement les deux curseurs de la sphère de Bloch dans l\'onglet Bits & Qubits — chaque vecteur d\'état correspond à un point de cette sphère, et réciproquement.',
    compareStateSpaces: 'Comparer les espaces d\'états',
    compareStateSpacesBody: 'Un bit classique est un point sur une ligne ; un qubit est l\'extrémité d\'un vecteur sur un arc unité — choisissez une vue ci-dessous.',
    svClassicalDesc: 'Seulement deux extrémités discrètes',
    toggleBit: 'Basculer le bit',
    currentState: 'État actuel',
    stateSpace: 'Espace d\'état',
    stateSpaceBody: 'Seules les deux extrémités |0⟩ et |1⟩ sont valides. La région intermédiaire est physiquement interdite — il n\'existe pas de « 47 % |1⟩ » pour un bit classique.',
    svQuantumDesc: 'Tout point sur l\'arc unité',
    keyInsight: 'Point clé',
    keyInsightBody: 'L\'extrémité du vecteur d\'état doit se trouver sur l\'arc unité (α² + β² = 1). Chaque point de cet arc est un état quantique distinct et valide. Le bit classique n\'occupe jamais que les deux coins.',
    diracBody1: 'Les symboles |·⟩ et ⟨·| utilisés partout dans cette application sont la notation « bra-ket » de Dirac — un raccourci compact pour les vecteurs et leurs produits scalaires.',
    diracFormula1: 'Ket : |ψ⟩ — un vecteur colonne (un état)',
    diracFormula2: 'Bra : ⟨ψ| — le vecteur ligne transposé conjugué',
    diracFormula3: 'Bra-ket : ⟨φ|ψ⟩ — un produit scalaire (un nombre)',
    diracFormula4: '⟨0|0⟩ = 1&nbsp;&nbsp;&nbsp; ⟨0|1⟩ = 0&nbsp;&nbsp;&nbsp; ⟨1|1⟩ = 1',
    diracFormula5: 'Ket-bra : |ψ⟩⟨φ| — un produit extérieur (une matrice/opérateur)',
    diracBody2: '|0⟩ et |1⟩ sont orthonormés — chacun a une longueur unité et un recouvrement nul avec l\'autre — ce qui explique exactement pourquoi une mesure donne toujours un 0 ou un 1 net, jamais quelque chose entre les deux.',
    tensorBody1: 'Le produit tensoriel (⊗) est la façon dont deux espaces vectoriels indépendants se combinent en un seul espace conjoint plus grand — on empile chaque entrée du premier vecteur contre chaque entrée du second, en multipliant chaque paire. Un vecteur de dimension n combiné à un vecteur de dimension m produit un vecteur de dimension n×m.',
    tensorFormula1: '[a, b]<sup>T</sup> ⊗ [c, d]<sup>T</sup> = [ac, ad, bc, bd]<sup>T</sup>',
    tensorBody2: 'Deux qubits indépendants se combinent exactement de cette manière : chacun est un vecteur à 2 entrées, donc leur état conjoint est un vecteur à 4 entrées — une entrée pour chaque combinaison d\'états de base, |00⟩, |01⟩, |10⟩, |11⟩.',
    tensorFormula2: '|0⟩⊗|0⟩ = [1,0]<sup>T</sup>⊗[1,0]<sup>T</sup> = [1,0,0,0]<sup>T</sup> = |00⟩',
    tensorBody3: 'Tout état construit en faisant le produit tensoriel de deux états à un qubit peut toujours être décomposé à nouveau en ces deux mêmes qubits. Mais tous les vecteurs à 4 entrées ne peuvent pas être décomposés ainsi — un état conjoint qui ne peut pas être séparé en un produit tensoriel de deux états à un qubit est précisément ce que l\'on appelle intriqué, exploré concrètement dans l\'onglet Intrication.'
  },
  gates: {
    title: 'Portes',
    subtitle: 'Choisissez une porte et observez son effet immédiat — classique ou quantique',
    classicalGates: 'Portes classiques',
    quantumGates: 'Portes quantiques',
    compareGates: 'Comparer',
    quantumTruthTableNote: 'L\'action de chaque porte fixe sur les deux états de base — les portes de rotation (Rx/Ry/Rz) ne sont pas incluses car leur résultat dépend d\'un angle défini à l\'exécution, pas d\'une table fixe.',
    compareClassicalDesc: 'NON/ET/OU/OU exclusif et leurs négations — règles strictes et destructrices',
    compareQuantumDesc: 'H/X/Y/Z/S/T — toujours réversibles, peuvent créer une superposition',
    compareInsightTitle: 'La différence essentielle',
    compareInsightBody: 'Chaque ligne classique ci-dessus fait perdre de l\'information — ET, OU et consorts font correspondre plusieurs combinaisons d\'entrées à la même sortie, si bien qu\'il est impossible de remonter à l\'entrée à partir de la seule sortie. Chaque ligne quantique est réversible : chacune est une matrice unitaire, donc lui appliquer ensuite sa propre transposée conjuguée retrouve toujours exactement l\'entrée de départ. Les portes classiques ne peuvent aussi jamais produire qu\'un 0 ou un 1 net ; des portes quantiques comme H peuvent produire une véritable superposition des deux.',
    pickGate: 'Porte — cliquez pour choisir',
    inputA: 'Entrée A',
    inputB: 'Entrée B',
    resetToZero: 'Réinitialiser à |0⟩',
    applyGate: 'Appliquer la porte',
    gateReference: 'Référence des portes',
    rotationGates: 'Portes de rotation',
    gateMatrix: 'Matrice de la porte',
    selectAGate: '← sélectionnez une porte',
    whyReversibleTitle: 'Pourquoi chaque porte est réversible',
    whyReversibleBody: 'Chaque porte à gauche est une matrice unitaire (U†U = I) — non par convention, mais parce qu\'une porte n\'est rien d\'autre que l\'évolution temporelle du qubit selon l\'équation de Schrödinger, laquelle préserve toujours la probabilité totale. Conséquence directe : les portes quantiques ne détruisent jamais d\'information. Appliquez n\'importe quelle porte, puis sa transposée conjuguée, et le qubit revient exactement à son état de départ — il n\'existe pas d\'équivalent quantique d\'une porte ET classique qui jette discrètement un bit à la poubelle.',
    // Surnoms/noms formels des six portes fixes (GATES dans js/core/gates.js)
    // — `name` (la simple lettre H/X/Y/Z/S/T) est une notation, jamais
    // traduite. Le paragraphe complet de `explain` est un texte de narration
    // dynamique (assemblé dans une phrase interpolée au moment où une porte
    // est appliquée, voir applyGate() dans gates-tab.js) et reste hors
    // périmètre, comme le reste de cette catégorie dans toute l'application.
    H: { desc: 'La Pièce Qui Tourne', formalName: 'Porte de Hadamard' },
    X: { desc: 'L\'Interrupteur', formalName: 'Porte de Pauli-X' },
    Y: { desc: 'La Roue', formalName: 'Porte de Pauli-Y' },
    Z: { desc: 'Le Coup Fantôme', formalName: 'Porte de Pauli-Z' },
    S: { desc: 'Le Quart de Tour', formalName: 'Porte de phase (√Z)' },
    T: { desc: 'La Chiquenaude Discrète', formalName: 'Porte T (√S)' }
  },
  // Rx/Ry/Rz (ROTATION_GATES dans js/core/gates.js) — séparé de `gates`
  // ci-dessus car les deux utilisent les mêmes clés d'axe (X/Y/Z), qui
  // entreraient sinon en collision avec les entrées des portes de
  // Pauli-X/Y/Z fixes.
  rotationGates: {
    X: { desc: 'Rotation autour de l\'axe X', formalName: 'Rotation autour de l\'axe X' },
    Y: { desc: 'Rotation autour de l\'axe Y', formalName: 'Rotation autour de l\'axe Y' },
    Z: { desc: 'Rotation autour de l\'axe Z', formalName: 'Rotation autour de l\'axe Z' }
  },
  circuits: {
    title: 'Circuits',
    subtitle: 'Les portes classiques combinent des bits selon des règles strictes ; les circuits quantiques font parcourir à un qubit un trajet de portes, accumulant des rotations — choisissez un constructeur ci-dessous',
    classicalCircuit: 'Circuit classique',
    quantumCircuit: 'Circuit quantique',
    gatePalette: 'Palette de portes — cliquez pour ajouter',
    companionBit: 'Bit compagnon — utilisé par les portes de la famille ET/OU/OU exclusif lorsqu\'il est ajouté',
    startBit: 'Bit de départ',
    circuitWire: 'Fil du circuit',
    whatsGoingOn: 'Que se passe-t-il',
    afterRunning: 'Après exécution',
    truthTableStartOutput: 'Table de vérité — bit de départ → sortie',
    oneQubit: '1 qubit',
    twoQubits: '2 qubits',
    threeQubits: '3 qubits',
    outputState: 'État de sortie',
    targetQubit2: 'Qubit cible — les nouvelles portes s\'appliquent à',
    gatePaletteTarget: 'Palette de portes — cliquez pour ajouter au qubit cible',
    circuitDiagram: 'Diagramme du circuit',
    outputState2Q: 'État de sortie (2 qubits)',
    perQubitBlochSpheres: 'Sphères de Bloch par qubit — se rétractent vers le centre lorsqu\'ils sont intriqués',
    targetQubit3: 'Qubit cible — les nouvelles portes à un qubit s\'appliquent à',
    addCnot: 'Ajouter CNOT',
    outputState3Q: 'État de sortie (3 qubits)',
    runHistory: 'Historique d\'exécution — cliquez sur une étape pour la revoir'
  },
  common: {
    run: '▶ Exécuter',
    clear: 'Effacer',
    add: 'Ajouter',
    reset: 'Réinitialiser',
    controls: 'Contrôles',
    detector: 'Détecteur',
    tryMe: 'Essayez-moi',
    tryMePresets: '🎲 Essayez-moi — circuits prédéfinis',
    classical: 'Classique',
    quantum: 'Quantique',
    stateVector: 'Vecteur d\'état',
    copyShareableLink: 'Copier le lien à partager',
    basisStates: 'États de base',
    possibleStates: 'États possibles',
    uncertainty: 'Incertitude',
    uncertaintyFundamental: 'Fondamentale — jusqu\'à la mesure',
    representation: 'Représentation',
    output: 'Sortie',
    whatJustHappened: 'Ce qui vient de se passer',
    truthTable: 'Table de vérité',
    appliedSequence: 'Séquence appliquée',
    gate: 'Porte',
    input: 'Entrée'
  },
  mathsTab: {
    complexNumbers: 'Nombres complexes',
    vectors: 'Vecteurs',
    matrices: 'Matrices',
    stateVector: 'Vecteur d\'état',
    diracNotation: 'Notation de Dirac',
    tensorProducts: 'Produits tensoriels'
  },
  gatesTab: {
    classical: 'Classique',
    quantum: 'Quantique',
    compare: 'Comparer'
  },
  roadmap: {
    title: 'Concepts quantiques',
    subtitle: 'Cliquez sur un concept pour ouvrir sa simulation',
    conceptMap: 'Carte des concepts',
    myProgress: 'Ma progression',
    lessonsCompleted: 'Leçons terminées',
    quickCheckScore: 'Score aux quiz rapides',
    lessonChecklist: 'Liste des leçons',
    resetProgress: 'Réinitialiser la progression',
    read: 'lu',
    markUnread: 'Marquer comme non lu',
    markAsRead: 'Marquer comme lu',
    start: 'Commencer →',
    quickCheck: 'Quiz rapide',
    correct: 'correct',
    review: 'à revoir',
    notAttempted: 'Pas encore essayé.',
    quizScoreSummary: '{correct} / {answered} quiz rapides corrects jusqu\'à présent ({total} concepts au total).',
    centerTooltip: '{count} concepts fondamentaux de l\'informatique quantique, d\'un simple qubit jusqu\'à l\'intrication et l\'interférence des ondes — cliquez sur un sujet pour l\'explorer.'
  },
  mindmap: {
    quantumWorld: 'Monde quantique',
    introduction: 'Introduction',
    classical: 'Classique',
    quantum: 'Quantique',
    oneQubit: 'Un qubit',
    twoQubits: 'Deux qubits',
    threeQubits: 'Trois qubits'
  },
  intro: {
    title: 'Introduction',
    subtitle: 'Nouveau dans l\'informatique quantique ? Commencez ici — aucune connaissance en physique ou en programmation n\'est requise.',
    classicalTitle: 'INTRODUCTION À L\'INFORMATIQUE QUANTIQUE ?',
    classicalBody: 'Avant d\'aborder les ordinateurs quantiques, commençons par les ordinateurs classiques. Votre téléphone et votre ordinateur utilisent des bits pour traiter l\'information. Un bit n\'a que deux états possibles : <b>0 (ÉTEINT) et 1 (ALLUMÉ)</b>',
    whatIsTitle: 'QU\'EST-CE QUE L\'INFORMATIQUE QUANTIQUE ?',
    whatIsBody: 'L\'informatique quantique utilise les principes de la mécanique quantique pour résoudre certains problèmes plus rapidement que les ordinateurs classiques.',
    bitsToQubitsTitle: 'Des bits aux qubits',
    bitsToQubitsBody: 'Contrairement à un bit, qui vaut soit 0 soit 1, un qubit peut exister dans les deux états à la fois. C\'est ce qu\'on appelle la superposition.',
    superpositionTitle: 'Superposition : plusieurs possibilités',
    superpositionBody: 'Imaginez que vous lancez une pièce de monnaie. Pendant qu\'elle tourne dans les airs, elle représente à la fois pile et face. De même, un qubit peut représenter à la fois 0 et 1 jusqu\'à ce qu\'il soit mesuré.',
    entanglementTitle: 'Intrication : une information quantique connectée',
    entanglementBody: 'L\'intrication relie deux qubits ou plus entre eux. Les changements apportés à l\'un sont corrélés avec les autres, ce qui permet aux ordinateurs quantiques de traiter l\'information de manières radicalement nouvelles.',
    whyMattersTitle: 'Pourquoi l\'informatique quantique est importante',
    whyMattersBody: 'Les ordinateurs quantiques ne sont pas conçus pour remplacer les ordinateurs portables ou les smartphones. Ils sont conçus pour résoudre des problèmes complexes, tels que : <ul class="quantum-list"><li>🧪 Simuler des molécules</li><li>⚙️ Optimiser de grands systèmes</li><li>🔐 Améliorer la cryptographie</li><li>🌦️ Résoudre des problèmes scientifiques et techniques complexes</li></ul>',
    howAppWorksTitle: 'Comment fonctionne cette application',
    howAppWorksBody: 'Chaque onglet associe une courte leçon à une simulation interactive et à un quiz rapide. Explorez les concepts en manipulant les sphères de Bloch, en appliquant des portes et en exécutant des circuits, tout en observant les résultats se mettre à jour en temps réel. Votre progression est suivie au fil de votre apprentissage.',
    suggestedPath: 'Parcours d\'apprentissage suggéré'
  },
  concepts: {
    title: 'Concepts importants',
    subtitle: 'Un glossaire des idées essentielles de la mécanique quantique et de l\'informatique quantique — le vocabulaire sur lequel repose le reste de cette application.',
    searchPlaceholder: 'Rechercher un concept…',
    searchNoResults: 'Aucun concept ne correspond à « {query} ».',
    mechanicsGroupTitle: 'Fondamentaux de la mécanique quantique',
    computingGroupTitle: 'Concepts d\'informatique quantique',
    superpositionTitle: 'Superposition',
    superpositionBody: 'Un système quantique peut exister dans une combinaison de plusieurs états à la fois, plutôt que d\'être figé dans un seul — comme un qubit qui serait en partie |0⟩ et en partie |1⟩ simultanément. Ce n\'est pas que le système soit secrètement dans un état sans que nous sachions lequel ; la combinaison est l\'état physique réel, jusqu\'à ce qu\'une mesure force le système à se fixer sur un résultat.',
    waveParticleTitle: 'Dualité onde-particule',
    waveParticleBody: 'Tout objet quantique — électrons, photons, et même qubits — se comporte comme une onde dans certaines expériences (s\'étalant, interférant avec lui-même) et comme une particule discrète dans d\'autres (arrivant sur un détecteur en un seul point localisé). Le comportement observé dépend de ce que l\'on mesure, et non d\'un changement d\'identité de l\'objet.',
    quantumStateTitle: 'État quantique (fonction d\'onde)',
    quantumStateBody: 'La description mathématique complète d\'un système quantique — tout ce qui peut jamais être prédit à son sujet, encodé dans un ensemble d\'amplitudes complexes. Pour un qubit, il s\'agit du vecteur d\'état à deux amplitudes |ψ⟩ = α|0⟩ + β|1⟩, exploré tout au long des onglets Bits & Qubits et Concept mathématique de cette application.',
    bornRuleTitle: 'La règle de Born',
    bornRuleBody: 'La règle qui relie les amplitudes d\'un état quantique aux probabilités de mesure : élever au carré la taille d\'une amplitude donne la probabilité d\'observer ce résultat. Pour un qubit α|0⟩ + β|1⟩, cela donne P(0) = |α|² et P(1) = |β|² — voir l\'onglet Mesure pour le constater en pratique.',
    collapseTitle: 'Effondrement de la fonction d\'onde',
    collapseBody: 'Au moment où une mesure a lieu, un état quantique cesse d\'être un mélange de possibilités et devient un résultat défini unique — de manière irréversible. Les autres possibilités ne sont pas cachées quelque part ; elles ont tout simplement disparu, ce qui rend la mesure quantique fondamentalement différente du simple constat d\'une valeur déjà fixée.',
    uncertaintyTitle: 'Principe d\'incertitude de Heisenberg',
    uncertaintyBody: 'Certaines paires de propriétés — comme la position et la quantité de mouvement d\'une particule — ne peuvent jamais être connues toutes deux avec une précision arbitraire en même temps. Ce n\'est pas une limitation de nos instruments ; c\'est une caractéristique intrinsèque de la façon dont les états quantiques sont décrits.',
    entanglementTitle: 'Intrication quantique',
    entanglementBody: 'L\'intrication quantique est un phénomène dans lequel deux particules quantiques ou plus deviennent liées de telle sorte que l\'état d\'une particule ne peut pas être décrit indépendamment des autres, même lorsqu\'elles sont séparées par de grandes distances. Elles partagent à la place un unique état quantique conjoint.'
      + '<br><br>Mesurer l\'une des particules intriquées révèle instantanément ce que les autres afficheront, quelle que soit la distance qui les sépare — pourtant, aucun signal ni aucune énergie ne voyage réellement entre elles au moment de la mesure. Cela peut ressembler à une communication plus rapide que la lumière, mais ce n\'en est pas une : le résultat de chaque mesure individuelle reste authentiquement aléatoire, donc il n\'existe aucun moyen d\'encoder un message en utilisant uniquement l\'intrication. Exploré en détail dans l\'onglet Intrication.',
    interferenceTitle: 'Interférence quantique',
    interferenceBody: 'Lorsqu\'un système quantique dispose de plusieurs chemins indiscernables menant au même résultat, les amplitudes de ces chemins se combinent — se renforçant à certains endroits et s\'annulant à d\'autres — produisant des motifs (comme les franges de l\'expérience des doubles fentes) qu\'aucun chemin ne pourrait produire seul. Voir les onglets Interférence et Séparateur de faisceau.',
    tunnelingTitle: 'Effet tunnel quantique',
    tunnelingBody: 'Une particule quantique a une probabilité non nulle d\'apparaître de l\'autre côté d\'une barrière d\'énergie qu\'elle ne devrait classiquement pas pouvoir franchir, car sa fonction d\'onde ne s\'arrête pas net à la barrière — elle s\'y atténue au lieu de rebondir. Voir l\'onglet Effet tunnel pour un paquet d\'ondes interactif heurtant une barrière.',
    decoherenceTitle: 'Décohérence',
    decoherenceBody: 'Le processus par lequel la superposition et l\'intrication fragiles d\'un système quantique se dissipent par une interaction inévitable avec son environnement, le faisant se comporter de plus en plus comme un système classique. C\'est le principal obstacle pratique à la construction d\'ordinateurs quantiques grands et fiables.',
    schrodingerTitle: 'L\'équation de Schrödinger',
    schrodingerBody: 'L\'équation maîtresse de la mécanique quantique — elle décrit exactement comment un état quantique évolue de manière continue dans le temps, tout comme les lois de Newton décrivent le mouvement d\'un objet classique. Chaque porte quantique de cette application n\'est en réalité qu\'un instantané de l\'évolution de cette équation sur une tranche de temps fixe, ce qui explique aussi pourquoi les portes sont réversibles : l\'équation ne détruit jamais l\'information, elle la remodèle seulement.',
    bellTheoremTitle: 'Le théorème de Bell et le paradoxe EPR',
    bellTheoremBody: 'Einstein, Podolsky et Rosen ont soutenu en 1935 que la mécanique quantique devait être incomplète — les corrélations des particules intriquées, selon eux, pourraient s\'expliquer par une « variable cachée » partagée, fixée à l\'avance, sans aucun effet réellement étrange. Le théorème de Bell (1964) a prouvé le contraire : aucune théorie fondée sur des variables cachées ne peut jamais reproduire toutes les corrélations prédites par la mécanique quantique, et des décennies d\'expériences ont confirmé les prédictions de la mécanique quantique, et non celles des variables cachées.',
    zenoTitle: 'Effet Zénon quantique',
    zenoBody: 'Mesurer un système quantique suffisamment souvent peut littéralement figer son évolution — chaque mesure ramène l\'état vers ce qu\'il était déjà, avant qu\'il n\'ait eu le temps d\'évoluer. Nommé d\'après le paradoxe de Zénon de la flèche qui ne semble jamais bouger, c\'est une conséquence directe de l\'effondrement de la fonction d\'onde : un état quantique « observé » change bien plus lentement qu\'un état non observé.',
    hilbertSpaceTitle: 'Espace de Hilbert',
    hilbertSpaceBody: 'L\'« espace » mathématique où vit tout état quantique. Chaque état quantique possible est représenté comme un vecteur dans un espace de Hilbert, et les règles de la mécanique quantique — superposition, mesure et évolution — s\'expriment toutes comme des opérations sur ces vecteurs. Un seul qubit vit dans un espace de Hilbert à deux dimensions, tandis qu\'un système à n qubits vit dans un espace à 2ⁿ dimensions.',
    linearOperatorsTitle: 'Opérateurs linéaires',
    linearOperatorsBody: 'Les grandeurs physiques et les portes quantiques sont représentées par des opérateurs linéaires agissant sur les états quantiques. Appliquer un opérateur transforme un état quantique valide en un autre, faisant de l\'algèbre linéaire le langage de la mécanique quantique.',
    observableTitle: 'Observable',
    observableBody: 'Une observable est toute propriété physique mesurable — comme la position, la quantité de mouvement, le spin ou l\'énergie. Chaque observable est représentée par un opérateur hermitien dont les valeurs propres sont les seuls résultats de mesure qui puissent jamais se produire.',
    eigenstatesTitle: 'États propres et valeurs propres',
    eigenstatesBody: 'Si mesurer une observable produit toujours le même résultat pour un état quantique particulier, cet état est un état propre de l\'observable. Le résultat de la mesure est la valeur propre correspondante. Mesurer un état propre le laisse inchangé, alors que mesurer une superposition provoque généralement l\'effondrement de la fonction d\'onde.',
    expectationValueTitle: 'Valeur moyenne (espérance)',
    expectationValueBody: 'Plutôt que de prédire un résultat de mesure unique et défini, la mécanique quantique prédit la valeur moyenne obtenue en répétant la même expérience de nombreuses fois sur des systèmes préparés de manière identique. Cette moyenne est appelée la valeur moyenne (ou espérance).',
    probabilityAmplitudesTitle: 'Amplitudes de probabilité',
    probabilityAmplitudesBody: 'Contrairement aux probabilités ordinaires, la mécanique quantique attribue des amplitudes de probabilité complexes aux résultats possibles. Ces amplitudes peuvent interférer de manière constructive ou destructive, et seuls leurs modules au carré deviennent des probabilités observables via la règle de Born.',
    phaseTitle: 'Phase',
    phaseBody: 'La phase d\'un état quantique est invisible lors d\'une seule mesure, mais détermine comment les amplitudes interfèrent. C\'est la phase relative — et non la phase absolue — qui donne son pouvoir à l\'interférence quantique et à de nombreux algorithmes quantiques.',
    globalPhaseTitle: 'Phase globale et phase relative',
    globalPhaseBody: 'Multiplier un état quantique entier par la même phase complexe ne change rien physiquement ; c\'est ce qu\'on appelle une phase globale. Changer la phase entre les composantes d\'une superposition modifie les motifs d\'interférence observables et a donc des conséquences physiques.',
    spinTitle: 'Spin',
    spinBody: 'Le spin est une forme intrinsèque de moment cinétique portée par les particules quantiques. Contrairement à une rotation ordinaire, le spin est une propriété quantique fondamentale qui ne prend que des valeurs discrètes. Le spin de l\'électron est la réalisation physique de nombreux qubits expérimentaux.',
    pauliExclusionTitle: 'Principe d\'exclusion de Pauli',
    pauliExclusionBody: 'Deux fermions identiques ne peuvent jamais occuper le même état quantique simultanément. Cette règle simple explique la structure des atomes, la chimie, et pourquoi la matière reste stable.',
    identicalParticlesTitle: 'Particules identiques',
    identicalParticlesBody: 'Les particules d\'un même type sont fondamentalement indiscernables. Échanger deux particules identiques ne crée pas un nouvel état physique — cela ne change la fonction d\'onde que par un signe (fermions) ou pas du tout (bosons).',
    bosonsFermionsTitle: 'Bosons et fermions',
    bosonsFermionsBody: 'Les bosons peuvent partager le même état quantique, ce qui permet des phénomènes comme les lasers et les condensats de Bose-Einstein. Les fermions obéissent au principe d\'exclusion de Pauli, ce qui donne naissance à la structure atomique et aux matériaux électroniques.',
    densityMatrixTitle: 'Matrice densité',
    densityMatrixBody: 'Tout système quantique n\'est pas parfaitement isolé. Une matrice densité décrit à la fois les états quantiques purs et les mélanges statistiques, ce qui en fait l\'outil standard pour décrire les systèmes quantiques bruités ou partiellement connus.',
    mixedStatesTitle: 'États mixtes',
    mixedStatesBody: 'Contrairement à une superposition, qui est authentiquement quantique, un état mixte représente une incertitude classique sur l\'état quantique dans lequel se trouve réellement un système. Les matrices densité distinguent ces deux situations très différentes.',
    measurementBasisTitle: 'Base de mesure',
    measurementBasisBody: 'Une mesure quantique se fait toujours par rapport à une base choisie. Le même état peut sembler défini dans une base tout en étant une superposition dans une autre, ce qui rend le choix de la base central en informatique quantique.',
    sternGerlachExpTitle: 'Expérience de Stern–Gerlach',
    sternGerlachExpBody: 'L\'expérience de Stern–Gerlach (1922), réalisée par Otto Stern et Walther Gerlach, a démontré que le moment cinétique est quantifié — montrant que des particules comme les électrons possèdent une propriété intrinsèque appelée spin, qui ne peut prendre que des valeurs discrètes lorsqu\'elle est mesurée selon un axe choisi. C\'est l\'une des expériences fondatrices de la mécanique quantique.'
      + '<ul class="quantum-list">'
      + '<li><b>Objectif :</b> déterminer si le moment magnétique d\'un atome pouvait pointer dans n\'importe quelle direction, comme le prédisait la physique classique, ou seulement selon des orientations spécifiques et quantifiées.</li>'
      + '<li><b>Pourquoi des atomes d\'argent ?</b> L\'argent possède un seul électron de valence non apparié et un moment cinétique orbital total quasiment nul, de sorte que le moment magnétique mesuré provient presque entièrement du spin de cet unique électron — ce qui rend le résultat beaucoup plus facile à interpréter.</li>'
      + '<li><b>Prédiction classique :</b> un moment magnétique orienté aléatoirement devrait dévier d\'une quantité quelconque, étalant le faisceau en une bande continue sur l\'écran.</li>'
      + '<li><b>Ce qui a été réellement observé :</b> le faisceau s\'est séparé en exactement deux points distincts, et non en une bande continue — montrant que seules deux orientations de spin sont possibles selon l\'axe de mesure, spin up (+ħ/2) et spin down (−ħ/2).</li>'
      + '</ul>'
      + 'Explorez cela vous-même, y compris ce qui se passe lorsque vous mesurez le spin selon un second axe incompatible, dans l\'onglet Stern–Gerlach.',
    eprParadoxTitle: 'Paradoxe EPR',
    eprParadoxBody: 'Le paradoxe EPR (1935), proposé par Albert Einstein, Boris Podolsky et Nathan Rosen, est une expérience de pensée soutenant que la mécanique quantique, telle qu\'elle se présentait, devait être une description incomplète de la réalité physique — non pas parce que ses prédictions étaient fausses, mais à cause de ce qu\'elles semblaient impliquer.'
      + '<ul class="quantum-list">'
      + '<li><b>Objectif :</b> montrer que si la mécanique quantique est correcte et que le « réalisme local » est vrai — c\'est-à-dire qu\'une particule possède des propriétés définies indépendamment de la mesure, et qu\'aucune influence ne voyage plus vite que la lumière — alors la mécanique quantique doit manquer quelque chose.</li>'
      + '<li><b>Le dispositif :</b> deux particules sont préparées dans un état intriqué puis séparées par une distance arbitrairement grande. Mesurer une propriété de l\'une révèle instantanément la propriété correspondante de l\'autre, avec certitude.</li>'
      + '<li><b>L\'argument :</b> puisque mesurer la particule A permet de prédire avec certitude le résultat de la particule B sans jamais la toucher, EPR ont raisonné que cette propriété de B devait déjà être fixée avant la mesure — sinon, mesurer A devrait affecter B instantanément, ce qui ressemblait à une « action fantôme à distance ».</li>'
      + '<li><b>Le paradoxe :</b> la mécanique quantique affirme que les deux particules partagent un unique état conjoint indéterminé jusqu\'à la mesure. Le raisonnement même d\'EPR affirmait que cela était impossible si la localité est respectée — donc soit la mécanique quantique est incomplète, soit la nature est réellement non locale en ce sens précis.</li>'
      + '</ul>'
      + 'Pendant trente ans, cela est resté une question d\'interprétation sans réponse expérimentale — jusqu\'à ce que le théorème de Bell (voir ci-dessus) en fasse une question testable, et les expériences ont tranché nettement contre l\'intuition d\'Einstein sur les variables cachées.',
    qubitTitle: 'Qubit',
    qubitBody: 'L\'unité fondamentale de l\'information quantique — comme un bit classique, mais capable d\'exister en superposition de 0 et de 1 plutôt que d\'être figé sur une seule valeur. L\'état exact d\'un qubit est décrit par deux amplitudes complexes et représenté comme un point sur la sphère de Bloch, exploré dans l\'onglet Bits & Qubits.',
    blochSphereTitle: 'Sphère de Bloch',
    blochSphereBody: 'Une représentation géométrique de tout état possible d\'un qubit unique sous forme de point à la surface d\'une sphère — les pôles nord et sud sont |0⟩ et |1⟩, et tout autre point est une certaine superposition des deux. Elle transforme l\'algèbre abstraite des amplitudes en quelque chose que l\'on peut littéralement voir et manipuler.',
    gateTitle: 'Porte quantique',
    gateBody: 'L\'équivalent quantique d\'une porte logique classique — une opération qui transforme l\'état d\'un qubit, géométriquement une rotation de son point sur la sphère de Bloch. Contrairement aux portes classiques, chaque porte quantique est réversible : aucune d\'elles ne jette jamais d\'information. Voir l\'onglet Portes pour les six portes fixes (H, X, Y, Z, S, T) et leurs effets.',
    unitarityTitle: 'Unitarité et réversibilité',
    unitarityBody: 'Toute porte quantique valide doit être une matrice unitaire (U†U = I) — la condition mathématique qui garantit qu\'elle préserve la probabilité totale et peut toujours être défaite par sa propre transposée conjuguée. C\'est pourquoi le calcul quantique, contrairement à la logique classique ET/OU, ne détruit jamais d\'information en cours de route.',
    circuitTitle: 'Circuit quantique',
    circuitBody: 'Une séquence de portes quantiques appliquées à un ou plusieurs qubits, lue de gauche à droite — l\'équivalent quantique d\'un circuit logique classique. Comme l\'ordre des portes compte généralement (les rotations ne commutent pas), le même ensemble de portes dans un ordre différent peut mener les qubits vers un état final entièrement différent ; construisez-en un vous-même dans l\'onglet Circuits.',
    bellGhzTitle: 'États de Bell et états GHZ',
    bellGhzBody: 'Les états de Bell sont les quatre états spécifiques, maximalement intriqués, de deux qubits — Φ⁺, Φ⁻, Ψ⁺ et Ψ⁻ — formant une base orthonormée fondamentale en information quantique et la ressource centrale de protocoles comme la téléportation quantique et le codage superdense. Les quatre sont produits par la même recette à deux portes (une porte Hadamard sur un qubit, puis une porte CNOT contrôlée par celui-ci), en partant simplement d\'un état de base à deux qubits différent à chaque fois.'
      + '<br><br>Les quatre états de Bell sont :'
      + '<ul class="quantum-list">'
      + '<li><b>Φ⁺ = (|00⟩ + |11⟩)/√2</b> — les qubits correspondent et restent en phase.</li>'
      + '<li><b>Φ⁻ = (|00⟩ − |11⟩)/√2</b> — les qubits correspondent, avec une inversion de phase.</li>'
      + '<li><b>Ψ⁺ = (|01⟩ + |10⟩)/√2</b> — les qubits sont opposés et en phase.</li>'
      + '<li><b>Ψ⁻ = (|01⟩ − |10⟩)/√2</b> — les qubits sont opposés, avec une inversion de phase.</li>'
      + '</ul>'
      + 'Mesurer l\'un des deux qubits, dans n\'importe lequel des quatre états, détermine instantanément le résultat de l\'autre. Les états GHZ généralisent la même idée à trois qubits ou plus, tous corrélés ensemble — construisez des paires de Bell et des triplets GHZ à partir de zéro avec des portes Hadamard et CNOT dans l\'onglet Circuits.',
    noCloningTitle: 'Théorème de non-clonage',
    noCloningBody: 'Il est physiquement impossible de créer une copie exacte et indépendante d\'un état quantique inconnu arbitraire — une conséquence directe de la linéarité de la mécanique quantique. C\'est pourquoi l\'information quantique doit être traitée si différemment des bits classiques, qui peuvent toujours être copiés librement.',
    algorithmsTitle: 'Algorithmes quantiques',
    algorithmsBody: 'Des procédures pas à pas construites à partir de portes quantiques qui exploitent la superposition et l\'interférence pour résoudre certains problèmes bien plus rapidement que n\'importe quel algorithme classique connu — l\'algorithme de Shor factorise efficacement de grands nombres, et l\'algorithme de Grover parcourt une liste non triée de façon quadratiquement plus rapide que n\'importe quelle recherche classique.',
    errorCorrectionTitle: 'Correction d\'erreurs quantiques',
    errorCorrectionBody: 'Un ensemble de techniques permettant de protéger l\'information quantique fragile contre la décohérence et le bruit en répartissant l\'état d\'un seul qubit logique de manière redondante sur de nombreux qubits physiques, sans jamais mesurer directement — et donc effondrer — l\'information elle-même. L\'un des principaux défis techniques qui séparent les ordinateurs quantiques bruités d\'aujourd\'hui des machines fiables à grande échelle.',
    supremacyTitle: 'Suprématie / avantage quantique',
    supremacyBody: 'Le seuil à partir duquel un ordinateur quantique accomplit une tâche spécifique plus rapidement que n\'importe quel supercalculateur classique ne pourrait raisonnablement le faire — « suprématie » pour une tâche de référence (potentiellement artificielle), « avantage » pour une tâche réellement utile. Cela démontre que les effets quantiques peuvent être exploités pour une puissance de calcul réelle, et non simplement simulés sur une machine classique.',
    teleportationTitle: 'Téléportation quantique',
    teleportationBody: 'Un protocole permettant de transférer l\'état exact d\'un qubit inconnu vers un qubit distant, en utilisant une paire intriquée partagée ainsi que deux bits classiques de communication — sans jamais mesurer directement (et donc détruire) l\'état d\'origine. Malgré son nom, rien ne voyage plus vite que la lumière : le récepteur ne peut reconstruire l\'état qu\'une fois les bits classiques ordinaires arrivés, et l\'état du qubit d\'origine est inévitablement détruit dans le processus, conformément au théorème de non-clonage.',
    qkdTitle: 'Cryptographie quantique (QKD)',
    qkdBody: 'La distribution quantique de clés permet à deux parties de convenir d\'une clé secrète partagée dont la sécurité est garantie par la physique plutôt que par la difficulté de calcul — des protocoles comme BB84 encodent les bits de la clé dans des états de qubits de telle sorte que toute mesure d\'un espion les perturbe inévitablement, révélant l\'intrusion. C\'est une application pratique directe du théorème de non-clonage : un espion ne peut pas copier secrètement les qubits pour les examiner sans être détecté.',
    qftTitle: 'Transformée de Fourier quantique (QFT)',
    qftBody: 'L\'équivalent quantique de la transformée de Fourier discrète classique, mise en œuvre comme un circuit quantique s\'exécutant exponentiellement plus vite que tout équivalent classique. C\'est la sous-routine clé de l\'algorithme de Shor — l\'étape qui extrait la périodicité cachée utilisée pour factoriser de grands nombres — et elle apparaît dans de nombreux algorithmes quantiques partout où un motif caché doit être extrait d\'une superposition.',
    tensorProductTitle: 'Produit tensoriel',
    tensorProductBody: 'Plusieurs qubits se combinent par produit tensoriel plutôt que par addition ordinaire. Deux qubits nécessitent donc quatre amplitudes, trois qubits en nécessitent huit, et n qubits en nécessitent 2ⁿ — c\'est l\'origine de l\'énorme espace d\'états de l\'informatique quantique.',
    multiQubitStatesTitle: 'États à plusieurs qubits',
    multiQubitStatesBody: 'Un système de plusieurs qubits ne peut pas toujours être décrit comme des états indépendants à un seul qubit. Certains états se factorisent en qubits séparés, tandis que d\'autres deviennent intriqués et nécessitent une description conjointe unique.',
    controlledGatesTitle: 'Portes contrôlées',
    controlledGatesBody: 'Les portes contrôlées n\'effectuent une opération que lorsqu\'un autre qubit a une valeur particulière. La porte CNOT en est l\'exemple le plus simple et constitue le bloc de construction essentiel pour créer de l\'intrication.',
    swapGateTitle: 'Porte SWAP',
    swapGateBody: 'La porte SWAP échange les états quantiques de deux qubits sans les mesurer. Elle est largement utilisée pour déplacer l\'information au sein d\'un processeur quantique.',
    universalGateSetsTitle: 'Ensembles de portes universels',
    universalGateSetsBody: 'Une petite collection de portes suffit à approximer n\'importe quel calcul quantique avec une précision arbitraire. Les exemples incluent {H, T, CNOT} et {Rx, Ry, CNOT}.',
    quantumParallelismTitle: 'Parallélisme quantique',
    quantumParallelismBody: 'Parce qu\'un ordinateur quantique peut préparer une superposition de nombreuses entrées simultanément, une seule opération agit sur toutes à la fois. Le défi consiste à extraire une information utile par interférence plutôt que d\'essayer de lire chaque résultat.',
    oracleTitle: 'Oracle',
    oracleBody: 'De nombreux algorithmes quantiques traitent une partie d\'un problème comme une fonction boîte noire appelée oracle. L\'algorithme gagne en rapidité en interrogeant l\'oracle en superposition quantique.',
    ancillaQubitsTitle: 'Qubits ancillaires',
    ancillaQubitsBody: 'Les qubits ancillaires sont des qubits auxiliaires temporaires utilisés pendant les calculs, la correction d\'erreurs et l\'arithmétique, avant d\'être réinitialisés ou abandonnés.',
    quantumMeasurementTitle: 'Mesure quantique',
    quantumMeasurementBody: 'Bien que la mesure ait déjà été abordée, l\'informatique quantique la traite de façon opérationnelle. Mesurer un qubit convertit une information quantique fragile en un bit classique ordinaire, mettant fin à l\'évolution cohérente.',
    midCircuitMeasurementTitle: 'Mesure en cours de circuit',
    midCircuitMeasurementBody: 'Certains ordinateurs quantiques permettent des mesures pendant le calcul plutôt qu\'uniquement à la fin. Les portes suivantes peuvent dépendre de ces résultats de mesure, ce qui permet la correction d\'erreurs et les algorithmes adaptatifs.',
    classicalFeedforwardTitle: 'Rétroaction classique (feedforward)',
    classicalFeedforwardBody: 'Les résultats de mesure obtenus pendant un circuit quantique peuvent déterminer quelles portes suivantes doivent être appliquées, combinant contrôle classique et évolution quantique.',
    quantumInfoGroupTitle: 'Théorie de l\'information quantique',
    quantumInformationTitle: 'Information quantique',
    quantumInformationBody: 'L\'information quantique est une information stockée dans des états quantiques. Contrairement à l\'information classique, elle peut exploiter la superposition et l\'intrication, permettant des formes entièrement nouvelles de calcul et de communication.',
    quantumChannelTitle: 'Canal quantique',
    quantumChannelBody: 'Un canal quantique décrit mathématiquement comment l\'information quantique change lorsqu\'elle voyage dans l\'espace ou interagit avec du bruit.',
    fidelityTitle: 'Fidélité',
    fidelityBody: 'La fidélité mesure à quel point deux états quantiques se ressemblent. Elle est largement utilisée pour évaluer le matériel quantique, les portes et la correction d\'erreurs.',
    traceDistanceTitle: 'Distance de trace',
    traceDistanceBody: 'La distance de trace quantifie à quel point deux états quantiques sont distinguables. Elle donne la probabilité maximale de les distinguer à l\'aide de n\'importe quelle mesure possible.',
    entanglementEntropyTitle: 'Entropie d\'intrication',
    entanglementEntropyBody: 'Une mesure numérique de l\'intensité avec laquelle différentes parties d\'un système quantique sont intriquées. Elle joue un rôle central en physique de la matière condensée, en théorie quantique des champs et en gravité quantique.',
    stateTomographyTitle: 'Tomographie d\'état quantique',
    stateTomographyBody: 'Une technique permettant de reconstruire un état quantique inconnu en effectuant de nombreuses mesures dans différentes bases.',
    processTomographyTitle: 'Tomographie de processus',
    processTomographyBody: 'Plutôt que de reconstruire un état, la tomographie de processus reconstruit une porte ou une opération quantique inconnue en étudiant comment elle transforme de nombreux états d\'entrée connus.',
    advancedGroupTitle: 'Informatique quantique avancée',
    vqeQaoaTitle: 'Algorithmes quantiques variationnels (VQE et QAOA)',
    vqeQaoaBody: 'Les algorithmes quantiques variationnels sont des algorithmes hybrides quantique-classique dans lesquels un ordinateur quantique prépare des états quantiques paramétrés pendant qu\'un ordinateur classique ajuste de façon répétée ces paramètres pour optimiser un objectif donné. Cette boucle de rétroaction itérative les rend particulièrement adaptés au matériel quantique bruité d\'aujourd\'hui (dispositifs NISQ).'
      + '<br><br>Les deux exemples les plus connus sont :'
      + '<ul class="quantum-list">'
      + '<li><b>Variational Quantum Eigensolver (VQE) :</b> Conçu pour estimer l\'état de plus basse énergie (état fondamental) d\'un système quantique. Il est largement utilisé en chimie quantique, en science des matériaux et en simulation hamiltonienne pour étudier les molécules et les matériaux quantiques.</li>'
      + '<li><b>Quantum Approximate Optimization Algorithm (QAOA) :</b> Conçu pour trouver des solutions approchées de haute qualité à des problèmes d\'optimisation combinatoire difficiles — comme le routage, la planification, le partitionnement de graphes et l\'optimisation de portefeuille — en alternant des opérations quantiques spécifiques au problème et des opérations de mélange.</li>'
      + '</ul>'
      + 'Le VQE et le QAOA sont parmi les algorithmes quantiques les plus prometteurs pour les ordinateurs quantiques bruités à échelle intermédiaire (NISQ) d\'aujourd\'hui, car ils réduisent la profondeur des circuits quantiques tout en tirant parti de l\'optimisation classique.',
    nisqTitle: 'Informatique NISQ',
    nisqBody: 'L\'ère actuelle des ordinateurs quantiques est appelée l\'ère NISQ (Noisy Intermediate-Scale Quantum, quantique bruité à échelle intermédiaire) : les dispositifs contiennent de dizaines à milliers de qubits imparfaits, mais ne peuvent pas encore exécuter d\'algorithmes pleinement tolérants aux fautes.',
    faultTolerantTitle: 'Informatique quantique tolérante aux fautes',
    faultTolerantBody: 'Une future génération d\'ordinateurs quantiques capables d\'effectuer des calculs de longueur arbitraire malgré les erreurs matérielles, grâce à la correction d\'erreurs quantiques.',
    surfaceCodeTitle: 'Code de surface',
    surfaceCodeBody: 'Le principal code de correction d\'erreurs quantiques, encodant un qubit logique dans de nombreux qubits physiques disposés sur un réseau bidimensionnel.',
    logicalPhysicalQubitsTitle: 'Qubits logiques et qubits physiques',
    logicalPhysicalQubitsBody: 'Les qubits physiques sont les qubits matériels qui subissent le bruit. Les qubits logiques sont des qubits protégés, corrigés contre les erreurs, encodés à travers de nombreux qubits physiques.',
    magicStatesTitle: 'États magiques',
    magicStatesBody: 'Certaines portes quantiques ne peuvent pas être mises en œuvre directement dans de nombreuses architectures tolérantes aux fautes. À la place, des « états magiques » spécialement préparés sont consommés pour les réaliser, ce qui fait de la distillation d\'états magiques l\'un des coûts les plus importants de l\'informatique quantique à grande échelle.',
    hamiltonianSimulationTitle: 'Simulation hamiltonienne',
    hamiltonianSimulationBody: 'L\'une des motivations d\'origine de l\'informatique quantique : simuler efficacement la dynamique de molécules, de matériaux et de théories quantiques des champs régies par un hamiltonien. De nombreux chercheurs — y compris ceux travaillant sur les théories de jauge sur réseau et la chimie quantique — considèrent cela comme l\'une des applications à long terme les plus importantes des ordinateurs quantiques.',
    qpeTitle: 'Estimation de phase quantique (QPE)',
    qpeBody: 'Un algorithme quantique fondamental permettant d\'estimer les valeurs propres d\'opérateurs unitaires. Il sous-tend l\'algorithme de Shor ainsi que de nombreux algorithmes de chimie quantique et de simulation hamiltonienne.',
    adiabaticQCTitle: 'Informatique quantique adiabatique',
    adiabaticQCBody: 'Un modèle de calcul dans lequel le système reste dans son état fondamental pendant que son hamiltonien évolue lentement. Si l\'évolution est suffisamment lente, l\'état fondamental final encode la solution d\'un problème d\'optimisation.',
    mbqcTitle: 'Informatique quantique basée sur la mesure',
    mbqcBody: 'Plutôt que de calculer principalement avec des portes, le calcul se déroule en préparant un grand état ressource intriqué (un état de cluster), puis en effectuant des mesures soigneusement choisies. Ce sont les mesures elles-mêmes qui pilotent le calcul.'
  },
  measure: {
    title: 'Mesure',
    subtitle: 'Les barres ci-dessous représentent des probabilités, pas un aperçu — mesurer force le qubit à répondre à une question dont il était réellement indécis, et il n\'y a pas de retour en arrière possible',
    quantumState: 'État quantique',
    measureButton: 'MESURER',
    postulateTitle: 'Le postulat de mesure',
    postulateBody1: 'Ce n\'est pas une simple simplification de l\'application — c\'est l\'un des axiomes de la mécanique quantique. Mesurer un qubit |ψ⟩ = α|0⟩ + β|1⟩ renvoie 0 avec une probabilité |α|² et 1 avec une probabilité |β|² (la règle de Born), et immédiatement après, l\'état s\'est effondré sur le résultat obtenu — l\'autre possibilité a tout simplement disparu, pas seulement été cachée.',
    postulateFormula: 'P(0) = |α|²&nbsp;&nbsp;&nbsp; P(1) = |β|²&nbsp;&nbsp;&nbsp; α|0⟩ + β|1⟩ → |0⟩ ou |1⟩',
    postulateBody2: 'Remarquez ce qui manque : rien dans cette règle n\'indique quel résultat vous obtiendrez lors d\'un essai unique — seulement les probabilités sur de nombreux qubits identiques, ce à quoi sert exactement l\'histogramme ci-dessous.',
    measurementStatistics: 'Statistiques de mesure',
    confirmOddsBody: 'C\'est la seule façon de réellement confirmer ces probabilités — poser la même question à de nombreux qubits identiques et observer l\'histogramme se stabiliser selon la répartition prédite. Un seul qubit ne donne jamais qu\'une seule réponse ; le motif n\'apparaît qu\'à travers une foule de mesures.'
  },
  entangle: {
    title: 'Intrication quantique',
    subtitle: 'État de Bell (|00⟩ + |11⟩)/√2 — aucun des deux qubits n\'a d\'état défini seul ; mesurer l\'un détermine instantanément l\'autre',
    bannerAlt: 'Illustration de l\'analogie du lancer de pièce pour l\'intrication quantique : deux personnes lancent chacune une pièce à des détecteurs séparés, reliés par une sphère lumineuse de cônes de corrélation — quel que soit le côté sur lequel tombe la pièce A, la pièce B tombe instantanément du côté opposé, l\'état restant indéterminé jusqu\'à la mesure.',
    jointStateLabel: 'état conjoint des deux qubits',
    explainerTitle: 'Qu\'est-ce que l\'intrication quantique ?',
    explainerBody1: 'L\'intrication quantique est un phénomène dans lequel deux particules ou plus deviennent liées de telle sorte que leurs états quantiques ne peuvent plus être décrits indépendamment l\'un de l\'autre — même lorsque les particules sont séparées par d\'énormes distances. Plutôt que deux qubits séparés, chacun portant son propre état, la paire partage un unique état conjoint, comme l\'état de Bell (|00⟩ + |11⟩)/√2 montré ci-dessus : un mélange 50/50 de « les deux mesurés à 0 » et « les deux mesurés à 1 », sans aucun moyen de le décomposer en ce que fait le qubit A ou le qubit B pris séparément.',
    explainerBody2: 'L\'intrication n\'est pas produite par une quelconque force mystérieuse qui relierait les particules — elle est créée localement, au moment où deux qubits interagissent (ici, avec une porte Hadamard suivie d\'une porte CNOT — construisez la même recette porte par porte dans l\'onglet Circuits), et elle persiste ensuite, quelle que soit la distance que les qubits parcourent par la suite. Einstein qualifiait célèbrement les corrélations qui en résultent d\'« action fantôme à distance », car mesurer un qubit semble affecter instantanément l\'autre.',
    explainerBody3: 'Les deux cartes ci-dessous détaillent ce qui se cache derrière cette intuition : pourquoi un tel état ne peut vraiment pas être décrit comme deux qubits séparés, et pourquoi la corrélation instantanée ne peut toujours pas être utilisée pour envoyer un signal plus rapide que la lumière.',
    mapCaption: 'Deux lieux différents, arbitrairement éloignés — la corrélation tient quelle que soit la distance qui les sépare.',
    entangledLabel: 'Intriqué',
    measureBoth: 'Mesurer les deux',
    measureAOnly: 'Mesurer A seulement',
    tensorTitle: 'Pourquoi ce n\'est pas juste deux qubits ? (Produits tensoriels)',
    tensorBody1: 'Deux qubits indépendants se combinent toujours par <span class="key-term">produit tensoriel</span> (⊗) : on empile le vecteur à 2 entrées du qubit A contre celui du qubit B, en multipliant chaque paire d\'entrées pour construire un vecteur conjoint à 4 entrées. Tout état produit — tout ce que vous pouvez construire dans le panneau Deux Qubits de l\'onglet Bits & Qubits — se factorise ainsi en deux qubits séparés :',
    tensorFormula1: '|0⟩⊗|0⟩ = [1,0]<sup>T</sup>⊗[1,0]<sup>T</sup> = [1,0,0,0]<sup>T</sup> = |00⟩',
    tensorBody2: 'L\'état de Bell ci-dessus est lui aussi un vecteur à 4 entrées — [1,0,0,1]<sup>T</sup>/√2 — mais essayez de le factoriser en [a,b]<sup>T</sup>⊗[c,d]<sup>T</sup> = [ac,ad,bc,bd]<sup>T</sup> : il n\'existe aucune solution. <em>ad</em> = 0 et <em>bc</em> = 0 obligent l\'un des deux facteurs de chaque paire à être nul, ce qui annulerait aussi <em>ac</em> ou <em>bd</em> — aucun couple d\'états à un qubit A et B ne se multiplie pour le reproduire.',
    tensorFormula2: '(|00⟩ + |11⟩) / √2 = [1, 0, 0, 1]ᵀ/√2 ≠ [a,b]ᵀ ⊗ [c,d]ᵀ pour tous a, b, c, d',
    tensorBody3: 'C\'est la définition littérale et vérifiable de l\'intrication : un état conjoint qui ne peut pas être décomposé à nouveau en deux facteurs indépendants à un seul qubit. Aucun des deux qubits n\'a de son côté un état bien défini — seule la paire en a un.',
    relativityTitle: 'Pourquoi cela ne viole pas la relativité',
    relativityBody1: 'Ce dispositif est une version de l\'expérience de pensée d\'Einstein-Podolsky-Rosen (EPR) : Alice mesure le qubit A et connaît instantanément le résultat du qubit B, même si B se trouve à des années-lumière. Cela ressemble à une transmission d\'information plus rapide que la lumière — mais ce n\'en est pas une.',
    relativityBody2: 'Alice ne peut pas choisir le résultat qu\'elle obtient — celui-ci reste aléatoire, avec les mêmes probabilités de 50/50 que n\'importe quel qubit seul. Il n\'y a donc rien qu\'elle puisse contrôler, et donc rien qu\'elle puisse encoder dans un message. La corrélation n\'est visible qu\'après coup, une fois qu\'Alice et Bob comparent leurs résultats via un canal ordinaire (plus lent que la lumière). Aucune énergie, aucune information, et aucun signal ne traverse réellement la distance qui les sépare au moment de la mesure.',
    cernTitle: 'Pourquoi le CERN S\'intéresse à l\'Intrication',
    cernBody1: 'Ce n\'est pas qu\'un exemple pédagogique. Les physiciens du LHC ont mesuré une véritable intrication quantique directement dans les particules produites par les collisions proton-proton — notamment entre un quark top et son antiquark, créés et se désintégrant en une fraction de billionième de billionième de seconde. La même mathématique d\'état de Bell présentée sur cette page, (|00⟩ + |11⟩)/√2, décrit une corrélation réelle, mesurée, dans l\'environnement de plus haute énergie jamais construit par l\'humanité.',
    cernBody2: 'L\'Initiative Technologie Quantique du CERN traite l\'intrication et la superposition comme des ressources d\'ingénierie, pas de simples curiosités : des ordinateurs quantiques pour simuler les théories quantiques des champs derrière la physique des particules elle-même — un problème qui passe mal à l\'échelle sur des ordinateurs classiques — et des capteurs quantiques construits à partir d\'états intriqués ou comprimés, visant le type de mesures de précision extrême dont dépendent les recherches de matière noire et d\'autre nouvelle physique.'
  },
  bellstates: {
    title: 'États de Bell',
    subtitle: 'Les quatre états à deux qubits maximalement intriqués — choisissez-en un pour voir comment il est construit, comment il est classé, et ce qu\'il prédit exactement',
    pickTitle: 'Choisissez un état de Bell',
    circuitTitle: 'Schéma du circuit',
    recipe: {
      phiplus: 'Partez de |00⟩, appliquez H au qubit A, puis CNOT (A → B).',
      phiminus: 'Partez de |00⟩, appliquez X au qubit A, puis H au qubit A, puis CNOT (A → B).',
      psiplus: 'Partez de |00⟩, appliquez X au qubit B, puis H au qubit A, puis CNOT (A → B).',
      psiminus: 'Partez de |00⟩, appliquez X aux deux qubits, puis H au qubit A, puis CNOT (A → B).'
    },
    familyTitle: 'La famille de Bell',
    familyBody: 'Chaque état de Bell occupe l\'un des quatre coins, déterminé par deux choix indépendants : la ligne (résultats de mesure identiques ou opposés) et la colonne (une phase relative + ou −). Cliquez sur un coin pour le préparer.',
    plusPhase: 'phase +',
    minusPhase: 'phase −',
    sameRow: 'Identiques',
    oppositeRow: 'Opposés',
    distributionTitle: 'Distribution de probabilité',
    distributionNote: 'Probabilités exactes issues de la règle de Born pour {symbol} — aucun échantillonnage nécessaire, elles découlent directement du carré de chaque amplitude.',
    definitionsTitle: 'Les quatre états de Bell',
    definitionsBody: 'Les quatre sont construits à partir du même point de départ |00⟩ avec la même recette à deux portes — une porte Hadamard sur le qubit A, puis un CNOT contrôlé par celui-ci — précédée simplement d\'une porte X sur le ou les qubits à inverser d\'abord :'
      + '<ul class="quantum-list">'
      + '<li><b>Φ⁺ = (|00⟩ + |11⟩)/√2</b> — aucune porte X. Les résultats correspondent toujours.</li>'
      + '<li><b>Φ⁻ = (|00⟩ − |11⟩)/√2</b> — porte X sur le qubit A d\'abord. Les résultats correspondent toujours.</li>'
      + '<li><b>Ψ⁺ = (|01⟩ + |10⟩)/√2</b> — porte X sur le qubit B d\'abord. Les résultats sont toujours opposés.</li>'
      + '<li><b>Ψ⁻ = (|01⟩ − |10⟩)/√2</b> — porte X sur les deux qubits d\'abord. Les résultats sont toujours opposés.</li>'
      + '</ul>'
      + 'Ensemble, ils forment une base orthonormée complète pour deux qubits — la ressource centrale derrière la téléportation quantique et le codage superdense.',
    phaseNoteTitle: 'Pourquoi le signe moins n\'apparaît-il pas ?',
    phaseNoteBody: 'Φ⁺ et Φ⁻ (de même que Ψ⁺ et Ψ⁻) donnent des distributions de probabilité identiques ci-dessus, car une phase relative — le signe − — ne change aucune probabilité dans la base de calcul ; seul |amplitude|² compte. Les deux états restent physiquement distincts : la phase devient visible dès que l\'on fait interférer les qubits entre eux, par exemple en appliquant une porte Hadamard à chacun avant de mesurer — c\'est exactement l\'étape supplémentaire sur laquelle s\'appuient les tests des inégalités de Bell et le codage superdense pour distinguer les quatre états.'
  },
  tunnel: {
    title: 'Effet tunnel quantique',
    subtitle: 'Envoyez un paquet d\'ondes contre un mur plus haut que sa propre énergie. Classiquement, il rebondit toujours. Quantiquement, une partie le traverse malgré tout',
    reflected: 'Réfléchi',
    transmitted: 'Transmis',
    barrier: 'Barrière',
    fireAgain: '↻ Relancer',
    runHistory: 'Historique des tirs',
    clearHistory: 'Effacer',
    historyEmpty: 'Aucun tir terminé pour l\'instant.',
    historyCount: '· {count} tirs',
    validationNote: 'Solveur validé automatiquement : probabilité conservée à <0,3 % sur une exécution complète ; la transmission chute correctement de >10 % à V₀=E vers <2 % à V₀=2,5E.'
  },
  interference: {
    title: 'Interférence des ondes',
    subtitle: 'Deux chemins ouverts et un écran qui compte les points. Chaque point à droite est une particule qui atterrit — pourtant, ensemble, elles dessinent une onde',
    screen: 'Écran',
    setup: 'Configuration',
    doubleSlit: 'Double fente',
    singleSlit: 'Fente unique',
    whichPath: 'Chemin connu',
    wave: 'Onde',
    clearAccumulation: 'Effacer l\'accumulation',
    physicsInDetail: 'La physique, en détail',
    body1: 'Chaque point sur l\'écran est une particule qui atterrit à un endroit précis — cela, en soi, n\'a rien d\'inhabituel. Ce qui n\'est pas ordinaire, c\'est <em>où</em> ces points sont autorisés à atterrir. Envoyez des particules une par une vers la double fente, sans aucune possibilité que deux particules se croisent en plein vol, et les points s\'accumulent quand même en bandes. Il n\'y a pas de foule de particules qui interfèrent entre elles — la fonction d\'onde de chaque particule individuelle passe par <em>les deux</em> fentes à la fois et interfère avec elle-même. C\'est là le véritable mystère, pas seulement le fait que « les ondes créent des motifs ».',
    formula: 'I(y) = |A<sub>1</sub>(y) + A<sub>2</sub>(y)|² = |A<sub>1</sub>|² + |A<sub>2</sub>|² + 2|A<sub>1</sub>||A<sub>2</sub>|cos φ(y)',
    body2: 'A<sub>1</sub> et A<sub>2</sub> sont les amplitudes pour « la particule est passée par la fente 1 » et « par la fente 2 », et φ(y) est la distance supplémentaire que parcourt l\'un des chemins pour atteindre le point y, convertie en phase. Les probabilités classiques s\'additionneraient simplement : P = P<sub>1</sub> + P<sub>2</sub>, un tas plat sans bandes. Les amplitudes quantiques s\'additionnent d\'abord et sont élevées au carré ensuite — et élever une somme au carré produit ce terme croisé <strong>2|A<sub>1</sub>||A<sub>2</sub>|cos φ</strong>, positif en certains points y (franges brillantes), négatif en d\'autres (franges sombres), et c\'est la seule raison pour laquelle les bandes existent.',
    body3: '<strong>Double fente</strong> — les deux chemins restent ouverts et véritablement indiscernables, donc le terme croisé subsiste et l\'on obtient des franges. <strong>Fente unique</strong> — une seule amplitude existe, donc elle n\'a rien avec quoi interférer ; I = |A<sub>1</sub>|², une simple tache de diffraction. <strong>Chemin connu</strong> — les deux fentes restent physiquement ouvertes, mais marquer le chemin de chaque particule (les petits points de détecteur sur la plaque) fait qu\'une mesure du chemin existe désormais pour chaque impact. Moyenné sur ces mesures, le terme croisé s\'annule exactement, laissant le I = |A<sub>1</sub>|² + |A<sub>2</sub>|² plat auquel on s\'attendrait pour des particules ordinaires — deux bosses, aucune bande. Il n\'est nul besoin de perturber physiquement la particule pour que cela se produise ; rendre simplement le chemin <em>connaissable en principe</em> suffit à effacer le motif.',
    body4: 'C\'est pourquoi l\'animation d\'ondulations à gauche et l\'écran point par point à droite sont montrés côte à côte : les ondulations représentent l\'image ondulatoire continue qui prédit où le terme croisé est constructif ou destructif, et l\'écran est ce qui est réellement mesuré — un clic aléatoire, tout ou rien, à la fois. L\'onde n\'atterrit jamais nulle part ; seule la particule le fait. Les bandes sont l\'empreinte de l\'onde sur les endroits où les particules ont pu, ou n\'ont pas pu, cliquer.'
  },
  beamsplitter: {
    title: 'Séparateur de faisceau',
    subtitle: 'Un photon unique frappe un séparateur de faisceau 50/50 et est réfléchi de façon aléatoire vers le détecteur A ou transmis vers le détecteur B — un photon, un résultat aléatoire, jamais un photon divisé en deux',
    svgAlt: 'Diagramme d\'une source de photons tirant sur un séparateur de faisceau 50/50, réfléchi vers le haut vers le détecteur A ou transmis vers la droite vers le détecteur B. Un faible duplicata apparaît brièvement sur le chemin non emprunté, illustrant la superposition qui existait avant la détection du photon.',
    photonSource: 'Source de photons',
    reflected: 'réfléchi',
    transmitted: 'transmis',
    beamSplitterLabel: 'Séparateur de faisceau',
    detectorA: 'Détecteur de photons A',
    detectorB: 'Détecteur de photons B',
    firePhoton: 'Émettre un photon',
    detectorTally: 'Décompte des détecteurs'
  },
  sterngerlach: {
    title: 'Expérience de Stern–Gerlach',
    subtitle: 'Envoyez des atomes un par un à travers un champ magnétique et observez le spin — une propriété purement quantique — se révéler sous la forme d\'un petit nombre de points discrets, jamais d\'une traînée continue',
    definitionTitle: 'Qu\'est-ce que le Spin ?',
    definitionBody1: 'Le spin est une forme intrinsèque de moment cinétique portée par chaque particule élémentaire et chaque atome — non une rotation physique littérale, mais une propriété authentique et permanente présente même pour une particule sans aucune structure interne susceptible de tourner. Il est quantifié : une mesure du spin selon n\'importe quel axe choisi ne peut renvoyer qu\'une valeur parmi un petit ensemble fixe de valeurs discrètes, jamais une valeur continûment variable. Pour une particule de spin ½, comme l\'électron non apparié responsable du moment magnétique d\'un atome d\'argent, cette mesure a exactement deux résultats possibles — classiquement appelés « haut » et « bas » selon l\'axe mesuré — avec une probabilité pour chacun fixée par l\'état quantique de l\'atome via la règle de Born, la même règle qui régit chaque résultat de mesure ailleurs dans cette application.',
    definitionBody2: 'L\'expérience de Stern–Gerlach (1922) fut la première observation directe de cette quantification : un faisceau d\'atomes d\'argent envoyé à travers un champ magnétique à fort gradient spatial s\'est séparé en exactement deux points discrets sur un écran détecteur, plutôt que la traînée continue qu\'aurait produite un moment magnétique classique orienté arbitrairement. L\'appareil interactif ci-dessous reproduit cette même mesure, un atome à la fois.',
    svgAlt: 'Schéma d\'atomes d\'argent entrant dans un aimant de Stern-Gerlach avec un pôle sud en arête de couteau au-dessus et un pôle nord large et incurvé en dessous, séparant le faisceau vers un résultat Haut ou Bas. Les atomes peuvent venir directement d\'un four avec un angle de spin d\'entrée réglable, ou être déjà prémesurés avec l\'axe de cet aimant sélectionnable, pour tester si une seconde mesure perturbe un spin déjà défini.',
    atomSource: 'Four',
    silverAtomsArrow: 'Atomes d\'argent',
    collimatingSlits: 'Fentes de collimation',
    magnetLabel: 'Champ inhomogène',
    detectorUp: 'Détecteur Haut',
    detectorDown: 'Détecteur Bas',
    detectorPlus: 'Détecteur « + »',
    detectorMinus: 'Détecteur « − »',
    fireAtom: 'Tirer un atome',
    magnetCountTitle: 'Nombre d\'aimants',
    oneMagnet: '1 aimant',
    twoMagnets: '2 aimants (séquentiel)',
    inputSpinTitle: 'Angle de spin d\'entrée',
    inputSpinBody: 'Le même θ que sur la sphère de Bloch — θ = 0° prépare un spin certainement vers le haut, θ = 180° certainement vers le bas, et toute valeur intermédiaire est une véritable superposition des deux.',
    detectorTally: 'Décompte des détecteurs',
    whyTwoSpotsTitle: 'Pourquoi seulement deux points ?',
    whyTwoSpotsBody: 'La force de déviation provient du <em>gradient</em> du champ, pas seulement de son intensité : F<sub>z</sub> ≈ μ<sub>z</sub>·∂B<sub>z</sub>/∂z, où μ<sub>z</sub> est le moment magnétique de l\'atome selon l\'axe du champ. Un champ uniforme (∂B<sub>z</sub>/∂z = 0) n\'exercerait aucune force nette, quelle que soit la direction du moment — c\'est exactement pourquoi les deux pôles ci-dessus sont façonnés différemment plutôt que d\'être simplement de puissants aimants : seul un champ véritablement inhomogène produit une déviation.',
    whyTwoSpotsFormula: 'F<sub>z</sub> ≈ μ<sub>z</sub> (∂B<sub>z</sub> / ∂z) &nbsp;&nbsp;&nbsp; si B est uniforme ⇒ F = 0',
    whyTwoSpotsBody2: 'Classiquement, μ<sub>z</sub> pourrait pointer dans n\'importe quelle direction, donc un faisceau d\'atomes orientés aléatoirement devrait s\'étaler continûment sur l\'écran, d\'une déviation totale vers le haut à une déviation totale vers le bas. Lorsque Stern et Gerlach ont réellement mené cette expérience en 1922, les atomes d\'argent ont atterri en exactement deux points discrets — rien entre les deux, quelle que soit l\'inclinaison de l\'aimant. C\'est la même quantification déjà intégrée à chaque qubit de cette application : une mesure renvoie l\'un de exactement deux résultats, jamais un résultat partiel.',
    sequentialTitle: 'Mesurer deux fois : pourquoi l\'ordre compte',
    sequentialIntro: 'L\'atome ci-dessus a déjà un spin défini — c\'est la sortie « haut » d\'un premier aimant (non représenté), la moitié « bas » étant physiquement bloquée. Choisissez l\'axe de cet aimant pour voir si le mesurer à nouveau le perturbe.',
    sameAxis: 'Même axe (Z)',
    differentAxis: 'Axe différent (X)',
    preparedLabel: 'préparé : spin ↑ (Z)',
    blockedLabel: '(moitié « bas » bloquée)',
    magnet2AxisZ: 'Aimant 2 — axe Z',
    magnet2AxisX: 'Aimant 2 — axe X',
    resultTravelling: 'en vol…',
    resultUp: 'Le détecteur Haut a cliqué',
    resultDown: 'Le détecteur Bas a cliqué',
    explainerUp: 'Le détecteur Haut a cliqué — l\'un des exactement deux résultats possibles, jamais une déviation partielle. Tirez à nouveau et le même état d\'atome peut encore atterrir en bas ; seules les probabilités sont fixes, pas un résultat particulier.',
    explainerDown: 'Le détecteur Bas a cliqué — l\'un des exactement deux résultats possibles, jamais une déviation partielle. Tirez à nouveau et le même état d\'atome peut encore atterrir en haut ; seules les probabilités sont fixes, pas un résultat particulier.',
    explainerDefault: 'Un atome est sur le point d\'entrer dans l\'aimant. Tirez-le et observez quel détecteur clique.',
    trialCount: '· {count} atomes',
    sequentialExplainerZ: 'Même axe qu\'avant — tirez un atome pour confirmer qu\'il atterrit toujours de la même façon.',
    sequentialExplainerX: 'Un axe différent cette fois — tirez un atome pour voir ce qui arrive à un spin qui était déjà défini selon Z.',
    result2Plus: 'Le détecteur « + » a cliqué',
    result2Minus: 'Le détecteur « − » a cliqué',
    explainer2Z: 'Mesurer deux fois le même axe de suite ne fait que confirmer le résultat précédent — rien de surprenant ici. Tirez autant de fois que vous le souhaitez : le résultat sera toujours « + ».',
    explainer2X: 'Bien que cet atome ait eu un spin parfaitement défini selon Z, mesurer un axe différent et incompatible (X) a effacé cette information et produit un résultat nouveau, authentiquement aléatoire. C\'est le cœur de la découverte de Stern–Gerlach : mesurer une propriété peut perturber une autre propriété qui ne commute pas avec elle.'
  },
  teleport: {
    title: 'Téléportation Quantique',
    subtitle: 'Transférer l\'état exact d\'un qubit sur un second qubit, physiquement distinct — au moyen d\'une paire intriquée partagée et de deux bits classiques, sans jamais transporter le qubit lui-même',
    definitionTitle: 'Qu\'est-ce que la Téléportation Quantique ?',
    definitionBody1: 'La téléportation quantique est un protocole permettant de transférer l\'état exact d\'un qubit sur un second qubit, physiquement distinct, au moyen d\'une paire de qubits intriqués partagée au préalable et de deux bits de communication classique — sans que le qubit d\'origine soit jamais physiquement transporté ni mesuré directement. Elle déplace de l\'information quantique, pas de la matière ni de l\'énergie, et ne peut pas servir à envoyer un signal plus rapide que la lumière : récupérer l\'état transféré côté récepteur exige que ces deux bits classiques arrivent réellement, et ils ne voyagent pas plus vite qu\'un signal ordinaire.',
    definitionBody2: 'Elle ne crée pas non plus de copie. L\'état du qubit source est nécessairement détruit par la mesure qu\'exige le protocole, conformément au théorème de non-clonage, qui interdit à toute procédure de dupliquer un état quantique inconnu tout en laissant l\'original intact. Dans le déroulé ci-dessous, les deux parties qui échangent le qubit reçoivent les noms conventionnels utilisés dans toute la théorie de l\'information quantique — Alice pour l\'émettrice, Bob pour le récepteur.',
    circuitTitle: 'Le Protocole',
    svgAlt: 'Schéma de circuit : le qubit-message d\'Alice et les deux moitiés d\'une paire intriquée. Une porte Hadamard et une CNOT créent la paire intriquée entre le second qubit d\'Alice et le qubit de Bob. Une CNOT et une Hadamard placent le qubit-message d\'Alice et sa moitié de la paire dans la base de Bell. Les deux sont mesurés, et les deux résultats classiques voyagent par des doubles lignes vers des portes de correction Z et X appliquées conditionnellement sur le qubit de Bob.',
    finalLabel: 'Le qubit de Bob ≡ ψ',
    teleportBtn: 'Téléporter',
    aliceBadge: 'Message d\'Alice',
    aliceDesc: 'Fixez n\'importe quel état — c\'est lui qui sera téléporté',
    bobBadge: 'Qubit de Bob',
    bobDescWaiting: 'Pas encore intriqué — appuyez sur Téléporter',
    bobDescEntangled: 'Intriqué avec Alice — indéterminé à lui seul',
    bobDescWrong: 'Défini maintenant, mais pas encore ψ — en attente des bits d\'Alice',
    bobDescMatch: 'Correspond exactement au message d\'Alice',
    bobFormulaUndetermined: '|ψ⟩ = ?',
    classicalBitsTitle: 'Bits Classiques',
    classicalBitsBody: 'Alice doit physiquement envoyer ces deux bits à Bob — par téléphone, radio, courrier postal, n\'importe quel moyen classique. Sans eux, le qubit de Bob ne lui sert à rien, même s\'il l\'a déjà sous la main.',
    outcomeTally: 'Décompte des Résultats',
    resultRunning: 'en cours…',
    resultDone: 'Téléportation terminée',
    stepPair: 'Alice et Bob partagent une paire intriquée, préparée avant même l\'existence d\'un message.',
    stepBell: 'Alice intrique son qubit-message avec sa moitié de la paire — cela lit ψ au regard de l\'intrication, ça ne le copie pas.',
    stepMeasure: 'Alice mesure ses deux qubits, les faisant s\'effondrer en deux bits classiques authentiquement aléatoires — et effondrant le qubit de Bob en un état défini au même instant.',
    stepSend: 'Alice envoie ses deux bits classiques à Bob — un canal ordinaire, jamais plus rapide que la lumière. Il applique conditionnellement Z et/ou X pour corriger son qubit.',
    stepDone: 'Le qubit de Bob est maintenant exactement égal au message original d\'Alice — téléporté, pas copié : son propre qubit a été détruit par la mesure de l\'étape 2, donc le théorème de non-clonage reste intact. Alice n\'a jamais appris ψ non plus ; elle a juste transmis deux bits aléatoires, m₀={m0}, m₁={m1}, qui se sont avérés être exactement ce dont Bob avait besoin.',
    explainerDefault: 'Fixez ci-dessus l\'état du message d\'Alice, puis appuyez sur Téléporter. Observez la sphère de Bob : elle démarre indéterminée, saute vers un point défini mais incorrect à l\'instant où Alice mesure, puis se cale exactement sur celle d\'Alice dès que ses bits classiques arrivent et que Bob les corrige.',
    trialCount: '· {count} essais',
    whyNotFtlTitle: 'Pourquoi Ce N\'est Pas Plus Rapide Que la Lumière',
    whyNotFtlBody: 'À l\'instant où Alice mesure ses deux qubits, le qubit de Bob devient bien un état défini — mais lequel reste un mystère sans les deux bits classiques d\'Alice, qui ne peuvent voyager qu\'à la vitesse de la lumière ou moins vite, comme un appel téléphonique. Tant qu\'ils n\'arrivent pas, le qubit de Bob n\'est que du bruit pur : le mesurer trop tôt donnerait juste un résultat aléatoire à 50/50, quel qu\'ait été ψ. L\'intrication rend la téléportation possible ; elle ne la rend pas instantanée.',
    noCloningTitle: 'Pas une Copie — le Théorème de Non-Clonage',
    noCloningBody: 'Le qubit-message original d\'Alice ne survit pas à cela : sa mesure dans la base de Bell à l\'Étape 2 l\'effondre avec sa moitié de la paire, effaçant définitivement ce qu\'était ψ de son côté. Ce n\'est pas une limitation propre à ce protocole — le théorème de non-clonage démontre qu\'<em>aucune</em> procédure quantique ne peut jamais copier un état inconnu tout en laissant l\'original intact. La téléportation déplace un état ; elle n\'en duplique jamais un.'
  },
  superdense: {
    title: 'Codage Superdense',
    subtitle: 'Transmettre deux bits classiques d\'information en n\'envoyant physiquement qu\'un seul qubit, étant donné une paire intriquée partagée à l\'avance',
    definitionTitle: 'Qu\'est-ce que le Codage Superdense ?',
    definitionBody1: 'Le codage superdense est un protocole de communication quantique qui transmet deux bits classiques d\'information en n\'envoyant physiquement qu\'un seul qubit, à condition que l\'émetteur et le récepteur partagent déjà chacun une moitié d\'une paire intriquée préparée à l\'avance. C\'est le réciproque logique de la téléportation quantique : la téléportation dépense deux bits classiques et une paire intriquée partagée pour déplacer 1 qubit d\'information quantique, tandis que le codage superdense dépense 1 qubit et ce même type de paire partagée pour déplacer deux bits classiques.',
    definitionBody2: 'Ce n\'est pas une faille dans les limites de la communication classique — un qubit physique réel doit encore voyager de l\'émetteur au récepteur pour que le protocole fonctionne, donc la transmission reste limitée par la vitesse ordinaire du signal. Comme dans l\'onglet Téléportation, les deux parties ci-dessous reçoivent leurs noms conventionnels de la théorie de l\'information quantique : Alice pour l\'émettrice, Bob pour le récepteur.',
    circuitTitle: 'Le Protocole',
    svgAlt: 'Schéma de circuit : le qubit d\'Alice et le qubit de Bob. Une Hadamard et une CNOT créent une paire intriquée. Alice applique conditionnellement X et/ou Z à son propre qubit uniquement, codant deux bits classiques. Elle envoie ensuite physiquement ce qubit à Bob par un canal quantique. Bob, ayant désormais les deux qubits, applique une CNOT et une Hadamard pour décoder, puis mesure les deux pour récupérer les deux bits exacts d\'Alice.',
    channelLabel: 'canal quantique',
    finalLabelA: 'd₀',
    finalLabelB: 'd₁',
    sendBtn: 'Envoyer',
    messageTitle: 'Message à Envoyer',
    messageBody: 'Choisissez n\'importe quel message de 2 bits — c\'est ce qu\'Alice code sur son unique qubit avant de l\'envoyer à Bob.',
    sentLabel: 'Alice a envoyé',
    receivedLabel: 'Bob a décodé',
    resultRunning: 'en cours…',
    resultMatch: 'Décodé exactement',
    resultMismatch: 'Écart — vérifiez la console, ceci ne devrait jamais arriver',
    stepPair: 'Alice et Bob partagent une paire intriquée, préparée à l\'avance.',
    stepEncode: 'Alice code son message uniquement sur son propre qubit — la moitié de la paire de Bob n\'est jamais touchée.',
    stepSend: 'Alice envoie physiquement cet unique qubit à Bob par un vrai canal quantique — la seule étape sans substitut classique.',
    stepDecode: 'Bob, ayant désormais les deux qubits, exécute le même circuit de base de Bell que l\'Alice de Téléporter — une CNOT puis une Hadamard — pour distinguer les quatre messages possibles.',
    stepMeasure: 'Bob mesure les deux qubits et lit les deux bits exacts d\'Alice.',
    stepDone: 'Bob a décodé {received} — exactement ce qu\'Alice a envoyé, {sent}. Rien n\'était aléatoire ici : les quatre messages possibles tombent sur quatre états mutuellement orthogonaux, si bien que la mesure de Bob n\'a plus aucune incertitude une fois le qubit arrivé.',
    explainerDefault: 'Choisissez un message de 2 bits ci-dessus, puis appuyez sur Envoyer. Observez Alice le coder uniquement sur son propre qubit, remettre physiquement ce qubit à Bob, et Bob décoder les deux bits exactement — rien ici n\'est aléatoire.',
    tally: '{sent} envoyés · {match}/{sent} décodés correctement',
    whyChannelTitle: 'Pourquoi Cela Nécessite Toujours un Canal Quantique',
    whyChannelBody: 'La téléportation a déplacé l\'équivalent d\'un qubit d\'information en utilisant seulement des bits classiques, c\'est pourquoi elle ne peut pas dépasser la vitesse de la lumière. Le codage superdense va dans le sens inverse — il déplace 2 bits classiques en utilisant seulement 1 qubit de communication, ce qui semble dépasser la limite classique, mais ce n\'est pas une faille : un qubit physique réel doit encore voyager d\'Alice à Bob pour que cela fonctionne. L\'« économie » est réelle (1 qubit au lieu de 2 bits classiques de signal séparé), mais elle reste limitée par la vitesse à laquelle ce qubit peut lui-même voyager.',
    compareTitle: 'Téléportation contre Codage Superdense',
    compareBody: 'La même ressource — une paire intriquée partagée à l\'avance — dépensée dans des directions opposées. La téléportation envoie 1 qubit d\'information quantique en utilisant 2 bits classiques ; le codage superdense envoie 2 bits classiques d\'information en utilisant 1 qubit. Les deux nécessitent cette paire intriquée préparée à l\'avance, et les deux finissent par exécuter essentiellement le même circuit de base de Bell (une CNOT puis une Hadamard) — la téléportation l\'exécute côté émetteur pour lire un état, le codage superdense l\'exécute côté récepteur pour lire un message.'
  },
  noise: {
    title: 'Bruit et Décohérence',
    subtitle: 'La perte de cohérence quantique par interaction non désirée avec l\'environnement — l\'obstacle pratique dominant à la construction d\'ordinateurs quantiques fiables et à grande échelle',
    definitionTitle: 'Qu\'est-ce que la Décohérence Quantique ?',
    definitionBody1: 'La décohérence quantique est la perte de cohérence quantique : le processus par lequel l\'information de phase d\'un système fuit vers son environnement par une interaction non désirée, si bien qu\'un état authentiquement en superposition en vient à se comporter, à toutes fins pratiques, comme un mélange classique bien défini. Un système parfaitement isolé reste dans un état pur — décrit exactement par un unique vecteur d\'état |ψ⟩ — indéfiniment. Dès qu\'il interagit avec un environnement incontrôlé, cette garantie disparaît : le système s\'intrique avec les nombreux degrés de liberté propres à l\'environnement, et tracer tout sauf le système lui-même laisse un état mixte, décrit par une matrice de densité ρ plutôt que par un unique vecteur. Tous les autres onglets de cette application traitent les portes et les qubits comme parfaitement isolés exactement en ce premier sens ; celui-ci modélise ce qui se passe quand ils cessent de l\'être.',
    definitionBody2: 'Sur la sphère de Bloch déjà utilisée dans toute cette application, cette perte de pureté se traduit par un vecteur qui rétrécit — la même signature déjà observée pour un qubit intriqué avec un autre (voir les sphères de Bloch réduites des onglets Intriquer et Circuits), causée ici par un environnement incontrôlé plutôt que par un second qubit délibéré. La décohérence est l\'obstacle pratique dominant à la construction d\'ordinateurs quantiques fiables et à grande échelle : chaque porte d\'un circuit réel doit se terminer avant que la cohérence dont elle dépend n\'ait fui. La simulation ci-dessous modélise deux de ses canaux phénoménologiques standards, T₁ (relaxation) et T₂ (déphasage), faisant évoluer en temps réel le vecteur de Bloch d\'un unique qubit.',
    qubitBadge: 'Qubit en décohérence',
    statsTitle: 'Lecture en Direct',
    elapsed: 'Temps écoulé',
    vectorLength: 'Longueur du vecteur de Bloch',
    purity: 'Pureté Tr(ρ²)',
    densityMatrix: 'Matrice de Densité ρ',
    initialStateTitle: 'État Initial',
    decayTimesTitle: 'Temps de Décroissance',
    t2CapNote: 'T₂ plafonné à {eff} μs (2×T₁) — le déphasage ne peut pas être plus lent que la relaxation.',
    pauseBtn: '⏸ Pause',
    playBtn: '▶ Lecture',
    restartBtn: '↻ Redémarrer',
    explainerDefault: 'Observez le vecteur de Bloch rétrécir et dériver vers le pôle nord — ce rétrécissement est une véritable perte d\'information, pas seulement un effet visuel. Un vecteur plus court signifie que l\'état du qubit est authentiquement plus incertain, exactement la même idée d\'« état mixte » déjà utilisée pour les qubits intriqués ailleurs dans cette application.',
    explainerSettled: 'Stabilisé à |0⟩ — et la pureté est en fait remontée près de 100 %, elle n\'a pas touché son minimum. Ce n\'est pas un sauvetage : la relaxation T₁ attire le qubit vers son état fondamental, donc avec assez de temps il finit toujours par redevenir pur, mais pur et inutile. Un qubit posé sur |0⟩ a l\'air identique qu\'il ait commencé en |+⟩, |−⟩ ou autre chose — l\'information de phase que T₂ a effacée en chemin ne revient jamais, pureté ou pas.',
    t1t2Title: 'T₁ vs. T₂ — Deux Façons Différentes d\'Oublier',
    t1t2Body: 'T₁ (relaxation) est le temps que met le qubit à laisser fuir de l\'énergie vers son environnement et à se stabiliser vers |0⟩ — c\'est pourquoi la composante z du vecteur de Bloch dérive vers le pôle nord. T₂ (déphasage) est le temps pendant lequel le qubit conserve la phase relative entre |0⟩ et |1⟩ — c\'est pourquoi les composantes x/y, celles qui portent réellement l\'information de superposition, s\'estompent. Perdre T₂ est souvent le problème pratique le plus important : un qubit peut rester « majoritairement » |0⟩ ou |1⟩ longtemps après avoir perdu toute trace d\'une superposition authentique.',
    t1t2Formula: 'T₂ ≤ 2×T₁ &nbsp;&nbsp;&nbsp; (le déphasage ne peut jamais être plus lent que ce que permet la relaxation)',
    whyMattersTitle: 'Pourquoi Ce Combat Ne S\'arrête Jamais sur le Matériel Réel',
    whyMattersBody: 'Toutes les autres simulations de cette application exécutent portes et mesures comme des opérations mathématiquement parfaites, car c\'est la bonne façon d\'apprendre les idées d\'abord. Les processeurs quantiques réels — y compris les dispositifs supraconducteurs et à ions piégés avec lesquels l\'Initiative Technologie Quantique du CERN expérimente pour la simulation de physique des particules — ne restent cohérents que pendant une fenêtre limitée, mesurée exactement par ces nombres T₁/T₂, typiquement de quelques dizaines à quelques centaines de microsecondes. Chaque porte d\'un circuit réel doit se terminer bien à l\'intérieur de cette fenêtre, ce qui est la raison même pour laquelle la correction d\'erreurs quantiques et la conception de circuits adaptée au matériel sont des problèmes d\'ingénierie actifs, non résolus.'
  },
  grover: {
    title: 'Recherche de Grover',
    subtitle: 'Trouver un élément marqué parmi quatre en une seule requête, en amplifiant son amplitude plutôt qu\'en les vérifiant un par un',
    definitionTitle: 'Qu\'est-ce que la Recherche de Grover ?',
    definitionBody1: 'L\'algorithme de Grover recherche dans une liste non triée de N éléments celui qui est marqué, en utilisant environ √N requêtes à l\'oracle, au lieu de jusqu\'à N pour une recherche classique dans le pire des cas. Il fonctionne par amplification d\'amplitude : tous les éléments commencent en superposition égale, un oracle inverse le signe de l\'amplitude de l\'élément marqué, puis une étape fixe de « diffusion » transforme ce changement de signe invisible en une hausse visible de la probabilité de mesure.',
    definitionBody2: 'Basculez ci-dessous entre deux cas concrets. N = 4 (2 qubits) est le plus petit cas où le résultat est exact : une seule requête porte la probabilité de l\'élément marqué exactement à 1. N = 8 (3 qubits) est le plus petit cas où ce n\'est visiblement pas le cas : il faut deux requêtes pour atteindre un maximum d\'environ 94,5 % seulement, et — preuve que ce n\'est pas simplement « pas assez de requêtes » — une troisième requête dépasserait ce maximum au lieu de l\'améliorer.',
    targetTitle: 'Élément à Trouver',
    targetBody: 'Choisissez quel élément est « marqué » — c\'est ce que l\'oracle reconnaît, et ce que la recherche ci-dessous devrait trouver.',
    targetLabel: 'Élément marqué',
    foundLabel: 'Trouvé',
    circuitTitle: 'Le Circuit',
    oracleGateLabel: 'Oracle',
    diffuserGateLabel: 'Diffuseur',
    oracleMarks: 'marque {t}',
    repeatBracketLabel: 'répéter ×2',
    iterationBadge: 'Itération {iter} sur {total}',
    modeN4Btn: 'N = 4 (exact)',
    modeN8Btn: 'N = 8 (2 itérations)',
    modeN4Desc: '2 qubits, 1 élément marqué — une seule requête est exacte.',
    modeN8Desc: '3 qubits, 1 élément marqué — nécessite 2 requêtes, et même ainsi plafonne sous les 100 %.',
    chartTitle: 'Amplitudes Tout au Long de la Recherche',
    searchBtn: 'Rechercher',
    resultRunning: 'en cours…',
    resultMatch: 'Trouvé dès la première requête',
    resultMismatch: 'Échec — vérifiez la console, cela ne devrait jamais arriver pour N=4',
    resultMatchN8: 'Trouvé après 2 requêtes',
    resultMismatchN8: 'Échec cette fois — véritablement possible environ 1 fois sur 20 pour N=8, ce n\'est pas un bug',
    stepStart: 'Toute recherche commence dans un état défini et sans intérêt — que des zéros, exactement comme un registre classique avant d\'avoir rien regardé.',
    stepSuperpose: 'Une porte Hadamard sur chaque qubit répartit l\'amplitude également entre les {n} éléments à la fois — chaque candidat est « actif » simultanément, et non vérifié un par un.',
    stepOracle: 'L\'oracle reconnaît l\'élément marqué et inverse le signe de son amplitude seule. Regardez bien : aucune barre n\'a bougé — une probabilité est le carré de la taille d\'une amplitude, et une amplitude négative donne exactement la même probabilité au carré qu\'une amplitude positive de même taille. Cette étape est totalement invisible pour toute mesure effectuée maintenant.',
    stepDiffuse: 'La diffusion reflète chaque amplitude autour de leur moyenne commune. Les autres amplitudes, déjà proches de cette moyenne, s\'effondrent vers zéro ; celle marquée, à l\'opposé après son changement de signe, est projetée au-delà de la moyenne du double de l\'écart — transformant ce basculement de phase invisible en une réponse visible.',
    stepDiffuseIteration: 'La diffusion reflète chaque amplitude autour de leur moyenne commune, toujours la même règle. Itération {iter} sur {total} terminée : la probabilité de l\'élément marqué est maintenant de {pct} %.',
    overshootNote: 'C\'est le maximum pour N=8 — une troisième itération dépasserait ce maximum, faisant retomber la probabilité à environ 33 %, pas en l\'augmentant.',
    stepMeasure: 'Une requête, une mesure, terminé : {found} — pour {n} éléments avec 1 marqué, une seule itération de Grover porte la probabilité de l\'élément marqué à 1, une mesure réelle sur une distribution sans aucune incertitude réelle restante.',
    stepMeasureApprox: '2 requêtes, une mesure, terminé : {found} — pour 8 éléments avec 1 marqué, 2 itérations de Grover portent la probabilité de l\'élément marqué à environ 94,5 %, pas exactement 1 cette fois ; mesurée ainsi, c\'est quand même un tirage réel selon la règle de Born, avec simplement une chance réelle de manquer.',
    explainerDefault: 'Choisissez un élément à gauche, puis appuyez sur Rechercher. Observez les barres d\'amplitude à chaque étape — l\'oracle change un signe que rien ici ne peut voir, et la diffusion est ce qui transforme ce changement invisible en une réponse visible.',
    tally: '{n} recherches · {found}/{n} trouvés dès la première requête',
    tallyN8: '{n} recherches · {found}/{n} trouvés après 2 requêtes',
    whyFasterTitle: 'Pourquoi Une Seule Requête Est Réellement Plus Rapide',
    whyFasterBody: 'Classiquement, trouver un élément marqué parmi 4 en les vérifiant un par un prend jusqu\'à 3 requêtes réelles dans le pire des cas — si les 3 premiers éléments vérifiés ne sont pas le bon, vous ne savez que le 4e est la réponse que par élimination, mais il vous a quand même fallu ces 3 requêtes réelles pour y arriver. L\'algorithme de Grover n\'a besoin que d\'exactement 1 appel à l\'oracle pour ce même cas N = 4. L\'écart se creuse, et ne se réduit pas, à mesure que la liste s\'agrandit : pour N éléments, la recherche classique nécessite de l\'ordre de N requêtes dans le pire des cas, alors que l\'algorithme de Grover n\'en nécessite que de l\'ordre de √N — la même accélération quadratique déjà décrite dans la propre section Algorithmes de cette application.',
    whyFasterBodyN8: 'Le mode N = 8 ci-dessus montre à quoi ressemble réellement ce schéma général : 2 requêtes au lieu de jusqu\'à 7, une véritable avance quadratique — mais l\'algorithme de Grover ne promet pas la certitude en général, seulement cette avance. Sa propre probabilité plafonne à environ 94,5 % et redescendrait si on continuait ; N = 4 est le cas particulier, plus petit, où 1 requête tombe exactement sur ce maximum plutôt que simplement près de lui.'
  },
  // Reflète exactement ROADMAP_LESSONS dans js/roadmap.js (mêmes ids, même
  // contenu titre/corps) — ce fichier conserve ses propres copies anglaises
  // comme repli pour t() (voir buildLessonInfoHTML()), donc les deux n'ont
  // besoin de correspondre qu'au moment de cette extraction initiale, sans
  // synchronisation manuelle continue.
  lessons: {
    qubit: {
      title: 'Bits',
      body: 'Un bit classique vaut toujours de manière définitive 0 ou 1. Un qubit peut être en superposition des deux à la fois, décrit par deux amplitudes plutôt qu\'une seule valeur. La sphère de Bloch attribue à chaque état de qubit possible un point sur sa surface.'
    },
    'maths-complex': {
      title: 'Nombres complexes',
      body: 'Les amplitudes d\'un qubit sont des nombres complexes, pas seulement réels — chacun a une partie réelle et une partie imaginaire, z = a + bi. Seul le module au carré |z|² est directement observable en tant que probabilité ; la phase est invisible à une seule mesure, mais c\'est exactement elle qui entraîne l\'interférence.'
    },
    'maths-vectors': {
      title: 'Vecteurs',
      body: 'L\'état d\'un qubit est un vecteur colonne [α, β] dans un espace vectoriel complexe à 2 dimensions, avec |0⟩ et |1⟩ comme base. La normalisation |α|² + |β|² = 1 maintient la probabilité totale à 100 %, et le produit scalaire mesure à quel point deux états se recouvrent.'
    },
    'maths-matrices': {
      title: 'Matrices',
      body: 'Chaque porte quantique est une matrice unitaire (U†U = I) agissant sur le vecteur d\'état par multiplication matricielle. L\'unitarité garantit qu\'une porte ne détruit ni ne crée de probabilité — c\'est exactement pourquoi chaque porte quantique est réversible.'
    },
    'maths-statevector': {
      title: 'Vecteur d\'état',
      body: 'Le vecteur d\'état |ψ⟩ = α|0⟩ + β|1⟩ est la description complète d\'un qubit. Sous forme de sphère de Bloch, |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩ — θ et φ sont exactement les deux curseurs de la sphère de Bloch dans l\'onglet Bits & Qubits.'
    },
    'maths-dirac': {
      title: 'Notation de Dirac',
      body: 'La notation bra-ket de Dirac est un raccourci pour les vecteurs et leurs produits scalaires : |ψ⟩ est un ket, ⟨ψ| son bra, et ⟨φ|ψ⟩ leur produit scalaire. |0⟩ et |1⟩ sont orthonormés — ⟨0|1⟩ = 0, ⟨0|0⟩ = ⟨1|1⟩ = 1.'
    },
    'maths-tensor': {
      title: 'Produits tensoriels',
      body: 'Deux vecteurs indépendants se combinent via le produit tensoriel (⊗) en un seul vecteur conjoint plus grand — on empile chaque entrée du premier contre chaque entrée du second, en multipliant chaque paire. Deux qubits se combinent ainsi en un état conjoint à 4 entrées ; tous les états conjoints ne peuvent pas être décomposés à nouveau, et ceux qui ne le peuvent pas sont précisément ceux qui sont intriqués.'
    },
    gates: {
      title: 'Portes quantiques',
      body: 'Les portes sont les opérations qui déplacent un qubit sur la sphère de Bloch — des rotations réversibles plutôt que la logique destructive des portes classiques. Chacune (H, X, Y, Z, S, T) a un effet géométrique précis que vous pouvez observer en action.'
    },
    circuit: {
      title: 'Circuits',
      body: 'Un circuit est une séquence de portes appliquées de gauche à droite. Dans un circuit classique, les portes logiques comme ET/OU/OU exclusif combinent des bits selon des règles strictes — la même entrée donne toujours la même sortie. Dans un circuit quantique, l\'ordre compte d\'une manière plus profonde : exécuter les mêmes portes dans un ordre différent peut placer le qubit dans un état complètement différent, tout comme des virages sur un trajet. Passez à 2 ou 3 qubits et ajoutez une porte CNOT pour construire des états intriqués — paires de Bell et états GHZ — porte par porte, les mêmes recettes qui se cachent derrière l\'onglet Intrication.'
    },
    measure: {
      title: 'Mesure',
      body: 'Mesurer un qubit le force à se fixer sur un résultat défini, 0 ou 1, avec des probabilités déterminées par ses amplitudes juste avant la mesure. C\'est l\'effondrement de la superposition — irréversible et probabiliste, et non une valeur préexistante cachée.'
    },
    entangle: {
      title: 'Intrication',
      body: 'Deux qubits peuvent être liés de telle sorte que mesurer l\'un détermine instantanément le résultat de l\'autre, quelle que soit la distance qui les sépare. Cette corrélation est plus forte que tout ce qui est possible entre des bits classiques.'
    },
    bellstates: {
      title: 'États de Bell',
      body: 'Les quatre états de Bell — Φ⁺, Φ⁻, Ψ⁺ et Ψ⁻ — sont les états à deux qubits maximalement intriqués, tous construits à partir de la même recette Hadamard-puis-CNOT en partant d\'un état de base différent parmi les quatre. Φ⁺/Φ⁻ donnent toujours des résultats identiques à la mesure, Ψ⁺/Ψ⁻ toujours des résultats opposés — la phase relative derrière chaque signe ± est invisible à une mesure directe, et n\'apparaît qu\'une fois les qubits mis en interférence l\'un avec l\'autre.'
    },
    tunnel: {
      title: 'Effet tunnel quantique',
      body: 'Un paquet d\'ondes quantique a une probabilité non nulle d\'apparaître de l\'autre côté d\'une barrière qu\'il ne devrait classiquement pas pouvoir franchir, car son nuage de probabilité s\'étend à travers la barrière au lieu de s\'arrêter net.'
    },
    interference: {
      title: 'Interférence',
      body: 'Lorsque deux chemins menant au même résultat sont indiscernables, leurs amplitudes de probabilité se combinent et peuvent se renforcer ou s\'annuler — produisant des bandes sur un écran au lieu de deux simples tas. Marquer le chemin emprunté détruit le motif.'
    },
    beamsplitter: {
      title: 'Séparateur de faisceau',
      body: 'Un séparateur de faisceau 50/50 envoie un photon unique sur l\'un de deux chemins avec une probabilité égale — réfléchi vers un détecteur ou transmis vers l\'autre. Le photon n\'est pas secrètement divisé entre les deux chemins ; un seul détecteur clique jamais par photon, et lequel est authentiquement aléatoire à chaque fois.'
    },
    sterngerlach: {
      title: 'Expérience de Stern–Gerlach',
      body: 'Un faisceau d\'atomes d\'argent traversant un champ magnétique inhomogène se sépare en exactement deux points discrets, jamais une traînée continue — une preuve directe que le spin est quantifié, avec seulement deux résultats possibles selon n\'importe quel axe de mesure, exactement comme les résultats de mesure |0⟩/|1⟩ d\'un qubit.'
    },
    teleport: {
      title: 'Téléportation Quantique',
      body: 'Alice peut envoyer à Bob l\'état exact d\'un qubit sans jamais envoyer le qubit lui-même — grâce à une paire intriquée partagée à l\'avance et deux bits classiques. Son propre qubit est détruit par la mesure que cela exige, si bien qu\'aucune copie n\'existe jamais aux deux extrémités à la fois, exactement comme l\'exige le théorème de non-clonage.'
    },
    superdense: {
      title: 'Codage Superdense',
      body: 'L\'image miroir de la téléportation : Alice envoie à Bob deux bits classiques en utilisant seulement un qubit, en codant son message sur sa moitié d\'une paire intriquée partagée à l\'avance et en envoyant physiquement à Bob cet unique qubit. Bob décode les deux bits exactement, à chaque fois — rien dans ce protocole n\'est probabiliste.'
    },
    noise: {
      title: 'Bruit et Décohérence',
      body: 'Les qubits réels ne sont pas parfaitement isolés : la relaxation T₁ leur permet de laisser fuir de l\'énergie vers |0⟩, et le déphasage T₂ efface la phase relative qui donne son sens à une superposition. Les deux rétrécissent le vecteur de Bloch vers le centre — la même signature d\'« état mixte » déjà vue en traçant un qubit intriqué, mais causée ici par un environnement incontrôlé plutôt que par une mesure délibérée.'
    },
    grover: {
      title: 'Recherche de Grover',
      body: 'L\'algorithme de Grover trouve un élément marqué parmi N par amplification d\'amplitude plutôt qu\'en les vérifiant un par un : un oracle inverse le signe de l\'amplitude de l\'élément marqué (invisible pour toute mesure, puisque la probabilité ne dépend que de la taille de l\'amplitude), puis une étape fixe de « diffusion » transforme ce changement invisible en une hausse visible. Pour N=4 avec un élément marqué, une seule requête porte sa probabilité de mesure exactement à 1 — une véritable accélération quadratique par rapport au meilleur qu\'une recherche classique puisse faire.'
    }
  },
  // Reflète exactement ROADMAP_QUIZ dans js/roadmap.js — mêmes lessonIds
  // que les clés de `lessons` ci-dessus, même contenu q/options/explanation.
  quiz: {
    qubit: {
      q: 'Un bit classique et un qubit commencent tous deux dans un état défini. Quelle est la principale différence entre eux ?',
      options: ['Les qubits peuvent contenir une superposition de 0 et de 1 à la fois', 'Les qubits ne sont que des bits plus rapides', 'Les qubits ne peuvent être mesurés qu\'une seule fois, jamais plus', 'Il n\'y a aucune vraie différence'],
      explanation: 'Les amplitudes d\'un qubit lui permettent d\'être véritablement un mélange des deux états de base jusqu\'à la mesure — un bit classique n\'a jamais cette possibilité.'
    },
    'maths-complex': {
      q: 'Pourquoi les amplitudes d\'un qubit doivent-elles être des nombres complexes plutôt que de simples nombres réels ?',
      options: ['Les nombres complexes sont plus précis que les nombres réels', 'La phase supplémentaire d\'un nombre complexe est ce qui rend possible l\'interférence entre les chemins', 'Les nombres réels ne peuvent pas être négatifs', 'C\'est simplement une convention mathématique sans signification physique'],
      explanation: 'Deux amplitudes réelles pourraient encore s\'annuler par leur signe, mais seule une phase complexe permet aux amplitudes de se renforcer ou de s\'annuler selon n\'importe quel angle relatif — cette liberté plus riche est exactement ce qu\'exploite l\'interférence.'
    },
    'maths-vectors': {
      q: 'Que garantit la condition de normalisation |α|² + |β|² = 1 pour un état de qubit ?',
      options: ['Que le qubit est intriqué', 'Que la probabilité totale de mesure sur |0⟩ et |1⟩ s\'élève exactement à 100 %', 'Que le qubit a été mesuré', 'Que α et β sont tous deux des nombres réels'],
      explanation: 'P(0) + P(1) = |α|² + |β|² doit être égal à 1 pour que la règle de Born ait un sens en tant que distribution de probabilité — chaque point valide de la sphère de Bloch satisfait déjà automatiquement cette condition.'
    },
    'maths-matrices': {
      q: 'Quelle propriété toute matrice de porte quantique valide U doit-elle satisfaire ?',
      options: ['det(U) = 0', 'U†U = I (U est unitaire)', 'U doit être une matrice à valeurs réelles', 'U doit avoir exactement deux lignes'],
      explanation: 'L\'unitarité est ce qui maintient le vecteur d\'état normalisé après l\'application de la porte — c\'est aussi exactement la condition qui rend chaque porte quantique réversible, contrairement à une porte ET classique.'
    },
    'maths-statevector': {
      q: 'Dans la forme de sphère de Bloch |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩, à quoi correspondent θ et φ ?',
      options: ['À deux qubits indépendants', 'Exactement aux mêmes curseurs θ/φ utilisés pour fixer un état sur la sphère de Bloch', 'Au nombre de portes appliquées jusqu\'à présent', 'Au résultat de la mesure'],
      explanation: 'Chaque point de la sphère de Bloch n\'est rien d\'autre que cette équation avec une paire (θ,φ) donnée — la sphère est une représentation visuelle de la formule, pas une chose distincte.'
    },
    'maths-dirac': {
      q: 'Que signifie ⟨0|1⟩ = 0 ?',
      options: ['|0⟩ et |1⟩ sont le même état', '|0⟩ et |1⟩ sont orthogonaux — des résultats complètement distincts', 'Le qubit est en superposition', 'Une erreur de mesure s\'est produite'],
      explanation: 'L\'orthogonalité explique exactement pourquoi une mesure renvoie toujours un 0 ou un 1 net, jamais quelque chose « entre les deux » — |0⟩ et |1⟩ n\'ont aucun recouvrement.'
    },
    'maths-tensor': {
      q: 'Deux qubits indépendants, chacun un vecteur à 2 entrées, se combinent via le produit tensoriel en un état conjoint. Combien d\'entrées cet état conjoint a-t-il ?',
      options: ['2', '4', '8', 'Cela dépend des amplitudes des qubits'],
      explanation: 'Le produit tensoriel d\'un vecteur à 2 entrées avec un autre vecteur à 2 entrées a toujours 2×2 = 4 entrées — une pour chaque combinaison de résultats de base, |00⟩, |01⟩, |10⟩, |11⟩ — quelles que soient les amplitudes réelles.'
    },
    gates: {
      q: 'Que fait la porte de Hadamard (H) à un qubit qui commence à |0⟩ ?',
      options: ['Elle le fait basculer directement vers |1⟩', 'Elle le place dans une superposition égale de |0⟩ et de |1⟩', 'Elle le mesure immédiatement', 'Elle l\'intrique avec un autre qubit'],
      explanation: 'H fait tourner |0⟩ jusqu\'à l\'équateur de la sphère de Bloch — des probabilités de 50/50, avec une relation de phase fixe entre les deux amplitudes.'
    },
    circuit: {
      q: 'Dans un circuit quantique, pourquoi l\'ordre des portes est-il important ?',
      options: ['Ce n\'est pas le cas — les portes commutent toujours', 'Chaque porte fait tourner l\'état, et les rotations ne commutent généralement pas', 'Seule la dernière porte a un quelconque effet', 'L\'ordre n\'a d\'importance que pour la mesure'],
      explanation: 'Chaque porte est une rotation de la sphère de Bloch, et les rotations en 3D ne commutent généralement pas — X puis Z n\'aboutit pas au même endroit que Z puis X.'
    },
    measure: {
      q: 'Que se passe-t-il pour la superposition d\'un qubit lorsque vous le mesurez ?',
      options: ['Rien ne change', 'Elle s\'effondre sur un seul résultat défini', 'Elle se divise en deux qubits', 'Elle devient automatiquement intriquée'],
      explanation: 'Il n\'existe aucun fait caché sur ce que le résultat était « réellement » auparavant — mesurer est ce qui produit une réponse définie, pondérée par les amplitudes.'
    },
    entangle: {
      q: 'Deux qubits sont intriqués. Vous mesurez le premier et obtenez |1⟩. Que se passe-t-il pour le second ?',
      options: ['Rien — ils sont indépendants', 'Son résultat est désormais instantanément corrélé au premier, selon leur état intriqué', 'Il est détruit', 'Il devient un bit classique'],
      explanation: 'Leurs amplitudes étaient liées dès l\'instant où ils sont devenus intriqués — mesurer l\'un n\'envoie aucun signal, cela révèle simplement une corrélation présente depuis le début.'
    },
    bellstates: {
      q: 'Φ⁺ = (|00⟩ + |11⟩)/√2 et Φ⁻ = (|00⟩ − |11⟩)/√2 sont des états différents, pourtant mesurer l\'un ou l\'autre dans cette démonstration donne des statistiques identiques. Pourquoi ?',
      options: ['Ce sont en réalité le même état écrit de deux façons', 'Une phase relative (le signe −) ne change aucune probabilité dans la base de calcul ; seul |amplitude|² compte', 'La démonstration a un bug et ne peut pas les distinguer', 'Seul Φ⁺ est un véritable état de Bell'],
      explanation: 'Les probabilités proviennent de |amplitude|², qui est identique pour +1/√2 et −1/√2. Les deux états restent physiquement distincts — la phase devient visible dès que l\'on fait interférer les qubits entre eux, par exemple en appliquant une porte Hadamard à chacun avant de mesurer.'
    },
    tunnel: {
      q: 'Qu\'est-ce que l\'effet tunnel quantique ?',
      options: ['Un qubit qui se téléporte instantanément à travers l\'espace', 'Un paquet d\'ondes ayant une probabilité non nulle d\'apparaître au-delà d\'une barrière classiquement infranchissable', 'Une porte qui supprime un qubit', 'Une erreur de mesure'],
      explanation: 'La fonction d\'onde ne s\'arrête pas net contre une barrière — elle décroît de façon exponentielle à l\'intérieur, si bien qu\'une barrière suffisamment fine laisse encore une amplitude non nulle de l\'autre côté.'
    },
    interference: {
      q: 'Dans l\'expérience de la double fente, qu\'est-ce qui provoque les franges d\'interférence sur l\'écran ?',
      options: ['Deux particules distinctes qui entrent en collision', 'Les amplitudes de probabilité de chemins indiscernables qui s\'additionnent ou s\'annulent', 'Le matériau de l\'écran', 'Un effondrement de mesure survenant trop tôt'],
      explanation: 'Chaque point de l\'écran correspond à deux chemins possibles ; lorsqu\'ils sont indiscernables, leurs amplitudes s\'additionnent et peuvent se renforcer ou s\'annuler, produisant les franges.'
    },
    beamsplitter: {
      q: 'Un photon unique frappe un séparateur de faisceau 50/50. Que se passe-t-il réellement ?',
      options: ['Le photon se divise en deux, la moitié allant vers chaque détecteur', 'Le photon va vers exactement un détecteur, choisi au hasard avec des probabilités de 50/50', 'Les deux détecteurs cliquent toujours ensemble', 'Aucun détecteur ne clique à moins de mesurer deux fois'],
      explanation: 'Un photon n\'est jamais divisé entre les chemins — le séparateur de faisceau le place dans une superposition de « réfléchi » et « transmis », et la mesure (le clic du détecteur) force un résultat défini, tout comme la mesure d\'un qubit.'
    },
    sterngerlach: {
      q: 'Un faisceau d\'atomes d\'argent traverse un aimant de Stern–Gerlach. Que montre réellement l\'expérience sur l\'écran du détecteur ?',
      options: ['Une traînée continue d\'un extrême à l\'autre', 'Exactement deux points discrets, jamais rien entre les deux', 'Un seul point au centre exact', 'Aucun motif du tout — les atomes sont absorbés'],
      explanation: 'Classiquement, un dipôle magnétique orienté aléatoirement devrait dévier d\'une quantité quelconque, produisant une traînée continue. Stern et Gerlach n\'ont trouvé que deux points discrets — une preuve directe que le spin, comme les résultats de mesure d\'un qubit lui-même, est quantifié en seulement deux possibilités selon n\'importe quel axe.'
    },
    teleport: {
      q: 'Après que Bob applique ses portes de correction, comment son qubit se compare-t-il au message original d\'Alice ?',
      options: ['C\'est une bonne approximation, proche mais pas exacte', 'Il correspond exactement — mêmes amplitudes, même état', 'C\'est une copie classique, pas un véritable état quantique', 'Il ne correspond que la moitié du temps'],
      explanation: 'Une fois la bonne correction Z/X appliquée, le qubit de Bob est exactement égal à l\'original d\'Alice, pas une approximation — c\'est précisément le but de l\'étape de correction contrôlée classiquement.'
    },
    superdense: {
      q: 'Dans le codage superdense, qu\'est-ce qui doit réellement voyager physiquement d\'Alice à Bob ?',
      options: ['Deux bits classiques, envoyés par radio ou téléphone', 'Un unique qubit', 'Rien — la paire intriquée seule suffit', 'Quatre qubits, un par message possible'],
      explanation: 'Seul l\'unique qubit d\'Alice voyage. La paire intriquée a été partagée à l\'avance, et son message est codé sur cet unique qubit avant qu\'elle ne l\'envoie — c\'est ce qui rend ce protocole « superdense » : 2 bits d\'information à partir d\'un seul qubit de communication.'
    },
    noise: {
      q: 'Un qubit démarre dans une superposition authentique. Une fois complètement décohéré (T₂ écoulé plusieurs fois), qu\'arrive-t-il à son vecteur de Bloch ?',
      options: ['Rien — la décohérence n\'affecte que la mesure, pas l\'état', 'Il rétrécit vers le centre, la même signature qu\'un état mixte/intriqué', 'Il devient plus long que 1', 'Il saute instantanément au pôle sud'],
      explanation: 'Perdre la cohérence face à l\'environnement est mathématiquement identique à s\'intriquer avec quelque chose que l\'on ne peut pas suivre — les deux laissent le vecteur de Bloch propre du qubit plus court que 1, un état véritablement mixte, pas seulement un état pur randomisé.'
    },
    grover: {
      q: 'Juste après que l\'oracle de Grover inverse le signe de l\'amplitude de l\'élément marqué, que devient la probabilité mesurée de le trouver ?',
      options: ['Elle saute directement à 1', 'Elle reste exactement la même qu\'avant l\'action de l\'oracle', 'Elle tombe à 0', 'Elle devient aléatoire'],
      explanation: 'La probabilité provient de |amplitude|², et un simple changement de signe ne change rien à cela : (−0,5)² = (0,5)². Le basculement de phase de l\'oracle est totalement invisible pour une mesure jusqu\'à ce que l\'étape de diffusion le transforme en une réelle hausse de probabilité.'
    }
  }
});


// ════════ js/locales/es.js ════════
// Español — traducción del locale canónico (en.js). Debe mantener
// exactamente la misma estructura de claves anidadas que en.js; core/i18n.js's
// t() recurre a en.js primero si el idioma activo no tiene una clave, así
// que este archivo solo necesita cubrir el mismo conjunto de claves
// traducibles definido allí.
registerLocale('es', {
  header: {
    tag: 'Quantum Explorer · CERN',
    themeToggle: 'Cambiar modo claro / oscuro'
  },
  footer: {
    tagline: 'Una plataforma interactiva para aprender computación cuántica y mecánica cuántica',
    cernLink: 'Sitio oficial del CERN',
    copyright: 'Copyright © {year} CERN'
  },
  nav: {
    home: 'Inicio',
    introduction: 'Introducción',
    importantConcepts: 'Conceptos Importantes',
    bitsQubits: 'Bits y Qubits',
    mathsConcept: 'Concepto Matemático',
    gates: 'Puertas',
    circuits: 'Circuitos',
    measure: 'Medir',
    entangle: 'Entrelazar',
    bellStates: 'Estados de Bell',
    tunnel: 'Túnel',
    interference: 'Interferencia',
    beamSplitter: 'Divisor de Haz',
    sternGerlach: 'Stern–Gerlach',
    teleport: 'Teleportar',
    superdense: 'Codificación Superdensa',
    noise: 'Ruido',
    grover: 'Búsqueda de Grover'
  },
  qubitTab: {
    classical: 'Clásico',
    oneQubit: 'Un Qubit',
    twoQubit: 'Dos Qubits',
    threeQubit: 'Tres Qubits',
    pageTitle: 'Bits y Qubits',
    pageSubtitle: 'Aprende información clásica y cuántica explorando un bit, un solo qubit o un sistema de dos qubits.',
    classicalBitBadge: 'Bit Clásico',
    classicalBitDesc: 'Un bit es la unidad más pequeña de información en un ordenador clásico. A diferencia de un qubit, un bit clásico nunca existe en ambos estados simultáneamente.',
    currentBit: 'Bit actual',
    possibleValues: 'Valores posibles',
    classicalExplainer: 'Activa el interruptor para cambiar el bit. Observa que siempre es 0 o 1, nunca ambos.',
    qubitBadge: 'Qubit',
    qubitDesc: 'Un qubit es la unidad fundamental de la información cuántica. A diferencia de un bit clásico, puede existir en una superposición de 0 y 1 a la vez — su estado se describe mediante dos amplitudes complejas, α y β, hasta el momento en que se mide.',
    qubitIntroExplainer: 'Elige un modo abajo: explora la superposición de un solo qubit en la esfera de Bloch, o descubre cómo dos qubits independientes se combinan en un estado conjunto.',
    oneQubitDesc: 'Una superposición de 0 y 1 a la vez',
    exploreBlochSphere: 'Explorar la Esfera de Bloch',
    oneQubitExplainer: 'Un qubit puede estar en una superposición de |0⟩ y |1⟩ simultáneamente. Arrastra los deslizadores para explorar todos los estados posibles en la esfera de Bloch — cada punto es un estado válido de un qubit, inaccesible para cualquier bit clásico.',
    qubitABadge: 'Qubit A',
    qubitADesc: 'Independiente — no entrelazado con B',
    qubitBBadge: 'Qubit B',
    qubitBDesc: 'Independiente — no entrelazado con A',
    jointState: 'Estado Conjunto — |ψ_A⟩ ⊗ |ψ_B⟩',
    twoQubitExplainer: 'Dos qubits, cada uno arrastrado de forma independiente — el estado conjunto de arriba es simplemente el producto de sus probabilidades individuales, P(ab) = P(a) × P(b). Aquí nada está aún correlacionado; ese es exactamente el ingrediente que la pestaña Entrelazar añade con una CNOT.',
    classicalTryMeIdle: 'Haz clic en Pruébame para ver el bit alternar de un lado a otro.',
    oneQubitTryMeIdle: 'Haz clic en Pruébame para recorrer los seis estados base.',
    twoQubitTryMeIdle: 'Haz clic en Pruébame para mover ambos qubits juntos a través de los cuatro estados base.',
    whatIsQubitBody: 'Un qubit suele describirse como "0 y 1 al mismo tiempo", pero eso es una forma abreviada de algo más preciso: su estado es una <span class="key-term">superposición</span> — una combinación ponderada — de los dos resultados base |0⟩ y |1⟩, fijada por dos <span class="key-term">amplitudes complejas</span> α y β. Elevar al cuadrado el tamaño de cada amplitud da la probabilidad de ese resultado al medir — pero antes de medir, el qubit realmente no ha elegido ninguno. Un bit clásico tiene exactamente dos estados. Un qubit tiene infinitos: cada punto de la superficie de la esfera de Bloch de abajo es un estado válido, no solo sus dos polos.',
    blochEarthTitle: 'La Esfera de Bloch — Piensa en el Planeta Tierra',
    blochEarthBody: 'La esfera en la que vive tu qubit funciona como un globo terráqueo. El <span class="key-term">polo norte</span> es |0⟩ y el <span class="key-term">polo sur</span> es |1⟩ — θ (theta) es la "latitud", cuánto se ha inclinado el qubit desde el polo |0⟩ hacia |1⟩. Estar justo en el <span class="key-term">ecuador</span> (θ = 90°) significa una <span class="key-term">superposición</span> equilibrada 50/50 de ambos. φ (phi) es la "longitud" — nunca cambia las probabilidades de medición, solo la <span class="key-term">fase</span> relativa entre las dos amplitudes, invisible en una sola medición pero es exactamente lo que impulsa la interferencia en el resto de la aplicación.',
    qubitCBadge: 'Qubit C',
    qubitA3Desc: 'Independiente — no entrelazado con B ni C',
    qubitB3Desc: 'Independiente — no entrelazado con A ni C',
    qubitC3Desc: 'Independiente — no entrelazado con A ni B',
    jointState3: 'Estado Conjunto — |ψ_A⟩ ⊗ |ψ_B⟩ ⊗ |ψ_C⟩',
    threeQubitExplainer: 'Tres qubits, cada uno arrastrado de forma independiente — el estado conjunto de arriba es simplemente el producto de las tres probabilidades individuales, P(abc) = P(a) × P(b) × P(c). Aquí sigue sin haber nada correlacionado; escala esta misma idea con una CNOT y obtienes los estados GHZ en el constructor de 3 qubits de la pestaña Circuitos.',
    threeQubitTryMeIdle: 'Haz clic en Pruébame para mover los tres qubits juntos a través de los cuatro estados base.'
  },
  maths: {
    title: 'Concepto Matemático',
    subtitle: 'El lenguaje matemático detrás de los qubits — números complejos, vectores, matrices, vectores de estado, notación de Dirac y productos tensoriales.',
    complexBody1: 'Las amplitudes de un qubit no son simples números reales — son números complejos, cada uno con una parte real y una parte imaginaria. Esa dimensión adicional es lo que hace posible la fase (y la interferencia).',
    complexFormula1: 'z = a + bi,&nbsp;&nbsp; i² = −1',
    complexFormula2: 'Módulo: |z| = √(a² + b²)',
    complexFormula3: 'Forma polar: z = r·e<sup>iθ</sup> = r(cos θ + i sin θ)',
    complexBody2: 'Un estado de qubit α|0⟩ + β|1⟩ tiene amplitudes complejas α, β. Solo sus módulos al cuadrado |α|², |β|² son directamente observables (como probabilidades de medición) — la fase relativa entre ellas es invisible en una sola medición, pero es lo que impulsa la interferencia.',
    vectorsBody1: 'El estado de un qubit es un vector en un espacio vectorial complejo de 2 dimensiones, escrito como una columna de sus dos amplitudes.',
    vectorsFormula1: '|0⟩ = [1, 0]<sup>T</sup>&nbsp;&nbsp;&nbsp; |1⟩ = [0, 1]<sup>T</sup>',
    vectorsFormula2: '|ψ⟩ = α|0⟩ + β|1⟩ = [α, β]<sup>T</sup>',
    vectorsFormula3: 'Normalización: |α|² + |β|² = 1',
    vectorsFormula4: 'Producto interno: ⟨φ|ψ⟩ = φ<sub>0</sub>*ψ<sub>0</sub> + φ<sub>1</sub>*ψ<sub>1</sub>',
    vectorsBody2: 'La normalización mantiene la probabilidad total en el 100% — por eso cada punto al que puedes arrastrar en la esfera de Bloch es automáticamente un estado válido. El producto interno mide cuánto se superponen dos estados; los estados ortogonales (como |0⟩ y |1⟩) tienen producto interno 0.',
    matricesBody1: 'Cada puerta cuántica es una matriz. Aplicar una puerta a un qubit es simplemente una multiplicación de matriz por vector — la matriz de la puerta por el vector de estado da el nuevo vector de estado.',
    matricesFormula1: 'Pauli-X = [[0, 1], [1, 0]]',
    matricesFormula2: 'X|0⟩ = [[0,1],[1,0]]·[1,0]<sup>T</sup> = [0,1]<sup>T</sup> = |1⟩',
    matricesFormula3: 'Condición unitaria: U†U = I',
    matricesBody2: '"Unitaria" es la condición que toda puerta cuántica debe cumplir — U† (la traspuesta conjugada) deshace U exactamente. Es lo que garantiza que una puerta nunca destruye ni crea probabilidad: el estado de salida siempre está normalizado si el de entrada lo estaba.',
    svBody1: 'El vector de estado |ψ⟩ es la descripción completa de un qubit — todo lo que puedes predecir sobre él (probabilidades de medición, cómo responde a una puerta) se calcula a partir de estas dos amplitudes.',
    svFormula1: '|ψ⟩ = α|0⟩ + β|1⟩',
    svFormula2: 'Forma de Bloch: |ψ⟩ = cos(θ/2)|0⟩ + e<sup>iφ</sup>sin(θ/2)|1⟩',
    svFormula3: 'P(0) = |α|²&nbsp;&nbsp;&nbsp; P(1) = |β|²',
    svBody2: 'θ y φ son exactamente los dos deslizadores de la esfera de Bloch en Bits y Qubits — cada vector de estado corresponde a un punto de esa esfera, y viceversa.',
    compareStateSpaces: 'Comparar los Espacios de Estados',
    compareStateSpacesBody: 'Un bit clásico es un punto en una línea; un qubit es la punta de un vector sobre un arco unitario — elige una vista abajo.',
    svClassicalDesc: 'Solo dos extremos discretos',
    toggleBit: 'Cambiar bit',
    currentState: 'Estado Actual',
    stateSpace: 'Espacio de Estados',
    stateSpaceBody: 'Solo los dos extremos |0⟩ y |1⟩ son válidos. La región intermedia está físicamente prohibida — no existe un "47% |1⟩" para un bit clásico.',
    svQuantumDesc: 'Cualquier punto del arco unitario',
    keyInsight: 'Idea Clave',
    keyInsightBody: 'La punta del vector de estado debe situarse sobre el arco unitario (α² + β² = 1). Cada punto de ese arco es un estado cuántico distinto y válido. El bit clásico solo ocupa las dos esquinas.',
    diracBody1: 'Los símbolos |·⟩ y ⟨·| usados por toda esta aplicación son la notación "bra-ket" de Dirac — una abreviatura compacta para los vectores y sus productos internos.',
    diracFormula1: 'Ket: |ψ⟩ — un vector columna (un estado)',
    diracFormula2: 'Bra: ⟨ψ| — el vector fila traspuesto conjugado',
    diracFormula3: 'Bra-ket: ⟨φ|ψ⟩ — un producto interno (un número)',
    diracFormula4: '⟨0|0⟩ = 1&nbsp;&nbsp;&nbsp; ⟨0|1⟩ = 0&nbsp;&nbsp;&nbsp; ⟨1|1⟩ = 1',
    diracFormula5: 'Ket-bra: |ψ⟩⟨φ| — un producto externo (una matriz/operador)',
    diracBody2: '|0⟩ y |1⟩ son ortonormales — cada uno tiene longitud unitaria y superposición nula con el otro — que es exactamente la razón por la que medir siempre da un 0 o un 1 limpio, nunca algo intermedio.',
    tensorBody1: 'El producto tensorial (⊗) es la forma en que dos espacios vectoriales independientes se combinan en un único espacio conjunto más grande — se apila cada entrada del primer vector contra cada entrada del segundo, multiplicando cada par. Un vector de dimensión n combinado con uno de dimensión m produce un vector de dimensión n×m.',
    tensorFormula1: '[a, b]<sup>T</sup> ⊗ [c, d]<sup>T</sup> = [ac, ad, bc, bd]<sup>T</sup>',
    tensorBody2: 'Dos qubits independientes se combinan exactamente así: cada uno es un vector de 2 entradas, así que su estado conjunto es un vector de 4 entradas — una entrada por cada combinación de estados base, |00⟩, |01⟩, |10⟩, |11⟩.',
    tensorFormula2: '|0⟩⊗|0⟩ = [1,0]<sup>T</sup>⊗[1,0]<sup>T</sup> = [1,0,0,0]<sup>T</sup> = |00⟩',
    tensorBody3: 'Todo estado construido mediante el producto tensorial de dos estados de un solo qubit siempre puede factorizarse de nuevo en esos mismos dos qubits. Sin embargo, no todo vector de 4 entradas puede factorizarse así — un estado conjunto que no puede separarse de nuevo en un producto tensorial de dos estados de un solo qubit es precisamente lo que se llama entrelazado, explorado de forma práctica en la pestaña Entrelazar.'
  },
  gates: {
    title: 'Puertas',
    subtitle: 'Elige una puerta y observa su efecto inmediato — clásico o cuántico',
    classicalGates: 'Puertas Clásicas',
    quantumGates: 'Puertas Cuánticas',
    compareGates: 'Comparar',
    quantumTruthTableNote: 'La acción de cada puerta fija sobre los dos estados base — las puertas de rotación (Rx/Ry/Rz) no están incluidas porque su salida depende de un ángulo en tiempo de ejecución, no de una tabla fija.',
    compareClassicalDesc: 'NOT/AND/OR/XOR y sus negaciones — reglas estrictas y destructivas',
    compareQuantumDesc: 'H/X/Y/Z/S/T — siempre reversibles, pueden crear superposición',
    compareInsightTitle: 'La Diferencia Clave',
    compareInsightBody: 'Cada fila clásica de arriba colapsa información — AND, OR y compañía asignan múltiples combinaciones de entrada a la misma salida, así que no hay forma de volver a la entrada solo a partir de la salida. Cada fila cuántica es reversible: cada una es una matriz unitaria, así que aplicar después su propia traspuesta conjugada siempre recupera exactamente la entrada. Las puertas clásicas también solo pueden producir un 0 o un 1 definido; puertas cuánticas como H pueden producir una superposición genuina de ambos.',
    pickGate: 'Puerta — haz clic para elegir',
    inputA: 'Entrada A',
    inputB: 'Entrada B',
    resetToZero: 'Reiniciar a |0⟩',
    applyGate: 'Aplicar Puerta',
    gateReference: 'Referencia de Puertas',
    rotationGates: 'Puertas de Rotación',
    gateMatrix: 'Matriz de la Puerta',
    selectAGate: '← selecciona una puerta',
    whyReversibleTitle: 'Por Qué Toda Puerta Es Reversible',
    whyReversibleBody: 'Toda puerta de la izquierda es una matriz unitaria (U†U = I) — no por convención, sino porque una puerta es en realidad la propia evolución temporal del qubit según la ecuación de Schrödinger, que siempre conserva la probabilidad total. Una consecuencia directa: las puertas cuánticas nunca destruyen información. Aplica cualquier puerta y luego su traspuesta conjugada, y el qubit vuelve exactamente a donde empezó — no existe un equivalente cuántico de una puerta AND clásica que descarte silenciosamente un bit.',
    // Apodos/nombres formales para las seis puertas fijas (GATES en
    // js/core/gates.js) — `name` (la letra H/X/Y/Z/S/T) es notación y
    // nunca se traduce. El párrafo completo de `explain` es texto de
    // narración dinámica (construido en una frase interpolada en el
    // momento en que se aplica una puerta, ver applyGate() en
    // gates-tab.js) y queda fuera de alcance, igual que el resto de esa
    // categoría en toda la aplicación.
    H: { desc: 'La Moneda Giratoria', formalName: 'Puerta de Hadamard' },
    X: { desc: 'El Interruptor de Luz', formalName: 'Puerta de Pauli-X' },
    Y: { desc: 'La Voltereta', formalName: 'Puerta de Pauli-Y' },
    Z: { desc: 'El Movimiento Fantasma', formalName: 'Puerta de Pauli-Z' },
    S: { desc: 'El Cuarto de Vuelta', formalName: 'Puerta de fase (√Z)' },
    T: { desc: 'El Toque Susurrado', formalName: 'Puerta T (√S)' }
  },
  // Rx/Ry/Rz (ROTATION_GATES en js/core/gates.js) — separado de `gates`
  // arriba porque ambos usan las mismas claves de eje (X/Y/Z), que de lo
  // contrario colisionarían con las entradas propias de las puertas fijas
  // de Pauli-X/Y/Z allí.
  rotationGates: {
    X: { desc: 'Rotar alrededor del eje X', formalName: 'Rotación en el eje X' },
    Y: { desc: 'Rotar alrededor del eje Y', formalName: 'Rotación en el eje Y' },
    Z: { desc: 'Rotar alrededor del eje Z', formalName: 'Rotación en el eje Z' }
  },
  circuits: {
    title: 'Circuitos',
    subtitle: 'Las puertas clásicas combinan bits con reglas estrictas; los circuitos cuánticos guían un qubit por una ruta de puertas, acumulando rotaciones — elige un constructor abajo',
    classicalCircuit: 'Circuito Clásico',
    quantumCircuit: 'Circuito Cuántico',
    gatePalette: 'Paleta de Puertas — haz clic para añadir',
    companionBit: 'Bit acompañante — usado por las puertas de la familia AND/OR/XOR cuando se añaden',
    startBit: 'Bit Inicial',
    circuitWire: 'Cable del Circuito',
    whatsGoingOn: 'Qué está pasando',
    afterRunning: 'Después de ejecutar',
    truthTableStartOutput: 'Tabla de Verdad — bit inicial → salida',
    oneQubit: '1 Qubit',
    twoQubits: '2 Qubits',
    threeQubits: '3 Qubits',
    outputState: 'Estado de Salida',
    targetQubit2: 'Qubit Objetivo — las nuevas puertas se aplican a',
    gatePaletteTarget: 'Paleta de Puertas — haz clic para añadir al qubit objetivo',
    circuitDiagram: 'Diagrama del Circuito',
    outputState2Q: 'Estado de Salida (2 Qubits)',
    perQubitBlochSpheres: 'Esferas de Bloch por Qubit — se contraen hacia el centro cuando están entrelazados',
    targetQubit3: 'Qubit Objetivo — las nuevas puertas de un solo qubit se aplican a',
    addCnot: 'Añadir CNOT',
    outputState3Q: 'Estado de Salida (3 Qubits)',
    runHistory: 'Historial de Ejecución — haz clic en un paso para volver a verlo'
  },
  common: {
    run: '▶ Ejecutar',
    clear: 'Borrar',
    add: 'Añadir',
    reset: 'Reiniciar',
    controls: 'Controles',
    detector: 'Detector',
    tryMe: 'Pruébame',
    tryMePresets: '🎲 Pruébame — circuitos predefinidos',
    classical: 'Clásico',
    quantum: 'Cuántico',
    stateVector: 'Vector de Estado',
    copyShareableLink: 'Copiar enlace para compartir',
    basisStates: 'Estados Base',
    possibleStates: 'Estados posibles',
    uncertainty: 'Incertidumbre',
    uncertaintyFundamental: 'Fundamental — hasta ser medido',
    representation: 'Representación',
    output: 'Salida',
    whatJustHappened: 'Qué acaba de pasar',
    truthTable: 'Tabla de Verdad',
    appliedSequence: 'Secuencia Aplicada',
    gate: 'Puerta',
    input: 'Entrada'
  },
  mathsTab: {
    complexNumbers: 'Números Complejos',
    vectors: 'Vectores',
    matrices: 'Matrices',
    stateVector: 'Vector de Estado',
    diracNotation: 'Notación de Dirac',
    tensorProducts: 'Productos Tensoriales'
  },
  gatesTab: {
    classical: 'Clásico',
    quantum: 'Cuántico',
    compare: 'Comparar'
  },
  roadmap: {
    title: 'Conceptos Cuánticos',
    subtitle: 'Haz clic en cualquier concepto para abrir su simulación',
    conceptMap: 'Mapa de Conceptos',
    myProgress: 'Mi Progreso',
    lessonsCompleted: 'Lecciones Completadas',
    quickCheckScore: 'Puntuación de Comprobaciones Rápidas',
    lessonChecklist: 'Lista de Lecciones',
    resetProgress: 'Reiniciar progreso',
    read: 'leído',
    markUnread: 'Marcar como no leído',
    markAsRead: 'Marcar como leído',
    start: 'Comenzar →',
    quickCheck: 'Comprobación rápida',
    correct: 'correcto',
    review: 'repasar',
    notAttempted: 'Aún no intentado.',
    quizScoreSummary: '{correct} / {answered} comprobaciones rápidas correctas hasta ahora ({total} conceptos en total).',
    centerTooltip: '{count} conceptos fundamentales de computación cuántica, desde un solo qubit hasta el entrelazamiento y la interferencia de ondas — haz clic en cualquier tema para explorarlo.'
  },
  mindmap: {
    quantumWorld: 'Mundo Cuántico',
    introduction: 'Introducción',
    classical: 'Clásico',
    quantum: 'Cuántico',
    oneQubit: 'Un Qubit',
    twoQubits: 'Dos Qubits',
    threeQubits: 'Tres Qubits'
  },
  intro: {
    title: 'Introducción',
    subtitle: '¿Nuevo en la computación cuántica? Empieza aquí — no se necesita formación en física ni en programación.',
    classicalTitle: '¿INTRODUCCIÓN A LA COMPUTACIÓN CUÁNTICA?',
    classicalBody: 'Antes de aprender sobre los ordenadores cuánticos, empecemos con los ordenadores clásicos. Tu teléfono y tu ordenador usan bits para procesar información. Un bit solo tiene dos estados posibles: <b>0 (APAGADO) y 1 (ENCENDIDO)</b>',
    whatIsTitle: '¿QUÉ ES LA COMPUTACIÓN CUÁNTICA?',
    whatIsBody: 'La computación cuántica utiliza los principios de la mecánica cuántica para resolver ciertos problemas más rápido que los ordenadores clásicos.',
    bitsToQubitsTitle: 'De Bits a Qubits',
    bitsToQubitsBody: 'A diferencia de un bit, que es 0 o 1, un qubit puede existir en ambos estados al mismo tiempo. Esto se llama superposición.',
    superpositionTitle: 'Superposición: Múltiples Posibilidades',
    superpositionBody: 'Imagina que lanzas una moneda al aire. Mientras gira, representa tanto cara como cruz. De manera similar, un qubit puede representar tanto 0 como 1 hasta que se mide.',
    entanglementTitle: 'Entrelazamiento: Información Cuántica Conectada',
    entanglementBody: 'El entrelazamiento vincula dos o más qubits entre sí. Los cambios en un qubit están correlacionados con los demás, lo que permite a los ordenadores cuánticos procesar información de maneras nuevas y poderosas.',
    whyMattersTitle: 'Por Qué Importa la Computación Cuántica',
    whyMattersBody: 'Los ordenadores cuánticos no están diseñados para reemplazar portátiles o smartphones. Están construidos para resolver problemas complejos, como: <ul class="quantum-list"><li>🧪 Simular moléculas</li><li>⚙️ Optimizar sistemas grandes</li><li>🔐 Mejorar la criptografía</li><li>🌦️ Resolver problemas científicos y de ingeniería complejos</li></ul>',
    howAppWorksTitle: 'Cómo funciona esta aplicación',
    howAppWorksBody: 'Cada pestaña combina una breve lección con una simulación interactiva y una comprobación rápida. Explora los conceptos moviendo esferas de Bloch, aplicando puertas y ejecutando circuitos mientras ves los resultados actualizarse en tiempo real. Tu progreso se registra a medida que aprendes.',
    suggestedPath: 'Ruta de aprendizaje sugerida'
  },
  concepts: {
    title: 'Conceptos Importantes',
    subtitle: 'Un glosario de las ideas esenciales detrás de la mecánica cuántica y la computación cuántica — el vocabulario sobre el que se construye el resto de esta aplicación.',
    searchPlaceholder: 'Buscar conceptos…',
    searchNoResults: 'Ningún concepto coincide con "{query}".',
    mechanicsGroupTitle: 'Fundamentos de la Mecánica Cuántica',
    computingGroupTitle: 'Conceptos de Computación Cuántica',
    superpositionTitle: 'Superposición',
    superpositionBody: 'Un sistema cuántico puede existir en una combinación de múltiples estados a la vez, en lugar de estar fijado en uno solo — como un qubit que es en parte |0⟩ y en parte |1⟩ simultáneamente. No es que el sistema esté secretamente en un estado y simplemente no sepamos cuál; la combinación es el estado físico real, hasta que una medición lo obliga a decidirse por un resultado.',
    waveParticleTitle: 'Dualidad Onda-Partícula',
    waveParticleBody: 'Todo objeto cuántico — electrones, fotones, incluso qubits — se comporta como una onda en algunos experimentos (extendiéndose, interfiriendo consigo mismo) y como una partícula discreta en otros (llegando a un detector como un único clic localizado). Qué comportamiento aparece depende de qué se mide, no de que el objeto cambie de identidad.',
    quantumStateTitle: 'Estado Cuántico (Función de Onda)',
    quantumStateBody: 'La descripción matemática completa de un sistema cuántico — todo lo que se puede predecir sobre él, codificado en un conjunto de amplitudes complejas. Para un qubit, es el vector de estado de dos amplitudes |ψ⟩ = α|0⟩ + β|1⟩ explorado a lo largo de las pestañas Bits y Qubits y Concepto Matemático de esta aplicación.',
    bornRuleTitle: 'La Regla de Born',
    bornRuleBody: 'La regla que conecta las amplitudes de un estado cuántico con las probabilidades de medición: elevar al cuadrado el tamaño de una amplitud da la probabilidad de observar ese resultado. Para un qubit α|0⟩ + β|1⟩, eso es P(0) = |α|² y P(1) = |β|² — mira la pestaña Medir para verlo en acción.',
    collapseTitle: 'Colapso de la Función de Onda',
    collapseBody: 'En el momento en que ocurre una medición, un estado cuántico deja de ser una mezcla de posibilidades y se convierte en un único resultado definido — de forma irreversible. Las demás posibilidades no están ocultas en algún lugar; simplemente desaparecen, lo que hace que la medición cuántica sea fundamentalmente distinta de simplemente comprobar un valor que ya estaba fijado.',
    uncertaintyTitle: 'Principio de Incertidumbre de Heisenberg',
    uncertaintyBody: 'Ciertos pares de propiedades — como la posición y el momento de una partícula — nunca pueden conocerse ambos con precisión arbitraria al mismo tiempo. Esto no es una limitación de nuestros instrumentos; es una característica inherente a cómo se describen los estados cuánticos.',
    entanglementTitle: 'Entrelazamiento Cuántico',
    entanglementBody: 'El entrelazamiento cuántico es un fenómeno en el que dos o más partículas cuánticas quedan vinculadas de forma que el estado de una partícula no puede describirse independientemente de las demás, incluso cuando están separadas por grandes distancias. En su lugar, comparten un único estado cuántico conjunto.'
      + '<br><br>Medir una de las partículas entrelazadas revela instantáneamente lo que mostrarán las demás, sin importar la distancia que las separe — sin embargo, ninguna señal ni energía viaja realmente entre ellas en el momento de la medición. Esto puede parecer una comunicación más rápida que la luz, pero no lo es: el resultado de cada medición individual sigue siendo genuinamente aleatorio, así que no hay forma de codificar un mensaje usando solo el entrelazamiento. Explorado en profundidad en la pestaña Entrelazar.',
    interferenceTitle: 'Interferencia Cuántica',
    interferenceBody: 'Cuando un sistema cuántico tiene más de un camino indistinguible hacia el mismo resultado, las amplitudes de esos caminos se combinan — reforzándose en algunos puntos y cancelándose en otros — produciendo patrones (como las franjas del experimento de la doble rendija) que ningún camino podría producir por sí solo. Ver las pestañas Interferencia y Divisor de Haz.',
    tunnelingTitle: 'Efecto Túnel Cuántico',
    tunnelingBody: 'Una partícula cuántica tiene una probabilidad distinta de cero de aparecer al otro lado de una barrera de energía que clásicamente no debería poder cruzar, porque su función de onda no se detiene en seco en la barrera — se atenúa a través de ella en lugar de rebotar. Ver la pestaña Túnel para un paquete de ondas interactivo que golpea una barrera.',
    decoherenceTitle: 'Decoherencia',
    decoherenceBody: 'El proceso por el cual la frágil superposición y entrelazamiento de un sistema cuántico se disipan por la interacción inevitable con su entorno, haciendo que se comporte cada vez más como un sistema clásico. Es el principal obstáculo práctico para construir ordenadores cuánticos grandes y fiables.',
    schrodingerTitle: 'La Ecuación de Schrödinger',
    schrodingerBody: 'La ecuación maestra de la mecánica cuántica — describe exactamente cómo evoluciona un estado cuántico de forma continua en el tiempo, del mismo modo que las leyes de Newton describen el movimiento de un objeto clásico. Cada puerta cuántica de esta aplicación es en realidad solo una instantánea de la evolución de esta ecuación durante un intervalo de tiempo fijo, lo cual también explica por qué las puertas son reversibles: la ecuación nunca destruye información, solo la reconfigura.',
    bellTheoremTitle: 'El Teorema de Bell y la Paradoja EPR',
    bellTheoremBody: 'Einstein, Podolsky y Rosen argumentaron en 1935 que la mecánica cuántica debía estar incompleta — las correlaciones de las partículas entrelazadas, razonaron, podrían explicarse mediante alguna "variable oculta" compartida y fijada de antemano, sin ninguna rareza real. El teorema de Bell (1964) demostró que esto era incorrecto: ninguna teoría basada en variables ocultas puede reproducir jamás todas las correlaciones que predice la mecánica cuántica, y décadas de experimentos han confirmado las predicciones de la mecánica cuántica, no las de las variables ocultas.',
    zenoTitle: 'Efecto Zenón Cuántico',
    zenoBody: 'Medir un sistema cuántico con suficiente frecuencia puede congelar efectivamente su evolución — cada medición hace que el estado colapse de vuelta a lo que ya era, antes de que tenga oportunidad de evolucionar. Llamado así por la paradoja de Zenón de la flecha que nunca parece moverse, es una consecuencia directa del colapso de la función de onda: un estado cuántico "observado" cambia mucho más lentamente que uno no observado.',
    hilbertSpaceTitle: 'Espacio de Hilbert',
    hilbertSpaceBody: 'El "espacio" matemático donde vive todo estado cuántico. Cada estado cuántico posible se representa como un vector en un espacio de Hilbert, y las reglas de la mecánica cuántica — superposición, medición y evolución — se expresan todas como operaciones sobre estos vectores. Un solo qubit vive en un espacio de Hilbert de dos dimensiones, mientras que un sistema de n qubits vive en uno de 2ⁿ dimensiones.',
    linearOperatorsTitle: 'Operadores Lineales',
    linearOperatorsBody: 'Las magnitudes físicas y las puertas cuánticas se representan mediante operadores lineales que actúan sobre los estados cuánticos. Aplicar un operador transforma un estado cuántico válido en otro, haciendo del álgebra lineal el lenguaje de la mecánica cuántica.',
    observableTitle: 'Observable',
    observableBody: 'Un observable es cualquier propiedad física medible — como la posición, el momento, el espín o la energía. Cada observable está representado por un operador hermítico cuyos valores propios son los únicos resultados de medición que pueden ocurrir jamás.',
    eigenstatesTitle: 'Estados Propios y Valores Propios',
    eigenstatesBody: 'Si medir un observable siempre produce el mismo resultado para un estado cuántico particular, ese estado es un estado propio del observable. El resultado de la medición es el valor propio correspondiente. Medir un estado propio lo deja sin cambios, mientras que medir una superposición generalmente causa el colapso de la función de onda.',
    expectationValueTitle: 'Valor Esperado',
    expectationValueBody: 'En lugar de predecir un único resultado de medición definido, la mecánica cuántica predice el valor promedio obtenido al repetir el mismo experimento muchas veces sobre sistemas preparados de forma idéntica. Este promedio se llama el valor esperado.',
    probabilityAmplitudesTitle: 'Amplitudes de Probabilidad',
    probabilityAmplitudesBody: 'A diferencia de las probabilidades ordinarias, la mecánica cuántica asigna amplitudes de probabilidad complejas a los resultados posibles. Estas amplitudes pueden interferir de forma constructiva o destructiva, y solo sus módulos al cuadrado se convierten en probabilidades observables mediante la regla de Born.',
    phaseTitle: 'Fase',
    phaseBody: 'La fase de un estado cuántico es invisible en una sola medición, pero determina cómo interfieren las amplitudes. Es la fase relativa — no la fase absoluta — la que da su poder a la interferencia cuántica y a muchos algoritmos cuánticos.',
    globalPhaseTitle: 'Fase Global frente a Fase Relativa',
    globalPhaseBody: 'Multiplicar un estado cuántico completo por la misma fase compleja no cambia nada físicamente; esto se llama una fase global. Cambiar la fase entre las componentes de una superposición modifica los patrones de interferencia observables y por tanto tiene consecuencias físicas.',
    spinTitle: 'Espín',
    spinBody: 'El espín es una forma intrínseca de momento angular que portan las partículas cuánticas. A diferencia de una rotación ordinaria, el espín es una propiedad cuántica fundamental que solo toma valores discretos. El espín del electrón es la realización física de muchos qubits experimentales.',
    pauliExclusionTitle: 'Principio de Exclusión de Pauli',
    pauliExclusionBody: 'Dos fermiones idénticos nunca pueden ocupar el mismo estado cuántico simultáneamente. Esta regla simple explica la estructura de los átomos, la química, y por qué la materia permanece estable.',
    identicalParticlesTitle: 'Partículas Idénticas',
    identicalParticlesBody: 'Las partículas del mismo tipo son fundamentalmente indistinguibles. Intercambiar dos partículas idénticas no crea un nuevo estado físico — solo cambia la función de onda por un signo (fermiones) o no la cambia en absoluto (bosones).',
    bosonsFermionsTitle: 'Bosones y Fermiones',
    bosonsFermionsBody: 'Los bosones pueden compartir el mismo estado cuántico, lo que permite fenómenos como los láseres y los condensados de Bose-Einstein. Los fermiones obedecen el principio de exclusión de Pauli, dando lugar a la estructura atómica y a los materiales electrónicos.',
    densityMatrixTitle: 'Matriz de Densidad',
    densityMatrixBody: 'No todo sistema cuántico está perfectamente aislado. Una matriz de densidad describe tanto los estados cuánticos puros como las mezclas estadísticas, convirtiéndola en la herramienta estándar para describir sistemas cuánticos ruidosos o parcialmente conocidos.',
    mixedStatesTitle: 'Estados Mixtos',
    mixedStatesBody: 'A diferencia de una superposición, que es genuinamente cuántica, un estado mixto representa una incertidumbre clásica sobre en qué estado cuántico se encuentra realmente un sistema. Las matrices de densidad distinguen estas dos situaciones muy diferentes.',
    measurementBasisTitle: 'Base de Medición',
    measurementBasisBody: 'Una medición cuántica siempre se realiza respecto a una base elegida. El mismo estado puede parecer definido en una base mientras existe como una superposición en otra, lo que hace que la elección de la base sea central en la computación cuántica.',
    sternGerlachExpTitle: 'Experimento de Stern–Gerlach',
    sternGerlachExpBody: 'El experimento de Stern–Gerlach (1922), realizado por Otto Stern y Walther Gerlach, demostró que el momento angular está cuantizado — mostrando que partículas como los electrones poseen una propiedad intrínseca llamada espín, que solo puede tomar valores discretos al medirse a lo largo de un eje elegido. Es uno de los experimentos fundacionales de la mecánica cuántica.'
      + '<ul class="quantum-list">'
      + '<li><b>Objetivo:</b> determinar si el momento magnético de un átomo podía apuntar en cualquier dirección, como predecía la física clásica, o solo en orientaciones específicas y cuantizadas.</li>'
      + '<li><b>¿Por qué átomos de plata?</b> La plata tiene un único electrón de valencia no apareado y un momento angular orbital total prácticamente nulo, por lo que el momento magnético medido proviene casi enteramente del espín de ese único electrón — lo que hace que el resultado sea mucho más fácil de interpretar.</li>'
      + '<li><b>Predicción clásica:</b> un momento magnético orientado al azar debería desviarse en cualquier cantidad, difuminando el haz en una banda continua sobre la pantalla.</li>'
      + '<li><b>Lo que realmente se observó:</b> el haz se dividió en exactamente dos puntos distintos, no en una banda continua — mostrando que solo son posibles dos orientaciones de espín a lo largo del eje de medición, espín arriba (+ħ/2) y espín abajo (−ħ/2).</li>'
      + '</ul>'
      + 'Explóralo tú mismo, incluyendo qué ocurre al medir el espín a lo largo de un segundo eje incompatible, en la pestaña Stern–Gerlach.',
    eprParadoxTitle: 'Paradoja EPR',
    eprParadoxBody: 'La paradoja EPR (1935), propuesta por Albert Einstein, Boris Podolsky y Nathan Rosen, es un experimento mental que argumenta que la mecánica cuántica, tal como se planteaba, debía ser una descripción incompleta de la realidad física — no porque sus predicciones fueran erróneas, sino por lo que esas predicciones parecían implicar.'
      + '<ul class="quantum-list">'
      + '<li><b>Objetivo:</b> mostrar que si la mecánica cuántica es correcta y se cumple el "realismo local" — que una partícula tiene propiedades definidas independientemente de la medición, y que ninguna influencia viaja más rápido que la luz — entonces a la mecánica cuántica le debe faltar algo.</li>'
      + '<li><b>El montaje:</b> dos partículas se preparan en un estado entrelazado y se separan una distancia arbitrariamente grande. Medir una propiedad de una revela instantáneamente la propiedad correspondiente de la otra, con certeza.</li>'
      + '<li><b>El argumento:</b> dado que medir la partícula A permite predecir con certeza el resultado de la partícula B sin nunca tocarla, EPR razonaron que esa propiedad de B ya debía estar fijada antes de la medición — de lo contrario, medir A tendría que afectar a B instantáneamente, lo cual parecía una "acción fantasmal a distancia".</li>'
      + '<li><b>La paradoja:</b> la mecánica cuántica dice que las dos partículas comparten un único estado conjunto indeterminado hasta la medición. El propio razonamiento de EPR decía que eso era imposible si se respeta la localidad — así que, o bien la mecánica cuántica está incompleta, o la naturaleza realmente es no local en este sentido concreto.</li>'
      + '</ul>'
      + 'Durante treinta años esto siguió siendo una cuestión de interpretación sin respuesta experimental — hasta que el Teorema de Bell (ver arriba) lo convirtió en una pregunta comprobable, y los experimentos se decantaron claramente en contra de la intuición de Einstein sobre las variables ocultas.',
    qubitTitle: 'Qubit',
    qubitBody: 'La unidad básica de información cuántica — como un bit clásico, pero capaz de existir en una superposición de 0 y 1 en lugar de estar fijado a un solo valor. El estado exacto de un qubit se describe mediante dos amplitudes complejas y se visualiza como un punto en la esfera de Bloch, explorado en la pestaña Bits y Qubits.',
    blochSphereTitle: 'Esfera de Bloch',
    blochSphereBody: 'Una representación geométrica de todo estado posible de un solo qubit como un punto en la superficie de una esfera — los polos norte y sur son |0⟩ y |1⟩, y cualquier otro punto es alguna superposición de ambos. Convierte el álgebra abstracta de las amplitudes en algo que literalmente se puede ver y arrastrar.',
    gateTitle: 'Puerta Cuántica',
    gateBody: 'El equivalente cuántico de una puerta lógica clásica — una operación que transforma el estado de un qubit, geométricamente una rotación de su punto en la esfera de Bloch. A diferencia de las puertas clásicas, toda puerta cuántica es reversible: ninguna descarta jamás información. Ver la pestaña Puertas para las seis puertas fijas (H, X, Y, Z, S, T) y sus efectos.',
    unitarityTitle: 'Unitariedad y Reversibilidad',
    unitarityBody: 'Toda puerta cuántica válida debe ser una matriz unitaria (U†U = I) — la condición matemática que garantiza que preserva la probabilidad total y siempre puede deshacerse mediante su propia traspuesta conjugada. Por eso la computación cuántica, a diferencia de la lógica clásica AND/OR, nunca destruye información en el proceso.',
    circuitTitle: 'Circuito Cuántico',
    circuitBody: 'Una secuencia de puertas cuánticas aplicadas a uno o más qubits, leída de izquierda a derecha — el equivalente cuántico de un circuito lógico clásico. Como el orden de las puertas generalmente importa (las rotaciones no conmutan), el mismo conjunto de puertas en un orden distinto puede llevar a los qubits a un estado final completamente diferente; construye uno tú mismo en la pestaña Circuitos.',
    bellGhzTitle: 'Estados de Bell y Estados GHZ',
    bellGhzBody: 'Los estados de Bell son los cuatro estados específicos, máximamente entrelazados, de dos qubits — Φ⁺, Φ⁻, Ψ⁺ y Ψ⁻ — que forman una base ortonormal fundamental en información cuántica y el recurso central de protocolos como la teletransportación cuántica y la codificación superdensa. Los cuatro se producen con la misma receta de dos puertas (una puerta Hadamard sobre un qubit, seguida de una puerta CNOT controlada por él), partiendo simplemente de un estado base de dos qubits distinto cada vez.'
      + '<br><br>Los cuatro estados de Bell son:'
      + '<ul class="quantum-list">'
      + '<li><b>Φ⁺ = (|00⟩ + |11⟩)/√2</b> — los qubits coinciden y permanecen en fase.</li>'
      + '<li><b>Φ⁻ = (|00⟩ − |11⟩)/√2</b> — los qubits coinciden, con un cambio de fase.</li>'
      + '<li><b>Ψ⁺ = (|01⟩ + |10⟩)/√2</b> — los qubits son opuestos y están en fase.</li>'
      + '<li><b>Ψ⁻ = (|01⟩ − |10⟩)/√2</b> — los qubits son opuestos, con un cambio de fase.</li>'
      + '</ul>'
      + 'Medir uno de los dos qubits, en cualquiera de los cuatro estados, determina instantáneamente el resultado del otro. Los estados GHZ generalizan la misma idea a tres o más qubits, todos correlacionados entre sí — construye pares de Bell y tríos GHZ desde cero con puertas Hadamard y CNOT en la pestaña Circuitos.',
    noCloningTitle: 'Teorema de No Clonación',
    noCloningBody: 'Es físicamente imposible crear una copia exacta e independiente de un estado cuántico desconocido arbitrario — una consecuencia directa de que la mecánica cuántica es lineal. Por eso la información cuántica debe tratarse de forma tan distinta a los bits clásicos, que siempre pueden copiarse libremente.',
    algorithmsTitle: 'Algoritmos Cuánticos',
    algorithmsBody: 'Procedimientos paso a paso construidos con puertas cuánticas que explotan la superposición y la interferencia para resolver ciertos problemas mucho más rápido que cualquier algoritmo clásico conocido — el algoritmo de Shor factoriza números grandes eficientemente, y el algoritmo de Grover busca en una lista desordenada de forma cuadráticamente más rápida que cualquier búsqueda clásica.',
    errorCorrectionTitle: 'Corrección de Errores Cuánticos',
    errorCorrectionBody: 'Un conjunto de técnicas para proteger la frágil información cuántica de la decoherencia y el ruido, distribuyendo el estado de un único qubit lógico de forma redundante entre muchos qubits físicos, sin medir nunca directamente — y por tanto colapsar — la propia información. Uno de los principales retos de ingeniería que separan a los ordenadores cuánticos ruidosos de hoy de máquinas fiables a gran escala.',
    supremacyTitle: 'Supremacía / Ventaja Cuántica',
    supremacyBody: 'El hito en el que un ordenador cuántico realiza una tarea específica más rápido de lo que cualquier superordenador clásico podría manejar de forma factible — "supremacía" para una tarea de referencia (posiblemente artificial), "ventaja" para una tarea prácticamente útil. Demuestra que los efectos cuánticos pueden aprovecharse para un poder de cómputo real, no solo simularse en una máquina clásica.',
    teleportationTitle: 'Teletransporte Cuántico',
    teleportationBody: 'Un protocolo para transferir el estado exacto de un qubit desconocido a un qubit distante, usando un par entrelazado compartido más dos bits clásicos de comunicación — sin medir nunca directamente (y por tanto destruir) el estado original. A pesar del nombre, nada viaja más rápido que la luz: el receptor no puede reconstruir el estado hasta que llegan los bits clásicos ordinarios, y el estado del qubit original se destruye inevitablemente en el proceso, de forma consistente con el Teorema de No Clonación.',
    qkdTitle: 'Criptografía Cuántica (QKD)',
    qkdBody: 'La distribución cuántica de claves permite a dos partes acordar una clave secreta compartida con una seguridad garantizada por la física en lugar de por la dificultad computacional — protocolos como BB84 codifican los bits de la clave en estados de qubits de forma que cualquier medición de un espía los perturba inevitablemente, revelando la intrusión. Es un beneficio práctico directo del Teorema de No Clonación: un espía no puede copiar en secreto los qubits para inspeccionarlos sin ser detectado.',
    qftTitle: 'Transformada Cuántica de Fourier (QFT)',
    qftBody: 'El equivalente cuántico de la transformada discreta de Fourier clásica, implementada como un circuito cuántico que se ejecuta exponencialmente más rápido que cualquier equivalente clásico. Es la subrutina clave dentro del algoritmo de Shor — el paso que extrae la periodicidad oculta usada para factorizar números grandes — y aparece en muchos algoritmos cuánticos siempre que hay que extraer un patrón oculto de una superposición.',
    tensorProductTitle: 'Producto Tensorial',
    tensorProductBody: 'Varios qubits se combinan mediante el producto tensorial en lugar de la suma ordinaria. Dos qubits requieren por tanto cuatro amplitudes, tres qubits requieren ocho, y n qubits requieren 2ⁿ, que es el origen del enorme espacio de estados de la computación cuántica.',
    multiQubitStatesTitle: 'Estados de Múltiples Qubits',
    multiQubitStatesBody: 'Un sistema de varios qubits no siempre puede describirse como estados independientes de un solo qubit. Algunos estados se factorizan en qubits separados, mientras que otros se entrelazan y requieren una única descripción conjunta.',
    controlledGatesTitle: 'Puertas Controladas',
    controlledGatesBody: 'Las puertas controladas realizan una operación solo cuando otro qubit tiene un valor particular. La puerta CNOT es el ejemplo más simple y es el bloque de construcción esencial para crear entrelazamiento.',
    swapGateTitle: 'Puerta SWAP',
    swapGateBody: 'La puerta SWAP intercambia los estados cuánticos de dos qubits sin medirlos. Se usa ampliamente para mover información dentro de un procesador cuántico.',
    universalGateSetsTitle: 'Conjuntos Universales de Puertas',
    universalGateSetsBody: 'Una pequeña colección de puertas es suficiente para aproximar cualquier cómputo cuántico con precisión arbitraria. Los ejemplos incluyen {H, T, CNOT} y {Rx, Ry, CNOT}.',
    quantumParallelismTitle: 'Paralelismo Cuántico',
    quantumParallelismBody: 'Debido a que un ordenador cuántico puede preparar una superposición de muchas entradas simultáneamente, una operación actúa sobre todas ellas a la vez. El reto consiste en extraer información útil mediante interferencia en lugar de intentar leer cada resultado.',
    oracleTitle: 'Oráculo',
    oracleBody: 'Muchos algoritmos cuánticos tratan parte de un problema como una función de caja negra llamada oráculo. El algoritmo gana velocidad al consultar el oráculo en superposición cuántica.',
    ancillaQubitsTitle: 'Qubits Auxiliares (Ancilla)',
    ancillaQubitsBody: 'Los qubits auxiliares son qubits ayudantes temporales usados durante los cálculos, la corrección de errores y la aritmética, antes de ser reiniciados o descartados.',
    quantumMeasurementTitle: 'Medición Cuántica',
    quantumMeasurementBody: 'Aunque la medición ya se mencionó antes, la computación cuántica la trata de forma operacional. Medir un qubit convierte información cuántica frágil en un bit clásico ordinario, poniendo fin a la evolución coherente.',
    midCircuitMeasurementTitle: 'Medición a Mitad de Circuito',
    midCircuitMeasurementBody: 'Algunos ordenadores cuánticos permiten mediciones durante el cómputo en lugar de solo al final. Las puertas posteriores pueden depender de estos resultados de medición, permitiendo la corrección de errores y algoritmos adaptativos.',
    classicalFeedforwardTitle: 'Realimentación Clásica (Feedforward)',
    classicalFeedforwardBody: 'Los resultados de medición obtenidos durante un circuito cuántico pueden determinar qué puertas posteriores deben aplicarse, combinando control clásico con evolución cuántica.',
    quantumInfoGroupTitle: 'Teoría de la Información Cuántica',
    quantumInformationTitle: 'Información Cuántica',
    quantumInformationBody: 'La información cuántica es información almacenada en estados cuánticos. A diferencia de la información clásica, puede explotar la superposición y el entrelazamiento, habilitando formas completamente nuevas de computación y comunicación.',
    quantumChannelTitle: 'Canal Cuántico',
    quantumChannelBody: 'Un canal cuántico describe matemáticamente cómo cambia la información cuántica al viajar por el espacio o interactuar con el ruido.',
    fidelityTitle: 'Fidelidad',
    fidelityBody: 'La fidelidad mide cuán similares son dos estados cuánticos. Se usa ampliamente para evaluar el hardware cuántico, las puertas y la corrección de errores.',
    traceDistanceTitle: 'Distancia de Traza',
    traceDistanceBody: 'La distancia de traza cuantifica cuán distinguibles son dos estados cuánticos. Proporciona la probabilidad máxima de diferenciarlos usando cualquier medición posible.',
    entanglementEntropyTitle: 'Entropía de Entrelazamiento',
    entanglementEntropyBody: 'Una medida numérica de cuán fuertemente están entrelazadas distintas partes de un sistema cuántico. Desempeña un papel central en la física de la materia condensada, la teoría cuántica de campos y la gravedad cuántica.',
    stateTomographyTitle: 'Tomografía de Estado Cuántico',
    stateTomographyBody: 'Una técnica para reconstruir un estado cuántico desconocido realizando muchas mediciones en diferentes bases.',
    processTomographyTitle: 'Tomografía de Procesos',
    processTomographyBody: 'En lugar de reconstruir un estado, la tomografía de procesos reconstruye una puerta u operación cuántica desconocida estudiando cómo transforma muchos estados de entrada conocidos.',
    advancedGroupTitle: 'Computación Cuántica Avanzada',
    vqeQaoaTitle: 'Algoritmos Cuánticos Variacionales (VQE y QAOA)',
    vqeQaoaBody: 'Los algoritmos cuánticos variacionales son algoritmos híbridos cuántico-clásicos en los que un ordenador cuántico prepara estados cuánticos parametrizados mientras un ordenador clásico ajusta repetidamente esos parámetros para optimizar un objetivo deseado. Este bucle de retroalimentación iterativo los hace muy adecuados para el hardware cuántico ruidoso actual (dispositivos NISQ).'
      + '<br><br>Los dos ejemplos más conocidos son:'
      + '<ul class="quantum-list">'
      + '<li><b>Variational Quantum Eigensolver (VQE):</b> Diseñado para estimar el estado de menor energía (estado fundamental) de un sistema cuántico. Se usa ampliamente en química cuántica, ciencia de materiales y simulación hamiltoniana para estudiar moléculas y materiales cuánticos.</li>'
      + '<li><b>Quantum Approximate Optimization Algorithm (QAOA):</b> Diseñado para encontrar soluciones aproximadas de alta calidad a problemas difíciles de optimización combinatoria — como enrutamiento, planificación, particionado de grafos y optimización de carteras — alternando operaciones cuánticas específicas del problema con operaciones de mezcla.</li>'
      + '</ul>'
      + 'VQE y QAOA están entre los algoritmos cuánticos más prometedores para los ordenadores cuánticos ruidosos de escala intermedia (NISQ) actuales, porque reducen la profundidad de los circuitos cuánticos a la vez que aprovechan la optimización clásica.',
    nisqTitle: 'Computación NISQ',
    nisqBody: 'La era actual de los ordenadores cuánticos se llama la era NISQ (Noisy Intermediate-Scale Quantum, cuántica ruidosa de escala intermedia): los dispositivos contienen desde decenas hasta miles de qubits imperfectos, pero todavía no pueden ejecutar algoritmos plenamente tolerantes a fallos.',
    faultTolerantTitle: 'Computación Cuántica Tolerante a Fallos',
    faultTolerantBody: 'Una futura generación de ordenadores cuánticos capaces de realizar cómputos de duración arbitraria a pesar de los errores de hardware, mediante la corrección de errores cuánticos.',
    surfaceCodeTitle: 'Código de Superficie',
    surfaceCodeBody: 'El principal código de corrección de errores cuánticos, que codifica un qubit lógico en muchos qubits físicos dispuestos en una red bidimensional.',
    logicalPhysicalQubitsTitle: 'Qubits Lógicos frente a Qubits Físicos',
    logicalPhysicalQubitsBody: 'Los qubits físicos son los qubits de hardware que sufren ruido. Los qubits lógicos son qubits protegidos y corregidos frente a errores, codificados a través de muchos qubits físicos.',
    magicStatesTitle: 'Estados Mágicos',
    magicStatesBody: 'Ciertas puertas cuánticas no pueden implementarse directamente en muchas arquitecturas tolerantes a fallos. En su lugar, se consumen "estados mágicos" especialmente preparados para realizarlas, lo que convierte a la destilación de estados mágicos en uno de los mayores costes de la computación cuántica a gran escala.',
    hamiltonianSimulationTitle: 'Simulación Hamiltoniana',
    hamiltonianSimulationBody: 'Una de las motivaciones originales de la computación cuántica: simular eficientemente la dinámica de moléculas, materiales y teorías cuánticas de campos gobernadas por un hamiltoniano. Muchos investigadores — incluidos quienes trabajan en teorías de gauge en el retículo y química cuántica — consideran esto una de las aplicaciones a largo plazo más importantes de los ordenadores cuánticos.',
    qpeTitle: 'Estimación de Fase Cuántica (QPE)',
    qpeBody: 'Un algoritmo cuántico fundamental para estimar los valores propios de operadores unitarios. Sustenta el algoritmo de Shor y muchos algoritmos de química cuántica y simulación hamiltoniana.',
    adiabaticQCTitle: 'Computación Cuántica Adiabática',
    adiabaticQCBody: 'Un modelo de cómputo en el que el sistema permanece en su estado fundamental mientras su hamiltoniano cambia lentamente. Si la evolución es suficientemente lenta, el estado fundamental final codifica la solución de un problema de optimización.',
    mbqcTitle: 'Computación Cuántica Basada en Medición',
    mbqcBody: 'En lugar de computar principalmente con puertas, el cómputo procede preparando un gran estado de recurso entrelazado (un estado de clúster) y luego realizando mediciones cuidadosamente elegidas. Las propias mediciones son las que impulsan el cómputo.'
  },
  measure: {
    title: 'Medición',
    subtitle: 'Las barras de abajo son probabilidades, no una vista previa — medir obliga al qubit a responder a una pregunta que genuinamente tenía sin decidir, y no hay vuelta atrás',
    quantumState: 'Estado Cuántico',
    measureButton: 'MEDIR',
    postulateTitle: 'El Postulado de la Medición',
    postulateBody1: 'Esto no es solo una simplificación de la aplicación — es uno de los axiomas de la mecánica cuántica. Medir un qubit |ψ⟩ = α|0⟩ + β|1⟩ da 0 con probabilidad |α|² y 1 con probabilidad |β|² (la regla de Born), e inmediatamente después el estado colapsa al resultado obtenido — la otra posibilidad simplemente desaparece, no solo queda oculta.',
    postulateFormula: 'P(0) = |α|²&nbsp;&nbsp;&nbsp; P(1) = |β|²&nbsp;&nbsp;&nbsp; α|0⟩ + β|1⟩ → |0⟩ o |1⟩',
    postulateBody2: 'Nota lo que falta: nada en esta regla dice qué resultado obtendrás en una sola ejecución — solo las probabilidades a lo largo de muchos qubits idénticos, que es exactamente para lo que sirve el histograma de abajo.',
    measurementStatistics: 'Estadísticas de Medición',
    confirmOddsBody: 'Esta es la única forma de confirmar realmente esas probabilidades — hacer la misma pregunta a muchos qubits idénticos y observar cómo el histograma se asienta en la distribución prevista. Un solo qubit siempre te da una única respuesta; el patrón solo aparece en una multitud.'
  },
  entangle: {
    title: 'Entrelazamiento Cuántico',
    subtitle: 'Estado de Bell (|00⟩ + |11⟩)/√2 — ningún qubit tiene un estado definido por separado; medir uno determina instantáneamente el otro',
    bannerAlt: 'Ilustración de la analogía de la moneda para el entrelazamiento cuántico: dos personas lanzan cada una una moneda en detectores separados, conectados por una esfera luminosa de conos de correlación — sea cual sea el resultado de la Moneda A, la Moneda B cae instantáneamente al lado opuesto, con el estado indeterminado hasta que se mide.',
    jointStateLabel: 'estado conjunto de ambos qubits',
    explainerTitle: '¿Qué Es el Entrelazamiento Cuántico?',
    explainerBody1: 'El entrelazamiento cuántico es un fenómeno en el que dos o más partículas quedan vinculadas de forma que sus estados cuánticos ya no pueden describirse independientemente el uno del otro — incluso cuando las partículas están separadas por enormes distancias. En lugar de dos qubits separados, cada uno con su propio estado, el par comparte un único estado conjunto, como el estado de Bell (|00⟩ + |11⟩)/√2 mostrado arriba: una mezcla 50/50 de "ambos medidos en 0" y "ambos medidos en 1", sin ninguna forma de descomponerlo en lo que hace el qubit A o el qubit B por separado.',
    explainerBody2: 'El entrelazamiento no lo produce ninguna fuerza misteriosa que conecte las partículas — se crea localmente, en el momento en que dos qubits interactúan (aquí, con una puerta Hadamard seguida de una CNOT — construye la misma receta puerta por puerta en la pestaña Circuitos), y persiste después sin importar la distancia que los qubits recorran más tarde. Einstein llamó célebremente a las correlaciones resultantes "acción fantasmal a distancia", ya que medir un qubit parece afectar instantáneamente al otro.',
    explainerBody3: 'Las dos tarjetas de abajo desarrollan los detalles detrás de esa intuición: por qué un estado así realmente no puede describirse como dos qubits separados, y por qué la correlación instantánea sigue sin poder usarse para enviar una señal más rápida que la luz.',
    mapCaption: 'Dos ubicaciones distintas, arbitrariamente alejadas — la correlación se mantiene sin importar la distancia entre ellas.',
    entangledLabel: 'Entrelazado',
    measureBoth: 'Medir Ambos',
    measureAOnly: 'Medir Solo A',
    tensorTitle: '¿Por Qué Esto No Son Solo Dos Qubits? (Productos Tensoriales)',
    tensorBody1: 'Dos qubits independientes siempre se combinan mediante el <span class="key-term">producto tensorial</span> (⊗): se apila el vector de 2 entradas del qubit A junto al del qubit B, multiplicando cada par de entradas para formar un vector conjunto de 4 entradas. Todo estado producto — cualquiera que puedas construir en el panel Dos Qubits de la pestaña Bits y Qubits — se factoriza de nuevo en dos qubits separados de esta forma:',
    tensorFormula1: '|0⟩⊗|0⟩ = [1,0]<sup>T</sup>⊗[1,0]<sup>T</sup> = [1,0,0,0]<sup>T</sup> = |00⟩',
    tensorBody2: 'El estado de Bell de arriba es también un vector de 4 entradas — [1,0,0,1]<sup>T</sup>/√2 — pero intenta factorizarlo de vuelta como [a,b]<sup>T</sup>⊗[c,d]<sup>T</sup> = [ac,ad,bc,bd]<sup>T</sup> y no hay solución: <em>ad</em> = 0 y <em>bc</em> = 0 obligan a que uno de cada par sea cero, lo que también anularía <em>ac</em> o <em>bd</em> — ningún par de estados de un solo qubit A y B se multiplica para reproducirlo.',
    tensorFormula2: '(|00⟩ + |11⟩) / √2 = [1, 0, 0, 1]ᵀ/√2 ≠ [a,b]ᵀ ⊗ [c,d]ᵀ para cualesquiera a, b, c, d',
    tensorBody3: 'Esa es la definición literal y comprobable del entrelazamiento: un estado conjunto que no puede separarse de nuevo en dos factores independientes de un solo qubit. Ninguno de los dos qubits tiene por separado un estado bien definido — solo lo tiene el par.',
    relativityTitle: 'Por Qué Esto No Viola la Relatividad',
    relativityBody1: 'Este montaje es una versión del experimento mental de Einstein-Podolsky-Rosen (EPR): Alice mide el Qubit A y conoce instantáneamente el resultado del Qubit B, incluso si B está a años luz de distancia. Parece una señal más rápida que la luz — pero no lo es.',
    relativityBody2: 'Alice no puede elegir qué resultado obtiene — sigue siendo aleatorio, con las mismas probabilidades de 50/50 que cualquier qubit individual. Así que no hay nada que ella pueda controlar, y por lo tanto nada que pueda codificar en un mensaje. La correlación solo es visible después del hecho, una vez que Alice y Bob comparan sus notas a través de un canal ordinario (más lento que la luz). En el momento de la medición, ninguna energía, información ni señal cruza realmente la distancia entre ellos.',
    cernTitle: 'Por Qué a CERN Le Importa el Entrelazamiento',
    cernBody1: 'Esto no es solo un ejemplo didáctico. Los físicos del LHC han medido entrelazamiento cuántico genuino directamente en las partículas producidas por colisiones protón-protón — sobre todo entre un quark top y su antiquark, creados y desintegrados en una fracción de billonésima de billonésima de segundo. La misma matemática de estado de Bell de esta página, (|00⟩ + |11⟩)/√2, describe una correlación real y medida en el entorno de mayor energía que la humanidad ha construido jamás.',
    cernBody2: 'La Iniciativa de Tecnología Cuántica de CERN trata el entrelazamiento y la superposición como recursos de ingeniería, no solo curiosidades: computadoras cuánticas para simular las teorías cuánticas de campos detrás de la propia física de partículas — un problema que escala mal en computadoras clásicas — y sensores cuánticos construidos con estados entrelazados o comprimidos, dirigidos al tipo de mediciones de precisión extrema de las que dependen las búsquedas de materia oscura y otra física nueva.'
  },
  bellstates: {
    title: 'Estados de Bell',
    subtitle: 'Los cuatro estados de dos qubits máximamente entrelazados — elige uno para ver cómo se construye, cómo se clasifica y qué predice exactamente',
    pickTitle: 'Elige un Estado de Bell',
    circuitTitle: 'Diagrama del Circuito',
    recipe: {
      phiplus: 'Empieza en |00⟩, aplica H al qubit A, luego CNOT (A → B).',
      phiminus: 'Empieza en |00⟩, aplica X al qubit A, luego H al qubit A, luego CNOT (A → B).',
      psiplus: 'Empieza en |00⟩, aplica X al qubit B, luego H al qubit A, luego CNOT (A → B).',
      psiminus: 'Empieza en |00⟩, aplica X a ambos qubits, luego H al qubit A, luego CNOT (A → B).'
    },
    familyTitle: 'La Familia de Bell',
    familyBody: 'Cada estado de Bell ocupa una de cuatro esquinas, determinada por dos elecciones independientes: la fila (resultados de medición iguales u opuestos) y la columna (una fase relativa + o −). Haz clic en cualquier esquina para prepararla.',
    plusPhase: 'fase +',
    minusPhase: 'fase −',
    sameRow: 'Iguales',
    oppositeRow: 'Opuestos',
    distributionTitle: 'Distribución de Probabilidad',
    distributionNote: 'Probabilidades exactas de la regla de Born para {symbol} — no hace falta muestrear, se obtienen directamente al elevar al cuadrado cada amplitud.',
    definitionsTitle: 'Los Cuatro Estados de Bell',
    definitionsBody: 'Los cuatro se construyen desde el mismo punto de partida |00⟩ con la misma receta de dos puertas — una Hadamard en el qubit A, luego una CNOT controlada por él — precedida simplemente de una puerta X en el qubit o qubits que haya que invertir primero:'
      + '<ul class="quantum-list">'
      + '<li><b>Φ⁺ = (|00⟩ + |11⟩)/√2</b> — sin puertas X. Los resultados siempre coinciden.</li>'
      + '<li><b>Φ⁻ = (|00⟩ − |11⟩)/√2</b> — puerta X en el qubit A primero. Los resultados siempre coinciden.</li>'
      + '<li><b>Ψ⁺ = (|01⟩ + |10⟩)/√2</b> — puerta X en el qubit B primero. Los resultados siempre son opuestos.</li>'
      + '<li><b>Ψ⁻ = (|01⟩ − |10⟩)/√2</b> — puerta X en ambos qubits primero. Los resultados siempre son opuestos.</li>'
      + '</ul>'
      + 'Juntos forman una base ortonormal completa para dos qubits — el recurso central detrás de la teleportación cuántica y la codificación superdensa.',
    phaseNoteTitle: '¿Por Qué No Se Nota el Signo Menos?',
    phaseNoteBody: 'Φ⁺ y Φ⁻ (y del mismo modo Ψ⁺ y Ψ⁻) dan distribuciones de probabilidad idénticas arriba, porque una fase relativa — el signo − — no cambia ninguna probabilidad en la base computacional; solo importa |amplitud|². Los dos estados siguen siendo físicamente distintos: la fase se vuelve visible en el momento en que se hace interferir a los qubits entre sí, por ejemplo aplicando una puerta Hadamard a cada uno antes de medir — ese es exactamente el paso adicional en el que se apoyan las pruebas de las desigualdades de Bell y la codificación superdensa para distinguir los cuatro estados.'
  },
  tunnel: {
    title: 'Efecto Túnel Cuántico',
    subtitle: 'Dispara un paquete de ondas contra una pared más alta que su propia energía. Clásicamente siempre rebota. Cuánticamente, una parte logra atravesarla de todos modos',
    reflected: 'Reflejado',
    transmitted: 'Transmitido',
    barrier: 'Barrera',
    fireAgain: '↻ Disparar de nuevo',
    runHistory: 'Historial de disparos',
    clearHistory: 'Borrar',
    historyEmpty: 'Aún no hay disparos completados.',
    historyCount: '· {count} disparos',
    validationNote: 'Solucionador validado automáticamente: la probabilidad se conserva a <0.3% durante una ejecución completa; la transmisión cae correctamente de >10% en V₀=E a <2% en V₀=2.5E.'
  },
  interference: {
    title: 'Interferencia de Ondas',
    subtitle: 'Dos caminos abiertos y una pantalla que lleva la cuenta. Cada punto de la derecha es una partícula que llega — y sin embargo juntos dibujan una onda',
    screen: 'Pantalla',
    setup: 'Configuración',
    doubleSlit: 'Doble rendija',
    singleSlit: 'Rendija simple',
    whichPath: 'Cuál camino',
    wave: 'Onda',
    clearAccumulation: 'Borrar acumulación',
    physicsInDetail: 'La Física, En Detalle',
    body1: 'Cada punto en la pantalla es una partícula que llega a un solo lugar — esa parte es completamente normal. Lo que no es normal es <em>dónde</em> se les permite llegar a esos puntos. Dispara partículas contra la doble rendija de una en una, sin que dos partículas puedan encontrarse nunca a mitad de vuelo, y los puntos igualmente se acumulan formando franjas. No hay una multitud de partículas interfiriendo entre sí — la propia función de onda de cada partícula individual pasa por <em>ambas</em> rendijas a la vez e interfiere consigo misma. Ese es el verdadero misterio aquí, no solo "las ondas forman patrones."',
    formula: 'I(y) = |A<sub>1</sub>(y) + A<sub>2</sub>(y)|² = |A<sub>1</sub>|² + |A<sub>2</sub>|² + 2|A<sub>1</sub>||A<sub>2</sub>|cos φ(y)',
    body2: 'A<sub>1</sub> y A<sub>2</sub> son las amplitudes de "la partícula pasó por la rendija 1" y "por la rendija 2", y φ(y) es la distancia extra que recorre un camino para llegar al punto y, convertida en fase. Las probabilidades clásicas simplemente se sumarían: P = P<sub>1</sub> + P<sub>2</sub>, un montón plano sin franjas. Las amplitudes cuánticas se suman primero y se elevan al cuadrado después — y elevar una suma al cuadrado produce ese término cruzado <strong>2|A<sub>1</sub>||A<sub>2</sub>|cos φ</strong>, que es positivo en algunos valores de y (franjas brillantes), negativo en otros (franjas oscuras), y es la razón entera por la que existen las franjas.',
    body3: '<strong>Doble rendija</strong> — ambos caminos permanecen abiertos y son genuinamente indistinguibles, así que el término cruzado sobrevive y obtienes franjas. <strong>Rendija simple</strong> — solo existe una amplitud, así que no hay nada con qué interferir; I = |A<sub>1</sub>|², una simple mancha de difracción. <strong>Cuál camino</strong> — ambas rendijas siguen físicamente abiertas, pero etiquetar el camino de cada partícula (los pequeños puntos detectores en la placa) hace que exista una medición de cuál camino para cada impacto. Promediado sobre esas mediciones, el término cruzado se cancela exactamente, dejando el I = |A<sub>1</sub>|² + |A<sub>2</sub>|² plano que esperarías de partículas ordinarias — dos protuberancias, sin franjas. No hace falta perturbar físicamente la partícula para que esto ocurra; basta con que el camino sea <em>conocible en principio</em> para borrar el patrón.',
    body4: 'Por eso la animación de ondulaciones a la izquierda y la pantalla punto a punto a la derecha se muestran una junto a la otra: las ondulaciones son la imagen de onda continua que predice dónde el término cruzado es constructivo o destructivo, y la pantalla es lo que realmente se mide — un clic aleatorio y de todo-o-nada a la vez. La onda nunca llega a ningún sitio; solo lo hace la partícula. Las franjas son la huella de la onda en dónde a las partículas se les permitió hacer clic y dónde no.'
  },
  beamsplitter: {
    title: 'Divisor de Haz',
    subtitle: 'Un solo fotón incide en un divisor de haz 50/50 y es reflejado al detector A o transmitido al detector B de forma aleatoria — un fotón, un resultado aleatorio, nunca un fotón partido por la mitad',
    svgAlt: 'Diagrama de una fuente de fotones disparando contra un divisor de haz 50/50, reflejado hacia arriba al detector A o transmitido hacia la derecha al detector B. Un duplicado tenue aparece brevemente en el camino no elegido, ilustrando la superposición que existía antes de que el fotón fuera detectado.',
    photonSource: 'Fuente de fotones',
    reflected: 'reflejado',
    transmitted: 'transmitido',
    beamSplitterLabel: 'Divisor de haz',
    detectorA: 'Detector de fotones A',
    detectorB: 'Detector de fotones B',
    firePhoton: 'Disparar fotón',
    detectorTally: 'Conteo de Detectores'
  },
  sterngerlach: {
    title: 'Experimento de Stern–Gerlach',
    subtitle: 'Envía átomos uno a uno a través de un campo magnético y observa cómo el espín — una propiedad puramente cuántica — se revela como un pequeño número de puntos discretos, nunca una mancha continua',
    definitionTitle: '¿Qué Es el Espín?',
    definitionBody1: 'El espín es una forma intrínseca de momento angular que porta cada partícula elemental y átomo — no una rotación física literal, sino una propiedad genuina y permanente presente incluso en una partícula sin ninguna estructura interna que pueda girar. Está cuantizado: una medición del espín a lo largo de cualquier eje elegido solo puede devolver uno de un conjunto pequeño y fijo de valores discretos, nunca uno continuamente variable. Para una partícula de espín ½, como el electrón desapareado responsable del momento magnético de un átomo de plata, esa medición tiene exactamente dos resultados posibles — llamados convencionalmente "arriba" y "abajo" a lo largo del eje medido — con la probabilidad de cada uno fijada por el estado cuántico del átomo mediante la regla de Born, la misma regla que gobierna cada resultado de medición en el resto de esta aplicación.',
    definitionBody2: 'El experimento de Stern–Gerlach (1922) fue la primera observación directa de esta cuantización: un haz de átomos de plata enviado a través de un campo magnético con un fuerte gradiente espacial se dividió en exactamente dos puntos discretos en una pantalla detectora, en vez de la mancha continua que habría producido un momento magnético clásico orientado arbitrariamente. El aparato interactivo de abajo reproduce esa misma medición, un átomo a la vez.',
    svgAlt: 'Diagrama de átomos de plata entrando en un imán de Stern-Gerlach con un polo sur en forma de filo de cuchillo arriba y un polo norte ancho y curvado abajo, dividiendo el haz hacia un resultado Arriba o Abajo. Los átomos pueden venir directamente de un horno con ángulo de espín de entrada ajustable, o ya premedidos con el eje de este imán seleccionable, para probar si una segunda medición altera un espín que ya era definido.',
    atomSource: 'Horno',
    silverAtomsArrow: 'Átomos de plata',
    collimatingSlits: 'Rendijas colimadoras',
    magnetLabel: 'Campo no homogéneo',
    detectorUp: 'Detector Arriba',
    detectorDown: 'Detector Abajo',
    detectorPlus: 'Detector "+"',
    detectorMinus: 'Detector "−"',
    fireAtom: 'Disparar átomo',
    magnetCountTitle: 'Número de Imanes',
    oneMagnet: '1 imán',
    twoMagnets: '2 imanes (secuencial)',
    inputSpinTitle: 'Ángulo de Espín de Entrada',
    inputSpinBody: 'El mismo θ que en la esfera de Bloch — θ = 0° prepara un espín seguro hacia arriba, θ = 180° seguro hacia abajo, y cualquier valor intermedio es una superposición genuina de ambos.',
    detectorTally: 'Recuento de Detectores',
    whyTwoSpotsTitle: '¿Por Qué Solo Dos Puntos?',
    whyTwoSpotsBody: 'La fuerza de desviación proviene del <em>gradiente</em> del campo, no solo de su intensidad: F<sub>z</sub> ≈ μ<sub>z</sub>·∂B<sub>z</sub>/∂z, donde μ<sub>z</sub> es el momento magnético del átomo a lo largo del eje del campo. Un campo uniforme (∂B<sub>z</sub>/∂z = 0) no ejercería ninguna fuerza neta, sin importar hacia dónde apuntara el momento — por eso exactamente los dos polos de arriba tienen formas diferentes en lugar de ser simplemente imanes potentes: solo un campo genuinamente no homogéneo produce alguna desviación.',
    whyTwoSpotsFormula: 'F<sub>z</sub> ≈ μ<sub>z</sub> (∂B<sub>z</sub> / ∂z) &nbsp;&nbsp;&nbsp; si B es uniforme ⇒ F = 0',
    whyTwoSpotsBody2: 'Clásicamente, μ<sub>z</sub> podría apuntar en cualquier dirección, así que un haz de átomos orientados al azar debería difuminarse continuamente por la pantalla, desde una desviación total hacia arriba hasta una desviación total hacia abajo. Cuando Stern y Gerlach realizaron realmente este experimento en 1922, los átomos de plata aterrizaron en exactamente dos puntos discretos — nada intermedio, sin importar cómo se inclinara el imán. Esa es la misma cuantización ya integrada en cada qubit de esta aplicación: una medición devuelve uno de exactamente dos resultados, nunca un resultado parcial.',
    sequentialTitle: 'Medir Dos Veces: Por Qué Importa el Orden',
    sequentialIntro: 'El átomo de arriba ya tiene un espín definido — es la salida "arriba" de un primer imán (no mostrado), con la mitad "abajo" físicamente bloqueada. Elige el eje de este imán para ver si medirlo de nuevo lo altera.',
    sameAxis: 'Mismo eje (Z)',
    differentAxis: 'Eje diferente (X)',
    preparedLabel: 'preparado: espín ↑ (Z)',
    blockedLabel: '(mitad "abajo" bloqueada)',
    magnet2AxisZ: 'Imán 2 — eje Z',
    magnet2AxisX: 'Imán 2 — eje X',
    resultTravelling: 'en camino…',
    resultUp: 'El detector Arriba hizo clic',
    resultDown: 'El detector Abajo hizo clic',
    explainerUp: 'El detector Arriba hizo clic — uno de exactamente dos resultados posibles, nunca una desviación parcial. Dispara de nuevo y el mismo estado del átomo aún puede caer Abajo; solo las probabilidades son fijas, no un resultado concreto.',
    explainerDown: 'El detector Abajo hizo clic — uno de exactamente dos resultados posibles, nunca una desviación parcial. Dispara de nuevo y el mismo estado del átomo aún puede caer Arriba; solo las probabilidades son fijas, no un resultado concreto.',
    explainerDefault: 'Un átomo está a punto de entrar en el imán. Dispáralo y observa qué detector hace clic.',
    trialCount: '· {count} átomos',
    sequentialExplainerZ: 'Mismo eje que antes — dispara un átomo para confirmar que siempre cae de la misma forma.',
    sequentialExplainerX: 'Un eje diferente esta vez — dispara un átomo para ver qué le pasa a un espín que ya era definido a lo largo de Z.',
    result2Plus: 'El detector "+" hizo clic',
    result2Minus: 'El detector "−" hizo clic',
    explainer2Z: 'Medir el mismo eje dos veces seguidas solo confirma el resultado anterior — nada sorprendente aquí. Dispara tantas veces como quieras: siempre caerá en "+".',
    explainer2X: 'Aunque este átomo tenía un espín perfectamente definido a lo largo de Z, medir un eje diferente e incompatible (X) borró esa información y produjo un resultado nuevo, genuinamente aleatorio. Este es el corazón del descubrimiento de Stern–Gerlach: medir una propiedad puede perturbar otra que no conmuta con ella.'
  },
  teleport: {
    title: 'Teleportación Cuántica',
    subtitle: 'Transferir el estado exacto de un qubit a un segundo qubit, físicamente separado — usando un par entrelazado compartido y dos bits clásicos, sin transportar jamás el propio qubit',
    definitionTitle: '¿Qué Es la Teleportación Cuántica?',
    definitionBody1: 'La teleportación cuántica es un protocolo para transferir el estado exacto de un qubit a un segundo qubit, físicamente separado, usando un par de qubits entrelazados compartido de antemano junto con dos bits de comunicación clásica — sin que el qubit original sea jamás transportado físicamente ni medido directamente. Mueve información cuántica, no materia ni energía, y no puede usarse para enviar una señal más rápida que la luz: recuperar el estado transferido en el extremo receptor requiere que esos dos bits clásicos realmente lleguen, y estos viajan tan rápido como cualquier señal ordinaria, no más.',
    definitionBody2: 'Tampoco crea una copia. El estado del qubit de origen queda necesariamente destruido por la medición que exige el protocolo, de acuerdo con el teorema de no-clonación, que prohíbe que cualquier procedimiento duplique un estado cuántico desconocido dejando intacto el original. En el recorrido de abajo, a las dos partes que intercambian el qubit se les dan las etiquetas convencionales usadas en toda la teoría de la información cuántica — Alice para quien envía, Bob para quien recibe.',
    circuitTitle: 'El Protocolo',
    svgAlt: 'Diagrama de circuito: el qubit de mensaje de Alice y las dos mitades de un par entrelazado. Una puerta Hadamard y una CNOT crean el par entrelazado entre el segundo qubit de Alice y el qubit de Bob. Una CNOT y una Hadamard ponen el qubit de mensaje de Alice y su mitad del par en la base de Bell. Ambos se miden, y los dos resultados clásicos viajan por líneas dobles hacia puertas de corrección Z y X aplicadas condicionalmente sobre el qubit de Bob.',
    finalLabel: 'El qubit de Bob ≡ ψ',
    teleportBtn: 'Teleportar',
    aliceBadge: 'Mensaje de Alice',
    aliceDesc: 'Fija cualquier estado — esto es lo que se teleporta',
    bobBadge: 'Qubit de Bob',
    bobDescWaiting: 'Aún no entrelazado — pulsa Teleportar',
    bobDescEntangled: 'Entrelazado con Alice — indeterminado por sí solo',
    bobDescWrong: 'Ya es definido, pero aún no es ψ — esperando los bits de Alice',
    bobDescMatch: 'Coincide exactamente con el mensaje de Alice',
    bobFormulaUndetermined: '|ψ⟩ = ?',
    classicalBitsTitle: 'Bits Clásicos',
    classicalBitsBody: 'Alice debe enviarle físicamente estos dos bits a Bob — por teléfono, radio, correo postal, cualquier medio clásico. Sin ellos, el qubit de Bob no le sirve de nada aunque ya lo tenga delante.',
    outcomeTally: 'Recuento de Resultados',
    resultRunning: 'en curso…',
    resultDone: 'Teleportación completa',
    stepPair: 'Alice y Bob comparten un par entrelazado, preparado antes de que existiera ningún mensaje.',
    stepBell: 'Alice entrelaza su qubit de mensaje con su mitad del par — esto lee ψ contra el entrelazamiento, no lo copia.',
    stepMeasure: 'Alice mide sus dos qubits, colapsándolos a dos bits clásicos genuinamente aleatorios — y colapsando el qubit de Bob a un estado definido en el mismo instante.',
    stepSend: 'Alice envía sus dos bits clásicos a Bob — un canal ordinario, nunca más rápido que la luz. Él aplica condicionalmente Z y/o X para corregir su qubit.',
    stepDone: 'El qubit de Bob ahora es exactamente igual al mensaje original de Alice — teleportado, no copiado: su propio qubit fue destruido por la medición del paso 2, así que el teorema de no-clonación queda intacto. Alice tampoco llegó a conocer ψ; solo transmitió dos bits aleatorios, m₀={m0}, m₁={m1}, que resultaron ser exactamente lo que Bob necesitaba.',
    explainerDefault: 'Fija arriba el estado del mensaje de Alice y luego pulsa Teleportar. Observa la esfera de Bob: empieza indeterminada, salta a un punto definido pero incorrecto en el instante en que Alice mide, y luego encaja exactamente con la de Alice en cuanto llegan sus bits clásicos y Bob los corrige.',
    trialCount: '· {count} intentos',
    whyNotFtlTitle: 'Por Qué Esto No Es Más Rápido Que la Luz',
    whyNotFtlBody: 'En el instante en que Alice mide sus dos qubits, el qubit de Bob sí se vuelve un estado definido — pero cuál es, es un misterio sin los dos bits clásicos de Alice, y esos solo pueden viajar a la velocidad de la luz o más lento, igual que una llamada telefónica. Hasta que llegan, el qubit de Bob es puro ruido: medirlo antes solo daría un resultado aleatorio de 50/50, sin importar cuál fuera ψ. El entrelazamiento hace posible la teleportación; no la hace instantánea.',
    noCloningTitle: 'No Es una Copia — el Teorema de No-Clonación',
    noCloningBody: 'El qubit de mensaje original de Alice no sobrevive a esto: su medición en la base de Bell del Paso 2 lo colapsa junto con su mitad del par, borrando para siempre lo que fuera ψ de su lado. Esto no es una limitación de este protocolo en particular — el teorema de no-clonación demuestra que <em>ningún</em> procedimiento cuántico puede copiar jamás un estado desconocido dejando intacto el original. La teleportación mueve un estado; nunca duplica uno.'
  },
  superdense: {
    title: 'Codificación Superdensa',
    subtitle: 'Transmitir dos bits clásicos de información enviando físicamente solo un qubit, dado un par entrelazado compartido de antemano',
    definitionTitle: '¿Qué Es la Codificación Superdensa?',
    definitionBody1: 'La codificación superdensa es un protocolo de comunicación cuántica que transmite dos bits clásicos de información enviando físicamente solo un único qubit, siempre que el emisor y el receptor ya compartan una mitad cada uno de un par entrelazado preparado de antemano. Es el recíproco lógico de la teleportación cuántica: la teleportación gasta dos bits clásicos y un par entrelazado compartido para mover 1 qubit de información cuántica, mientras que la codificación superdensa gasta 1 qubit y ese mismo tipo de par compartido para mover dos bits clásicos.',
    definitionBody2: 'No es una trampa a los límites de la comunicación clásica — un qubit físico real todavía tiene que viajar del emisor al receptor para que el protocolo funcione, así que la transmisión sigue limitada por la velocidad ordinaria de la señal. Igual que en la pestaña de Teleportación, a las dos partes de abajo se les dan sus etiquetas convencionales de la teoría de la información cuántica: Alice para quien envía, Bob para quien recibe.',
    circuitTitle: 'El Protocolo',
    svgAlt: 'Diagrama de circuito: el qubit de Alice y el qubit de Bob. Una Hadamard y una CNOT crean un par entrelazado. Alice aplica condicionalmente X y/o Z solo a su propio qubit, codificando dos bits clásicos. Luego envía físicamente ese qubit a Bob por un canal cuántico. Bob, ya con ambos qubits, aplica una CNOT y una Hadamard para decodificar, y luego mide ambos para recuperar los dos bits exactos de Alice.',
    channelLabel: 'canal cuántico',
    finalLabelA: 'd₀',
    finalLabelB: 'd₁',
    sendBtn: 'Enviar',
    messageTitle: 'Mensaje a Enviar',
    messageBody: 'Elige cualquier mensaje de 2 bits — esto es lo que Alice codifica en su único qubit antes de enviárselo a Bob.',
    sentLabel: 'Alice envió',
    receivedLabel: 'Bob decodificó',
    resultRunning: 'en curso…',
    resultMatch: 'Decodificado exactamente bien',
    resultMismatch: 'Discrepancia — revisa la consola, esto nunca debería pasar',
    stepPair: 'Alice y Bob comparten un par entrelazado, preparado de antemano.',
    stepEncode: 'Alice codifica su mensaje únicamente en su propio qubit — la mitad del par de Bob nunca se toca.',
    stepSend: 'Alice envía físicamente ese único qubit a Bob por un canal cuántico real — el único paso sin sustituto clásico.',
    stepDecode: 'Bob, ya con ambos qubits, ejecuta el mismo circuito de base de Bell que usó la Alice de Teleportar — una CNOT y luego una Hadamard — para distinguir los cuatro mensajes posibles.',
    stepMeasure: 'Bob mide ambos qubits y lee los dos bits exactos de Alice.',
    stepDone: 'Bob decodificó {received} — exactamente lo que Alice envió, {sent}. Nada de esto fue aleatorio: los cuatro mensajes posibles caen en cuatro estados mutuamente ortogonales, así que la medición de Bob no tiene ninguna incertidumbre restante una vez que el qubit llega.',
    explainerDefault: 'Elige un mensaje de 2 bits arriba y luego pulsa Enviar. Observa cómo Alice lo codifica solo en su propio qubit, le entrega físicamente ese qubit a Bob, y Bob decodifica ambos bits exactamente — nada de esto es aleatorio.',
    tally: '{sent} enviados · {match}/{sent} decodificados correctamente',
    whyChannelTitle: 'Por Qué Esto Aún Necesita un Canal Cuántico',
    whyChannelBody: 'La teleportación movió el equivalente a un qubit de información usando solo bits clásicos, por lo que no puede superar la velocidad de la luz. La codificación superdensa va en la dirección opuesta — mueve 2 bits clásicos usando solo 1 qubit de comunicación, lo que suena como si superara el límite clásico, pero no es una trampa: un qubit físico real todavía tiene que viajar de Alice a Bob para que esto funcione. El "ahorro" es real (1 qubit en vez de 2 bits clásicos de señal por separado), pero sigue limitado por la velocidad a la que ese qubit puede viajar.',
    compareTitle: 'Teleportación vs. Codificación Superdensa',
    compareBody: 'El mismo recurso — un par entrelazado compartido de antemano — gastado en direcciones opuestas. La teleportación envía 1 qubit de información cuántica usando 2 bits clásicos; la codificación superdensa envía 2 bits clásicos de información usando 1 qubit. Ambas necesitan ese par entrelazado preparado de antemano, y ambas terminan ejecutando esencialmente el mismo circuito de base de Bell (una CNOT y luego una Hadamard) — la teleportación lo ejecuta del lado de quien envía para leer un estado, la codificación superdensa lo ejecuta del lado de quien recibe para leer un mensaje.'
  },
  noise: {
    title: 'Ruido y Decoherencia',
    subtitle: 'La pérdida de coherencia cuántica por interacción no deseada con el entorno — el obstáculo práctico dominante para construir computadoras cuánticas fiables y a gran escala',
    definitionTitle: '¿Qué Es la Decoherencia Cuántica?',
    definitionBody1: 'La decoherencia cuántica es la pérdida de coherencia cuántica: el proceso por el cual la información de fase de un sistema se filtra hacia su entorno mediante una interacción no deseada, de modo que un estado genuinamente en superposición pasa a comportarse, a todos los efectos prácticos, como una mezcla clásica definida. Un sistema perfectamente aislado permanece en un estado puro — uno descrito exactamente por un único vector de estado |ψ⟩ — indefinidamente. Una vez que interactúa con un entorno incontrolado, esa garantía deja de cumplirse: el sistema se entrelaza con los muchos grados de libertad propios del entorno, y trazar todo excepto el sistema mismo deja un estado mixto, descrito por una matriz de densidad ρ en vez de un único vector. Todas las demás pestañas de esta aplicación tratan las puertas y los qubits como perfectamente aislados exactamente en ese primer sentido; esta modela lo que ocurre cuando dejan de estarlo.',
    definitionBody2: 'En la esfera de Bloch ya usada en toda esta aplicación, esa pérdida de pureza aparece como un vector que se encoge — la misma firma ya vista para un qubit entrelazado con otro (ver las esferas de Bloch reducidas de las pestañas Entrelazar y Circuitos), solo que causada aquí por un entorno incontrolado en vez de un segundo qubit deliberado. La decoherencia es el obstáculo práctico dominante para construir computadoras cuánticas fiables y a gran escala: cada puerta de un circuito real tiene que completarse antes de que la coherencia de la que depende se haya filtrado. La simulación de abajo modela dos de sus canales fenomenológicos estándar, T₁ (relajación) y T₂ (desfase), evolucionando en tiempo real el vector de Bloch de un único qubit.',
    qubitBadge: 'Qubit decoherente',
    statsTitle: 'Lectura en Vivo',
    elapsed: 'Tiempo transcurrido',
    vectorLength: 'Longitud del vector de Bloch',
    purity: 'Pureza Tr(ρ²)',
    densityMatrix: 'Matriz de Densidad ρ',
    initialStateTitle: 'Estado Inicial',
    decayTimesTitle: 'Tiempos de Decaimiento',
    t2CapNote: 'T₂ limitado a {eff} μs (2×T₁) — la desfase no puede ser más lenta que la relajación.',
    pauseBtn: '⏸ Pausar',
    playBtn: '▶ Reproducir',
    restartBtn: '↻ Reiniciar',
    explainerDefault: 'Observa cómo el vector de Bloch se encoge y deriva hacia el polo norte — ese encogimiento es pérdida real de información, no solo un efecto visual. Un vector más corto significa que el estado del qubit es genuinamente más incierto, exactamente la misma idea de "estado mixto" ya usada para qubits entrelazados en otras partes de esta aplicación.',
    explainerSettled: 'Se ha asentado en |0⟩ — y la pureza en realidad ha vuelto a subir cerca del 100%, no ha tocado fondo. Eso no es un rescate: la relajación T₁ atrae al qubit hacia su estado fundamental, así que con suficiente tiempo siempre termina puro de nuevo, solo que puro e inútil. Un qubit en |0⟩ se ve idéntico sin importar si empezó como |+⟩, |−⟩ o cualquier otra cosa — la información de fase que T₂ borró por el camino nunca vuelve, haya pureza o no.',
    t1t2Title: 'T₁ vs. T₂ — Dos Formas Distintas de Olvidar',
    t1t2Body: 'T₁ (relajación) es cuánto tarda el qubit en filtrar energía hacia su entorno y asentarse hacia |0⟩ — por eso la componente z del vector de Bloch deriva hacia el polo norte. T₂ (desfase) es cuánto tiempo el qubit mantiene la fase relativa entre |0⟩ y |1⟩ — por eso las componentes x/y, la parte que realmente lleva la información de superposición, se desvanecen. Perder T₂ suele ser el problema práctico mayor: un qubit puede seguir siendo "mayormente" |0⟩ o |1⟩ mucho después de haber perdido todo rastro de estar en una superposición genuina.',
    t1t2Formula: 'T₂ ≤ 2×T₁ &nbsp;&nbsp;&nbsp; (la desfase nunca puede ser más lenta de lo que permite la relajación)',
    whyMattersTitle: 'Por Qué Esta Lucha Nunca Termina en el Hardware Real',
    whyMattersBody: 'Todas las demás simulaciones de esta aplicación ejecutan puertas y mediciones como operaciones matemáticamente perfectas, porque esa es la forma correcta de aprender las ideas primero. Los procesadores cuánticos reales — incluidos los dispositivos superconductores y de iones atrapados con los que experimenta la propia Iniciativa de Tecnología Cuántica de CERN para simulación de física de partículas — solo se mantienen coherentes durante una ventana limitada, medida exactamente en estos números de T₁/T₂, típicamente entre decenas y cientos de microsegundos. Cada puerta de un circuito real tiene que terminar bien dentro de esa ventana, que es la razón completa por la que la corrección de errores cuánticos y el diseño de circuitos consciente del hardware son problemas de ingeniería activos, no resueltos.'
  },
  grover: {
    title: 'Búsqueda de Grover',
    subtitle: 'Encontrar un elemento marcado entre cuatro con una sola consulta, amplificando su amplitud en vez de revisarlos uno por uno',
    definitionTitle: '¿Qué Es la Búsqueda de Grover?',
    definitionBody1: 'El algoritmo de Grover busca en una lista desordenada de N elementos uno marcado usando aproximadamente √N consultas al oráculo, en vez de hasta N que necesita una búsqueda clásica en el peor caso. Funciona por amplificación de amplitud: comienza con todos los elementos en superposición equitativa, usa un oráculo para invertir el signo de la amplitud del elemento marcado, y luego usa un paso fijo de "difusión" para convertir ese cambio de signo invisible en un aumento visible de la probabilidad de medición.',
    definitionBody2: 'Alterna abajo entre dos casos concretos. N = 4 (2 qubits) es el caso más pequeño donde el resultado es exacto: una sola consulta lleva la probabilidad del elemento marcado exactamente a 1. N = 8 (3 qubits) es el caso más pequeño donde visiblemente no lo es: hacen falta dos consultas para alcanzar un máximo de solo alrededor del 94,5%, y — prueba de que esto no es solo "faltan consultas" — una tercera consulta se pasaría de ese máximo en vez de mejorarlo.',
    targetTitle: 'Elemento a Buscar',
    targetBody: 'Elige qué elemento está "marcado" — esto es lo que el oráculo reconoce, y lo que la búsqueda de abajo debería encontrar.',
    targetLabel: 'Elemento marcado',
    foundLabel: 'Encontrado',
    circuitTitle: 'El Circuito',
    oracleGateLabel: 'Oráculo',
    diffuserGateLabel: 'Difusor',
    oracleMarks: 'marca {t}',
    repeatBracketLabel: 'repetir ×2',
    iterationBadge: 'Iteración {iter} de {total}',
    modeN4Btn: 'N = 4 (exacto)',
    modeN8Btn: 'N = 8 (2 iteraciones)',
    modeN4Desc: '2 qubits, 1 elemento marcado — una sola consulta es exacta.',
    modeN8Desc: '3 qubits, 1 elemento marcado — necesita 2 consultas, y aun así no llega al 100%.',
    chartTitle: 'Amplitudes a lo Largo de la Búsqueda',
    searchBtn: 'Buscar',
    resultRunning: 'en curso…',
    resultMatch: 'Encontrado en la primera consulta',
    resultMismatch: 'Fallo — revisa la consola, esto nunca debería pasar para N=4',
    resultMatchN8: 'Encontrado tras 2 consultas',
    resultMismatchN8: 'Fallo esta vez — algo genuinamente posible alrededor de 1 de cada 20 veces para N=8, no es un error',
    stepStart: 'Toda búsqueda empieza en un estado definido y poco interesante — todo ceros, igual que un registro clásico antes de mirar nada.',
    stepSuperpose: 'Una Hadamard en cada qubit reparte la amplitud por igual entre los {n} elementos a la vez — cada candidato está "activo" simultáneamente, no revisado uno por uno.',
    stepOracle: 'El oráculo reconoce el elemento marcado e invierte el signo de su amplitud únicamente. Mira con atención: ninguna barra se movió — una probabilidad es el tamaño al cuadrado de una amplitud, y una amplitud negativa da exactamente la misma probabilidad al elevarla al cuadrado que una positiva del mismo tamaño. Este paso es completamente invisible para cualquier medición tomada ahora mismo.',
    stepDiffuse: 'La difusión refleja cada amplitud respecto a su promedio compartido. Las demás amplitudes, ya cercanas a ese promedio, colapsan hacia cero; la marcada, al otro lado tras invertirse su signo, sale disparada más allá del promedio por el doble de la distancia — convirtiendo ese cambio de fase invisible en una respuesta visible.',
    stepDiffuseIteration: 'La difusión refleja cada amplitud respecto a su promedio compartido, la misma regla de siempre. Iteración {iter} de {total} completa: la probabilidad del elemento marcado ahora es {pct}%.',
    overshootNote: 'Ese es el máximo para N=8 — una tercera iteración se pasaría de ese máximo, bajando la probabilidad de nuevo a cerca del 33%, no subiéndola.',
    stepMeasure: 'Una consulta, una medición, listo: {found} — para {n} elementos con 1 marcado, exactamente una iteración de Grover lleva la probabilidad del elemento marcado a 1, una medición real sobre una distribución sin ninguna incertidumbre real restante.',
    stepMeasureApprox: '2 consultas, una medición, listo: {found} — para 8 elementos con 1 marcado, 2 iteraciones de Grover llevan la probabilidad del elemento marcado a cerca del 94,5%, no exactamente a 1 esta vez; medido así, sigue siendo una extracción real según la regla de Born, solo que con una posibilidad genuina de fallar.',
    explainerDefault: 'Elige un elemento a la izquierda y luego pulsa Buscar. Observa las barras de amplitud en cada paso — el oráculo cambia un signo que nada aquí puede ver, y la difusión es lo que convierte ese cambio invisible en una respuesta visible.',
    tally: '{n} búsquedas · {found}/{n} encontrados en la primera consulta',
    tallyN8: '{n} búsquedas · {found}/{n} encontrados tras 2 consultas',
    whyFasterTitle: 'Por Qué Una Sola Consulta Es Realmente Más Rápida',
    whyFasterBody: 'Clásicamente, encontrar un elemento marcado entre 4 revisándolos uno por uno toma hasta 3 consultas reales en el peor caso — si los primeros 3 que revisas no son el elemento, solo sabes que el 4.º es la respuesta por eliminación, pero igual necesitaste esas 3 consultas reales para llegar ahí. El algoritmo de Grover necesita exactamente 1 llamada al oráculo para este mismo caso N = 4. La brecha se agranda, no se achica, a medida que crece la lista: para N elementos, la búsqueda clásica necesita del orden de N consultas en el peor caso, mientras que el algoritmo de Grover solo necesita del orden de √N — la misma aceleración cuadrática ya descrita en la propia sección de Algoritmos de esta aplicación.',
    whyFasterBodyN8: 'El modo N = 8 de arriba es cómo se ve realmente ese patrón general: 2 consultas en vez de hasta 7, una ventaja cuadrática real — pero el algoritmo de Grover no promete certeza en general, solo esa ventaja. Su propia probabilidad alcanza un máximo de alrededor del 94,5% y bajaría si se sigue empujando; N = 4 es el caso especial y más pequeño donde 1 consulta cae exactamente en ese máximo en vez de solo cerca de él.'
  },
  // Refleja ROADMAP_LESSONS en js/roadmap.js exactamente (mismos ids,
  // mismo contenido de title/body) — ese archivo mantiene sus propias
  // copias en inglés como respaldo de la búsqueda t() (ver
  // buildLessonInfoHTML()), así que ambos solo necesitan coincidir en
  // esta extracción inicial, no mantenerse sincronizados a mano después.
  lessons: {
    qubit: {
      title: 'Bits',
      body: 'Un bit clásico siempre es, de forma definitiva, 0 o 1. Un qubit puede estar en una superposición de ambos a la vez, descrita por dos amplitudes en lugar de un único valor. La esfera de Bloch le da a cada posible estado de un qubit un punto en su superficie.'
    },
    'maths-complex': {
      title: 'Números Complejos',
      body: 'Las amplitudes de un qubit son números complejos, no solo reales — cada una tiene una parte real y una imaginaria, z = a + bi. Solo el módulo al cuadrado |z|² es directamente observable como probabilidad; la fase es invisible en una sola medición, pero es exactamente lo que impulsa la interferencia.'
    },
    'maths-vectors': {
      title: 'Vectores',
      body: 'El estado de un qubit es un vector columna [α, β] en un espacio vectorial complejo 2D, con |0⟩ y |1⟩ como base. La normalización |α|² + |β|² = 1 mantiene la probabilidad total en el 100%, y el producto interno mide cuánto se superponen dos estados.'
    },
    'maths-matrices': {
      title: 'Matrices',
      body: 'Cada puerta cuántica es una matriz unitaria (U†U = I) que actúa sobre el vector de estado mediante multiplicación matricial. La unitariedad garantiza que una puerta nunca destruye ni crea probabilidad — que es exactamente la razón por la que toda puerta cuántica es reversible.'
    },
    'maths-statevector': {
      title: 'Vector de Estado',
      body: 'El vector de estado |ψ⟩ = α|0⟩ + β|1⟩ es la descripción completa de un qubit. En forma de esfera de Bloch, |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩ — θ y φ son exactamente los dos deslizadores de la esfera de Bloch en Bits y Qubits.'
    },
    'maths-dirac': {
      title: 'Notación de Dirac',
      body: 'La notación bra-ket de Dirac es una abreviatura para los vectores y sus productos internos: |ψ⟩ es un ket, ⟨ψ| su bra, y ⟨φ|ψ⟩ su producto interno. |0⟩ y |1⟩ son ortonormales — ⟨0|1⟩ = 0, ⟨0|0⟩ = ⟨1|1⟩ = 1.'
    },
    'maths-tensor': {
      title: 'Productos Tensoriales',
      body: 'Dos vectores independientes se combinan mediante el producto tensorial (⊗) en un único vector conjunto más grande — se apila cada entrada del primero contra cada entrada del segundo, multiplicando cada par. Dos qubits se combinan así en un estado conjunto de 4 entradas; no todo estado conjunto puede separarse de nuevo, y los que no pueden son precisamente los entrelazados.'
    },
    gates: {
      title: 'Puertas Cuánticas',
      body: 'Las puertas son las operaciones que mueven un qubit por la esfera de Bloch — rotaciones reversibles en lugar de la lógica destructiva de las puertas clásicas. Cada una (H, X, Y, Z, S, T) tiene un efecto geométrico preciso que puedes observar en acción.'
    },
    circuit: {
      title: 'Circuitos',
      body: 'Un circuito es una secuencia de puertas aplicadas de izquierda a derecha. En un circuito clásico, las puertas lógicas como AND/OR/XOR combinan bits siguiendo reglas estrictas — la misma entrada siempre da la misma salida. En un circuito cuántico, el orden importa de una manera más profunda: ejecutar las mismas puertas en una secuencia distinta puede dejar al qubit en un estado completamente diferente, igual que los giros en una ruta. Cambia a 2 o 3 Qubits y añade una CNOT para construir estados entrelazados — pares de Bell y estados GHZ — puerta a puerta, las mismas recetas que hay detrás de la pestaña Entrelazar.'
    },
    measure: {
      title: 'Medición',
      body: 'Medir un qubit lo obliga a decidirse por un resultado definido, 0 o 1, con probabilidades fijadas por sus amplitudes justo antes de la medición. Esto es el colapso de la superposición — irreversible y probabilístico, no un valor preexistente oculto.'
    },
    entangle: {
      title: 'Entrelazamiento',
      body: 'Dos qubits pueden vincularse de modo que medir uno determine instantáneamente el resultado del otro, sin importar la distancia que los separe. Esta correlación es más fuerte que cualquier cosa posible entre bits clásicos.'
    },
    bellstates: {
      title: 'Estados de Bell',
      body: 'Los cuatro estados de Bell — Φ⁺, Φ⁻, Ψ⁺ y Ψ⁻ — son los estados de dos qubits máximamente entrelazados, todos construidos con la misma receta Hadamard-y-luego-CNOT partiendo de un estado base distinto de entre los cuatro. Φ⁺/Φ⁻ siempre dan resultados coincidentes al medir, Ψ⁺/Ψ⁻ siempre resultados opuestos — la fase relativa detrás de cada signo ± es invisible a una medición directa, y solo aparece una vez que los qubits se hacen interferir entre sí.'
    },
    tunnel: {
      title: 'Efecto Túnel Cuántico',
      body: 'Un paquete de ondas cuántico tiene una probabilidad distinta de cero de aparecer al otro lado de una barrera que clásicamente no debería poder cruzar, porque su nube de probabilidad se extiende a través de la barrera en lugar de detenerse en ella.'
    },
    interference: {
      title: 'Interferencia',
      body: 'Cuando dos caminos hacia el mismo resultado son indistinguibles, sus amplitudes de probabilidad se combinan y pueden reforzarse o cancelarse — produciendo franjas en una pantalla en lugar de dos simples montones. Marcar qué camino se tomó destruye el patrón.'
    },
    beamsplitter: {
      title: 'Divisor de Haz',
      body: 'Un divisor de haz 50/50 envía un solo fotón por uno de dos caminos con igual probabilidad — reflejado hacia un detector o transmitido hacia el otro. El fotón no está secretamente dividido entre ambos caminos; solo un detector hace clic por cada fotón, y cuál de ellos es genuinamente aleatorio cada vez.'
    },
    sterngerlach: {
      title: 'Experimento de Stern–Gerlach',
      body: 'Un haz de átomos de plata que atraviesa un campo magnético no homogéneo se divide en exactamente dos puntos discretos, nunca una mancha continua — evidencia directa de que el espín está cuantizado, con solo dos resultados posibles a lo largo de cualquier eje de medición, exactamente igual que los propios resultados de medición |0⟩/|1⟩ de un qubit.'
    },
    teleport: {
      title: 'Teleportación Cuántica',
      body: 'Alice puede enviarle a Bob el estado exacto de un qubit sin enviar jamás el qubit en sí — usando un par entrelazado compartido de antemano y dos bits clásicos. Su propio qubit queda destruido por la medición que esto requiere, así que nunca existe una copia en ambos extremos a la vez, tal como exige el teorema de no-clonación.'
    },
    superdense: {
      title: 'Codificación Superdensa',
      body: 'La imagen especular de la teleportación: Alice le envía a Bob dos bits clásicos usando solo un qubit, codificando su mensaje en su mitad de un par entrelazado compartido de antemano y enviándole físicamente a Bob ese único qubit. Bob decodifica ambos bits exactamente, siempre — nada en este protocolo es probabilístico.'
    },
    noise: {
      title: 'Ruido y Decoherencia',
      body: 'Los qubits reales no están perfectamente aislados: la relajación T₁ les permite filtrar energía hacia |0⟩, y el desfase T₂ borra la fase relativa que hace significativa una superposición. Ambos encogen el vector de Bloch hacia el centro — la misma firma de "estado mixto" que ya se ve al trazar un qubit entrelazado, solo que causada por un entorno incontrolado en vez de una medición deliberada.'
    },
    grover: {
      title: 'Búsqueda de Grover',
      body: 'El algoritmo de Grover encuentra un elemento marcado entre N mediante amplificación de amplitud en vez de revisarlos uno por uno: un oráculo invierte el signo de la amplitud del elemento marcado (invisible para cualquier medición, ya que la probabilidad solo depende del tamaño de la amplitud), y luego un paso fijo de "difusión" convierte ese cambio invisible en un aumento visible. Para N=4 con un elemento marcado, una sola consulta lleva su probabilidad de medición exactamente a 1 — una aceleración cuadrática real sobre lo mejor que puede lograr cualquier búsqueda clásica.'
    }
  },
  // Refleja ROADMAP_QUIZ en js/roadmap.js exactamente — mismos lessonIds
  // que las claves de `lessons` de arriba, mismo contenido de
  // q/options/explanation.
  quiz: {
    qubit: {
      q: 'Un bit clásico y un qubit comienzan ambos en un estado definido. ¿Cuál es la diferencia clave entre ellos?',
      options: ['Los qubits pueden mantener una superposición de 0 y 1 a la vez', 'Los qubits son simplemente bits más rápidos', 'Los qubits solo se pueden medir una vez, para siempre', 'No hay ninguna diferencia real'],
      explanation: 'Las amplitudes de un qubit le permiten ser genuinamente una mezcla de ambos estados base hasta que se mide — un bit clásico nunca tiene esa opción.'
    },
    'maths-complex': {
      q: '¿Por qué las amplitudes de un qubit deben ser números complejos y no simplemente números reales?',
      options: ['Los números complejos son más precisos que los números reales', 'La fase adicional de un número complejo es lo que hace posible la interferencia entre caminos', 'Los números reales no pueden ser negativos', 'Es solo una convención matemática sin significado físico'],
      explanation: 'Dos amplitudes reales aún podrían cancelarse por signo, pero solo una fase compleja permite que las amplitudes se refuercen o se cancelen en cualquier ángulo relativo — esa libertad más rica es exactamente lo que explota la interferencia.'
    },
    'maths-vectors': {
      q: '¿Qué garantiza la condición de normalización |α|² + |β|² = 1 sobre el estado de un qubit?',
      options: ['Que el qubit está entrelazado', 'Que la probabilidad total de medición entre |0⟩ y |1⟩ suma exactamente el 100%', 'Que el qubit ya ha sido medido', 'Que α y β son ambos números reales'],
      explanation: 'P(0) + P(1) = |α|² + |β|² debe ser igual a 1 para que la regla de Born tenga sentido como distribución de probabilidad — cada punto válido en la esfera de Bloch ya cumple esto automáticamente.'
    },
    'maths-matrices': {
      q: '¿Qué propiedad debe cumplir toda matriz U de una puerta cuántica válida?',
      options: ['det(U) = 0', 'U†U = I (U es unitaria)', 'U debe ser una matriz de valores reales', 'U debe tener exactamente dos filas'],
      explanation: 'La unitariedad es lo que mantiene el vector de estado normalizado después de aplicar la puerta — también es exactamente la condición que hace que toda puerta cuántica sea reversible, a diferencia de una puerta AND clásica.'
    },
    'maths-statevector': {
      q: 'En la forma de esfera de Bloch |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩, ¿a qué corresponden θ y φ?',
      options: ['Dos qubits independientes', 'Exactamente los mismos deslizadores θ/φ usados para fijar un estado en la esfera de Bloch', 'El número de puertas aplicadas hasta ahora', 'El resultado de la medición'],
      explanation: 'Cada punto de la esfera de Bloch es simplemente esta ecuación con un par (θ,φ) sustituido — la esfera es una representación de la fórmula, no algo aparte.'
    },
    'maths-dirac': {
      q: '¿Qué significa que ⟨0|1⟩ = 0?',
      options: ['|0⟩ y |1⟩ son el mismo estado', '|0⟩ y |1⟩ son ortogonales — resultados completamente distinguibles', 'El qubit está en superposición', 'Se produjo un error de medición'],
      explanation: 'La ortogonalidad es exactamente la razón por la que la medición siempre devuelve un 0 o un 1 limpio, nunca algo "intermedio" — |0⟩ y |1⟩ no comparten ninguna superposición.'
    },
    'maths-tensor': {
      q: 'Dos qubits independientes, cada uno un vector de 2 entradas, se combinan mediante el producto tensorial en un estado conjunto. ¿Cuántas entradas tiene ese estado conjunto?',
      options: ['2', '4', '8', 'Depende de las amplitudes de los qubits'],
      explanation: 'El producto tensorial de un vector de 2 entradas con otro vector de 2 entradas siempre tiene 2×2 = 4 entradas — una por cada combinación de resultados base, |00⟩, |01⟩, |10⟩, |11⟩ — sin importar cuáles sean las amplitudes reales.'
    },
    gates: {
      q: '¿Qué le hace la puerta de Hadamard (H) a un qubit que empieza en |0⟩?',
      options: ['Lo cambia directamente a |1⟩', 'Lo pone en una superposición equitativa de |0⟩ y |1⟩', 'Lo mide de inmediato', 'Lo entrelaza con otro qubit'],
      explanation: 'H rota |0⟩ hacia el ecuador de la esfera de Bloch — probabilidades de 50/50, con una relación de fase fija entre las dos amplitudes.'
    },
    circuit: {
      q: 'En un circuito cuántico, ¿por qué importa el orden de las puertas?',
      options: ['No importa — las puertas siempre conmutan', 'Cada puerta rota el estado, y las rotaciones generalmente no conmutan', 'Solo la última puerta tiene algún efecto', 'El orden solo importa para la medición'],
      explanation: 'Cada puerta es una rotación de la esfera de Bloch, y las rotaciones en 3D generalmente no conmutan — X seguida de Z termina en un lugar distinto que Z seguida de X.'
    },
    measure: {
      q: '¿Qué le sucede a la superposición de un qubit cuando lo mides?',
      options: ['No cambia nada', 'Colapsa a un único resultado definido', 'Se divide en dos qubits', 'Se entrelaza automáticamente'],
      explanation: 'No existe un hecho oculto sobre cuál era "en realidad" el resultado de antemano — medir es lo que produce una respuesta definida, ponderada por las amplitudes.'
    },
    entangle: {
      q: 'Dos qubits están entrelazados. Mides el primero y obtienes |1⟩. ¿Qué le sucede al segundo?',
      options: ['Nada — son independientes', 'Su resultado queda ahora instantáneamente correlacionado con el primero, según su estado entrelazado', 'Se destruye', 'Se convierte en un bit clásico'],
      explanation: 'Sus amplitudes quedaron vinculadas en el momento en que se entrelazaron — medir uno no envía ninguna señal, solo revela una correlación establecida desde el principio.'
    },
    bellstates: {
      q: 'Φ⁺ = (|00⟩ + |11⟩)/√2 y Φ⁻ = (|00⟩ − |11⟩)/√2 son estados diferentes, pero medir cualquiera de los dos en esta demostración da estadísticas idénticas. ¿Por qué?',
      options: ['En realidad son el mismo estado escrito de dos formas', 'Una fase relativa (el signo −) no cambia ninguna probabilidad en la base computacional; solo importa |amplitud|²', 'La demostración tiene un error y no puede distinguirlos', 'Solo Φ⁺ es un estado de Bell real'],
      explanation: 'Las probabilidades provienen de |amplitud|², que es idéntica para +1/√2 y −1/√2. Los dos estados siguen siendo físicamente distintos — la fase se vuelve visible en cuanto se hace interferir a los qubits entre sí, por ejemplo aplicando una puerta Hadamard a cada uno antes de medir.'
    },
    tunnel: {
      q: '¿Qué es el efecto túnel cuántico?',
      options: ['Un qubit teletransportándose instantáneamente a través del espacio', 'Un paquete de ondas que tiene una probabilidad distinta de cero de aparecer más allá de una barrera clásicamente prohibida', 'Una puerta que elimina un qubit', 'Un error de medición'],
      explanation: 'La función de onda no se detiene bruscamente en una barrera — decae exponencialmente en su interior, así que una barrera suficientemente delgada sigue dejando una amplitud distinta de cero al otro lado.'
    },
    interference: {
      q: 'En el experimento de la doble rendija, ¿qué causa las franjas de interferencia en la pantalla?',
      options: ['Dos partículas separadas colisionando', 'Las amplitudes de probabilidad de caminos indistinguibles que se suman o se cancelan', 'El material de la pantalla', 'El colapso de la medición ocurriendo de forma temprana'],
      explanation: 'Cada punto de la pantalla tiene dos caminos posibles; cuando son indistinguibles sus amplitudes se suman y pueden reforzarse o cancelarse, produciendo las franjas.'
    },
    beamsplitter: {
      q: 'Un solo fotón incide en un divisor de haz 50/50. ¿Qué sucede realmente?',
      options: ['El fotón se divide por la mitad, con una mitad yendo a cada detector', 'El fotón va exactamente a un detector, elegido al azar con probabilidades de 50/50', 'Ambos detectores siempre hacen clic juntos', 'Ningún detector hace clic a menos que midas dos veces'],
      explanation: 'Un fotón nunca se divide entre caminos — el divisor de haz lo pone en una superposición de "reflejado" y "transmitido", y medir (el clic del detector) fuerza un resultado definido, igual que medir un qubit.'
    },
    sterngerlach: {
      q: 'Un haz de átomos de plata pasa a través de un imán de Stern–Gerlach. ¿Qué muestra realmente el experimento en la pantalla del detector?',
      options: ['Una mancha continua de un extremo a otro', 'Exactamente dos puntos discretos, nunca nada intermedio', 'Un único punto en el centro exacto', 'Ningún patrón en absoluto — los átomos son absorbidos'],
      explanation: 'Clásicamente, un dipolo magnético orientado al azar debería desviarse en cualquier cantidad, produciendo una mancha continua. Stern y Gerlach solo encontraron dos puntos discretos — evidencia directa de que el espín, como los propios resultados de medición de un qubit, está cuantizado en solo dos posibilidades a lo largo de cualquier eje.'
    },
    teleport: {
      q: 'Después de que Bob aplica sus puertas de corrección, ¿cómo se compara su qubit con el mensaje original de Alice?',
      options: ['Es una buena aproximación, cercana pero no exacta', 'Coincide exactamente — mismas amplitudes, mismo estado', 'Es una copia clásica, no un estado cuántico real', 'Solo coincide la mitad de las veces'],
      explanation: 'Una vez aplicada la corrección Z/X correcta, el qubit de Bob es exactamente igual al original de Alice, no una aproximación — ese es justamente el propósito del paso de corrección controlado clásicamente.'
    },
    superdense: {
      q: 'En la codificación superdensa, ¿qué es lo que realmente tiene que viajar físicamente de Alice a Bob?',
      options: ['Dos bits clásicos, enviados por radio o teléfono', 'Un único qubit', 'Nada — el par entrelazado por sí solo basta', 'Cuatro qubits, uno por cada mensaje posible'],
      explanation: 'Solo viaja el único qubit de Alice. El par entrelazado se compartió de antemano, y su mensaje se codifica en ese único qubit antes de enviarlo — eso es lo que lo hace "superdenso": 2 bits de información a partir de solo 1 qubit de comunicación.'
    },
    noise: {
      q: 'Un qubit empieza en una superposición genuina. Después de decoherer por completo (T₂ ha pasado muchas veces), ¿qué le ocurre a su vector de Bloch?',
      options: ['Nada — la decoherencia solo afecta a la medición, no al estado', 'Se encoge hacia el centro, la misma firma que un estado mixto/entrelazado', 'Se hace más largo que 1', 'Salta instantáneamente al polo sur'],
      explanation: 'Perder coherencia frente al entorno es matemáticamente idéntico a entrelazarse con algo que no puedes rastrear — ambos dejan el vector de Bloch propio del qubit más corto que 1, un estado genuinamente mixto, no solo un estado puro aleatorizado.'
    },
    grover: {
      q: 'Justo después de que el oráculo de Grover invierte el signo de la amplitud del elemento marcado, ¿qué pasa con la probabilidad medida de encontrarlo?',
      options: ['Salta directamente a 1', 'Se mantiene exactamente igual que antes de que actuara el oráculo', 'Cae a 0', 'Se vuelve aleatoria'],
      explanation: 'La probabilidad viene de |amplitud|², y un simple cambio de signo no altera eso: (−0,5)² = (0,5)². El cambio de fase del oráculo es completamente invisible para una medición hasta que el paso de difusión lo convierte en un aumento real de probabilidad.'
    }
  }
});


// ════════ js/core/theme.js ════════
// No file dependencies at load time. Theme-sensitive tabs/app.js register
// their own redraw via onThemeChange() below (called during their own init,
// which always runs inside DOMContentLoaded before toggleTheme() could ever
// fire from a user click) — this file never needs to know which tabs exist
// or what they draw, the same registration pattern core/tab-registry.js
// uses for onEnter/onLeave.

// ─── THEME SYSTEM ────────────────────────────────────────────────────
const THEME_STORAGE_KEY = 'qe-theme';

let isDark = false;
let BLOCH_COLORS = {};

// ─── THEME-CHANGE CALLBACKS ────────────────────────────────────────────
// Anything that draws with theme-dependent colors (a canvas, mainly)
// registers a redraw callback here instead of this file calling into
// tab-specific draw functions/state by name.
const themeChangeCallbacks = [];
function onThemeChange(fn) { themeChangeCallbacks.push(fn); }

function refreshThemeColors() {
  isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const s = getComputedStyle(document.documentElement);
  const g = name => s.getPropertyValue(name).trim();
  BLOCH_COLORS = {
    arrow:       g('--bloch-arrow'),
    sphereBg:    g('--bloch-sphere-bg'),
    sphereRing:  g('--bloch-sphere-ring'),
    grid:        g('--bloch-grid'),
    gridBack:    g('--bloch-grid-back'),
    axisZ:       g('--bloch-axis-z'),
    axisMuted:   g('--bloch-axis-other'),
    proj:        g('--bloch-proj'),
    tip:         g('--bloch-tip'),
  };
}

// Sets the header icon to match whatever data-theme is currently active
// (called once on load, after the inline anti-flash script in <head> has
// already applied any saved preference — see index.html).
function syncThemeIcon() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  document.getElementById('theme-icon').textContent = dark ? '☀' : '☾';
}

function toggleTheme() {
  const root = document.documentElement;
  isDark = root.getAttribute('data-theme') !== 'light';
  const newTheme = isDark ? 'light' : 'dark';
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  document.getElementById('theme-icon').textContent = isDark ? '☾' : '☀';
  refreshThemeColors();
  themeChangeCallbacks.forEach(fn => fn());
}


// ════════ js/core/dom-utils.js ════════
// buildGatePalette() reads GATES (core/gates.js, loaded after this file),
// drawCoin() reads isDark (core/theme.js), and animateCoinFlip() calls
// delay() (core/utils.js) — all loaded after this file, but only ever
// reached from inside a function body called during/after DOMContentLoaded
// — long after every script has run — so load order doesn't matter here.
// Used by nearly every tabs/*.js file.

/* Shared helper — briefly dims an explainer box then swaps its text in,
   so updates read as a soft "beat" rather than an abrupt jump-cut. */
function setExplainer(elId, html) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.style.opacity = '0.25';
  requestAnimationFrame(() => {
    el.innerHTML = html;
    el.style.opacity = '1';
  });
}

// ─── GOLD COIN (qubit state visual) ────────────────────────────────────
/* Draws a single qubit as an actual gold coin (radial-gradient body,
   raised rim, reeded edge, a glare highlight) rather than a flat UI disc
   — shared by the Entangle tab's two coins (tabs/entanglement-tab.js) and
   the Measure tab's single coin (tabs/measure-tab.js). state:
   null=superposition (faint overlapping 0/1 + "?"), 0 or 1 = collapsed/
   measured. The coin body itself is theme-independent (real gold reads
   the same in light or dark mode); only the engraved 0/1 digits still
   follow the app's --zero/--one convention (canvas fillStyle can't read
   CSS custom properties, so their resolved hex values are hardcoded here
   per theme). `canvasId` also picks the aria-label's subject — 'coin1'/
   'coin2' read as "Qubit A"/"Qubit B" (the Entangle tab's pair), anything
   else reads as "The qubit" (the Measure tab's single coin). */
function drawCoin(canvasId, state) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const who = canvasId === 'coin1' ? 'Qubit A' : canvasId === 'coin2' ? 'Qubit B' : 'The qubit';
  canvas.setAttribute('aria-label',
    state === null ? `${who}: unmeasured, in superposition.` : `${who}: measured as |${state}⟩.`);

  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r  = Math.min(w, h) / 2 - 6;

  ctx.clearRect(0, 0, w, h);

  // ── Gold coin body ── a radial gradient offset toward the upper-left
  // (a consistent "light source"), bright gold highlight fading to a
  // deeper amber edge.
  const bodyGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.08, cx, cy, r);
  bodyGrad.addColorStop(0,    '#FFEFB8');
  bodyGrad.addColorStop(0.45, '#F4C430');
  bodyGrad.addColorStop(1,    '#B8860B');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Raised rim — two concentric strokes, mimicking a real coin's milled edge.
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8B6508';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 5, 0, 2 * Math.PI);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(139,101,8,0.55)';
  ctx.stroke();

  // Reeded edge — short radial ticks around the circumference, like the
  // ridged side of a real coin.
  ctx.strokeStyle = 'rgba(139,101,8,0.4)';
  ctx.lineWidth = 1;
  const tickCount = 36;
  for (let i = 0; i < tickCount; i++) {
    const a  = (i / tickCount) * 2 * Math.PI;
    const x1 = cx + Math.cos(a) * (r - 1),   y1 = cy + Math.sin(a) * (r - 1);
    const x2 = cx + Math.cos(a) * (r - 4.5), y2 = cy + Math.sin(a) * (r - 4.5);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Glare — a soft bright ellipse near the light source, for a metallic sheen.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.32, cy - r * 0.38, r * 0.42, r * 0.22, -0.5, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();
  ctx.restore();

  // ── Engraved content — a faint dark offset "shadow" under the digit
  // gives it a stamped-into-metal look instead of sitting flat on top.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const engrave = (ch, x, y, size, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = '#5C3D00';
    ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
    ctx.fillText(ch, x + 1, y + 1.5);
    ctx.restore();
  };

  if (state === null) {
    // Superposition — faint overlapping 0 and 1
    const size = r * 0.52;
    engrave('0', cx - r * 0.14, cy, size, 0.5);
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#5B8DEF' : '#0033A0';
    ctx.fillText('0', cx - r * 0.14, cy);
    ctx.restore();

    engrave('1', cx + r * 0.14, cy, size, 0.5);
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#F472B6' : '#BE185D';
    ctx.fillText('1', cx + r * 0.14, cy);
    ctx.restore();

    // "?" on top
    ctx.font = `bold ${r * 0.5}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(92,61,0,0.55)';
    ctx.fillText('?', cx, cy);
  } else if (state === 0) {
    const size = r * 0.62;
    engrave('0', cx, cy, size);
    ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#5B8DEF' : '#0033A0';
    ctx.fillText('0', cx, cy);
  } else {
    const size = r * 0.62;
    engrave('1', cx, cy, size);
    ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#F472B6' : '#BE185D';
    ctx.fillText('1', cx, cy);
  }
}

/* Flip animation helper — rapidly alternates coin faces before landing,
   so a "measurement" reads as an actual coin toss rather than an instant
   snap — used by the Entangle tab (measureCoinA()) and the Measure tab
   (doMeasure()). */
async function animateCoinFlip(canvasId, flips = 10, intervalMs = 55) {
  for (let i = 0; i < flips; i++) {
    drawCoin(canvasId, i % 2);
    await delay(intervalMs);
  }
}

// ─── SHARED TOOLTIP (used by BlochRenderer.enableTooltips) ───────────
let _blochTooltipEl = null;

function showBlochTooltip(text, clientX, clientY) {
  if (!_blochTooltipEl) {
    _blochTooltipEl = document.createElement('div');
    _blochTooltipEl.className = 'bloch-tooltip';
    document.body.appendChild(_blochTooltipEl);
  }
  _blochTooltipEl.textContent = text;
  _blochTooltipEl.style.left = clientX + 'px';
  _blochTooltipEl.style.top  = (clientY - 14) + 'px';
  _blochTooltipEl.classList.add('visible');
}

function hideBlochTooltip() {
  if (_blochTooltipEl) _blochTooltipEl.classList.remove('visible');
}

// ─── CONFIRM MODAL ─────────────────────────────────────────────────────
/**
 * Custom replacement for the browser's native confirm() popup, styled to
 * match the app instead of the OS/browser chrome. Unlike confirm(), this
 * can't block synchronously, so the result comes back via `onConfirm`
 * rather than a return value — cancel (button, backdrop click, or Esc)
 * just does nothing. A fresh backdrop element is built and removed on
 * every call rather than reused, so there's never a stale listener left
 * over from a previous open. Pass `danger: true` to tint the confirm
 * button for destructive actions (see resetRoadmapProgress() in
 * roadmap.js).
 */
function showConfirmModal({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm }) {
  const el = document.createElement('div');
  el.className = 'confirm-modal-backdrop';
  el.innerHTML = `
    <div class="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div class="confirm-modal-title" id="confirm-modal-title">${title}</div>
      <p class="confirm-modal-message">${message}</p>
      <div class="confirm-modal-actions">
        <button class="btn-secondary" data-confirm-cancel>${cancelLabel}</button>
        <button class="btn-confirm${danger ? ' danger' : ''}" data-confirm-ok>${confirmLabel}</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));

  function close() {
    document.removeEventListener('keydown', onKey);
    el.remove();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  el.addEventListener('click', e => { if (e.target === el) close(); });
  el.querySelector('[data-confirm-cancel]').addEventListener('click', close);
  el.querySelector('[data-confirm-ok]').addEventListener('click', () => { close(); onConfirm(); });
  document.addEventListener('keydown', onKey);
  el.querySelector('[data-confirm-cancel]').focus();
}

// ─── SHAREABLE STATE LINKS ────────────────────────────────────────────
/* Builds a URL encoding `params` as a query string, copies it to the
   clipboard, and briefly swaps btn's own text to confirm — reused by the
   Qubit and Circuit tabs' "Share" buttons. */
async function copyShareLink(params, btn) {
  const url = `${location.origin}${location.pathname}?${new URLSearchParams(params).toString()}`;
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(url);
    btn.textContent = 'Copied!';
  } catch (e) {
    btn.textContent = 'Copy failed';
  }
  setTimeout(() => { btn.textContent = original; }, 1400);
}

// ─── ONE-SHOT PULSE ANIMATION ─────────────────────────────────────────
/* Adds `className` to `el` just long enough to play its CSS animation,
   then removes it — forcing a reflow first so re-triggering the same
   pulse on an element that's still mid-animation restarts it cleanly
   instead of being a no-op (adding a class that's already present
   doesn't restart a running CSS animation). Reused for gate-apply and
   measurement-collapse pulses. */
function pulseElement(el, className, duration = 450) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration);
}

// ─── GATE PALETTE ──────────────────────────────────────────────────────
/**
 * Builds one colored gate-palette button per GATES entry inside
 * `containerId`, calling `onKeyClick(key)` when clicked — the identical
 * button-building loop every quantum circuit builder (1/2/3-qubit) used
 * to copy-paste on its own. Deliberately narrow to GATES' own styling
 * convention (color + colored border, plain textContent, title tooltip):
 * the classical circuit/gate tabs use a different table (CLASSICAL_GATES,
 * no per-gate color) and gates-tab.js's own palette uses a richer
 * name+subtitle button, so neither goes through this helper — forcing
 * them through one options-flag-laden function would cost more
 * readability than the duplication it'd remove.
 */
function buildGatePalette(containerId, onKeyClick) {
  const container = document.getElementById(containerId);
  Object.entries(GATES).forEach(([key, gate]) => {
    const btn = document.createElement('button');
    btn.className         = 'circuit-gate-btn';
    btn.textContent       = gate.name;
    btn.style.color       = gate.color;
    btn.style.borderColor = gate.color + '55';
    btn.title             = t(`gates.${key}.desc`, gate.desc);
    btn.addEventListener('click', () => onKeyClick(key));
    container.appendChild(btn);
  });
}

// ─── TRY ME PRESETS ────────────────────────────────────────────────────
/**
 * Renders a collapsed "Try me" toggle into `containerId` that expands to
 * a row of named preset buttons — reused by all four circuit builders
 * (classical, 1Q/2Q/3Q quantum) so each just supplies its own preset
 * data and a callback to load+run it. `presets` is [{ name, ... }]; the
 * rest of each preset object is opaque here and passed straight to
 * `onSelect`.
 */
function renderTryMe(containerId, presets, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <button class="try-me-toggle" type="button">${t('common.tryMePresets', '🎲 Try me — preset circuits')}</button>
    <div class="try-me-presets" style="display:none;"></div>
  `;
  const toggle = container.querySelector('.try-me-toggle');
  const presetsWrap = container.querySelector('.try-me-presets');
  presetsWrap.innerHTML = presets.map((p, i) =>
    `<button class="try-preset-btn" data-i="${i}">${p.name}</button>`
  ).join('');
  toggle.addEventListener('click', () => {
    const isOpen = presetsWrap.style.display !== 'none';
    presetsWrap.style.display = isOpen ? 'none' : 'flex';
    toggle.classList.toggle('active', !isOpen);
  });
  presetsWrap.querySelectorAll('[data-i]').forEach(btn => {
    btn.addEventListener('click', () => onSelect(presets[parseInt(btn.dataset.i, 10)]));
  });
}

// ─── SEGMENTED-CONTROL SLIDING INDICATOR ──────────────────────────────
/**
 * Gives every `.mode-grid` toggle group (Concepts/Home, 1 Qubit/
 * 2 Qubits, the Interference mode switch, etc.) a single sliding
 * highlight instead of each button drawing its own background — a
 * MutationObserver watches the whole page for `class` changes and
 * repositions every thumb, so none of the functions that toggle `.active`
 * (setAppMode, setCircuitMode, the target-qubit handler,
 * setInterferenceMode) need to know this animation exists. Watching the
 * whole document rather than
 * each grid individually also catches the case a grid's *ancestor*
 * becomes visible (e.g. switching to the Circuit or Interference tab,
 * or into Roadmap mode) — most `.mode-grid`s start inside hidden
 * content, so their buttons report zero size until their tab/view is
 * actually shown; re-syncing on every class change (tab switches
 * included) catches that moment instead of leaving a stuck 0×0 thumb.
 * Called once from app.js's DOMContentLoaded, after all `.mode-grid`
 * markup already exists in the DOM.
 */
function initModeGridThumbs() {
  const grids  = [...document.querySelectorAll('.mode-grid')];
  const thumbs = grids.map(grid => {
    const thumb = document.createElement('div');
    thumb.className = 'mode-grid-thumb';
    grid.insertBefore(thumb, grid.firstChild);
    return thumb;
  });

  const syncAll = () => {
    grids.forEach((grid, i) => {
      const thumb  = thumbs[i];
      const active = grid.querySelector('.mode-btn.active');
      if (!active || active.offsetWidth === 0) { thumb.style.opacity = '0'; return; }
      thumb.style.opacity   = '1';
      thumb.style.width     = active.offsetWidth + 'px';
      thumb.style.height    = active.offsetHeight + 'px';
      thumb.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    });
  };

  new MutationObserver(syncAll).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
  syncAll();
  window.addEventListener('resize', syncAll);
}


// ════════ js/core/bloch-renderer.js ════════
// Depends on: core/theme.js (isDark), read inside draw() at call time —
// kept after theme.js in load order for readability only. enableTooltips()
// also depends on core/dom-utils.js (showBlochTooltip/hideBlochTooltip),
// which loads before this file.
//
// Styled as an Earth globe (ocean gradient, simplified continents, a
// polar axle rod poking through top and bottom) rather than an abstract
// wireframe sphere — the state itself is a small pin sitting on the
// surface with a callout bubble, not a vector arrow from the center.
// The projection/drag math (project/unproject) is unchanged from the
// original wireframe version; only what gets drawn changed.

// ─── BLOCH RENDERER (theme-aware) ────────────────────────────────────
class BlochRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.cx     = canvas.width  / 2;
    this.cy     = canvas.height / 2;
    this.r      = Math.min(canvas.width, canvas.height) * 0.37;
    this.cur    = { x: 0, y: 0, z: 1 };
    this.tgt    = { x: 0, y: 0, z: 1 };
    this.label  = '';      // current state's short ket label, shown in the surface-pin callout
    this.animId = null;
    this.hotspots = [];   // axis-label screen positions, refreshed each draw() — used for hover tooltips
    this._dragPrev = null; // last 3D point during an active drag — used by unproject() for continuity
  }

  /**
   * Projects a 3D Bloch-sphere point to 2D canvas coordinates using a
   * fixed viewing angle (azimuth -30°, elevation 18°). Returns the
   * rotated depth `d` alongside screen coords `sx`/`sy` — `d` is used
   * by drawCircle() to split each great-circle into a solid front arc
   * (d > 0, facing the viewer) and a dashed back arc (d <= 0).
   */
  project(x, y, z) {
    const az = -Math.PI / 6;
    const el =  Math.PI / 10;
    const x1 =  x * Math.cos(az) + y * Math.sin(az);
    const y1 = -x * Math.sin(az) + y * Math.cos(az);
    const z1 = z;
    const x2 = x1;
    const y2 = y1 * Math.cos(el) - z1 * Math.sin(el);
    const z2 = y1 * Math.sin(el) + z1 * Math.cos(el);
    return {
      sx: this.cx + x2 * this.r,
      sy: this.cy - z2 * this.r,
      d:  y2
    };
  }

  /** `label`, if given, replaces the callout text and is remembered for
   *  later no-label draw()/animateTo() calls (e.g. the theme-toggle
   *  redraw in theme.js, which doesn't know any tab's current state). */
  animateTo(x, y, z, label) {
    if (label !== undefined) this.label = label;
    this.tgt = { x, y, z };
    if (this.animId) cancelAnimationFrame(this.animId);
    const step = () => {
      const t    = 0.14;
      this.cur.x = this.cur.x + (this.tgt.x - this.cur.x) * t;
      this.cur.y = this.cur.y + (this.tgt.y - this.cur.y) * t;
      this.cur.z = this.cur.z + (this.tgt.z - this.cur.z) * t;
      this.draw(this.cur.x, this.cur.y, this.cur.z);
      const dist = Math.abs(this.cur.x - this.tgt.x)
                 + Math.abs(this.cur.y - this.tgt.y)
                 + Math.abs(this.cur.z - this.tgt.z);
      if (dist > 0.0008) {
        this.animId = requestAnimationFrame(step);
      } else {
        this.cur = { ...this.tgt };
        this.draw(this.cur.x, this.cur.y, this.cur.z);
        this.animId = null;
      }
    };
    step();
  }

  drawCircle(paramFn, colorFront, colorBack, wFront = 1, wBack = 0.6) {
    const ctx = this.ctx;
    const N   = 128;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * 2 * Math.PI;
      const [x, y, z] = paramFn(t);
      pts.push(this.project(x, y, z));
    }

    ctx.save();
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = colorBack;
    ctx.lineWidth   = wBack;
    ctx.beginPath();
    let inPath = false;
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].d > 0) { inPath = false; continue; }
      if (!inPath) { ctx.moveTo(pts[i].sx, pts[i].sy); inPath = true; }
      else ctx.lineTo(pts[i].sx, pts[i].sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = colorFront;
    ctx.lineWidth   = wFront;
    ctx.beginPath();
    inPath = false;
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].d <= 0) { inPath = false; continue; }
      if (!inPath) { ctx.moveTo(pts[i].sx, pts[i].sy); inPath = true; }
      else ctx.lineTo(pts[i].sx, pts[i].sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Extra latitude rings (parallels, fixed θ) and longitude rings
   * (meridians, fixed φ) beyond the equator/axis-meridian great circles
   * drawn separately — the standard globe-illustration graticule, at 30°
   * spacing like lines of latitude/longitude on Earth. Each meridian
   * pair (φ and φ+180°) is one closed great circle through both poles,
   * the same trick used for the |+⟩/|i⟩ axis meridians, so this reuses
   * drawCircle() rather than a different draw path.
   */
  drawGlobeGrid(color) {
    [30, 60, 120, 150].forEach(deg => {
      const theta = deg * Math.PI / 180;
      const z = Math.cos(theta), rad = Math.sin(theta);
      this.drawCircle(t => [rad * Math.cos(t), rad * Math.sin(t), z], color, color, 0.6, 0.35);
    });
    [30, 60, 120, 150].forEach(deg => {
      const phi = deg * Math.PI / 180;
      this.drawCircle(t => [Math.sin(t) * Math.cos(phi), Math.sin(t) * Math.sin(phi), Math.cos(t)], color, color, 0.6, 0.35);
    });
  }

  /**
   * The polar axle — drawn *before* the sphere fill, so the segment
   * between the two poles is hidden behind the opaque globe and only the
   * two protruding stubs (like a rod through a globe's mounting bracket)
   * show, top and bottom.
   */
  drawPolarRod() {
    const ctx = this.ctx;
    const topOut    = this.project(0, 0, 1.42);
    const topSphere = this.project(0, 0, 1.0);
    const botSphere = this.project(0, 0, -1.0);
    const botOut    = this.project(0, 0, -1.42);
    const rodColor  = isDark ? '#B8BEC9' : '#DEE2E7';
    const rodShadow = isDark ? '#6E7480' : '#AEB4BC';
    const rw = Math.max(3, this.r * 0.05);

    [[topOut, topSphere], [botSphere, botOut]].forEach(([a, b]) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = rodColor;
      ctx.lineWidth   = rw;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      // Thin shadow stripe down one side for a subtle cylindrical look.
      ctx.strokeStyle = rodShadow;
      ctx.lineWidth   = rw * 0.32;
      ctx.beginPath();
      ctx.moveTo(a.sx + rw * 0.24, a.sy);
      ctx.lineTo(b.sx + rw * 0.24, b.sy);
      ctx.stroke();
      ctx.restore();
    });
  }

  /**
   * A handful of simplified, deliberately non-geographic "continent"
   * blobs (θ/φ polygons in degrees) so the globe doesn't read as a flat
   * blue disc. Each blob is skipped once its average depth faces away
   * from the viewer — a cheap approximation (real per-edge clipping
   * against the terminator isn't worth it for decoration) that just pops
   * the whole shape out near the horizon instead of clipping smoothly.
   */
  drawContinents() {
    const ctx = this.ctx;
    const CONTINENTS = [
      [[50,255],[38,285],[52,312],[74,302],[96,283],[100,255],[84,236],[64,233]],
      [[42,8],[33,34],[48,56],[74,50],[94,28],[88,4],[68,-12],[54,-6]],
      [[52,108],[42,138],[58,164],[84,158],[108,138],[98,108],[78,92]]
    ];
    const color = isDark ? 'rgba(88,198,120,0.88)' : 'rgba(58,168,94,0.92)';
    CONTINENTS.forEach(poly => {
      const pts = poly.map(([thetaDeg, phiDeg]) => {
        const theta = thetaDeg * Math.PI / 180, phi = phiDeg * Math.PI / 180;
        return this.project(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta));
      });
      const avgD = pts.reduce((s, p) => s + p.d, 0) / pts.length;
      if (avgD <= 0.08) return;
      ctx.beginPath();
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  /** Small "N"/"S" tag sitting right on the sphere surface at each pole —
   *  the Earth-globe framing alongside the |0⟩/|1⟩ ket labels that carry
   *  the actual physics. */
  drawPoleMarker(pos, label) {
    const p  = this.project(...pos);
    const fs = Math.max(8, this.r * 0.076);
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.font = `600 ${fs}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = label === 'N' ? 'bottom' : 'top';
    const ly = p.sy + (label === 'N' ? -5 : 5);
    // Stroked outline behind the fill — without it this label is
    // invisible against the (also near-white) polar rod right behind it.
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeText(label, p.sx, ly);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(label, p.sx, ly);
    ctx.restore();
  }

  drawAxis(pos, neg, color, posLabel, negLabel) {
    const ctx = this.ctx;
    const p   = this.project(...pos);
    const n   = this.project(...neg);
    const o   = this.project(0, 0, 0);
    const fs  = Math.max(9, this.r * 0.088);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.3;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(o.sx, o.sy); ctx.lineTo(p.sx, p.sy); ctx.stroke();

    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(o.sx, o.sy); ctx.lineTo(n.sx, n.sy); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font         = `${fs}px "JetBrains Mono", monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const off = this.r * 0.16;
    const posX = p.sx + (p.sx > this.cx ?  off*0.7 : -off*0.7);
    const posY = p.sy + (p.sy < this.cy ? -off*0.4 :  off*0.4);
    const negX = n.sx + (n.sx > this.cx ?  off*0.7 : -off*0.7);
    const negY = n.sy + (n.sy < this.cy ? -off*0.4 :  off*0.4);
    // Stroked outline behind the fill, same reasoning as the N/S pole
    // tags — the Z axis's labels sit right where the polar rod pokes
    // out, close enough in tone (both near-white) that a plain fill
    // disappears against it.
    ctx.lineWidth   = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeText(posLabel, posX, posY);
    ctx.strokeText(negLabel, negX, negY);
    ctx.fillStyle = color;
    ctx.fillText(posLabel, posX, posY);
    ctx.fillText(negLabel, negX, negY);
    ctx.restore();

    this.hotspots.push({ sx: posX, sy: posY, text: posLabel });
    this.hotspots.push({ sx: negX, sy: negY, text: negLabel });
  }

  /**
   * The state itself: a small pin sitting directly on the globe's
   * surface at the qubit's point (rather than an arrow reaching out from
   * the center), plus a leader line to a rounded label bubble showing
   * its short ket — the callout offset direction follows the tip's own
   * direction from the sphere's center, so it always leans away from the
   * globe instead of overlapping it.
   */
  drawStateMarker(bx, by, bz, label) {
    const ctx = this.ctx;
    const { r } = this;
    const tip = this.project(bx, by, bz);

    ctx.save();
    ctx.beginPath();
    ctx.arc(tip.sx, tip.sy, r * 0.055, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF6B4A';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    if (!label) return;

    const dx = tip.sx - this.cx, dy = tip.sy - this.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ldx = dx / len, ldy = dy / len;
    const leadLen = r * 0.55;
    const lx = tip.sx + ldx * leadLen;
    const ly = tip.sy + ldy * leadLen - r * 0.18;

    const fs = Math.max(9, r * 0.1);
    ctx.save();
    ctx.font = `600 ${fs}px 'Space Grotesk', sans-serif`;
    const padX = 7, padY = 5, margin = 4;
    const textW = ctx.measureText(label).width;
    const boxW  = textW + padX * 2, boxH = fs + padY * 2;

    // Clamp the bubble to stay fully inside the canvas — a tip near the
    // sphere's edge (e.g. |+⟩-ish states) would otherwise push the
    // leader line and bubble straight off the side, same problem the
    // fixed-size canvas already has no scroll/overflow to recover from.
    let boxX = lx - (ldx < 0 ? boxW : 0);
    let boxY = ly - boxH / 2;
    boxX = Math.min(Math.max(boxX, margin), this.canvas.width  - boxW - margin);
    boxY = Math.min(Math.max(boxY, margin), this.canvas.height - boxH - margin);

    // Leader line always points from the pin to whichever edge of the
    // (possibly clamped) box is nearest, so it still reads as "this
    // label belongs to that pin" even after clamping moves the box.
    const boxCx = boxX + boxW / 2, boxCy = boxY + boxH / 2;
    const edgeX = Math.min(Math.max(tip.sx, boxX), boxX + boxW);
    const edgeY = Math.min(Math.max(tip.sy, boxY), boxY + boxH);

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tip.sx, tip.sy);
    ctx.lineTo(edgeX, edgeY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 5);
    else ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.stroke();

    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, boxCx, boxCy);
    ctx.restore();
  }

  /** `label`, if given, replaces the callout text (see the constructor's
   *  `this.label` comment) — omit it to redraw the last-known label
   *  unchanged, which is what the theme-toggle redraw in theme.js relies
   *  on. */
  draw(bx, by, bz, label) {
    if (label !== undefined) this.label = label;
    const ctx = this.ctx;
    const { cx, cy, r } = this;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hotspots.length = 0;

    // ── Polar axle (behind the globe — only its stubs will show) ──
    this.drawPolarRod();

    // ── Earth-like sphere ────────────────────────────────
    const grd = ctx.createRadialGradient(cx - r*0.32, cy - r*0.36, r*0.05, cx, cy, r*1.05);
    grd.addColorStop(0,    isDark ? '#6FA3E8' : '#8FC1F5');
    grd.addColorStop(0.55, isDark ? '#2F63B0' : '#3E7FD6');
    grd.addColorStop(1,    isDark ? '#132A52' : '#1D4A8C');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Continents ───────────────────────────────────────
    this.drawContinents();

    // ── Graticule (lat/long grid, on top of the ocean) ────
    const gridColor    = 'rgba(255,255,255,0.30)';
    const gridColorDim = 'rgba(255,255,255,0.16)';
    this.drawCircle(t => [Math.cos(t), Math.sin(t), 0], gridColor, gridColorDim, 1, 0.6);
    this.drawCircle(t => [Math.cos(t), 0, Math.sin(t)], gridColorDim, gridColorDim, 0.7, 0.4);
    this.drawCircle(t => [0, Math.cos(t), Math.sin(t)], gridColorDim, gridColorDim, 0.7, 0.4);
    this.drawGlobeGrid(gridColorDim);

    // ── Axis ket labels ──────────────────────────────────
    this.drawAxis([0, 0, 1.12], [0, 0, -1.12], '#ffffff',            '|0⟩', '|1⟩');
    this.drawAxis([1.12,0,0], [-1.12,0,0],     'rgba(255,255,255,0.72)', '|+⟩', '|-⟩');
    this.drawAxis([0, 1.12,0], [0,-1.12,0],    'rgba(255,255,255,0.72)', '|i⟩', '|-i⟩');

    // ── N/S pole tags ────────────────────────────────────
    this.drawPoleMarker([0, 0, 1],  'N');
    this.drawPoleMarker([0, 0, -1], 'S');

    // ── State marker + callout ───────────────────────────
    this.drawStateMarker(bx, by, bz, this.label);
  }

  /**
   * Inverse of project(): given a screen point, reconstructs the unit
   * Bloch vector whose projection lands there. The projection collapses
   * one dimension (depth), so each screen point actually matches two
   * possible sphere points (near/far side) — the ambiguity is resolved
   * by picking whichever candidate is closer to `_dragPrev` (the point
   * from the previous call), so a continuous drag traces a smooth path
   * across the sphere instead of snapping to a fixed hemisphere.
   */
  unproject(mx, my) {
    const az = -Math.PI / 6;
    const el =  Math.PI / 10;
    let dx = (mx - this.cx) / this.r;
    let dz = (this.cy - my) / this.r;
    const rad2 = dx * dx + dz * dz;
    if (rad2 > 1) {
      const s = 1 / Math.sqrt(rad2);
      dx *= s; dz *= s;
    }
    const depth = Math.sqrt(Math.max(0, 1 - dx * dx - dz * dz));

    const toPoint = y2 => {
      const y1 =  y2 * Math.cos(el) + dz * Math.sin(el);
      const z1 = -y2 * Math.sin(el) + dz * Math.cos(el);
      const x1 = dx;
      return {
        x: x1 * Math.cos(az) - y1 * Math.sin(az),
        y: x1 * Math.sin(az) + y1 * Math.cos(az),
        z: z1
      };
    };

    let best = toPoint(depth);
    if (depth > 1e-6 && this._dragPrev) {
      const far = toPoint(-depth);
      const dot = p => p.x * this._dragPrev.x + p.y * this._dragPrev.y + p.z * this._dragPrev.z;
      if (dot(far) > dot(best)) best = far;
    }
    this._dragPrev = best;

    const theta = Math.acos(Math.min(1, Math.max(-1, best.z)));
    let phi = Math.atan2(best.y, best.x);
    if (phi < 0) phi += 2 * Math.PI;
    return { theta, phi };
  }

  /**
   * Makes the sphere directly draggable: mousedown/touchstart begins
   * tracking from the currently-displayed state position (`this.cur`),
   * and onDrag(theta, phi) fires on every subsequent move.
   */
  enableDrag(onDrag) {
    const canvas = this.canvas;
    let dragging = false;

    const localPos = e => {
      const rect = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { mx: p.clientX - rect.left, my: p.clientY - rect.top };
    };
    const move = e => {
      if (!dragging) return;
      const { mx, my } = localPos(e);
      const { theta, phi } = this.unproject(mx, my);
      onDrag(theta, phi);
      e.preventDefault();
    };
    const start = e => {
      dragging = true;
      this._dragPrev = { ...this.cur };
      canvas.classList.add('dragging');
      move(e);
    };
    const end = () => {
      dragging = false;
      canvas.classList.remove('dragging');
    };

    canvas.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }

  /** Shows a small tooltip explaining an axis ket when the mouse hovers its label. */
  enableTooltips() {
    const canvas = this.canvas;
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = this.hotspots.find(h => Math.hypot(h.sx - mx, h.sy - my) < 16);
      if (hit) {
        showBlochTooltip(BLOCH_KET_MEANINGS[hit.text] || hit.text, e.clientX, e.clientY);
      } else {
        hideBlochTooltip();
      }
    });
    canvas.addEventListener('mouseleave', hideBlochTooltip);
  }
}

// Plain-language meaning of each basis-state label drawn on the sphere,
// shown in the hover tooltip enabled by enableTooltips().
const BLOCH_KET_MEANINGS = {
  '|0⟩':  'Definite 0 — the north pole. A classical bit can only ever be here or at |1⟩.',
  '|1⟩':  'Definite 1 — the south pole.',
  '|+⟩':  'Equal superposition (|0⟩ + |1⟩)/√2 — 50/50 odds, phase 0°.',
  '|-⟩':  'Equal superposition (|0⟩ − |1⟩)/√2 — 50/50 odds, phase 180°.',
  '|i⟩':  'Equal superposition (|0⟩ + i|1⟩)/√2 — 50/50 odds, phase 90°.',
  '|-i⟩': 'Equal superposition (|0⟩ − i|1⟩)/√2 — 50/50 odds, phase 270°.'
};


// ════════ js/core/utils.js ════════
// No dependencies. Used by several tabs/*.js async flows (call-time only).

// ─── UTILITY ──────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }


// ════════ js/tabs/important-concepts.js ════════
// Important Concepts tab — the only interactive behavior on an otherwise
// static glossary page: a live search box that filters the glossary
// grids as you type (initImportantConceptsSearch()), and tapping a card
// to zoom it into a centered overlay for a bigger, easier read, dismissed
// via its own close button, Esc, or a backdrop click
// (initImportantConceptsZoom()/openConceptZoom()). The zoom overlay
// depends on: core/dom-utils.js's showConfirmModal for the sibling
// pattern it mirrors (fixed backdrop, Esc/backdrop-click to close, one
// fresh element per open rather than a reused hidden one).
// No registerTab() entry — this tab carries no simulation state to
// enter/leave, just these two delegated/one-time handlers.

/** Filters the glossary grids by re-reading each card's own live
 *  textContent on every keystroke — already-translated by i18n.js's
 *  applyTranslations(), so this needs no separate per-language search
 *  index and one onLangChange() re-run (below) keeps it correct across a
 *  language switch mid-search. A group's .section-label and
 *  .intro-glossary-grid are hidden together whenever every card inside
 *  it is filtered out, rather than leaving an empty heading floating
 *  above nothing. */
function initImportantConceptsSearch() {
  const input = document.getElementById('concept-search');
  if (!input) return;
  const clearBtn = document.getElementById('concept-search-clear');
  const emptyMsg = document.getElementById('concept-search-empty');
  const grids = Array.from(document.querySelectorAll('#tab-important-concepts .intro-glossary-grid'));
  const labels = Array.from(document.querySelectorAll('#tab-important-concepts .section-label'));

  function applyFilter() {
    const query = input.value.trim().toLowerCase();
    clearBtn.style.display = query ? '' : 'none';

    let totalVisible = 0;
    grids.forEach((grid, i) => {
      let groupVisible = 0;
      grid.querySelectorAll('.card').forEach(card => {
        const matches = !query || card.textContent.toLowerCase().includes(query);
        card.classList.toggle('concept-hidden', !matches);
        if (matches) groupVisible++;
      });
      grid.classList.toggle('concept-hidden', groupVisible === 0);
      if (labels[i]) labels[i].classList.toggle('concept-hidden', groupVisible === 0);
      totalVisible += groupVisible;
    });

    emptyMsg.style.display = totalVisible === 0 ? '' : 'none';
    if (totalVisible === 0) {
      emptyMsg.textContent = t('concepts.searchNoResults', 'No concepts match "{query}".').replace('{query}', input.value.trim());
    }
  }

  input.addEventListener('input', applyFilter);
  clearBtn.addEventListener('click', () => { input.value = ''; applyFilter(); input.focus(); });
  // Re-render the "no results" message (and, in principle, re-filter) so
  // switching language mid-search never leaves stale English text behind
  // — see core/i18n.js's onLangChange().
  onLangChange(applyFilter);
}

/** Wires a single delegated click handler on the whole Important Concepts
 *  section rather than one listener per card, so it keeps working
 *  regardless of how many glossary cards get added later. */
function initImportantConceptsZoom() {
  const section = document.getElementById('tab-important-concepts');
  if (!section) return;
  section.addEventListener('click', (e) => {
    const card = e.target.closest('.intro-glossary-grid .card');
    if (card) openConceptZoom(card);
  });
}

let activeConceptZoom = null; // { close } while a zoom overlay is open, else null

/**
 * FLIP transition: the overlay card is built at its real (bigger,
 * centered) size first, then instantly transformed (translate+scale) to
 * exactly overlay the clicked card's on-screen position/size, then that
 * transform is animated back to identity — so the very first frame looks
 * identical to the grid card sitting where it was, and it visibly grows
 * from there into the centered overlay, rather than just fading in
 * generically. Closing plays the same transform forward instead of
 * reversed-from-scratch, so it shrinks back into the same card.
 */
function openConceptZoom(card) {
  if (activeConceptZoom) return; // one overlay at a time
  const startRect = card.getBoundingClientRect();

  const backdrop = document.createElement('div');
  backdrop.className = 'concept-zoom-backdrop';
  backdrop.innerHTML = `
    <div class="concept-zoom-card" role="dialog" aria-modal="true">
      <button class="concept-zoom-close" type="button" aria-label="Close" data-zoom-close>✕</button>
      <div class="concept-zoom-body">${card.innerHTML}</div>
    </div>`;
  document.body.appendChild(backdrop);
  const modal = backdrop.querySelector('.concept-zoom-card');

  const endRect = modal.getBoundingClientRect();
  const scaleX = startRect.width / endRect.width;
  const scaleY = startRect.height / endRect.height;
  const dx = (startRect.left + startRect.width / 2) - (endRect.left + endRect.width / 2);
  const dy = (startRect.top + startRect.height / 2) - (endRect.top + endRect.height / 2);
  const fromCardTransform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    modal.style.transform = fromCardTransform;
    modal.style.opacity = '0.4';
  }
  void modal.offsetWidth; // force layout so the transform above paints before the transition below starts
  backdrop.classList.add('visible');
  requestAnimationFrame(() => {
    modal.style.transform = '';
    modal.style.opacity = '';
  });

  function close() {
    document.removeEventListener('keydown', onKey);
    activeConceptZoom = null;
    if (reduceMotion) { backdrop.remove(); return; }
    modal.style.transform = fromCardTransform;
    modal.style.opacity = '0.4';
    backdrop.classList.remove('visible');
    modal.addEventListener('transitionend', () => backdrop.remove(), { once: true });
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  modal.querySelector('[data-zoom-close]').addEventListener('click', close);
  document.addEventListener('keydown', onKey);

  activeConceptZoom = { close };
}


// ════════ js/tabs/classical-bit.js ════════
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


// ════════ js/tabs/qubit-tab.js ════════
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


// ════════ js/tabs/mathsconcept-tab.js ════════
// Mostly a reference tab — text + formulas, no state of its own — except
// the State Vector section, which also embeds the interactive
// classical-vs-quantum comparison widget from tabs/statevector-tab.js
// (wired up separately by that file's own initStatevecTab(), called
// alongside initMathsConceptTab() in app.js). Navigated exclusively via
// the sidebar's Maths Concept sub-links (see the generic .tab-sub
// handler in app.js), which call setMathsSection() directly, so there's
// no in-page toggle to wire up here.
// Depends on: core/tab-registry.js (registerTab), tabs/statevector-tab.js
// (redrawStatevecCanvases).

const MATHS_SECTIONS = ['complex', 'vectors', 'matrices', 'statevector', 'dirac', 'tensor'];

function initMathsConceptTab() {
  registerTab('mathsconcept', {});
  setMathsSection('complex'); // matches the panel already visible by default in index.html
}

/** Shows the one .maths-panel matching `section`, hides the rest. */
function setMathsSection(section) {
  MATHS_SECTIONS.forEach(name => {
    document.getElementById(`maths-${name}`).style.display = name === section ? '' : 'none';
  });
  syncSidebarSub('mathsconcept', { mathsSection: section });
  // The state-vector section's canvases (see tabs/statevector-tab.js)
  // don't redraw themselves while display:none, so opening this section
  // needs the same explicit redraw a tab visit used to trigger back when
  // this widget was its own top-level "Statevec" tab.
  if (section === 'statevector') redrawStatevecCanvases();
}


// ════════ js/tabs/gates-tab.js ════════
// Depends on: core/gates.js (GATES, ROTATION_GATES, rotationMatrix),
// core/complex.js (C.fmt), core/dom-utils.js (setExplainer),
// core/tab-registry.js (registerTab), app.js state (qubitMain, gateHistory,
// rendererGates), tabs/qubit-tab.js (updateQubitUI, called after applying a gate).
//
// gateHistory entries carry a display label/color plus a snapshot of the
// qubit's exact (theta, phi) right after that step, the explainer HTML
// shown at the time, and enough to redraw that step's matrix (matrixKey
// for fixed gates; matrix/rotationAxis/rotationAngle for rotation gates)
// — see restoreGateHistoryStep() below. Snapshots rather than replayable
// operations because entries come from two different sources that behave
// differently: manual gate clicks compound on whatever state came
// before, while a Try Me run resets to |0⟩ before each step (see
// initGatesTryMe()) — a snapshot of the resulting state means rollback
// doesn't need to know or care which kind of entry it's restoring.
// gateHistoryCursor tracks which entry is currently on screen (not
// necessarily the last one, once a rollback click has fired).

// ═══════════════════════════════════════════════════════════════════
// GATES TAB
// ═══════════════════════════════════════════════════════════════════
/** Classical Gates/Quantum Gates/Compare switch for the Gates tab — same
 *  multi-panel toggle pattern as Circuits' domain toggle, extended to a
 *  third "Compare" panel (item 14) that needs both truth tables built
 *  once, on first visit, rather than every switch. */
function setGatesDomain(domain) {
  document.querySelectorAll('.mode-btn[data-gates-domain]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.gatesDomain === domain));
  document.getElementById('gates-classical-panel').style.display = domain === 'classical' ? '' : 'none';
  document.getElementById('gates-quantum-panel').style.display   = domain === 'quantum'   ? '' : 'none';
  document.getElementById('gates-compare-panel').style.display   = domain === 'compare'   ? '' : 'none';
  syncSidebarSub('gates', { gatesDomain: domain });
}

function buildGateButtons() {
  document.querySelectorAll('.mode-btn[data-gates-domain]').forEach(btn =>
    btn.addEventListener('click', () => setGatesDomain(btn.dataset.gatesDomain)));
  syncSidebarSub('gates', { gatesDomain: 'quantum' }); // matches the panel already active by default in index.html

  renderGateGrid();
  document.getElementById('btn-reset-gates').addEventListener('click', resetGates);
  buildRotationButtons();
  buildGateReference();
  initGatesTryMe();
  buildQuantumGateTruthTable('gates-truth-table');
  buildQuantumGateTruthTable('gates-compare-quantum-table');
  buildAllClassicalGatesTruthTables('gates-compare-classical-table');

  // The Gates-tab sphere mirrors qubitMain but is otherwise idle between
  // visits, so jump its animation state to the current qubit on entry
  // instead of tweening in from wherever it was last left.
  registerTab('gates', {
    onEnter: () => {
      const b = qubitMain.getBloch();
      rendererGates.cur = { ...b };
      rendererGates.draw(b.x, b.y, b.z, qubitMain.getLabel());
      document.getElementById('label-gates').textContent = qubitMain.getLabel();
    }
  });

  // gate.desc/formalName render translated text (see t() calls in
  // renderGateGrid/buildRotationButtons/buildGateReference below), so a
  // language switch needs these three rebuilt — each clears its own
  // container first, so calling them again is safe, not a duplicate-append.
  onLangChange(() => {
    renderGateGrid();
    buildRotationButtons();
    buildGateReference();
    buildQuantumGateTruthTable('gates-truth-table');
    buildQuantumGateTruthTable('gates-compare-quantum-table');
    buildAllClassicalGatesTruthTables('gates-compare-classical-table');
  });
}

// ─── TRUTH TABLE (item 13) ─────────────────────────────────────────────
/** Formats a basis-state output (two complex amplitudes) as a ket sum,
 *  e.g. (0.707)|0⟩ + (-0.707)|1⟩ — a coefficient of exactly 1 is shown as
 *  a bare ket (|1⟩, not (1)|1⟩) since that's the common case (X, Z, S, T
 *  acting on one of the two basis states). */
function formatKetOutput(c0, c1) {
  const parts = [];
  [c0, c1].forEach((c, k) => {
    if (C.mag(c) <= 0.0005) return;
    const coef = C.fmt(c);
    parts.push(coef === '1' ? `|${k}⟩` : `(${coef})|${k}⟩`);
  });
  return parts.length ? parts.join(' + ') : '0';
}

/** Renders a Gate/Input/Output table into `targetId` — every fixed GATES
 *  entry's action on both basis states |0⟩ and |1⟩, computed directly
 *  from its matrix (matrix[0][basis]/matrix[1][basis] are exactly the
 *  output amplitudes for a basis-state input, since matrix-vector
 *  multiplying by a basis vector just selects that column). Rotation
 *  gates are excluded — their matrix depends on a runtime angle, so
 *  there's no single fixed table to show. Called once per gates-tab.js
 *  page (the main Quantum Gates panel's own table, item 13, and the
 *  Compare panel's quantum-side table, item 14) plus again on every
 *  language change, since the header cells go through t(). */
function buildQuantumGateTruthTable(targetId) {
  const table = document.getElementById(targetId);
  if (!table) return;
  const rows = [];
  Object.entries(GATES).forEach(([key, gate]) => {
    [0, 1].forEach(basis => {
      const c0 = gate.matrix[0][basis];
      const c1 = gate.matrix[1][basis];
      rows.push({ gate, input: basis, output: formatKetOutput(c0, c1) });
    });
  });
  table.innerHTML = `<tr><th>${t('common.gate', 'Gate')}</th><th>${t('common.input', 'Input')}</th><th>${t('common.output', 'Output')}</th></tr>` +
    rows.map(r => `<tr><td style="color:${r.gate.color};font-weight:700;">${r.gate.name}</td><td>|${r.input}⟩</td><td>${r.output}</td></tr>`).join('');
}

/** Builds the "Apply Gate" button grid — split out from buildGateButtons()
 *  so a language switch can rebuild just this (clears the grid first,
 *  so calling it again is idempotent rather than duplicating buttons). */
function renderGateGrid() {
  const grid = document.getElementById('gate-grid');
  grid.innerHTML = '';
  Object.entries(GATES).forEach(([key, gate]) => {
    const btn = document.createElement('button');
    btn.className = 'gate-btn';
    btn.dataset.gateKey = key;
    btn.style.color       = gate.color;
    btn.style.borderColor = gate.color + '44';
    btn.innerHTML = `${gate.name}<span class="gate-sub">${t(`gates.${key}.desc`, gate.desc)}</span>`;
    btn.addEventListener('click', () => applyGate(key, btn));
    grid.appendChild(btn);
  });
}

function applyGate(key, btn) {
  const gate = GATES[key];
  qubitMain.applyGate(gate.matrix);
  showMatrix(key);
  updateQubitUI();
  if (btn) pulseElement(btn, 'pulsing');
  pulseElement(document.querySelector('#tab-gates .bloch-wrap'), 'pulsing', 550);

  const p0 = Math.round(qubitMain.prob0() * 100);
  const p1 = Math.round(qubitMain.prob1() * 100);
  const explain = `<strong style="color:${gate.color}">${gate.name} — ${gate.desc}.</strong> ${gate.explain} <br><br>New odds: ${p0}% |0⟩, ${p1}% |1⟩ — state is now <span style="font-family:'JetBrains Mono',monospace">${qubitMain.getFormula()}</span>.`;
  setExplainer('gate-explainer', explain);

  const b = qubitMain.getBloch();
  gateHistory.push({ label: gate.name, color: gate.color, theta: b.theta, phi: b.phi, matrixKey: key, explain });
  gateHistoryCursor = gateHistory.length - 1;
  updateGatesUI();
}

function showMatrix(key) {
  const gate = GATES[key];
  const [[a, b], [c, d]] = gate.matrixStr;
  document.getElementById('matrix-display').innerHTML = `
    <div class="matrix-name">${gate.name} =</div>
    <div class="matrix-body">
      <span class="matrix-bracket">[</span>
      <div class="matrix-cells">
        <span class="matrix-cell" style="color:${gate.color}">${a}</span>
        <span class="matrix-cell" style="color:${gate.color}">${b}</span>
        <span class="matrix-cell" style="color:${gate.color}">${c}</span>
        <span class="matrix-cell" style="color:${gate.color}">${d}</span>
      </div>
      <span class="matrix-bracket">]</span>
    </div>
  `;
}

// ─── ROTATION GATES ───────────────────────────────────────────────────
function buildRotationButtons() {
  const grid = document.getElementById('rotation-gate-grid');
  grid.innerHTML = '';
  Object.entries(ROTATION_GATES).forEach(([axis, gate]) => {
    const btn = document.createElement('button');
    btn.className = 'gate-btn';
    btn.style.color       = gate.color;
    btn.style.borderColor = gate.color + '44';
    btn.innerHTML = `${gate.label}<span class="gate-sub">${t(`rotationGates.${axis}.desc`, gate.desc)}</span>`;
    btn.addEventListener('click', () => {
      const angleDeg = parseInt(document.getElementById('rotation-angle').value, 10);
      applyRotationGate(axis, angleDeg, btn);
    });
    grid.appendChild(btn);
  });
  document.getElementById('rotation-angle').addEventListener('input', updateRotationAngleLabel);
}

function updateRotationAngleLabel() {
  const val = document.getElementById('rotation-angle').value;
  document.getElementById('rotation-angle-val').textContent = val + '°';
}

/* A permanent, always-visible glossary of what each gate letter stands
   for (Hadamard, the three Pauli gates, the phase gates) — the buttons
   above only show playful nicknames, so this is the one place a visitor
   can see the formal names without having to hover or apply a gate first. */
function buildGateReference() {
  const rows = [
    ...Object.entries(GATES).map(([key, g]) => ({ key, ns: 'gates', name: g.name, color: g.color, formalName: g.formalName, desc: g.desc })),
    ...Object.entries(ROTATION_GATES).map(([key, g]) => ({ key, ns: 'rotationGates', name: g.label, color: g.color, formalName: g.formalName, desc: g.desc }))
  ];
  document.getElementById('gate-reference-list').innerHTML = rows.map(g => `
    <div class="gate-reference-row">
      <span class="gate-reference-symbol" style="color:${g.color}">${g.name}</span>
      <span class="gate-reference-formal">${t(`${g.ns}.${g.key}.formalName`, g.formalName)}</span>
      <span class="gate-reference-nick">${t(`${g.ns}.${g.key}.desc`, g.desc)}</span>
    </div>
  `).join('');
}

function applyRotationGate(axis, angleDeg, btn) {
  const gate = ROTATION_GATES[axis];
  const matrix = rotationMatrix(axis, angleDeg);
  qubitMain.applyGate(matrix);
  showRotationMatrix(axis, angleDeg, matrix);
  updateQubitUI();
  if (btn) pulseElement(btn, 'pulsing');
  pulseElement(document.querySelector('#tab-gates .bloch-wrap'), 'pulsing', 550);

  const p0 = Math.round(qubitMain.prob0() * 100);
  const p1 = Math.round(qubitMain.prob1() * 100);
  const explain = `<strong style="color:${gate.color}">${gate.label}(${angleDeg}°) — ${gate.desc}.</strong> Unlike the fixed gates above, you choose exactly how far this one turns — drag the angle slider and apply it again to see the difference. <br><br>New odds: ${p0}% |0⟩, ${p1}% |1⟩ — state is now <span style="font-family:'JetBrains Mono',monospace">${qubitMain.getFormula()}</span>.`;
  setExplainer('gate-explainer', explain);

  const b = qubitMain.getBloch();
  gateHistory.push({ label: `${gate.label}(${angleDeg}°)`, color: gate.color, theta: b.theta, phi: b.phi, matrix, rotationAxis: axis, rotationAngle: angleDeg, explain });
  gateHistoryCursor = gateHistory.length - 1;
  updateGatesUI();
}

function showRotationMatrix(axis, angleDeg, matrix) {
  const gate = ROTATION_GATES[axis];
  const cells = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1]].map(z => C.fmt(z));
  document.getElementById('matrix-display').innerHTML = `
    <div class="matrix-name">${gate.label}(${angleDeg}°) =</div>
    <div class="matrix-body">
      <span class="matrix-bracket">[</span>
      <div class="matrix-cells">
        <span class="matrix-cell" style="color:${gate.color}">${cells[0]}</span>
        <span class="matrix-cell" style="color:${gate.color}">${cells[1]}</span>
        <span class="matrix-cell" style="color:${gate.color}">${cells[2]}</span>
        <span class="matrix-cell" style="color:${gate.color}">${cells[3]}</span>
      </div>
      <span class="matrix-bracket">]</span>
    </div>
  `;
}

let gateHistoryCursor = -1; // index of the entry currently on screen — not always the last one, once a rollback click has fired

function updateGatesUI() {
  const b = qubitMain.getBloch();
  rendererGates.animateTo(b.x, b.y, b.z, qubitMain.getLabel());
  document.getElementById('bloch-gates').setAttribute('aria-label',
    `Bloch sphere. State: ${qubitMain.getFormula()}.`);
  document.getElementById('label-gates').textContent = qubitMain.getLabel();
  renderGateHistory();
}

/** Renders gateHistory as clickable rollback chips (real <button>s, same
 *  .hist-tag/.is-current styling as every other Try Me's history — see
 *  components.css) — click any step, whether it came from manually
 *  clicking gates or from a Try Me run, and it restores that exact
 *  snapshot via restoreGateHistoryStep() below. */
function renderGateHistory() {
  const hist = document.getElementById('gate-history');
  if (!gateHistory.length) {
    hist.innerHTML = '<span class="muted-text">—</span>';
    return;
  }
  hist.innerHTML = '';
  gateHistory.forEach((entry, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hist-tag' + (i === gateHistoryCursor ? ' is-current' : '');
    chip.style.color = entry.color;
    chip.style.borderColor = entry.color + '44';
    chip.textContent = entry.label;
    chip.title = 'Click to revisit this step and re-read its explanation';
    chip.addEventListener('click', () => {
      // A Try Me run disables the gate/rotation buttons for its
      // duration (see initGatesTryMe()) — same signal doubles as the
      // "don't let a rollback click fight the next auto-play tick"
      // guard every other Try Me's chips use.
      if (document.getElementById('btn-gates-tryme').disabled) return;
      restoreGateHistoryStep(i);
    });
    hist.appendChild(chip);
  });
}

/** Rollback — jumps the qubit straight to history entry `i`'s recorded
 *  (theta, phi) snapshot rather than replaying gates, so it works the
 *  same whether that step came from a compounding manual sequence or a
 *  Try Me step that reset to |0⟩ first. Also restores the matrix display
 *  and explainer text exactly as they were at that step, and does NOT
 *  push a new history entry — rollback navigates the trail, it doesn't
 *  extend it. */
function restoreGateHistoryStep(i) {
  const entry = gateHistory[i];
  if (!entry) return;
  gateHistoryCursor = i;
  qubitMain.setState(entry.theta, entry.phi);
  if (entry.rotationAxis) showRotationMatrix(entry.rotationAxis, entry.rotationAngle, entry.matrix);
  else showMatrix(entry.matrixKey);
  setExplainer('gate-explainer', entry.explain);
  updateGatesUI();
  updateQubitUI();
}

const GATES_TRYME_INTERVAL_MS = 2800; // each step's explainer paragraph is a few sentences long — needs real reading time, not just animation-settle time

/** Tours every fixed gate (H, X, Y, Z, S, T) once, resetting to |0⟩
 *  before each so every gate's effect is shown against the same
 *  baseline instead of compounding on top of the last one — matching
 *  this tab's own framing ("Pick one gate and see its immediate
 *  effect"), not a sequence to chain. Reuses runTryMeSequence() from
 *  qubit-tab.js (loaded earlier, shared global scope) rather than
 *  duplicating its disable/loop/interval bookkeeping. */
function initGatesTryMe() {
  document.getElementById('btn-gates-tryme').addEventListener('click', () => {
    const gateBtns = document.querySelectorAll('#gate-grid .gate-btn');
    runTryMeSequence({
      button: document.getElementById('btn-gates-tryme'),
      disableEls: [
        ...gateBtns,
        ...document.querySelectorAll('#rotation-gate-grid .gate-btn'),
        document.getElementById('rotation-angle'),
        document.getElementById('btn-reset-gates')
      ],
      states: Object.keys(GATES),
      applyState: key => {
        qubitMain = new Qubit();
        applyGate(key, document.querySelector(`#gate-grid [data-gate-key="${key}"]`));
      },
      intervalMs: GATES_TRYME_INTERVAL_MS
    });
  });
}

function resetGates() {
  qubitMain   = new Qubit();
  gateHistory = [];
  gateHistoryCursor = -1;
  document.getElementById('matrix-display').innerHTML = '<span class="muted-text">← select a gate</span>';
  setExplainer('gate-explainer', 'Back to |0⟩ — the qubit points straight up on the sphere, no gates applied yet. Click one to send it rotating.');
  updateGatesUI();
  updateQubitUI();
}


// ════════ js/tabs/circuit-tab.js ════════
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


// ════════ js/tabs/circuit-multiqubit-tab.js ════════
// Depends on: core/gates.js (GATES), core/qubit.js (blochVectorLabel),
// core/two-qubit.js (TwoQubitState), core/three-qubit.js (ThreeQubitState),
// core/dom-utils.js (setExplainer, renderTryMe, buildGatePalette),
// core/utils.js (delay), app.js state (rendererCircuit2, rendererCircuit3).
//
// The 2-qubit and 3-qubit circuit builders, reachable via the "2 Qubits"/
// "3 Qubits" mode toggle at the top of the Quantum Circuit panel (see
// setCircuitMode() below). Replaces what used to be two separate,
// ~90%-identical files (circuit2-tab.js/circuit3-tab.js) — same gate-entry
// data model (a flat, sequential array of
// {type:'single',qubit,key}/{type:'cnot',control,target} entries), same
// CSS-Grid diagram algorithm, same run/status/explainer pattern — with one
// shared implementation parameterized by a small per-qubit-count config
// (see CIRCUIT2_CONFIG/CIRCUIT3_CONFIG below) instead of copy-pasted code.
// makeMultiQubitCircuit(cfg) returns a plain "instance" object holding the
// mutable per-builder state (gates/targetQubit/state); the functions below
// take that instance as their first argument rather than being methods on
// it, matching this codebase's preference for plain functions over classes
// for UI-glue code (TwoQubitState/ThreeQubitState/BlochRenderer are real
// classes because they carry real invariants — this is just wiring).
//
// The single-qubit circuit (tabs/circuit-tab.js) is NOT part of this —
// it's a genuinely different UI (a linear "checkpoint wire", one Bloch
// sphere, no CNOT, no per-wire targeting), not a smaller copy of this one.
// Folding it in here would mean redesigning its markup to fit this grid-
// diagram shape, not just deduplicating code.

const CIRCUIT_MULTIQUBIT_MAX_STEPS = 10;

const CIRCUIT3_KETS = ['000', '001', '010', '011', '100', '101', '110', '111'];

/** A standard Bell pair, a same-basis flip that needs no entanglement at
 *  all, and an anti-correlated Bell variant (X on the target qubit before
 *  the CNOT flips which pairs show up) — three sequences that each land
 *  on a different, recognizable two-qubit state. */
const CIRCUIT2_PRESETS = [
  { name: 'Bell Pair',       gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'cnot', control: 0, target: 1 }] },
  { name: 'Flip Both',       gates: [{ type: 'single', qubit: 0, key: 'X' }, { type: 'single', qubit: 1, key: 'X' }] },
  { name: 'Anti-Correlated', gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'single', qubit: 1, key: 'X' }, { type: 'cnot', control: 0, target: 1 }] }
];

/** A star-topology GHZ state (one H, then CNOT out to each other qubit),
 *  a plain triple flip needing no entanglement, a Bell pair on just two
 *  of the three wires, and a Half Adder — Q0/Q1 are set to A=1/B=1 (via
 *  X), Toffoli(Q0,Q1,Q2) computes Carry = A·B into Q2 *before* Q1 is
 *  touched again, then CNOT(Q0,Q1) computes Sum = A⊕B into Q1 in place —
 *  the standard reversible-logic trick that fits a full half adder into
 *  exactly 3 qubits (Q0 keeps A unchanged, Q1 ends up holding Sum, Q2
 *  ends up holding Carry). Ends at |101⟩: A=1 (Q0), Sum=0 (Q1), Carry=1
 *  (Q2) — the one input combination where a half adder actually needs
 *  its Carry output. */
const CIRCUIT3_PRESETS = [
  { name: 'GHZ State',        gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'cnot', control: 0, target: 1 }, { type: 'cnot', control: 0, target: 2 }] },
  { name: 'Flip All Three',   gates: [{ type: 'single', qubit: 0, key: 'X' }, { type: 'single', qubit: 1, key: 'X' }, { type: 'single', qubit: 2, key: 'X' }] },
  { name: 'Partial Entangle', gates: [{ type: 'single', qubit: 0, key: 'H' }, { type: 'cnot', control: 0, target: 1 }] },
  { name: 'Half Adder (A=1,B=1)', gates: [
      { type: 'single', qubit: 0, key: 'X' },
      { type: 'single', qubit: 1, key: 'X' },
      { type: 'toffoli', control1: 0, control2: 1, target: 2 },
      { type: 'cnot', control: 0, target: 1 }
    ] }
];

// ═══════════════════════════════════════════════════════════════════
// PER-QUBIT-COUNT CONFIG
// ═══════════════════════════════════════════════════════════════════
const CIRCUIT2_CONFIG = {
  n: 2,
  prefix: '2q',
  StateClass: TwoQubitState,
  kets: ['00', '01', '10', '11'],
  presets: CIRCUIT2_PRESETS,
  paletteId: 'circuit-2q-palette',
  // 2Q's target-qubit toggle uses a different HTML attribute name than
  // 3Q's (data-target-qubit vs data-target-qubit3, not just a different
  // value) — that's the only thing keeping an unscoped querySelectorAll
  // from matching both panels' buttons at once, so it's config, not a
  // shared constant.
  targetQubitSelector: '.mode-btn[data-target-qubit]',
  targetQubitDatasetKey: 'targetQubit',
  // 2 qubits only have 2 possible CNOT directions, so they get two fixed
  // buttons rather than 3Q's <select> pair (6 possible pairs is too many
  // for individual buttons).
  wireCnotControls(inst) {
    document.getElementById('btn-add-cnot-01').addEventListener('click', () => addGate(inst, { type: 'cnot', control: 0, target: 1 }));
    document.getElementById('btn-add-cnot-10').addEventListener('click', () => addGate(inst, { type: 'cnot', control: 1, target: 0 }));
  },
  startMessage: 'Both qubits start at |00⟩ and step through the sequence in order…',
  clearMessage: 'Two qubits, no entanglement yet. Try adding H to Qubit 0, then CNOT Q0→Q1, then press Run — that\'s the exact recipe behind the Bell state you saw in the Entangle tab, except this time you built it gate by gate.',
  describeOutcome(state) {
    const p00 = state.prob(0), p11 = state.prob(3);
    const entangled = p00 > 0.001 && p11 > 0.001 && state.prob(1) < 0.001 && state.prob(2) < 0.001;
    return entangled
      ? `That's an entangled pair: only |00⟩ (${Math.round(p00 * 100)}%) and |11⟩ (${Math.round(p11 * 100)}%) show up — measuring one qubit instantly tells you the other, exactly like the Entangle tab, except this time H + CNOT built it from scratch.`
      : `Sequence complete. Final state: ${state.getFormula()}.`;
  }
};

const CIRCUIT3_CONFIG = {
  n: 3,
  prefix: '3q',
  StateClass: ThreeQubitState,
  kets: CIRCUIT3_KETS,
  presets: CIRCUIT3_PRESETS,
  paletteId: 'circuit-3q-palette',
  targetQubitSelector: '.mode-btn[data-target-qubit3]',
  targetQubitDatasetKey: 'targetQubit3',
  wireCnotControls(inst) {
    const control = document.getElementById('cnot3-control');
    const target  = document.getElementById('cnot3-target');
    [control, target].forEach(sel => {
      sel.innerHTML = [0, 1, 2].map(q => `<option value="${q}">Qubit ${q}</option>`).join('');
    });
    target.value = '1'; // default control=0, target=1 — a usable pair out of the box
    document.getElementById('btn-add-cnot3').addEventListener('click', () => {
      const c = parseInt(control.value, 10);
      const t = parseInt(target.value, 10);
      if (c === t) { setStatus(inst, 'Control and target must be different qubits'); return; }
      addGate(inst, { type: 'cnot', control: c, target: t });
    });
  },
  // Toffoli (CCNOT) — 3Q-only (needs 3 distinct qubits: 2 controls + 1
  // target, exactly what this builder has), so this is its own config
  // field rather than something CIRCUIT2_CONFIG also defines; guarded by
  // an existence check in makeMultiQubitCircuit() below.
  wireToffoliControls(inst) {
    const control1 = document.getElementById('toffoli3-control1');
    const control2 = document.getElementById('toffoli3-control2');
    const target    = document.getElementById('toffoli3-target');
    [control1, control2, target].forEach(sel => {
      sel.innerHTML = [0, 1, 2].map(q => `<option value="${q}">Qubit ${q}</option>`).join('');
    });
    control2.value = '1'; target.value = '2'; // default controls=0,1 -> target=2, a usable triple out of the box
    document.getElementById('btn-add-toffoli3').addEventListener('click', () => {
      const c1 = parseInt(control1.value, 10);
      const c2 = parseInt(control2.value, 10);
      const t  = parseInt(target.value, 10);
      if (c1 === c2 || c1 === t || c2 === t) { setStatus(inst, 'Controls and target must all be different qubits'); return; }
      addGate(inst, { type: 'toffoli', control1: c1, control2: c2, target: t });
    });
  },
  startMessage: 'All three qubits start at |000⟩ and step through the sequence in order…',
  clearMessage: 'Three qubits, all starting at |000⟩. Try H on Qubit 0, then CNOT Q0→Q1, then CNOT Q0→Q2 — that recipe spreads one qubit\'s coin flip across all three, a three-way GHZ state.',
  describeOutcome(state) {
    const p000 = state.prob(0), p111 = state.prob(7);
    const others = [1, 2, 3, 4, 5, 6].every(i => state.prob(i) < 0.001);
    const ghz = p000 > 0.001 && p111 > 0.001 && others;
    return ghz
      ? `That's a GHZ state: only |000⟩ (${Math.round(p000 * 100)}%) and |111⟩ (${Math.round(p111 * 100)}%) show up — measuring any one of the three qubits instantly tells you all three, a three-way version of the entangled pair from the Entangle tab.`
      : `Sequence complete. Final state: ${state.getFormula()}.`;
  }
};

let circuit2, circuit3; // the two live instances, built by initCircuit2Tab()/initCircuit3Tab()

// ═══════════════════════════════════════════════════════════════════
// INSTANCE FACTORY
// ═══════════════════════════════════════════════════════════════════
function makeMultiQubitCircuit(cfg) {
  const inst = {
    n: cfg.n,
    prefix: cfg.prefix,
    kets: cfg.kets,
    cfg,
    gates: [],
    targetQubit: 0,
    state: new cfg.StateClass(),
    // Run History (rollback) — see runSequence()/renderHistory() below.
    history: [],
    historyCursor: -1,
    running: false
  };

  document.querySelectorAll(cfg.targetQubitSelector).forEach(btn => {
    btn.addEventListener('click', () => {
      inst.targetQubit = parseInt(btn.dataset[cfg.targetQubitDatasetKey], 10);
      document.querySelectorAll(cfg.targetQubitSelector).forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  buildGatePalette(cfg.paletteId, key => addGate(inst, { type: 'single', qubit: inst.targetQubit, key }));
  cfg.wireCnotControls(inst);
  if (cfg.wireToffoliControls) cfg.wireToffoliControls(inst);
  document.getElementById(`btn-run-circuit-${cfg.prefix}`).addEventListener('click', () => runSequence(inst));
  document.getElementById(`btn-clear-circuit-${cfg.prefix}`).addEventListener('click', () => clearSequence(inst));
  renderTryMe(`circuit-${cfg.prefix}-try-me`, cfg.presets, preset => loadPreset(inst, preset));

  renderDiagram(inst);
  updateUI(inst);
  renderHistory(inst);

  return inst;
}

/** 1Q/2Q/3Q panel switch nested inside the Quantum Circuit builder (see
 *  the "Quantum" domain of setCircuitDomain() in circuit-tab.js) — wired
 *  once, from initCircuit2Tab() below, since it isn't specific to either
 *  qubit-count instance. */
function setCircuitMode(mode) {
  document.querySelectorAll('.mode-btn[data-circuit-mode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.circuitMode === mode));
  document.getElementById('circuit-1q-panel').style.display = mode === '1q' ? '' : 'none';
  document.getElementById('circuit-2q-panel').style.display = mode === '2q' ? '' : 'none';
  document.getElementById('circuit-3q-panel').style.display = mode === '3q' ? '' : 'none';
}

function initCircuit2Tab() {
  document.querySelectorAll('.mode-btn[data-circuit-mode]').forEach(btn => {
    btn.addEventListener('click', () => setCircuitMode(btn.dataset.circuitMode));
  });
  circuit2 = makeMultiQubitCircuit(CIRCUIT2_CONFIG);
}

function initCircuit3Tab() {
  circuit3 = makeMultiQubitCircuit(CIRCUIT3_CONFIG);
}

// ═══════════════════════════════════════════════════════════════════
// SHARED LOGIC (operates on whichever instance is passed in)
// ═══════════════════════════════════════════════════════════════════
function entryLabel(entry) {
  if (entry.type === 'cnot') return `CNOT Q${entry.control}→Q${entry.target}`;
  if (entry.type === 'toffoli') return `Toffoli Q${entry.control1},Q${entry.control2}→Q${entry.target}`;
  return `${GATES[entry.key].name} on Q${entry.qubit}`;
}

function addGate(inst, entry) {
  if (inst.gates.length >= CIRCUIT_MULTIQUBIT_MAX_STEPS) {
    setStatus(inst, 'Sequence full — clear to reset');
    return;
  }
  inst.gates.push(entry);
  renderDiagram(inst);
  setStatus(inst, '');
}

function removeGate(inst, i) {
  inst.gates.splice(i, 1);
  renderDiagram(inst);
}

function loadPreset(inst, preset) {
  inst.gates = preset.gates.map(g => ({ ...g }));
  renderDiagram(inst);
  runSequence(inst);
}

/**
 * Renders inst.gates[] as an actual N-wire circuit diagram: one CSS Grid
 * with `inst.n` rows and CIRCUIT_MULTIQUBIT_MAX_STEPS columns. Each
 * gates[] entry owns one column, shared by every row — a CNOT's control
 * dot, target ⊕, and connecting line are separate grid items placed in
 * that same grid-column (their own rows, plus a line spanning between
 * them), which is what makes them line up under each other automatically
 * without any manual pixel math. Columns past inst.gates.length are empty
 * dashed placeholders.
 *
 * inst.n > 2 fills the *other* rows at a single-gate column with empty
 * placeholder cells too (so every column shows a full-height dashed
 * grid); at n=2 it doesn't (the other row gets nothing at that column) —
 * this is a real, pre-existing visual difference between the two
 * diagrams that predates this merge, preserved deliberately rather than
 * "fixed" into one look.
 */
function renderDiagram(inst) {
  const container = document.getElementById(`circuit-${inst.prefix}-diagram`);
  let html = '';

  for (let row = 1; row <= inst.n; row++) {
    html += `<div class="circuit2-ket" style="grid-column:1;grid-row:${row};">|0⟩</div>`;
    html += `<div class="circuit2-wire" style="grid-column:2/-1;grid-row:${row};"></div>`;
  }

  for (let c = 0; c < CIRCUIT_MULTIQUBIT_MAX_STEPS; c++) {
    const col   = c + 2; // grid-column 1 is the |0⟩ label
    const entry = inst.gates[c];

    if (!entry) {
      const isHint = c === 0 && inst.gates.length === 0;
      for (let row = 1; row <= inst.n; row++) {
        html += `<div class="circuit2-cell empty${isHint && row === 1 ? ' circuit2-cell-hint' : ''}" style="grid-column:${col};grid-row:${row};">${isHint && row === 1 ? '+' : ''}</div>`;
      }
      continue;
    }

    if (entry.type === 'single') {
      const g   = GATES[entry.key];
      const row = entry.qubit + 1;
      html += `<button class="circuit2-cell circuit2-gate" data-i="${c}" style="grid-column:${col};grid-row:${row};color:${g.color};border-color:${g.color}" title="${entryLabel(entry)} — click to remove">${g.name}</button>`;
      if (inst.n > 2) {
        for (let row2 = 1; row2 <= inst.n; row2++) {
          if (row2 === row) continue;
          html += `<div class="circuit2-cell empty" style="grid-column:${col};grid-row:${row2};"></div>`;
        }
      }
    } else if (entry.type === 'toffoli') {
      // Two control dots + one ⊕ target, connected by one line spanning
      // all three rows — same building blocks as CNOT below, just one
      // more control dot. Toffoli only exists in the 3Q builder (needs 3
      // distinct qubits), so the three rows always exactly cover 1..n —
      // no "row neither control nor target" placeholder loop needed here.
      const c1Row = entry.control1 + 1;
      const c2Row = entry.control2 + 1;
      const tRow  = entry.target + 1;
      const lineStart = Math.min(c1Row, c2Row, tRow);
      const lineEnd   = Math.max(c1Row, c2Row, tRow) + 1;
      html += `<div class="circuit2-cnot-line" style="grid-column:${col};grid-row:${lineStart}/${lineEnd};"></div>`;
      html += `<button class="circuit2-cell circuit2-cnot-dot" data-i="${c}" style="grid-column:${col};grid-row:${c1Row};" title="${entryLabel(entry)} — click to remove"></button>`;
      html += `<button class="circuit2-cell circuit2-cnot-dot" data-i="${c}" style="grid-column:${col};grid-row:${c2Row};" title="${entryLabel(entry)} — click to remove"></button>`;
      html += `<button class="circuit2-cell circuit2-cnot-target" data-i="${c}" style="grid-column:${col};grid-row:${tRow};" title="${entryLabel(entry)} — click to remove">⊕</button>`;
    } else {
      const controlRow = entry.control + 1;
      const targetRow  = entry.target + 1;
      const lineStart  = Math.min(controlRow, targetRow);
      const lineEnd    = Math.max(controlRow, targetRow) + 1;
      html += `<div class="circuit2-cnot-line" style="grid-column:${col};grid-row:${lineStart}/${lineEnd};"></div>`;
      html += `<button class="circuit2-cell circuit2-cnot-dot" data-i="${c}" style="grid-column:${col};grid-row:${controlRow};" title="${entryLabel(entry)} — click to remove"></button>`;
      html += `<button class="circuit2-cell circuit2-cnot-target" data-i="${c}" style="grid-column:${col};grid-row:${targetRow};" title="${entryLabel(entry)} — click to remove">⊕</button>`;
      // Any row that's neither control nor target gets an empty
      // placeholder too — zero iterations at n=2 (both rows are always
      // control/target at that size), exactly one at n=3.
      for (let row2 = 1; row2 <= inst.n; row2++) {
        if (row2 === controlRow || row2 === targetRow) continue;
        html += `<div class="circuit2-cell empty" style="grid-column:${col};grid-row:${row2};"></div>`;
      }
    }
  }

  container.innerHTML = html;
  container.querySelectorAll('[data-i]').forEach(el => {
    el.addEventListener('click', () => removeGate(inst, parseInt(el.dataset.i, 10)));
  });
}

// CNOT/Toffoli steps have no single GATES entry of their own to borrow a
// color from (they span multiple qubits) — these are just fixed,
// theme-legible colors for their history chips, not tied to any GATES color.
const CNOT_HIST_COLOR    = '#5B8DEF';
const TOFFOLI_HIST_COLOR = '#34D399';

function describeStepColor(entry) {
  if (entry.type === 'cnot') return CNOT_HIST_COLOR;
  if (entry.type === 'toffoli') return TOFFOLI_HIST_COLOR;
  return GATES[entry.key].color;
}

/** The detailed, per-step "What's going on" writeup stored on each Run
 *  History entry (see restoreHistoryStep()) as well as shown live during
 *  Run — same depth as every other gate/circuit explainer in the app,
 *  not just the terse "Step N of M" status line. */
function describeStepExplain(entry, i, formula) {
  const color = describeStepColor(entry);
  if (entry.type === 'cnot') {
    return `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)}.</strong> Flips Q${entry.target}'s bit whenever Q${entry.control} is |1⟩ — the entangling move behind every Bell pair and GHZ state. ` +
      `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`;
  }
  if (entry.type === 'toffoli') {
    return `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)}.</strong> Flips Q${entry.target}'s bit only when BOTH Q${entry.control1} and Q${entry.control2} are |1⟩ — with the target starting at |0⟩, that computes Q${entry.target} = Q${entry.control1} AND Q${entry.control2}, the Carry half of a half adder (a Toffoli is the reversible-logic stand-in for a classical AND gate). ` +
      `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`;
  }
  const gate = GATES[entry.key];
  return `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)} — ${gate.desc}.</strong> ${gate.explain} ` +
    `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`;
}

async function runSequence(inst) {
  if (inst.running) return;
  if (inst.gates.length === 0) {
    setStatus(inst, 'Add gates first');
    return;
  }
  inst.running = true;
  inst.state = new inst.cfg.StateClass();
  setStatus(inst, 'Running…');
  setExplainerFor(inst, inst.cfg.startMessage);
  inst.history = [];
  inst.historyCursor = -1;
  renderHistory(inst);

  for (let i = 0; i < inst.gates.length; i++) {
    const entry = inst.gates[i];
    const stepEls = document.querySelectorAll(`#circuit-${inst.prefix}-diagram [data-i="${i}"]`);
    stepEls.forEach(el => el.classList.add('running'));
    setExplainerFor(inst, `Step ${i + 1} of ${inst.gates.length}: ${entryLabel(entry)}.`);
    await delay(320);
    if (entry.type === 'cnot') {
      inst.state.applyCNOT(entry.control, entry.target);
    } else if (entry.type === 'toffoli') {
      inst.state.applyToffoli(entry.control1, entry.control2, entry.target);
    } else {
      inst.state.applySingleQubitGate(entry.qubit, GATES[entry.key].matrix);
    }
    updateUI(inst);
    inst.history.push({
      amps: inst.state.amps.map(a => ({ ...a })), // cloned — later steps mutate inst.state.amps in place
      label: String(i + 1),
      color: describeStepColor(entry),
      title: `Step ${i + 1}: ${entryLabel(entry)} — ${inst.state.getFormula()}`,
      explain: describeStepExplain(entry, i, inst.state.getFormula())
    });
    inst.historyCursor = inst.history.length - 1;
    renderHistory(inst);
    await delay(130);
    stepEls.forEach(el => el.classList.remove('running'));
  }

  inst.running = false;
  setStatus(inst, 'Done');
  setExplainerFor(inst, inst.cfg.describeOutcome(inst.state));
}

/** Renders inst.history as clickable rollback chips (same .hist-tag/
 *  .is-current pattern as every other Run History / Try Me trail). */
function renderHistory(inst) {
  const hist = document.getElementById(`circuit-${inst.prefix}-history`);
  if (!hist) return;
  if (!inst.history.length) { hist.innerHTML = '<span class="muted-text">—</span>'; return; }
  hist.innerHTML = '';
  inst.history.forEach((entry, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hist-tag' + (i === inst.historyCursor ? ' is-current' : '');
    chip.style.color = entry.color;
    chip.style.borderColor = entry.color + '44';
    chip.textContent = entry.label;
    chip.title = entry.title;
    chip.addEventListener('click', () => {
      if (inst.running) return;
      restoreHistoryStep(inst, i);
    });
    hist.appendChild(chip);
  });
}

/** Rollback — restores step `i`'s cloned amplitude snapshot directly
 *  rather than replaying gates, so it's correct regardless of how
 *  entangled the state became along the way — and restores the "What's
 *  going on" explainer to exactly what it said at that step, not just
 *  the state/formula. */
function restoreHistoryStep(inst, i) {
  const entry = inst.history[i];
  if (!entry) return;
  inst.historyCursor = i;
  inst.state.amps = entry.amps.map(a => ({ ...a }));
  updateUI(inst);
  renderHistory(inst);
  setStatus(inst, `Step ${entry.label} of ${inst.history.length}`);
  setExplainerFor(inst, entry.explain);
}

function clearSequence(inst) {
  inst.gates = [];
  inst.state = new inst.cfg.StateClass();
  renderDiagram(inst);
  updateUI(inst);
  setStatus(inst, '');
  setExplainerFor(inst, inst.cfg.clearMessage);
  inst.history = [];
  inst.historyCursor = -1;
  renderHistory(inst);
}

function setStatus(inst, msg) {
  document.getElementById(`circuit-${inst.prefix}-status`).textContent = msg;
}

function setExplainerFor(inst, msg) {
  setExplainer(`circuit-${inst.prefix}-explainer`, msg);
}

/** Updates the formula line, both/all per-qubit mini Bloch spheres (their
 *  own reduced single-qubit states — see TwoQubitState/
 *  ThreeQubitState.getSingleQubitBloch()), and the full joint-probability
 *  table, generated fresh from inst.kets every call (both circuit-2q-probs
 *  and circuit-3q-probs are empty containers in index.html — 2Q's 4 rows
 *  are just as easy to generate as 3Q's 8, so both go through the same
 *  code instead of 2Q having its own hand-written static markup). */
function updateUI(inst) {
  document.getElementById(`circuit-${inst.prefix}-formula`).textContent = inst.state.getFormula();

  const renderers = inst.n === 2 ? rendererCircuit2 : rendererCircuit3;
  for (let i = 0; i < inst.n; i++) {
    const b = inst.state.getSingleQubitBloch(i);
    const label = blochVectorLabel(b.x, b.y, b.z);
    renderers[i].animateTo(b.x, b.y, b.z, label);
    document.getElementById(`mini-label-${inst.prefix}-${i}`).textContent = label;
  }

  const last = inst.kets.length - 1;
  const container = document.getElementById(`circuit-${inst.prefix}-probs`);
  container.innerHTML = inst.kets.map((ket, i) => {
    const pct       = inst.state.prob(i) * 100;
    const color     = i === 0 ? 'var(--zero)' : i === last ? 'var(--one)' : 'var(--text2)';
    const fillClass = i === 0 ? 'zero-fill'   : i === last ? 'one-fill'   : '';
    const fillStyle = fillClass ? '' : 'background:var(--text2);';
    return `
      <div class="prob-row">
        <span class="ket" style="color:${color}">|${ket}⟩</span>
        <div class="track"><div class="fill ${fillClass}" style="${fillStyle}width:${pct}%" id="c${inst.n}-fill-${ket}"></div></div>
        <span class="pct" id="c${inst.n}-pct-${ket}">${Math.round(pct)}%</span>
      </div>`;
  }).join('');
}


// ════════ js/tabs/classical-circuit-tab.js ════════
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


// ════════ js/tabs/classical-gates-tab.js ════════
// Depends on: tabs/classical-circuit-tab.js (CLASSICAL_GATES),
// core/dom-utils.js (setExplainer).
// The Gates tab's classical counterpart, reachable via its own
// Classical/Quantum domain toggle (see setGatesDomain() in gates-tab.js).
// Pick ONE gate and see its immediate effect — the same single-gate
// paradigm the quantum side of this tab already uses (apply one gate,
// read the result), as opposed to Circuits' build-a-sequence paradigm.
// Reuses CLASSICAL_GATES rather than redefining the gate table — script
// load order doesn't matter here since this only reads it from inside a
// function body, called after every script has already run.

let gatesClassicalGate = 'AND';
let gcInputA = 1;
let gcInputB = 1;

function initClassicalGatesTab() {
  buildClassicalGatesPalette();
  document.getElementById('gc-input-a').addEventListener('change', e => {
    gcInputA = e.target.checked ? 1 : 0;
    updateClassicalGatesUI();
  });
  document.getElementById('gc-input-b').addEventListener('change', e => {
    gcInputB = e.target.checked ? 1 : 0;
    updateClassicalGatesUI();
  });
  updateClassicalGatesUI();
}

function buildClassicalGatesPalette() {
  const palette = document.getElementById('gc-gate-palette');
  Object.entries(CLASSICAL_GATES).forEach(([key, gate]) => {
    const btn = document.createElement('button');
    btn.className    = 'circuit-gate-btn classical-gate-btn classical-gate-palette-btn';
    btn.innerHTML    = `${classicalGateIconSVG(key)}<span class="circuit-gate-btn-label">${gate.name}</span>`;
    btn.title        = gate.desc;
    btn.dataset.gate = key;
    btn.addEventListener('click', () => selectClassicalGatesGate(key));
    palette.appendChild(btn);
  });
  updateClassicalGatesPaletteActive();
}

function updateClassicalGatesPaletteActive() {
  document.querySelectorAll('#gc-gate-palette .classical-gate-btn').forEach(btn =>
    btn.classList.toggle('active-gate', btn.dataset.gate === gatesClassicalGate));
}

function selectClassicalGatesGate(key) {
  gatesClassicalGate = key;
  updateClassicalGatesPaletteActive();
  // NOT only ever reads input A — hide B rather than leave a switch on
  // screen that does nothing, same convention as the Circuits classical
  // builder.
  document.getElementById('gc-input-b-wrap').style.display = CLASSICAL_GATES[key].inputs === 1 ? 'none' : '';
  updateClassicalGatesUI();
}

function updateClassicalGatesUI() {
  const gate = CLASSICAL_GATES[gatesClassicalGate];
  const out  = gate.inputs === 1 ? gate.fn(gcInputA) : gate.fn(gcInputA, gcInputB);

  document.getElementById('gc-lbl-a0').classList.toggle('active', gcInputA === 0);
  document.getElementById('gc-lbl-a1').classList.toggle('active', gcInputA === 1);
  document.getElementById('gc-lbl-b0').classList.toggle('active', gcInputB === 0);
  document.getElementById('gc-lbl-b1').classList.toggle('active', gcInputB === 1);

  const display = document.getElementById('gc-output-display');
  display.textContent = out;
  display.classList.toggle('is-zero', out === 0);
  document.getElementById('gc-output-label').textContent =
    gate.inputs === 1 ? 'NOT A' : `A ${gate.name} B`;

  renderClassicalGatesTruthTable();
  setExplainer('gc-explainer', gate.explain);
}

function renderClassicalGatesTruthTable() {
  const gate  = CLASSICAL_GATES[gatesClassicalGate];
  const table = document.getElementById('gc-truth-table');
  const rows  = gate.inputs === 1
    ? [0, 1].map(a => ({ a, out: gate.fn(a) }))
    : [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => ({ a, b, out: gate.fn(a, b) }));

  const headCells = gate.inputs === 1 ? '<th>A</th>' : '<th>A</th><th>B</th>';
  let html = `<tr>${headCells}<th>Out</th></tr>`;
  html += rows.map(r => {
    const isCurrent = gate.inputs === 1
      ? r.a === gcInputA
      : r.a === gcInputA && r.b === gcInputB;
    const cells = gate.inputs === 1 ? `<td>${r.a}</td>` : `<td>${r.a}</td><td>${r.b}</td>`;
    return `<tr class="${isCurrent ? 'truth-row-active' : ''}">${cells}<td>${r.out}</td></tr>`;
  }).join('');

  table.innerHTML = html;
}

/** All-gates-at-once variant of renderClassicalGatesTruthTable() above —
 *  every CLASSICAL_GATES entry's full truth table, one after another,
 *  rather than just the currently-selected gate's. Built for the Gates
 *  tab's Compare panel (item 14), called once from gates-tab.js's
 *  buildGateButtons() plus again on every language change (the header
 *  cells go through t()). */
function buildAllClassicalGatesTruthTables(targetId) {
  const table = document.getElementById(targetId);
  if (!table) return;
  const rows = [];
  Object.entries(CLASSICAL_GATES).forEach(([key, gate]) => {
    const combos = gate.inputs === 1 ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
    combos.forEach(inputs => {
      const out = gate.inputs === 1 ? gate.fn(inputs[0]) : gate.fn(inputs[0], inputs[1]);
      rows.push({ name: gate.name, inputs: inputs.join(', '), out });
    });
  });
  table.innerHTML = `<tr><th>${t('common.gate', 'Gate')}</th><th>${t('common.input', 'Input')}</th><th>${t('common.output', 'Output')}</th></tr>` +
    rows.map(r => `<tr><td style="font-weight:700;">${r.name}</td><td>${r.inputs}</td><td>${r.out}</td></tr>`).join('');
}


// ════════ js/tabs/measure-tab.js ════════
// Depends on: core/dom-utils.js (setExplainer, drawCoin, animateCoinFlip —
// the coin is shared with tabs/entanglement-tab.js), core/theme.js
// (onThemeChange), core/tab-registry.js (registerTab), app.js state
// (qubitMeasure, measureCounts, measureCoinState, measureCoinAnimating).

// ═══════════════════════════════════════════════════════════════════
// MEASURE TAB
// ═══════════════════════════════════════════════════════════════════
function initMeasureTab() {
  document.getElementById('btn-measure').addEventListener('click', doMeasure);
  document.getElementById('btn-reset-stats').addEventListener('click', resetStats);
  document.querySelectorAll('#tab-measure .preset-btn').forEach(btn => {
    const theta = parseFloat(btn.dataset.thetaMult) * Math.PI;
    const phi   = parseFloat(btn.dataset.phiMult)   * Math.PI;
    btn.addEventListener('click', () => setMeasureState(theta, phi));
  });
  document.querySelectorAll('[data-measure-n]').forEach(btn => {
    const n = parseInt(btn.dataset.measureN, 10);
    btn.addEventListener('click', () => measureMany(n));
  });

  const redrawCoin = () => drawCoin('coin-measure', measureCoinState);
  drawCoin('coin-measure', measureCoinState);
  // Same two reasons as the Entangle tab's own coins: a redraw is needed
  // both on re-entering this tab and on a theme change, since draw()
  // always reads the live isDark/coin state.
  registerTab('measure', { onEnter: redrawCoin });
  onThemeChange(redrawCoin);
}

const MEASURE_OPENERS = [
  'The universe rolled its dice —',
  'No more hedging —',
  'The coin finally landed —',
  'Asked, and answered —',
  'The blur snapped into focus —'
];

function setMeasureState(theta, phi) {
  qubitMeasure.setState(theta, phi);
  measureCounts = { 0: 0, 1: 0 };
  resetStats(); // also resets the coin to superposition — see resetStats() below
  updateMeasureUI();
  setExplainer('measure-explainer', 'Right now the qubit hasn\'t committed to anything — it genuinely holds both |0⟩ and |1⟩ at once, weighted by the bars on the left. Hit MEASURE and you\'re forcing it to answer a yes/no question it was actively avoiding.');
}

function updateMeasureUI() {
  const p0 = qubitMeasure.prob0() * 100;
  const p1 = qubitMeasure.prob1() * 100;
  document.getElementById('formula-measure').textContent = qubitMeasure.getFormula();
  document.getElementById('vbar0').style.height = p0 + '%';
  document.getElementById('vbar1').style.height = p1 + '%';
  document.getElementById('vpct0').textContent  = Math.round(p0) + '%';
  document.getElementById('vpct1').textContent  = Math.round(p1) + '%';
}

/** MEASURE — the coin spins through both faces (genuinely undecided,
 *  same visual as the Entangle tab's coins) before landing on the
 *  outcome, rather than snapping to a result instantly; measureCoinState
 *  then holds that result until the next state change or Reset puts the
 *  coin back into superposition (see setMeasureState()/resetStats()). */
async function doMeasure() {
  if (measureCoinAnimating || measureBatchAnimating) return;
  measureCoinAnimating = true;

  const p0before = Math.round(qubitMeasure.prob0() * 100);
  const p1before = Math.round(qubitMeasure.prob1() * 100);

  document.getElementById('measure-result').textContent = '';
  document.getElementById('coin-measure-label').textContent = t('measure.measuring', 'Measuring…');
  document.getElementById('btn-measure').disabled = true;

  await animateCoinFlip('coin-measure', 9, 55);

  const result = qubitMeasure.measure();
  measureCoinState = result;
  measureCounts[result]++;

  drawCoin('coin-measure', result);
  pulseElement(document.getElementById('coin-measure'), 'collapsing');
  document.getElementById('coin-measure-label').textContent = result === 0 ? '|0⟩' : '|1⟩';

  const resEl = document.getElementById('measure-result');
  resEl.style.color   = result === 0 ? 'var(--zero)' : 'var(--one)';
  resEl.style.opacity = '1';
  resEl.textContent   = result === 0 ? '|0⟩' : '|1⟩';
  pulseElement(resEl, 'collapsing', 500);

  // The bars themselves deliberately don't move — they show the fixed odds
  // of the prepared state, not "the answer" — but a flash on whichever
  // bar matched the outcome ties the abstract percentages to what just
  // actually happened.
  const winningTrack = document.getElementById(result === 0 ? 'vbar0' : 'vbar1').closest('.vbar-track');
  winningTrack.style.color = result === 0 ? 'var(--zero)' : 'var(--one)';
  pulseElement(winningTrack, 'collapsing', 600);
  document.getElementById('btn-measure').disabled = false;
  pulseElement(document.getElementById('btn-measure'), 'pulsing');

  updateHistogram();

  const opener = MEASURE_OPENERS[Math.floor(Math.random() * MEASURE_OPENERS.length)];
  const color  = result === 0 ? 'var(--zero)' : 'var(--one)';
  setExplainer('measure-explainer',
    `${opener} <strong style="color:${color}">|${result}⟩</strong>. A split second ago the odds were ${p0before}% / ${p1before}%, and both were equally real possibilities — not "secretly already |${result}⟩ and we just didn't know." The click is what forced a choice; the superposition is gone for good. Want to see it happen again? You'll need to re-prepare the exact same state from scratch.`
  );

  measureCoinAnimating = false;
}

// A batch runs its n trials in MEASURE_BATCH_STEPS chunks rather than one
// synchronous loop — with everything computed at once, .hist-bar's own
// CSS transition (measure.css) only ever gets one old-value-to-new-value
// jump to animate, which reads as snapping straight to the final split
// instead of visibly converging toward it the way the app's other
// repeated-random-event displays do (the Beam Splitter/Stern-Gerlach
// "accumulating plate" mechanic — see js/tabs/beam-splitter-tab.js). This
// keeps every trial genuine (still n real calls to qubitMeasure.measure(),
// just paced), so ×1000 doesn't mean 1000 real DOM updates either.
const MEASURE_BATCH_STEPS  = 10;
const MEASURE_BATCH_STEP_MS = 130;

async function measureMany(n) {
  if (measureCoinAnimating || measureBatchAnimating) return;
  measureBatchAnimating = true;
  document.querySelectorAll('[data-measure-n]').forEach(b => b.disabled = true);
  document.getElementById('btn-measure').disabled = true;
  document.getElementById('btn-reset-stats').disabled = true;

  const resEl = document.getElementById('measure-result');
  resEl.style.color = 'var(--text2)';

  const steps = Math.min(n, MEASURE_BATCH_STEPS);
  const stepBase = Math.floor(n / steps);
  let remainder  = n - stepBase * steps;

  for (let s = 0; s < steps; s++) {
    const stepCount = stepBase + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    for (let i = 0; i < stepCount; i++) measureCounts[qubitMeasure.measure()]++;

    const runningTotal = measureCounts[0] + measureCounts[1];
    resEl.textContent = `${runningTotal} total`;
    updateHistogram();
    if (s < steps - 1) await delay(MEASURE_BATCH_STEP_MS);
  }

  const total = measureCounts[0] + measureCounts[1];
  const p0 = Math.round((measureCounts[0] / total) * 100);
  const p1 = Math.round((measureCounts[1] / total) * 100);
  setExplainer('measure-explainer',
    `Just sent ${n} identical, freshly-prepared qubits through the same measurement — think of it as asking ${n} exact copies of the same question. None of them talk to each other or "remember" the last answer; each collapses on its own. Across ${total} trials so far the split landed near ${p0}% / ${p1}%, and it'll keep creeping toward the true odds the more you run.`
  );

  document.querySelectorAll('[data-measure-n]').forEach(b => b.disabled = false);
  document.getElementById('btn-measure').disabled = false;
  document.getElementById('btn-reset-stats').disabled = false;
  measureBatchAnimating = false;
}

function updateHistogram() {
  const total = measureCounts[0] + measureCounts[1];
  if (total === 0) return;
  const p0 = (measureCounts[0] / total) * 100;
  const p1 = (measureCounts[1] / total) * 100;
  document.getElementById('hist0').style.height = p0 + '%';
  document.getElementById('hist1').style.height = p1 + '%';
  document.getElementById('hpct0').textContent  = Math.round(p0) + '%';
  document.getElementById('hpct1').textContent  = Math.round(p1) + '%';
  document.getElementById('trial-count').textContent = `· ${total} trials`;

  const exp0 = Math.round(qubitMeasure.prob0() * 100);
  const exp1 = Math.round(qubitMeasure.prob1() * 100);
  document.getElementById('convergence-note').textContent =
    total >= 20 ? `Quantum prediction: |0⟩ → ${exp0}%  |1⟩ → ${exp1}%` : '';
}

function resetStats() {
  if (measureCoinAnimating || measureBatchAnimating) return;
  measureCounts = { 0: 0, 1: 0 };
  ['hist0','hist1'].forEach(id => document.getElementById(id).style.height = '0%');
  document.getElementById('hpct0').textContent          = '—';
  document.getElementById('hpct1').textContent          = '—';
  document.getElementById('trial-count').textContent    = '';
  document.getElementById('measure-result').textContent = '';
  document.getElementById('convergence-note').textContent = '';
  // Back to superposition — matches "Reset" conceptually undoing the last
  // collapse, not just clearing the histogram.
  measureCoinState = null;
  drawCoin('coin-measure', null);
  document.getElementById('coin-measure-label').textContent = t('measure.unmeasured', 'Unmeasured');
}


// ════════ js/tabs/statevector-tab.js ════════
// Depends on: core/qubit.js (round2), core/theme.js (isDark, BLOCH_COLORS,
// onThemeChange), app.js state (classicalSVState, svTheta). Formerly its
// own top-level "Statevec" tab; now the interactive "Compare the State
// Spaces" widget embedded in Maths Concept's State Vector section
// (#maths-statevector in index.html) — see setMathsSection() in
// mathsconcept-tab.js, which calls redrawStatevecCanvases() when that
// section is opened, taking over the redraw-on-entry job
// registerTab('statevec', ...) used to do back when this was its own tab.
// ═══════════════════════════════════════════════════════════════════
// STATEVECTOR WIDGET
// ═══════════════════════════════════════════════════════════════════
function initStatevecTab() {
  drawClassicalSV(classicalSVState);
  drawQuantumSV(svTheta);
  updateSVFormulas();
  document.getElementById('btn-toggle-classical-sv').addEventListener('click', toggleClassicalSV);
  document.getElementById('sv-theta-slider').addEventListener('input', svSliderUpdate);
  document.querySelectorAll('.mode-btn[data-statevec-mode]').forEach(btn =>
    btn.addEventListener('click', () => setStatevecMode(btn.dataset.statevecMode)));
  onThemeChange(redrawStatevecCanvases);
}

/** Canvases are static once drawn, but redraw on entry in case the theme
 *  changed while this section was hidden (draw() reads live isDark), or
 *  the panel that was hidden behind the other mode never got a
 *  proper-sized redraw while display:none. */
function redrawStatevecCanvases() {
  drawClassicalSV(classicalSVState);
  drawQuantumSV(svTheta);
}

/** Classical/Quantum switch for the State Vector tab — same two-tier
 *  pattern as Gates' domain toggle. Each was previously half of a
 *  side-by-side "vs" comparison; now they're standalone pages. */
function setStatevecMode(mode) {
  document.querySelectorAll('.mode-btn[data-statevec-mode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.statevecMode === mode));
  document.getElementById('statevec-classical-panel').style.display = mode === 'classical' ? '' : 'none';
  document.getElementById('statevec-quantum-panel').style.display   = mode === 'quantum'   ? '' : 'none';
  // Canvases don't redraw themselves while their panel is display:none,
  // so switching into a panel needs the same explicit redraw onEnter()
  // already does for tab-level visits.
  drawClassicalSV(classicalSVState);
  drawQuantumSV(svTheta);
}

function toggleClassicalSV() {
  classicalSVState = 1 - classicalSVState;
  drawClassicalSV(classicalSVState);
  document.getElementById('sv-classical-formula').textContent =
    `State = |${classicalSVState}⟩`;
}

function svSliderUpdate() {
  svTheta = parseInt(document.getElementById('sv-theta-slider').value) / 1000;
  document.getElementById('sv-theta-val').textContent =
    Math.round(svTheta * 180 / Math.PI) + '°';
  drawQuantumSV(svTheta);
  updateSVFormulas();
}

function updateSVFormulas() {
  const alpha = Math.cos(svTheta / 2);
  const beta  = Math.sin(svTheta / 2);
  const p0    = alpha * alpha * 100;
  const p1    = beta  * beta  * 100;
  const aStr  = round2(alpha), bStr = round2(beta);
  document.getElementById('sv-quantum-formula').textContent =
    `|ψ⟩ = ${aStr}|0⟩ + ${bStr}|1⟩`;
  document.getElementById('sv-fill0').style.width = p0 + '%';
  document.getElementById('sv-fill1').style.width = p1 + '%';
  document.getElementById('sv-pct0').textContent  = Math.round(p0) + '%';
  document.getElementById('sv-pct1').textContent  = Math.round(p1) + '%';
}

/* Classical state-vector canvas — vertical line, only two valid points */
function drawClassicalSV(state) {
  const canvas = document.getElementById('sv-classical');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const axisX = w / 2;
  const margin = 52;
  const topY   = margin;        // |1⟩
  const botY   = h - margin;    // |0⟩
  const midY   = (topY + botY) / 2;

  // Forbidden-zone shading between the two endpoints
  const fgrd = ctx.createLinearGradient(axisX - 28, 0, axisX + 28, 0);
  fgrd.addColorStop(0,   'transparent');
  fgrd.addColorStop(0.5, isDark ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.018)');
  fgrd.addColorStop(1,   'transparent');
  ctx.fillStyle = fgrd;
  ctx.fillRect(axisX - 28, topY, 56, botY - topY);

  // Crosshatch lines inside forbidden zone
  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)';
  ctx.lineWidth = 1;
  for (let y = topY + 14; y < botY - 4; y += 16) {
    ctx.beginPath();
    ctx.moveTo(axisX - 24, y);
    ctx.lineTo(axisX + 24, y + 16);
    ctx.stroke();
  }
  ctx.restore();

  // "Forbidden" label
  ctx.font = `9px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.60)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('forbidden', axisX, midY - 8);
  ctx.fillText('zone', axisX, midY + 8);

  // Axis spine
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.24)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(axisX, topY - 14);
  ctx.lineTo(axisX, botY + 14);
  ctx.stroke();

  // Ticks + ket labels
  [{ y: topY, ket: '|1⟩' }, { y: botY, ket: '|0⟩' }].forEach(({ y, ket }) => {
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(axisX - 10, y);
    ctx.lineTo(axisX + 10, y);
    ctx.stroke();
    ctx.font = `13px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.42)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ket, axisX + 16, y);
  });

  // State dot — large, bold, solid
  const stateY = state === 1 ? topY : botY;
  ctx.beginPath();
  ctx.arc(axisX, stateY, 13, 0, 2 * Math.PI);
  ctx.fillStyle = isDark ? '#EFEFEF' : '#0B0B0B';
  ctx.fill();

  // Digit inside dot
  ctx.font = `bold 12px 'JetBrains Mono', monospace`;
  ctx.fillStyle = isDark ? '#0B0B0B' : '#EFEFEF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state, axisX, stateY);
}

/* Quantum state-vector canvas — 2D amplitude space with unit arc */
function drawQuantumSV(theta) {
  const canvas = document.getElementById('sv-quantum');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const margin  = 52;
  const originX = margin;
  const originY = h - margin;
  const size    = Math.min(w - margin * 1.7, h - margin * 1.7);

  const alpha = Math.cos(theta / 2);
  const beta  = Math.sin(theta / 2);
  const tipX  = originX + alpha * size;
  const tipY  = originY - beta  * size;

  // ── Unit quarter-circle arc (the full state space) ──────────────
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(originX, originY, size, -Math.PI / 2, 0, false);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Axes ──────────────────────────────────────────────────────────
  const axCol = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  ctx.strokeStyle = axCol;
  ctx.lineWidth = 1.5;
  // X axis → |0⟩
  ctx.beginPath();
  ctx.moveTo(originX - 8, originY);
  ctx.lineTo(originX + size + 24, originY);
  ctx.stroke();
  // Y axis ↑ |1⟩
  ctx.beginPath();
  ctx.moveTo(originX, originY + 8);
  ctx.lineTo(originX, originY - size - 24);
  ctx.stroke();

  // Axis arrowheads
  const ah = 7;
  ctx.fillStyle = axCol;
  ctx.beginPath(); // X →
  ctx.moveTo(originX + size + 24, originY);
  ctx.lineTo(originX + size + 24 - ah, originY - 4);
  ctx.lineTo(originX + size + 24 - ah, originY + 4);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); // Y ↑
  ctx.moveTo(originX, originY - size - 24);
  ctx.lineTo(originX - 4, originY - size - 24 + ah);
  ctx.lineTo(originX + 4, originY - size - 24 + ah);
  ctx.closePath(); ctx.fill();

  // Unit marks at 1.0
  ctx.strokeStyle = axCol;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(originX + size, originY - 5); ctx.lineTo(originX + size, originY + 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(originX - 5, originY - size); ctx.lineTo(originX + 5, originY - size); ctx.stroke();

  // Axis labels
  ctx.font = `13px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = BLOCH_COLORS.axisZ;
  ctx.fillText('|0⟩', originX + size + 28, originY + 18);
  ctx.textBaseline = 'top';
  ctx.fillText('|1⟩', originX, originY - size - 28);

  // ── Projection dashes from tip to axes ───────────────────────────
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.13)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX, originY);    ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(originX, tipY);    ctx.stroke();
  ctx.setLineDash([]);

  // Projection dots on axes
  const pdot = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.28)';
  ctx.fillStyle = pdot;
  ctx.beginPath(); ctx.arc(tipX,    originY, 3, 0, 2*Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(originX, tipY,    3, 0, 2*Math.PI); ctx.fill();

  // α and β labels on axes
  if (alpha > 0.06) {
    ctx.font = `11px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#5B8DEF' : '#0033A0';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`α=${round2(alpha)}`, tipX, originY + 8);
  }
  if (beta > 0.06) {
    ctx.font = `11px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#F472B6' : '#BE185D';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(`β=${round2(beta)}`, originX - 8, tipY);
  }

  // θ/2 angle arc
  if (theta > 0.05) {
    const arcR = 34;
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.26)' : 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(originX, originY, arcR, -Math.PI / 2, -(Math.PI / 2 - theta / 2), false);
    ctx.stroke();
    const midAng = -Math.PI / 2 + theta / 4;
    ctx.font = `10px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.34)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lr = arcR + 14;
    ctx.fillText('θ/2', originX + lr * Math.cos(midAng), originY + lr * Math.sin(midAng));
  }

  // ── State vector arrow ───────────────────────────────────────────
  ctx.save();
  if (isDark) { ctx.shadowBlur = 14; ctx.shadowColor = BLOCH_COLORS.arrow; }
  ctx.strokeStyle = BLOCH_COLORS.arrow;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  const ang = Math.atan2(tipY - originY, tipX - originX);
  const as  = 10;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - as * Math.cos(ang - 0.4), tipY - as * Math.sin(ang - 0.4));
  ctx.lineTo(tipX - as * Math.cos(ang + 0.4), tipY - as * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fillStyle = BLOCH_COLORS.arrow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(tipX, tipY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = BLOCH_COLORS.tip;
  ctx.fill();
  ctx.restore();

  // Origin dot
  ctx.beginPath();
  ctx.arc(originX, originY, 3.5, 0, 2 * Math.PI);
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.38)';
  ctx.fill();
}


// ════════ js/tabs/entanglement-tab.js ════════
// Depends on: core/utils.js (delay), core/theme.js (onThemeChange),
// core/tab-registry.js (registerTab), core/dom-utils.js (drawCoin,
// animateCoinFlip — shared with tabs/measure-tab.js's own coin),
// app.js state (coin1State, coin2State, coinAnimating, entangleCounts).

// ═══════════════════════════════════════════════════════════════════
// ENTANGLEMENT TAB
// ═══════════════════════════════════════════════════════════════════
function initEntangle() {
  drawCoin('coin1', null);
  drawCoin('coin2', null);
  document.getElementById('btn-measure-both').addEventListener('click', flipEntangled);
  document.getElementById('btn-measure-a').addEventListener('click', measureCoinA);
  document.getElementById('btn-reset-entangle').addEventListener('click', resetEntangle);

  const redrawCoins = () => {
    drawCoin('coin1', coin1State);
    drawCoin('coin2', coin2State);
  };
  // Two different reasons a redraw is needed: entering this tab while it
  // was previously hidden (registerTab's onEnter), and the theme changing
  // while this tab may or may not be visible (onThemeChange) — both call
  // the same redraw since draw() always reads the live isDark/coin state.
  registerTab('entangle', { onEnter: redrawCoins });
  onThemeChange(redrawCoins);
}

/* MEASURE BOTH — simultaneous collapse of Bell state */
async function flipEntangled() {
  if (coinAnimating) return;
  coinAnimating = true;

  setEntangleNote('Measuring…');
  document.getElementById('entangle-result').textContent = '';
  document.getElementById('coin1-label').textContent = '…';
  document.getElementById('coin2-label').textContent = '…';

  // Both coins show superposition oscillation
  for (let i = 0; i < 10; i++) {
    drawCoin('coin1', i % 2);
    drawCoin('coin2', 1 - (i % 2));
    await delay(55);
  }

  // Wavefunction collapses — both get identical result
  const result = Math.random() < 0.5 ? 0 : 1;
  coin1State = result;
  coin2State = result;

  drawCoin('coin1', result);
  drawCoin('coin2', result);
  pulseElement(document.getElementById('coin1'), 'collapsing');
  pulseElement(document.getElementById('coin2'), 'collapsing');

  const ket = result === 0 ? '|0⟩' : '|1⟩';
  document.getElementById('coin1-label').textContent = ket;
  document.getElementById('coin2-label').textContent = ket;
  setEntangleNote('Both collapsed to the same state');

  const resEl = document.getElementById('entangle-result');
  resEl.textContent = `Outcome: |${result}${result}⟩`;
  resEl.style.color = result === 0 ? 'var(--zero)' : 'var(--one)';
  pulseElement(resEl, 'collapsing', 500);

  entangleCounts[result === 0 ? '00' : '11']++;
  updateEntangleStats();
  coinAnimating = false;
}

/* MEASURE A ONLY — demonstrates nonlocal correlation */
async function measureCoinA() {
  if (coinAnimating) return;
  coinAnimating = true;

  // Reset B to superposition while A is being measured
  coin1State = null;
  coin2State = null;
  drawCoin('coin2', null);
  document.getElementById('coin2-label').textContent = 'Entangled…';
  setEntangleNote('Measuring A…');
  document.getElementById('entangle-result').textContent = '';
  document.getElementById('coin1-label').textContent = 'Measuring…';

  // Animate only coin A
  await animateCoinFlip('coin1', 9, 62);

  const result = Math.random() < 0.5 ? 0 : 1;
  coin1State = result;
  drawCoin('coin1', result);
  pulseElement(document.getElementById('coin1'), 'collapsing');
  document.getElementById('coin1-label').textContent =
    `A = ${result === 0 ? '|0⟩' : '|1⟩'}`;

  setEntangleNote('A collapsed — B instantly determined!');

  await delay(580); // dramatic pause — represents "spooky action"

  // B collapses to same value with no communication
  coin2State = result;
  drawCoin('coin2', result);
  pulseElement(document.getElementById('coin2'), 'collapsing');
  document.getElementById('coin2-label').textContent =
    `B = ${result === 0 ? '|0⟩' : '|1⟩'}`;

  const resEl = document.getElementById('entangle-result');
  resEl.textContent = `|${result}${result}⟩ — no signal sent to B`;
  resEl.style.color = result === 0 ? 'var(--zero)' : 'var(--one)';
  pulseElement(resEl, 'collapsing', 500);
  setEntangleNote('Correlation holds regardless of distance');

  entangleCounts[result === 0 ? '00' : '11']++;
  updateEntangleStats();
  coinAnimating = false;
}

function resetEntangle() {
  if (coinAnimating) return;
  coin1State = null;
  coin2State = null;
  drawCoin('coin1', null);
  drawCoin('coin2', null);
  document.getElementById('coin1-label').textContent = 'Unmeasured';
  document.getElementById('coin2-label').textContent = 'Unmeasured';
  document.getElementById('entangle-result').textContent = '';
  setEntangleNote('Measuring A instantly determines B');
}

function setEntangleNote(msg) {
  const el = document.getElementById('entangle-note');
  if (el) el.innerHTML = msg;
}

function updateEntangleStats() {
  const n00   = entangleCounts['00'];
  const n11   = entangleCounts['11'];
  const total = n00 + n11;
  const p00   = total ? n00 / total * 100 : 0;
  const p11   = total ? n11 / total * 100 : 0;

  document.getElementById('estat-fill-00').style.width = p00 + '%';
  document.getElementById('estat-fill-11').style.width = p11 + '%';
  document.getElementById('estat-pct-00').textContent  = total ? Math.round(p00) + '%' : '—';
  document.getElementById('estat-pct-11').textContent  = total ? Math.round(p11) + '%' : '—';
  document.getElementById('entangle-trial-count').textContent = total ? `· ${total} trials` : '';

  if (total >= 10) {
    document.getElementById('entangle-convergence').textContent =
      `Always |00⟩ or |11⟩ — the perfect quantum correlation converges to 50/50`;
  }
}


// ════════ js/tabs/bell-states-tab.js ════════
// Depends on: core/tab-registry.js (registerTab), core/i18n.js (t()).
// The interactive "measure the pair" demo deliberately lives only on the
// Entangle tab (js/tabs/entanglement-tab.js) — repeating the same
// coin-flip UI here for Φ⁺ specifically would just duplicate it, so this
// tab instead illustrates all four states: a circuit diagram, a same/
// opposite-by-phase taxonomy grid, and the exact (not sampled) Born-rule
// probability split for whichever state is selected.

// ═══════════════════════════════════════════════════════════════════
// BELL STATES TAB
// ═══════════════════════════════════════════════════════════════════
const BELL_STATES = {
  phiplus:  { symbol: 'Φ⁺', ketA: '00', ketB: '11', correlation: 'same',
              formula: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2', needsXA: false, needsXB: false },
  phiminus: { symbol: 'Φ⁻', ketA: '00', ketB: '11', correlation: 'same',
              formula: '|Φ⁻⟩ = (|00⟩ − |11⟩) / √2', needsXA: true,  needsXB: false },
  psiplus:  { symbol: 'Ψ⁺', ketA: '01', ketB: '10', correlation: 'opposite',
              formula: '|Ψ⁺⟩ = (|01⟩ + |10⟩) / √2', needsXA: false, needsXB: true },
  psiminus: { symbol: 'Ψ⁻', ketA: '01', ketB: '10', correlation: 'opposite',
              formula: '|Ψ⁻⟩ = (|01⟩ − |10⟩) / √2', needsXA: true,  needsXB: true }
};

// English fallback for t() — actual copy lives in js/locales/*.js under
// the same bellstates.recipe.<key> keys.
const BELL_RECIPE_FALLBACK = {
  phiplus:  'Start at |00⟩, apply H to qubit A, then CNOT (A → B).',
  phiminus: 'Start at |00⟩, apply X to qubit A, then H to qubit A, then CNOT (A → B).',
  psiplus:  'Start at |00⟩, apply X to qubit B, then H to qubit A, then CNOT (A → B).',
  psiminus: 'Start at |00⟩, apply X to both qubits, then H to qubit A, then CNOT (A → B).'
};

let currentBellState = 'phiplus';
let bellAnimating = false;
const BELL_ANIM_STEP_MS = 700;
const BELL_TOKEN_BASE_X = 70; // matches the tokens' own cx/x in index.html — translateX is measured from here

function initBellStatesTab() {
  document.querySelectorAll('#bellstate-picker [data-bell], #bellstate-family [data-bell]').forEach(btn => {
    btn.addEventListener('click', () => setBellState(btn.dataset.bell));
  });
  document.getElementById('btn-run-bellstate').addEventListener('click', runBellStateCircuit);

  registerTab('bellstates', {});
  updateBellStateDisplay();
}

function setBellState(key) {
  if (bellAnimating) return; // mid-run — the picker/family buttons are disabled anyway, but guard directly too
  currentBellState = key;
  updateBellStateDisplay();
}

/* Refreshes every surface that depends on which Bell state is selected:
   the formula, the recipe text, the circuit diagram's X gates, the
   picker's and family grid's active highlight, and the exact probability
   split (no sampling — these are the Born-rule values themselves). */
function updateBellStateDisplay() {
  const s = BELL_STATES[currentBellState];

  document.getElementById('bellstate-formula').textContent = s.formula;
  document.getElementById('bellstate-recipe').textContent =
    t(`bellstates.recipe.${currentBellState}`, BELL_RECIPE_FALLBACK[currentBellState]);

  document.getElementById('bellstate-gate-xa').classList.toggle('circuit-gate-off', !s.needsXA);
  document.getElementById('bellstate-gate-xb').classList.toggle('circuit-gate-off', !s.needsXB);

  document.querySelectorAll('[data-bell]').forEach(b =>
    b.classList.toggle('active', b.dataset.bell === currentBellState));

  document.getElementById('bellstate-distribution-note').textContent =
    t('bellstates.distributionNote', 'Exact Born-rule probabilities for {symbol} — no sampling needed, these follow directly from squaring each amplitude.')
      .replace('{symbol}', `|${s.symbol}⟩`);

  ['00', '01', '10', '11'].forEach(k => {
    const pct = (k === s.ketA || k === s.ketB) ? 50 : 0;
    document.getElementById(`bstat-fill-${k}`).style.width = pct + '%';
    document.getElementById(`bstat-pct-${k}`).textContent = pct + '%';
  });

  document.querySelectorAll('#bell-stats-rows .prob-row').forEach(row => {
    const possible = row.dataset.ket === s.ketA || row.dataset.ket === s.ketB;
    row.classList.toggle('bell-impossible', !possible);
  });

  resetBellTokens();
}

// ═══════════════════════════════════════════════════════════════════
// CIRCUIT DIAGRAM — RUN ANIMATION
// ═══════════════════════════════════════════════════════════════════
// The always-on .circuit-gate-glow loop above is purely decorative
// "signal flow"; this is the actual thing it's gesturing at — a value
// token per wire, gliding through each gate and picking up that gate's
// real effect: X flips the label, H turns qubit A's token into a genuine
// dashed "superposed" look (not a definite digit — the entire point),
// and CNOT gives qubit B the same look plus a shared color and a
// connecting arc, since B is now correlated with A's superposition
// rather than independently random. Never collapses either token to one
// value at the end — that would misrepresent what the circuit actually
// leaves behind (an unmeasured entangled pair, not a fixed answer).

/** Moves one token to grid position `x` (one of the fixed checkpoints
 *  below) by translating from its base position in index.html —
 *  BELL_TOKEN_BASE_X — so this only ever needs one coordinate, not a
 *  running offset. */
function setBellTokenX(id, x) {
  document.getElementById(id).style.transform = `translateX(${x - BELL_TOKEN_BASE_X}px)`;
}

/** Restores both tokens to their pre-run look — hidden, back at the
 *  start, |0⟩, no superposed/entangled styling. Called whenever the
 *  selected state changes (mid-run switching is blocked in setBellState()
 *  already, but a state change between runs should always clear the
 *  previous run's leftover styling) and at the very start of a run. */
function resetBellTokens() {
  ['a', 'b'].forEach(wire => {
    const g = document.getElementById(`bellstate-token-${wire}`);
    g.classList.add('token-hidden');
    g.classList.remove('superposed', 'entangled', 'token-pulse');
    g.querySelector('.token-label').textContent = '0';
    setBellTokenX(`bellstate-token-${wire}`, BELL_TOKEN_BASE_X);
  });
  document.getElementById('bellstate-entangle-link').classList.remove('shown');
}

async function runBellStateCircuit() {
  if (bellAnimating) return;
  bellAnimating = true;

  const s = BELL_STATES[currentBellState];
  const runBtn = document.getElementById('btn-run-bellstate');
  runBtn.disabled = true;
  document.querySelectorAll('#bellstate-picker [data-bell], #bellstate-family [data-bell]').forEach(b => b.disabled = true);
  document.getElementById('bellstate-anim-status').textContent = t('common.running', 'running…');

  resetBellTokens();
  const tokenA = document.getElementById('bellstate-token-a');
  const tokenB = document.getElementById('bellstate-token-b');
  const labelA = tokenA.querySelector('.token-label');
  const labelB = tokenB.querySelector('.token-label');
  const setNarration = txt => { document.getElementById('bellstate-anim-explainer').textContent = txt; };

  tokenA.classList.remove('token-hidden');
  tokenB.classList.remove('token-hidden');
  setNarration(t('bellstates.animStart', 'Both qubits start at |0⟩ — watch the value on each wire as it moves through the gates.'));
  await delay(BELL_ANIM_STEP_MS);

  // ─── X gates — flip whichever wire(s) this state needs ───
  setBellTokenX('bellstate-token-a', 110);
  setBellTokenX('bellstate-token-b', 110);
  await delay(BELL_ANIM_STEP_MS);
  if (s.needsXA) {
    labelA.textContent = '1';
    tokenA.classList.add('token-pulse');
    setNarration(t('bellstates.animFlipA', 'X flips qubit A: 0 → 1.'));
    await delay(500);
    tokenA.classList.remove('token-pulse');
  }
  if (s.needsXB) {
    labelB.textContent = '1';
    tokenB.classList.add('token-pulse');
    setNarration(t('bellstates.animFlipB', 'X flips qubit B: 0 → 1.'));
    await delay(500);
    tokenB.classList.remove('token-pulse');
  }
  if (!s.needsXA && !s.needsXB) {
    setNarration(t('bellstates.animNoFlip', 'This state needs no X gate — both qubits stay at |0⟩ so far.'));
    await delay(400);
  }

  // ─── H on qubit A — a real superposition, not a coin-flip guess ───
  setBellTokenX('bellstate-token-a', 220);
  setBellTokenX('bellstate-token-b', 220);
  await delay(BELL_ANIM_STEP_MS);
  tokenA.classList.add('superposed');
  labelA.textContent = '0∕1';
  setNarration(t('bellstates.animSuperpose', 'H puts qubit A into a genuine superposition — no longer a definite 0 or 1, both at once.'));
  await delay(BELL_ANIM_STEP_MS);

  // ─── CNOT — entangles B with A's superposition ───
  setBellTokenX('bellstate-token-a', 320);
  setBellTokenX('bellstate-token-b', 320);
  await delay(BELL_ANIM_STEP_MS);
  tokenB.classList.add('superposed');
  labelB.textContent = '0∕1';
  tokenA.classList.add('entangled');
  tokenB.classList.add('entangled');
  setNarration(t('bellstates.animEntangle', 'CNOT entangles B with A — B is now correlated with A\'s superposition, not independently random.'));
  await delay(BELL_ANIM_STEP_MS);

  // ─── Final — still unmeasured, so both tokens stay superposed; the
  // arc is the only new thing, showing the two wires are now linked ───
  setBellTokenX('bellstate-token-a', 420);
  setBellTokenX('bellstate-token-b', 420);
  await delay(BELL_ANIM_STEP_MS);
  document.getElementById('bellstate-entangle-link').classList.add('shown');
  setNarration(t('bellstates.animDone', 'Final state: {formula} — A and B are perfectly correlated: measuring one instantly tells you the other.').replace('{formula}', s.formula));
  document.getElementById('bellstate-anim-status').textContent = '';

  runBtn.disabled = false;
  document.querySelectorAll('#bellstate-picker [data-bell], #bellstate-family [data-bell]').forEach(b => b.disabled = false);
  bellAnimating = false;
}


// ════════ js/tabs/tunneling-tab.js ════════
// Depends on: core/theme.js (isDark, BLOCH_COLORS.arrow), core/dom-utils.js
// (setExplainer), core/tab-registry.js (registerTab). Registers onEnter/
// onLeave hooks that start/pause the simulation loop when this tab
// becomes visible/hidden — tunnelAnimId itself stays private to this file.
// Every run that fully settles (not one abandoned mid-flight by a slider
// drag) also logs a {heightRatio, widthCells, reflPct, transPct} entry to
// tunnelHistory, rendered as the #tunnel-history strip — unlike Stern-
// Gerlach/Beam Splitter's per-atom randomness, this solver is fully
// deterministic, so the strip isn't building toward a probability; it's
// a record of your own exploration, letting "raise V0, watch transmitted
// shrink" be something you can see across runs instead of just read in
// the explainer text.

// ═══════════════════════════════════════════════════════════════════
// QUANTUM TUNNELING TAB
// Real time-dependent Schrodinger solver (staggered leapfrog), not a
// fake animation. Units: hbar = m = 1, so H = -0.5 d^2/dx^2 + V(x).
// Validated separately: probability stays conserved to <0.3% over a
// full run, and transmission falls off correctly as V0/E increases
// (23% at V0=E down to 0.1% at V0=2.5E).
// ═══════════════════════════════════════════════════════════════════
const TUNNEL_SUBSTEPS = 12;         // physics steps per rendered frame
const TUNNEL_MAX_STEPS = 3200;      // stop before packet reaches the wall

let tunnelCanvas = null, tunnelCtx = null;
let tunnelAnimId = null;
let tunnelPlaying = true;
let tunnelSettled = false;
let tunnelCrossed = false;
let tunnelElapsedSteps = 0;
let tunnelBarrier = null; // { heightRatio, widthCells, V0, center, half }
let tunnelInitialized = false;
let tunnelHistory = []; // completed runs only — [{ heightRatio, widthCells, reflPct, transPct }, ...]
const TUNNEL_HISTORY_MAX = 24;

/* Wires the static controls (sliders/buttons already in index.html) —
   called once from app.js's DOMContentLoaded. Safe to attach before the
   tab has ever been visited: these controls are only reachable once the
   Tunnel tab is active, and activating it runs ensureTunnelStarted()
   first, which allocates tunnelPsiR/I before any listener could fire. */
function initTunnelControls() {
  document.getElementById('tunnel-height').addEventListener('input', onTunnelSliderChange);
  document.getElementById('tunnel-width').addEventListener('input', onTunnelSliderChange);
  document.getElementById('tunnel-play-btn').addEventListener('click', toggleTunnelPlay);
  document.getElementById('btn-fire-tunnel').addEventListener('click', fireTunnelPacket);
  document.getElementById('btn-clear-tunnel-history').addEventListener('click', clearTunnelHistory);
  renderTunnelHistory();

  registerTab('tunnel', { onEnter: ensureTunnelStarted, onLeave: stopTunnelSim });
}

function drawTunnel() {
  const ctx = tunnelCtx;
  const w = tunnelCanvas.width, h = tunnelCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const baseline = h * 0.86;

  // ── barrier ─────────────────────────────────────────
  const bx1 = (tunnelBarrier.center - tunnelBarrier.half) / TUNNEL_N * w;
  const bx2 = (tunnelBarrier.center + tunnelBarrier.half) / TUNNEL_N * w;
  const barrierPxH = 14 + (tunnelBarrier.heightRatio / 2.5) * h * 0.55;
  const bw = Math.max(2, bx2 - bx1);
  const by = baseline - barrierPxH;

  // A solid-material gradient (bright top edge fading to a darker core)
  // instead of one flat tint — the same "lit from above" convention used
  // for every other apparatus part across the app (magnet poles, beam
  // splitter plate), so this classically-forbidden wall reads as
  // physical rather than a placeholder rectangle next to the genuinely
  // solved wavefunction beside it.
  const barrierGrad = ctx.createLinearGradient(0, by, 0, baseline);
  if (isDark) {
    barrierGrad.addColorStop(0,    'rgba(255,255,255,0.22)');
    barrierGrad.addColorStop(0.18, 'rgba(255,255,255,0.09)');
    barrierGrad.addColorStop(1,    'rgba(255,255,255,0.035)');
  } else {
    barrierGrad.addColorStop(0,    'rgba(0,0,0,0.16)');
    barrierGrad.addColorStop(0.18, 'rgba(0,0,0,0.065)');
    barrierGrad.addColorStop(1,    'rgba(0,0,0,0.03)');
  }
  ctx.fillStyle   = barrierGrad;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.24)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(bx1, by, bw, barrierPxH);
  ctx.fill(); ctx.stroke();

  // Diagonal hatching — the standard textbook symbol for "classically
  // forbidden / solid" regions in a potential-energy diagram, not just a
  // decorative texture.
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx1, by, bw, barrierPxH);
  ctx.clip();
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.13)';
  ctx.lineWidth = 1;
  const hatchGap = 7;
  for (let hx = bx1 - barrierPxH; hx < bx2 + barrierPxH; hx += hatchGap) {
    ctx.beginPath();
    ctx.moveTo(hx, baseline);
    ctx.lineTo(hx + barrierPxH, by);
    ctx.stroke();
  }
  ctx.restore();

  // A thin bright top edge, echoing the knife-edge highlight on the
  // Stern-Gerlach magnet poles — a cheap specular cue that this surface
  // is a real, solid boundary the wave has to contend with.
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx1, by);
  ctx.lineTo(bx2, by);
  ctx.stroke();

  ctx.font = `11px 'JetBrains Mono', monospace`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('V₀', (bx1 + bx2) / 2, baseline - barrierPxH - 5);

  // ── baseline axis ───────────────────────────────────
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)';
  ctx.beginPath(); ctx.moveTo(0, baseline); ctx.lineTo(w, baseline); ctx.stroke();

  // ── |psi(x)|^2 filled probability cloud ─────────────
  const glow = BLOCH_COLORS.arrow || (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.85)');
  ctx.beginPath();
  ctx.moveTo(0, baseline);
  for (let j = 0; j < TUNNEL_N; j++) {
    const prob = (tunnelSolver.psiR[j] ** 2 + tunnelSolver.psiI[j] ** 2) * tunnelSolver.drawScale;
    const px = (j / TUNNEL_N) * w;
    const py = baseline - prob * h;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(w, baseline);
  ctx.closePath();

  ctx.save();
  if (isDark) { ctx.shadowBlur = 16; ctx.shadowColor = glow; }
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  ctx.fill();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1.7;
  ctx.stroke();
  ctx.restore();

  // ── faint oscillating carrier wave inside the envelope ──
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  const carrierScale = Math.sqrt(tunnelSolver.drawScale) * h * 0.42;
  for (let j = 0; j < TUNNEL_N; j++) {
    const px = (j / TUNNEL_N) * w;
    const py = baseline - h * 0.02 - tunnelSolver.psiR[j] * carrierScale * 0.5 - h * 0.02;
    if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function updateTunnelStats(pLeft, pRight) {
  document.getElementById('tunnel-refl').textContent  = Math.round(pLeft * 100) + '%';
  document.getElementById('tunnel-trans').textContent = Math.round(pRight * 100) + '%';
}

/** Renders #tunnel-history from tunnelHistory — a plain rebuild each
 *  call rather than incremental DOM diffing, since the list is capped at
 *  TUNNEL_HISTORY_MAX (24) entries, cheap either way. Each bar's title
 *  attribute carries the exact numbers for anyone who wants to read a
 *  specific run rather than eyeball the strip. */
function renderTunnelHistory() {
  const wrap = document.getElementById('tunnel-history');
  wrap.replaceChildren();
  if (tunnelHistory.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'tunnel-history-empty';
    empty.textContent = t('tunnel.historyEmpty', 'No completed runs yet.');
    wrap.appendChild(empty);
  } else {
    tunnelHistory.forEach((run, i) => {
      const bar = document.createElement('div');
      bar.className = 'tunnel-history-bar' + (i === tunnelHistory.length - 1 ? ' latest' : '');
      bar.title = `V₀ = ${run.heightRatio.toFixed(2)}×E, w = ${run.widthCells} — ${run.transPct}% transmitted, ${run.reflPct}% reflected`;
      const segTrans = document.createElement('div');
      segTrans.className = 'seg-trans';
      segTrans.style.height = run.transPct + '%';
      const segRefl = document.createElement('div');
      segRefl.className = 'seg-refl';
      segRefl.style.height = run.reflPct + '%';
      bar.append(segTrans, segRefl);
      wrap.appendChild(bar);
    });
  }
  document.getElementById('tunnel-history-count').textContent = tunnelHistory.length
    ? t('tunnel.historyCount', '· {count} runs').replace('{count}', tunnelHistory.length)
    : '';
}

function clearTunnelHistory() {
  tunnelHistory = [];
  renderTunnelHistory();
}

function updateTunnelPlayButton() {
  const btn = document.getElementById('tunnel-play-btn');
  if (btn) btn.textContent = tunnelPlaying ? '⏸ Pause' : '▶ Play';
}

function fireTunnelPacket() {
  tunnelBarrier = tunnelSolver.buildBarrier(
    parseInt(document.getElementById('tunnel-height').value) / 100,
    parseInt(document.getElementById('tunnel-width').value));
  tunnelSolver.launch();
  tunnelSettled = false;
  tunnelCrossed = false;
  tunnelElapsedSteps = 0;
  tunnelPlaying = true;
  updateTunnelPlayButton();
  const el = document.getElementById('tunnel-height-val');
  if (el) el.textContent = tunnelBarrier.heightRatio.toFixed(2) + '×E';
  const wEl = document.getElementById('tunnel-width-val');
  if (wEl) wEl.textContent = tunnelBarrier.widthCells;
  updateTunnelStats(1, 0);

  setExplainer('tunnel-explainer',
    tunnelBarrier.heightRatio < 0.02
      ? 'No barrier at all right now — the packet should sail through essentially untouched. Bump the V₀ slider up to put a wall in its way.'
      : `Launching a wave packet at a barrier <strong>${tunnelBarrier.heightRatio.toFixed(2)}×</strong> its own energy. Classically that\'s an unbreakable wall — no bounce, no chance, full stop. Let\'s see what quantum mechanics has to say about that.`
  );
}

function toggleTunnelPlay() {
  tunnelPlaying = !tunnelPlaying;
  updateTunnelPlayButton();
}

function onTunnelSliderChange() {
  fireTunnelPacket();
}

function tunnelAnimate() {
  if (tunnelPlaying && !tunnelSettled) {
    for (let s = 0; s < TUNNEL_SUBSTEPS; s++) tunnelSolver.step();
    tunnelElapsedSteps += TUNNEL_SUBSTEPS;

    // narrative beat: packet has entered the classically forbidden zone
    if (!tunnelCrossed && tunnelBarrier.heightRatio > 0.02) {
      const peakIdx = tunnelSolver.peakIndex();
      if (peakIdx >= tunnelBarrier.center - tunnelBarrier.half) {
        tunnelCrossed = true;
        setExplainer('tunnel-explainer',
          'Now inside the barrier — the classically forbidden zone. Notice the cloud doesn\'t vanish here, it just decays. If the wall is thin enough, there\'s still some wave left by the time it reaches the far side.'
        );
      }
    }
  }

  drawTunnel();
  const { pLeft, pRight } = tunnelSolver.splitProbs(tunnelBarrier);
  updateTunnelStats(pLeft, pRight);

  if (!tunnelSettled && tunnelElapsedSteps >= TUNNEL_MAX_STEPS) {
    tunnelSettled = true;
    const transPct = Math.round(pRight * 100);
    const reflPct  = Math.round(pLeft * 100);

    // Only a run that actually finished gets logged — a slider drag
    // that re-fires mid-flight abandons the previous run without ever
    // reaching here, so the strip never shows an interrupted result.
    tunnelHistory.push({ heightRatio: tunnelBarrier.heightRatio, widthCells: tunnelBarrier.widthCells, reflPct, transPct });
    if (tunnelHistory.length > TUNNEL_HISTORY_MAX) tunnelHistory.shift();
    renderTunnelHistory();

    if (tunnelBarrier.heightRatio < 0.02) {
      setExplainer('tunnel-explainer', `No barrier, no contest — ${transPct}% sailed straight through. Turn up V₀ to actually test the wall.`);
    } else {
      setExplainer('tunnel-explainer',
        `Final tally: <strong style="color:var(--one)">${transPct}% tunneled</strong> clean through a wall it classically had no business crossing, and <strong style="color:var(--zero)">${reflPct}% bounced back</strong> as expected. Push the barrier higher and the escape odds shrink toward zero — but in principle, never quite reach it.`
      );
    }
  }

  tunnelAnimId = requestAnimationFrame(tunnelAnimate);
}

function ensureTunnelStarted() {
  if (!tunnelInitialized) {
    tunnelCanvas = document.getElementById('tunnel-canvas');
    tunnelCtx    = tunnelCanvas.getContext('2d');
    tunnelInitialized = true;
    fireTunnelPacket();
  }
  if (!tunnelAnimId) tunnelAnimId = requestAnimationFrame(tunnelAnimate);
}

/* Pauses the rAF loop while the Tunnel tab isn't visible — called by
   app.js's tab-switch handler instead of touching tunnelAnimId directly. */
function stopTunnelSim() {
  if (tunnelAnimId) {
    cancelAnimationFrame(tunnelAnimId);
    tunnelAnimId = null;
  }
}


// ════════ js/tabs/interference-tab.js ════════
// Depends on: core/theme.js (isDark), core/tab-registry.js (registerTab).
// Registers onEnter/onLeave hooks that start/pause the simulation loop
// when this tab becomes visible/hidden — interferenceAnimId itself stays
// private to this file.

// ═══════════════════════════════════════════════════════════════════
// WAVE INTERFERENCE TAB
// Two coherent point sources ripple in real time on the left; the
// right-hand "screen" accumulates individual hits sampled from the
// exact two-source intensity I = |e^(ikr1) + e^(ikr2)|^2, rejection-
// sampled point by point — the classic "one particle at a time"
// build-up demonstration, not a pre-rendered fringe image.
// ═══════════════════════════════════════════════════════════════════
const INTERFERENCE_WAVE_SPEED = 70;   // px per time unit
const INTERFERENCE_DT         = 0.045;
const INTERFERENCE_HITS_PER_FRAME = 3;
const INTERFERENCE_SOURCE_X   = 26;   // x position of the slit plate
const INTERFERENCE_GAP_HALF   = 6;    // half-width of each slit opening

let interferenceMode = 'double'; // 'double' | 'single' | 'which-path'
let interferenceTime = 0;
let interferenceHitCount = 0;
let interferenceAnimId = null;
let interferenceInitialized = false;
let rippleCanvas = null, rippleCtx = null, rippleImageData = null;
let screenCanvas = null, screenCtx = null;

/* Wires the static controls (mode buttons/sliders/reset already in
   index.html) — called once from app.js's DOMContentLoaded. Safe to
   attach before the tab has ever been visited, for the same reason as
   tabs/tunneling-tab.js's initTunnelControls(). */
function initInterferenceControls() {
  document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => setInterferenceMode(btn.dataset.mode));
  });
  document.getElementById('slit-sep').addEventListener('input', onInterferenceSliderChange);
  document.getElementById('wavelength').addEventListener('input', onInterferenceSliderChange);
  document.getElementById('btn-clear-screen').addEventListener('click', resetScreen);

  registerTab('interference', { onEnter: ensureInterferenceStarted, onLeave: stopInterferenceSim });
}

function interferenceSlitSep()  { return parseInt(document.getElementById('slit-sep').value); }
function interferenceWavelen()  { return parseInt(document.getElementById('wavelength').value); }

function interferenceGeometry() {
  const h = rippleCanvas.height;
  const centerY = h / 2;
  const sep = interferenceSlitSep();
  return {
    centerY,
    y1: centerY - sep / 2,
    y2: centerY + sep / 2,
    sourceX: INTERFERENCE_SOURCE_X,
    screenX: rippleCanvas.width - 4,
  };
}

/* Exact two-source intensity at a screen point, before normalization.
   'double'     -> coherent sum, produces fringes: I = 2 + 2cos(k*dr)
   'single'     -> only one slit contributes, no partner to interfere with
   'which-path' -> both slits open, but path info is known, so the
                   amplitudes add incoherently (no cross term) -> flat */
function interferenceIntensity(y, geo, mode) {
  const k = 2 * Math.PI / interferenceWavelen();
  const r1 = Math.hypot(geo.screenX - geo.sourceX, y - geo.y1);
  if (mode === 'single') return 1;
  const r2 = Math.hypot(geo.screenX - geo.sourceX, y - geo.y2);
  if (mode === 'which-path') return 2; // |A1|^2 + |A2|^2, cross term erased
  return 2 + 2 * Math.cos(k * (r1 - r2)); // coherent double-slit, range [0,4]
}

function interferenceMaxIntensity(mode) {
  return mode === 'single' ? 1 : mode === 'which-path' ? 2 : 4;
}

function drawSlitPlate(geo) {
  const ctx = rippleCtx;
  const h = rippleCanvas.height;
  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(geo.sourceX, 0);
  ctx.lineTo(geo.sourceX, geo.y1 - INTERFERENCE_GAP_HALF);
  if (interferenceMode === 'single') {
    ctx.moveTo(geo.sourceX, geo.y1 + INTERFERENCE_GAP_HALF);
    ctx.lineTo(geo.sourceX, h);
  } else {
    ctx.moveTo(geo.sourceX, geo.y1 + INTERFERENCE_GAP_HALF);
    ctx.lineTo(geo.sourceX, geo.y2 - INTERFERENCE_GAP_HALF);
    ctx.moveTo(geo.sourceX, geo.y2 + INTERFERENCE_GAP_HALF);
    ctx.lineTo(geo.sourceX, h);
  }
  ctx.stroke();

  // small detector markers at each open slit in which-path mode
  if (interferenceMode === 'which-path') {
    ctx.fillStyle = isDark ? '#F472B6' : '#BE185D';
    [geo.y1, geo.y2].forEach(y => {
      ctx.beginPath();
      ctx.arc(geo.sourceX - 10, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
  ctx.restore();
}

function drawRipple(geo) {
  const w = rippleCanvas.width, h = rippleCanvas.height;
  if (!rippleImageData || rippleImageData.width !== w || rippleImageData.height !== h) {
    rippleImageData = rippleCtx.createImageData(w, h);
  }
  const data = rippleImageData.data;
  data.fill(0); // fully transparent by default

  const k = 2 * Math.PI / interferenceWavelen();
  const w_ = k * INTERFERENCE_WAVE_SPEED;
  const rgb = isDark ? [255, 255, 255] : [10, 10, 10];
  const step = 2; // sample every 2px, fill 2x2 blocks — 4x fewer sin() calls

  for (let py = 0; py < h; py += step) {
    for (let px = geo.sourceX; px < w; px += step) {
      const r1 = Math.hypot(px - geo.sourceX, py - geo.y1);
      let val = Math.sin(k * r1 - w_ * interferenceTime);
      let maxAmp = 1;
      if (interferenceMode !== 'single') {
        const r2 = Math.hypot(px - geo.sourceX, py - geo.y2);
        val += Math.sin(k * r2 - w_ * interferenceTime);
        maxAmp = 2;
      }
      const bright = Math.max(0, (val + maxAmp) / (2 * maxAmp)); // -> [0,1]
      const alpha = Math.floor(Math.pow(bright, 1.6) * 235);

      for (let yy = 0; yy < step && py + yy < h; yy++) {
        for (let xx = 0; xx < step && px + xx < w; xx++) {
          const idx = ((py + yy) * w + (px + xx)) * 4;
          data[idx]     = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
          data[idx + 3] = alpha;
        }
      }
    }
  }
  rippleCtx.putImageData(rippleImageData, 0, 0);
  drawSlitPlate(geo);
}

function interferenceAddHits(geo) {
  const h = rippleCanvas.height;
  const Imax = interferenceMaxIntensity(interferenceMode);
  const dotColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  screenCtx.fillStyle = dotColor;

  for (let i = 0; i < INTERFERENCE_HITS_PER_FRAME; i++) {
    // rejection sampling against the exact intensity curve. The 12-try
    // cap is a safety bound against low-acceptance-rate edge cases (e.g.
    // sampling right at a destructive-interference minimum) — not a
    // magic tuning constant, just "give up this frame and try next frame".
    let y, accepted = false, tries = 0;
    while (!accepted && tries < 12) {
      y = Math.random() * h;
      const I = interferenceIntensity(y, geo, interferenceMode);
      if (Math.random() * Imax < I) accepted = true;
      tries++;
    }
    if (!accepted) continue;
    const x = screenCanvas.width / 2 + (Math.random() - 0.5) * (screenCanvas.width * 0.5);
    screenCtx.beginPath();
    screenCtx.arc(x, y, 1.1, 0, 2 * Math.PI);
    screenCtx.fill();
    interferenceHitCount++;
  }
  if (interferenceHitCount % 15 < INTERFERENCE_HITS_PER_FRAME) {
    const el = document.getElementById('interference-count');
    if (el) el.textContent = `· ${interferenceHitCount} detected`;
  }
}

function interferenceAnimate() {
  interferenceTime += INTERFERENCE_DT;
  const geo = interferenceGeometry();
  drawRipple(geo);
  interferenceAddHits(geo);
  interferenceAnimId = requestAnimationFrame(interferenceAnimate);
}

function resetScreen() {
  if (screenCtx) screenCtx.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
  interferenceHitCount = 0;
  const el = document.getElementById('interference-count');
  if (el) el.textContent = '';
}

const INTERFERENCE_MODE_COPY = {
  double: 'Both slits are open and the paths are indistinguishable. Watch the dots pile up — one at a time, at random-looking positions — and slowly reveal stripes. That pattern is only possible because each particle had two paths available.',
  single: 'Only one path exists now — no partner wave to interfere with. The dots pile into a single soft blob, no stripes, exactly like tossing pebbles at a wall with one hole.',
  'which-path': 'Both slits are still open, but a detector at each one is now tagging which path every particle took. The stripes vanish, replaced by a plain double-humped pile — knowing the path, even in principle, is enough to destroy the interference.'
};

function setInterferenceMode(mode) {
  interferenceMode = mode;
  document.querySelectorAll('.mode-btn[data-mode]').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  resetScreen();
  setExplainer('interference-explainer', INTERFERENCE_MODE_COPY[mode]);
}

function onInterferenceSliderChange() {
  document.getElementById('slit-sep-val').textContent   = interferenceSlitSep();
  document.getElementById('wavelength-val').textContent = interferenceWavelen();
  resetScreen();
}

function ensureInterferenceStarted() {
  if (!interferenceInitialized) {
    rippleCanvas = document.getElementById('ripple-canvas');
    rippleCtx    = rippleCanvas.getContext('2d');
    screenCanvas = document.getElementById('screen-canvas');
    screenCtx    = screenCanvas.getContext('2d');
    interferenceInitialized = true;
  }
  if (!interferenceAnimId) interferenceAnimId = requestAnimationFrame(interferenceAnimate);
}

/* Pauses the rAF loop while the Interference tab isn't visible — called
   by app.js's tab-switch handler instead of touching interferenceAnimId
   directly. */
function stopInterferenceSim() {
  if (interferenceAnimId) {
    cancelAnimationFrame(interferenceAnimId);
    interferenceAnimId = null;
  }
}


// ════════ js/tabs/beam-splitter-tab.js ════════
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


// ════════ js/tabs/stern-gerlach-tab.js ════════
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


// ════════ js/tabs/teleport-tab.js ════════
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


// ════════ js/tabs/superdense-tab.js ════════
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


// ════════ js/tabs/noise-tab.js ════════
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


// ════════ js/tabs/grover-tab.js ════════
// Depends on: core/two-qubit.js (TwoQubitState) and core/three-qubit.js
// (ThreeQubitState) — both gained the same two Grover primitives this
// term: applyPhaseFlip() (the oracle) and applyDiffusionReflect()
// (diffusion's fixed middle step). core/gates.js (GATES), core/utils.js
// (delay()), core/dom-utils.js (setExplainer), core/tab-registry.js
// (registerTab).
//
// ALGORITHM (verified computationally for every possible marked item, in
// both N=4 and N=8, before this UI was built — see tests/run.js):
//   Two selectable sizes, the same algorithm at two points on its own
//   accuracy curve, not two different ideas:
//     - N=4 (2 qubits), 1 iteration: exact. Probability at the marked
//       index is exactly 1 after one query — the textbook special case.
//     - N=8 (3 qubits), 2 iterations: the general case made visible.
//       Probability peaks at ~94.5%, not 1, and a 3rd iteration would
//       overshoot past that peak rather than improving on it.
//   Both run the same sequence: H on every qubit, then `iterations`
//   repetitions of [oracle: flip the marked item's amplitude sign alone
//   (applyPhaseFlip) — diffusion: H on every qubit, flip every amplitude
//   except |0...0⟩'s (applyDiffusionReflect), H on every qubit again],
//   then measure every qubit.

const GROVER_MODES = {
  n4: { qubits: 2, N: 4, iterations: 1 },
  n8: { qubits: 3, N: 8, iterations: 2 }
};
let groverMode = 'n4';
let groverTarget = '00';
let groverAnimating = false;
let groverSearchCount = 0;
let groverFoundCount = 0;
const GROVER_STEP_MS = 750;

function groverItems() {
  const { qubits, N } = GROVER_MODES[groverMode];
  return Array.from({ length: N }, (_, i) => i.toString(2).padStart(qubits, '0'));
}
function groverIdx(key) { return parseInt(key, 2); }
function groverNewState() { return groverMode === 'n8' ? new ThreeQubitState() : new TwoQubitState(); }
function groverSuffix() { return groverMode === 'n8' ? '-n8' : ''; }

function setGroverTarget(key) {
  if (groverAnimating) return;
  groverTarget = key;
  const suffix = groverSuffix();
  document.querySelectorAll('[data-grover-target]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.groverTarget === key));
  document.getElementById('grover-target-val').textContent = key;
  document.getElementById('grover-found-val').textContent = '?';
  document.getElementById('grover-found-val').classList.remove('set');
  document.getElementById(`grover-oracle-gate-target${suffix}`).textContent =
    t('grover.oracleMarks', 'marks {t}').replace('{t}', key);

  // A new target invalidates the previous run's results everywhere, not
  // just the Found chip — without this, picking a new item without
  // pressing Search again left the amplitude chart and the circuit's own
  // meter readout showing the old target's numbers next to the new
  // target's label, an actual mismatch rather than just an unrun state.
  const { qubits } = GROVER_MODES[groverMode];
  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = '?';
  }
  updateGroverBars(groverNewState());
}

/** Redraws every bar for the current mode's item set from a live state —
 *  bar height is the probability (|amplitude|²), the badge above it is
 *  the amplitude's sign. The two deliberately don't always move together:
 *  right after the oracle, every sign badge can change while every bar
 *  height stays exactly put — that gap is the entire point of the demo.
 *  Only touches the elements for the current mode's item keys, so the
 *  other mode's (hidden) chart is simply left alone. */
function updateGroverBars(state) {
  groverItems().forEach((key, idx) => {
    const histEl = document.getElementById(`grover-hist-${key}`);
    if (!histEl) return;
    const p = state.prob(idx) * 100;
    histEl.style.height = p + '%';
    document.getElementById(`grover-pct-${key}`).textContent = Math.round(p) + '%';
    const signEl = document.getElementById(`grover-sign-${key}`);
    const negative = state.amps[idx].r < -1e-9;
    signEl.textContent = negative ? '−' : '+';
    signEl.classList.toggle('grover-sign-neg', negative);
  });
}

function updateGroverTally() {
  const el = document.getElementById('grover-tally-text');
  if (!groverSearchCount) { el.textContent = ''; return; }
  const key = groverMode === 'n8' ? 'grover.tallyN8' : 'grover.tally';
  const fallback = groverMode === 'n8'
    ? '{n} searches · {found}/{n} found after 2 queries'
    : '{n} searches · {found}/{n} found on the first query';
  el.textContent = t(key, fallback)
    .replace('{n}', groverSearchCount).replace('{found}', groverFoundCount).replace('{n}', groverSearchCount);
}

/** One-shot spotlight on a circuit element for its ~700ms turn in the
 *  run — same pattern as Superdense Coding's own pulseStage(), reused
 *  here rather than reimplemented: .teleport-stage/.active (teleport.css)
 *  already defines the glow keyframe, so this only needs to toggle it. */
function pulseGroverStage(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 700);
}

/** Diffusion's own three gates (H, reflection, H) ripple left-to-right
 *  in the order they actually run, rather than one box standing in for
 *  all three — mode-aware since N=4 and N=8 use different element ids
 *  (and N=8 has a third wire's worth of H gates either side). */
function pulseGroverDiffuser(qubits, suffix) {
  for (let q = 0; q < qubits; q++) pulseGroverStage(`grover-gate-diffuse-h${q}a${suffix}`);
  setTimeout(() => pulseGroverStage(`grover-gate-reflect${suffix}`), 200);
  setTimeout(() => { for (let q = 0; q < qubits; q++) pulseGroverStage(`grover-gate-diffuse-h${q}b${suffix}`); }, 400);
}

async function runGrover() {
  if (groverAnimating) return;
  groverAnimating = true;
  document.getElementById('btn-grover-search').disabled = true;
  document.getElementById('btn-reset-grover').disabled = true;
  document.getElementById('grover-result').textContent = t('grover.resultRunning', 'running…');
  document.getElementById('grover-found-val').textContent = '?';
  document.getElementById('grover-found-val').classList.remove('set');

  const { qubits, N, iterations } = GROVER_MODES[groverMode];
  const suffix = groverSuffix();
  const targetIdx = groverIdx(groverTarget);
  const state = groverNewState();

  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = '?';
  }
  document.getElementById('grover-iteration-badge').textContent = '';

  setExplainer('grover-explainer', t('grover.stepStart', 'Every search starts at a definite, uninteresting state — all zeros, exactly like a classical register before you\'ve looked at anything.'));
  updateGroverBars(state);
  await delay(GROVER_STEP_MS);

  for (let q = 0; q < qubits; q++) {
    pulseGroverStage(`grover-gate-h${q}${suffix}`);
    state.applySingleQubitGate(q, GATES.H.matrix);
  }
  setExplainer('grover-explainer', t('grover.stepSuperpose', 'A Hadamard on each qubit spreads the amplitude equally across all {n} items at once — every candidate is "live" simultaneously, not checked one at a time.').replace('{n}', N));
  updateGroverBars(state);
  await delay(GROVER_STEP_MS);

  for (let iter = 1; iter <= iterations; iter++) {
    if (iterations > 1) {
      document.getElementById('grover-iteration-badge').textContent =
        t('grover.iterationBadge', 'Iteration {iter} of {total}').replace('{iter}', iter).replace('{total}', iterations);
    }

    pulseGroverStage(`grover-gate-oracle${suffix}`);
    state.applyPhaseFlip(targetIdx);
    setExplainer('grover-explainer', t('grover.stepOracle', 'The oracle recognizes the marked item and flips the sign of its amplitude alone. Look closely: none of the bars moved — a probability is the squared size of an amplitude, and a negative amplitude squares to exactly the same probability as a positive one the same size. This step is completely invisible to any measurement taken right now.'));
    updateGroverBars(state);
    await delay(GROVER_STEP_MS);

    pulseGroverDiffuser(qubits, suffix);
    for (let q = 0; q < qubits; q++) state.applySingleQubitGate(q, GATES.H.matrix);
    state.applyDiffusionReflect();
    for (let q = 0; q < qubits; q++) state.applySingleQubitGate(q, GATES.H.matrix);

    let diffuseMsg;
    if (iterations === 1) {
      diffuseMsg = t('grover.stepDiffuse', 'Diffusion reflects every amplitude about their shared average. The other amplitudes, already near that average, collapse toward zero; the marked one, sitting on the far side after its sign flipped, gets thrown past the average by twice the gap — turning that invisible phase flip into a visible answer.');
    } else {
      const pctNow = Math.round(state.prob(targetIdx) * 1000) / 10;
      diffuseMsg = t('grover.stepDiffuseIteration', 'Diffusion reflects every amplitude about their shared average, the same rule as always. Iteration {iter} of {total} complete: the marked item\'s probability is now {pct}%.')
        .replace('{iter}', iter).replace('{total}', iterations).replace('{pct}', pctNow);
      if (iter === iterations) {
        diffuseMsg += ' ' + t('grover.overshootNote', 'That\'s the peak for N=8 — a third iteration would overshoot past it, dropping the probability back down to about 33%, not up.');
      }
    }
    setExplainer('grover-explainer', diffuseMsg);
    updateGroverBars(state);
    await delay(GROVER_STEP_MS);
  }

  for (let q = 0; q < qubits; q++) pulseGroverStage(`grover-meter-${q}${suffix}`);
  const bits = [];
  for (let q = 0; q < qubits; q++) bits.push(state.measureQubit(q));
  const found = bits.join('');
  const match = found === groverTarget;

  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = bits[q];
  }
  document.getElementById('grover-found-val').textContent = found;
  document.getElementById('grover-found-val').classList.add('set');
  groverSearchCount++;
  if (match) groverFoundCount++;
  updateGroverTally();

  if (iterations === 1) {
    document.getElementById('grover-result').textContent = match
      ? t('grover.resultMatch', 'Found on the first query')
      : t('grover.resultMismatch', 'Missed — check the console, this should never happen for N=4');
    setExplainer('grover-explainer', t('grover.stepMeasure', 'One query, one measurement, done: {found} — for {n} items with 1 marked, exactly one Grover iteration gives the marked item probability 1, a real measurement over a distribution with no actual uncertainty left in it.').replace('{found}', found).replace('{n}', N));
  } else {
    document.getElementById('grover-result').textContent = match
      ? t('grover.resultMatchN8', 'Found after 2 queries')
      : t('grover.resultMismatchN8', 'Missed this time — genuinely possible about 1 time in 20 for N=8, not a bug');
    setExplainer('grover-explainer', t('grover.stepMeasureApprox', '2 queries, one measurement, done: {found} — for 8 items with 1 marked, 2 Grover iterations bring the marked item\'s probability to about 94.5%, not exactly 1 this time; measured this way, that\'s still a real Born-rule draw, just one where a small, genuine chance of missing remains.').replace('{found}', found));
  }

  groverAnimating = false;
  document.getElementById('btn-grover-search').disabled = false;
  document.getElementById('btn-reset-grover').disabled = false;
}

function resetGrover() {
  if (groverAnimating) return;
  groverSearchCount = 0;
  groverFoundCount = 0;
  updateGroverTally();
  document.getElementById('grover-found-val').textContent = '?';
  document.getElementById('grover-found-val').classList.remove('set');
  document.getElementById('grover-result').textContent = '—';
  document.getElementById('grover-iteration-badge').textContent = '';
  const { qubits } = GROVER_MODES[groverMode];
  const suffix = groverSuffix();
  for (let q = 0; q < qubits; q++) {
    const el = document.getElementById(`grover-circuit-out${q}${suffix}`);
    if (el) el.textContent = '?';
  }
  updateGroverBars(groverNewState());
  setExplainer('grover-explainer', t('grover.explainerDefault', 'Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.'));
}

/** Switches which of the two (otherwise-identical) circuit/picker/chart
 *  pairs is visible — the two modes are the same algorithm at two sizes,
 *  not two different tabs, so this only ever toggles display, resets the
 *  shared state variables, and re-runs setGroverTarget() for the new
 *  mode's own all-zeros default rather than duplicating that reset logic. */
function setGroverMode(mode) {
  if (groverAnimating || mode === groverMode) return;
  groverMode = mode;
  document.querySelectorAll('[data-grover-mode]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.groverMode === mode));

  document.getElementById('grover-circuit-n4-wrap').style.display = mode === 'n4' ? '' : 'none';
  document.getElementById('grover-circuit-n8-wrap').style.display = mode === 'n8' ? '' : 'none';
  document.getElementById('grover-target-picker').style.display = mode === 'n4' ? '' : 'none';
  document.getElementById('grover-target-picker-n8').style.display = mode === 'n8' ? '' : 'none';
  document.getElementById('grover-chart-n4').style.display = mode === 'n4' ? '' : 'none';
  document.getElementById('grover-chart-n8').style.display = mode === 'n8' ? '' : 'none';

  document.getElementById('grover-mode-desc').textContent = mode === 'n8'
    ? t('grover.modeN8Desc', '3 qubits, 1 marked item — needs 2 queries, and even then peaks below 100%.')
    : t('grover.modeN4Desc', '2 qubits, 1 marked item — a single query is exact.');

  groverSearchCount = 0;
  groverFoundCount = 0;
  updateGroverTally();
  setGroverTarget('0'.repeat(GROVER_MODES[mode].qubits));
  document.getElementById('grover-result').textContent = '—';
  setExplainer('grover-explainer', t('grover.explainerDefault', 'Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.'));
}

function initGroverTab() {
  document.querySelectorAll('[data-grover-target]').forEach(btn =>
    btn.addEventListener('click', () => setGroverTarget(btn.dataset.groverTarget)));
  document.querySelectorAll('[data-grover-mode]').forEach(btn =>
    btn.addEventListener('click', () => setGroverMode(btn.dataset.groverMode)));
  document.getElementById('btn-grover-search').addEventListener('click', runGrover);
  document.getElementById('btn-reset-grover').addEventListener('click', resetGrover);

  setGroverTarget('00');
  updateGroverTally();
  registerTab('grover', {});
}


// ════════ js/roadmap.js ════════
// Roadmap mode — a cross-cutting, non-simulation feature (parallel to
// tour.js): the app's landing page defaults to a mind-map of every
// concept: click a node and it's goToLessonSimulation() below that
// switches app mode and jumps straight to that concept's simulation tab
// (see app.js's switchToTab()). Each simulation tab then carries its own
// lesson text + "Mark as read" + quick-check quiz, embedded at the
// bottom of its section by renderEmbeddedLessons() below (into that
// tab's #lesson-embed-<tab> placeholder in index.html) — so the write-up
// and the quiz for a concept live on the same page as the concept
// itself. A "My Progress" sub-view (setRoadmapMode()) sits alongside the
// mind-map on the home page for a compact read-only summary of the same
// completedLessons/quizAnswers state — there's no separate standalone
// quiz sequence, only the per-lesson quick checks.
// NOT part of the tabs/TABS registry — it has its own top-level mode
// toggle (Concepts/Home) in the header, entirely independent of
// switchToTab()'s tab-content sweep (see the header comment in app.js's
// switchToTab for why that matters). Depends on app.js's
// switchToTab()/currentTab, only inside goToLessonSimulation() — called
// long after all scripts run, so it's safe regardless of load order,
// same reasoning as tour.js.

// ═══════════════════════════════════════════════════════════════════
// LESSON + QUIZ CONTENT
// ═══════════════════════════════════════════════════════════════════
const ROADMAP_LESSONS = [
  { id: 'qubit', title: 'Bits', tab: 'qubit',
    body: 'A classical bit is always definitively 0 or 1. A qubit can be in a superposition of both at once, described by two amplitudes rather than a single value. The Bloch sphere gives every possible qubit state a point on its surface.' },
  // Maths Concept's five reference sections each get their own lesson +
  // quiz (id !== tab, all sharing tab: 'mathsconcept') rather than one
  // lesson for the whole tab — unlike every other entry here, each
  // section is a distinct, self-contained topic worth checking on its
  // own. See renderEmbeddedLessons()'s id-keyed lookup above.
  { id: 'maths-complex', title: 'Complex Numbers', tab: 'mathsconcept',
    body: 'A qubit\'s amplitudes are complex numbers, not just real ones — each has a real and imaginary part, z = a + bi. Only the squared modulus |z|² is directly observable as a probability; the phase is invisible to a single measurement but is exactly what drives interference.' },
  { id: 'maths-vectors', title: 'Vectors', tab: 'mathsconcept',
    body: 'A qubit\'s state is a column vector [α, β] in a 2D complex vector space, with |0⟩ and |1⟩ as the basis. Normalization |α|² + |β|² = 1 keeps total probability at 100%, and the inner product measures how much two states overlap.' },
  { id: 'maths-matrices', title: 'Matrices', tab: 'mathsconcept',
    body: 'Every quantum gate is a unitary matrix (U†U = I) acting on the state vector by matrix multiplication. Unitarity guarantees a gate never destroys or creates probability — which is exactly why every quantum gate is reversible.' },
  { id: 'maths-statevector', title: 'State Vector', tab: 'mathsconcept',
    body: 'The state vector |ψ⟩ = α|0⟩ + β|1⟩ is the complete description of a qubit. In Bloch-sphere form, |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩ — θ and φ are exactly the two sliders on the Bits & Qubits Bloch sphere.' },
  { id: 'maths-dirac', title: 'Dirac Notation', tab: 'mathsconcept',
    body: 'Dirac\'s bra-ket notation is shorthand for vectors and their inner products: |ψ⟩ is a ket, ⟨ψ| its bra, and ⟨φ|ψ⟩ their inner product. |0⟩ and |1⟩ are orthonormal — ⟨0|1⟩ = 0, ⟨0|0⟩ = ⟨1|1⟩ = 1.' },
  { id: 'maths-tensor', title: 'Tensor Products', tab: 'mathsconcept',
    body: 'Two independent vectors combine via the tensor product (⊗) into one larger joint vector — stack every entry of the first against every entry of the second, multiplying each pair. Two qubits combine this way into a 4-entry joint state; not every joint state can be split back apart, and the ones that can\'t are exactly the entangled ones.' },
  { id: 'gates', title: 'Quantum Gates', tab: 'gates',
    body: 'Gates are the operations that move a qubit around the Bloch sphere — reversible rotations rather than the destructive logic of classical gates. Each one (H, X, Y, Z, S, T) has a precise geometric effect you can watch happen.' },
  { id: 'circuit', title: 'Circuits', tab: 'circuit',
    body: 'A circuit is a sequence of gates applied left to right. In a classical circuit, logic gates like AND/OR/XOR combine bits by strict rules — the same input always gives the same output. In a quantum circuit, order matters in a deeper way: running the same gates in a different sequence can land the qubit in a completely different state, just like turns in a route. Switch to 2 or 3 Qubits and add CNOT to build entangled states — Bell pairs and GHZ states — gate by gate, the same recipes behind the Entangle tab.' },
  { id: 'bellstates', title: 'Bell States', tab: 'bellstates',
    body: 'The four Bell states — Φ⁺, Φ⁻, Ψ⁺, and Ψ⁻ — are the maximally entangled two-qubit states, all built from the same Hadamard-then-CNOT recipe starting from a different one of the four basis states. Φ⁺/Φ⁻ always measure to matching outcomes, Ψ⁺/Ψ⁻ always to opposite ones — the relative phase behind each ± sign is invisible to a direct measurement, only showing up once the qubits are interfered with each other.' },
  { id: 'measure', title: 'Measurement', tab: 'measure',
    body: 'Measuring a qubit forces it to commit to a definite outcome, 0 or 1, with probabilities set by its amplitudes just before measurement. This is the collapse of superposition — irreversible and probabilistic, not a hidden pre-existing value.' },
  { id: 'entangle', title: 'Entanglement', tab: 'entangle',
    body: 'Two qubits can be linked so that measuring one instantly determines the other\'s outcome, no matter how far apart they are. This correlation is stronger than anything possible between classical bits.' },
  { id: 'tunnel', title: 'Quantum Tunneling', tab: 'tunnel',
    body: 'A quantum wave packet has a nonzero chance of appearing on the far side of a barrier it classically shouldn\'t be able to cross, because its probability cloud extends through the barrier rather than stopping at it.' },
  { id: 'interference', title: 'Interference', tab: 'interference',
    body: 'When two paths to the same outcome are indistinguishable, their probability amplitudes combine and can reinforce or cancel — producing stripes on a screen instead of two simple piles. Marking which path was taken destroys the pattern.' },
  { id: 'beamsplitter', title: 'Beam Splitter', tab: 'beamsplitter',
    body: 'A 50/50 beam splitter sends a single photon down one of two paths with equal probability — reflected to one detector or transmitted to the other. The photon isn\'t secretly divided between both paths; only one detector ever clicks per photon, and which one is genuinely random each time.' },
  { id: 'sterngerlach', title: 'Stern–Gerlach Experiment', tab: 'sterngerlach',
    body: 'A beam of silver atoms passing through an inhomogeneous magnetic field splits into exactly two discrete spots, never a continuous smear — direct evidence that spin is quantized, with only two possible outcomes along any measurement axis, exactly like a qubit\'s own |0⟩/|1⟩ measurement results.' },
  { id: 'teleport', title: 'Quantum Teleportation', tab: 'teleport',
    body: 'Alice can send Bob the exact state of a qubit without ever sending the qubit itself — using one pre-shared entangled pair and two classical bits. Her own qubit is destroyed by the measurement this requires, so no copy ever exists at both ends at once, exactly as the no-cloning theorem demands.' },
  { id: 'superdense', title: 'Superdense Coding', tab: 'superdense',
    body: 'Teleportation\'s mirror image: Alice sends Bob two classical bits using only one qubit, by encoding her message onto her half of a pre-shared entangled pair and physically sending Bob that single qubit. Bob decodes both bits exactly, every time — nothing about this protocol is probabilistic.' },
  { id: 'noise', title: 'Noise & Decoherence', tab: 'noise',
    body: 'Real qubits aren\'t perfectly isolated: T₁ relaxation lets them leak energy toward |0⟩, and T₂ dephasing erases the relative phase that makes a superposition meaningful. Both shrink the Bloch vector toward the center — the same "mixed state" signature already seen when tracing out an entangled qubit, just caused by an uncontrolled environment instead of a deliberate measurement.' },
  { id: 'grover', title: 'Grover\'s Search', tab: 'grover',
    body: 'Grover\'s algorithm finds one marked item among N by amplitude amplification rather than checking items one at a time: an oracle flips the marked item\'s amplitude sign (invisible to any measurement, since probability only depends on the amplitude\'s size), then a fixed "diffusion" step turns that invisible flip into a visible boost. For N=4 with one marked item, a single query brings its measurement probability to exactly 1 — a real quadratic speedup over the best any classical search can do.' }
];

// One question per lesson (lessonId matches ROADMAP_LESSONS[].id), shown
// as a "Quick check" embedded directly under that lesson's body.
// `explanation` is shown after answering, regardless of whether the pick
// was right or wrong.
const ROADMAP_QUIZ = [
  { lessonId: 'qubit',
    q: 'A classical bit and a qubit both start in a definite state. What is the key difference between them?',
    options: ['Qubits can hold a superposition of 0 and 1 at once', 'Qubits are just faster bits', 'Qubits can only be measured once, ever', 'There is no real difference'],
    correct: 0,
    explanation: 'A qubit\'s amplitudes let it genuinely be a mix of both basis states until measured — a classical bit never has that option.' },
  { lessonId: 'maths-complex',
    q: 'Why do qubit amplitudes need to be complex numbers rather than just real numbers?',
    options: ['Complex numbers are more precise than real numbers', 'The extra phase in a complex number is what makes interference between paths possible', 'Real numbers can\'t be negative', 'It\'s just a mathematical convention with no physical meaning'],
    correct: 1,
    explanation: 'Two real amplitudes could still cancel by sign, but only a complex phase lets amplitudes reinforce or cancel at any relative angle — that richer freedom is exactly what interference exploits.' },
  { lessonId: 'maths-vectors',
    q: 'What does the normalization condition |α|² + |β|² = 1 guarantee about a qubit state?',
    options: ['That the qubit is entangled', 'That the total measurement probability across |0⟩ and |1⟩ adds up to exactly 100%', 'That the qubit has been measured', 'That α and β are both real numbers'],
    correct: 1,
    explanation: 'P(0) + P(1) = |α|² + |β|² must equal 1 for the Born rule to make sense as a probability distribution — every valid point on the Bloch sphere already satisfies this automatically.' },
  { lessonId: 'maths-matrices',
    q: 'What property must every valid quantum gate matrix U satisfy?',
    options: ['det(U) = 0', 'U†U = I (U is unitary)', 'U must be a real-valued matrix', 'U must have exactly two rows'],
    correct: 1,
    explanation: 'Unitarity is what keeps the state vector normalized after the gate is applied — it\'s also exactly the condition that makes every quantum gate reversible, unlike a classical AND gate.' },
  { lessonId: 'maths-statevector',
    q: 'In the Bloch-sphere form |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩, what do θ and φ correspond to?',
    options: ['Two independent qubits', 'The exact same θ/φ sliders used to set a state on the Bloch sphere', 'The number of gates applied so far', 'The measurement outcome'],
    correct: 1,
    explanation: 'Every point on the Bloch sphere is just this equation with one (θ,φ) pair plugged in — the sphere is a picture of the formula, not a separate thing.' },
  { lessonId: 'maths-dirac',
    q: 'What does it mean that ⟨0|1⟩ = 0?',
    options: ['|0⟩ and |1⟩ are the same state', '|0⟩ and |1⟩ are orthogonal — completely distinguishable outcomes', 'The qubit is in superposition', 'A measurement error occurred'],
    correct: 1,
    explanation: 'Orthogonality is exactly why measurement always returns a clean 0 or 1, never something "in between" — |0⟩ and |1⟩ share zero overlap.' },
  { lessonId: 'maths-tensor',
    q: 'Two independent qubits, each a 2-entry vector, combine via the tensor product into a joint state. How many entries does that joint state have?',
    options: ['2', '4', '8', 'It depends on the qubits\' amplitudes'],
    correct: 1,
    explanation: 'The tensor product of a 2-entry vector with another 2-entry vector always has 2×2 = 4 entries — one for each combination of basis outcomes, |00⟩, |01⟩, |10⟩, |11⟩ — regardless of what the actual amplitudes are.' },
  { lessonId: 'gates',
    q: 'What does the Hadamard (H) gate do to a qubit starting at |0⟩?',
    options: ['Flips it directly to |1⟩', 'Puts it into an equal superposition of |0⟩ and |1⟩', 'Measures it immediately', 'Entangles it with another qubit'],
    correct: 1,
    explanation: 'H rotates |0⟩ to the equator of the Bloch sphere — 50/50 odds, with a fixed phase relationship between the two amplitudes.' },
  { lessonId: 'circuit',
    q: 'In a quantum circuit, why does the order of gates matter?',
    options: ['It doesn\'t — gates always commute', 'Each gate rotates the state, and rotations generally don\'t commute', 'Only the last gate has any effect', 'Order only matters for measurement'],
    correct: 1,
    explanation: 'Each gate is a rotation of the Bloch sphere, and 3D rotations don\'t generally commute — X then Z lands somewhere different than Z then X.' },
  { lessonId: 'bellstates',
    q: 'Φ⁺ = (|00⟩ + |11⟩)/√2 and Φ⁻ = (|00⟩ − |11⟩)/√2 are different states, yet measuring either one in this demo gives identical statistics. Why?',
    options: ['They are actually the same state written two ways', 'A relative phase (the − sign) doesn\'t change any computational-basis probability, only |amplitude|² does', 'The demo has a bug and can\'t tell them apart', 'Only Φ⁺ is a real Bell state'],
    correct: 1,
    explanation: 'Probabilities come from |amplitude|², which is identical for +1/√2 and −1/√2. The two states are still physically distinct — the phase becomes visible once the qubits are interfered with each other, e.g. by applying a Hadamard to each before measuring.' },
  { lessonId: 'measure',
    q: 'What happens to a qubit\'s superposition when you measure it?',
    options: ['Nothing changes', 'It collapses to a single definite outcome', 'It splits into two qubits', 'It becomes entangled automatically'],
    correct: 1,
    explanation: 'There\'s no hidden fact about which outcome it "really" was beforehand — measuring is what produces a definite answer, weighted by the amplitudes.' },
  { lessonId: 'entangle',
    q: 'Two qubits are entangled. You measure the first and get |1⟩. What happens to the second?',
    options: ['Nothing — they are independent', 'Its outcome is now instantly correlated with the first, per their entangled state', 'It is destroyed', 'It becomes a classical bit'],
    correct: 1,
    explanation: 'Their amplitudes were linked the moment they became entangled — measuring one doesn\'t send a signal, it just reveals a correlation baked in from the start.' },
  { lessonId: 'tunnel',
    q: 'What is quantum tunneling?',
    options: ['A qubit teleporting instantly across space', 'A wave packet having nonzero probability of appearing beyond a classically-forbidden barrier', 'A gate that deletes a qubit', 'A measurement error'],
    correct: 1,
    explanation: 'The wavefunction doesn\'t stop dead at a barrier — it decays exponentially inside it, so a thin enough barrier still leaves nonzero amplitude on the far side.' },
  { lessonId: 'interference',
    q: 'In the double-slit experiment, what causes the interference stripes on the screen?',
    options: ['Two separate particles colliding', 'Probability amplitudes from indistinguishable paths adding or canceling', 'The screen material', 'Measurement collapse happening early'],
    correct: 1,
    explanation: 'Each screen point has two possible paths; when they\'re indistinguishable their amplitudes add and can reinforce or cancel, producing the fringes.' },
  { lessonId: 'beamsplitter',
    q: 'A single photon hits a 50/50 beam splitter. What actually happens?',
    options: ['The photon splits in half, with half going to each detector', 'The photon goes to exactly one detector, chosen at random with 50/50 odds', 'Both detectors always click together', 'Neither detector clicks unless you measure twice'],
    correct: 1,
    explanation: 'A photon is never divided between paths — the beam splitter puts it into a superposition of "reflected" and "transmitted", and measuring (the detector clicking) forces one definite outcome, same as measuring a qubit.' },
  { lessonId: 'sterngerlach',
    q: 'A beam of silver atoms passes through a Stern–Gerlach magnet. What does the experiment actually show on the detector screen?',
    options: ['A continuous smear from one extreme to the other', 'Exactly two discrete spots, never anything in between', 'A single spot in the exact center', 'No pattern at all — the atoms are absorbed'],
    correct: 1,
    explanation: 'Classically, a randomly-oriented magnetic dipole should deflect by any amount, producing a continuous smear. Stern and Gerlach found only two discrete spots — direct evidence that spin, like a qubit\'s own measurement outcomes, is quantized into just two possibilities along any axis.' },
  { lessonId: 'teleport',
    q: 'After Bob applies his correction gates, how does his qubit compare to Alice\'s original message?',
    options: ['It\'s a good approximation, close but not exact', 'It exactly matches — same amplitudes, same state', 'It\'s a classical copy, not a real quantum state', 'It only matches half the time'],
    correct: 1,
    explanation: 'Once the correct Z/X correction is applied, Bob\'s qubit equals Alice\'s original exactly, not approximately — that\'s the whole point of the protocol\'s classically-controlled correction step.' },
  { lessonId: 'superdense',
    q: 'In superdense coding, what actually has to physically travel from Alice to Bob?',
    options: ['Two classical bits, sent by radio or phone', 'A single qubit', 'Nothing — the entangled pair alone is enough', 'Four qubits, one per possible message'],
    correct: 1,
    explanation: 'Only Alice\'s one qubit ever travels. The entangled pair was shared in advance, and her message is encoded onto that single qubit before she sends it — that\'s what makes it "superdense": 2 bits of information from just 1 qubit of communication.' },
  { lessonId: 'noise',
    q: 'A qubit starts in a genuine superposition. After it fully decoheres (T₂ has elapsed many times over), what happens to its Bloch vector?',
    options: ['Nothing — decoherence only affects measurement, not the state', 'It shrinks toward the center, the same signature as a mixed/entangled state', 'It grows longer than 1', 'It instantly jumps to the south pole'],
    correct: 1,
    explanation: 'Losing coherence to the environment is mathematically identical to becoming entangled with something you can\'t track — both leave the qubit\'s own Bloch vector shorter than 1, a genuinely mixed state, not just a randomized pure one.' },
  { lessonId: 'grover',
    q: 'Right after Grover\'s oracle flips the marked item\'s amplitude sign, what happens to the measured probability of finding it?',
    options: ['It jumps straight to 1', 'It stays exactly the same as before the oracle ran', 'It drops to 0', 'It becomes random'],
    correct: 1,
    explanation: 'Probability comes from |amplitude|², and a sign flip alone doesn\'t change that: (−0.5)² = (0.5)². The oracle\'s phase kick is completely invisible to a measurement until the diffusion step turns it into an actual probability boost.' }
];

// ═══════════════════════════════════════════════════════════════════
// PROGRESS PERSISTENCE (localStorage — same convention as theme.js/tour.js)
// ═══════════════════════════════════════════════════════════════════
const ROADMAP_STORAGE_KEY = 'qe-roadmap-progress';

function loadRoadmapProgress() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(ROADMAP_STORAGE_KEY)); } catch (e) { raw = null; }
  return {
    completedLessons: Array.isArray(raw && raw.completedLessons) ? raw.completedLessons : [],
    // Per-lesson "Quick check" answers: { [lessonId]: chosenOptionIndex }
    quizAnswers: (raw && typeof raw.quizAnswers === 'object' && raw.quizAnswers !== null) ? raw.quizAnswers : {}
  };
}

function saveRoadmapProgress() {
  localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(roadmapProgress));
}

/** Wipes every "Mark as read" and quick-check answer so every lesson
 *  (including all five Maths Concept sections) can be retaken from
 *  scratch — confirmed first (via showConfirmModal(), core/dom-utils.js)
 *  since this is destructive and, unlike toggling a single lesson, can't
 *  be undone with one more click. */
function resetRoadmapProgress() {
  showConfirmModal({
    title: 'Reset all progress?',
    message: 'This clears every lesson\'s "read" status and quiz answer, including all five Maths Concept sections. This can\'t be undone.',
    confirmLabel: 'Reset progress',
    danger: true,
    onConfirm: () => {
      roadmapProgress = { completedLessons: [], quizAnswers: {} };
      saveRoadmapProgress();
      refreshLessonUI();
    }
  });
}

let roadmapProgress = loadRoadmapProgress();

// ═══════════════════════════════════════════════════════════════════
// MODE SWITCHING
// ═══════════════════════════════════════════════════════════════════
/** Top-level Concepts/Home switch. Only reads .tab-content/currentTab
 *  state (via inline style.display) — never mutates which one carries
 *  .active, so returning to 'sim' restores exactly the tab that was
 *  active before, with no extra bookkeeping. */
function setAppMode(mode) {
  document.querySelectorAll('.mode-btn[data-app-mode]').forEach(b =>
    b.classList.toggle('active', b.dataset.appMode === mode));
  document.getElementById('tab-sidebar').style.display = mode === 'sim' ? '' : 'none';
  document.querySelectorAll('.tab-content').forEach(s => { s.style.display = mode === 'sim' ? '' : 'none'; });
  document.getElementById('roadmap-view').classList.toggle('active', mode === 'roadmap');
  // Both the mind-map and #roadmap-progress-panel sit at display:none
  // until this toggle — any earlier render measured a 0x0 (or hidden)
  // container. Re-render whichever roadmap sub-view is current now that
  // it's actually visible.
  if (mode === 'roadmap') {
    if (roadmapSubMode === 'map') renderRoadmapMindmap();
    else renderRoadmapProgress();
  }

  // Same reasoning as switchToTab()'s own scrollTo (app.js) — Home and
  // Concepts are full page swaps sharing the one window scroll position,
  // so this needs the same reset switchToTab() already gets.
  window.scrollTo(0, 0);
  syncLocationAndTitle();
}

let roadmapSubMode = 'map';

/** Concept Map/My Progress sub-switch on the home page — mirrors
 *  circuit-multiqubit-tab.js's setCircuitMode(). The mind-map keeps the
 *  full-viewport treatment (.roadmap-hero--full); the progress summary
 *  is a compact, natural-height card list instead. */
function setRoadmapMode(mode) {
  roadmapSubMode = mode;
  document.querySelectorAll('.mode-btn[data-roadmap-mode]').forEach(b =>
    b.classList.toggle('active', b.dataset.roadmapMode === mode));
  document.getElementById('roadmap-mindmap').style.display = mode === 'map' ? '' : 'none';
  document.getElementById('roadmap-mindmap-fallback').style.display = mode === 'map' ? '' : 'none';
  document.getElementById('roadmap-progress-panel').style.display = mode === 'progress' ? '' : 'none';
  document.getElementById('roadmap-hero').classList.toggle('roadmap-hero--full', mode === 'map');
  if (mode === 'map') renderRoadmapMindmap();
  else renderRoadmapProgress();
}

// ═══════════════════════════════════════════════════════════════════
// LESSONS — embedded at the bottom of each concept's own simulation tab
// (see the #lesson-embed-<tab> placeholders in index.html), rather than
// collected in a separate Lessons grid.
// ═══════════════════════════════════════════════════════════════════
/** Shared per-lesson template — single source of truth so the "Mark as
 *  read"/quick-check markup can't drift out of sync across lessons.
 *  Interactive bits are wired up via the delegated listener in
 *  initRoadmap(), not attached here. */
function buildLessonInfoHTML(lesson) {
  const done  = roadmapProgress.completedLessons.includes(lesson.id);
  const title = t(`lessons.${lesson.id}.title`, lesson.title);
  const body  = t(`lessons.${lesson.id}.body`, lesson.body);
  return `
    <div class="card-title">${title}${done ? ' — ' + t('roadmap.read', 'read') : ''}</div>
    <p class="bit-explainer">${body}</p>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
      <button class="btn-secondary${done ? ' is-done' : ''}" data-lesson-done="${lesson.id}">${done ? t('roadmap.markUnread', 'Mark unread') : t('roadmap.markAsRead', 'Mark as read')}</button>
    </div>
    ${buildQuickCheckHTML(lesson)}`;
}


/** Renders each lesson into its own #lesson-embed-<id> placeholder — a
 *  no-op for any lesson whose id isn't on the page (defensive only, every
 *  ROADMAP_LESSONS entry is expected to have a matching section). Keyed
 *  by `lesson.id` rather than `lesson.tab` because Maths Concept's five
 *  lessons all share one tab (mathsconcept) but each needs its own
 *  placeholder inside its own .maths-panel — every other lesson still
 *  has id === tab, so this is a no-op change for them. */
function renderEmbeddedLessons() {
  ROADMAP_LESSONS.forEach(lesson => {
    const host = document.getElementById(`lesson-embed-${lesson.id}`);
    if (!host) return;
    host.innerHTML = `<div class="card">${buildLessonInfoHTML(lesson)}</div>`;
  });
}

/** The Introduction tab's "Suggested learning path" — one row per
 *  ROADMAP_LESSONS entry, in the same order as the sidebar/mind-map, each
 *  linking straight to that concept's tab via the same [data-lesson-tryit]
 *  delegated handler the mind-map itself uses (see initRoadmap() below).
 *  Reads ROADMAP_LESSONS directly rather than duplicating its copy, so a
 *  lesson's description can never drift out of sync between this page and
 *  its own embedded lesson card. */
function renderIntroLearningPath() {
  const host = document.getElementById('intro-learning-path');
  if (!host) return;
  host.innerHTML = ROADMAP_LESSONS.map((lesson, i) => {
    const title = t(`lessons.${lesson.id}.title`, lesson.title);
    const body  = t(`lessons.${lesson.id}.body`, lesson.body);
    return `
    <div class="intro-path-item">
      <div class="intro-path-num">${i + 1}</div>
      <div class="intro-path-body">
        <div class="intro-path-title">${title}</div>
        <div class="intro-path-desc">${firstSentence(body)}</div>
      </div>
      <button class="btn-secondary" data-lesson-tryit="${lesson.id}">${t('roadmap.start', 'Start →')}</button>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════
// MIND-MAP (the home page — "Quantum World" center, branches fanning out
// left and right, reproducing the structure of a yFiles mind-map diagram
// the user supplied). MINDMAP_TREE is the full branch tree from that
// diagram. "1. Introduction" links to its own (currently blank) tab, and
// so do Circuits' Classical/Quantum/qubit-count sub-branches — those
// carry a `tab` field (plus circuitDomain/circuitMode for the Circuits
// ones) and are genuinely navigable, per goToLessonSimulation() below.
// Qubit's and Gates' sub-branches remain collapse/expand-only (a
// [data-mindmap-toggle] button, not a click-to-navigate one) since
// nothing on those tabs actually distinguishes a "One Qubit" page from
// the tab itself — per the source diagram's own CollapseDecorator data,
// that's the on-demand affordance for a branch with no destination of its
// own. MINDMAP_TREE doesn't reorder ROADMAP_LESSONS itself — that still
// drives every lesson-content list (embedded lessons, its own array
// order) independently of this layout. Node positions are computed from
// the container's measured pixel size rather than fixed percentages, so
// the layout stays correct at any width down to the 760px breakpoint,
// where it's hidden in favor of a plain link list
// (.roadmap-mindmap-fallback, see css/roadmap.css and renderMindmapFallback
// below — absolutely-positioned nodes have no room on a narrow screen,
// and neither does a multi-level tree, so that fallback only lists
// navigable top-level nodes).
// ═══════════════════════════════════════════════════════════════════
// Numbering matches the #tab-sidebar dock's order exactly: Introduction,
// Bits, Maths Concept, Gates, Circuits, Bell States, Measure, Entangle,
// Tunnel, Interference, Beam Splitter, Stern–Gerlach. Bell States sits
// right after Circuits — where it's actually built, gate by gate — rather
// than after Entangle, the state it's an instance of; it's also the one
// "phenomenon" branch placed on the left (with Introduction/Bits/Maths/
// Gates/Circuits) rather than the right (Measure onward), which happens to
// keep the two columns an even 6-and-6. The left/right split was 5-and-5
// (Measure sits first on the right, ahead of Entangle) until Stern–
// Gerlach's addition tipped it to 5-and-6 — purely a balanced two-column
// layout, it doesn't otherwise mean anything, so rebalance it freely if a
// future addition/removal tips the count uneven again; just keep each
// side's members in ascending `number` order, since layoutColumn() lists
// a side in whatever order its members appear in
// this array, not sorted by `number` itself. State Vector isn't its own
// top-level branch here — it only ever appears as Maths Concept's own
// State Vector sub-branch (see mathsconcept's children below), which now
// also carries the interactive classical-vs-quantum comparison that used
// to live on a separate "Statevec" tab.
// Translation keys for the MINDMAP_TREE nodes that have no matching
// ROADMAP_LESSONS entry (renderNode() below prefers a lesson's own title
// when one exists — see its comment — so this map only needs to cover
// the structural/collapse-only branches: Introduction, Maths Concept
// itself, and every Classical/Quantum/One-Two-Three-Qubit sub-branch).
const MINDMAP_NODE_TITLE_KEYS = {
  introduction: 'mindmap.introduction',
  mathsconcept: 'maths.title',
  'qubit-classical': 'mindmap.classical',
  'qubit-quantum': 'mindmap.quantum',
  'qubit-one': 'mindmap.oneQubit',
  'qubit-two': 'mindmap.twoQubits',
  'qubit-three': 'mindmap.threeQubits',
  'gates-classical': 'mindmap.classical',
  'gates-quantum': 'mindmap.quantum',
  'gates-compare': 'gatesTab.compare',
  'circuit-classical': 'mindmap.classical',
  'circuit-quantum': 'mindmap.quantum',
  'circuit-quantum-one': 'mindmap.oneQubit',
  'circuit-quantum-two': 'mindmap.twoQubits',
  'circuit-quantum-three': 'mindmap.threeQubits'
};

const MINDMAP_TREE = [
  { id: 'introduction', number: 1,  title: 'Introduction', side: 'left', tab: 'introduction' },
  { id: 'qubit',        number: 2,  title: 'Bits',               side: 'left',  tab: 'qubit', children: [
      // Real destinations on the Bits tab (see setQubitMode()/
      // setQubitSubmode() in qubit-tab.js), so — like Circuits'
      // sub-branches — these carry `tab` + qubitMode(+qubitSubmode) and
      // are genuinely navigable.
      { id: 'qubit-classical', title: 'Classical',  tab: 'qubit', qubitMode: 'classical' },
      { id: 'qubit-quantum',   title: 'Quantum',    tab: 'qubit', qubitMode: 'quantum', children: [
          { id: 'qubit-one',   title: 'One Qubit',    tab: 'qubit', qubitMode: 'quantum', qubitSubmode: '1q' },
          { id: 'qubit-two',   title: 'Two Qubits',   tab: 'qubit', qubitMode: 'quantum', qubitSubmode: '2q' },
          { id: 'qubit-three', title: 'Three Qubits', tab: 'qubit', qubitMode: 'quantum', qubitSubmode: '3q' }
        ] }
    ] },
  { id: 'mathsconcept', number: 3,  title: 'Maths Concept',      side: 'left',  tab: 'mathsconcept', children: [
      // Real destinations on the Maths Concept tab (see setMathsSection()
      // in tabs/mathsconcept-tab.js) — navigable for the same reason.
      { id: 'maths-complex',     title: 'Complex Numbers', tab: 'mathsconcept', mathsSection: 'complex' },
      { id: 'maths-vectors',     title: 'Vectors',         tab: 'mathsconcept', mathsSection: 'vectors' },
      { id: 'maths-matrices',    title: 'Matrices',        tab: 'mathsconcept', mathsSection: 'matrices' },
      { id: 'maths-statevector', title: 'State Vector',    tab: 'mathsconcept', mathsSection: 'statevector' },
      { id: 'maths-dirac',       title: 'Dirac Notation',  tab: 'mathsconcept', mathsSection: 'dirac' },
      { id: 'maths-tensor',      title: 'Tensor Products', tab: 'mathsconcept', mathsSection: 'tensor' }
    ] },
  { id: 'gates',        number: 4,  title: 'Gates',              side: 'left',  tab: 'gates', children: [
      // Real destinations on the Gates tab (see setGatesDomain() in
      // gates-tab.js) — navigable for the same reason.
      { id: 'gates-classical', title: 'Classical', tab: 'gates', gatesDomain: 'classical' },
      { id: 'gates-quantum',   title: 'Quantum',   tab: 'gates', gatesDomain: 'quantum' },
      { id: 'gates-compare',   title: 'Compare',   tab: 'gates', gatesDomain: 'compare' }
    ] },
  { id: 'circuit',      number: 5,  title: 'Circuits',           side: 'left',  tab: 'circuit', children: [
      // Unlike Qubit/Gates' sub-branches (purely structural — nothing on
      // those tabs actually distinguishes "One Qubit" as its own page),
      // these map onto real, distinct destinations on the Circuits tab
      // (see setCircuitDomain() in circuit-tab.js and setCircuitMode() in
      // circuit-multiqubit-tab.js), so they carry `tab` +
      // circuitDomain/circuitMode and are genuinely navigable, not
      // collapse/expand-only.
      { id: 'circuit-classical', title: 'Classical', tab: 'circuit', circuitDomain: 'classical' },
      { id: 'circuit-quantum',   title: 'Quantum', tab: 'circuit', circuitDomain: 'quantum', children: [
          { id: 'circuit-quantum-one',   title: 'One Qubit',   tab: 'circuit', circuitDomain: 'quantum', circuitMode: '1q' },
          { id: 'circuit-quantum-two',   title: 'Two Qubits',  tab: 'circuit', circuitDomain: 'quantum', circuitMode: '2q' },
          { id: 'circuit-quantum-three', title: 'Three Qubits', tab: 'circuit', circuitDomain: 'quantum', circuitMode: '3q' }
        ] }
    ] },
  { id: 'bellstates',   number: 6,  title: 'Bell States',        side: 'left',  tab: 'bellstates' },
  { id: 'measure',      number: 7,  title: 'Measurements',       side: 'left', tab: 'measure' },
  { id: 'entangle',     number: 8,  title: 'Entanglement',       side: 'left', tab: 'entangle' },
  { id: 'tunnel',       number: 9,  title: 'Quantum Tunneling',  side: 'right', tab: 'tunnel' },
  { id: 'interference', number: 10, title: 'Interference',       side: 'right', tab: 'interference' },
  { id: 'beamsplitter', number: 11, title: 'Beam Splitter',      side: 'right', tab: 'beamsplitter' },
  { id: 'sterngerlach', number: 12, title: 'Stern–Gerlach Experiment', side: 'right', tab: 'sterngerlach' },
  { id: 'teleport',     number: 13, title: 'Quantum Teleportation',    side: 'right', tab: 'teleport' },
  { id: 'superdense',   number: 14, title: 'Superdense Coding',        side: 'right', tab: 'superdense' },
  { id: 'noise',        number: 15, title: 'Noise & Decoherence',      side: 'right', tab: 'noise' },
  { id: 'grover',       number: 16, title: 'Grover\'s Search',         side: 'right', tab: 'grover' }
];

/** Color is per depth, not per branch — reproducing the source diagram's
 *  own scheme exactly (read from its per-node "color" tags): each
 *  top-level branch is individually teal or navy (not a clean
 *  alternation — this is the literal per-node assignment from the file),
 *  while every level-2 sub-branch shares one uniform mauve regardless of
 *  which parent it hangs off, and the one level-3 pair (Circuits >
 *  Quantum's own children) shares a separate, darker uniform purple. */
const MINDMAP_LEVEL1_COLORS = {
  introduction: '#4281a4',
  qubit:        '#4281a4',
  mathsconcept: '#242265',
  gates:        '#242265',
  measure:      '#4281a4',
  entangle:     '#4281a4',
  circuit:      '#242265',
  bellstates:   '#4281a4',
  tunnel:       '#4281a4',
  interference: '#242265',
  beamsplitter: '#4281a4',
  sterngerlach: '#242265',
  teleport:     '#4281a4',
  superdense:   '#242265',
  noise:        '#4281a4',
  grover:       '#242265'
};
const MINDMAP_LEVEL2_COLOR = '#aa5f82';
const MINDMAP_LEVEL3_COLOR = '#6c4f77';

let mindmapResizeTimer = null;
// Ids of branches currently showing their children — sub-branches start
// collapsed (matching the source diagram's CollapseDecorator being an
// on-demand affordance rather than a permanently-expanded tree), and stay
// however the user last left them across re-renders since this Set
// persists independently of the render itself.
let mindmapExpanded = new Set();

function renderRoadmapMindmap() {
  const container = document.getElementById('roadmap-mindmap');
  if (!container) return;

  // Reset any height override a previous (expanded) render left behind
  // before measuring, so growth never compounds across renders — every
  // render starts from the container's natural CSS-driven size.
  container.style.height = '';
  container.style.maxHeight = '';
  const rect = container.getBoundingClientRect();
  const w = rect.width  || 900;
  const h = rect.height || 420;
  const cx = w / 2;

  // Horizontal distance from center to each top-level column, and how far
  // each further tree level sits past its parent — both clamped so an
  // expanded 3-deep branch (Circuits > Quantum > One/Two Qubit) still has
  // a chance of fitting a mid-size container.
  const colOffset   = Math.min(w * 0.28, 240);
  const childOffsets = [110, 90]; // depth 1, depth 2
  // Vertical gaps: top-level rows are spaced generously (5 rows max, the
  // side with Introduction/Circuits' full column); child rows sit closer
  // together since they're only ever 2 siblings at a time.
  const rowSpacing   = Math.min(90, h / 6);
  const childSpacing = 44;
  // Branch thickness tapers from a thick "trunk" at the parent end down
  // to a thin tip at the child end, one pair per tree depth — echoing the
  // source diagram's three MindMapEdgeStyle tiers (root→branch,
  // branch→sub, sub→sub-sub), scaled down to suit ten branches sharing
  // one center instead of that diagram's smaller fan.
  const THICKNESS = [[14, 6], [6, 3], [3, 2]];

  const shapes = [];
  const nodesHTML = [];
  let branchIdSeq = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** A node's color is purely a function of its depth (see
   *  MINDMAP_LEVEL1_COLORS/_LEVEL2_COLOR/_LEVEL3_COLOR above) — the source
   *  diagram colors level-1 branches individually but gives every deeper
   *  level one uniform shade regardless of which branch it hangs off. */
  function colorForDepth(depth, node) {
    if (depth === 0) return MINDMAP_LEVEL1_COLORS[node.id];
    if (depth === 1) return MINDMAP_LEVEL2_COLOR;
    return MINDMAP_LEVEL3_COLOR;
  }

  /** Filled tapered wedge from (x0,y0) to (x1,y1), width w0 at the start
   *  narrowing to w1 at the end. Both ends are horizontal-tangent (the
   *  cubic's control points sit at the same y as their own endpoint, at
   *  the horizontal midpoint) — that's what turns this into the flowing
   *  "S-curve" branch shape the source diagram uses, rather than a
   *  simple bowed arc. */
  function taperedBranch(x0, y0, x1, y1, w0, w1, color) {
    const midX = (x0 + x1) / 2;
    const hw0 = w0 / 2, hw1 = w1 / 2;
    return `<path d="M ${x0} ${y0 - hw0} `
      + `C ${midX} ${y0 - hw0}, ${midX} ${y1 - hw1}, ${x1} ${y1 - hw1} `
      + `L ${x1} ${y1 + hw1} `
      + `C ${midX} ${y1 + hw1}, ${midX} ${y0 + hw0}, ${x0} ${y0 + hw0} Z" `
      + `fill="${color}" opacity="0.92"></path>`;
  }

  /** A couple of small glowing dots traveling outward along a branch's
   *  own centerline (root → node, current flowing down a wire) — purely
   *  decorative, drawn on top of the filled taperedBranch() wedge for
   *  that edge, not a replacement for it. The centerline reuses the same
   *  S-curve tangent geometry as the wedge (control points level with
   *  their own endpoint at the horizontal midpoint) so it visually lines
   *  up with the wedge underneath; it's otherwise invisible
   *  (fill/stroke none) and exists only for <animateMotion> to ride.
   *  Duration scales with distance so every dot moves at roughly the
   *  same speed regardless of branch length, and each dot's negative
   *  `begin` staggers it to a different point in the loop immediately
   *  rather than waiting for a synchronized start. Skipped entirely
   *  under prefers-reduced-motion. */
  function electronFlow(x0, y0, x1, y1, color) {
    if (reduceMotion) return '';
    const id = `mindmap-branch-path-${branchIdSeq++}`;
    const midX = (x0 + x1) / 2;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const dur = Math.max(1.2, dist / 120);
    const guide = `<path id="${id}" d="M ${x0} ${y0} C ${midX} ${y0}, ${midX} ${y1}, ${x1} ${y1}" fill="none" stroke="none"></path>`;
    const dots = [0, 0.5].map(phase => {
      const begin = (-phase * dur).toFixed(2);
      return `<circle r="2.6" fill="${color}" style="filter:drop-shadow(0 0 3px ${color})">`
        + `<animateMotion dur="${dur.toFixed(2)}s" begin="${begin}s" repeatCount="indefinite">`
        + `<mpath href="#${id}" xlink:href="#${id}"></mpath>`
        + `</animateMotion>`
        + `</circle>`;
    }).join('');
    return guide + dots;
  }

  function renderNode(node, x, y, depth) {
    const color = colorForDepth(depth, node);
    const lesson = node.tab ? ROADMAP_LESSONS.find(l => l.id === node.id) : null;
    const done = lesson ? roadmapProgress.completedLessons.includes(lesson.id) : false;
    // Prefer the lesson's own title (the one shown on its actual tab and
    // embedded lesson card) over the tree's label, so a navigable node
    // never reads differently here than where it lands — nodes with no
    // lesson (Introduction, every collapse-only sub-branch) fall back to
    // MINDMAP_NODE_TITLE_KEYS, since there's no lesson id to look up.
    const displayTitle = lesson
      ? t(`lessons.${lesson.id}.title`, lesson.title)
      : t(MINDMAP_NODE_TITLE_KEYS[node.id] || '', node.title);
    const label = node.number ? `${node.number}. ${displayTitle}` : displayTitle;
    const tip = lesson ? `${label}${done ? ' — ' + t('roadmap.read', 'read') : ''}: ${firstSentence(t(`lessons.${lesson.id}.body`, lesson.body))}` : label;

    const classes = ['mindmap-node'];
    if (depth > 0) classes.push('mindmap-node--sub');
    if (done) classes.push('is-done');
    if (!node.tab) classes.push('mindmap-node--static');

    const navAttr = node.tab ? `data-lesson-tryit="${node.id}"` : '';
    const toggleHTML = node.children
      ? `<span class="mindmap-toggle" data-mindmap-toggle="${node.id}">${mindmapExpanded.has(node.id) ? '−' : '+'}</span>`
      : '';
    // A checkmark, not just the .is-done background tint, marks a read
    // lesson — a subtle background wash alone isn't always a strong
    // enough signal against every branch color, so "done" needs its own
    // unmistakable glyph too (see .mindmap-node.is-done in css/roadmap.css for
    // the matching solid-green border override).
    const doneMark = done ? ' <span class="mindmap-done-mark">✓</span>' : '';

    return `<button class="${classes.join(' ')}" ${navAttr} data-tooltip="${tip}" style="left:${x}px;top:${y}px;--branch-color:${color};">${label}${doneMark}${toggleHTML}</button>`;
  }

  function placeChildren(parent, parentX, parentY, side, depth) {
    if (!parent.children || !mindmapExpanded.has(parent.id)) return;
    const offset = childOffsets[depth - 1] || childOffsets[childOffsets.length - 1];
    const x = parentX + (side === 'left' ? -offset : offset);
    const n = parent.children.length;
    const [w0, w1] = THICKNESS[Math.min(depth, THICKNESS.length - 1)];
    parent.children.forEach((child, i) => {
      const y = parentY + (i - (n - 1) / 2) * childSpacing;
      const color = colorForDepth(depth, child);
      shapes.push(taperedBranch(parentX, parentY, x, y, w0, w1, color));
      shapes.push(electronFlow(parentX, parentY, x, y, color));
      nodesHTML.push(renderNode(child, x, y, depth));
      placeChildren(child, x, y, side, depth + 1);
    });
  }

  // Vertical half-extent an expanded subtree needs measured from its own
  // row — mirrors the y offsets placeChildren() below actually draws, so
  // a row's reserved space always matches what will be rendered under it
  // (recurses through however many levels are currently expanded, e.g.
  // Circuits > Quantum > Two Qubits three deep).
  function subtreeHalfExtent(node) {
    if (!node.children || !mindmapExpanded.has(node.id)) return 0;
    const n = node.children.length;
    let maxExtent = 0;
    node.children.forEach((child, i) => {
      const offset = Math.abs((i - (n - 1) / 2) * childSpacing);
      const extent = offset + subtreeHalfExtent(child);
      if (extent > maxExtent) maxExtent = extent;
    });
    return maxExtent;
  }

  // Minimum half-extent every top-level row keeps even collapsed, sized
  // so two fully-collapsed neighbors land exactly rowSpacing apart center
  // to center — i.e. identical to the old fixed layout — and only a row
  // whose subtreeHalfExtent exceeds this pushes its neighbors further
  // out, rather than every row paying the rowGap up front regardless of
  // whether anything is actually expanded (that inflation was itself a
  // bug: it grew the fully-collapsed map past the viewport).
  const rowGap = 18;
  const minRowHalfExtent = (rowSpacing - rowGap) / 2;

  function measureColumn(side) {
    const nodes = MINDMAP_TREE.filter(n => n.side === side);
    const halfExtents = nodes.map(n => Math.max(minRowHalfExtent, subtreeHalfExtent(n)));
    const centers = [];
    let cursor = 0;
    halfExtents.forEach((half, i) => {
      cursor = i === 0 ? half : cursor + halfExtents[i - 1] + rowGap + half;
      centers.push(cursor);
    });
    const columnHeight = halfExtents.length ? centers[centers.length - 1] + halfExtents[halfExtents.length - 1] : 0;
    return { nodes, centers, columnHeight };
  }

  const leftCol = measureColumn('left');
  const rightCol = measureColumn('right');

  // Grow the container to fit an expanded tree — rather than letting
  // absolutely-positioned nodes overflow on top of whatever sits below
  // the mind-map — only when content actually needs more room than the
  // container's natural CSS height. The small margin is just enough that
  // the outermost node's own pill isn't flush against the container edge;
  // it's not meant to inflate the fully-collapsed case, which already
  // fits within a natural-height container by construction (see
  // minRowHalfExtent above).
  const contentHeight = Math.max(leftCol.columnHeight, rightCol.columnHeight);
  const finalH = Math.max(h, contentHeight + 6);
  if (finalH > h) {
    container.style.height = finalH + 'px';
    container.style.maxHeight = 'none';
  }
  const cy = finalH / 2;

  function layoutColumn(col, x) {
    const yOffset = cy - col.columnHeight / 2;
    return col.nodes.map((node, i) => ({ node, x, y: col.centers[i] + yOffset }));
  }

  const topNodes = [...layoutColumn(leftCol, cx - colOffset), ...layoutColumn(rightCol, cx + colOffset)];
  topNodes.forEach(({ node, x, y }) => {
    const [w0, w1] = THICKNESS[0];
    const color = colorForDepth(0, node);
    shapes.push(taperedBranch(cx, cy, x, y, w0, w1, color));
    shapes.push(electronFlow(cx, cy, x, y, color));
    nodesHTML.push(renderNode(node, x, y, 0));
    placeChildren(node, x, y, node.side, 1);
  });

  container.innerHTML =
    `<svg>${shapes.join('')}</svg>` +
    `<div class="mindmap-center" data-tooltip="${mindmapCenterTooltip()}" style="left:${cx}px;top:${cy}px;">${t('mindmap.quantumWorld', 'Quantum World')}</div>` +
    nodesHTML.join('');

  renderMindmapFallback();
}

/** Plain vertical list of concept links, shown instead of the mind-map
 *  below the 760px breakpoint (see .roadmap-mindmap-fallback in
 *  css/roadmap.css). Only navigable top-level nodes (MINDMAP_TREE.filter
 *  doesn't recurse into .children) — every collapse/expand-only
 *  sub-branch has no page to link to, and a multi-level tree has nowhere
 *  to go on a narrow screen anyway; Circuits' own navigable sub-branches
 *  are reachable from the full mind-map only. Kept in sync with the
 *  mind-map's "read" state and rebuilt alongside it so the two never
 *  drift apart. */
function renderMindmapFallback() {
  const list = document.getElementById('roadmap-mindmap-fallback');
  if (!list) return;
  const navigable = MINDMAP_TREE.filter(n => n.tab).sort((a, b) => a.number - b.number);
  list.innerHTML = navigable.map(node => {
    const lesson = ROADMAP_LESSONS.find(l => l.id === node.id);
    const done = roadmapProgress.completedLessons.includes(node.id);
    const title = lesson
      ? t(`lessons.${lesson.id}.title`, lesson.title)
      : t(MINDMAP_NODE_TITLE_KEYS[node.id] || '', node.title);
    const label = `${node.number}. ${title}`;
    return `<button class="mindmap-fallback-item${done ? ' is-done' : ''}" data-lesson-tryit="${node.id}" style="--branch-color:${MINDMAP_LEVEL1_COLORS[node.id]};">${label}${done ? ' — ' + t('roadmap.read', 'read') : ''}</button>`;
  }).join('');
}

/** Recomputed at render time (not a module-level constant) so it picks
 *  up the active language — see setLanguage()'s callback list below. */
function mindmapCenterTooltip() {
  return t('roadmap.centerTooltip', '{count} core quantum computing concepts, from a single qubit to entanglement and wave interference — click any topic to explore it.')
    .replace('{count}', ROADMAP_LESSONS.length);
}

/** First sentence of a lesson body, used for the mind-map's hover
 *  tooltip so it stays short (the tooltip's box is sized for a one-liner
 *  like the Bloch axis tooltips it reuses — see showBlochTooltip below —
 *  not a full paragraph). */
function firstSentence(text) {
  const m = text.match(/^[^.]*\./);
  return m ? m[0] : text;
}

/** One-question "Quick check" embedded directly under a lesson's body —
 *  immediate right/wrong feedback plus a short explanation. */
function buildQuickCheckHTML(lesson) {
  const q = ROADMAP_QUIZ.find(item => item.lessonId === lesson.id);
  if (!q) return '';

  const qKey = `quiz.${lesson.id}`;
  const question = t(`${qKey}.q`, q.q);
  const options  = q.options.map((opt, i) => t(`${qKey}.options.${i}`, opt));

  const answered = roadmapProgress.quizAnswers[lesson.id];
  if (answered === undefined) {
    return `
      <div class="roadmap-quickcheck">
        <div class="roadmap-quickcheck-label">${t('roadmap.quickCheck', 'Quick check')}</div>
        <p class="roadmap-quickcheck-q">${question}</p>
        <div class="roadmap-quiz-options" data-quickcheck-lesson="${lesson.id}">
          ${options.map((opt, i) => `<button class="preset-btn" data-choice="${i}">${opt}</button>`).join('')}
        </div>
      </div>`;
  }

  const correct = answered === q.correct;
  const explanation = t(`${qKey}.explanation`, q.explanation);
  return `
    <div class="roadmap-quickcheck">
      <div class="roadmap-quickcheck-label">${t('roadmap.quickCheck', 'Quick check')} — ${correct ? t('roadmap.correct', 'correct') : t('roadmap.review', 'review')}</div>
      <p class="roadmap-quickcheck-q">${question}</p>
      <div class="roadmap-quiz-options">
        ${options.map((opt, i) => {
          let cls = 'preset-btn';
          if (i === q.correct) cls += ' quiz-correct';
          else if (i === answered) cls += ' quiz-incorrect';
          return `<button class="${cls}" disabled>${opt}</button>`;
        }).join('')}
      </div>
      <p class="bit-explainer" style="margin-top:8px;">${explanation}</p>
    </div>`;
}

/** Keeps the header "Home" toggle showing live progress (e.g.
 *  "Home · 3/9") so it's visible without opening the mind-map. */
function updateRoadmapBadge() {
  const btn = document.getElementById('btn-roadmap-toggle');
  const done = roadmapProgress.completedLessons.length;
  // The count lives in its own span (hidden below ~480px, see css/responsive.css)
  // so narrow headers can reclaim that space for the tab nav instead.
  btn.innerHTML = `${t('nav.home', 'Home')}<span class="roadmap-badge-count"> · ${done}/${ROADMAP_LESSONS.length}</span>`;
}

// ═══════════════════════════════════════════════════════════════════
// PROGRESS SUMMARY (the "My Progress" sub-view of the home page)
// ═══════════════════════════════════════════════════════════════════
/** Renders the completion bar, quick-check score, and per-lesson
 *  checklist from the same completedLessons/quizAnswers state everything
 *  else on the page reads — there's no separate tracking to keep in
 *  sync, just a different view of it. "Quick Check Score" counts right
 *  answers among quizAnswers actually given (each lesson's Quick check,
 *  see buildQuickCheckHTML) rather than a replayable standalone quiz. */
function renderRoadmapProgress() {
  const total = ROADMAP_LESSONS.length;
  const done  = roadmapProgress.completedLessons.length;
  const pct   = Math.round(100 * done / total);

  document.getElementById('roadmap-progress-fill').style.width = pct + '%';
  document.getElementById('roadmap-progress-pct').textContent  = `${done}/${total}`;

  const answeredIds = Object.keys(roadmapProgress.quizAnswers);
  const correctCount = answeredIds.filter(id => {
    const q = ROADMAP_QUIZ.find(item => item.lessonId === id);
    return q && roadmapProgress.quizAnswers[id] === q.correct;
  }).length;
  document.getElementById('roadmap-quiz-score-text').textContent =
    answeredIds.length === 0
      ? t('roadmap.notAttempted', 'Not attempted yet.')
      : t('roadmap.quizScoreSummary', '{correct} / {answered} quick checks correct so far ({total} concepts total).')
          .replace('{correct}', correctCount).replace('{answered}', answeredIds.length).replace('{total}', total);

  document.getElementById('roadmap-checklist').innerHTML = ROADMAP_LESSONS.map(l => {
    const lessonDone = roadmapProgress.completedLessons.includes(l.id);
    return `<label class="roadmap-checklist-row">
      <input type="checkbox" disabled ${lessonDone ? 'checked' : ''}>
      <span>${t(`lessons.${l.id}.title`, l.title)}</span>
    </label>`;
  }).join('');
}

/** Re-renders every surface that shows lesson state (mind-map + its mobile
 *  fallback list, each concept tab's embedded lesson, and the Progress
 *  summary if that's the current home sub-view) — called after any
 *  mutation (mark-as-read, quick-check answer) so all of them stay in
 *  sync no matter which one the user interacted with. */
function refreshLessonUI() {
  renderRoadmapMindmap();
  renderEmbeddedLessons();
  updateRoadmapBadge();
  if (roadmapSubMode === 'progress') renderRoadmapProgress();
}

/** Flat id → node lookup across all of MINDMAP_TREE, including nested
 *  children — built once so goToLessonSimulation() below can resolve a
 *  click from any depth (top-level concept or a navigable sub-branch
 *  like Circuits > Quantum > Two Qubits) the same way. */
const MINDMAP_NODE_BY_ID = (function flatten(nodes, map = {}) {
  nodes.forEach(node => {
    map[node.id] = node;
    if (node.children) flatten(node.children, map);
  });
  return map;
})(MINDMAP_TREE);

/** Navigates straight to a node's live simulation — switches app mode to
 *  Concepts, selects the matching tab, and (for sub-branches that
 *  target a specific builder state, like Circuits > Classical or
 *  Circuits > Quantum > Two Qubits) applies that state too. A node with
 *  no `tab` (Introduction, and every collapse/expand-only sub-branch)
 *  simply does nothing, same as before. */
function goToLessonSimulation(nodeId) {
  const node = MINDMAP_NODE_BY_ID[nodeId];
  if (!node || !node.tab) return;
  setAppMode('sim');
  switchToTab(node.tab);
  if (node.circuitDomain) setCircuitDomain(node.circuitDomain);
  if (node.circuitMode) setCircuitMode(node.circuitMode);
  if (node.qubitMode) setQubitMode(node.qubitMode);
  if (node.qubitSubmode) setQubitSubmode(node.qubitSubmode);
  if (node.gatesDomain) setGatesDomain(node.gatesDomain);
  if (node.statevecMode) setStatevecMode(node.statevecMode);
  if (node.mathsSection) setMathsSection(node.mathsSection);
}

// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════
function initRoadmap() {
  document.querySelectorAll('.mode-btn[data-app-mode]').forEach(btn =>
    btn.addEventListener('click', () => setAppMode(btn.dataset.appMode)));
  document.querySelectorAll('.mode-btn[data-roadmap-mode]').forEach(btn =>
    btn.addEventListener('click', () => setRoadmapMode(btn.dataset.roadmapMode)));
  // The Home page's "Important Concepts" button sits in the same row as
  // Concept Map/My Progress but isn't a roadmap sub-mode — it navigates
  // straight into that static tab, same as a mind-map node click.
  document.querySelectorAll('.mode-btn[data-goto-tab]').forEach(btn =>
    btn.addEventListener('click', () => {
      setAppMode('sim');
      switchToTab(btn.dataset.gotoTab);
    }));
  renderIntroLearningPath();

  // Delegated (rather than attached-per-render) because the same lesson's
  // controls can exist in more than one place at once — the mind-map
  // node, its mobile fallback list item, and the embedded lesson card on
  // its own tab — and re-binding all of them on every render would be
  // easy to get out of sync.
  document.addEventListener('click', (e) => {
    // Checked first because a [data-mindmap-toggle] span sits nested
    // inside its parent's own [data-lesson-tryit] button (see renderNode
    // in renderRoadmapMindmap) — without this, expanding/collapsing a
    // branch would also navigate away via the outer button.
    const toggleBtn = e.target.closest('[data-mindmap-toggle]');
    if (toggleBtn) {
      const id = toggleBtn.dataset.mindmapToggle;
      if (mindmapExpanded.has(id)) mindmapExpanded.delete(id);
      else mindmapExpanded.add(id);
      renderRoadmapMindmap();
      return;
    }

    const tryItBtn = e.target.closest('[data-lesson-tryit]');
    if (tryItBtn) { goToLessonSimulation(tryItBtn.dataset.lessonTryit); return; }

    const doneBtn = e.target.closest('[data-lesson-done]');
    if (doneBtn) {
      const id = doneBtn.dataset.lessonDone;
      const idx = roadmapProgress.completedLessons.indexOf(id);
      if (idx === -1) roadmapProgress.completedLessons.push(id);
      else roadmapProgress.completedLessons.splice(idx, 1);
      saveRoadmapProgress();
      refreshLessonUI();
      return;
    }

    if (e.target.closest('[data-reset-progress]')) {
      resetRoadmapProgress();
      return;
    }

    const choiceBtn = e.target.closest('[data-choice]');
    if (choiceBtn) {
      const optionsEl = choiceBtn.closest('[data-quickcheck-lesson]');
      if (optionsEl) {
        const id = optionsEl.dataset.quickcheckLesson;
        roadmapProgress.quizAnswers[id] = parseInt(choiceBtn.dataset.choice, 10);
        // Finishing the quick check — right or wrong — means the concept
        // was engaged with, so mark it read automatically instead of
        // making the learner also click "Mark as read" separately.
        if (!roadmapProgress.completedLessons.includes(id)) {
          roadmapProgress.completedLessons.push(id);
        }
        saveRoadmapProgress();
        refreshLessonUI();
      }
      return;
    }
  });

  // The mind-map measures its own container to lay itself out, so a
  // resize needs to trigger a re-layout — but only while it's actually
  // visible (it reads 0x0 while hidden, e.g. while in Concepts mode).
  window.addEventListener('resize', () => {
    clearTimeout(mindmapResizeTimer);
    mindmapResizeTimer = setTimeout(() => {
      const container = document.getElementById('roadmap-mindmap');
      if (container && container.offsetParent !== null) renderRoadmapMindmap();
    }, 150);
  });

  // Hover tooltips on the mind-map's center + topic nodes — reuses the
  // same floating tooltip element/CSS as the Bloch sphere's axis-label
  // hover (core/dom-utils.js), just fed from [data-tooltip] instead of a
  // hotspot hit-test. Attached to the container (survives its innerHTML
  // being replaced on every renderRoadmapMindmap() re-render) rather than
  // to individual nodes, so it doesn't need re-binding per render.
  const mindmapEl = document.getElementById('roadmap-mindmap');
  mindmapEl.addEventListener('mousemove', (e) => {
    const node = e.target.closest('[data-tooltip]');
    if (node) showBlochTooltip(node.dataset.tooltip, e.clientX, e.clientY);
    else hideBlochTooltip();
  });
  mindmapEl.addEventListener('mouseleave', hideBlochTooltip);

  renderEmbeddedLessons();
  renderRoadmapMindmap();
  updateRoadmapBadge();

  // Everything above renders lesson/quiz/mind-map text from JS (not
  // static [data-i18n] markup applyTranslations() can walk on its own),
  // so a language switch needs its own re-render pass here — see
  // core/i18n.js's onLangChange().
  onLangChange(() => {
    renderIntroLearningPath();
    refreshLessonUI(); // already re-renders My Progress too, if that's the current sub-view
  });
}


// ════════ js/tour.js ════════
// First-run guided tour — shown once per browser (tracked via
// localStorage) to orient new visitors. Depends on app.js's
// switchToTab()/currentTab and core/tab-registry.js indirectly through
// that. Loads right before app.js and is kicked off from app.js's
// DOMContentLoaded, once every other tab is fully initialized.

const TOUR_STORAGE_KEY = 'qe-tour-seen';

const TOUR_STEPS = [
  {
    tab: 'qubit',
    selector: '#tab-sidebar',
    text: 'Each tab explores one quantum concept, building from a single qubit up to entanglement and wave phenomena. Click through them anytime.'
  },
  {
    tab: 'qubit',
    selector: '#bloch-main',
    text: 'This is the Bloch sphere. Try dragging the arrow directly — it sets the qubit\'s state in real time.'
  },
  {
    tab: 'qubit',
    selector: '#theme-toggle',
    text: 'Toggle light or dark mode here — your choice is remembered next time you visit.'
  }
];

let tourIndex = 0;
let tourBackdrop = null;
let tourPopover  = null;
let tourHighlightEl = null;

function startTourIfFirstVisit() {
  if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
  tourIndex = 0;
  // Every step targets a Concepts-page element (nav, #bloch-main,
  // #theme-toggle) — since Roadmap is the default landing view, switch
  // there explicitly rather than relying on whatever mode happened to be
  // active, so the tour never tries to highlight a 0x0 hidden element.
  setAppMode('sim');
  buildTourDOM();
  showTourStep();
}

function buildTourDOM() {
  tourBackdrop = document.createElement('div');
  tourBackdrop.className = 'tour-backdrop';
  tourPopover = document.createElement('div');
  tourPopover.className = 'tour-popover';
  document.body.appendChild(tourBackdrop);
  document.body.appendChild(tourPopover);
}

function clearTourHighlight() {
  if (tourHighlightEl) tourHighlightEl.classList.remove('tour-highlight');
  tourHighlightEl = null;
  document.querySelectorAll('.tour-raise-header').forEach(el => el.classList.remove('tour-raise-header'));
}

function showTourStep() {
  clearTourHighlight();
  const step = TOUR_STEPS[tourIndex];
  if (currentTab !== step.tab) switchToTab(step.tab);

  requestAnimationFrame(() => {
    const target = document.querySelector(step.selector);
    if (!target) { endTour(); return; }

    target.classList.add('tour-highlight');
    tourHighlightEl = target;
    // Elements inside <header> live in its own stacking context (it's
    // position:fixed with its own z-index), so a highlighted child can't
    // out-rank the backdrop just by raising its own z-index — the whole
    // header needs to be raised instead.
    const headerAncestor = target.closest('header');
    if (headerAncestor) headerAncestor.classList.add('tour-raise-header');

    const rect = target.getBoundingClientRect();
    tourPopover.innerHTML = `
      <div class="tour-step-count">Step ${tourIndex + 1} of ${TOUR_STEPS.length}</div>
      <p>${step.text}</p>
      <div class="tour-actions">
        <button class="btn-secondary" id="tour-skip">Skip</button>
        <button class="btn-run" id="tour-next">${tourIndex === TOUR_STEPS.length - 1 ? 'Done' : 'Next'}</button>
      </div>
    `;
    // Usually anchored below the target, but a tall element (e.g. the
    // full-height #tab-sidebar) leaves no room below it — fall back to
    // anchoring beside it instead of letting the popover run off-screen.
    const popoverH = 170;
    let top, left;
    if (rect.bottom + 12 + popoverH <= window.innerHeight) {
      top  = rect.bottom + 12;
      left = Math.min(window.innerWidth - 300, Math.max(12, rect.left));
    } else {
      top  = Math.min(window.innerHeight - popoverH - 12, Math.max(12, rect.top));
      left = Math.min(window.innerWidth - 300, rect.right + 12);
    }
    tourPopover.style.top  = top + 'px';
    tourPopover.style.left = left + 'px';

    document.getElementById('tour-next').addEventListener('click', nextTourStep);
    document.getElementById('tour-skip').addEventListener('click', endTour);
  });
}

function nextTourStep() {
  tourIndex++;
  if (tourIndex >= TOUR_STEPS.length) { endTour(); return; }
  showTourStep();
}

function endTour() {
  clearTourHighlight();
  if (tourBackdrop) tourBackdrop.remove();
  if (tourPopover) tourPopover.remove();
  tourBackdrop = null;
  tourPopover  = null;
  localStorage.setItem(TOUR_STORAGE_KEY, '1');
}


// ════════ js/app.js ════════
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
  syncLocationAndTitle();
}

/** Keeps the address bar (?tab=…) and document title describing the page
 *  being viewed, so the URL can be bookmarked/shared and the tab title is
 *  meaningful. Home mode clears the query. */
function syncLocationAndTitle() {
  const base = 'Quantum Explorer';
  const home = document.getElementById('roadmap-view')?.classList.contains('active');
  const params = new URLSearchParams(location.search);
  let title = base;
  if (home) {
    ['tab', 'theta', 'phi', 'circuit'].forEach(k => params.delete(k));
  } else {
    const label = document.querySelector(`.tab[data-tab="${currentTab}"] .tab-label`)?.textContent.trim();
    if (label) title = `${label} · ${base}`;
    if (params.get('tab') !== currentTab) {
      ['theta', 'phi', 'circuit'].forEach(k => params.delete(k));
      params.set('tab', currentTab);
    }
  }
  document.title = title;
  const qs = params.toString();
  try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch (e) { /* sandboxed */ }
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
export function startEngine() {

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

  const openedSharedLink = applySharedStateFromURL();
  if (!openedSharedLink) startTourIfFirstVisit();
}

/** Restores a qubit state and/or circuit gate sequence encoded in the
 *  URL by copyShareLink() (see core/dom-utils.js), so a shared link
 *  reproduces what the sender saw. Unrecognized/missing params are
 *  silently ignored rather than treated as errors. */
// Captured before setAppMode()/switchToTab() rewrite the address bar.
const INITIAL_SEARCH = location.search;

function applySharedStateFromURL() {
  const params = new URLSearchParams(INITIAL_SEARCH);

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
    // A shared link lands inside the simulation, not on the Home map, and
    // skips the first-visit tour so the recipient sees what was shared.
    setAppMode('sim');
    switchToTab(tab);
    const group = document.querySelector(`.tab[data-tab="${tab}"]`).closest('.tab-group');
    if (group) openSidebarGroup(group);
    try { history.replaceState(null, '', location.pathname + INITIAL_SEARCH); } catch (e) { /* sandboxed */ }
    return true;
  }
  return false;
}

