'use strict';
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
