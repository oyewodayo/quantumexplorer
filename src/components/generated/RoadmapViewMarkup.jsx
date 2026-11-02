// Generated from the original index.html markup; edit freely.
export default function RoadmapViewMarkup() {
  return (
    <section id="roadmap-view" className="active">
      <div className="roadmap-hero roadmap-hero--full" id="roadmap-hero">
        <div className="compare-header">
          <h1 className="compare-title" data-i18n="roadmap.title">
            Quantum Concepts
          </h1>
          <p className="compare-subtitle" data-i18n="roadmap.subtitle">
            Click any concept to open its simulation
          </p>
        </div>
        <div className="mode-grid roadmap-mode-grid" style={{gridTemplateColumns: "1fr 1fr 1fr", maxWidth: "480px", margin: "0 auto 20px"}}>
          <button className="preset-btn mode-btn active" data-roadmap-mode="map" data-i18n="roadmap.conceptMap">
            Concept Map
          </button>
          <button className="preset-btn mode-btn" data-goto-tab="important-concepts" data-i18n="nav.importantConcepts">
            Important Concepts
          </button>
          <button className="preset-btn mode-btn" data-roadmap-mode="progress" data-i18n="roadmap.myProgress">
            My Progress
          </button>
        </div>
        <div className="roadmap-mindmap" id="roadmap-mindmap" />
        <div className="roadmap-mindmap-fallback" id="roadmap-mindmap-fallback" />
      </div>
      <div id="roadmap-progress-panel" className="roadmap-panel" style={{display: "none"}}>
        <div className="card">
          <div className="card-title" data-i18n="roadmap.lessonsCompleted">
            Lessons Completed
          </div>
          <div className="progress-row">
            <div className="track">
              <div className="fill zero-fill" id="roadmap-progress-fill" style={{width: "0%"}} />
            </div>
            <span className="pct" id="roadmap-progress-pct">
              0/9
            </span>
          </div>
        </div>
        <div className="card" style={{marginTop: "12px"}}>
          <div className="card-title" data-i18n="roadmap.quickCheckScore">
            Quick Check Score
          </div>
          <p className="bit-explainer" id="roadmap-quiz-score-text">
            Not attempted yet.
          </p>
        </div>
        <div className="card" style={{marginTop: "12px"}}>
          <div className="card-title" data-i18n="roadmap.lessonChecklist">
            Lesson Checklist
          </div>
          <div className="roadmap-lesson-checklist" id="roadmap-checklist" />
          <button className="btn-secondary" style={{marginTop: "12px"}} data-reset-progress="" data-i18n="roadmap.resetProgress">
            Reset progress
          </button>
        </div>
      </div>
    </section>
  );
}
