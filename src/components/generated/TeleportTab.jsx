// Generated from the original index.html markup; edit freely.
export default function TeleportTab() {
  return (
    <section id="tab-teleport" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="teleport.title">
          Quantum Teleportation
        </h1>
        <p className="compare-subtitle" data-i18n="teleport.subtitle">
          Transferring a qubit's exact state onto a second, physically separate qubit — using a shared entangled pair and two classical bits, without ever transporting the qubit itself
        </p>
      </div>
      <div className="teleport-layout">
        <div className="card">
          <div className="card-title" data-i18n="teleport.definitionTitle">
            What Is Quantum Teleportation?
          </div>
          <p className="bit-explainer" data-i18n="teleport.definitionBody1">
            Quantum teleportation is a protocol for transferring the exact state of one qubit onto a second, physically separate qubit, using a previously shared pair of entangled qubits together with two bits of classical communication — without the original qubit ever being physically transported or directly measured. It moves quantum information, not matter or energy, and it cannot be used to send a signal faster than light: recovering the transferred state at the receiving end requires those two classical bits to actually arrive, and they travel no faster than any ordinary signal.
          </p>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="teleport.definitionBody2">
            Nor does it create a copy. The source qubit's own state is necessarily destroyed by the measurement the protocol requires, consistent with the no-cloning theorem, which forbids any procedure from duplicating an unknown quantum state while leaving the original intact. In the walkthrough below, the two parties exchanging the qubit are given the conventional labels used throughout quantum information theory — Alice for the sender, Bob for the receiver.
          </p>
        </div>
        <div className="card teleport-circuit-card">
          <div className="card-title" data-i18n="teleport.circuitTitle">
            The Protocol
          </div>
          <svg id="teleport-svg" viewBox="0 0 640 230" role="img" aria-label="Circuit diagram: Alice's message qubit and two halves of an entangled pair. A Hadamard and CNOT create the entangled pair between Alice's second qubit and Bob's qubit. A CNOT and Hadamard put Alice's message qubit and her half of the pair into the Bell basis. Both are measured, and the two classical results travel down double lines to conditionally-applied Z and X correction gates on Bob's qubit." data-i18n="teleport.svgAlt" data-i18n-attr="aria-label">
            <defs>
              <marker id="tp-cbit-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            <line x1="60" y1="40" x2="580" y2="40" stroke="var(--zero)" strokeWidth="2" opacity="0.55" />
            <line x1="60" y1="115" x2="580" y2="115" stroke="var(--zero)" strokeWidth="2" opacity="0.55" />
            <line x1="60" y1="190" x2="580" y2="190" stroke="var(--one)" strokeWidth="2" opacity="0.55" />
            <text x="30" y="45" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--zero)">
              ψ
            </text>
            <text x="30" y="120" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--zero)">
              A
            </text>
            <text x="30" y="195" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--one)">
              B
            </text>
            <g id="teleport-stage-pair" className="teleport-stage">
              <rect x="90" y="95" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <text x="110" y="120" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                H
              </text>
              <line x1="170" y1="115" x2="170" y2="190" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="170" cy="115" r="7" fill="var(--text2)" />
              <circle cx="170" cy="190" r="15" fill="none" stroke="var(--text2)" strokeWidth="2" />
              <line x1="170" y1="177" x2="170" y2="203" stroke="var(--text2)" strokeWidth="2" />
              <line x1="157" y1="190" x2="183" y2="190" stroke="var(--text2)" strokeWidth="2" />
            </g>
            <g id="teleport-stage-bellmeas" className="teleport-stage">
              <line x1="250" y1="40" x2="250" y2="115" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="250" cy="40" r="7" fill="var(--text2)" />
              <circle cx="250" cy="115" r="15" fill="none" stroke="var(--text2)" strokeWidth="2" />
              <line x1="250" y1="102" x2="250" y2="128" stroke="var(--text2)" strokeWidth="2" />
              <line x1="237" y1="115" x2="263" y2="115" stroke="var(--text2)" strokeWidth="2" />
              <rect x="290" y="20" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <text x="310" y="45" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                H
              </text>
            </g>
            <g id="teleport-stage-measure" className="teleport-stage">
              <rect x="370" y="20" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <path d="M382,48 A10,10 0 0 1 398,48" fill="none" stroke="var(--zero)" strokeWidth="1.6" />
              <line x1="390" y1="49" x2="397" y2="35" stroke="var(--zero)" strokeWidth="1.6" strokeLinecap="round" />
              <rect x="430" y="95" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <path d="M442,123 A10,10 0 0 1 458,123" fill="none" stroke="var(--zero)" strokeWidth="1.6" />
              <line x1="450" y1="124" x2="457" y2="110" stroke="var(--zero)" strokeWidth="1.6" strokeLinecap="round" />
            </g>
            <g id="teleport-stage-correct">
              <g id="teleport-cwire-0" className="teleport-cwire">
                <line x1="388" y1="60" x2="388" y2="170" stroke="var(--text3)" strokeWidth="1.5" markerEnd="url(#tp-cbit-arr)" />
                <line x1="392" y1="60" x2="392" y2="170" stroke="var(--text3)" strokeWidth="1.5" />
              </g>
              <g id="teleport-cwire-1" className="teleport-cwire">
                <line x1="448" y1="135" x2="448" y2="170" stroke="var(--text3)" strokeWidth="1.5" />
                <line x1="452" y1="135" x2="452" y2="170" stroke="var(--text3)" strokeWidth="1.5" markerEnd="url(#tp-cbit-arr)" />
              </g>
              <g id="teleport-gate-z" className="circuit-gate circuit-gate-off">
                <rect x="370" y="170" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <text x="390" y="195" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--one)">
                  Z
                </text>
              </g>
              <g id="teleport-gate-x" className="circuit-gate circuit-gate-off">
                <rect x="430" y="170" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <text x="450" y="195" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--one)">
                  X
                </text>
              </g>
            </g>
            <text id="teleport-final-label" x="545" y="207" textAnchor="middle" fontSize="11" fill="var(--text2)" data-i18n="teleport.finalLabel">
              Bob's qubit ≡ ψ
            </text>
          </svg>
          <div className="teleport-actions">
            <button className="btn-run" id="btn-teleport" data-i18n="teleport.teleportBtn">
              Teleport
            </button>
            <span className="muted-text" id="teleport-result">
              —
            </span>
          </div>
        </div>
        <div className="compare-layout teleport-compare">
          <div className="compare-col">
            <div className="col-label">
              <span className="col-badge quantum-badge" data-i18n="teleport.aliceBadge">
                Alice's message
              </span>
              <span className="col-desc" data-i18n="teleport.aliceDesc">
                Set any state — this is what gets teleported
              </span>
            </div>
            <div className="bloch-wrap bloch-wrap--drag">
              <canvas id="bloch-teleport-alice" width="200" height="200" tabIndex="0" role="img" aria-label="Bloch sphere for Alice's message qubit. Draggable, or focus and use arrow keys, to set its state." />
              <div className="state-label" id="label-teleport-alice">
                |0⟩
              </div>
            </div>
            <div className="preset-grid preset-grid--2col" style={{marginTop: "10px"}}>
              <button className="preset-btn" data-teleport-preset="" data-theta-mult="0" data-phi-mult="0">
                |0⟩
              </button>
              <button className="preset-btn" data-teleport-preset="" data-theta-mult="1" data-phi-mult="0">
                |1⟩
              </button>
              <button className="preset-btn" data-teleport-preset="" data-theta-mult="0.5" data-phi-mult="0">
                |+⟩
              </button>
              <button className="preset-btn" data-teleport-preset="" data-theta-mult="0.5" data-phi-mult="1">
                |-⟩
              </button>
            </div>
            <div className="slider-group" style={{marginTop: "10px"}}>
              <div className="slider-row">
                <span className="slider-sym">
                  θ
                </span>
                <input type="range" id="sl-teleport-theta" min="0" max="3141" defaultValue="0" />
                <span className="slider-val" id="val-teleport-theta">
                  0°
                </span>
              </div>
              <div className="slider-row">
                <span className="slider-sym">
                  φ
                </span>
                <input type="range" id="sl-teleport-phi" min="0" max="6283" defaultValue="0" />
                <span className="slider-val" id="val-teleport-phi">
                  0°
                </span>
              </div>
            </div>
            <div className="formula" id="formula-teleport-alice" style={{marginTop: "10px", textAlign: "center"}}>
              |ψ⟩ = |0⟩
            </div>
          </div>
          <div className="compare-divider">
            <div className="divider-line" />
            <div className="divider-vs" aria-hidden="true">
              →
            </div>
            <div className="divider-line" />
          </div>
          <div className="compare-col">
            <div className="col-label">
              <span className="col-badge teleport-bob-badge" data-i18n="teleport.bobBadge">
                Bob's qubit
              </span>
              <span className="col-desc" id="teleport-bob-desc" data-i18n="teleport.bobDescWaiting">
                Not entangled yet — press Teleport
              </span>
            </div>
            <div className="bloch-wrap">
              <canvas id="bloch-teleport-bob" width="200" height="200" role="img" aria-label="Bloch sphere for Bob's qubit. Starts undetermined; ends up matching Alice's message exactly once teleportation completes." />
              <div className="state-label" id="label-teleport-bob">
                ?
              </div>
            </div>
            <div className="formula" id="formula-teleport-bob" style={{marginTop: "10px", textAlign: "center"}}>
              |ψ⟩ = ?
            </div>
          </div>
        </div>
        <div className="teleport-controls-grid">
          <div className="card">
            <div className="card-title" data-i18n="teleport.classicalBitsTitle">
              Classical Bits
            </div>
            <p className="bit-explainer" data-i18n="teleport.classicalBitsBody">
              Alice must physically send these two bits to Bob — by phone, radio, the postal service, anything classical. Without them, Bob's qubit is useless to him even though it's already sitting right there.
            </p>
            <div className="teleport-bits-row">
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label">
                  m₀
                </span>
                <span className="teleport-bit-val" id="teleport-m0">
                  ?
                </span>
              </div>
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label">
                  m₁
                </span>
                <span className="teleport-bit-val" id="teleport-m1">
                  ?
                </span>
              </div>
            </div>
            <div className="card-title" style={{marginTop: "16px"}}>
              <span data-i18n="teleport.outcomeTally">
                Outcome Tally
              </span>
              <span className="muted-text" id="teleport-trial-count" />
            </div>
            <div className="histogram teleport-histogram">
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar zero-fill" id="teleport-hist-00" />
                </div>
                <span className="ket zero-color">
                  00
                </span>
                <span className="pct" id="teleport-pct-00">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar" style={{background: "var(--text2)"}} id="teleport-hist-01" />
                </div>
                <span className="ket mid-color">
                  01
                </span>
                <span className="pct" id="teleport-pct-01">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar" style={{background: "var(--text2)"}} id="teleport-hist-10" />
                </div>
                <span className="ket mid-color">
                  10
                </span>
                <span className="pct" id="teleport-pct-10">
                  —
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar one-fill" id="teleport-hist-11" />
                </div>
                <span className="ket one-color">
                  11
                </span>
                <span className="pct" id="teleport-pct-11">
                  —
                </span>
              </div>
            </div>
            <button className="btn-secondary" id="btn-reset-teleport" data-i18n="common.reset">
              Reset
            </button>
          </div>
          <div className="card explainer-card">
            <div className="card-title" data-i18n="common.whatJustHappened">
              What just happened
            </div>
            <p className="bit-explainer" id="teleport-explainer" data-i18n="teleport.explainerDefault">
              Set Alice's message state above, then press Teleport. Watch Bob's sphere: it starts undetermined, jumps to some definite but wrong point the instant Alice measures, then snaps to match Alice's exactly once her classical bits arrive and Bob corrects for them.
            </p>
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="teleport.whyNotFtlTitle">
            Why This Isn't Faster-Than-Light
          </div>
          <p className="bit-explainer" data-i18n="teleport.whyNotFtlBody">
            The instant Alice measures her two qubits, Bob's qubit does become a definite state — but which one is anyone's guess without Alice's two classical bits, and those can only travel at the speed of light or slower, same as a phone call. Until they arrive, Bob's qubit reads as pure noise: measuring it himself early would just give a random 50/50 result, no matter what ψ was. The entanglement makes teleportation possible; it doesn't make it instant.
          </p>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="teleport.noCloningTitle">
            Not a Copy — the No-Cloning Theorem
          </div>
          <p className="bit-explainer" data-i18n="teleport.noCloningBody" data-i18n-html="">
            Alice's original message qubit doesn't survive this: her Bell-basis measurement in Step 2 collapses it along with her half of the pair, permanently erasing whatever ψ used to be on her side. That's not a limitation of this particular protocol — the no-cloning theorem proves{' '}
            <em>
              no
            </em>
            {' '}quantum procedure can ever copy an unknown state while leaving the original intact. Teleportation moves a state; it never duplicates one.
          </p>
        </div>
      </div>
      <div className="lesson-embed" id="lesson-embed-teleport" />
    </section>
  );
}
