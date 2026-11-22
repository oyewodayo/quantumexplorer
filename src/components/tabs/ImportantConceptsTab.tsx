import { useEffect, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';

interface ConceptDef {
  titleKey: string;
  titleDefault: string;
  bodyKey: string;
  bodyDefault: string;
  isHtml?: boolean;
}

interface ConceptGroup {
  groupKey: string;
  groupDefault: string;
  concepts: ConceptDef[];
}

const CONCEPT_GROUPS: ConceptGroup[] = [
  {
    groupKey: 'concepts.mechanicsGroupTitle',
    groupDefault: 'Quantum Mechanics Fundamentals',
    concepts: [
      {
        titleKey: 'concepts.superpositionTitle',
        titleDefault: 'Superposition',
        bodyKey: 'concepts.superpositionBody',
        bodyDefault:
          "A quantum system can exist in a combination of multiple states at once, rather than being locked into just one — like a qubit being part |0⟩ and part |1⟩ simultaneously. It's not that the system is secretly in one state and we just don't know which; the combination is the actual physical state, until a measurement forces it to commit to an outcome.",
      },
      {
        titleKey: 'concepts.waveParticleTitle',
        titleDefault: 'Wave-Particle Duality',
        bodyKey: 'concepts.waveParticleBody',
        bodyDefault:
          'Every quantum object — electrons, photons, even qubits — behaves like a wave in some experiments (spreading out, interfering with itself) and like a discrete particle in others (arriving at a detector as one localized click). Which behavior shows up depends on what you measure, not on the object switching identities.',
      },
      {
        titleKey: 'concepts.quantumStateTitle',
        titleDefault: 'Quantum State (Wavefunction)',
        bodyKey: 'concepts.quantumStateBody',
        bodyDefault:
          'The complete mathematical description of a quantum system — everything that can ever be predicted about it, encoded in a set of complex amplitudes. For a qubit, that\'s the two-amplitude state vector |ψ⟩ = α|0⟩ + β|1⟩ explored throughout this app\'s Bits & Qubits and Maths Concept tabs.',
      },
      {
        titleKey: 'concepts.bornRuleTitle',
        titleDefault: 'The Born Rule',
        bodyKey: 'concepts.bornRuleBody',
        bodyDefault:
          'The rule connecting a quantum state\'s amplitudes to measurement probabilities: squaring the size of an amplitude gives the chance of observing that outcome. For a qubit α|0⟩ + β|1⟩, that\'s P(0) = |α|² and P(1) = |β|² — see the Measure tab for this in action.',
      },
      {
        titleKey: 'concepts.collapseTitle',
        titleDefault: 'Wavefunction Collapse',
        bodyKey: 'concepts.collapseBody',
        bodyDefault:
          "The moment a measurement happens, a quantum state stops being a mix of possibilities and becomes one definite outcome — irreversibly. The other possibilities aren't hidden somewhere; they're simply gone, which is what makes quantum measurement fundamentally different from just checking a value that was already fixed.",
      },
      {
        titleKey: 'concepts.uncertaintyTitle',
        titleDefault: 'Heisenberg Uncertainty Principle',
        bodyKey: 'concepts.uncertaintyBody',
        bodyDefault:
          "Certain pairs of properties — like a particle's position and momentum — can never both be known to arbitrary precision at the same time. This isn't a limitation of our instruments; it's a built-in feature of how quantum states are described.",
      },
      {
        titleKey: 'concepts.entanglementTitle',
        titleDefault: 'Quantum Entanglement',
        bodyKey: 'concepts.entanglementBody',
        isHtml: true,
        bodyDefault:
          "Quantum entanglement is a phenomenon in which two or more quantum particles become linked so that the state of one particle cannot be described independently of the others, even when they are separated by large distances. Instead, they share a single joint quantum state. <br /><br />Measuring one of the entangled particles instantly reveals what the others will show, no matter how far apart they are — yet no signal or energy actually travels between them at the moment of measurement. This can look like faster-than-light communication, but it isn't: each individual measurement outcome is still genuinely random, so there's no way to encode a message using entanglement alone. Explored in depth on the Entangle tab.",
      },
      {
        titleKey: 'concepts.interferenceTitle',
        titleDefault: 'Quantum Interference',
        bodyKey: 'concepts.interferenceBody',
        bodyDefault:
          "When a quantum system has more than one indistinguishable path to the same outcome, the paths' amplitudes combine — reinforcing each other in some places and canceling out in others — producing patterns (like the stripes in the double-slit experiment) that neither path could produce alone. See the Interference and Beam Splitter tabs.",
      },
      {
        titleKey: 'concepts.tunnelingTitle',
        titleDefault: 'Quantum Tunneling',
        bodyKey: 'concepts.tunnelingBody',
        bodyDefault:
          "A quantum particle has a nonzero chance of appearing on the far side of an energy barrier it classically shouldn't be able to cross, because its wavefunction doesn't stop dead at the barrier — it decays through it instead of bouncing off. See the Tunnel tab for an interactive wave packet hitting a barrier.",
      },
      {
        titleKey: 'concepts.decoherenceTitle',
        titleDefault: 'Decoherence',
        bodyKey: 'concepts.decoherenceBody',
        bodyDefault:
          "The process by which a quantum system's fragile superposition and entanglement leak away through unavoidable interaction with its surrounding environment, making it behave more and more like a classical system. It's the main practical obstacle to building large, reliable quantum computers.",
      },
      {
        titleKey: 'concepts.schrodingerTitle',
        titleDefault: 'The Schrödinger Equation',
        bodyKey: 'concepts.schrodingerBody',
        bodyDefault:
          "The master equation of quantum mechanics — it describes exactly how a quantum state evolves smoothly over time, the same way Newton's laws describe how a classical object moves. Every quantum gate in this app is really just a snapshot of this equation's evolution over a fixed slice of time, which is also why gates are reversible: the equation never destroys information, only reshapes it.",
      },
      {
        titleKey: 'concepts.bellTheoremTitle',
        titleDefault: "Bell's Theorem & the EPR Paradox",
        bodyKey: 'concepts.bellTheoremBody',
        bodyDefault:
          'Einstein, Podolsky, and Rosen argued in 1935 that quantum mechanics must be incomplete — entangled particles\' correlations, they reasoned, could be explained by some shared "hidden variable" fixed in advance, without any real spookiness. Bell\'s theorem (1964) proved this wrong: no theory based on hidden variables can ever reproduce every correlation quantum mechanics predicts, and decades of experiments have confirmed quantum mechanics\' predictions, not the hidden-variable ones.',
      },
      {
        titleKey: 'concepts.zenoTitle',
        titleDefault: 'Quantum Zeno Effect',
        bodyKey: 'concepts.zenoBody',
        bodyDefault:
          'Measuring a quantum system frequently enough can effectively freeze its evolution — each measurement collapses the state back toward what it already was, before it has a chance to evolve away. Named after Zeno\'s paradox of the arrow that never seems to move, it\'s a direct consequence of wavefunction collapse: a "watched" quantum state changes far more slowly than an unwatched one.',
      },
      {
        titleKey: 'concepts.hilbertSpaceTitle',
        titleDefault: 'Hilbert Space',
        bodyKey: 'concepts.hilbertSpaceBody',
        bodyDefault:
          'The mathematical "space" where every quantum state lives. Each possible quantum state is represented as a vector in a Hilbert space, and the rules of quantum mechanics — superposition, measurement, and evolution — are all expressed as operations on these vectors. A single qubit lives in a two-dimensional Hilbert space, while an n-qubit system lives in a 2ⁿ-dimensional one.',
      },
      {
        titleKey: 'concepts.linearOperatorsTitle',
        titleDefault: 'Linear Operators',
        bodyKey: 'concepts.linearOperatorsBody',
        bodyDefault:
          'Physical quantities and quantum gates are represented by linear operators acting on quantum states. Applying an operator transforms one valid quantum state into another, making linear algebra the language of quantum mechanics.',
      },
      {
        titleKey: 'concepts.observableTitle',
        titleDefault: 'Observable',
        bodyKey: 'concepts.observableBody',
        bodyDefault:
          'An observable is any measurable physical property — such as position, momentum, spin, or energy. Every observable is represented by a Hermitian operator whose eigenvalues are the only measurement outcomes that can ever occur.',
      },
      {
        titleKey: 'concepts.eigenstatesTitle',
        titleDefault: 'Eigenstates & Eigenvalues',
        bodyKey: 'concepts.eigenstatesBody',
        bodyDefault:
          'If measuring an observable always produces the same result for a particular quantum state, that state is an eigenstate of the observable. The measurement result is the corresponding eigenvalue. Measuring an eigenstate leaves it unchanged, whereas measuring a superposition generally causes wavefunction collapse.',
      },
      {
        titleKey: 'concepts.expectationValueTitle',
        titleDefault: 'Expectation Value',
        bodyKey: 'concepts.expectationValueBody',
        bodyDefault:
          'Rather than predicting one definite measurement result, quantum mechanics predicts the average value obtained after repeating the same experiment many times on identically prepared systems. This average is called the expectation value.',
      },
      {
        titleKey: 'concepts.probabilityAmplitudesTitle',
        titleDefault: 'Probability Amplitudes',
        bodyKey: 'concepts.probabilityAmplitudesBody',
        bodyDefault:
          'Unlike ordinary probabilities, quantum mechanics assigns complex probability amplitudes to possible outcomes. These amplitudes can interfere constructively or destructively, and only their squared magnitudes become observable probabilities through the Born Rule.',
      },
      {
        titleKey: 'concepts.phaseTitle',
        titleDefault: 'Phase',
        bodyKey: 'concepts.phaseBody',
        bodyDefault:
          "A quantum state's phase is invisible in a single measurement but determines how amplitudes interfere. Relative phase — not absolute phase — is what gives quantum interference and many quantum algorithms their power.",
      },
      {
        titleKey: 'concepts.globalPhaseTitle',
        titleDefault: 'Global Phase vs Relative Phase',
        bodyKey: 'concepts.globalPhaseBody',
        bodyDefault:
          'Multiplying an entire quantum state by the same complex phase changes nothing physically; this is called a global phase. Changing the phase between components of a superposition changes observable interference patterns and therefore has physical consequences.',
      },
      {
        titleKey: 'concepts.spinTitle',
        titleDefault: 'Spin',
        bodyKey: 'concepts.spinBody',
        bodyDefault:
          'Spin is an intrinsic form of angular momentum carried by quantum particles. Unlike ordinary rotation, spin is a fundamental quantum property that comes only in discrete values. Electron spin is the physical realization of many experimental qubits.',
      },
      {
        titleKey: 'concepts.pauliExclusionTitle',
        titleDefault: 'Pauli Exclusion Principle',
        bodyKey: 'concepts.pauliExclusionBody',
        bodyDefault:
          'No two identical fermions can occupy the same quantum state simultaneously. This simple rule explains the structure of atoms, chemistry, and why matter remains stable.',
      },
      {
        titleKey: 'concepts.identicalParticlesTitle',
        titleDefault: 'Identical Particles',
        bodyKey: 'concepts.identicalParticlesBody',
        bodyDefault:
          'Particles of the same type are fundamentally indistinguishable. Swapping two identical particles does not create a new physical state — it only changes the wavefunction by a sign (fermions) or not at all (bosons).',
      },
      {
        titleKey: 'concepts.bosonsFermionsTitle',
        titleDefault: 'Bosons & Fermions',
        bodyKey: 'concepts.bosonsFermionsBody',
        bodyDefault:
          'Bosons can share the same quantum state, allowing phenomena like lasers and Bose–Einstein condensates. Fermions obey the Pauli exclusion principle, giving rise to atomic structure and electronic materials.',
      },
      {
        titleKey: 'concepts.densityMatrixTitle',
        titleDefault: 'Density Matrix',
        bodyKey: 'concepts.densityMatrixBody',
        bodyDefault:
          'Not every quantum system is perfectly isolated. A density matrix describes both pure quantum states and statistical mixtures, making it the standard tool for describing noisy or partially known quantum systems.',
      },
      {
        titleKey: 'concepts.mixedStatesTitle',
        titleDefault: 'Mixed States',
        bodyKey: 'concepts.mixedStatesBody',
        bodyDefault:
          'Unlike a superposition, which is genuinely quantum, a mixed state represents classical uncertainty about which quantum state a system is actually in. Density matrices distinguish between these two very different situations.',
      },
      {
        titleKey: 'concepts.measurementBasisTitle',
        titleDefault: 'Measurement Basis',
        bodyKey: 'concepts.measurementBasisBody',
        bodyDefault:
          'A quantum measurement is always made relative to a chosen basis. The same state may look definite in one basis but exist as a superposition in another, making basis choice central to quantum computing.',
      },
      {
        titleKey: 'concepts.sternGerlachExpTitle',
        titleDefault: 'Stern–Gerlach Experiment',
        bodyKey: 'concepts.sternGerlachExpBody',
        isHtml: true,
        bodyDefault:
          "The Stern–Gerlach experiment (1922), performed by Otto Stern and Walther Gerlach, demonstrated that angular momentum is quantized — showing that particles such as electrons possess an intrinsic property called spin that can only take discrete values when measured along a chosen axis. It's one of the foundational experiments of quantum mechanics. <ul class=\"quantum-list\"><li><b>Objective:</b> to determine whether an atom's magnetic moment could point in any direction, as classical physics predicted, or only in specific, quantized orientations.</li><li><b>Why silver atoms?</b> Silver has a single unpaired outer electron and effectively zero net orbital angular momentum, so the measured magnetic moment comes almost entirely from that one electron's spin — making the result far easier to interpret.</li><li><b>Classical prediction:</b> a randomly-oriented magnetic moment should deflect by any amount, smearing the beam into a continuous band on the screen.</li><li><b>What was actually observed:</b> the beam split into exactly two distinct spots, not a continuous band — showing only two spin orientations are possible along the measurement axis, spin up (+ħ/2) and spin down (−ħ/2).</li></ul> Explore this yourself, including what happens when you measure spin along a second, incompatible axis, on the Stern–Gerlach tab.",
      },
      {
        titleKey: 'concepts.eprParadoxTitle',
        titleDefault: 'EPR Paradox',
        bodyKey: 'concepts.eprParadoxBody',
        isHtml: true,
        bodyDefault:
          'The EPR paradox (1935), proposed by Albert Einstein, Boris Podolsky, and Nathan Rosen, is a thought experiment arguing that quantum mechanics, as it stood, must be an incomplete description of physical reality — not because its predictions were wrong, but because of what those predictions seemed to imply. <ul class="quantum-list"><li><b>Objective:</b> to show that if quantum mechanics is correct and "local realism" holds — that a particle has definite properties independent of measurement, and no influence travels faster than light — then quantum mechanics must be missing something.</li><li><b>The setup:</b> two particles are prepared in an entangled state and separated by an arbitrarily large distance. Measuring a property of one instantly tells you the corresponding property of the other, with certainty.</li><li><b>The argument:</b> since measuring particle A lets you predict particle B\'s outcome with certainty without ever touching B, EPR reasoned that property of B must already have been fixed before the measurement — otherwise measuring A would have to instantly affect B, which looked like "spooky action at a distance."</li><li><b>The paradox:</b> quantum mechanics says the two particles share one undetermined joint state right up until measurement. EPR\'s own reasoning said that\'s impossible if locality holds — so either quantum mechanics is incomplete, or nature really is nonlocal in this specific sense.</li></ul> For thirty years this stayed a question of interpretation with no experimental answer — until Bell\'s Theorem (see above) turned it into a testable one, and the experiments came down decisively against Einstein\'s hidden-variable intuition.',
      },
    ],
  },
  {
    groupKey: 'concepts.computingGroupTitle',
    groupDefault: 'Quantum Computing Concepts',
    concepts: [
      {
        titleKey: 'concepts.qubitTitle',
        titleDefault: 'Qubit',
        bodyKey: 'concepts.qubitBody',
        bodyDefault:
          "The basic unit of quantum information — like a classical bit, but able to exist in a superposition of 0 and 1 rather than being locked to one value. A qubit's exact state is described by two complex amplitudes and visualized as a point on the Bloch sphere, explored on the Bits & Qubits tab.",
      },
      {
        titleKey: 'concepts.blochSphereTitle',
        titleDefault: 'Bloch Sphere',
        bodyKey: 'concepts.blochSphereBody',
        bodyDefault:
          'A geometric picture of every possible single-qubit state as a point on the surface of a sphere — the north and south poles are |0⟩ and |1⟩, and every other point is some superposition of the two. It turns the abstract algebra of amplitudes into something you can literally see and drag around.',
      },
      {
        titleKey: 'concepts.gateTitle',
        titleDefault: 'Quantum Gate',
        bodyKey: 'concepts.gateBody',
        bodyDefault:
          "The quantum equivalent of a classical logic gate — an operation that transforms a qubit's state, geometrically a rotation of its point on the Bloch sphere. Unlike classical gates, every quantum gate is reversible: none of them ever throw information away. See the Gates tab for the six fixed gates (H, X, Y, Z, S, T) and their effects.",
      },
      {
        titleKey: 'concepts.unitarityTitle',
        titleDefault: 'Unitarity & Reversibility',
        bodyKey: 'concepts.unitarityBody',
        bodyDefault:
          'Every valid quantum gate must be a unitary matrix (U†U = I) — the mathematical condition that guarantees it preserves total probability and can always be undone by its own conjugate transpose. This is why quantum computation, unlike classical AND/OR logic, never destroys information along the way.',
      },
      {
        titleKey: 'concepts.circuitTitle',
        titleDefault: 'Quantum Circuit',
        bodyKey: 'concepts.circuitBody',
        bodyDefault:
          "A sequence of quantum gates applied to one or more qubits, read left to right — the quantum equivalent of a classical logic circuit. Because gate order generally matters (rotations don't commute), the same set of gates in a different sequence can land the qubits in an entirely different final state; build one yourself on the Circuits tab.",
      },
      {
        titleKey: 'concepts.bellGhzTitle',
        titleDefault: 'Bell States & GHZ States',
        bodyKey: 'concepts.bellGhzBody',
        isHtml: true,
        bodyDefault:
          "Bell states are the four specific, maximally entangled two-qubit states — Φ⁺, Φ⁻, Ψ⁺, and Ψ⁻ — forming a foundational orthonormal basis in quantum information and the core resource behind protocols like quantum teleportation and superdense coding. All four are produced by the same two-gate recipe (a Hadamard on one qubit, then a CNOT controlled by it), just starting from a different one of the four two-qubit basis states. <br /><br />The four Bell states are: <ul class=\"quantum-list\"><li><b>Φ⁺ = (|00⟩ + |11⟩)/√2</b> — qubits match and stay in phase.</li><li><b>Φ⁻ = (|00⟩ − |11⟩)/√2</b> — qubits match, with a phase flip.</li><li><b>Ψ⁺ = (|01⟩ + |10⟩)/√2</b> — qubits are opposite and in phase.</li><li><b>Ψ⁻ = (|01⟩ − |10⟩)/√2</b> — qubits are opposite, with a phase flip.</li></ul> Measuring one qubit in any of the four instantly determines the other's outcome. GHZ states generalize the same idea to three or more qubits, all correlated together — build Bell pairs and GHZ triples from scratch with Hadamard and CNOT gates on the Circuits tab.",
      },
      {
        titleKey: 'concepts.noCloningTitle',
        titleDefault: 'No-Cloning Theorem',
        bodyKey: 'concepts.noCloningBody',
        bodyDefault:
          "It's physically impossible to create an exact, independent copy of an arbitrary unknown quantum state — a direct consequence of quantum mechanics being linear. This is why quantum information has to be handled so differently from classical bits, which can always be freely copied.",
      },
      {
        titleKey: 'concepts.algorithmsTitle',
        titleDefault: 'Quantum Algorithms',
        bodyKey: 'concepts.algorithmsBody',
        bodyDefault:
          "Step-by-step procedures built from quantum gates that exploit superposition and interference to solve certain problems dramatically faster than any known classical algorithm — Shor's algorithm factors large numbers efficiently, and Grover's algorithm searches an unsorted list quadratically faster than any classical search.",
      },
      {
        titleKey: 'concepts.errorCorrectionTitle',
        titleDefault: 'Quantum Error Correction',
        bodyKey: 'concepts.errorCorrectionBody',
        bodyDefault:
          "A set of techniques for protecting fragile quantum information from decoherence and noise by spreading a single logical qubit's state redundantly across many physical qubits, without ever directly measuring — and so collapsing — the information itself. One of the central engineering challenges standing between today's noisy quantum computers and large-scale, reliable ones.",
      },
      {
        titleKey: 'concepts.supremacyTitle',
        titleDefault: 'Quantum Supremacy / Advantage',
        bodyKey: 'concepts.supremacyBody',
        bodyDefault:
          'The milestone at which a quantum computer performs a specific task faster than any classical supercomputer could feasibly manage — "supremacy" for a (possibly contrived) benchmark task, "advantage" for a practically useful one. It demonstrates that quantum effects can be harnessed for real computational power, not just simulated on a classical machine.',
      },
      {
        titleKey: 'concepts.teleportationTitle',
        titleDefault: 'Quantum Teleportation',
        bodyKey: 'concepts.teleportationBody',
        bodyDefault:
          "A protocol for transferring an unknown qubit's exact state to a distant qubit, using a shared entangled pair plus two classical bits of communication — without ever measuring (and so destroying) the original state directly. Despite the name, nothing travels faster than light: the receiver can't reconstruct the state until the ordinary classical bits arrive, and the original qubit's state is unavoidably destroyed in the process, consistent with the No-Cloning Theorem.",
      },
      {
        titleKey: 'concepts.qkdTitle',
        titleDefault: 'Quantum Cryptography (QKD)',
        bodyKey: 'concepts.qkdBody',
        bodyDefault:
          "Quantum key distribution lets two parties agree on a shared secret key with security guaranteed by physics rather than computational difficulty — protocols like BB84 encode key bits in qubit states such that any eavesdropper's measurement unavoidably disturbs them, exposing the intrusion. It's a direct practical payoff of the No-Cloning Theorem: an eavesdropper can't secretly copy the qubits to inspect them undetected.",
      },
      {
        titleKey: 'concepts.qftTitle',
        titleDefault: 'Quantum Fourier Transform (QFT)',
        bodyKey: 'concepts.qftBody',
        bodyDefault:
          "The quantum analog of the classical discrete Fourier transform, implemented as a quantum circuit that runs exponentially faster than any classical equivalent. It's the key subroutine inside Shor's algorithm — the step that extracts the hidden periodicity used to factor large numbers — and appears throughout quantum algorithms wherever a hidden pattern needs to be read out of a superposition.",
      },
      {
        titleKey: 'concepts.tensorProductTitle',
        titleDefault: 'Tensor Product',
        bodyKey: 'concepts.tensorProductBody',
        bodyDefault:
          "Multiple qubits combine through the tensor product rather than ordinary addition. Two qubits therefore require four amplitudes, three qubits require eight, and n qubits require 2ⁿ, which is the origin of quantum computing's enormous state space.",
      },
      {
        titleKey: 'concepts.multiQubitStatesTitle',
        titleDefault: 'Multi-Qubit States',
        bodyKey: 'concepts.multiQubitStatesBody',
        bodyDefault:
          'A system of several qubits cannot always be described as independent single-qubit states. Some states factor into separate qubits, while others become entangled and require one combined description.',
      },
      {
        titleKey: 'concepts.controlledGatesTitle',
        titleDefault: 'Controlled Gates',
        bodyKey: 'concepts.controlledGatesBody',
        bodyDefault:
          'Controlled gates perform an operation only when another qubit has a particular value. The CNOT gate is the simplest example and is the essential building block for creating entanglement.',
      },
      {
        titleKey: 'concepts.swapGateTitle',
        titleDefault: 'SWAP Gate',
        bodyKey: 'concepts.swapGateBody',
        bodyDefault:
          'The SWAP gate exchanges the quantum states of two qubits without measuring them. It is widely used to move information around a quantum processor.',
      },
      {
        titleKey: 'concepts.universalGateSetsTitle',
        titleDefault: 'Universal Gate Sets',
        bodyKey: 'concepts.universalGateSetsBody',
        bodyDefault:
          'A small collection of gates is sufficient to approximate any quantum computation to arbitrary accuracy. Examples include {H, T, CNOT} and {Rx, Ry, CNOT}.',
      },
      {
        titleKey: 'concepts.quantumParallelismTitle',
        titleDefault: 'Quantum Parallelism',
        bodyKey: 'concepts.quantumParallelismBody',
        bodyDefault:
          'Because a quantum computer can prepare a superposition of many inputs simultaneously, one operation acts on all of them at once. The challenge is extracting useful information through interference rather than trying to read every result.',
      },
      {
        titleKey: 'concepts.oracleTitle',
        titleDefault: 'Oracle',
        bodyKey: 'concepts.oracleBody',
        bodyDefault:
          'Many quantum algorithms treat part of a problem as a black-box function called an oracle. The algorithm gains speed by querying the oracle in quantum superposition.',
      },
      {
        titleKey: 'concepts.ancillaQubitsTitle',
        titleDefault: 'Ancilla Qubits',
        bodyKey: 'concepts.ancillaQubitsBody',
        bodyDefault:
          'Ancilla qubits are temporary helper qubits used during computations, error correction, and arithmetic before being reset or discarded.',
      },
      {
        titleKey: 'concepts.quantumMeasurementTitle',
        titleDefault: 'Quantum Measurement',
        bodyKey: 'concepts.quantumMeasurementBody',
        bodyDefault:
          'Although measurement appears earlier, quantum computing treats it operationally. Measuring a qubit converts fragile quantum information into an ordinary classical bit, ending coherent evolution.',
      },
      {
        titleKey: 'concepts.midCircuitMeasurementTitle',
        titleDefault: 'Mid-Circuit Measurement',
        bodyKey: 'concepts.midCircuitMeasurementBody',
        bodyDefault:
          'Some quantum computers allow measurements during computation rather than only at the end. Later gates can depend on these measurement outcomes, enabling error correction and adaptive algorithms.',
      },
      {
        titleKey: 'concepts.classicalFeedforwardTitle',
        titleDefault: 'Classical Feedforward',
        bodyKey: 'concepts.classicalFeedforwardBody',
        bodyDefault:
          'Measurement results obtained during a quantum circuit can determine which later gates should be applied, combining classical control with quantum evolution.',
      },
    ],
  },
  {
    groupKey: 'concepts.quantumInfoGroupTitle',
    groupDefault: 'Quantum Information Theory',
    concepts: [
      {
        titleKey: 'concepts.quantumInformationTitle',
        titleDefault: 'Quantum Information',
        bodyKey: 'concepts.quantumInformationBody',
        bodyDefault:
          'Quantum information is information stored in quantum states. Unlike classical information, it can exploit superposition and entanglement, enabling entirely new forms of computation and communication.',
      },
      {
        titleKey: 'concepts.quantumChannelTitle',
        titleDefault: 'Quantum Channel',
        bodyKey: 'concepts.quantumChannelBody',
        bodyDefault:
          'A quantum channel mathematically describes how quantum information changes while traveling through space or interacting with noise.',
      },
      {
        titleKey: 'concepts.fidelityTitle',
        titleDefault: 'Fidelity',
        bodyKey: 'concepts.fidelityBody',
        bodyDefault:
          'Fidelity measures how similar two quantum states are. It is widely used to benchmark quantum hardware, gates, and error correction.',
      },
      {
        titleKey: 'concepts.traceDistanceTitle',
        titleDefault: 'Trace Distance',
        bodyKey: 'concepts.traceDistanceBody',
        bodyDefault:
          'Trace distance quantifies how distinguishable two quantum states are. It gives the maximum probability of telling them apart using any possible measurement.',
      },
      {
        titleKey: 'concepts.entanglementEntropyTitle',
        titleDefault: 'Entanglement Entropy',
        bodyKey: 'concepts.entanglementEntropyBody',
        bodyDefault:
          'A numerical measure of how strongly different parts of a quantum system are entangled. It plays a central role in condensed matter physics, quantum field theory, and quantum gravity.',
      },
      {
        titleKey: 'concepts.stateTomographyTitle',
        titleDefault: 'Quantum State Tomography',
        bodyKey: 'concepts.stateTomographyBody',
        bodyDefault:
          'A technique for reconstructing an unknown quantum state by making many measurements in different bases.',
      },
      {
        titleKey: 'concepts.processTomographyTitle',
        titleDefault: 'Process Tomography',
        bodyKey: 'concepts.processTomographyBody',
        bodyDefault:
          'Rather than reconstructing a state, process tomography reconstructs an unknown quantum gate or operation by studying how it transforms many known input states.',
      },
    ],
  },
  {
    groupKey: 'concepts.advancedGroupTitle',
    groupDefault: 'Advanced Quantum Computing',
    concepts: [
      {
        titleKey: 'concepts.vqeQaoaTitle',
        titleDefault: 'Variational Quantum Algorithms (VQE & QAOA)',
        bodyKey: 'concepts.vqeQaoaBody',
        isHtml: true,
        bodyDefault:
          "Variational quantum algorithms are hybrid quantum–classical algorithms in which a quantum computer prepares parameterized quantum states while a classical computer repeatedly adjusts those parameters to optimize a desired objective. This iterative feedback loop makes them well suited to today's noisy quantum hardware (NISQ devices). <br /><br />The two best-known examples are: <ul class=\"quantum-list\"><li><b>Variational Quantum Eigensolver (VQE):</b> Designed to estimate the lowest-energy (ground) state of a quantum system. It is widely used in quantum chemistry, materials science, and Hamiltonian simulation to study molecules and quantum materials.</li><li><b>Quantum Approximate Optimization Algorithm (QAOA):</b> Designed to find high-quality approximate solutions to difficult combinatorial optimization problems, such as routing, scheduling, graph partitioning, and portfolio optimization, by alternating between problem-specific and mixing quantum operations.</li></ul> VQE and QAOA are among the most promising quantum algorithms for today's noisy intermediate-scale quantum (NISQ) computers because they reduce the depth of quantum circuits while leveraging classical optimization.",
      },
      {
        titleKey: 'concepts.nisqTitle',
        titleDefault: 'NISQ Computing',
        bodyKey: 'concepts.nisqBody',
        bodyDefault:
          'The current era of quantum computers is called the Noisy Intermediate-Scale Quantum (NISQ) era: devices contain tens to thousands of imperfect qubits but cannot yet run fully fault-tolerant algorithms.',
      },
      {
        titleKey: 'concepts.faultTolerantTitle',
        titleDefault: 'Fault-Tolerant Quantum Computing',
        bodyKey: 'concepts.faultTolerantBody',
        bodyDefault:
          'A future generation of quantum computers capable of performing arbitrarily long computations despite hardware errors through quantum error correction.',
      },
      {
        titleKey: 'concepts.surfaceCodeTitle',
        titleDefault: 'Surface Code',
        bodyKey: 'concepts.surfaceCodeBody',
        bodyDefault:
          'The leading quantum error-correcting code, encoding one logical qubit into many physical qubits arranged on a two-dimensional lattice.',
      },
      {
        titleKey: 'concepts.logicalPhysicalQubitsTitle',
        titleDefault: 'Logical vs Physical Qubits',
        bodyKey: 'concepts.logicalPhysicalQubitsBody',
        bodyDefault:
          'Physical qubits are the hardware qubits that suffer from noise. Logical qubits are protected, error-corrected qubits encoded across many physical ones.',
      },
      {
        titleKey: 'concepts.magicStatesTitle',
        titleDefault: 'Magic States',
        bodyKey: 'concepts.magicStatesBody',
        bodyDefault:
          'Certain quantum gates cannot be implemented directly in many fault-tolerant architectures. Instead, specially prepared "magic states" are consumed to perform them, making magic-state distillation one of the largest costs in scalable quantum computing.',
      },
      {
        titleKey: 'concepts.hamiltonianSimulationTitle',
        titleDefault: 'Hamiltonian Simulation',
        bodyKey: 'concepts.hamiltonianSimulationBody',
        bodyDefault:
          "One of quantum computing's original motivations: efficiently simulating the dynamics of molecules, materials, and quantum field theories governed by a Hamiltonian. Many researchers — including those working on lattice field theories and quantum chemistry — consider this one of the most important long-term applications of quantum computers.",
      },
      {
        titleKey: 'concepts.qpeTitle',
        titleDefault: 'Quantum Phase Estimation (QPE)',
        bodyKey: 'concepts.qpeBody',
        bodyDefault:
          "A foundational quantum algorithm for estimating the eigenvalues of unitary operators. It underpins Shor's algorithm and many algorithms for quantum chemistry and Hamiltonian simulation.",
      },
      {
        titleKey: 'concepts.adiabaticQCTitle',
        titleDefault: 'Adiabatic Quantum Computing',
        bodyKey: 'concepts.adiabaticQCBody',
        bodyDefault:
          'A computational model in which the system remains in its ground state while its Hamiltonian changes slowly. If the evolution is slow enough, the final ground state encodes the solution to an optimization problem.',
      },
      {
        titleKey: 'concepts.mbqcTitle',
        titleDefault: 'Measurement-Based Quantum Computing',
        bodyKey: 'concepts.mbqcBody',
        bodyDefault:
          'Instead of computing primarily with gates, computation proceeds by preparing a large entangled resource state (a cluster state) and then performing carefully chosen measurements. The measurements themselves drive the computation.',
      },
    ],
  },
];

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ');
}

export default function ImportantConceptsTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'important-concepts';

  const [query, setQuery] = useState('');
  const [zoomedConcept, setZoomedConcept] = useState<{ title: string; bodyHtml: string } | null>(null);
  const [zoomVisible, setZoomVisible] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (!zoomedConcept) {
      setZoomVisible(false);
      return undefined;
    }
    const raf = requestAnimationFrame(() => setZoomVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
    };
  }, [zoomedConcept]);

  function closeZoom() {
    setZoomVisible(false);
    setZoomedConcept(null);
  }

  let totalVisible = 0;
  const groupsWithVisibility = CONCEPT_GROUPS.map((group) => {
    let groupVisible = 0;
    const items = group.concepts.map((c) => {
      const title = t(c.titleKey, c.titleDefault);
      const body = t(c.bodyKey, c.bodyDefault);
      const plain = `${title} ${c.isHtml ? stripTags(body) : body}`.toLowerCase();
      const matches = !normalizedQuery || plain.includes(normalizedQuery);
      if (matches) {
        groupVisible++;
        totalVisible++;
      }
      return { ...c, title, body, matches };
    });
    return { ...group, groupVisible, items };
  });

  return (
    <section
      id="tab-important-concepts"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('concepts.title', 'Important Concepts')}</h1>
        <p className="compare-subtitle">
          {t(
            'concepts.subtitle',
            'A glossary of the essential ideas behind quantum mechanics and quantum computing — the vocabulary the rest of this app builds on.'
          )}
        </p>
      </div>
      <div className="concept-search-wrap">
        <svg className="concept-search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          id="concept-search"
          className="concept-search-input"
          autoComplete="off"
          spellCheck={false}
          placeholder={t('concepts.searchPlaceholder', 'Search concepts…')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="concept-search-clear"
          id="concept-search-clear"
          aria-label="Clear search"
          style={{ display: normalizedQuery ? undefined : 'none' }}
          onClick={() => setQuery('')}
        >
          ✕
        </button>
      </div>
      <p
        className="concept-search-empty"
        id="concept-search-empty"
        style={{ display: totalVisible === 0 ? undefined : 'none' }}
      >
        {totalVisible === 0
          ? t('concepts.searchNoResults', 'No concepts match "{query}".').replace('{query}', query.trim())
          : ''}
      </p>
      <div className="intro-layout" style={{ maxWidth: '1080px' }}>
        {groupsWithVisibility.map((g, gi) => (
          <div key={g.groupKey} style={{ display: 'contents' }}>
            <div
              className={`section-label${g.groupVisible === 0 ? ' concept-hidden' : ''}`}
              style={gi > 0 ? { marginTop: '22px' } : undefined}
            >
              {t(g.groupKey, g.groupDefault)}
            </div>
            <div className={`intro-glossary-grid${g.groupVisible === 0 ? ' concept-hidden' : ''}`}>
              {g.items.map((item) => (
                <div
                  key={item.titleKey}
                  className={`card${!item.matches ? ' concept-hidden' : ''}`}
                  onClick={() => setZoomedConcept({ title: item.title, bodyHtml: item.body })}
                >
                  <div className="card-title">
                    <b>{item.title}</b>
                  </div>
                  {item.isHtml ? (
                    <div className="bit-explainer" dangerouslySetInnerHTML={{ __html: item.body }} />
                  ) : (
                    <p className="bit-explainer">{item.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {zoomedConcept && (
        <div
          className={`concept-zoom-backdrop${zoomVisible ? ' visible' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeZoom();
          }}
        >
          <div className="concept-zoom-card" role="dialog" aria-modal="true">
            <button
              className="concept-zoom-close"
              type="button"
              aria-label="Close"
              data-zoom-close=""
              onClick={closeZoom}
            >
              ✕
            </button>
            <div className="concept-zoom-body">
              <div className="card-title">
                <b>{zoomedConcept.title}</b>
              </div>
              <div className="bit-explainer" dangerouslySetInnerHTML={{ __html: zoomedConcept.bodyHtml }} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
