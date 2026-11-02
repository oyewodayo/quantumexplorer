// Generated from the original index.html markup; edit freely.
export default function TunnelTab() {
  return (
    <section id="tab-tunnel" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="tunnel.title">
          Quantum Tunneling
        </h1>
        <p className="compare-subtitle" data-i18n="tunnel.subtitle">
          Fire a wave packet at a wall taller than its own energy. Classically it always bounces. Quantum mechanically, a piece of it slips through anyway
        </p>
      </div>
      <div className="tunnel-layout">
        <div className="tunnel-canvas-card">
          <canvas id="tunnel-canvas" width="820" height="240" role="img" aria-label="Animated plot of a quantum wave packet's probability cloud approaching and partly tunneling through a potential barrier, with live reflected/transmitted percentages shown below." />
          <div className="tunnel-stats">
            <div className="tunnel-stat">
              <span className="stat-dot" style={{background: "var(--zero)"}} />
              <span className="stat-label" data-i18n="tunnel.reflected">
                Reflected
              </span>
              <span className="stat-val" id="tunnel-refl">
                —
              </span>
            </div>
            <div className="tunnel-stat">
              <span className="stat-dot" style={{background: "var(--one)"}} />
              <span className="stat-label" data-i18n="tunnel.transmitted">
                Transmitted
              </span>
              <span className="stat-val" id="tunnel-trans">
                —
              </span>
            </div>
          </div>
          <div className="tunnel-history-row">
            <div className="tunnel-history-head">
              <span className="tunnel-history-title">
                <span data-i18n="tunnel.runHistory">
                  Run history
                </span>
                <span className="muted-text" id="tunnel-history-count" />
              </span>
              <button className="btn-secondary tunnel-history-clear" id="btn-clear-tunnel-history" data-i18n="tunnel.clearHistory">
                Clear
              </button>
            </div>
            <div className="tunnel-history" id="tunnel-history" role="img" aria-label="Bar chart of reflected versus transmitted percentage for each completed run, most recent on the right." />
          </div>
          <div className="tunnel-validation-badge">
            <span className="tunnel-validation-check" aria-hidden="true">
              ✓
            </span>
            <span data-i18n="tunnel.validationNote">
              Solver validated automatically: probability conserved to &lt;0.3% over a full run; transmission correctly falls from &gt;10% at V₀=E to &lt;2% at V₀=2.5E.
            </span>
          </div>
        </div>
        <div className="tunnel-controls-grid">
          <div className="card">
            <div className="card-title" data-i18n="tunnel.barrier">
              Barrier
            </div>
            <div className="slider-group">
              <div className="slider-row">
                <span className="slider-sym">
                  V₀
                </span>
                <input type="range" id="tunnel-height" min="0" max="250" defaultValue="100" />
                <span className="slider-val" id="tunnel-height-val">
                  1.00×E
                </span>
              </div>
              <div className="slider-row">
                <span className="slider-sym">
                  w
                </span>
                <input type="range" id="tunnel-width" min="4" max="40" defaultValue="14" />
                <span className="slider-val" id="tunnel-width-val">
                  14
                </span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title" data-i18n="common.controls">
              Controls
            </div>
            <div className="tunnel-btn-row">
              <button className="btn-run" id="tunnel-play-btn">
                ⏸ Pause
              </button>
              <button className="btn-secondary" id="btn-fire-tunnel" data-i18n="tunnel.fireAgain">
                ↻ Fire again
              </button>
            </div>
          </div>
          <div className="card explainer-card">
            <div className="card-title" data-i18n="common.whatJustHappened">
              What just happened
            </div>
            <p className="bit-explainer" id="tunnel-explainer">
              A wave packet is about to launch toward a barrier. Watch the probability cloud — not a solid ball — hit the wall.
            </p>
          </div>
        </div>
      </div>
      <div className="lesson-embed" id="lesson-embed-tunnel" />
    </section>
  );
}
