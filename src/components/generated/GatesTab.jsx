// Generated from the original index.html markup; edit freely.
export default function GatesTab() {
  return (
    <section id="tab-gates" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="gates.title">
          Gates
        </h1>
        <p className="compare-subtitle" data-i18n="gates.subtitle">
          Pick one gate and see its immediate effect — classical or quantum
        </p>
      </div>
      <div className="mode-grid" style={{gridTemplateColumns: "1fr 1fr 1fr", maxWidth: "460px", margin: "0 auto 18px"}}>
        <button className="preset-btn mode-btn" data-gates-domain="classical" data-i18n="gates.classicalGates">
          Classical Gates
        </button>
        <button className="preset-btn mode-btn active" data-gates-domain="quantum" data-i18n="gates.quantumGates">
          Quantum Gates
        </button>
        <button className="preset-btn mode-btn" data-gates-domain="compare" data-i18n="gates.compareGates">
          Compare
        </button>
      </div>
      <div id="gates-classical-panel" style={{display: "none"}}>
        <div className="layout-two gates-layout">
          <div className="circuit-left" style={{maxWidth: "320px"}}>
            <div className="section-label" data-i18n="gates.pickGate">
              Gate — click to choose
            </div>
            <div className="circuit-palette" id="gc-gate-palette" />
            <div className="switch-area" style={{marginTop: "16px"}}>
              <span className="bit-label" id="gc-lbl-a0">
                0
              </span>
              <label className="toggle-switch">
                <input type="checkbox" id="gc-input-a" defaultChecked />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </label>
              <span className="bit-label active" id="gc-lbl-a1">
                1
              </span>
              <span className="muted-text" style={{marginLeft: "10px"}} data-i18n="gates.inputA">
                Input A
              </span>
            </div>
            <div className="switch-area" id="gc-input-b-wrap">
              <span className="bit-label" id="gc-lbl-b0">
                0
              </span>
              <label className="toggle-switch">
                <input type="checkbox" id="gc-input-b" defaultChecked />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </label>
              <span className="bit-label active" id="gc-lbl-b1">
                1
              </span>
              <span className="muted-text" style={{marginLeft: "10px"}} data-i18n="gates.inputB">
                Input B
              </span>
            </div>
          </div>
          <div className="right-panel">
            <div className="card">
              <div className="card-title" data-i18n="common.output">
                Output
              </div>
              <div className="classical-display-wrap">
                <div className="classical-display" id="gc-output-display">
                  1
                </div>
                <div className="classical-label" id="gc-output-label">
                  A AND B
                </div>
              </div>
            </div>
            <div className="card explainer-card">
              <div className="card-title" data-i18n="common.whatJustHappened">
                What just happened
              </div>
              <p className="bit-explainer" id="gc-explainer">
                AND only outputs 1 when every input is 1.
              </p>
            </div>
            <div className="card">
              <div className="card-title" data-i18n="common.truthTable">
                Truth Table
              </div>
              <table className="truth-table" id="gc-truth-table" />
            </div>
          </div>
        </div>
      </div>
      <div id="gates-quantum-panel">
        <div className="layout-two gates-layout">
          <div className="gates-left-panel">
            <div className="bloch-wrap">
              <canvas id="bloch-gates" width="360" height="360" role="img" aria-label="Bloch sphere. State: |ψ⟩ = |0⟩." />
              <div className="state-label" id="label-gates">
                |0⟩
              </div>
            </div>
            <div className="card explainer-card">
              <div className="card-title" data-i18n="common.whatJustHappened">
                What just happened
              </div>
              <p className="bit-explainer" id="gate-explainer">
                Nothing yet — the qubit is parked at |0⟩, pointing straight up. Pick a gate on the left and watch where it sends the arrow.
              </p>
            </div>
            <div className="card">
              <div className="card-title" data-i18n="common.appliedSequence">
                Applied Sequence
              </div>
              <div className="history-row" id="gate-history" />
              <div style={{marginTop: "10px"}}>
                <button className="btn-secondary" id="btn-reset-gates" data-i18n="gates.resetToZero">
                  Reset to |0⟩
                </button>
              </div>
            </div>
          </div>
          <div className="right-panel">
            <div className="card">
              <div className="card-title" data-i18n="gates.applyGate">
                Apply Gate
              </div>
              <div className="gate-grid" id="gate-grid" />
              <button className="btn-secondary" id="btn-gates-tryme" style={{marginTop: "10px"}} data-i18n="common.tryMe">
                Try me
              </button>
            </div>
            <div className="card">
              <div className="card-title" data-i18n="gates.gateReference">
                Gate Reference
              </div>
              <div className="gate-reference-list" id="gate-reference-list" />
            </div>
            <div className="card">
              <div className="card-title" data-i18n="gates.rotationGates">
                Rotation Gates
              </div>
              <div className="slider-group">
                <div className="slider-row">
                  <span className="slider-sym">
                    θ
                  </span>
                  <input type="range" id="rotation-angle" min="0" max="360" defaultValue="90" />
                  <span className="slider-val" id="rotation-angle-val">
                    90°
                  </span>
                </div>
              </div>
              <div className="gate-grid" id="rotation-gate-grid" style={{marginTop: "10px"}} />
            </div>
            <div className="card">
              <div className="card-title" data-i18n="gates.gateMatrix">
                Gate Matrix
              </div>
              <div className="matrix-display" id="matrix-display">
                <span className="muted-text" data-i18n="gates.selectAGate">
                  ← select a gate
                </span>
              </div>
            </div>
            <div className="card">
              <div className="card-title" data-i18n="common.truthTable">
                Truth Table
              </div>
              <p className="bit-explainer" data-i18n="gates.quantumTruthTableNote">
                Each fixed gate's action on the two basis states — rotation gates (Rx/Ry/Rz) aren't included since their output depends on a runtime angle, not a fixed table.
              </p>
              <table className="truth-table" id="gates-truth-table" style={{marginTop: "8px"}} />
            </div>
            <div className="card">
              <div className="card-title" data-i18n="gates.whyReversibleTitle">
                Why Every Gate Is Reversible
              </div>
              <p className="bit-explainer" data-i18n="gates.whyReversibleBody">
                Every gate on the left is a unitary matrix (U†U = I) — not by convention, but because a gate is really just the qubit's own Schrödinger-equation time evolution, which always preserves total probability. One direct consequence: quantum gates never destroy information. Apply any gate, then its conjugate transpose, and the qubit lands back exactly where it started — there's no quantum equivalent of a classical AND gate quietly throwing a bit away.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div id="gates-compare-panel" style={{display: "none"}}>
        <div className="compare-layout" style={{gridTemplateColumns: "1fr 40px 1fr", maxWidth: "1080px"}}>
          <div className="compare-col classical-col">
            <div className="col-label">
              <span className="col-badge" data-i18n="common.classical">
                Classical
              </span>
              <span className="col-desc" data-i18n="gates.compareClassicalDesc">
                NOT/AND/OR/XOR and their negations — strict, destructive rules
              </span>
            </div>
            <table className="truth-table" id="gates-compare-classical-table" />
          </div>
          <div className="compare-divider">
            <div className="divider-line" />
            <div className="divider-vs">
              vs
            </div>
            <div className="divider-line" />
          </div>
          <div className="compare-col quantum-col">
            <div className="col-label">
              <span className="col-badge quantum-badge" data-i18n="common.quantum">
                Quantum
              </span>
              <span className="col-desc" data-i18n="gates.compareQuantumDesc">
                H/X/Y/Z/S/T — always reversible, can create superposition
              </span>
            </div>
            <table className="truth-table" id="gates-compare-quantum-table" />
          </div>
        </div>
        <div className="card mt-14" style={{maxWidth: "1080px", marginLeft: "auto", marginRight: "auto"}}>
          <div className="card-title" data-i18n="gates.compareInsightTitle">
            The Key Difference
          </div>
          <p className="bit-explainer" data-i18n="gates.compareInsightBody">
            Every classical row above collapses information — AND, OR, and friends all map multiple input combinations onto the same output, so there's no way back to the input from the output alone. Every quantum row is reversible: each is a unitary matrix, so running its own conjugate transpose afterward always recovers the exact input. Classical gates can also only ever output a definite 0 or 1; quantum gates like H can output a genuine superposition of both.
          </p>
        </div>
      </div>
      <div className="lesson-embed" id="lesson-embed-gates" />
    </section>
  );
}
