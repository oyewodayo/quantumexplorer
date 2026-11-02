'use strict';
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
