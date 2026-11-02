// Generated from the original index.html markup; edit freely.
export default function InterferenceTab() {
  return (
    <section id="tab-interference" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="interference.title">
          Wave Interference
        </h1>
        <p className="compare-subtitle" data-i18n="interference.subtitle">
          Two open paths and a screen keeping score. Every dot on the right is one particle landing — yet together they paint a wave
        </p>
      </div>
      <div className="interference-layout">
        <div className="interference-main">
          <div className="ripple-wrap">
            <canvas id="ripple-canvas" width="360" height="260" role="img" aria-label="Animated ripple simulation of waves passing through one or two slits, showing the resulting interference pattern." />
          </div>
          <div className="screen-wrap">
            <canvas id="screen-canvas" width="86" height="260" role="img" aria-label="Detector screen accumulating individual particle-hit dots over time, building up the interference or single-slit pattern." />
            <div className="screen-label" data-i18n="interference.screen">
              Screen
            </div>
          </div>
        </div>
        <div className="right-panel">
          <div className="card">
            <div className="card-title" data-i18n="interference.setup">
              Setup
            </div>
            <div className="mode-grid">
              <button className="preset-btn mode-btn active" data-mode="double" data-i18n="interference.doubleSlit">
                Double slit
              </button>
              <button className="preset-btn mode-btn" data-mode="single" data-i18n="interference.singleSlit">
                Single slit
              </button>
              <button className="preset-btn mode-btn" data-mode="which-path" data-i18n="interference.whichPath">
                Which-path
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-title" data-i18n="interference.wave">
              Wave
            </div>
            <div className="slider-group">
              <div className="slider-row">
                <span className="slider-sym">
                  d
                </span>
                <input type="range" id="slit-sep" min="20" max="90" defaultValue="46" />
                <span className="slider-val" id="slit-sep-val">
                  46
                </span>
              </div>
              <div className="slider-row">
                <span className="slider-sym">
                  λ
                </span>
                <input type="range" id="wavelength" min="10" max="34" defaultValue="18" />
                <span className="slider-val" id="wavelength-val">
                  18
                </span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">
              <span data-i18n="common.detector">
                Detector
              </span>
              <span className="muted-text" id="interference-count" />
            </div>
            <button className="btn-secondary" id="btn-clear-screen" data-i18n="interference.clearAccumulation">
              Clear accumulation
            </button>
          </div>
          <div className="card explainer-card">
            <div className="card-title" data-i18n="common.whatJustHappened">
              What just happened
            </div>
            <p className="bit-explainer" id="interference-explainer">
              Both slits are open and the paths are indistinguishable. Watch the dots pile up one at a time — and slowly reveal stripes.
            </p>
          </div>
        </div>
      </div>
      <div className="card" style={{maxWidth: "960px", margin: "20px auto 0"}}>
        <div className="card-title" data-i18n="interference.physicsInDetail">
          The Physics, In Detail
        </div>
        <p className="bit-explainer" data-i18n="interference.body1" data-i18n-html="">
          Every dot on the screen is one particle landing at one spot — that part is completely ordinary. What isn't ordinary is{' '}
          <em>
            where
          </em>
          {' '}those dots are allowed to land. Fire particles at the double slit one at a time, with no way for two particles to ever meet mid-flight, and the dots still pile up into stripes. There's no crowd of particles interfering with each other — each individual particle's own wavefunction passes through{' '}
          <em>
            both
          </em>
          {' '}slits at once and interferes with itself. That's the actual mystery here, not just "waves make patterns."
        </p>
        <div className="formula" style={{marginTop: "12px"}} data-i18n="interference.formula" data-i18n-html="">
          I(y) = |A
          <sub>
            1
          </sub>
          (y) + A
          <sub>
            2
          </sub>
          (y)|² = |A
          <sub>
            1
          </sub>
          |² + |A
          <sub>
            2
          </sub>
          |² + 2|A
          <sub>
            1
          </sub>
          ||A
          <sub>
            2
          </sub>
          |cos φ(y)
        </div>
        <p className="bit-explainer" style={{marginTop: "12px"}} data-i18n="interference.body2" data-i18n-html="">
          A
          <sub>
            1
          </sub>
          {' '}and A
          <sub>
            2
          </sub>
          {' '}are the amplitudes for "the particle went through slit 1" and "through slit 2," and φ(y) is the extra distance one path travels to reach point y, converted to a phase. Classical probabilities would just add: P = P
          <sub>
            1
          </sub>
          {' '}+ P
          <sub>
            2
          </sub>
          , a flat pile with no stripes. Quantum amplitudes add first and get squared afterward — and squaring a sum produces that{' '}
          <strong>
            2|A
            <sub>
              1
            </sub>
            ||A
            <sub>
              2
            </sub>
            |cos φ
          </strong>
          {' '}cross term, which is positive at some y (bright fringes), negative at others (dark fringes), and is the entire reason stripes exist at all.
        </p>
        <p className="bit-explainer" style={{marginTop: "12px"}} data-i18n="interference.body3" data-i18n-html="">
          <strong>
            Double slit
          </strong>
          {' '}— both paths stay open and genuinely indistinguishable, so the cross term survives and you get fringes.{' '}
          <strong>
            Single slit
          </strong>
          {' '}— only one amplitude exists at all, so there's nothing for it to interfere with; I = |A
          <sub>
            1
          </sub>
          |², a plain diffraction blob.{' '}
          <strong>
            Which-path
          </strong>
          {' '}— both slits are still physically open, but tagging each particle's path (the small detector dots on the plate) means a which-path measurement now exists for every hit. Averaged over those measurements the cross term cancels exactly, leaving the flat I = |A
          <sub>
            1
          </sub>
          |² + |A
          <sub>
            2
          </sub>
          |² you'd expect from ordinary particles — two humps, no stripes. Nothing needs to physically jostle the particle for this to happen; merely making the path{' '}
          <em>
            knowable in principle
          </em>
          {' '}is enough to erase the pattern.
        </p>
        <p className="bit-explainer" style={{marginTop: "12px"}} data-i18n="interference.body4">
          That's why the ripple animation on the left and the dot-by-dot screen on the right are shown side by side: the ripples are the continuous wave picture that predicts where the cross term is constructive or destructive, and the screen is what actually gets measured — one random, all-or-nothing click at a time. The wave never lands anywhere; only the particle does. The stripes are the wave's fingerprint on where the particles were and weren't allowed to click.
        </p>
      </div>
      <div className="lesson-embed" id="lesson-embed-interference" />
    </section>
  );
}
