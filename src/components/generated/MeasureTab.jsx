// Generated from the original index.html markup; edit freely.
export default function MeasureTab() {
  return (
    <section id="tab-measure" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="measure.title">
          Measurement
        </h1>
        <p className="compare-subtitle" data-i18n="measure.subtitle">
          The bars below are odds, not a preview — measuring forces the qubit to answer a question it was genuinely undecided about, and there's no taking it back
        </p>
      </div>
      <div className="measure-layout">
        <div className="card measure-main-card">
          <div className="measure-state-col">
            <div className="card-title" data-i18n="measure.quantumState">
              Quantum State
            </div>
            <div className="formula" id="formula-measure">
              |ψ⟩ = |0⟩
            </div>
            <div className="vertical-bars">
              <div className="vbar-wrap">
                <div className="vbar-track">
                  <div className="vbar zero-fill" id="vbar0" style={{height: "100%"}} />
                </div>
                <span className="ket zero-color">
                  |0⟩
                </span>
                <span className="pct zero-color" id="vpct0">
                  100%
                </span>
              </div>
              <div className="vbar-wrap">
                <div className="vbar-track">
                  <div className="vbar one-fill" id="vbar1" style={{height: "0%"}} />
                </div>
                <span className="ket one-color">
                  |1⟩
                </span>
                <span className="pct one-color" id="vpct1">
                  0%
                </span>
              </div>
            </div>
          </div>
          <div className="measure-action-col">
            <div className="coin-wrap">
              <canvas id="coin-measure" width="130" height="130" role="img" aria-label="The qubit: unmeasured, in superposition." />
              <div className="coin-label-bottom" id="coin-measure-label" data-i18n="measure.unmeasured">
                Unmeasured
              </div>
            </div>
            <button className="btn-measure" id="btn-measure" data-i18n="measure.measureButton">
              MEASURE
            </button>
            <div className="measure-result" id="measure-result" />
            <div className="preset-grid preset-grid--2col mt-14">
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
            </div>
          </div>
        </div>
        <div className="card explainer-card">
          <div className="card-title" data-i18n="common.whatJustHappened">
            What just happened
          </div>
          <p className="bit-explainer" id="measure-explainer">
            Right now the qubit hasn't committed to anything — it genuinely holds both |0⟩ and |1⟩ at once, weighted by the bars above. Hit MEASURE and you're forcing it to answer a yes/no question it was actively avoiding.
          </p>
        </div>
        <div className="card">
          <div className="card-title" data-i18n="measure.postulateTitle">
            The Measurement Postulate
          </div>
          <p className="bit-explainer" data-i18n="measure.postulateBody1">
            This isn't just an app simplification — it's one of the axioms of quantum mechanics. Measuring a qubit |ψ⟩ = α|0⟩ + β|1⟩ returns 0 with probability |α|² and 1 with probability |β|² (the Born rule), and immediately afterward the state has collapsed to whichever outcome came up — the other possibility is simply gone, not just hidden.
          </p>
          <div className="formula" style={{marginTop: "10px"}} data-i18n="measure.postulateFormula" data-i18n-html="">
            P(0) = |α|² P(1) = |β|² α|0⟩ + β|1⟩ → |0⟩ or |1⟩
          </div>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="measure.postulateBody2">
            Note what's absent: nothing in this rule says which outcome you'll get on any single run — only the odds across many identical qubits, which is exactly what the histogram below is for.
          </p>
        </div>
        <div className="card">
          <div className="card-title">
            <span data-i18n="measure.measurementStatistics">
              Measurement Statistics
            </span>
            <span className="muted-text" id="trial-count" />
          </div>
          <div className="histogram">
            <div className="hist-col">
              <div className="hist-track">
                <div className="hist-bar zero-fill" id="hist0" />
              </div>
              <span className="ket zero-color">
                |0⟩
              </span>
              <span className="pct" id="hpct0">
                —
              </span>
            </div>
            <div className="hist-col">
              <div className="hist-track">
                <div className="hist-bar one-fill" id="hist1" />
              </div>
              <span className="ket one-color">
                |1⟩
              </span>
              <span className="pct" id="hpct1">
                —
              </span>
            </div>
          </div>
          <div className="measure-actions">
            <button className="btn-secondary" data-measure-n="10">
              ×10
            </button>
            <button className="btn-secondary" data-measure-n="100">
              ×100
            </button>
            <button className="btn-secondary" data-measure-n="1000">
              ×1000
            </button>
            <button className="btn-secondary" id="btn-reset-stats" data-i18n="common.reset">
              Reset
            </button>
          </div>
          <div className="convergence-note" id="convergence-note" />
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="measure.confirmOddsBody">
            This is the only way to actually confirm those odds — ask the same question of many identical qubits and watch the histogram settle into the predicted split. A single qubit only ever gives you one answer; the pattern only shows up across a crowd.
          </p>
        </div>
      </div>
      <div className="lesson-embed" id="lesson-embed-measure" />
    </section>
  );
}
