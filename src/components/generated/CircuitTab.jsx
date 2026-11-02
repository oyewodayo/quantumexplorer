// Generated from the original index.html markup; edit freely.
export default function CircuitTab() {
  return (
    <section id="tab-circuit" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="circuits.title">
          Circuits
        </h1>
        <p className="compare-subtitle" data-i18n="circuits.subtitle">
          Classical gates combine bits with strict rules; quantum circuits walk a qubit through a route of gates, picking up rotations — pick a builder below
        </p>
      </div>
      <div className="circuit-layout">
        <div className="mode-grid" style={{gridTemplateColumns: "1fr 1fr 1fr", maxWidth: "480px", margin: "0 auto 18px"}}>
          <button className="preset-btn mode-btn" data-circuit-domain="classical" data-i18n="circuits.classicalCircuit">
            Classical Circuit
          </button>
          <button className="preset-btn mode-btn active" data-circuit-domain="quantum" data-i18n="circuits.quantumCircuit">
            Quantum Circuit
          </button>
          <button className="preset-btn mode-btn" data-circuit-domain="compare" data-i18n="circuits.compareHalfAdder">
            Compare
          </button>
        </div>
        <div id="circuit-classical-panel" style={{display: "none"}}>
          <div className="circuit-top">
            <div className="circuit-left">
              <div className="section-label" data-i18n="circuits.gatePaletteDrag">
                Gate Palette — drag onto the circuit (or click, then click the circuit)
              </div>
              <div className="circuit-palette" id="classical-gate-palette" />
              <div className="switch-area mt-14">
                <span className="bit-label" id="ha-lbl-a0">
                  0
                </span>
                <label className="toggle-switch">
                  <input type="checkbox" id="ha-input-a" />
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </label>
                <span className="bit-label" id="ha-lbl-a1">
                  1
                </span>
                <span className="muted-text" style={{marginLeft: "10px"}} data-i18n="gates.inputA">
                  Input A
                </span>
              </div>
              <div className="switch-area">
                <span className="bit-label" id="ha-lbl-b0">
                  0
                </span>
                <label className="toggle-switch">
                  <input type="checkbox" id="ha-input-b" />
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </label>
                <span className="bit-label" id="ha-lbl-b1">
                  1
                </span>
                <span className="muted-text" style={{marginLeft: "10px"}} data-i18n="gates.inputB">
                  Input B
                </span>
              </div>
              <div className="circuit-actions">
                <button className="btn-secondary" id="btn-clear-halfadder" data-i18n="common.clear">
                  Clear
                </button>
                <span className="muted-text" id="halfadder-status" />
              </div>
              <div className="card explainer-card mt-14">
                <div className="card-title" data-i18n="circuits.whatsGoingOn">
                  What's going on
                </div>
                <p className="bit-explainer" id="halfadder-explainer" />
              </div>
            </div>
            <div className="circuit-right">
              <div className="section-label" data-i18n="circuits.halfAdderCircuit">
                Circuit — drag gates here, A and B wire into every one
              </div>
              <div className="halfadder-circuit-wrap" id="halfadder-circuit-drop" tabIndex="0" role="button" aria-label="Circuit board — drag a gate here, or click a gate then click here, to add it wired to A and B">
                <svg id="halfadder-circuit-svg" viewBox="0 0 260 70" role="img" aria-label="Half adder circuit diagram, currently empty." />
              </div>
              <div className="section-label" style={{marginTop: "18px"}} data-i18n="circuits.truthTableHalfAdder">
                Target Truth Table — A, B → Sum, Carry
              </div>
              <table className="truth-table" id="ha-truth-table" />
            </div>
          </div>
        </div>
        <div id="circuit-quantum-panel">
          <div className="mode-grid" style={{gridTemplateColumns: "1fr 1fr 1fr", maxWidth: "380px", margin: "0 auto 18px"}}>
            <button className="preset-btn mode-btn active" data-circuit-mode="1q" data-i18n="circuits.oneQubit">
              1 Qubit
            </button>
            <button className="preset-btn mode-btn" data-circuit-mode="2q" data-i18n="circuits.twoQubits">
              2 Qubits
            </button>
            <button className="preset-btn mode-btn" data-circuit-mode="3q" data-i18n="circuits.threeQubits">
              3 Qubits
            </button>
          </div>
          <div id="circuit-1q-panel">
            <div className="circuit-top">
              <div className="circuit-left">
                <div className="section-label" data-i18n="circuits.gatePalette">
                  Gate Palette — click to add
                </div>
                <div className="circuit-palette" id="circuit-palette" />
                <div className="try-me-wrap" id="circuit-try-me" style={{marginTop: "10px"}} />
                <div className="section-label" style={{marginTop: "18px"}} data-i18n="circuits.circuitWire">
                  Circuit Wire
                </div>
                <div className="wire-wrap">
                  <div className="wire-ket">
                    |0⟩
                  </div>
                  <div className="wire-track">
                    <div className="wire-line" />
                    <div className="gate-slots" id="gate-slots" />
                  </div>
                </div>
                <div className="circuit-actions">
                  <button className="btn-run" id="btn-run-circuit" data-i18n="common.run">
                    ▶ Run
                  </button>
                  <button className="btn-secondary" id="btn-clear-circuit" data-i18n="common.clear">
                    Clear
                  </button>
                  <button className="btn-secondary" id="btn-share-circuit" data-i18n="common.copyShareableLink">
                    Copy shareable link
                  </button>
                  <span className="muted-text" id="circuit-status" />
                </div>
                <div className="card explainer-card" style={{marginTop: "4px"}}>
                  <div className="card-title" data-i18n="circuits.whatsGoingOn">
                    What's going on
                  </div>
                  <p className="bit-explainer" id="circuit-explainer">
                    Lay down a path by clicking gates above — each one claims the next checkpoint on the wire. Press Run and the qubit walks it from |0⟩ to the end, one stop at a time.
                  </p>
                </div>
                <div className="card" style={{marginTop: "4px"}}>
                  <div className="card-title" data-i18n="circuits.runHistory">
                    Run History — click a step to revisit it
                  </div>
                  <div className="history-row" id="circuit-history">
                    <span className="muted-text">
                      —
                    </span>
                  </div>
                </div>
              </div>
              <div className="circuit-right">
                <div className="section-label" data-i18n="circuits.outputState">
                  Output State
                </div>
                <div className="circuit-output-card">
                  <canvas id="bloch-circuit" width="260" height="260" role="img" aria-label="Bloch sphere showing the circuit's output state. State: |ψ⟩ = |0⟩." />
                  <div className="state-label" id="label-circuit">
                    |0⟩
                  </div>
                  <div className="prob-rows" style={{marginTop: "10px", width: "100%"}}>
                    <div className="prob-row">
                      <span className="ket zero-color">
                        |0⟩
                      </span>
                      <div className="track">
                        <div className="fill zero-fill" id="cfill0" style={{width: "100%"}} />
                      </div>
                      <span className="pct" id="cpct0">
                        100%
                      </span>
                    </div>
                    <div className="prob-row">
                      <span className="ket one-color">
                        |1⟩
                      </span>
                      <div className="track">
                        <div className="fill one-fill" id="cfill1" style={{width: "0%"}} />
                      </div>
                      <span className="pct" id="cpct1">
                        0%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div id="circuit-2q-panel" style={{display: "none"}}>
            <div className="circuit-top">
              <div className="circuit-left">
                <div className="section-label" data-i18n="circuits.targetQubit2">
                  Target Qubit — new gates apply to
                </div>
                <div className="mode-grid" style={{gridTemplateColumns: "1fr 1fr"}}>
                  <button className="preset-btn mode-btn active" data-target-qubit="0">
                    Qubit 0
                  </button>
                  <button className="preset-btn mode-btn" data-target-qubit="1">
                    Qubit 1
                  </button>
                </div>
                <div className="section-label mt-14" data-i18n="circuits.gatePaletteTarget">
                  Gate Palette — click to add to target qubit
                </div>
                <div className="circuit-palette" id="circuit-2q-palette" />
                <div className="circuit-palette" style={{marginTop: "6px"}}>
                  <button className="circuit-gate-btn" id="btn-add-cnot-01" style={{fontSize: "0.72rem", padding: "7px 10px"}}>
                    CNOT Q0→Q1
                  </button>
                  <button className="circuit-gate-btn" id="btn-add-cnot-10" style={{fontSize: "0.72rem", padding: "7px 10px"}}>
                    CNOT Q1→Q0
                  </button>
                </div>
                <div className="try-me-wrap" id="circuit-2q-try-me" style={{marginTop: "10px"}} />
                <div className="section-label" style={{marginTop: "18px"}} data-i18n="circuits.circuitDiagram">
                  Circuit Diagram
                </div>
                <div className="circuit2-diagram-wrap">
                  <div className="circuit2-diagram" id="circuit-2q-diagram" />
                </div>
                <div className="circuit-actions">
                  <button className="btn-run" id="btn-run-circuit-2q" data-i18n="common.run">
                    ▶ Run
                  </button>
                  <button className="btn-secondary" id="btn-clear-circuit-2q" data-i18n="common.clear">
                    Clear
                  </button>
                  <span className="muted-text" id="circuit-2q-status" />
                </div>
                <div className="card explainer-card" style={{marginTop: "4px"}}>
                  <div className="card-title" data-i18n="circuits.whatsGoingOn">
                    What's going on
                  </div>
                  <p className="bit-explainer" id="circuit-2q-explainer">
                    Two qubits, no entanglement yet. Try adding H to Qubit 0, then CNOT Q0→Q1, then press Run — that's the exact recipe behind the Bell state you saw in the Entangle tab, except this time you built it gate by gate.
                  </p>
                </div>
                <div className="card" style={{marginTop: "4px"}}>
                  <div className="card-title" data-i18n="circuits.runHistory">
                    Run History — click a step to revisit it
                  </div>
                  <div className="history-row" id="circuit-2q-history">
                    <span className="muted-text">
                      —
                    </span>
                  </div>
                </div>
              </div>
              <div className="circuit-right">
                <div className="section-label" data-i18n="circuits.outputState2Q">
                  Output State (2 Qubits)
                </div>
                <div className="circuit-output-card">
                  <div className="section-label" style={{marginBottom: "6px"}} data-i18n="circuits.perQubitBlochSpheres">
                    Per-Qubit Bloch Spheres — shrink toward center when entangled
                  </div>
                  <div className="mini-bloch-row">
                    <div className="mini-bloch">
                      <canvas id="bloch-circuit-2q-0" width="118" height="118" role="img" aria-label="Reduced Bloch sphere for Qubit 0. State: |0⟩." />
                      <div className="mini-bloch-label" id="mini-label-2q-0">
                        |0⟩
                      </div>
                    </div>
                    <div className="mini-bloch">
                      <canvas id="bloch-circuit-2q-1" width="118" height="118" role="img" aria-label="Reduced Bloch sphere for Qubit 1. State: |0⟩." />
                      <div className="mini-bloch-label" id="mini-label-2q-1">
                        |0⟩
                      </div>
                    </div>
                  </div>
                  <div className="formula" id="circuit-2q-formula" style={{textAlign: "center"}}>
                    |ψ⟩ = |00⟩
                  </div>
                  <div className="prob-rows" id="circuit-2q-probs" style={{width: "100%", marginTop: "8px"}} />
                </div>
              </div>
            </div>
          </div>
          <div id="circuit-3q-panel" style={{display: "none"}}>
            <div className="circuit-top">
              <div className="circuit-left">
                <div className="section-label" data-i18n="circuits.targetQubit3">
                  Target Qubit — new single-qubit gates apply to
                </div>
                <div className="mode-grid" style={{gridTemplateColumns: "1fr 1fr 1fr"}}>
                  <button className="preset-btn mode-btn active" data-target-qubit3="0">
                    Qubit 0
                  </button>
                  <button className="preset-btn mode-btn" data-target-qubit3="1">
                    Qubit 1
                  </button>
                  <button className="preset-btn mode-btn" data-target-qubit3="2">
                    Qubit 2
                  </button>
                </div>
                <div className="section-label mt-14" data-i18n="circuits.gatePaletteTarget">
                  Gate Palette — click to add to target qubit
                </div>
                <div className="circuit-palette" id="circuit-3q-palette" />
                <div className="section-label mt-14" data-i18n="circuits.addCnot">
                  Add CNOT
                </div>
                <div className="cnot3-picker">
                  <select className="cnot3-select" id="cnot3-control" />
                  <span className="cnot3-arrow">
                    →
                  </span>
                  <select className="cnot3-select" id="cnot3-target" />
                  <button className="circuit-gate-btn" id="btn-add-cnot3" style={{fontSize: "0.72rem", padding: "7px 10px"}} data-i18n="common.add">
                    Add
                  </button>
                </div>
                <div className="section-label mt-14" data-i18n="circuits.addToffoli">
                  Add Toffoli (2 controls → 1 target)
                </div>
                <div className="cnot3-picker">
                  <select className="cnot3-select" id="toffoli3-control1" />
                  <span className="cnot3-arrow">
                    +
                  </span>
                  <select className="cnot3-select" id="toffoli3-control2" />
                  <span className="cnot3-arrow">
                    →
                  </span>
                  <select className="cnot3-select" id="toffoli3-target" />
                  <button className="circuit-gate-btn" id="btn-add-toffoli3" style={{fontSize: "0.72rem", padding: "7px 10px"}} data-i18n="common.add">
                    Add
                  </button>
                </div>
                <div className="try-me-wrap" id="circuit-3q-try-me" style={{marginTop: "10px"}} />
                <div className="section-label" style={{marginTop: "18px"}} data-i18n="circuits.circuitDiagram">
                  Circuit Diagram
                </div>
                <div className="circuit2-diagram-wrap">
                  <div className="circuit3-diagram" id="circuit-3q-diagram" />
                </div>
                <div className="circuit-actions">
                  <button className="btn-run" id="btn-run-circuit-3q" data-i18n="common.run">
                    ▶ Run
                  </button>
                  <button className="btn-secondary" id="btn-clear-circuit-3q" data-i18n="common.clear">
                    Clear
                  </button>
                  <span className="muted-text" id="circuit-3q-status" />
                </div>
                <div className="card explainer-card" style={{marginTop: "4px"}}>
                  <div className="card-title" data-i18n="circuits.whatsGoingOn">
                    What's going on
                  </div>
                  <p className="bit-explainer" id="circuit-3q-explainer">
                    Three qubits, all starting at |000⟩. Try H on Qubit 0, then CNOT Q0→Q1, then CNOT Q0→Q2 — that recipe spreads one qubit's coin flip across all three, a three-way GHZ state.
                  </p>
                </div>
                <div className="card" style={{marginTop: "4px"}}>
                  <div className="card-title" data-i18n="circuits.runHistory">
                    Run History — click a step to revisit it
                  </div>
                  <div className="history-row" id="circuit-3q-history">
                    <span className="muted-text">
                      —
                    </span>
                  </div>
                </div>
              </div>
              <div className="circuit-right">
                <div className="section-label" data-i18n="circuits.outputState3Q">
                  Output State (3 Qubits)
                </div>
                <div className="circuit-output-card">
                  <div className="section-label" style={{marginBottom: "6px"}} data-i18n="circuits.perQubitBlochSpheres">
                    Per-Qubit Bloch Spheres — shrink toward center when entangled
                  </div>
                  <div className="mini-bloch-row">
                    <div className="mini-bloch">
                      <canvas id="bloch-circuit-3q-0" width="86" height="86" role="img" aria-label="Reduced Bloch sphere for Qubit 0. State: |0⟩." />
                      <div className="mini-bloch-label" id="mini-label-3q-0">
                        |0⟩
                      </div>
                    </div>
                    <div className="mini-bloch">
                      <canvas id="bloch-circuit-3q-1" width="86" height="86" role="img" aria-label="Reduced Bloch sphere for Qubit 1. State: |0⟩." />
                      <div className="mini-bloch-label" id="mini-label-3q-1">
                        |0⟩
                      </div>
                    </div>
                    <div className="mini-bloch">
                      <canvas id="bloch-circuit-3q-2" width="86" height="86" role="img" aria-label="Reduced Bloch sphere for Qubit 2. State: |0⟩." />
                      <div className="mini-bloch-label" id="mini-label-3q-2">
                        |0⟩
                      </div>
                    </div>
                  </div>
                  <div className="formula" id="circuit-3q-formula" style={{textAlign: "center"}}>
                    |ψ⟩ = |000⟩
                  </div>
                  <div className="prob-rows" id="circuit-3q-probs" style={{width: "100%", marginTop: "8px"}} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="circuit-compare-panel" style={{display: "none"}}>
          <div className="compare-layout" style={{gridTemplateColumns: "1fr 40px 1fr", maxWidth: "900px"}}>
            <div className="compare-col classical-col">
              <div className="col-label">
                <span className="col-badge" data-i18n="common.classical">
                  Classical
                </span>
                <span className="col-desc" data-i18n="circuits.compareClassicalDesc">
                  XOR and AND gates, wired straight to A and B
                </span>
              </div>
              <div className="circuit2-diagram-wrap">
                <svg id="ha-compare-classical-svg" viewBox="0 0 230 140" role="img" aria-label="Classical half adder: A and B feed an XOR gate producing Sum, and an AND gate producing Carry." />
              </div>
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
                <span className="col-desc" data-i18n="circuits.compareQuantumDesc">
                  X, CNOT and Toffoli — reversible gates reaching the same answer
                </span>
              </div>
              <div className="circuit2-diagram-wrap">
                <div className="ha-quantum-diagram" id="ha-compare-quantum-diagram" />
              </div>
            </div>
          </div>
          <div className="card mt-14" style={{maxWidth: "640px", marginLeft: "auto", marginRight: "auto"}}>
            <div className="section-label" data-i18n="circuits.halfAdderCompareTitle">
              Classical vs Quantum — Same Half Adder
            </div>
            <table className="truth-table" id="ha-compare-table" />
            <p className="bit-explainer mt-14" data-i18n="circuits.halfAdderCompareBody">
              The classical circuit reaches Sum/Carry with AND/XOR gates. The quantum circuit above (shown for A=1, B=1) reaches the exact same two numbers using only reversible gates: X gates set q0=A and q1=B, two CNOTs copy their XOR into ancilla q2 for Sum = A⊕B, and a Toffoli copies their AND into ancilla q3 for Carry = A·B — then q2 and q3 are measured out. You can build a related reversible half adder yourself, gate by gate, under Quantum Circuit → 3 Qubits → Try me → Half Adder.
            </p>
          </div>
        </div>
      </div>
      <div className="lesson-embed" id="lesson-embed-circuit" />
    </section>
  );
}
