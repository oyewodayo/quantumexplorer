import LessonEmbed from '../LessonEmbed.jsx';

export default function SterngerlachTab() {
  return (
    <section id="tab-sterngerlach" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="sterngerlach.title">
          Stern–Gerlach Experiment
        </h1>
        <p className="compare-subtitle" data-i18n="sterngerlach.subtitle">
          Send atoms one at a time through a magnetic field and watch spin — a purely quantum property — reveal itself as a small number of discrete spots, never a continuous smear
        </p>
      </div>
      <div className="sterngerlach-layout">
        <div className="card">
          <div className="card-title" data-i18n="sterngerlach.definitionTitle">
            What Is Spin?
          </div>
          <p className="bit-explainer" data-i18n="sterngerlach.definitionBody1">
            Spin is an intrinsic form of angular momentum carried by every elementary particle and atom — not a literal physical rotation, but a genuine, permanent property present even for a particle with no internal structure to spin. It is quantized: a measurement of spin along any chosen axis can return only one of a small, fixed set of discrete values, never a continuously variable one. For a spin-½ particle, such as the unpaired electron responsible for a silver atom's magnetic moment, that measurement has exactly two possible outcomes — conventionally labeled "up" and "down" along the measured axis — with the probability of each fixed by the atom's quantum state via the Born rule, the same rule that governs every measurement outcome elsewhere in this app.
          </p>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="sterngerlach.definitionBody2">
            The Stern–Gerlach experiment (1922) was the first direct observation of this quantization: a beam of silver atoms sent through a magnetic field with a strong spatial gradient split into exactly two discrete spots on a detector screen, rather than the continuous smear a classical, arbitrarily-oriented magnetic moment would have produced. The interactive apparatus below reproduces that same measurement, one atom at a time.
          </p>
        </div>
        <div className="sterngerlach-canvas-card">
          <svg id="sg-svg" viewBox="0 0 860 340" role="img" aria-label="Diagram of silver atoms entering a Stern-Gerlach magnet with a sharp knife-edge south pole above and a broad curved north pole below, splitting the beam toward an Up or Down outcome. The atoms can come straight from an oven with adjustable input spin, or already pre-measured with the axis of this magnet selectable, to test whether a second measurement disturbs a spin that was already definite." data-i18n="sterngerlach.svgAlt" data-i18n-attr="aria-label">
            <defs>
              <marker id="sg-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
              <marker id="sg-field-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="var(--zero)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
              <radialGradient id="sg-atom-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C7D2DB" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#C7D2DB" stopOpacity="0" />
              </radialGradient>
              <pattern id="sg-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--text3)" strokeWidth="1.2" opacity="0.55" />
              </pattern>
              <linearGradient id="sg-metal-sheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
                <stop offset="14%" stopColor="#fff" stopOpacity="0.1" />
                <stop offset="55%" stopColor="#000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
              </linearGradient>
              <linearGradient id="sg-glass-sheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
                <stop offset="30%" stopColor="#fff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
              </linearGradient>
              <radialGradient id="sg-heat-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#ff8a3d" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="sg-vignette" cx="42%" cy="48%" r="75%">
                <stop offset="0%" stopColor="var(--surface2)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--surface2)" stopOpacity="0" />
              </radialGradient>
              <clipPath id="sg-clip-up">
                <rect x="735" y="55" width="70" height="50" rx="16" />
              </clipPath>
              <clipPath id="sg-clip-down">
                <rect x="735" y="235" width="70" height="50" rx="16" />
              </clipPath>
            </defs>
            <rect x="0" y="0" width="860" height="340" fill="url(#sg-vignette)" pointerEvents="none" />
            <g id="sg-intake-group">
              <circle className="sg-heat-glow" cx="56" cy="170" r="55" fill="url(#sg-heat-glow)" pointerEvents="none" />
              <rect x="16" y="140" width="80" height="60" rx="4" fill="var(--surface2)" stroke="var(--border2)" strokeWidth="1.2" />
              <rect x="16" y="140" width="80" height="60" rx="4" fill="url(#sg-hatch)" />
              <rect x="16" y="140" width="80" height="60" rx="4" fill="url(#sg-metal-sheen)" pointerEvents="none" />
              <text x="56" y="218" textAnchor="middle" fontSize="12" fontWeight="500" fill="var(--text)" data-i18n="sterngerlach.atomSource">
                Oven
              </text>
              <line className="sg-beam" x1="98" y1="170" x2="162" y2="170" stroke="#C7D2DB" strokeWidth="3" strokeLinecap="round" markerEnd="url(#sg-arr)" opacity="0.7" />
              <g className="sg-particle-stream">
                <circle className="sg-particle" cx="98" cy="170" r="1.6" fill="#C7D2DB" style={{'--dx': "64px", animationDelay: "0s"}} />
                <circle className="sg-particle" cx="98" cy="170" r="1.6" fill="#C7D2DB" style={{'--dx': "64px", animationDelay: "-0.5s"}} />
                <circle className="sg-particle" cx="98" cy="170" r="1.6" fill="#C7D2DB" style={{'--dx': "64px", animationDelay: "-1s"}} />
              </g>
              <text x="130" y="155" textAnchor="middle" fontSize="11" fill="var(--text2)" data-i18n="sterngerlach.silverAtomsArrow">
                Silver atoms
              </text>
              <g fill="var(--surface2)" stroke="var(--border2)" strokeWidth="1.2">
                <rect x="176" y="90" width="10" height="64" />
                <rect x="176" y="186" width="10" height="64" />
                <rect x="202" y="90" width="10" height="72" />
                <rect x="202" y="178" width="10" height="72" />
              </g>
              <g fill="url(#sg-metal-sheen)" pointerEvents="none">
                <rect x="176" y="90" width="10" height="64" />
                <rect x="176" y="186" width="10" height="64" />
                <rect x="202" y="90" width="10" height="72" />
                <rect x="202" y="178" width="10" height="72" />
              </g>
              <text x="196" y="76" textAnchor="middle" fontSize="11" fill="var(--text2)" data-i18n="sterngerlach.collimatingSlits">
                Collimating slits
              </text>
              <line className="sg-beam" x1="220" y1="170" x2="296" y2="170" stroke="#C7D2DB" strokeWidth="3" strokeLinecap="round" markerEnd="url(#sg-arr)" opacity="0.7" />
              <g className="sg-particle-stream">
                <circle className="sg-particle" cx="220" cy="170" r="1.6" fill="#C7D2DB" style={{'--dx': "76px", animationDelay: "-0.2s"}} />
                <circle className="sg-particle" cx="220" cy="170" r="1.6" fill="#C7D2DB" style={{'--dx': "76px", animationDelay: "-0.7s"}} />
                <circle className="sg-particle" cx="220" cy="170" r="1.6" fill="#C7D2DB" style={{'--dx': "76px", animationDelay: "-1.2s"}} />
              </g>
            </g>
            <g id="sg-prepared-group" style={{display: "none"}}>
              <rect x="16" y="140" width="180" height="60" rx="6" fill="var(--surface2)" stroke="var(--border2)" strokeWidth="1" />
              <rect x="16" y="140" width="180" height="60" rx="6" fill="url(#sg-metal-sheen)" pointerEvents="none" />
              <text x="106" y="164" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="var(--text)" data-i18n="sterngerlach.preparedLabel">
                prepared: spin ↑ (Z)
              </text>
              <text x="106" y="184" textAnchor="middle" fontSize="10" fill="var(--text2)" data-i18n="sterngerlach.blockedLabel">
                ("down" half blocked)
              </text>
              <line className="sg-beam" x1="196" y1="170" x2="296" y2="170" stroke="#C7D2DB" strokeWidth="3" strokeLinecap="round" markerEnd="url(#sg-arr)" opacity="0.7" />
              <g className="sg-particle-stream">
                <circle className="sg-particle" cx="196" cy="170" r="1.6" fill="#C7D2DB" style={{'--dx': "100px", animationDelay: "0s"}} />
                <circle className="sg-particle" cx="196" cy="170" r="1.6" fill="#C7D2DB" style={{'--dx': "100px", animationDelay: "-0.6s"}} />
                <circle className="sg-particle" cx="196" cy="170" r="1.6" fill="#C7D2DB" style={{'--dx': "100px", animationDelay: "-1.1s"}} />
              </g>
            </g>
            <path d="M300,90 L600,90 L600,128 L575,152 L325,152 L300,128 Z" fill="var(--surface2)" stroke="var(--border2)" strokeWidth="1.2" />
            <path d="M300,90 L600,90 L600,128 L575,152 L325,152 L300,128 Z" fill="url(#sg-metal-sheen)" pointerEvents="none" />
            <path d="M600,128 L575,152 L325,152 L300,128" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1" pointerEvents="none" />
            <text x="450" y="112" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="700" fill="var(--zero)">
              S
            </text>
            <path d="M300,250 L600,250 L600,212 L575,188 Q462,222 325,188 L300,212 Z" fill="var(--surface2)" stroke="var(--border2)" strokeWidth="1.2" />
            <path d="M300,250 L600,250 L600,212 L575,188 Q462,222 325,188 L300,212 Z" fill="url(#sg-metal-sheen)" pointerEvents="none" />
            <text x="450" y="234" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="700" fill="var(--one)">
              N
            </text>
            <g className="sg-field-fan" stroke="var(--zero)" strokeWidth="1.3" opacity="0.55" fill="none" markerEnd="url(#sg-field-arr)">
              <path d="M357,182 Q365,172 375,159" />
              <path d="M375,185 Q375,172 375,159" />
              <path d="M393,182 Q385,172 375,159" />
              <path d="M457,182 Q465,172 475,159" />
              <path d="M475,185 Q475,172 475,159" />
              <path d="M493,182 Q485,172 475,159" />
              <path d="M532,182 Q540,172 550,159" />
              <path d="M550,185 Q550,172 550,159" />
              <path d="M568,182 Q560,172 550,159" />
            </g>
            <text id="sg-magnet-caption" x="450" y="272" textAnchor="middle" fontSize="11" fill="var(--text2)" data-i18n="sterngerlach.magnetLabel">
              Inhomogeneous field
            </text>
            <line className="sg-path-ghost" x1="600" y1="162" x2="732" y2="86" stroke="var(--zero)" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" markerEnd="url(#sg-arr)" />
            <line className="sg-path-ghost" x1="600" y1="178" x2="732" y2="254" stroke="var(--one)" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" markerEnd="url(#sg-arr)" />
            <rect x="735" y="55" width="70" height="50" rx="16" fill="var(--zero-dim)" stroke="var(--zero)" strokeWidth="1" />
            <rect x="735" y="55" width="70" height="50" rx="16" fill="url(#sg-glass-sheen)" pointerEvents="none" />
            <g id="sg-marks-up" clipPath="url(#sg-clip-up)" />
            <circle id="sg-ping-up" className="sg-ping" cx="770" cy="80" r="26" fill="none" stroke="var(--zero)" strokeWidth="2" opacity="0" />
            <rect id="sg-flash-up" x="735" y="55" width="70" height="50" rx="16" fill="var(--zero)" opacity="0" />
            <text id="sg-det-up-symbol" x="770" y="80" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
              ↑
            </text>
            <text id="sg-det-up-caption" x="770" y="33" textAnchor="middle" fontSize="12" fill="var(--text2)" data-i18n="sterngerlach.detectorUp">
              Up detector
            </text>
            <rect x="735" y="235" width="70" height="50" rx="16" fill="var(--one-dim)" stroke="var(--one)" strokeWidth="1" />
            <rect x="735" y="235" width="70" height="50" rx="16" fill="url(#sg-glass-sheen)" pointerEvents="none" />
            <g id="sg-marks-down" clipPath="url(#sg-clip-down)" />
            <circle id="sg-ping-down" className="sg-ping" cx="770" cy="260" r="26" fill="none" stroke="var(--one)" strokeWidth="2" opacity="0" />
            <rect id="sg-flash-down" x="735" y="235" width="70" height="50" rx="16" fill="var(--one)" opacity="0" />
            <text id="sg-det-down-symbol" x="770" y="260" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--one)">
              ↓
            </text>
            <text id="sg-det-down-caption" x="770" y="308" textAnchor="middle" fontSize="12" fill="var(--text2)" data-i18n="sterngerlach.detectorDown">
              Down detector
            </text>
            <g id="sg-atom-ghost" opacity="0">
              <circle r="10" fill="url(#sg-atom-glow)" />
              <circle r="3.5" fill="#C7D2DB" />
            </g>
            <g id="sg-atom" opacity="0">
              <circle r="14" fill="url(#sg-atom-glow)" />
              <circle r="5.5" fill="#C7D2DB" />
            </g>
          </svg>
          <div className="sterngerlach-actions">
            <button className="btn-run" id="btn-fire-atom" data-i18n="sterngerlach.fireAtom">
              Fire atom
            </button>
            <span className="muted-text" id="sg-result">
              —
            </span>
          </div>
        </div>
        <div className="sterngerlach-controls-grid">
          <div className="card">
            <div className="card-title" data-i18n="sterngerlach.magnetCountTitle">
              Number of Magnets
            </div>
            <div className="mode-grid" style={{gridTemplateColumns: "1fr 1fr", margin: "6px 0 12px"}}>
              <button className="preset-btn mode-btn active" data-sg-magnets="1" data-i18n="sterngerlach.oneMagnet">
                1 magnet
              </button>
              <button className="preset-btn mode-btn" data-sg-magnets="2" data-i18n="sterngerlach.twoMagnets">
                2 magnets (sequential)
              </button>
            </div>
            <div id="sg-theta-block">
              <div className="muted-text" data-i18n="sterngerlach.inputSpinTitle">
                Input Spin Angle
              </div>
              <div className="slider-group" style={{margin: "6px 0 10px"}}>
                <div className="slider-row">
                  <span className="slider-sym">
                    θ
                  </span>
                  <input type="range" id="sg-theta-slider" min="0" max="3141" defaultValue="0" />
                  <span className="slider-val" id="sg-theta-val">
                    0°
                  </span>
                </div>
              </div>
              <p className="bit-explainer" data-i18n="sterngerlach.inputSpinBody">
                Same θ as the Bloch sphere — θ = 0° prepares spin certainly up, θ = 180° certainly down, and anything in between is a genuine superposition of the two.
              </p>
              <div className="prob-rows" style={{marginTop: "8px"}}>
                <div className="prob-row">
                  <span className="ket zero-color">
                    ↑
                  </span>
                  <div className="track">
                    <div className="fill zero-fill" id="sg-fill-up" style={{width: "100%"}} />
                  </div>
                  <span className="pct" id="sg-pct-up-live">
                    100%
                  </span>
                </div>
                <div className="prob-row">
                  <span className="ket one-color">
                    ↓
                  </span>
                  <div className="track">
                    <div className="fill one-fill" id="sg-fill-down" style={{width: "0%"}} />
                  </div>
                  <span className="pct" id="sg-pct-down-live">
                    0%
                  </span>
                </div>
              </div>
            </div>
            <div id="sg-axis-block" style={{display: "none"}}>
              <div className="muted-text" data-i18n="sterngerlach.sequentialTitle">
                Measuring Twice: Why Order Matters
              </div>
              <p className="bit-explainer" style={{marginTop: "4px"}} data-i18n="sterngerlach.sequentialIntro">
                The atom above already has a definite spin — it's the "up" output of a first magnet (not shown), with the "down" half physically blocked. Choose this magnet's axis to see whether measuring it again disturbs that spin.
              </p>
              <div className="mode-grid" style={{gridTemplateColumns: "1fr 1fr", margin: "10px 0 4px"}}>
                <button className="preset-btn mode-btn active" data-sg-axis="z" data-i18n="sterngerlach.sameAxis">
                  Same axis (Z)
                </button>
                <button className="preset-btn mode-btn" data-sg-axis="x" data-i18n="sterngerlach.differentAxis">
                  Different axis (X)
                </button>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">
              <span data-i18n="sterngerlach.detectorTally">
                Detector Tally
              </span>
              <span className="muted-text" id="sg-trial-count" />
            </div>
            <div className="histogram">
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar zero-fill" id="sg-hist-up" />
                </div>
                <span className="ket zero-color" id="sg-tally-sym-up">
                  ↑
                </span>
                <span className="pct" id="sg-pct-up">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar one-fill" id="sg-hist-down" />
                </div>
                <span className="ket one-color" id="sg-tally-sym-down">
                  ↓
                </span>
                <span className="pct" id="sg-pct-down">
                  —
                </span>
              </div>
            </div>
            <button className="btn-secondary" id="btn-reset-sterngerlach" data-i18n="common.reset">
              Reset
            </button>
          </div>
          <div className="card explainer-card">
            <div className="card-title" data-i18n="common.whatJustHappened">
              What just happened
            </div>
            <p className="bit-explainer" id="sg-explainer">
              An atom is about to enter the magnet. Fire it and watch which detector clicks.
            </p>
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="sterngerlach.whyTwoSpotsTitle">
            Why Only Two Spots?
          </div>
          <p className="bit-explainer" data-i18n="sterngerlach.whyTwoSpotsBody" data-i18n-html="">
            The deflecting force comes from the field's{' '}
            <em>
              gradient
            </em>
            , not just its strength: F
            <sub>
              z
            </sub>
            {' '}≈ μ
            <sub>
              z
            </sub>
            ·∂B
            <sub>
              z
            </sub>
            /∂z, where μ
            <sub>
              z
            </sub>
            {' '}is the atom's magnetic moment along the field axis. A uniform field (∂B
            <sub>
              z
            </sub>
            /∂z = 0) would exert no net force at all, no matter which way the moment pointed — which is exactly why the two poles above are shaped differently instead of just being strong magnets: only a genuinely inhomogeneous field produces any deflection.
          </p>
          <div className="formula" style={{marginTop: "10px"}} data-i18n="sterngerlach.whyTwoSpotsFormula" data-i18n-html="">
            F
            <sub>
              z
            </sub>
            {' '}≈ μ
            <sub>
              z
            </sub>
            {' '}(∂B
            <sub>
              z
            </sub>
            {' '}/ ∂z) if B is uniform ⇒ F = 0
          </div>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="sterngerlach.whyTwoSpotsBody2" data-i18n-html="">
            Classically, μ
            <sub>
              z
            </sub>
            {' '}could point in any direction, so a beam of randomly-oriented atoms should smear continuously across the screen, from fully deflected up to fully deflected down. When Stern and Gerlach actually ran this experiment in 1922, silver atoms landed in exactly two discrete spots — nothing in between, no matter how the magnet was tilted. That's the same quantization already built into every qubit in this app: a measurement returns one of exactly two outcomes, never a partial result.
          </p>
        </div>
      </div>
      <LessonEmbed id="sterngerlach" />
    </section>
  );
}
