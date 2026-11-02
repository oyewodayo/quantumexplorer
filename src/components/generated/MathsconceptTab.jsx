// Generated from the original index.html markup; edit freely.
export default function MathsconceptTab() {
  return (
    <section id="tab-mathsconcept" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="maths.title">
          Maths Concept
        </h1>
        <p className="compare-subtitle" data-i18n="maths.subtitle">
          The mathematical language behind qubits — complex numbers, vectors, matrices, state vectors, Dirac notation, and tensor products.
        </p>
      </div>
      <div className="intro-layout">
        <div className="maths-panel" id="maths-complex">
          <div className="card">
            <div className="card-title" data-i18n="mathsTab.complexNumbers">
              Complex Numbers
            </div>
            <p className="bit-explainer" data-i18n="maths.complexBody1">
              A qubit's amplitudes aren't plain real numbers — they're complex numbers, each with a real part and an imaginary part. That extra dimension is what makes phase (and interference) possible.
            </p>
            <div className="formula" style={{marginTop: "12px"}} data-i18n="maths.complexFormula1" data-i18n-html="">
              z = a + bi, i² = −1
            </div>
            <div className="formula" data-i18n="maths.complexFormula2">
              Modulus: |z| = √(a² + b²)
            </div>
            <div className="formula" data-i18n="maths.complexFormula3" data-i18n-html="">
              Polar form: z = r·e
              <sup>
                iθ
              </sup>
              {' '}= r(cos θ + i sin θ)
            </div>
            <p className="bit-explainer" style={{marginTop: "12px"}} data-i18n="maths.complexBody2">
              A qubit state α|0⟩ + β|1⟩ has complex amplitudes α, β. Only their squared moduli |α|², |β|² are directly observable (as measurement probabilities) — the relative phase between them is invisible to a single measurement but drives interference.
            </p>
          </div>
          <div className="lesson-embed" id="lesson-embed-maths-complex" />
        </div>
        <div className="maths-panel" id="maths-vectors" style={{display: "none"}}>
          <div className="card">
            <div className="card-title" data-i18n="mathsTab.vectors">
              Vectors
            </div>
            <p className="bit-explainer" data-i18n="maths.vectorsBody1">
              A qubit's state is a vector in a 2-dimensional complex vector space, written as a column of its two amplitudes.
            </p>
            <div className="formula" style={{marginTop: "12px"}} data-i18n="maths.vectorsFormula1" data-i18n-html="">
              |0⟩ = [1, 0]
              <sup>
                T
              </sup>
              {' '}|1⟩ = [0, 1]
              <sup>
                T
              </sup>
            </div>
            <div className="formula" data-i18n="maths.vectorsFormula2" data-i18n-html="">
              |ψ⟩ = α|0⟩ + β|1⟩ = [α, β]
              <sup>
                T
              </sup>
            </div>
            <div className="formula" data-i18n="maths.vectorsFormula3">
              Normalization: |α|² + |β|² = 1
            </div>
            <div className="formula" data-i18n="maths.vectorsFormula4" data-i18n-html="">
              Inner product: ⟨φ|ψ⟩ = φ
              <sub>
                0
              </sub>
              *ψ
              <sub>
                0
              </sub>
              {' '}+ φ
              <sub>
                1
              </sub>
              *ψ
              <sub>
                1
              </sub>
            </div>
            <p className="bit-explainer" style={{marginTop: "12px"}} data-i18n="maths.vectorsBody2">
              Normalization keeps total probability at 100% — it's why every point you can drag to on the Bloch sphere is automatically a valid state. The inner product measures how much two states overlap; orthogonal states (like |0⟩ and |1⟩) have inner product 0.
            </p>
          </div>
          <div className="lesson-embed" id="lesson-embed-maths-vectors" />
        </div>
        <div className="maths-panel" id="maths-matrices" style={{display: "none"}}>
          <div className="card">
            <div className="card-title" data-i18n="mathsTab.matrices">
              Matrices
            </div>
            <p className="bit-explainer" data-i18n="maths.matricesBody1">
              Every quantum gate is a matrix. Applying a gate to a qubit is just matrix-vector multiplication — the gate matrix times the state vector gives the new state vector.
            </p>
            <div className="formula" style={{marginTop: "12px"}} data-i18n="maths.matricesFormula1">
              Pauli-X = [[0, 1], [1, 0]]
            </div>
            <div className="formula" data-i18n="maths.matricesFormula2" data-i18n-html="">
              X|0⟩ = [[0,1],[1,0]]·[1,0]
              <sup>
                T
              </sup>
              {' '}= [0,1]
              <sup>
                T
              </sup>
              {' '}= |1⟩
            </div>
            <div className="formula" data-i18n="maths.matricesFormula3">
              Unitary condition: U†U = I
            </div>
            <p className="bit-explainer" style={{marginTop: "12px"}} data-i18n="maths.matricesBody2">
              "Unitary" is the constraint every quantum gate must satisfy — U† (the conjugate transpose) undoes U exactly. It's what guarantees a gate never destroys or creates probability: the output state is always normalized whenever the input was.
            </p>
          </div>
          <div className="lesson-embed" id="lesson-embed-maths-matrices" />
        </div>
        <div className="maths-panel" id="maths-statevector" style={{display: "none"}}>
          <div className="card">
            <div className="card-title" data-i18n="mathsTab.stateVector">
              State Vector
            </div>
            <p className="bit-explainer" data-i18n="maths.svBody1">
              The state vector |ψ⟩ is the complete description of a qubit — everything you can ever predict about it (measurement odds, how it responds to a gate) is computed from these two amplitudes.
            </p>
            <div className="formula" style={{marginTop: "12px"}} data-i18n="maths.svFormula1">
              |ψ⟩ = α|0⟩ + β|1⟩
            </div>
            <div className="formula" data-i18n="maths.svFormula2" data-i18n-html="">
              Bloch form: |ψ⟩ = cos(θ/2)|0⟩ + e
              <sup>
                iφ
              </sup>
              sin(θ/2)|1⟩
            </div>
            <div className="formula" data-i18n="maths.svFormula3" data-i18n-html="">
              P(0) = |α|² P(1) = |β|²
            </div>
            <p className="bit-explainer" style={{marginTop: "12px"}} data-i18n="maths.svBody2">
              θ and φ are exactly the two sliders on the Bits & Qubits Bloch sphere — every state vector corresponds to one point on that sphere, and vice versa.
            </p>
          </div>
          <div className="card mt-14">
            <div className="card-title" data-i18n="maths.compareStateSpaces">
              Compare the State Spaces
            </div>
            <p className="bit-explainer" data-i18n="maths.compareStateSpacesBody">
              A classical bit is a point on a line; a qubit is a vector tip on a unit arc — pick a view below.
            </p>
            <div className="mode-grid" style={{gridTemplateColumns: "1fr 1fr", maxWidth: "320px", margin: "14px auto 18px"}}>
              <button className="preset-btn mode-btn" data-statevec-mode="classical" data-i18n="common.classical">
                Classical
              </button>
              <button className="preset-btn mode-btn active" data-statevec-mode="quantum" data-i18n="common.quantum">
                Quantum
              </button>
            </div>
            <div id="statevec-classical-panel" style={{display: "none"}}>
              <div className="compare-layout" style={{gridTemplateColumns: "1fr", justifyItems: "center"}}>
                <div className="compare-col classical-col">
                  <div className="col-label">
                    <span className="col-badge" data-i18n="common.classical">
                      Classical
                    </span>
                    <span className="col-desc" data-i18n="maths.svClassicalDesc">
                      Two discrete endpoints only
                    </span>
                  </div>
                  <div className="sv-canvas-wrap">
                    <canvas id="sv-classical" width="220" height="300" role="img" aria-label="Diagram of a classical bit's state space: a vertical line with only two valid points, |0⟩ at the bottom and |1⟩ at the top, and a forbidden zone between them." />
                  </div>
                  <div style={{display: "flex", justifyContent: "center", margin: "14px 0"}}>
                    <button className="btn-measure" id="btn-toggle-classical-sv" data-i18n="maths.toggleBit">
                      Toggle bit
                    </button>
                  </div>
                  <div className="card">
                    <div className="card-title" data-i18n="maths.currentState">
                      Current State
                    </div>
                    <div className="formula" id="sv-classical-formula">
                      State = |1⟩
                    </div>
                  </div>
                  <div className="card" style={{marginTop: "10px"}}>
                    <div className="card-title" data-i18n="maths.stateSpace">
                      State Space
                    </div>
                    <p className="bit-explainer" data-i18n="maths.stateSpaceBody">
                      Only the two endpoints |0⟩ and |1⟩ are valid. The region between is physically forbidden — there is no "47% |1⟩" for a classical bit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div id="statevec-quantum-panel">
              <div className="compare-layout" style={{gridTemplateColumns: "1fr", justifyItems: "center"}}>
                <div className="compare-col quantum-col">
                  <div className="col-label">
                    <span className="col-badge quantum-badge" data-i18n="common.quantum">
                      Quantum
                    </span>
                    <span className="col-desc" data-i18n="maths.svQuantumDesc">
                      Any point on the unit arc
                    </span>
                  </div>
                  <div className="sv-canvas-wrap">
                    <canvas id="sv-quantum" width="300" height="300" role="img" aria-label="Diagram of a qubit's state space: a 2D plane with a quarter-circle arc from |0⟩ to |1⟩, and a vector whose tip traces every valid superposition as theta changes." />
                  </div>
                  <div className="slider-group" style={{margin: "14px 0 10px"}}>
                    <div className="slider-row">
                      <span className="slider-sym">
                        θ
                      </span>
                      <input type="range" id="sv-theta-slider" min="0" max="3141" defaultValue="0" />
                      <span className="slider-val" id="sv-theta-val">
                        0°
                      </span>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title" data-i18n="common.stateVector">
                      State Vector
                    </div>
                    <div className="formula" id="sv-quantum-formula">
                      |ψ⟩ = 1.00|0⟩ + 0.00|1⟩
                    </div>
                    <div className="prob-rows" style={{marginTop: "10px"}}>
                      <div className="prob-row">
                        <span className="ket zero-color">
                          |0⟩
                        </span>
                        <div className="track">
                          <div className="fill zero-fill" id="sv-fill0" style={{width: "100%"}} />
                        </div>
                        <span className="pct" id="sv-pct0">
                          100%
                        </span>
                      </div>
                      <div className="prob-row">
                        <span className="ket one-color">
                          |1⟩
                        </span>
                        <div className="track">
                          <div className="fill one-fill" id="sv-fill1" style={{width: "0%"}} />
                        </div>
                        <span className="pct" id="sv-pct1">
                          0%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card" style={{marginTop: "10px"}}>
                    <div className="card-title" data-i18n="maths.keyInsight">
                      Key Insight
                    </div>
                    <p className="bit-explainer" data-i18n="maths.keyInsightBody">
                      The tip of the state vector must sit on the unit arc (α² + β² = 1). Every point on that arc is a distinct, valid quantum state. The classical bit only ever occupies the two corners.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lesson-embed" id="lesson-embed-maths-statevector" />
        </div>
        <div className="maths-panel" id="maths-dirac" style={{display: "none"}}>
          <div className="card">
            <div className="card-title" data-i18n="mathsTab.diracNotation">
              Dirac Notation
            </div>
            <p className="bit-explainer" data-i18n="maths.diracBody1">
              The |·⟩ and ⟨·| symbols used everywhere in this app are Dirac's "bra-ket" notation — a compact shorthand for vectors and their inner products.
            </p>
            <div className="formula" style={{marginTop: "12px"}} data-i18n="maths.diracFormula1">
              Ket: |ψ⟩ — a column vector (a state)
            </div>
            <div className="formula" data-i18n="maths.diracFormula2">
              Bra: ⟨ψ| — the conjugate-transpose row vector
            </div>
            <div className="formula" data-i18n="maths.diracFormula3">
              Bra-ket: ⟨φ|ψ⟩ — an inner product (a number)
            </div>
            <div className="formula" data-i18n="maths.diracFormula4" data-i18n-html="">
              ⟨0|0⟩ = 1 ⟨0|1⟩ = 0 ⟨1|1⟩ = 1
            </div>
            <div className="formula" data-i18n="maths.diracFormula5">
              Ket-bra: |ψ⟩⟨φ| — an outer product (a matrix/operator)
            </div>
            <p className="bit-explainer" style={{marginTop: "12px"}} data-i18n="maths.diracBody2">
              |0⟩ and |1⟩ are orthonormal — each has unit length and zero overlap with the other — which is exactly why measuring always returns a clean 0 or 1, never something in between.
            </p>
          </div>
          <div className="lesson-embed" id="lesson-embed-maths-dirac" />
        </div>
        <div className="maths-panel" id="maths-tensor" style={{display: "none"}}>
          <div className="card">
            <div className="card-title" data-i18n="mathsTab.tensorProducts">
              Tensor Products
            </div>
            <p className="bit-explainer" data-i18n="maths.tensorBody1">
              The tensor product (⊗) is how two independent vector spaces combine into one larger joint space — stack every entry of the first vector against every entry of the second, multiplying each pair. An n-dimensional vector combined with an m-dimensional one produces an n×m-dimensional vector.
            </p>
            <div className="formula" style={{marginTop: "12px"}} data-i18n="maths.tensorFormula1" data-i18n-html="">
              [a, b]
              <sup>
                T
              </sup>
              {' '}⊗ [c, d]
              <sup>
                T
              </sup>
              {' '}= [ac, ad, bc, bd]
              <sup>
                T
              </sup>
            </div>
            <p className="bit-explainer" style={{marginTop: "12px"}} data-i18n="maths.tensorBody2">
              Two independent qubits combine exactly this way: each is a 2-entry vector, so their joint state is a 4-entry vector — one entry for each combination of basis states, |00⟩, |01⟩, |10⟩, |11⟩.
            </p>
            <div className="formula" data-i18n="maths.tensorFormula2" data-i18n-html="">
              |0⟩⊗|0⟩ = [1,0]
              <sup>
                T
              </sup>
              ⊗[1,0]
              <sup>
                T
              </sup>
              {' '}= [1,0,0,0]
              <sup>
                T
              </sup>
              {' '}= |00⟩
            </div>
            <p className="bit-explainer" style={{marginTop: "12px"}} data-i18n="maths.tensorBody3">
              Every state built by tensoring two single-qubit states can always be factored back apart into those same two qubits. Not every 4-entry vector can be factored that way, though — a joint state that can't be split back into a tensor product of two single-qubit states is exactly what's called entangled, explored hands-on on the Entangle tab.
            </p>
          </div>
          <div className="lesson-embed" id="lesson-embed-maths-tensor" />
        </div>
      </div>
    </section>
  );
}
