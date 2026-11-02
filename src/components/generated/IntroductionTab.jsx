// Generated from the original index.html markup; edit freely.
export default function IntroductionTab() {
  return (
    <section id="tab-introduction" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title" data-i18n="intro.title">
          Introduction
        </h1>
        <p className="compare-subtitle" data-i18n="intro.subtitle">
          New to quantum computing? Start here — no physics or programming background needed.
        </p>
      </div>
      <div className="intro-layout">
        <div className="card intro_cards">
          <div className="card-title">
            <b data-i18n="intro.classicalTitle">
              INTRODUCTION TO QUANTUM COMPUTING?
            </b>
          </div>
          <p className="bit-explainer" data-i18n="intro.classicalBody" data-i18n-html="">
            Before learning about quantum computers, let's start with classical computers. Your phone and computer use bits to process information. A bit has only two possible states:{' '}
            <b>
              0 (OFF) and 1 (ON)
            </b>
          </p>
        </div>
        <div className="intro-layout">
          <div className="card">
            <div className="card-title">
              <b data-i18n="intro.whatIsTitle">
                WHAT IS QUANTUM COMPUTING?
              </b>
            </div>
            <p className="bit-explainer" data-i18n="intro.whatIsBody">
              Quantum computing uses the principles of quantum mechanics to solve certain problems faster than classical computers.
            </p>
            <div className="intro-glossary-grid">
              <div className="card">
                <div className="card-title">
                  <b data-i18n="intro.bitsToQubitsTitle">
                    From Bits to Qubits
                  </b>
                </div>
                <p className="bit-explainer" data-i18n="intro.bitsToQubitsBody">
                  Unlike a bit, which is either 0 or 1, a qubit can exist in both states at the same time. This is called superposition.
                </p>
              </div>
              <div className="card">
                <div className="card-title">
                  <b data-i18n="intro.superpositionTitle">
                    Superposition: Multiple Possibilities
                  </b>
                </div>
                <p className="bit-explainer" data-i18n="intro.superpositionBody">
                  Imagine flipping a coin. While it's spinning, it represents both heads and tails. Similarly, a qubit can represent both 0 and 1 until it is measured.
                </p>
              </div>
              <div className="card">
                <div className="card-title">
                  <b data-i18n="intro.entanglementTitle">
                    Entanglement: Connected Quantum Information
                  </b>
                </div>
                <p className="bit-explainer" data-i18n="intro.entanglementBody">
                  Entanglement links two or more qubits together. Changes to one qubit are correlated with the others, allowing quantum computers to process information in powerful new ways.
                </p>
              </div>
              <div className="card">
                <div className="card-title">
                  <b data-i18n="intro.whyMattersTitle">
                    Why Quantum Computing Matters
                  </b>
                </div>
                <div className="bit-explainer" data-i18n="intro.whyMattersBody" data-i18n-html="">
                  Quantum computers are not designed to replace laptops or smartphones. They are built to solve complex problems, such as:{' '}
                  <ul className="quantum-list">
                    <li>
                      🧪 Simulating molecules
                    </li>
                    <li>
                      ⚙️ Optimizing large systems
                    </li>
                    <li>
                      🔐 Improving cryptography
                    </li>
                    <li>
                      🌦️ Solving complex scientific and engineering problems
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-title" data-i18n="intro.howAppWorksTitle">
                How this app works
              </div>
              <p className="bit-explainer" data-i18n="intro.howAppWorksBody">
                Each tab combines a short lesson with an interactive simulation and a quick check. Explore concepts by moving Bloch spheres, applying gates, and running circuits while seeing results update in real time. Your progress is tracked as you learn.
              </p>
            </div>
            <div className="section-label" style={{margin: "22px 0 12px"}} data-i18n="intro.suggestedPath">
              Suggested learning path
            </div>
            <div className="intro-path" id="intro-learning-path" />
          </div>
        </div>
      </div>
    </section>
  );
}
