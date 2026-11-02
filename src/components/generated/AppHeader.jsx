// Generated from the original index.html markup; edit freely.
export default function AppHeader() {
  return (
    <header>
      <div className="logo">
        <a href="index.html" aria-label="Quantum Explorer home" style={{color: "inherit", textDecoration: "none"}}>
          <span className="logo-badge">
            <img className="logo-badge-img" src="icons/quantum-explorer.svg" alt="Quantum Explorer" />
          </span>
        </a>
      </div>
      <div className="mode-grid app-mode-grid">
        <button className="preset-btn mode-btn active" data-app-mode="roadmap" id="btn-roadmap-toggle">
          Home
        </button>
      </div>
      <div className="header-right">
        <div className="header-tag" data-i18n="header.tag">
          Quantum Explorer · CERN
        </div>
        <select className="lang-select" id="lang-select" aria-label="Language" title="Language">
          <option value="en">
            EN
          </option>
          <option value="fr">
            FR
          </option>
          <option value="es">
            ES
          </option>
        </select>
        <button className="theme-toggle" id="theme-toggle" data-i18n="header.themeToggle" data-i18n-attr="title" title="Toggle light / dark">
          <span id="theme-icon">
            ☾
          </span>
        </button>
      </div>
    </header>
  );
}
