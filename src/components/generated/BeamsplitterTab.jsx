import LessonEmbed from '../LessonEmbed.jsx';

export default function BeamsplitterTab() {
  return (
    <section id="tab-beamsplitter" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="beamsplitter.title">
          Beam Splitter
        </h1>
        <p className="compare-subtitle" data-i18n="beamsplitter.subtitle">
          A single photon hits a 50/50 beam splitter and is randomly reflected to detector A or transmitted to detector B — one photon, one random outcome, never a photon split in half
        </p>
      </div>
      <div className="beamsplitter-layout">
        <div className="beamsplitter-canvas-card">
          <svg id="beamsplitter-svg" viewBox="0 0 680 380" role="img" aria-label="Diagram of a photon source firing at a 50/50 beam splitter, randomly reflected up to detector A or transmitted right to detector B. A faint duplicate briefly appears on the path not taken, illustrating the superposition that existed before the photon was detected." data-i18n="beamsplitter.svgAlt" data-i18n-attr="aria-label">
            <defs>
              <marker id="bs-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
              <radialGradient id="bs-photon-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5A623" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="bs-glass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--text2)" stopOpacity="0.18" />
                <stop offset="45%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="var(--text2)" stopOpacity="0.18" />
              </linearGradient>
              <filter id="bs-soft-blur" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <linearGradient id="bs-glass-sheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
                <stop offset="25%" stopColor="#fff" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
              </linearGradient>
              <radialGradient id="bs-emit-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5A623" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
              </radialGradient>
              <clipPath id="bs-clip-a">
                <rect x="345" y="55" width="70" height="55" rx="16" />
              </clipPath>
              <clipPath id="bs-clip-b">
                <rect x="555" y="253" width="65" height="55" rx="16" />
              </clipPath>
            </defs>
            <circle className="bs-emit-glow" cx="115" cy="280" r="60" fill="url(#bs-emit-glow)" pointerEvents="none" />
            <rect x="40" y="255" width="150" height="50" rx="8" fill="var(--surface2)" stroke="var(--border2)" strokeWidth="1" />
            <rect x="40" y="255" width="150" height="50" rx="8" fill="url(#bs-glass-sheen)" pointerEvents="none" />
            <text x="115" y="280" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="500" fill="var(--text)" data-i18n="beamsplitter.photonSource">
              Photon source
            </text>
            <line className="bs-beam" x1="190" y1="280" x2="352" y2="280" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" markerEnd="url(#bs-arr)" opacity="0.7" />
            <g className="bs-particle-stream">
              <circle className="bs-particle" cx="190" cy="280" r="1.6" fill="#F5A623" style={{'--dx': "162px", animationDelay: "0s"}} />
              <circle className="bs-particle" cx="190" cy="280" r="1.6" fill="#F5A623" style={{'--dx': "162px", animationDelay: "-0.5s"}} />
              <circle className="bs-particle" cx="190" cy="280" r="1.6" fill="#F5A623" style={{'--dx': "162px", animationDelay: "-1s"}} />
            </g>
            <line className="bs-path-ghost" x1="380" y1="272" x2="380" y2="118" stroke="var(--zero)" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" markerEnd="url(#bs-arr)" />
            <text x="300" y="195" textAnchor="middle" fontSize="12" fill="var(--text2)" data-i18n="beamsplitter.reflected">
              reflected
            </text>
            <line className="bs-path-ghost" x1="388" y1="280" x2="552" y2="280" stroke="var(--one)" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" markerEnd="url(#bs-arr)" />
            <text x="470" y="265" textAnchor="middle" fontSize="12" fill="var(--text2)" data-i18n="beamsplitter.transmitted">
              transmitted
            </text>
            <rect x="358" y="271" width="60" height="18" rx="4" fill="url(#bs-glass)" transform="rotate(45 380 280)" filter="url(#bs-soft-blur)" opacity="0.8" />
            <rect x="358" y="271" width="60" height="18" rx="4" fill="url(#bs-glass)" stroke="var(--border2)" strokeWidth="1.2" transform="rotate(45 380 280)" />
            <text x="380" y="325" textAnchor="middle" fontSize="12" fill="var(--text2)" data-i18n="beamsplitter.beamSplitterLabel">
              Beam splitter
            </text>
            <rect x="345" y="55" width="70" height="55" rx="16" fill="var(--zero-dim)" stroke="var(--zero)" strokeWidth="1" />
            <rect x="345" y="55" width="70" height="55" rx="16" fill="url(#bs-glass-sheen)" pointerEvents="none" />
            <g id="bs-marks-a" clipPath="url(#bs-clip-a)" />
            <circle id="bs-ping-a" className="bs-ping" cx="380" cy="82" r="26" fill="none" stroke="var(--zero)" strokeWidth="2" opacity="0" />
            <rect id="bs-flashA" x="345" y="55" width="70" height="55" rx="16" fill="var(--zero)" opacity="0" />
            <text x="380" y="82" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="500" fill="var(--zero)">
              A
            </text>
            <text x="380" y="35" textAnchor="middle" fontSize="12" fill="var(--text2)" data-i18n="beamsplitter.detectorA">
              Photon detector A
            </text>
            <rect x="555" y="253" width="65" height="55" rx="16" fill="var(--one-dim)" stroke="var(--one)" strokeWidth="1" />
            <rect x="555" y="253" width="65" height="55" rx="16" fill="url(#bs-glass-sheen)" pointerEvents="none" />
            <g id="bs-marks-b" clipPath="url(#bs-clip-b)" />
            <circle id="bs-ping-b" className="bs-ping" cx="587" cy="280" r="26" fill="none" stroke="var(--one)" strokeWidth="2" opacity="0" />
            <rect id="bs-flashB" x="555" y="253" width="65" height="55" rx="16" fill="var(--one)" opacity="0" />
            <text x="587" y="280" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="500" fill="var(--one)">
              B
            </text>
            <text x="587" y="325" textAnchor="middle" fontSize="12" fill="var(--text2)" data-i18n="beamsplitter.detectorB">
              Photon detector B
            </text>
            <g id="bs-photon-ghost" opacity="0">
              <circle r="10" fill="url(#bs-photon-glow)" />
              <circle r="3.5" fill="#F5A623" />
            </g>
            <g id="bs-photon" opacity="0">
              <circle r="14" fill="url(#bs-photon-glow)" />
              <circle r="5.5" fill="#F5A623" />
            </g>
          </svg>
          <div className="beamsplitter-actions">
            <button className="btn-run" id="btn-fire-photon" data-i18n="beamsplitter.firePhoton">
              Fire photon
            </button>
            <span className="muted-text" id="beamsplitter-result">
              —
            </span>
          </div>
        </div>
        <div className="beamsplitter-controls-grid">
          <div className="card">
            <div className="card-title">
              <span data-i18n="beamsplitter.detectorTally">
                Detector Tally
              </span>
              <span className="muted-text" id="beamsplitter-trial-count" />
            </div>
            <div className="histogram">
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar zero-fill" id="bs-hist-a" />
                </div>
                <span className="ket zero-color">
                  A
                </span>
                <span className="pct" id="bs-pct-a">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar one-fill" id="bs-hist-b" />
                </div>
                <span className="ket one-color">
                  B
                </span>
                <span className="pct" id="bs-pct-b">
                  —
                </span>
              </div>
            </div>
            <button className="btn-secondary" id="btn-reset-beamsplitter" data-i18n="common.reset">
              Reset
            </button>
          </div>
          <div className="card explainer-card">
            <div className="card-title" data-i18n="common.whatJustHappened">
              What just happened
            </div>
            <p className="bit-explainer" id="beamsplitter-explainer">
              A photon is about to launch toward the beam splitter. Fire it and watch which detector clicks.
            </p>
          </div>
        </div>
      </div>
      <LessonEmbed id="beamsplitter" />
    </section>
  );
}
