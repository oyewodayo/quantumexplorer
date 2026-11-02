// Generated from the original index.html markup; edit freely.
export default function ImportantConceptsTab() {
  return (
    <section id="tab-important-concepts" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="concepts.title">
          Important Concepts
        </h1>
        <p className="compare-subtitle" data-i18n="concepts.subtitle">
          A glossary of the essential ideas behind quantum mechanics and quantum computing — the vocabulary the rest of this app builds on.
        </p>
      </div>
      <div className="concept-search-wrap">
        <svg className="concept-search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="search" id="concept-search" className="concept-search-input" autoComplete="off" spellCheck="false" data-i18n="concepts.searchPlaceholder" data-i18n-attr="placeholder" placeholder="Search concepts…" />
        <button type="button" className="concept-search-clear" id="concept-search-clear" aria-label="Clear search" style={{display: "none"}}>
          ✕
        </button>
      </div>
      <p className="concept-search-empty" id="concept-search-empty" style={{display: "none"}} />
      <div className="intro-layout" style={{maxWidth: "1080px"}}>
        <div className="section-label" data-i18n="concepts.mechanicsGroupTitle">
          Quantum Mechanics Fundamentals
        </div>
        <div className="intro-glossary-grid">
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.superpositionTitle">
                Superposition
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.superpositionBody">
              A quantum system can exist in a combination of multiple states at once, rather than being locked into just one — like a qubit being part |0⟩ and part |1⟩ simultaneously. It's not that the system is secretly in one state and we just don't know which; the combination is the actual physical state, until a measurement forces it to commit to an outcome.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.waveParticleTitle">
                Wave-Particle Duality
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.waveParticleBody">
              Every quantum object — electrons, photons, even qubits — behaves like a wave in some experiments (spreading out, interfering with itself) and like a discrete particle in others (arriving at a detector as one localized click). Which behavior shows up depends on what you measure, not on the object switching identities.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.quantumStateTitle">
                Quantum State (Wavefunction)
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.quantumStateBody">
              The complete mathematical description of a quantum system — everything that can ever be predicted about it, encoded in a set of complex amplitudes. For a qubit, that's the two-amplitude state vector |ψ⟩ = α|0⟩ + β|1⟩ explored throughout this app's Bits & Qubits and Maths Concept tabs.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.bornRuleTitle">
                The Born Rule
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.bornRuleBody">
              The rule connecting a quantum state's amplitudes to measurement probabilities: squaring the size of an amplitude gives the chance of observing that outcome. For a qubit α|0⟩ + β|1⟩, that's P(0) = |α|² and P(1) = |β|² — see the Measure tab for this in action.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.collapseTitle">
                Wavefunction Collapse
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.collapseBody">
              The moment a measurement happens, a quantum state stops being a mix of possibilities and becomes one definite outcome — irreversibly. The other possibilities aren't hidden somewhere; they're simply gone, which is what makes quantum measurement fundamentally different from just checking a value that was already fixed.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.uncertaintyTitle">
                Heisenberg Uncertainty Principle
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.uncertaintyBody">
              Certain pairs of properties — like a particle's position and momentum — can never both be known to arbitrary precision at the same time. This isn't a limitation of our instruments; it's a built-in feature of how quantum states are described.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.entanglementTitle">
                Quantum Entanglement
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.entanglementBody" data-i18n-html="">
              Quantum entanglement is a phenomenon in which two or more quantum particles become linked so that the state of one particle cannot be described independently of the others, even when they are separated by large distances. Instead, they share a single joint quantum state.{' '}
              <br />
              <br />
              Measuring one of the entangled particles instantly reveals what the others will show, no matter how far apart they are — yet no signal or energy actually travels between them at the moment of measurement. This can look like faster-than-light communication, but it isn't: each individual measurement outcome is still genuinely random, so there's no way to encode a message using entanglement alone. Explored in depth on the Entangle tab.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.interferenceTitle">
                Quantum Interference
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.interferenceBody">
              When a quantum system has more than one indistinguishable path to the same outcome, the paths' amplitudes combine — reinforcing each other in some places and canceling out in others — producing patterns (like the stripes in the double-slit experiment) that neither path could produce alone. See the Interference and Beam Splitter tabs.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.tunnelingTitle">
                Quantum Tunneling
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.tunnelingBody">
              A quantum particle has a nonzero chance of appearing on the far side of an energy barrier it classically shouldn't be able to cross, because its wavefunction doesn't stop dead at the barrier — it decays through it instead of bouncing off. See the Tunnel tab for an interactive wave packet hitting a barrier.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.decoherenceTitle">
                Decoherence
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.decoherenceBody">
              The process by which a quantum system's fragile superposition and entanglement leak away through unavoidable interaction with its surrounding environment, making it behave more and more like a classical system. It's the main practical obstacle to building large, reliable quantum computers.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.schrodingerTitle">
                The Schrödinger Equation
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.schrodingerBody">
              The master equation of quantum mechanics — it describes exactly how a quantum state evolves smoothly over time, the same way Newton's laws describe how a classical object moves. Every quantum gate in this app is really just a snapshot of this equation's evolution over a fixed slice of time, which is also why gates are reversible: the equation never destroys information, only reshapes it.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.bellTheoremTitle">
                Bell's Theorem & the EPR Paradox
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.bellTheoremBody">
              Einstein, Podolsky, and Rosen argued in 1935 that quantum mechanics must be incomplete — entangled particles' correlations, they reasoned, could be explained by some shared "hidden variable" fixed in advance, without any real spookiness. Bell's theorem (1964) proved this wrong: no theory based on hidden variables can ever reproduce every correlation quantum mechanics predicts, and decades of experiments have confirmed quantum mechanics' predictions, not the hidden-variable ones.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.zenoTitle">
                Quantum Zeno Effect
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.zenoBody">
              Measuring a quantum system frequently enough can effectively freeze its evolution — each measurement collapses the state back toward what it already was, before it has a chance to evolve away. Named after Zeno's paradox of the arrow that never seems to move, it's a direct consequence of wavefunction collapse: a "watched" quantum state changes far more slowly than an unwatched one.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.hilbertSpaceTitle">
                Hilbert Space
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.hilbertSpaceBody">
              The mathematical "space" where every quantum state lives. Each possible quantum state is represented as a vector in a Hilbert space, and the rules of quantum mechanics — superposition, measurement, and evolution — are all expressed as operations on these vectors. A single qubit lives in a two-dimensional Hilbert space, while an n-qubit system lives in a 2ⁿ-dimensional one.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.linearOperatorsTitle">
                Linear Operators
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.linearOperatorsBody">
              Physical quantities and quantum gates are represented by linear operators acting on quantum states. Applying an operator transforms one valid quantum state into another, making linear algebra the language of quantum mechanics.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.observableTitle">
                Observable
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.observableBody">
              An observable is any measurable physical property — such as position, momentum, spin, or energy. Every observable is represented by a Hermitian operator whose eigenvalues are the only measurement outcomes that can ever occur.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.eigenstatesTitle">
                Eigenstates & Eigenvalues
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.eigenstatesBody">
              If measuring an observable always produces the same result for a particular quantum state, that state is an eigenstate of the observable. The measurement result is the corresponding eigenvalue. Measuring an eigenstate leaves it unchanged, whereas measuring a superposition generally causes wavefunction collapse.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.expectationValueTitle">
                Expectation Value
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.expectationValueBody">
              Rather than predicting one definite measurement result, quantum mechanics predicts the average value obtained after repeating the same experiment many times on identically prepared systems. This average is called the expectation value.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.probabilityAmplitudesTitle">
                Probability Amplitudes
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.probabilityAmplitudesBody">
              Unlike ordinary probabilities, quantum mechanics assigns complex probability amplitudes to possible outcomes. These amplitudes can interfere constructively or destructively, and only their squared magnitudes become observable probabilities through the Born Rule.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.phaseTitle">
                Phase
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.phaseBody">
              A quantum state's phase is invisible in a single measurement but determines how amplitudes interfere. Relative phase — not absolute phase — is what gives quantum interference and many quantum algorithms their power.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.globalPhaseTitle">
                Global Phase vs Relative Phase
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.globalPhaseBody">
              Multiplying an entire quantum state by the same complex phase changes nothing physically; this is called a global phase. Changing the phase between components of a superposition changes observable interference patterns and therefore has physical consequences.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.spinTitle">
                Spin
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.spinBody">
              Spin is an intrinsic form of angular momentum carried by quantum particles. Unlike ordinary rotation, spin is a fundamental quantum property that comes only in discrete values. Electron spin is the physical realization of many experimental qubits.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.pauliExclusionTitle">
                Pauli Exclusion Principle
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.pauliExclusionBody">
              No two identical fermions can occupy the same quantum state simultaneously. This simple rule explains the structure of atoms, chemistry, and why matter remains stable.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.identicalParticlesTitle">
                Identical Particles
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.identicalParticlesBody">
              Particles of the same type are fundamentally indistinguishable. Swapping two identical particles does not create a new physical state — it only changes the wavefunction by a sign (fermions) or not at all (bosons).
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.bosonsFermionsTitle">
                Bosons & Fermions
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.bosonsFermionsBody">
              Bosons can share the same quantum state, allowing phenomena like lasers and Bose–Einstein condensates. Fermions obey the Pauli exclusion principle, giving rise to atomic structure and electronic materials.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.densityMatrixTitle">
                Density Matrix
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.densityMatrixBody">
              Not every quantum system is perfectly isolated. A density matrix describes both pure quantum states and statistical mixtures, making it the standard tool for describing noisy or partially known quantum systems.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.mixedStatesTitle">
                Mixed States
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.mixedStatesBody">
              Unlike a superposition, which is genuinely quantum, a mixed state represents classical uncertainty about which quantum state a system is actually in. Density matrices distinguish between these two very different situations.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.measurementBasisTitle">
                Measurement Basis
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.measurementBasisBody">
              A quantum measurement is always made relative to a chosen basis. The same state may look definite in one basis but exist as a superposition in another, making basis choice central to quantum computing.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.sternGerlachExpTitle">
                Stern–Gerlach Experiment
              </b>
            </div>
            <div className="bit-explainer" data-i18n="concepts.sternGerlachExpBody" data-i18n-html="">
              The Stern–Gerlach experiment (1922), performed by Otto Stern and Walther Gerlach, demonstrated that angular momentum is quantized — showing that particles such as electrons possess an intrinsic property called spin that can only take discrete values when measured along a chosen axis. It's one of the foundational experiments of quantum mechanics.{' '}
              <ul className="quantum-list">
                <li>
                  <b>
                    Objective:
                  </b>
                  {' '}to determine whether an atom's magnetic moment could point in any direction, as classical physics predicted, or only in specific, quantized orientations.
                </li>
                <li>
                  <b>
                    Why silver atoms?
                  </b>
                  {' '}Silver has a single unpaired outer electron and effectively zero net orbital angular momentum, so the measured magnetic moment comes almost entirely from that one electron's spin — making the result far easier to interpret.
                </li>
                <li>
                  <b>
                    Classical prediction:
                  </b>
                  {' '}a randomly-oriented magnetic moment should deflect by any amount, smearing the beam into a continuous band on the screen.
                </li>
                <li>
                  <b>
                    What was actually observed:
                  </b>
                  {' '}the beam split into exactly two distinct spots, not a continuous band — showing only two spin orientations are possible along the measurement axis, spin up (+ħ/2) and spin down (−ħ/2).
                </li>
              </ul>
              {' '}Explore this yourself, including what happens when you measure spin along a second, incompatible axis, on the Stern–Gerlach tab.
            </div>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.eprParadoxTitle">
                EPR Paradox
              </b>
            </div>
            <div className="bit-explainer" data-i18n="concepts.eprParadoxBody" data-i18n-html="">
              The EPR paradox (1935), proposed by Albert Einstein, Boris Podolsky, and Nathan Rosen, is a thought experiment arguing that quantum mechanics, as it stood, must be an incomplete description of physical reality — not because its predictions were wrong, but because of what those predictions seemed to imply.{' '}
              <ul className="quantum-list">
                <li>
                  <b>
                    Objective:
                  </b>
                  {' '}to show that if quantum mechanics is correct and "local realism" holds — that a particle has definite properties independent of measurement, and no influence travels faster than light — then quantum mechanics must be missing something.
                </li>
                <li>
                  <b>
                    The setup:
                  </b>
                  {' '}two particles are prepared in an entangled state and separated by an arbitrarily large distance. Measuring a property of one instantly tells you the corresponding property of the other, with certainty.
                </li>
                <li>
                  <b>
                    The argument:
                  </b>
                  {' '}since measuring particle A lets you predict particle B's outcome with certainty without ever touching B, EPR reasoned that property of B must already have been fixed before the measurement — otherwise measuring A would have to instantly affect B, which looked like "spooky action at a distance."
                </li>
                <li>
                  <b>
                    The paradox:
                  </b>
                  {' '}quantum mechanics says the two particles share one undetermined joint state right up until measurement. EPR's own reasoning said that's impossible if locality holds — so either quantum mechanics is incomplete, or nature really is nonlocal in this specific sense.
                </li>
              </ul>
              {' '}For thirty years this stayed a question of interpretation with no experimental answer — until Bell's Theorem (see above) turned it into a testable one, and the experiments came down decisively against Einstein's hidden-variable intuition.
            </div>
          </div>
        </div>
        <div className="section-label" style={{marginTop: "22px"}} data-i18n="concepts.computingGroupTitle">
          Quantum Computing Concepts
        </div>
        <div className="intro-glossary-grid">
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.qubitTitle">
                Qubit
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.qubitBody">
              The basic unit of quantum information — like a classical bit, but able to exist in a superposition of 0 and 1 rather than being locked to one value. A qubit's exact state is described by two complex amplitudes and visualized as a point on the Bloch sphere, explored on the Bits & Qubits tab.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.blochSphereTitle">
                Bloch Sphere
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.blochSphereBody">
              A geometric picture of every possible single-qubit state as a point on the surface of a sphere — the north and south poles are |0⟩ and |1⟩, and every other point is some superposition of the two. It turns the abstract algebra of amplitudes into something you can literally see and drag around.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.gateTitle">
                Quantum Gate
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.gateBody">
              The quantum equivalent of a classical logic gate — an operation that transforms a qubit's state, geometrically a rotation of its point on the Bloch sphere. Unlike classical gates, every quantum gate is reversible: none of them ever throw information away. See the Gates tab for the six fixed gates (H, X, Y, Z, S, T) and their effects.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.unitarityTitle">
                Unitarity & Reversibility
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.unitarityBody">
              Every valid quantum gate must be a unitary matrix (U†U = I) — the mathematical condition that guarantees it preserves total probability and can always be undone by its own conjugate transpose. This is why quantum computation, unlike classical AND/OR logic, never destroys information along the way.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.circuitTitle">
                Quantum Circuit
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.circuitBody">
              A sequence of quantum gates applied to one or more qubits, read left to right — the quantum equivalent of a classical logic circuit. Because gate order generally matters (rotations don't commute), the same set of gates in a different sequence can land the qubits in an entirely different final state; build one yourself on the Circuits tab.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.bellGhzTitle">
                Bell States & GHZ States
              </b>
            </div>
            <div className="bit-explainer" data-i18n="concepts.bellGhzBody" data-i18n-html="">
              Bell states are the four specific, maximally entangled two-qubit states — Φ⁺, Φ⁻, Ψ⁺, and Ψ⁻ — forming a foundational orthonormal basis in quantum information and the core resource behind protocols like quantum teleportation and superdense coding. All four are produced by the same two-gate recipe (a Hadamard on one qubit, then a CNOT controlled by it), just starting from a different one of the four two-qubit basis states.{' '}
              <br />
              <br />
              The four Bell states are:{' '}
              <ul className="quantum-list">
                <li>
                  <b>
                    Φ⁺ = (|00⟩ + |11⟩)/√2
                  </b>
                  {' '}— qubits match and stay in phase.
                </li>
                <li>
                  <b>
                    Φ⁻ = (|00⟩ − |11⟩)/√2
                  </b>
                  {' '}— qubits match, with a phase flip.
                </li>
                <li>
                  <b>
                    Ψ⁺ = (|01⟩ + |10⟩)/√2
                  </b>
                  {' '}— qubits are opposite and in phase.
                </li>
                <li>
                  <b>
                    Ψ⁻ = (|01⟩ − |10⟩)/√2
                  </b>
                  {' '}— qubits are opposite, with a phase flip.
                </li>
              </ul>
              {' '}Measuring one qubit in any of the four instantly determines the other's outcome. GHZ states generalize the same idea to three or more qubits, all correlated together — build Bell pairs and GHZ triples from scratch with Hadamard and CNOT gates on the Circuits tab.
            </div>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.noCloningTitle">
                No-Cloning Theorem
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.noCloningBody">
              It's physically impossible to create an exact, independent copy of an arbitrary unknown quantum state — a direct consequence of quantum mechanics being linear. This is why quantum information has to be handled so differently from classical bits, which can always be freely copied.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.algorithmsTitle">
                Quantum Algorithms
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.algorithmsBody">
              Step-by-step procedures built from quantum gates that exploit superposition and interference to solve certain problems dramatically faster than any known classical algorithm — Shor's algorithm factors large numbers efficiently, and Grover's algorithm searches an unsorted list quadratically faster than any classical search.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.errorCorrectionTitle">
                Quantum Error Correction
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.errorCorrectionBody">
              A set of techniques for protecting fragile quantum information from decoherence and noise by spreading a single logical qubit's state redundantly across many physical qubits, without ever directly measuring — and so collapsing — the information itself. One of the central engineering challenges standing between today's noisy quantum computers and large-scale, reliable ones.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.supremacyTitle">
                Quantum Supremacy / Advantage
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.supremacyBody">
              The milestone at which a quantum computer performs a specific task faster than any classical supercomputer could feasibly manage — "supremacy" for a (possibly contrived) benchmark task, "advantage" for a practically useful one. It demonstrates that quantum effects can be harnessed for real computational power, not just simulated on a classical machine.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.teleportationTitle">
                Quantum Teleportation
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.teleportationBody">
              A protocol for transferring an unknown qubit's exact state to a distant qubit, using a shared entangled pair plus two classical bits of communication — without ever measuring (and so destroying) the original state directly. Despite the name, nothing travels faster than light: the receiver can't reconstruct the state until the ordinary classical bits arrive, and the original qubit's state is unavoidably destroyed in the process, consistent with the No-Cloning Theorem.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.qkdTitle">
                Quantum Cryptography (QKD)
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.qkdBody">
              Quantum key distribution lets two parties agree on a shared secret key with security guaranteed by physics rather than computational difficulty — protocols like BB84 encode key bits in qubit states such that any eavesdropper's measurement unavoidably disturbs them, exposing the intrusion. It's a direct practical payoff of the No-Cloning Theorem: an eavesdropper can't secretly copy the qubits to inspect them undetected.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.qftTitle">
                Quantum Fourier Transform (QFT)
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.qftBody">
              The quantum analog of the classical discrete Fourier transform, implemented as a quantum circuit that runs exponentially faster than any classical equivalent. It's the key subroutine inside Shor's algorithm — the step that extracts the hidden periodicity used to factor large numbers — and appears throughout quantum algorithms wherever a hidden pattern needs to be read out of a superposition.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.tensorProductTitle">
                Tensor Product
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.tensorProductBody">
              Multiple qubits combine through the tensor product rather than ordinary addition. Two qubits therefore require four amplitudes, three qubits require eight, and n qubits require 2ⁿ, which is the origin of quantum computing's enormous state space.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.multiQubitStatesTitle">
                Multi-Qubit States
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.multiQubitStatesBody">
              A system of several qubits cannot always be described as independent single-qubit states. Some states factor into separate qubits, while others become entangled and require one combined description.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.controlledGatesTitle">
                Controlled Gates
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.controlledGatesBody">
              Controlled gates perform an operation only when another qubit has a particular value. The CNOT gate is the simplest example and is the essential building block for creating entanglement.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.swapGateTitle">
                SWAP Gate
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.swapGateBody">
              The SWAP gate exchanges the quantum states of two qubits without measuring them. It is widely used to move information around a quantum processor.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.universalGateSetsTitle">
                Universal Gate Sets
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.universalGateSetsBody">
              A small collection of gates is sufficient to approximate any quantum computation to arbitrary accuracy. Examples include {'{'}H, T, CNOT{'}'} and {'{'}Rx, Ry, CNOT{'}'}.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.quantumParallelismTitle">
                Quantum Parallelism
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.quantumParallelismBody">
              Because a quantum computer can prepare a superposition of many inputs simultaneously, one operation acts on all of them at once. The challenge is extracting useful information through interference rather than trying to read every result.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.oracleTitle">
                Oracle
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.oracleBody">
              Many quantum algorithms treat part of a problem as a black-box function called an oracle. The algorithm gains speed by querying the oracle in quantum superposition.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.ancillaQubitsTitle">
                Ancilla Qubits
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.ancillaQubitsBody">
              Ancilla qubits are temporary helper qubits used during computations, error correction, and arithmetic before being reset or discarded.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.quantumMeasurementTitle">
                Quantum Measurement
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.quantumMeasurementBody">
              Although measurement appears earlier, quantum computing treats it operationally. Measuring a qubit converts fragile quantum information into an ordinary classical bit, ending coherent evolution.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.midCircuitMeasurementTitle">
                Mid-Circuit Measurement
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.midCircuitMeasurementBody">
              Some quantum computers allow measurements during computation rather than only at the end. Later gates can depend on these measurement outcomes, enabling error correction and adaptive algorithms.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.classicalFeedforwardTitle">
                Classical Feedforward
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.classicalFeedforwardBody">
              Measurement results obtained during a quantum circuit can determine which later gates should be applied, combining classical control with quantum evolution.
            </p>
          </div>
        </div>
        <div className="section-label" style={{marginTop: "22px"}} data-i18n="concepts.quantumInfoGroupTitle">
          Quantum Information Theory
        </div>
        <div className="intro-glossary-grid">
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.quantumInformationTitle">
                Quantum Information
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.quantumInformationBody">
              Quantum information is information stored in quantum states. Unlike classical information, it can exploit superposition and entanglement, enabling entirely new forms of computation and communication.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.quantumChannelTitle">
                Quantum Channel
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.quantumChannelBody">
              A quantum channel mathematically describes how quantum information changes while traveling through space or interacting with noise.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.fidelityTitle">
                Fidelity
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.fidelityBody">
              Fidelity measures how similar two quantum states are. It is widely used to benchmark quantum hardware, gates, and error correction.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.traceDistanceTitle">
                Trace Distance
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.traceDistanceBody">
              Trace distance quantifies how distinguishable two quantum states are. It gives the maximum probability of telling them apart using any possible measurement.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.entanglementEntropyTitle">
                Entanglement Entropy
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.entanglementEntropyBody">
              A numerical measure of how strongly different parts of a quantum system are entangled. It plays a central role in condensed matter physics, quantum field theory, and quantum gravity.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.stateTomographyTitle">
                Quantum State Tomography
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.stateTomographyBody">
              A technique for reconstructing an unknown quantum state by making many measurements in different bases.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.processTomographyTitle">
                Process Tomography
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.processTomographyBody">
              Rather than reconstructing a state, process tomography reconstructs an unknown quantum gate or operation by studying how it transforms many known input states.
            </p>
          </div>
        </div>
        <div className="section-label" style={{marginTop: "22px"}} data-i18n="concepts.advancedGroupTitle">
          Advanced Quantum Computing
        </div>
        <div className="intro-glossary-grid">
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.vqeQaoaTitle">
                Variational Quantum Algorithms (VQE & QAOA)
              </b>
            </div>
            <div className="bit-explainer" data-i18n="concepts.vqeQaoaBody" data-i18n-html="">
              Variational quantum algorithms are hybrid quantum–classical algorithms in which a quantum computer prepares parameterized quantum states while a classical computer repeatedly adjusts those parameters to optimize a desired objective. This iterative feedback loop makes them well suited to today's noisy quantum hardware (NISQ devices).{' '}
              <br />
              <br />
              The two best-known examples are:{' '}
              <ul className="quantum-list">
                <li>
                  <b>
                    Variational Quantum Eigensolver (VQE):
                  </b>
                  {' '}Designed to estimate the lowest-energy (ground) state of a quantum system. It is widely used in quantum chemistry, materials science, and Hamiltonian simulation to study molecules and quantum materials.
                </li>
                <li>
                  <b>
                    Quantum Approximate Optimization Algorithm (QAOA):
                  </b>
                  {' '}Designed to find high-quality approximate solutions to difficult combinatorial optimization problems, such as routing, scheduling, graph partitioning, and portfolio optimization, by alternating between problem-specific and mixing quantum operations.
                </li>
              </ul>
              {' '}VQE and QAOA are among the most promising quantum algorithms for today's noisy intermediate-scale quantum (NISQ) computers because they reduce the depth of quantum circuits while leveraging classical optimization.
            </div>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.nisqTitle">
                NISQ Computing
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.nisqBody">
              The current era of quantum computers is called the Noisy Intermediate-Scale Quantum (NISQ) era: devices contain tens to thousands of imperfect qubits but cannot yet run fully fault-tolerant algorithms.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.faultTolerantTitle">
                Fault-Tolerant Quantum Computing
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.faultTolerantBody">
              A future generation of quantum computers capable of performing arbitrarily long computations despite hardware errors through quantum error correction.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.surfaceCodeTitle">
                Surface Code
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.surfaceCodeBody">
              The leading quantum error-correcting code, encoding one logical qubit into many physical qubits arranged on a two-dimensional lattice.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.logicalPhysicalQubitsTitle">
                Logical vs Physical Qubits
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.logicalPhysicalQubitsBody">
              Physical qubits are the hardware qubits that suffer from noise. Logical qubits are protected, error-corrected qubits encoded across many physical ones.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.magicStatesTitle">
                Magic States
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.magicStatesBody">
              Certain quantum gates cannot be implemented directly in many fault-tolerant architectures. Instead, specially prepared "magic states" are consumed to perform them, making magic-state distillation one of the largest costs in scalable quantum computing.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.hamiltonianSimulationTitle">
                Hamiltonian Simulation
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.hamiltonianSimulationBody">
              One of quantum computing's original motivations: efficiently simulating the dynamics of molecules, materials, and quantum field theories governed by a Hamiltonian. Many researchers — including those working on lattice field theories and quantum chemistry — consider this one of the most important long-term applications of quantum computers.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.qpeTitle">
                Quantum Phase Estimation (QPE)
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.qpeBody">
              A foundational quantum algorithm for estimating the eigenvalues of unitary operators. It underpins Shor's algorithm and many algorithms for quantum chemistry and Hamiltonian simulation.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.adiabaticQCTitle">
                Adiabatic Quantum Computing
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.adiabaticQCBody">
              A computational model in which the system remains in its ground state while its Hamiltonian changes slowly. If the evolution is slow enough, the final ground state encodes the solution to an optimization problem.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <b data-i18n="concepts.mbqcTitle">
                Measurement-Based Quantum Computing
              </b>
            </div>
            <p className="bit-explainer" data-i18n="concepts.mbqcBody">
              Instead of computing primarily with gates, computation proceeds by preparing a large entangled resource state (a cluster state) and then performing carefully chosen measurements. The measurements themselves drive the computation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
