// Generated from the original index.html markup; edit freely.
export default function EntangleTab() {
  return (
    <section id="tab-entangle" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="entangle.title">
          Quantum Entanglement
        </h1>
        <p className="compare-subtitle" data-i18n="entangle.subtitle">
          Bell state (|00⟩ + |11⟩)/√2 — neither qubit has a definite state alone; measuring one instantly determines the other
        </p>
      </div>
      <div className="entangle-layout">
        <div className="card entangle-main-card">
          <img className="entangle-banner-img" src="entaglement.png" alt="Illustration of the coin-flip analogy for quantum entanglement: two people each flip a coin at separate detectors, connected by a glowing sphere of correlation cones — whichever way Coin A lands, Coin B instantly lands the opposite way, with the state indeterminate until measured." data-i18n="entangle.bannerAlt" data-i18n-attr="alt" />
          <div className="entangle-bell-state">
            <span className="formula" style={{fontSize: "1.05rem"}}>
              (|00⟩ + |11⟩) / √2
            </span>
            <span className="muted-text" style={{marginLeft: "14px", fontSize: "0.72rem"}} data-i18n="entangle.jointStateLabel">
              joint state of both qubits
            </span>
          </div>
          <div className="card-title" data-i18n="entangle.explainerTitle">
            What Is Quantum Entanglement?
          </div>
          <p className="bit-explainer" data-i18n="entangle.explainerBody1">
            Quantum entanglement is a phenomenon in which two or more particles become linked so that their quantum states can no longer be described independently of one another — even when the particles are separated by enormous distances. Instead of two separate qubits each carrying their own state, the pair shares a single joint state, like the Bell state (|00⟩ + |11⟩)/√2 shown above: a 50/50 mix of "both measured 0" and "both measured 1," with no way to break it down into what qubit A or qubit B is doing on its own.
          </p>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="entangle.explainerBody2">
            Entanglement isn't produced by some mysterious force reaching between the particles — it's created locally, the moment two qubits interact (here, with a Hadamard gate followed by a CNOT — build the same recipe gate by gate on the Circuits tab), and it persists afterward no matter how far apart the qubits later travel. Einstein famously called the resulting correlations "spooky action at a distance," since measuring one qubit appears to instantly affect the other.
          </p>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="entangle.explainerBody3">
            The two cards below work out the details behind that intuition: why a state like this genuinely can't be described as two separate qubits, and why the instant correlation still can't be used to send a signal faster than light.
          </p>
          <div className="entangle-map">
            <svg className="entangle-map-bg" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
              <rect x="0" y="0" width="100" height="32" fill="var(--zero-dim)" />
              <g stroke="var(--border2)" strokeWidth="0.25" opacity="0.6">
                <line x1="0" y1="8" x2="100" y2="8" />
                <line x1="0" y1="16" x2="100" y2="16" />
                <line x1="0" y1="24" x2="100" y2="24" />
                <line x1="17" y1="0" x2="17" y2="32" />
                <line x1="34" y1="0" x2="34" y2="32" />
                <line x1="50" y1="0" x2="50" y2="32" />
                <line x1="67" y1="0" x2="67" y2="32" />
                <line x1="84" y1="0" x2="84" y2="32" />
              </g>
              <g fill="var(--success-dim)">
                <path d="M5,12 Q9,7 15,10 Q19,9 20,13 Q16,17 11,16 Q6,17 5,12 Z" />
                <path d="M39,17 Q46,12 53,15 Q57,18 54,22 Q47,24 42,21 Q38,20 39,17 Z" />
                <path d="M74,10 Q82,6 89,10 Q93,13 89,17 Q82,19 77,16 Q73,13 74,10 Z" />
                <path d="M27,3 Q32,1 35,4 Q33,7 28,7 Q26,6 27,3 Z" />
                <path d="M60,4 Q65,2 69,5 Q67,8 62,7 Q59,6 60,4 Z" />
              </g>
              <path d="M15,19 Q50,2 85,19" fill="none" stroke="var(--zero)" strokeWidth="0.5" strokeDasharray="2 1.4" opacity="0.75" />
              <line x1="15" y1="19" x2="15" y2="26" stroke="var(--text3)" strokeWidth="0.5" />
              <circle cx="15" cy="19" r="1.5" fill="var(--zero)" />
              <line x1="85" y1="19" x2="85" y2="26" stroke="var(--text3)" strokeWidth="0.5" />
              <circle cx="85" cy="19" r="1.5" fill="var(--one)" />
            </svg>
            <div className="coins-row">
              <div className="coin-wrap">
                <div className="coin-label-top" data-i18n="qubitTab.qubitABadge">
                  Qubit A
                </div>
                <canvas id="coin1" width="130" height="130" role="img" aria-label="Qubit A: unmeasured, in superposition." />
                <div className="coin-label-bottom" id="coin1-label">
                  Unmeasured
                </div>
              </div>
              <div className="entangle-mid">
                <div className="entangle-link-label" data-i18n="entangle.entangledLabel">
                  Entangled
                </div>
                <div className="entangle-link-arrow">
                  ↔
                </div>
                <div className="entangle-note" id="entangle-note">
                  Measuring A instantly
                  <br />
                  determines B
                </div>
              </div>
              <div className="coin-wrap">
                <div className="coin-label-top" data-i18n="qubitTab.qubitBBadge">
                  Qubit B
                </div>
                <canvas id="coin2" width="130" height="130" role="img" aria-label="Qubit B: unmeasured, in superposition." />
                <div className="coin-label-bottom" id="coin2-label">
                  Unmeasured
                </div>
              </div>
            </div>
            <div className="entangle-map-caption" data-i18n="entangle.mapCaption">
              Two different locations, arbitrarily far apart — the correlation holds regardless of the distance between them.
            </div>
          </div>
          <div className="entangle-actions">
            <button className="btn-measure" id="btn-measure-both" data-i18n="entangle.measureBoth">
              Measure Both
            </button>
            <button className="btn-secondary" style={{padding: "10px 16px", fontSize: "0.8rem"}} id="btn-measure-a" data-i18n="entangle.measureAOnly">
              Measure A Only
            </button>
            <button className="btn-secondary" id="btn-reset-entangle" data-i18n="common.reset">
              Reset
            </button>
          </div>
          <div className="entangle-result" id="entangle-result" />
        </div>
        <div className="card mt-14">
          <div className="card-title">
            <span data-i18n="measure.measurementStatistics">
              Measurement Statistics
            </span>
            <span className="muted-text" id="entangle-trial-count" />
          </div>
          <div className="entangle-stats">
            <div className="prob-row">
              <span className="ket zero-color" style={{minWidth: "34px"}}>
                |00⟩
              </span>
              <div className="track">
                <div className="fill zero-fill" id="estat-fill-00" style={{width: "0%"}} />
              </div>
              <span className="pct" id="estat-pct-00">
                —
              </span>
            </div>
            <div className="prob-row">
              <span className="ket one-color" style={{minWidth: "34px"}}>
                |11⟩
              </span>
              <div className="track">
                <div className="fill one-fill" id="estat-fill-11" style={{width: "0%"}} />
              </div>
              <span className="pct" id="estat-pct-11">
                —
              </span>
            </div>
            <div className="prob-row" style={{marginTop: "4px", opacity: "0.35"}}>
              <span className="ket" style={{minWidth: "34px", color: "var(--text3)"}}>
                |01⟩
              </span>
              <div className="track">
                <div className="fill" style={{background: "var(--text3)", width: "0%"}} />
              </div>
              <span className="pct">
                0%
              </span>
            </div>
            <div className="prob-row" style={{opacity: "0.35"}}>
              <span className="ket" style={{minWidth: "34px", color: "var(--text3)"}}>
                |10⟩
              </span>
              <div className="track">
                <div className="fill" style={{background: "var(--text3)", width: "0%"}} />
              </div>
              <span className="pct">
                0%
              </span>
            </div>
          </div>
          <div className="convergence-note" style={{marginTop: "10px"}} id="entangle-convergence" />
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="entangle.tensorTitle">
            Why Isn't This Just Two Qubits? (Tensor Products)
          </div>
          <p className="bit-explainer" data-i18n="entangle.tensorBody1" data-i18n-html="">
            Two independent qubits always combine by{' '}
            <span className="key-term">
              tensor product
            </span>
            {' '}(⊗): stack qubit A's 2-entry vector against qubit B's, multiplying every pair of entries to build a 4-entry joint vector. Every product state — anything you could build in the Two Qubit panel on the Bits & Qubits tab — factors apart into two separate qubits this way:
          </p>
          <div className="formula" style={{marginTop: "10px"}} data-i18n="entangle.tensorFormula1" data-i18n-html="">
            |0⟩⊗|0⟩ = [1,0]
            <sup>
              T
            </sup>
            ⊗[1,0]
            <sup>
              T
            </sup>
            {' '}= [1,0,0,0]
            <sup>
              T
            </sup>
            {' '}= |00⟩
          </div>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="entangle.tensorBody2" data-i18n-html="">
            The Bell state above is also a 4-entry vector — [1,0,0,1]
            <sup>
              T
            </sup>
            /√2 — but try to factor it back into [a,b]
            <sup>
              T
            </sup>
            ⊗[c,d]
            <sup>
              T
            </sup>
            {' '}= [ac,ad,bc,bd]
            <sup>
              T
            </sup>
            {' '}and there's no solution:{' '}
            <em>
              ad
            </em>
            {' '}= 0 and{' '}
            <em>
              bc
            </em>
            {' '}= 0 force one of each pair to be zero, which would also zero out{' '}
            <em>
              ac
            </em>
            {' '}or{' '}
            <em>
              bd
            </em>
            {' '}— no single-qubit states A and B multiply together to reproduce it.
          </p>
          <div className="formula" style={{marginTop: "10px"}} data-i18n="entangle.tensorFormula2">
            (|00⟩ + |11⟩) / √2 = [1, 0, 0, 1]ᵀ/√2 ≠ [a,b]ᵀ ⊗ [c,d]ᵀ for any a, b, c, d
          </div>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="entangle.tensorBody3">
            That's the literal, checkable definition of entanglement: a joint state that can't be split back into two independent single-qubit factors. Neither qubit alone has a well-defined state — only the pair does.
          </p>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="entangle.relativityTitle">
            Why This Doesn't Break Relativity
          </div>
          <p className="bit-explainer" data-i18n="entangle.relativityBody1">
            This setup is a version of the Einstein-Podolsky-Rosen (EPR) thought experiment: Alice measures Qubit A and instantly knows Qubit B's outcome, even if B is light-years away. It looks like faster-than-light signaling — but it isn't.
          </p>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="entangle.relativityBody2">
            Alice can't choose which outcome she gets — that's still random, same 50/50 odds as any single qubit. So there's nothing for her to control, and therefore nothing she can encode into a message. The correlation is only visible after the fact, once Alice and Bob compare notes over an ordinary (slower-than-light) channel. No energy, no information, and no signal actually crosses the distance between them at the moment of measurement.
          </p>
        </div>
        <div className="card mt-14">
          <div className="card-title" data-i18n="entangle.cernTitle">
            Why CERN Cares About Entanglement
          </div>
          <p className="bit-explainer" data-i18n="entangle.cernBody1">
            This isn't only a teaching example. Physicists at the LHC have measured genuine quantum entanglement directly in the particles produced by proton-proton collisions — most notably between a top quark and its antiquark, created and decaying within a fraction of a trillionth of a trillionth of a second. The same Bell-state math on this page, (|00⟩ + |11⟩)/√2, describes a real, measured correlation in the highest-energy environment humans have ever built.
          </p>
          <p className="bit-explainer" style={{marginTop: "10px"}} data-i18n="entangle.cernBody2">
            CERN's Quantum Technology Initiative treats entanglement and superposition as engineering resources, not just curiosities: quantum computers for simulating the quantum field theories behind particle physics itself — a problem classical computers scale badly on — and quantum sensors built from entangled or squeezed states, aimed at the kind of extreme-precision measurements that searches for dark matter and other new physics depend on.
          </p>
        </div>
      </div>
      <div className="lesson-embed" id="lesson-embed-entangle" />
    </section>
  );
}
