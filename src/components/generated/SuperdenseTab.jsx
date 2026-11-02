// Generated from the original index.html markup; edit freely.
export default function SuperdenseTab() {
  return (
    <section id="tab-superdense" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="superdense.title">
          Superdense Coding
        </h1>
        <p className="compare-subtitle" data-i18n="superdense.subtitle">
          Transmitting two classical bits of information by physically sending only one qubit, given a shared entangled pair prepared in advance
        </p>
      </div>
      <div className="superdense-layout">
        <div className="card">
          <div className="card-title" data-i18n="superdense.definitionTitle">
            What Is Superdense Coding?
          </div>
          <p className="bit-explainer" data-i18n="superdense.definitionBody1">
            Superdense coding is a quantum communication protocol that transmits two classical bits of information by physically sending only a single qubit, provided the sender and receiver already share one half each of an entangled pair prepared in advance. It is the logical converse of quantum teleportation: teleportation spends two classical bits and a shared entangled pair to move one qubit of quantum information, while superdense coding spends one qubit and that same kind of shared pair to move two classical bits.
          </p>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="superdense.definitionBody2">
            It is not a loophole in classical communication limits — an actual physical qubit still has to travel from sender to receiver for the protocol to work, so the transmission remains bounded by ordinary signal speed. As in the Teleportation tab, the two parties below are given their conventional quantum-information-theory labels: Alice for the sender, Bob for the receiver.
          </p>
        </div>
        <div className="card superdense-circuit-card">
          <div className="card-title" data-i18n="superdense.circuitTitle">
            The Protocol
          </div>
          <svg id="superdense-svg" viewBox="0 0 700 180" role="img" aria-label="Circuit diagram: Alice's qubit and Bob's qubit. A Hadamard and CNOT create an entangled pair. Alice conditionally applies X and/or Z to her own qubit only, encoding two classical bits. She then physically sends that qubit to Bob over a quantum channel. Bob, now holding both qubits, applies a CNOT and Hadamard to decode, then measures both to recover Alice's exact two bits." data-i18n="superdense.svgAlt" data-i18n-attr="aria-label">
            <defs>
              <marker id="sd-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            <line x1="40" y1="50" x2="660" y2="50" stroke="var(--zero)" strokeWidth="2" opacity="0.55" />
            <line x1="40" y1="130" x2="660" y2="130" stroke="var(--one)" strokeWidth="2" opacity="0.55" />
            <text x="20" y="55" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--zero)">
              A
            </text>
            <text x="20" y="135" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--one)">
              B
            </text>
            <g id="superdense-stage-pair" className="teleport-stage">
              <rect x="70" y="30" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <text x="90" y="55" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                H
              </text>
              <line x1="150" y1="50" x2="150" y2="130" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="150" cy="50" r="7" fill="var(--text2)" />
              <circle cx="150" cy="130" r="15" fill="none" stroke="var(--text2)" strokeWidth="2" />
              <line x1="150" y1="117" x2="150" y2="143" stroke="var(--text2)" strokeWidth="2" />
              <line x1="137" y1="130" x2="163" y2="130" stroke="var(--text2)" strokeWidth="2" />
            </g>
            <g id="superdense-stage-encode">
              <g id="superdense-gate-x" className="circuit-gate circuit-gate-off">
                <rect x="200" y="30" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <text x="220" y="55" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                  X
                </text>
              </g>
              <g id="superdense-gate-z" className="circuit-gate circuit-gate-off">
                <rect x="260" y="30" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <text x="280" y="55" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                  Z
                </text>
              </g>
            </g>
            <g id="superdense-channel">
              <text x="360" y="20" textAnchor="middle" fontSize="10.5" fill="var(--text2)" data-i18n="superdense.channelLabel">
                quantum channel
              </text>
              <line className="superdense-channel-wire" x1="320" y1="50" x2="400" y2="50" stroke="var(--zero)" strokeWidth="2" markerEnd="url(#sd-arr)" />
              <g className="superdense-particle-stream">
                <circle className="superdense-particle" cx="320" cy="50" r="1.6" fill="var(--zero)" style={{'--dx': "80px", animationDelay: "0s"}} />
                <circle className="superdense-particle" cx="320" cy="50" r="1.6" fill="var(--zero)" style={{'--dx': "80px", animationDelay: "-0.4s"}} />
                <circle className="superdense-particle" cx="320" cy="50" r="1.6" fill="var(--zero)" style={{'--dx': "80px", animationDelay: "-0.8s"}} />
              </g>
            </g>
            <g id="superdense-stage-decode" className="teleport-stage">
              <line x1="440" y1="50" x2="440" y2="130" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="440" cy="50" r="7" fill="var(--text2)" />
              <circle cx="440" cy="130" r="15" fill="none" stroke="var(--text2)" strokeWidth="2" />
              <line x1="440" y1="117" x2="440" y2="143" stroke="var(--text2)" strokeWidth="2" />
              <line x1="427" y1="130" x2="453" y2="130" stroke="var(--text2)" strokeWidth="2" />
              <rect x="480" y="30" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <text x="500" y="55" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                H
              </text>
            </g>
            <g id="superdense-stage-measure" className="teleport-stage">
              <rect x="550" y="30" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <path d="M562,58 A10,10 0 0 1 578,58" fill="none" stroke="var(--zero)" strokeWidth="1.6" />
              <line x1="570" y1="59" x2="577" y2="45" stroke="var(--zero)" strokeWidth="1.6" strokeLinecap="round" />
              <rect x="550" y="110" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
              <path d="M562,138 A10,10 0 0 1 578,138" fill="none" stroke="var(--one)" strokeWidth="1.6" />
              <line x1="570" y1="139" x2="577" y2="125" stroke="var(--one)" strokeWidth="1.6" strokeLinecap="round" />
            </g>
            <text x="625" y="45" textAnchor="middle" fontSize="11" fill="var(--text2)" data-i18n="superdense.finalLabelA">
              d₀
            </text>
            <text x="625" y="125" textAnchor="middle" fontSize="11" fill="var(--text2)" data-i18n="superdense.finalLabelB">
              d₁
            </text>
          </svg>
          <div className="superdense-actions">
            <button className="btn-run" id="btn-superdense-send" data-i18n="superdense.sendBtn">
              Send
            </button>
            <span className="muted-text" id="superdense-result">
              —
            </span>
          </div>
        </div>
        <div className="superdense-controls-grid">
          <div className="card">
            <div className="card-title" data-i18n="superdense.messageTitle">
              Message to Send
            </div>
            <p className="bit-explainer" data-i18n="superdense.messageBody">
              Pick any 2-bit message — this is what Alice encodes onto her single qubit before sending it to Bob.
            </p>
            <div className="mode-grid" id="superdense-message-picker" style={{gridTemplateColumns: "repeat(4,1fr)", maxWidth: "340px", margin: "12px auto 0"}}>
              <button className="preset-btn mode-btn active" data-superdense-msg="00">
                00
              </button>
              <button className="preset-btn mode-btn" data-superdense-msg="01">
                01
              </button>
              <button className="preset-btn mode-btn" data-superdense-msg="10">
                10
              </button>
              <button className="preset-btn mode-btn" data-superdense-msg="11">
                11
              </button>
            </div>
            <div className="teleport-bits-row" style={{marginTop: "16px"}}>
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label" data-i18n="superdense.sentLabel">
                  Alice sent
                </span>
                <span className="teleport-bit-val" id="superdense-sent-val">
                  00
                </span>
              </div>
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label" data-i18n="superdense.receivedLabel">
                  Bob decoded
                </span>
                <span className="teleport-bit-val" id="superdense-received-val">
                  ?
                </span>
              </div>
            </div>
            <p className="muted-text" id="superdense-tally-text" style={{marginTop: "10px", textAlign: "center"}} />
            <button className="btn-secondary" id="btn-reset-superdense" data-i18n="common.reset" style={{marginTop: "6px"}}>
              Reset
            </button>
          </div>
          <div className="card explainer-card">
            <div className="card-title" data-i18n="common.whatJustHappened">
              What just happened
            </div>
            <p className="bit-explainer" id="superdense-explainer" data-i18n="superdense.explainerDefault">
              Pick a 2-bit message above, then press Send. Watch Alice encode it onto her own qubit alone, physically hand that one qubit to Bob, and Bob decode both bits back out exactly — nothing here is random.
            </p>
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="superdense.whyChannelTitle">
            Why This Still Needs a Quantum Channel
          </div>
          <p className="bit-explainer" data-i18n="superdense.whyChannelBody">
            Teleportation moved a qubit's worth of information using only classical bits, which is why it can't outrun the speed of light. Superdense coding runs the opposite direction — it moves 2 classical bits using only 1 qubit of communication, which sounds like it's beating the classical limit, but it isn't a loophole: an actual physical qubit still has to travel from Alice to Bob for this to work. The "savings" is real (1 qubit instead of 2 classical bits' worth of separate signal), but it's still bounded by however fast that qubit itself can travel.
          </p>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="superdense.compareTitle">
            Teleportation vs. Superdense Coding
          </div>
          <p className="bit-explainer" data-i18n="superdense.compareBody">
            Same resource — one pre-shared entangled pair — spent in opposite directions. Teleportation sends 1 qubit of quantum information using 2 classical bits; superdense coding sends 2 classical bits of information using 1 qubit. Both need that entangled pair set up in advance, and both end by running essentially the same Bell-basis circuit (a CNOT then a Hadamard) — teleportation runs it on the sending side to read a state out, superdense coding runs it on the receiving side to read a message in.
          </p>
        </div>
      </div>
      <div className="lesson-embed" id="lesson-embed-superdense" />
    </section>
  );
}
