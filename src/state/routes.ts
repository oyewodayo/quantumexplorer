export const SITE_URL = 'https://quantumexplorer.com';

export interface RouteMeta {
  tab: string;
  slug: string;
  title: string;
  description: string;
  lessonIds: string[];
}

export const HOME_META = {
  slug: '',
  title: 'Quantum Explorer · Learn Quantum Computing Interactively',
  description:
    'Free interactive platform for learning quantum computing and quantum mechanics: Bloch sphere, qubits, quantum gates, circuits, entanglement, teleportation, Grover search and more.',
};

export const ROUTES: RouteMeta[] = [
  {
    tab: 'introduction',
    slug: 'introduction',
    title: 'Introduction to Quantum Computing · Quantum Explorer',
    description:
      'Start your quantum computing journey with interactive explanations of how quantum mechanics powers qubits, superposition, entanglement, and quantum algorithms.',
    lessonIds: [],
  },
  {
    tab: 'important-concepts',
    slug: 'important-concepts',
    title: 'Core Quantum Concepts: Superposition, Phase & Collapse · Quantum Explorer',
    description:
      'Understand the foundational ideas behind quantum computing—superposition, complex phase, interference, measurement collapse, and entanglement.',
    lessonIds: [],
  },
  {
    tab: 'qubit',
    slug: 'qubits-and-bloch-sphere',
    title: 'Bits, Qubits & the Bloch Sphere Simulator · Quantum Explorer',
    description:
      'Compare classical bits with quantum qubits on an interactive 3D Bloch sphere. Drag states, adjust θ and φ angles, and explore 1, 2, and 3-qubit systems.',
    lessonIds: ['qubit'],
  },
  {
    tab: 'mathsconcept',
    slug: 'quantum-math',
    title: 'Quantum Computing Math: Complex Numbers, Vectors & Dirac Notation · Quantum Explorer',
    description:
      'Interactive visual guide to the mathematics of quantum computing: complex numbers, state vectors, unitary matrices, Dirac bra-ket notation, and tensor products.',
    lessonIds: ['maths-complex', 'maths-vectors', 'maths-matrices', 'maths-statevector', 'maths-dirac', 'maths-tensor'],
  },
  {
    tab: 'gates',
    slug: 'quantum-gates',
    title: 'Quantum Gates Simulator (H, X, Y, Z, S, T, Rx, Ry, Rz) · Quantum Explorer',
    description:
      'Apply Hadamard, Pauli-X/Y/Z, S, T, and rotation gates to a live Bloch sphere, inspect unitary matrices, and compare classical vs. quantum logic gates.',
    lessonIds: ['gates'],
  },
  {
    tab: 'circuit',
    slug: 'quantum-circuits',
    title: 'Interactive Quantum Circuit Builder (1, 2 & 3 Qubits) · Quantum Explorer',
    description:
      'Build and simulate 1, 2, and 3-qubit quantum circuits with Hadamard, Pauli, phase, CNOT, and Toffoli gates, and compare them against classical logic circuits.',
    lessonIds: ['circuit'],
  },
  {
    tab: 'measure',
    slug: 'quantum-measurement',
    title: 'Quantum Measurement & Wavefunction Collapse Simulator · Quantum Explorer',
    description:
      'Experiment with quantum measurement, Born-rule probabilities, repeated sampling statistics, and irreversible wavefunction collapse.',
    lessonIds: ['measure'],
  },
  {
    tab: 'entangle',
    slug: 'quantum-entanglement',
    title: 'Quantum Entanglement Simulator · Quantum Explorer',
    description:
      'Explore quantum entanglement interactively: entangle two qubits, measure one, and observe instantaneous correlations that classical bits cannot replicate.',
    lessonIds: ['entangle'],
  },
  {
    tab: 'bellstates',
    slug: 'bell-states',
    title: 'Bell States Simulator (Φ⁺, Φ⁻, Ψ⁺, Ψ⁻) · Quantum Explorer',
    description:
      'Construct and measure all four maximally entangled Bell states using Hadamard and CNOT circuits, and see how relative phase distinguishes Φ⁺, Φ⁻, Ψ⁺, and Ψ⁻.',
    lessonIds: ['bellstates'],
  },
  {
    tab: 'tunnel',
    slug: 'quantum-tunneling',
    title: 'Quantum Tunneling Wavepacket Simulator · Quantum Explorer',
    description:
      'Watch a real-time Schrödinger wavepacket encounter a potential energy barrier. Adjust barrier height and width to observe reflection and quantum tunneling.',
    lessonIds: ['tunnel'],
  },
  {
    tab: 'interference',
    slug: 'double-slit-interference',
    title: 'Double-Slit Quantum Interference Simulator · Quantum Explorer',
    description:
      'Simulate the double-slit experiment particle by particle. Toggle single-slit, double-slit, and which-path detectors to see interference fringes appear and vanish.',
    lessonIds: ['interference'],
  },
  {
    tab: 'beamsplitter',
    slug: 'beam-splitter',
    title: 'Quantum Beam Splitter & Single-Photon Simulator · Quantum Explorer',
    description:
      'Fire single photons at a 50/50 beam splitter and Mach–Zehnder interferometer to see quantum randomness and wave-particle duality in action.',
    lessonIds: ['beamsplitter'],
  },
  {
    tab: 'sterngerlach',
    slug: 'stern-gerlach',
    title: 'Stern–Gerlach Experiment Simulator · Quantum Explorer',
    description:
      'Send silver atoms through inhomogeneous magnetic fields in the Stern–Gerlach simulator to observe spin quantization and sequential measurement collapse.',
    lessonIds: ['sterngerlach'],
  },
  {
    tab: 'teleport',
    slug: 'quantum-teleportation',
    title: 'Quantum Teleportation Protocol Simulator · Quantum Explorer',
    description:
      'Step through the quantum teleportation protocol: prepare Alice’s unknown qubit state, perform a Bell measurement, send two classical bits, and reconstruct the state at Bob.',
    lessonIds: ['teleport'],
  },
  {
    tab: 'superdense',
    slug: 'superdense-coding',
    title: 'Superdense Coding Protocol Simulator · Quantum Explorer',
    description:
      'Transmit two classical bits using a single qubit and a shared entangled Bell pair in this interactive superdense coding simulator.',
    lessonIds: ['superdense'],
  },
  {
    tab: 'noise',
    slug: 'noise-and-decoherence',
    title: 'Quantum Noise & Decoherence (T₁/T₂) Simulator · Quantum Explorer',
    description:
      'Visualize how T₁ energy relaxation and T₂ phase decoherence shrink a qubit’s Bloch vector into a mixed state over time.',
    lessonIds: ['noise'],
  },
  {
    tab: 'grover',
    slug: 'grovers-search',
    title: "Grover's Quantum Search Algorithm Simulator · Quantum Explorer",
    description:
      "Simulate Grover's amplitude amplification algorithm for N=4 and N=8 items. Watch the oracle flip phase and the diffusion operator boost the marked state.",
    lessonIds: ['grover'],
  },
];

const ROUTE_BY_TAB = new Map(ROUTES.map((r) => [r.tab, r]));
const ROUTE_BY_SLUG = new Map(ROUTES.map((r) => [r.slug, r]));

export function getRouteByTab(tab: string): RouteMeta | undefined {
  return ROUTE_BY_TAB.get(tab);
}

export function getRouteByPath(pathname: string): RouteMeta | undefined {
  const clean = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean) return undefined;
  return ROUTE_BY_SLUG.get(clean) ?? ROUTE_BY_TAB.get(clean);
}

export function tabToPath(tab: string): string {
  const route = ROUTE_BY_TAB.get(tab);
  return route ? `/${route.slug}` : '/';
}
