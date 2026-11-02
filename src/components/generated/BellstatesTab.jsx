import LessonEmbed from '../LessonEmbed.jsx';

export default function BellstatesTab() {
  return (
    <section id="tab-bellstates" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="bellstates.title">
          Bell States
        </h1>
        <p className="compare-subtitle" data-i18n="bellstates.subtitle">
          The four maximally entangled two-qubit states — pick one, prepare it, and watch its signature correlation appear across repeated measurements
        </p>
      </div>
      <div className="bellstates-layout">
        <div className="card">
          <div className="card-title" data-i18n="bellstates.pickTitle">
            Choose a Bell State
          </div>
          <div className="mode-grid" id="bellstate-picker" style={{gridTemplateColumns: "repeat(4,1fr)", maxWidth: "420px", margin: "0 auto 18px"}}>
            <button className="preset-btn mode-btn active" data-bell="phiplus">
              Φ⁺
            </button>
            <button className="preset-btn mode-btn" data-bell="phiminus">
              Φ⁻
            </button>
            <button className="preset-btn mode-btn" data-bell="psiplus">
              Ψ⁺
            </button>
            <button className="preset-btn mode-btn" data-bell="psiminus">
              Ψ⁻
            </button>
          </div>
          <div className="formula" id="bellstate-formula">
            |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
          </div>
          <p className="bit-explainer" style={{marginTop: "10px"}} id="bellstate-recipe">
            Start at |00⟩, apply H to qubit A, then CNOT (A → B).
          </p>
          <div className="card-title" style={{marginTop: "18px"}} data-i18n="bellstates.circuitTitle">
            Circuit Diagram
          </div>
          <svg id="bellstate-circuit" viewBox="0 0 460 150" role="img" aria-label="Circuit diagram: an X gate optionally on qubit A and/or B, then a Hadamard on qubit A, then a CNOT controlled by A targeting B." style={{width: "100%", maxWidth: "460px", display: "block", margin: "8px auto 0"}}>
            <defs>
              <linearGradient id="bellstate-metal-sheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
                <stop offset="14%" stopColor="#fff" stopOpacity="0.1" />
                <stop offset="55%" stopColor="#000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
              </linearGradient>
            </defs>
            <line x1="50" y1="45" x2="430" y2="45" stroke="var(--border2)" strokeWidth="2" />
            <line x1="50" y1="105" x2="430" y2="105" stroke="var(--border2)" strokeWidth="2" />
            <text x="26" y="51" fontSize="15" fontWeight="700" fill="var(--zero)" textAnchor="middle">
              A
            </text>
            <text x="26" y="111" fontSize="15" fontWeight="700" fill="var(--one)" textAnchor="middle">
              B
            </text>
            <g id="bellstate-gate-xa" className="circuit-gate">
              <rect x="90" y="25" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <rect x="90" y="25" width="40" height="40" rx="6" fill="url(#bellstate-metal-sheen)" pointerEvents="none" />
              <text x="110" y="51" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                X
              </text>
            </g>
            <g id="bellstate-gate-xb" className="circuit-gate">
              <rect x="90" y="85" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
              <rect x="90" y="85" width="40" height="40" rx="6" fill="url(#bellstate-metal-sheen)" pointerEvents="none" />
              <text x="110" y="111" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                X
              </text>
            </g>
            <g id="bellstate-gate-h" className="circuit-gate">
              <rect x="200" y="25" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <rect x="200" y="25" width="40" height="40" rx="6" fill="url(#bellstate-metal-sheen)" pointerEvents="none" />
              <text x="220" y="51" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                H
              </text>
            </g>
            <g id="bellstate-gate-cnot" className="circuit-gate">
              <line x1="320" y1="45" x2="320" y2="105" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="320" cy="45" r="7" fill="var(--text2)" />
              <circle cx="320" cy="45" r="7" fill="url(#bellstate-metal-sheen)" pointerEvents="none" />
              <circle cx="320" cy="105" r="15" fill="var(--surface)" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="320" cy="105" r="15" fill="url(#bellstate-metal-sheen)" pointerEvents="none" />
              <line x1="320" y1="92" x2="320" y2="118" stroke="var(--text2)" strokeWidth="2" />
              <line x1="307" y1="105" x2="333" y2="105" stroke="var(--text2)" strokeWidth="2" />
            </g>
            <path id="bellstate-entangle-link" className="bellstate-entangle-link" d="M 420,45 Q 452,75 420,105" />
            <g id="bellstate-token-a" className="bellstate-token token-hidden">
              <circle className="token-dot" cx="70" cy="45" r="12" fill="var(--zero)" />
              <text className="token-label" x="70" y="49">
                0
              </text>
            </g>
            <g id="bellstate-token-b" className="bellstate-token token-hidden">
              <circle className="token-dot" cx="70" cy="105" r="12" fill="var(--one)" />
              <text className="token-label" x="70" y="109">
                0
              </text>
            </g>
          </svg>
          <div className="circuit-actions" style={{marginTop: "10px", justifyContent: "center"}}>
            <button className="btn-run" id="btn-run-bellstate" data-i18n="common.run">
              ▶ Run
            </button>
            <span className="muted-text" id="bellstate-anim-status" />
          </div>
          <p className="bit-explainer mt-14" id="bellstate-anim-explainer" />
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="bellstates.familyTitle">
            The Bell Family
          </div>
          <p className="bit-explainer" data-i18n="bellstates.familyBody">
            Every Bell state sits at one of four corners, set by two independent choices: which row (same or opposite measurement outcomes) and which column (a + or − relative phase). Click any corner to prepare it.
          </p>
          <div className="bell-family-grid" id="bellstate-family" style={{marginTop: "14px"}}>
            <div className="bell-family-corner" />
            <div className="bell-family-colhead" data-i18n="bellstates.plusPhase">
              + phase
            </div>
            <div className="bell-family-colhead" data-i18n="bellstates.minusPhase">
              − phase
            </div>
            <div className="bell-family-rowhead" data-i18n="bellstates.sameRow">
              Same
            </div>
            <button className="bell-family-cell active" data-bell="phiplus">
              Φ⁺
            </button>
            <button className="bell-family-cell" data-bell="phiminus">
              Φ⁻
            </button>
            <div className="bell-family-rowhead" data-i18n="bellstates.oppositeRow">
              Opposite
            </div>
            <button className="bell-family-cell" data-bell="psiplus">
              Ψ⁺
            </button>
            <button className="bell-family-cell" data-bell="psiminus">
              Ψ⁻
            </button>
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="bellstates.distributionTitle">
            Probability Distribution
          </div>
          <p className="bit-explainer" id="bellstate-distribution-note" style={{marginBottom: "14px"}}>
            Exact Born-rule probabilities for |Φ⁺⟩ — no sampling needed, these follow directly from squaring each amplitude.
          </p>
          <div className="entangle-stats" id="bell-stats-rows">
            <div className="prob-row" data-ket="00">
              <span className="ket zero-color" style={{minWidth: "34px"}}>
                |00⟩
              </span>
              <div className="track">
                <div className="fill zero-fill" id="bstat-fill-00" style={{width: "0%"}} />
              </div>
              <span className="pct" id="bstat-pct-00">
                —
              </span>
            </div>
            <div className="prob-row" data-ket="01">
              <span className="ket mid-color" style={{minWidth: "34px"}}>
                |01⟩
              </span>
              <div className="track">
                <div className="fill mid-fill" id="bstat-fill-01" style={{width: "0%"}} />
              </div>
              <span className="pct" id="bstat-pct-01">
                —
              </span>
            </div>
            <div className="prob-row" data-ket="10">
              <span className="ket mid-color" style={{minWidth: "34px"}}>
                |10⟩
              </span>
              <div className="track">
                <div className="fill mid-fill" id="bstat-fill-10" style={{width: "0%"}} />
              </div>
              <span className="pct" id="bstat-pct-10">
                —
              </span>
            </div>
            <div className="prob-row" data-ket="11">
              <span className="ket one-color" style={{minWidth: "34px"}}>
                |11⟩
              </span>
              <div className="track">
                <div className="fill one-fill" id="bstat-fill-11" style={{width: "0%"}} />
              </div>
              <span className="pct" id="bstat-pct-11">
                —
              </span>
            </div>
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="bellstates.definitionsTitle">
            The Four Bell States
          </div>
          <div className="bit-explainer" data-i18n="bellstates.definitionsBody" data-i18n-html="">
            All four are built from the same |00⟩ starting point with the same two-gate recipe — a Hadamard on qubit A, then a CNOT controlled by it — just preceded by an X gate on whichever qubit(s) need flipping first:{' '}
            <ul className="quantum-list">
              <li>
                <b>
                  Φ⁺ = (|00⟩ + |11⟩)/√2
                </b>
                {' '}— no X gates. Outcomes always match.
              </li>
              <li>
                <b>
                  Φ⁻ = (|00⟩ − |11⟩)/√2
                </b>
                {' '}— X on qubit A first. Outcomes always match.
              </li>
              <li>
                <b>
                  Ψ⁺ = (|01⟩ + |10⟩)/√2
                </b>
                {' '}— X on qubit B first. Outcomes always opposite.
              </li>
              <li>
                <b>
                  Ψ⁻ = (|01⟩ − |10⟩)/√2
                </b>
                {' '}— X on both qubits first. Outcomes always opposite.
              </li>
            </ul>
            {' '}Together they form a complete orthonormal basis for two qubits — the core resource behind quantum teleportation and superdense coding.
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="bellstates.phaseNoteTitle">
            Why Doesn't the Minus Sign Show Up?
          </div>
          <p className="bit-explainer" data-i18n="bellstates.phaseNoteBody">
            Φ⁺ and Φ⁻ (and likewise Ψ⁺ and Ψ⁻) give identical probability distributions above, because a relative phase — the − sign — doesn't change any computational-basis probability, only |amplitude|² does. The two states are still physically distinct: the phase becomes visible the moment you interfere the qubits with each other, for example by applying a Hadamard to each qubit before measuring — that's exactly the extra step Bell-inequality tests and superdense coding rely on to tell all four states apart.
          </p>
        </div>
      </div>
      <LessonEmbed id="bellstates" />
    </section>
  );
}
