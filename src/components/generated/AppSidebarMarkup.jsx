// Generated from the original index.html markup; edit freely.
export default function AppSidebarMarkup() {
  return (
    <aside id="tab-sidebar" style={{display: "none"}} aria-label="Simulation tabs">
      <button className="tab" data-tab="introduction">
        <span className="tab-badge">
          1
        </span>
        <span className="tab-label" data-i18n="nav.introduction">
          Introduction
        </span>
      </button>
      <button className="tab" data-tab="important-concepts">
        <span className="tab-badge">
          ✦
        </span>
        <span className="tab-label" data-i18n="nav.importantConcepts">
          Important Concepts
        </span>
      </button>
      <div className="tab-group open">
        <button className="tab active" data-tab="qubit">
          <span className="tab-badge">
            Q
          </span>
          <span className="tab-label" data-i18n="nav.bitsQubits">
            Bits & Qubits
          </span>
          <span className="tab-chevron">
            ▸
          </span>
        </button>
        <div className="tab-subnav">
          <button className="tab-sub" data-tab="qubit" data-qubit-mode="classical" data-i18n="qubitTab.classical">
            Classical
          </button>
          <button className="tab-sub" data-tab="qubit" data-qubit-mode="quantum" data-qubit-submode="1q" data-i18n="qubitTab.oneQubit">
            One Qubit
          </button>
          <button className="tab-sub" data-tab="qubit" data-qubit-mode="quantum" data-qubit-submode="2q" data-i18n="qubitTab.twoQubit">
            Two Qubit
          </button>
          <button className="tab-sub" data-tab="qubit" data-qubit-mode="quantum" data-qubit-submode="3q" data-i18n="qubitTab.threeQubit">
            Three Qubit
          </button>
        </div>
      </div>
      <div className="tab-group">
        <button className="tab" data-tab="mathsconcept">
          <span className="tab-badge">
            ∑
          </span>
          <span className="tab-label" data-i18n="nav.mathsConcept">
            Maths Concept
          </span>
          <span className="tab-chevron">
            ▸
          </span>
        </button>
        <div className="tab-subnav">
          <button className="tab-sub" data-tab="mathsconcept" data-maths-section="complex" data-i18n="mathsTab.complexNumbers">
            Complex Numbers
          </button>
          <button className="tab-sub" data-tab="mathsconcept" data-maths-section="vectors" data-i18n="mathsTab.vectors">
            Vectors
          </button>
          <button className="tab-sub" data-tab="mathsconcept" data-maths-section="matrices" data-i18n="mathsTab.matrices">
            Matrices
          </button>
          <button className="tab-sub" data-tab="mathsconcept" data-maths-section="statevector" data-i18n="mathsTab.stateVector">
            State Vector
          </button>
          <button className="tab-sub" data-tab="mathsconcept" data-maths-section="dirac" data-i18n="mathsTab.diracNotation">
            Dirac Notation
          </button>
          <button className="tab-sub" data-tab="mathsconcept" data-maths-section="tensor" data-i18n="mathsTab.tensorProducts">
            Tensor Products
          </button>
        </div>
      </div>
      <div className="tab-group">
        <button className="tab" data-tab="gates">
          <span className="tab-badge">
            G
          </span>
          <span className="tab-label" data-i18n="nav.gates">
            Gates
          </span>
          <span className="tab-chevron">
            ▸
          </span>
        </button>
        <div className="tab-subnav">
          <button className="tab-sub" data-tab="gates" data-gates-domain="classical" data-i18n="gatesTab.classical">
            Classical
          </button>
          <button className="tab-sub" data-tab="gates" data-gates-domain="quantum" data-i18n="gatesTab.quantum">
            Quantum
          </button>
          <button className="tab-sub" data-tab="gates" data-gates-domain="compare" data-i18n="gatesTab.compare">
            Compare
          </button>
        </div>
      </div>
      <button className="tab" data-tab="circuit">
        <span className="tab-badge">
          C
        </span>
        <span className="tab-label" data-i18n="nav.circuits">
          Circuits
        </span>
      </button>
      <button className="tab" data-tab="measure">
        <span className="tab-badge">
          M
        </span>
        <span className="tab-label" data-i18n="nav.measure">
          Measure
        </span>
      </button>
      <button className="tab" data-tab="entangle">
        <span className="tab-badge">
          E
        </span>
        <span className="tab-label" data-i18n="nav.entangle">
          Entangle
        </span>
      </button>
      <button className="tab" data-tab="bellstates">
        <span className="tab-badge">
          β
        </span>
        <span className="tab-label" data-i18n="nav.bellStates">
          Bell States
        </span>
      </button>
      <button className="tab" data-tab="tunnel">
        <span className="tab-badge">
          T
        </span>
        <span className="tab-label" data-i18n="nav.tunnel">
          Tunnel
        </span>
      </button>
      <button className="tab" data-tab="interference">
        <span className="tab-badge">
          I
        </span>
        <span className="tab-label" data-i18n="nav.interference">
          Interference
        </span>
      </button>
      <button className="tab" data-tab="beamsplitter">
        <span className="tab-badge">
          B
        </span>
        <span className="tab-label" data-i18n="nav.beamSplitter">
          Beam Splitter
        </span>
      </button>
      <button className="tab" data-tab="sterngerlach">
        <span className="tab-badge">
          S
        </span>
        <span className="tab-label" data-i18n="nav.sternGerlach">
          Stern–Gerlach
        </span>
      </button>
      <button className="tab" data-tab="teleport">
        <span className="tab-badge">
          τ
        </span>
        <span className="tab-label" data-i18n="nav.teleport">
          Teleport
        </span>
      </button>
      <button className="tab" data-tab="superdense">
        <span className="tab-badge">
          D
        </span>
        <span className="tab-label" data-i18n="nav.superdense">
          Superdense Coding
        </span>
      </button>
      <button className="tab" data-tab="noise">
        <span className="tab-badge">
          N
        </span>
        <span className="tab-label" data-i18n="nav.noise">
          Noise
        </span>
      </button>
      <button className="tab" data-tab="grover">
        <span className="tab-badge">
          🔍
        </span>
        <span className="tab-label" data-i18n="nav.grover">
          Grover's Search
        </span>
      </button>
    </aside>
  );
}
