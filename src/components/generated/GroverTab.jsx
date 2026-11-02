import LessonEmbed from '../LessonEmbed.jsx';

export default function GroverTab() {
  return (
    <section id="tab-grover" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="grover.title">
          Grover's Search
        </h1>
        <p className="compare-subtitle" data-i18n="grover.subtitle">
          Finding one marked item among four with a single query, by amplifying its amplitude rather than checking items one at a time
        </p>
      </div>
      <div className="superdense-layout">
        <div className="card">
          <div className="card-title" data-i18n="grover.definitionTitle">
            What Is Grover's Search?
          </div>
          <p className="bit-explainer" data-i18n="grover.definitionBody1">
            Grover's algorithm searches an unsorted list of N items for one marked entry using roughly √N oracle queries, instead of the up to N a classical search needs in the worst case. It works by amplitude amplification: start every item in equal superposition, use an oracle to flip the sign of the marked item's amplitude alone, then use a fixed "diffusion" step to turn that invisible sign flip into a visible boost in measurement probability.
          </p>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="grover.definitionBody2">
            Toggle below between two concrete cases. N = 4 (2 qubits) is the smallest case where the result is exact: a single query brings the marked item's probability to exactly 1. N = 8 (3 qubits) is the smallest case where it visibly isn't: it takes two queries to reach a peak of only about 94.5%, and — proof this isn't just "not enough queries yet" — a third query would overshoot past that peak rather than improving on it.
          </p>
        </div>
        <div className="card">
          <div className="card-title" data-i18n="grover.circuitTitle">
            The Circuit
          </div>
          <div id="grover-circuit-n4-wrap">
            <svg id="grover-circuit" viewBox="0 0 600 180" role="img" aria-label="Circuit diagram: a Hadamard on each of two qubits, then an Oracle gate spanning both qubits, then the Grover diffusion operator — a Hadamard on each qubit, a reflection about the zero state spanning both qubits, and a Hadamard on each qubit again — then a measurement on each qubit." style={{width: "100%", maxWidth: "620px", display: "block", margin: "8px auto 0"}}>
              <defs>
                <linearGradient id="grover-metal-sheen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
                  <stop offset="14%" stopColor="#fff" stopOpacity="0.1" />
                  <stop offset="55%" stopColor="#000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
                </linearGradient>
              </defs>
              <line x1="50" y1="57" x2="530" y2="57" stroke="var(--border2)" strokeWidth="2" />
              <line x1="50" y1="117" x2="530" y2="117" stroke="var(--border2)" strokeWidth="2" />
              <text x="26" y="63" fontSize="14" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                q₀
              </text>
              <text x="26" y="123" fontSize="14" fontWeight="700" fill="var(--one)" textAnchor="middle">
                q₁
              </text>
              <text x="26" y="92" fontSize="13" fill="var(--text2)" textAnchor="middle">
                |00⟩
              </text>
              <g id="grover-gate-h0" className="circuit-gate teleport-stage">
                <rect x="90" y="37" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="90" y="37" width="40" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="110" y="63" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-h1" className="circuit-gate teleport-stage">
                <rect x="90" y="97" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="90" y="97" width="40" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="110" y="123" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-oracle" className="circuit-gate teleport-stage">
                <rect x="170" y="30" width="70" height="114" rx="8" fill="var(--surface2)" stroke="var(--text2)" strokeWidth="1.5" />
                <rect x="170" y="30" width="70" height="114" rx="8" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="205" y="82" fontSize="13" fontWeight="700" fill="var(--text)" textAnchor="middle" data-i18n="grover.oracleGateLabel">
                  Oracle
                </text>
                <text id="grover-oracle-gate-target" x="205" y="98" fontSize="11" fill="var(--text2)" textAnchor="middle">
                  marks 00
                </text>
              </g>
              <path d="M 270,24 V 16 H 450 V 24" fill="none" stroke="var(--text3)" strokeWidth="1.2" />
              <text x="360" y="12" fontSize="12" fontWeight="700" fill="var(--text2)" textAnchor="middle" data-i18n="grover.diffuserGateLabel">
                Diffuser
              </text>
              <g id="grover-gate-diffuse-h0a" className="circuit-gate teleport-stage">
                <rect x="270" y="37" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="270" y="37" width="34" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="287" y="63" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h1a" className="circuit-gate teleport-stage">
                <rect x="270" y="97" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="270" y="97" width="34" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="287" y="123" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-reflect" className="circuit-gate teleport-stage">
                <rect x="324" y="30" width="72" height="114" rx="8" fill="var(--surface2)" stroke="var(--text2)" strokeWidth="1.5" />
                <rect x="324" y="30" width="72" height="114" rx="8" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="360" y="82" fontSize="11.5" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  2|00⟩⟨00|
                </text>
                <text x="360" y="98" fontSize="11.5" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  − I
                </text>
              </g>
              <g id="grover-gate-diffuse-h0b" className="circuit-gate teleport-stage">
                <rect x="416" y="37" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="416" y="37" width="34" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="433" y="63" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h1b" className="circuit-gate teleport-stage">
                <rect x="416" y="97" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="416" y="97" width="34" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="433" y="123" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-meter-0" className="teleport-stage">
                <rect x="480" y="37" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <path d="M492,65 A10,10 0 0 1 508,65" fill="none" stroke="var(--zero)" strokeWidth="1.6" />
                <line x1="500" y1="66" x2="507" y2="52" stroke="var(--zero)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <g id="grover-meter-1" className="teleport-stage">
                <rect x="480" y="97" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <path d="M492,125 A10,10 0 0 1 508,125" fill="none" stroke="var(--one)" strokeWidth="1.6" />
                <line x1="500" y1="126" x2="507" y2="112" stroke="var(--one)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <text id="grover-circuit-out0" x="552" y="63" fontSize="14" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                ?
              </text>
              <text id="grover-circuit-out1" x="552" y="123" fontSize="14" fontWeight="700" fill="var(--one)" textAnchor="middle">
                ?
              </text>
            </svg>
          </div>
          <div id="grover-circuit-n8-wrap" style={{display: "none"}}>
            <svg id="grover-circuit-n8" viewBox="0 0 640 260" role="img" aria-label="Circuit diagram: a Hadamard on each of three qubits, then an Oracle gate and the Grover diffusion operator spanning all three qubits, repeated twice, then a measurement on each qubit." style={{width: "100%", maxWidth: "660px", display: "block", margin: "8px auto 0"}}>
              <defs>
                <linearGradient id="grover-metal-sheen-n8" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
                  <stop offset="14%" stopColor="#fff" stopOpacity="0.1" />
                  <stop offset="55%" stopColor="#000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
                </linearGradient>
              </defs>
              <line x1="50" y1="80" x2="534" y2="80" stroke="var(--border2)" strokeWidth="2" />
              <line x1="50" y1="140" x2="534" y2="140" stroke="var(--border2)" strokeWidth="2" />
              <line x1="50" y1="200" x2="534" y2="200" stroke="var(--border2)" strokeWidth="2" />
              <text x="26" y="86" fontSize="14" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                q₀
              </text>
              <text x="26" y="146" fontSize="14" fontWeight="700" fill="var(--text)" textAnchor="middle">
                q₁
              </text>
              <text x="26" y="206" fontSize="14" fontWeight="700" fill="var(--one)" textAnchor="middle">
                q₂
              </text>
              <text x="26" y="48" fontSize="12" fill="var(--text2)" textAnchor="middle">
                |000⟩
              </text>
              <path d="M 170,28 V 16 H 454 V 28" fill="none" stroke="var(--text3)" strokeWidth="1.2" />
              <text id="grover-repeat-label-n8" x="312" y="10" fontSize="12" fontWeight="700" fill="var(--text2)" textAnchor="middle" data-i18n="grover.repeatBracketLabel">
                repeat ×2
              </text>
              <g id="grover-gate-h0-n8" className="circuit-gate teleport-stage">
                <rect x="90" y="60" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="90" y="60" width="40" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="110" y="86" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-h1-n8" className="circuit-gate teleport-stage">
                <rect x="90" y="120" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--text)" strokeWidth="1.5" />
                <rect x="90" y="120" width="40" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="110" y="146" fontSize="16" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-h2-n8" className="circuit-gate teleport-stage">
                <rect x="90" y="180" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="90" y="180" width="40" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="110" y="206" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-oracle-n8" className="circuit-gate teleport-stage">
                <rect x="170" y="60" width="70" height="160" rx="8" fill="var(--surface2)" stroke="var(--text2)" strokeWidth="1.5" />
                <rect x="170" y="60" width="70" height="160" rx="8" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="205" y="132" fontSize="13" fontWeight="700" fill="var(--text)" textAnchor="middle" data-i18n="grover.oracleGateLabel">
                  Oracle
                </text>
                <text id="grover-oracle-gate-target-n8" x="205" y="148" fontSize="11" fill="var(--text2)" textAnchor="middle">
                  marks 000
                </text>
              </g>
              <path d="M 270,54 V 42 H 454 V 54" fill="none" stroke="var(--text3)" strokeWidth="1.2" />
              <text x="362" y="36" fontSize="12" fontWeight="700" fill="var(--text2)" textAnchor="middle" data-i18n="grover.diffuserGateLabel">
                Diffuser
              </text>
              <g id="grover-gate-diffuse-h0a-n8" className="circuit-gate teleport-stage">
                <rect x="270" y="60" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="270" y="60" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="287" y="86" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h1a-n8" className="circuit-gate teleport-stage">
                <rect x="270" y="120" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--text)" strokeWidth="1.5" />
                <rect x="270" y="120" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="287" y="146" fontSize="16" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h2a-n8" className="circuit-gate teleport-stage">
                <rect x="270" y="180" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="270" y="180" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="287" y="206" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-reflect-n8" className="circuit-gate teleport-stage">
                <rect x="319" y="60" width="86" height="160" rx="8" fill="var(--surface2)" stroke="var(--text2)" strokeWidth="1.5" />
                <rect x="319" y="60" width="86" height="160" rx="8" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="362" y="134" fontSize="11" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  2|000⟩⟨000|
                </text>
                <text x="362" y="150" fontSize="11" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  − I
                </text>
              </g>
              <g id="grover-gate-diffuse-h0b-n8" className="circuit-gate teleport-stage">
                <rect x="420" y="60" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="420" y="60" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="437" y="86" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h1b-n8" className="circuit-gate teleport-stage">
                <rect x="420" y="120" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--text)" strokeWidth="1.5" />
                <rect x="420" y="120" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="437" y="146" fontSize="16" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h2b-n8" className="circuit-gate teleport-stage">
                <rect x="420" y="180" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="420" y="180" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="437" y="206" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-meter-0-n8" className="teleport-stage">
                <rect x="484" y="60" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <path d="M496,88 A10,10 0 0 1 512,88" fill="none" stroke="var(--zero)" strokeWidth="1.6" />
                <line x1="504" y1="89" x2="511" y2="75" stroke="var(--zero)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <g id="grover-meter-1-n8" className="teleport-stage">
                <rect x="484" y="120" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--text)" strokeWidth="1.5" />
                <path d="M496,148 A10,10 0 0 1 512,148" fill="none" stroke="var(--text)" strokeWidth="1.6" />
                <line x1="504" y1="149" x2="511" y2="135" stroke="var(--text)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <g id="grover-meter-2-n8" className="teleport-stage">
                <rect x="484" y="180" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <path d="M496,208 A10,10 0 0 1 512,208" fill="none" stroke="var(--one)" strokeWidth="1.6" />
                <line x1="504" y1="209" x2="511" y2="195" stroke="var(--one)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <text id="grover-circuit-out0-n8" x="558" y="86" fontSize="14" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                ?
              </text>
              <text id="grover-circuit-out1-n8" x="558" y="146" fontSize="14" fontWeight="700" fill="var(--text)" textAnchor="middle">
                ?
              </text>
              <text id="grover-circuit-out2-n8" x="558" y="206" fontSize="14" fontWeight="700" fill="var(--one)" textAnchor="middle">
                ?
              </text>
            </svg>
          </div>
          <div className="mode-grid" id="grover-mode-toggle" style={{gridTemplateColumns: "repeat(2,1fr)", maxWidth: "420px", margin: "14px auto 0"}}>
            <button className="preset-btn mode-btn active" data-grover-mode="n4" data-i18n="grover.modeN4Btn">
              N = 4 (exact)
            </button>
            <button className="preset-btn mode-btn" data-grover-mode="n8" data-i18n="grover.modeN8Btn">
              N = 8 (2 iterations)
            </button>
          </div>
          <p className="bit-explainer" id="grover-mode-desc" style={{marginTop: "8px", textAlign: "center", fontSize: "0.85rem"}} data-i18n="grover.modeN4Desc">
            2 qubits, 1 marked item — a single query is exact.
          </p>
          <p className="muted-text" id="grover-iteration-badge" style={{textAlign: "center", marginTop: "6px", minHeight: "1.2em"}} />
        </div>
        <div className="grover-controls-grid">
          <div className="card">
            <div className="card-title" data-i18n="grover.targetTitle">
              Item to Find
            </div>
            <p className="bit-explainer" data-i18n="grover.targetBody">
              Pick which item is "marked" — this is what the oracle recognizes, and what the search below should find.
            </p>
            <div className="mode-grid" id="grover-target-picker" style={{gridTemplateColumns: "repeat(4,1fr)", maxWidth: "340px", margin: "12px auto 0"}}>
              <button className="preset-btn mode-btn active" data-grover-target="00">
                00
              </button>
              <button className="preset-btn mode-btn" data-grover-target="01">
                01
              </button>
              <button className="preset-btn mode-btn" data-grover-target="10">
                10
              </button>
              <button className="preset-btn mode-btn" data-grover-target="11">
                11
              </button>
            </div>
            <div className="mode-grid" id="grover-target-picker-n8" style={{display: "none", gridTemplateColumns: "repeat(4,1fr)", maxWidth: "340px", margin: "12px auto 0", gap: "7px"}}>
              <button className="preset-btn mode-btn" data-grover-target="000" style={{fontSize: "0.82rem", padding: "8px 4px"}}>
                000
              </button>
              <button className="preset-btn mode-btn" data-grover-target="001" style={{fontSize: "0.82rem", padding: "8px 4px"}}>
                001
              </button>
              <button className="preset-btn mode-btn" data-grover-target="010" style={{fontSize: "0.82rem", padding: "8px 4px"}}>
                010
              </button>
              <button className="preset-btn mode-btn" data-grover-target="011" style={{fontSize: "0.82rem", padding: "8px 4px"}}>
                011
              </button>
              <button className="preset-btn mode-btn" data-grover-target="100" style={{fontSize: "0.82rem", padding: "8px 4px"}}>
                100
              </button>
              <button className="preset-btn mode-btn" data-grover-target="101" style={{fontSize: "0.82rem", padding: "8px 4px"}}>
                101
              </button>
              <button className="preset-btn mode-btn" data-grover-target="110" style={{fontSize: "0.82rem", padding: "8px 4px"}}>
                110
              </button>
              <button className="preset-btn mode-btn" data-grover-target="111" style={{fontSize: "0.82rem", padding: "8px 4px"}}>
                111
              </button>
            </div>
            <div className="teleport-bits-row" style={{marginTop: "14px"}}>
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label" data-i18n="grover.targetLabel">
                  Marked item
                </span>
                <span className="teleport-bit-val" id="grover-target-val">
                  00
                </span>
              </div>
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label" data-i18n="grover.foundLabel">
                  Found
                </span>
                <span className="teleport-bit-val" id="grover-found-val">
                  ?
                </span>
              </div>
            </div>
            <p className="muted-text" id="grover-tally-text" style={{marginTop: "10px", textAlign: "center"}} />
            <button className="btn-secondary" id="btn-reset-grover" data-i18n="common.reset" style={{marginTop: "6px"}}>
              Reset
            </button>
          </div>
          <div className="card">
            <div className="card-title" data-i18n="grover.chartTitle">
              Amplitudes Through the Search
            </div>
            <div className="histogram teleport-histogram" id="grover-chart-n4">
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar zero-fill" id="grover-hist-00" />
                </div>
                <span className="grover-sign" id="grover-sign-00">
                  +
                </span>
                <span className="ket">
                  00
                </span>
                <span className="pct" id="grover-pct-00">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar" style={{background: "var(--text2)"}} id="grover-hist-01" />
                </div>
                <span className="grover-sign" id="grover-sign-01">
                  +
                </span>
                <span className="ket">
                  01
                </span>
                <span className="pct" id="grover-pct-01">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar" style={{background: "var(--text2)"}} id="grover-hist-10" />
                </div>
                <span className="grover-sign" id="grover-sign-10">
                  +
                </span>
                <span className="ket">
                  10
                </span>
                <span className="pct" id="grover-pct-10">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar one-fill" id="grover-hist-11" />
                </div>
                <span className="grover-sign" id="grover-sign-11">
                  +
                </span>
                <span className="ket">
                  11
                </span>
                <span className="pct" id="grover-pct-11">
                  —
                </span>
              </div>
            </div>
            <div className="histogram grover-histogram-n8" id="grover-chart-n8" style={{display: "none"}}>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar zero-fill" id="grover-hist-000" />
                </div>
                <span className="grover-sign" id="grover-sign-000">
                  +
                </span>
                <span className="ket">
                  000
                </span>
                <span className="pct" id="grover-pct-000">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar" style={{background: "var(--text2)"}} id="grover-hist-001" />
                </div>
                <span className="grover-sign" id="grover-sign-001">
                  +
                </span>
                <span className="ket">
                  001
                </span>
                <span className="pct" id="grover-pct-001">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar" style={{background: "var(--text2)"}} id="grover-hist-010" />
                </div>
                <span className="grover-sign" id="grover-sign-010">
                  +
                </span>
                <span className="ket">
                  010
                </span>
                <span className="pct" id="grover-pct-010">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar" style={{background: "var(--text2)"}} id="grover-hist-011" />
                </div>
                <span className="grover-sign" id="grover-sign-011">
                  +
                </span>
                <span className="ket">
                  011
                </span>
                <span className="pct" id="grover-pct-011">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar" style={{background: "var(--text2)"}} id="grover-hist-100" />
                </div>
                <span className="grover-sign" id="grover-sign-100">
                  +
                </span>
                <span className="ket">
                  100
                </span>
                <span className="pct" id="grover-pct-100">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar" style={{background: "var(--text2)"}} id="grover-hist-101" />
                </div>
                <span className="grover-sign" id="grover-sign-101">
                  +
                </span>
                <span className="ket">
                  101
                </span>
                <span className="pct" id="grover-pct-101">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar" style={{background: "var(--text2)"}} id="grover-hist-110" />
                </div>
                <span className="grover-sign" id="grover-sign-110">
                  +
                </span>
                <span className="ket">
                  110
                </span>
                <span className="pct" id="grover-pct-110">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar one-fill" id="grover-hist-111" />
                </div>
                <span className="grover-sign" id="grover-sign-111">
                  +
                </span>
                <span className="ket">
                  111
                </span>
                <span className="pct" id="grover-pct-111">
                  —
                </span>
              </div>
            </div>
            <div className="superdense-actions">
              <button className="btn-run" id="btn-grover-search" data-i18n="grover.searchBtn">
                Search
              </button>
              <span className="muted-text" id="grover-result">
                —
              </span>
            </div>
            <p className="bit-explainer" id="grover-explainer" style={{marginTop: "14px"}} data-i18n="grover.explainerDefault">
              Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-title" data-i18n="grover.whyFasterTitle">
            Why One Query Is Genuinely Faster
          </div>
          <p className="bit-explainer" data-i18n="grover.whyFasterBody">
            Classically, finding one marked item among 4 by checking them one at a time takes up to 3 actual look-ups in the worst case — if the first 3 you check aren't it, you only know the 4th is the answer by elimination, but you still needed those 3 real queries to get there. Grover's algorithm needs exactly 1 oracle call for this same N = 4 case. The gap widens, not narrows, as the list grows: for N items, classical search needs on the order of N queries in the worst case, while Grover's algorithm needs only on the order of √N — the same quadratic speedup already described in this app's own Algorithms overview.
          </p>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="grover.whyFasterBodyN8">
            The N = 8 mode above is what that general pattern actually looks like: 2 queries instead of up to 7, a real quadratic head start — but Grover's algorithm doesn't promise certainty in general, only that head start. Its own probability peaks at about 94.5% and would fall if pushed further; N = 4 is the special, smaller case where 1 query happens to land exactly on that peak instead of merely near it.
          </p>
        </div>
      </div>
      <LessonEmbed id="grover" />
    </section>
  );
}
