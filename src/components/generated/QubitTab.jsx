// Generated from the original index.html markup; edit freely.
export default function QubitTab() {
  return (
    <section id="tab-qubit" className="tab-content active" style={{display: "none"}}>
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="qubitTab.pageTitle">
          Bits & Qubits
        </h1>
        <p className="compare-subtitle" data-i18n="qubitTab.pageSubtitle">
          Learn classical and quantum information by exploring a bit, a single qubit, or a two-qubit system.
        </p>
      </div>
      <div className="mode-grid" style={{gridTemplateColumns: "1fr 1fr", maxWidth: "280px", margin: "0 auto 18px"}}>
        <button className="preset-btn mode-btn" data-qubit-mode="classical" data-i18n="common.classical">
          Classical
        </button>
        <button className="preset-btn mode-btn active" data-qubit-mode="quantum" data-i18n="common.quantum">
          Quantum
        </button>
      </div>
      <div id="qubit-classical-panel" style={{display: "none"}}>
        <div className="compare-layout" style={{gridTemplateColumns: "1fr", justifyItems: "center"}}>
          <div className="compare-col classical-col">
            <div className="col-label">
              <span className="col-badge" data-i18n="qubitTab.classicalBitBadge">
                Classical Bit
              </span>
              <span className="col-desc" data-i18n="qubitTab.classicalBitDesc">
                A bit is the smallest unit of information in a classical computer. Unlike a qubit, a classical bit never exists in both states simultaneously.
              </span>
            </div>
            <div className="classical-display-wrap">
              <div className="classical-display" id="classical-display">
                1
              </div>
              <div className="classical-label" data-i18n="qubitTab.currentBit">
                Current bit
              </div>
            </div>
            <div className="switch-area">
              <span className="bit-label" id="lbl-zero">
                0
              </span>
              <label className="toggle-switch">
                <input type="checkbox" id="bit-toggle" defaultChecked />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </label>
              <span className="bit-label active" id="lbl-one">
                1
              </span>
            </div>
            <div className="classical-info">
              <div className="info-row">
                <span className="info-key" data-i18n="qubitTab.possibleValues">
                  Possible values
                </span>
                <span className="info-val mono">
                  0 or 1
                </span>
              </div>
            </div>
            <button className="btn-secondary" id="btn-classical-tryme" style={{marginBottom: "14px"}} data-i18n="common.tryMe">
              Try me
            </button>
            <p className="bit-explainer" data-i18n="qubitTab.classicalExplainer">
              Toggle the switch to change the bit. Notice it is always either 0 or 1, never both.
            </p>
            <div className="card explainer-card mt-14">
              <div className="card-title" data-i18n="common.whatJustHappened">
                What just happened
              </div>
              <p className="bit-explainer" id="classical-tryme-explainer" data-i18n="qubitTab.classicalTryMeIdle">
                Click Try me to watch the bit flip back and forth.
              </p>
            </div>
            <div className="card mt-14">
              <div className="card-title" data-i18n="common.appliedSequence">
                Applied Sequence
              </div>
              <div className="history-row" id="classical-tryme-history" />
            </div>
          </div>
        </div>
      </div>
      <div id="qubit-quantum-panel">
        <div id="qubit-quantum-intro">
          <div className="compare-layout" style={{gridTemplateColumns: "1fr", justifyItems: "center"}}>
            <div className="compare-col quantum-col">
              <div className="col-label">
                <span className="col-badge quantum-badge" data-i18n="qubitTab.qubitBadge">
                  Qubit
                </span>
                <span className="col-desc" data-i18n="qubitTab.qubitDesc">
                  A qubit is the fundamental unit of quantum information. Unlike a classical bit, it can exist in a superposition of both 0 and 1 at once — its state is described by two complex amplitudes, α and β, until the moment it's measured.
                </span>
              </div>
              <p className="bit-explainer" data-i18n="qubitTab.qubitIntroExplainer">
                Pick a mode below: explore a single qubit's superposition on the Bloch sphere, or see how two independent qubits combine into a joint state.
              </p>
              <p className="bit-explainer mt-14" data-i18n="qubitTab.whatIsQubitBody" data-i18n-html="">
                A qubit is often described as "0 and 1 at the same time," but that's shorthand for something more precise: its state is a{' '}
                <span className="key-term">
                  superposition
                </span>
                {' '}— a weighted combination — of the two basis outcomes |0⟩ and |1⟩, set by two{' '}
                <span className="key-term">
                  complex amplitudes
                </span>
                {' '}α and β. Squaring the size of each amplitude gives the probability of that outcome when measured — but before measurement, the qubit genuinely hasn't picked one. A classical bit has exactly two states. A qubit has infinitely many: every point on the surface of the Bloch sphere below is a valid state, not just its two poles.
              </p>
            </div>
          </div>
        </div>
        <div className="mode-grid" style={{gridTemplateColumns: "1fr 1fr 1fr", maxWidth: "400px", margin: "0 auto 18px"}}>
          <button className="preset-btn mode-btn" data-qubit-submode="1q" data-i18n="qubitTab.oneQubit">
            One Qubit
          </button>
          <button className="preset-btn mode-btn" data-qubit-submode="2q" data-i18n="qubitTab.twoQubit">
            Two Qubit
          </button>
          <button className="preset-btn mode-btn" data-qubit-submode="3q" data-i18n="qubitTab.threeQubit">
            Three Qubit
          </button>
        </div>
        <div id="qubit-1q-panel" style={{display: "none"}}>
          <div className="compare-layout" style={{gridTemplateColumns: "1fr", justifyItems: "center"}}>
            <div className="compare-col quantum-col">
              <div className="col-label">
                <span className="col-badge quantum-badge" data-i18n="common.quantum">
                  Quantum
                </span>
                <span className="col-desc" data-i18n="qubitTab.oneQubitDesc">
                  A superposition of both 0 and 1
                </span>
              </div>
              <div className="layout-two">
                <div className="bloch-wrap bloch-wrap--drag">
                  <canvas id="bloch-main" width="260" height="260" tabIndex="0" role="img" aria-label="Bloch sphere. State: |ψ⟩ = |0⟩. Draggable, or focus and use arrow keys, to set the qubit's state." />
                  <div className="state-label" id="label-main">
                    |0⟩
                  </div>
                </div>
                <div className="right-panel">
                  <div className="card">
                    <div className="card-title" data-i18n="common.stateVector">
                      State Vector
                    </div>
                    <div className="formula" id="formula-main">
                      |ψ⟩ = |0⟩
                    </div>
                    <div className="prob-rows">
                      <div className="prob-row">
                        <span className="ket zero-color">
                          |0⟩
                        </span>
                        <div className="track">
                          <div className="fill zero-fill" id="fill0-main" style={{width: "100%"}} />
                        </div>
                        <span className="pct" id="pct0-main">
                          100%
                        </span>
                      </div>
                      <div className="prob-row">
                        <span className="ket one-color">
                          |1⟩
                        </span>
                        <div className="track">
                          <div className="fill one-fill" id="fill1-main" style={{width: "0%"}} />
                        </div>
                        <span className="pct" id="pct1-main">
                          0%
                        </span>
                      </div>
                    </div>
                    <div style={{marginTop: "10px"}}>
                      <button className="btn-secondary" id="btn-share-qubit" data-i18n="common.copyShareableLink">
                        Copy shareable link
                      </button>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title" data-i18n="common.basisStates">
                      Basis States
                    </div>
                    <div className="preset-grid">
                      <button className="preset-btn" data-theta-mult="0" data-phi-mult="0">
                        |0⟩
                      </button>
                      <button className="preset-btn" data-theta-mult="1" data-phi-mult="0">
                        |1⟩
                      </button>
                      <button className="preset-btn" data-theta-mult="0.5" data-phi-mult="0">
                        |+⟩
                      </button>
                      <button className="preset-btn" data-theta-mult="0.5" data-phi-mult="1">
                        |-⟩
                      </button>
                      <button className="preset-btn" data-theta-mult="0.5" data-phi-mult="0.5">
                        |i⟩
                      </button>
                      <button className="preset-btn" data-theta-mult="0.5" data-phi-mult="1.5">
                        |-i⟩
                      </button>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title" data-i18n="qubitTab.exploreBlochSphere">
                      Explore the Bloch Sphere
                    </div>
                    <div className="slider-group">
                      <div className="slider-row">
                        <span className="slider-sym">
                          θ
                        </span>
                        <input type="range" id="sl-theta" min="0" max="3141" defaultValue="0" />
                        <span className="slider-val" id="val-theta">
                          0°
                        </span>
                      </div>
                      <div className="slider-row">
                        <span className="slider-sym">
                          φ
                        </span>
                        <input type="range" id="sl-phi" min="0" max="6283" defaultValue="0" />
                        <span className="slider-val" id="val-phi">
                          0°
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title" data-i18n="qubitTab.blochEarthTitle">
                      The Bloch Sphere — Think of Planet Earth
                    </div>
                    <p className="bit-explainer" data-i18n="qubitTab.blochEarthBody" data-i18n-html="">
                      The sphere your qubit lives on works like a globe. The{' '}
                      <span className="key-term">
                        north pole
                      </span>
                      {' '}is |0⟩ and the{' '}
                      <span className="key-term">
                        south pole
                      </span>
                      {' '}is |1⟩ — θ (theta) is "latitude," how far the qubit has tilted from the |0⟩ pole toward |1⟩. Sitting right on the{' '}
                      <span className="key-term">
                        equator
                      </span>
                      {' '}(θ = 90°) means an equal 50/50{' '}
                      <span className="key-term">
                        superposition
                      </span>
                      {' '}of both. φ (phi) is "longitude" — it never changes the measurement odds, only the relative{' '}
                      <span className="key-term">
                        phase
                      </span>
                      {' '}between the two amplitudes, which is invisible to a single measurement but is exactly what drives interference elsewhere in this app.
                    </p>
                  </div>
                </div>
              </div>
              <div className="quantum-info">
                <div className="info-row">
                  <span className="info-key" data-i18n="common.possibleStates">
                    Possible states
                  </span>
                  <span className="info-val mono">
                    ∞ — any point on Bloch sphere
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key" data-i18n="common.uncertainty">
                    Uncertainty
                  </span>
                  <span className="info-val mono" data-i18n="common.uncertaintyFundamental">
                    Fundamental — until measured
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key" data-i18n="common.representation">
                    Representation
                  </span>
                  <span className="info-val mono">
                    α|0⟩ + β|1⟩, |α|² + |β|² = 1
                  </span>
                </div>
              </div>
              <button className="btn-secondary mt-14" id="btn-qubit-tryme" data-i18n="common.tryMe">
                Try me
              </button>
              <p className="bit-explainer mt-14" data-i18n="qubitTab.oneQubitExplainer">
                A qubit can be in a superposition of |0⟩ and |1⟩ simultaneously. Drag the sliders to explore every possible state on the Bloch sphere — each point is a valid qubit state inaccessible to any classical bit.
              </p>
              <div className="card explainer-card mt-14">
                <div className="card-title" data-i18n="common.whatJustHappened">
                  What just happened
                </div>
                <p className="bit-explainer" id="qubit-tryme-explainer" data-i18n="qubitTab.oneQubitTryMeIdle">
                  Click Try me to cycle through the six basis states.
                </p>
              </div>
              <div className="card mt-14">
                <div className="card-title" data-i18n="common.appliedSequence">
                  Applied Sequence
                </div>
                <div className="history-row" id="qubit-tryme-history" />
              </div>
            </div>
          </div>
        </div>
        <div id="qubit-2q-panel" style={{display: "none"}}>
          <div className="compare-layout" style={{gridTemplateColumns: "1fr 40px 1fr"}}>
            <div className="compare-col">
              <div className="col-label">
                <span className="col-badge quantum-badge" data-i18n="qubitTab.qubitABadge">
                  Qubit A
                </span>
                <span className="col-desc" data-i18n="qubitTab.qubitADesc">
                  Independent — not entangled with B
                </span>
              </div>
              <div className="bloch-wrap bloch-wrap--drag">
                <canvas id="bloch-2q-a" width="220" height="220" tabIndex="0" role="img" aria-label="Bloch sphere for Qubit A. State: |ψ⟩ = |0⟩. Draggable, or focus and use arrow keys, to set the qubit's state." />
                <div className="state-label" id="label-2q-a">
                  |0⟩
                </div>
              </div>
              <div className="preset-grid preset-grid--2col" style={{marginTop: "10px"}}>
                <button className="preset-btn" data-qubit2="a" data-theta-mult="0" data-phi-mult="0">
                  |0⟩
                </button>
                <button className="preset-btn" data-qubit2="a" data-theta-mult="1" data-phi-mult="0">
                  |1⟩
                </button>
                <button className="preset-btn" data-qubit2="a" data-theta-mult="0.5" data-phi-mult="0">
                  |+⟩
                </button>
                <button className="preset-btn" data-qubit2="a" data-theta-mult="0.5" data-phi-mult="1">
                  |-⟩
                </button>
              </div>
              <div className="formula" id="formula-2q-a" style={{marginTop: "10px", textAlign: "center"}}>
                |ψ⟩ = |0⟩
              </div>
            </div>
            <div className="compare-divider">
              <div className="divider-line" />
              <div className="divider-vs">
                ⊗
              </div>
              <div className="divider-line" />
            </div>
            <div className="compare-col">
              <div className="col-label">
                <span className="col-badge quantum-badge" data-i18n="qubitTab.qubitBBadge">
                  Qubit B
                </span>
                <span className="col-desc" data-i18n="qubitTab.qubitBDesc">
                  Independent — not entangled with A
                </span>
              </div>
              <div className="bloch-wrap bloch-wrap--drag">
                <canvas id="bloch-2q-b" width="220" height="220" tabIndex="0" role="img" aria-label="Bloch sphere for Qubit B. State: |ψ⟩ = |0⟩. Draggable, or focus and use arrow keys, to set the qubit's state." />
                <div className="state-label" id="label-2q-b">
                  |0⟩
                </div>
              </div>
              <div className="preset-grid preset-grid--2col" style={{marginTop: "10px"}}>
                <button className="preset-btn" data-qubit2="b" data-theta-mult="0" data-phi-mult="0">
                  |0⟩
                </button>
                <button className="preset-btn" data-qubit2="b" data-theta-mult="1" data-phi-mult="0">
                  |1⟩
                </button>
                <button className="preset-btn" data-qubit2="b" data-theta-mult="0.5" data-phi-mult="0">
                  |+⟩
                </button>
                <button className="preset-btn" data-qubit2="b" data-theta-mult="0.5" data-phi-mult="1">
                  |-⟩
                </button>
              </div>
              <div className="formula" id="formula-2q-b" style={{marginTop: "10px", textAlign: "center"}}>
                |ψ⟩ = |0⟩
              </div>
            </div>
          </div>
          <div className="card" style={{maxWidth: "520px", margin: "20px auto 0"}}>
            <div className="card-title" data-i18n="qubitTab.jointState">
              Joint State — |ψ_A⟩ ⊗ |ψ_B⟩
            </div>
            <div className="prob-rows">
              <div className="prob-row">
                <span className="ket" style={{color: "var(--zero)"}}>
                  |00⟩
                </span>
                <div className="track">
                  <div className="fill zero-fill" id="q2-fill-00" style={{width: "100%"}} />
                </div>
                <span className="pct" id="q2-pct-00">
                  100%
                </span>
              </div>
              <div className="prob-row">
                <span className="ket mid-color">
                  |01⟩
                </span>
                <div className="track">
                  <div className="fill" style={{background: "var(--text2)", width: "0%"}} id="q2-fill-01" />
                </div>
                <span className="pct" id="q2-pct-01">
                  0%
                </span>
              </div>
              <div className="prob-row">
                <span className="ket mid-color">
                  |10⟩
                </span>
                <div className="track">
                  <div className="fill" style={{background: "var(--text2)", width: "0%"}} id="q2-fill-10" />
                </div>
                <span className="pct" id="q2-pct-10">
                  0%
                </span>
              </div>
              <div className="prob-row">
                <span className="ket" style={{color: "var(--one)"}}>
                  |11⟩
                </span>
                <div className="track">
                  <div className="fill one-fill" id="q2-fill-11" style={{width: "0%"}} />
                </div>
                <span className="pct" id="q2-pct-11">
                  0%
                </span>
              </div>
            </div>
          </div>
          <div style={{maxWidth: "520px", margin: "14px auto 0", textAlign: "center"}}>
            <button className="btn-secondary" id="btn-qubit2-tryme" data-i18n="common.tryMe">
              Try me
            </button>
          </div>
          <p className="bit-explainer" style={{maxWidth: "520px", margin: "14px auto 0"}} data-i18n="qubitTab.twoQubitExplainer">
            Two qubits, each dragged independently — the joint state above is just the product of their individual odds, P(ab) = P(a) × P(b). Nothing here is correlated yet; that's exactly the ingredient the Entangle tab adds with a CNOT.
          </p>
          <div className="card explainer-card" style={{maxWidth: "520px", margin: "14px auto 0"}}>
            <div className="card-title" data-i18n="common.whatJustHappened">
              What just happened
            </div>
            <p className="bit-explainer" id="qubit2-tryme-explainer" data-i18n="qubitTab.twoQubitTryMeIdle">
              Click Try me to move both qubits together through the four basis states.
            </p>
          </div>
          <div className="card" style={{maxWidth: "520px", margin: "10px auto 0"}}>
            <div className="card-title" data-i18n="common.appliedSequence">
              Applied Sequence
            </div>
            <div className="history-row" id="qubit2-tryme-history" />
          </div>
        </div>
        <div id="qubit-3q-panel" style={{display: "none"}}>
          <div className="qubit3-layout">
            <div className="compare-col">
              <div className="col-label">
                <span className="col-badge quantum-badge" data-i18n="qubitTab.qubitABadge">
                  Qubit A
                </span>
                <span className="col-desc" data-i18n="qubitTab.qubitA3Desc">
                  Independent — not entangled with B or C
                </span>
              </div>
              <div className="bloch-wrap bloch-wrap--drag">
                <canvas id="bloch-3q-a" width="190" height="190" tabIndex="0" role="img" aria-label="Bloch sphere for Qubit A. State: |ψ⟩ = |0⟩. Draggable, or focus and use arrow keys, to set the qubit's state." />
                <div className="state-label" id="label-3q-a">
                  |0⟩
                </div>
              </div>
              <div className="preset-grid preset-grid--2col" style={{marginTop: "10px"}}>
                <button className="preset-btn" data-qubit3="a" data-theta-mult="0" data-phi-mult="0">
                  |0⟩
                </button>
                <button className="preset-btn" data-qubit3="a" data-theta-mult="1" data-phi-mult="0">
                  |1⟩
                </button>
                <button className="preset-btn" data-qubit3="a" data-theta-mult="0.5" data-phi-mult="0">
                  |+⟩
                </button>
                <button className="preset-btn" data-qubit3="a" data-theta-mult="0.5" data-phi-mult="1">
                  |-⟩
                </button>
              </div>
              <div className="formula" id="formula-3q-a" style={{marginTop: "10px", textAlign: "center"}}>
                |ψ⟩ = |0⟩
              </div>
            </div>
            <div className="compare-col">
              <div className="col-label">
                <span className="col-badge quantum-badge" data-i18n="qubitTab.qubitBBadge">
                  Qubit B
                </span>
                <span className="col-desc" data-i18n="qubitTab.qubitB3Desc">
                  Independent — not entangled with A or C
                </span>
              </div>
              <div className="bloch-wrap bloch-wrap--drag">
                <canvas id="bloch-3q-b" width="190" height="190" tabIndex="0" role="img" aria-label="Bloch sphere for Qubit B. State: |ψ⟩ = |0⟩. Draggable, or focus and use arrow keys, to set the qubit's state." />
                <div className="state-label" id="label-3q-b">
                  |0⟩
                </div>
              </div>
              <div className="preset-grid preset-grid--2col" style={{marginTop: "10px"}}>
                <button className="preset-btn" data-qubit3="b" data-theta-mult="0" data-phi-mult="0">
                  |0⟩
                </button>
                <button className="preset-btn" data-qubit3="b" data-theta-mult="1" data-phi-mult="0">
                  |1⟩
                </button>
                <button className="preset-btn" data-qubit3="b" data-theta-mult="0.5" data-phi-mult="0">
                  |+⟩
                </button>
                <button className="preset-btn" data-qubit3="b" data-theta-mult="0.5" data-phi-mult="1">
                  |-⟩
                </button>
              </div>
              <div className="formula" id="formula-3q-b" style={{marginTop: "10px", textAlign: "center"}}>
                |ψ⟩ = |0⟩
              </div>
            </div>
            <div className="compare-col">
              <div className="col-label">
                <span className="col-badge quantum-badge" data-i18n="qubitTab.qubitCBadge">
                  Qubit C
                </span>
                <span className="col-desc" data-i18n="qubitTab.qubitC3Desc">
                  Independent — not entangled with A or B
                </span>
              </div>
              <div className="bloch-wrap bloch-wrap--drag">
                <canvas id="bloch-3q-c" width="190" height="190" tabIndex="0" role="img" aria-label="Bloch sphere for Qubit C. State: |ψ⟩ = |0⟩. Draggable, or focus and use arrow keys, to set the qubit's state." />
                <div className="state-label" id="label-3q-c">
                  |0⟩
                </div>
              </div>
              <div className="preset-grid preset-grid--2col" style={{marginTop: "10px"}}>
                <button className="preset-btn" data-qubit3="c" data-theta-mult="0" data-phi-mult="0">
                  |0⟩
                </button>
                <button className="preset-btn" data-qubit3="c" data-theta-mult="1" data-phi-mult="0">
                  |1⟩
                </button>
                <button className="preset-btn" data-qubit3="c" data-theta-mult="0.5" data-phi-mult="0">
                  |+⟩
                </button>
                <button className="preset-btn" data-qubit3="c" data-theta-mult="0.5" data-phi-mult="1">
                  |-⟩
                </button>
              </div>
              <div className="formula" id="formula-3q-c" style={{marginTop: "10px", textAlign: "center"}}>
                |ψ⟩ = |0⟩
              </div>
            </div>
          </div>
          <div className="card" style={{maxWidth: "640px", margin: "20px auto 0"}}>
            <div className="card-title" data-i18n="qubitTab.jointState3">
              Joint State — |ψ_A⟩ ⊗ |ψ_B⟩ ⊗ |ψ_C⟩
            </div>
            <div className="prob-rows" id="qubit3-prob-rows" />
          </div>
          <div style={{maxWidth: "640px", margin: "14px auto 0", textAlign: "center"}}>
            <button className="btn-secondary" id="btn-qubit3-tryme" data-i18n="common.tryMe">
              Try me
            </button>
          </div>
          <p className="bit-explainer" style={{maxWidth: "640px", margin: "14px auto 0"}} data-i18n="qubitTab.threeQubitExplainer">
            Three qubits, each dragged independently — the joint state above is just the product of all three individual odds, P(abc) = P(a) × P(b) × P(c). Still nothing correlated here; scale this same idea up with a CNOT and you get the GHZ states in the Circuit tab's 3-qubit builder.
          </p>
          <div className="card explainer-card" style={{maxWidth: "640px", margin: "14px auto 0"}}>
            <div className="card-title" data-i18n="common.whatJustHappened">
              What just happened
            </div>
            <p className="bit-explainer" id="qubit3-tryme-explainer" data-i18n="qubitTab.threeQubitTryMeIdle">
              Click Try me to move all three qubits together through the four basis states.
            </p>
          </div>
          <div className="card" style={{maxWidth: "640px", margin: "10px auto 0"}}>
            <div className="card-title" data-i18n="common.appliedSequence">
              Applied Sequence
            </div>
            <div className="history-row" id="qubit3-tryme-history" />
          </div>
        </div>
      </div>
      <div className="lesson-embed" id="lesson-embed-qubit" />
    </section>
  );
}
