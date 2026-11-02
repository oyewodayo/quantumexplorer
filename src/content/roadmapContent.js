// Lesson text, quick-check questions and the Home concept-map tree.
// (Translated copies live in src/i18n/locales under `lessons.*` and `quiz.*`.)

export const ROADMAP_LESSONS = [
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

export const ROADMAP_QUIZ = [
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

export const MINDMAP_NODE_TITLE_KEYS = {
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

export const MINDMAP_TREE = [
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
export const MINDMAP_LEVEL1_COLORS = {
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
export const MINDMAP_LEVEL2_COLOR = '#aa5f82';
export const MINDMAP_LEVEL3_COLOR = '#6c4f77';

/** Flat id -> node lookup across the whole tree, children included. */
export const MINDMAP_NODE_BY_ID = (function flatten(nodes, map = {}) {
  nodes.forEach((node) => {
    map[node.id] = node;
    if (node.children) flatten(node.children, map);
  });
  return map;
})(MINDMAP_TREE);
