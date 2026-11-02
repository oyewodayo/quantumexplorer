import LessonEmbed from '../LessonEmbed.jsx';

export default function NoiseTab() {
  return (
    <section id="tab-noise" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="noise.title">
          Noise & Decoherence
        </h1>
        <p className="compare-subtitle" data-i18n="noise.subtitle">
          The loss of quantum coherence through unwanted interaction with the environment — the dominant practical obstacle to building reliable, large-scale quantum computers
        </p>
      </div>
      <div className="noise-layout">
        <div className="card">
          <div className="card-title" data-i18n="noise.definitionTitle">
            What Is Quantum Decoherence?
          </div>
          <p className="bit-explainer" data-i18n="noise.definitionBody1">
            Quantum decoherence is the loss of quantum coherence: the process by which a system's phase information leaks into its surrounding environment through unwanted interaction, so that a state genuinely in superposition comes to behave, for all practical purposes, like a definite classical mixture. A system that is perfectly isolated stays in a pure state — one exactly described by a single state vector |ψ⟩ — indefinitely. Once it interacts with an uncontrolled environment, that guarantee no longer holds: the system becomes entangled with the environment's own many degrees of freedom, and tracing out everything except the system itself leaves a mixed state, described by a density matrix ρ rather than a single vector. Every other tab in this app treats gates and qubits as perfectly isolated in exactly that first sense; this one models what happens once they aren't.
          </p>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="noise.definitionBody2">
            On the Bloch sphere already used throughout this app, that loss of purity shows up as a shrinking vector — the same signature already seen for a qubit entangled with another (see the Entangle and Circuits tabs' reduced Bloch spheres), just caused here by an uncontrolled environment instead of a deliberate second qubit. Decoherence is the dominant practical obstacle to building large-scale, reliable quantum computers: every gate in a real circuit has to complete before the coherence it depends on has leaked away. The simulation below models two of its standard phenomenological channels, T₁ (relaxation) and T₂ (dephasing), evolving a single qubit's Bloch vector in real time.
          </p>
        </div>
        <div className="compare-layout noise-compare">
          <div className="compare-col">
            <div className="col-label">
              <span className="col-badge quantum-badge" data-i18n="noise.qubitBadge">
                Decohering qubit
              </span>
              <span className="col-desc" id="noise-state-desc">
                |+⟩
              </span>
            </div>
            <div className="bloch-wrap">
              <canvas id="bloch-noise" width="240" height="240" role="img" aria-label="Bloch sphere for a decohering qubit. Its vector shrinks and drifts toward the north pole over time as simulated noise accumulates." />
              <div className="state-label" id="label-noise">
                |+⟩
              </div>
            </div>
          </div>
          <div className="compare-divider">
            <div className="divider-line" />
            <div className="divider-vs" aria-hidden="true">
              ⏱
            </div>
            <div className="divider-line" />
          </div>
          <div className="compare-col">
            <div className="card-title" data-i18n="noise.statsTitle">
              Live Readout
            </div>
            <div className="noise-stats">
              <div className="noise-stat">
                <span className="noise-stat-label" data-i18n="noise.elapsed">
                  Elapsed time
                </span>
                <span className="noise-stat-val" id="noise-elapsed-val">
                  0.0 μs
                </span>
              </div>
              <div className="noise-stat">
                <span className="noise-stat-label" data-i18n="noise.vectorLength">
                  Bloch vector length
                </span>
                <span className="noise-stat-val" id="noise-r-val">
                  1.00
                </span>
              </div>
              <div className="noise-stat">
                <span className="noise-stat-label" data-i18n="noise.purity">
                  Purity Tr(ρ²)
                </span>
                <span className="noise-stat-val" id="noise-purity-val">
                  100%
                </span>
              </div>
            </div>
            <div className="track noise-purity-track">
              <div className="fill zero-fill" id="noise-purity-fill" style={{width: "100%"}} />
            </div>
            <div className="card-title" style={{marginTop: "16px"}} data-i18n="noise.densityMatrix">
              Density Matrix ρ
            </div>
            <div className="noise-matrix" id="noise-matrix" role="img" aria-label="2 by 2 density matrix of the qubit, updating live as it decoheres.">
              <span id="noise-rho-00">
                0.50
              </span>
              <span id="noise-rho-01">
                0.50
              </span>
              <span id="noise-rho-10">
                0.50
              </span>
              <span id="noise-rho-11">
                0.50
              </span>
            </div>
          </div>
        </div>
        <div className="noise-controls-grid">
          <div className="card">
            <div className="card-title" data-i18n="noise.initialStateTitle">
              Initial State
            </div>
            <div className="preset-grid preset-grid--2col">
              <button className="preset-btn" data-noise-preset="" data-theta-mult="0" data-phi-mult="0">
                |0⟩
              </button>
              <button className="preset-btn" data-noise-preset="" data-theta-mult="1" data-phi-mult="0">
                |1⟩
              </button>
              <button className="preset-btn is-active" data-noise-preset="" data-theta-mult="0.5" data-phi-mult="0">
                |+⟩
              </button>
              <button className="preset-btn" data-noise-preset="" data-theta-mult="0.5" data-phi-mult="1">
                |-⟩
              </button>
            </div>
            <div className="slider-group" style={{marginTop: "10px"}}>
              <div className="slider-row">
                <span className="slider-sym">
                  θ
                </span>
                <input type="range" id="sl-noise-theta" min="0" max="3141" defaultValue="1571" />
                <span className="slider-val" id="val-noise-theta">
                  90°
                </span>
              </div>
              <div className="slider-row">
                <span className="slider-sym">
                  φ
                </span>
                <input type="range" id="sl-noise-phi" min="0" max="6283" defaultValue="0" />
                <span className="slider-val" id="val-noise-phi">
                  0°
                </span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title" data-i18n="noise.decayTimesTitle">
              Decay Times
            </div>
            <div className="slider-group">
              <div className="slider-row">
                <span className="slider-sym">
                  T₁
                </span>
                <input type="range" id="sl-noise-t1" min="5" max="200" defaultValue="80" />
                <span className="slider-val" id="val-noise-t1">
                  80 μs
                </span>
              </div>
              <div className="slider-row">
                <span className="slider-sym">
                  T₂
                </span>
                <input type="range" id="sl-noise-t2" min="5" max="200" defaultValue="60" />
                <span className="slider-val" id="val-noise-t2">
                  60 μs
                </span>
              </div>
            </div>
            <p className="muted-text" id="noise-t2-cap-note" style={{marginTop: "6px"}} />
            <div className="noise-btn-row">
              <button className="btn-run" id="noise-play-btn" data-i18n="noise.pauseBtn">
                ⏸ Pause
              </button>
              <button className="btn-secondary" id="btn-noise-restart" data-i18n="noise.restartBtn">
                ↻ Restart
              </button>
            </div>
          </div>
          <div className="card explainer-card">
            <div className="card-title" data-i18n="common.whatJustHappened">
              What just happened
            </div>
            <p className="bit-explainer" id="noise-explainer" data-i18n="noise.explainerDefault">
              Watch the Bloch vector shrink and drift toward the north pole — that shrinkage is real information loss, not just a visual effect. A shorter vector means the qubit's state is genuinely less certain, exactly the same "mixed state" idea already used for entangled qubits elsewhere in this app.
            </p>
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="noise.t1t2Title">
            T₁ vs. T₂ — Two Different Ways to Forget
          </div>
          <p className="bit-explainer" data-i18n="noise.t1t2Body">
            T₁ (relaxation) is how long the qubit takes to leak energy into its environment and settle toward |0⟩ — it's why the z-component of the Bloch vector drifts toward the north pole. T₂ (dephasing) is how long the qubit keeps track of the relative phase between |0⟩ and |1⟩ — it's why the x/y components, the part that actually carries superposition information, shrink away. Losing T₂ is often the bigger practical problem: a qubit can still "mostly" be |0⟩ or |1⟩ long after it's lost every trace of being in a genuine superposition.
          </p>
          <div className="formula" style={{marginTop: "10px"}} data-i18n="noise.t1t2Formula" data-i18n-html="">
            T₂ ≤ 2×T₁ (dephasing can never be slower than relaxation allows)
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="noise.whyMattersTitle">
            Why This Fight Never Stops on Real Hardware
          </div>
          <p className="bit-explainer" data-i18n="noise.whyMattersBody">
            Every other simulation in this app runs gates and measurements as mathematically perfect operations, because that's the right way to learn the ideas first. Real quantum processors — including the superconducting and trapped-ion devices CERN's own Quantum Technology Initiative experiments with for particle-physics simulation — only stay coherent for a limited window measured in exactly these T₁/T₂ numbers, typically tens to hundreds of microseconds. Every gate in a real circuit has to finish well inside that window, which is the entire reason quantum error correction and hardware-aware circuit design are active engineering problems, not solved ones.
          </p>
        </div>
      </div>
      <LessonEmbed id="noise" />
    </section>
  );
}
