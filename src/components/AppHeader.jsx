import { memo } from 'react';
import { useI18n } from '../hooks/useI18n.js';
import { useTheme } from '../hooks/useTheme.js';
import { LANGUAGES } from '../i18n/index.js';

// The Home / Concepts toggle is still driven by the simulation engine, which
// rewrites its label with live progress, so React must never re-render it.
const HomeButton = memo(function HomeButton() {
  return (
    <button className="preset-btn mode-btn active" data-app-mode="roadmap" id="btn-roadmap-toggle">Home</button>
  );
});

export default function AppHeader() {
  const { t, lang, setLanguage } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const themeLabel = t('header.themeToggle', 'Toggle light / dark');

  return (
    <header>
      <div className="logo">
        <a href="/" aria-label="Quantum Explorer home" style={{ color: 'inherit', textDecoration: 'none' }}>
          <span className="logo-badge">
            <img className="logo-badge-img" src="icons/quantum-explorer.svg" alt="Quantum Explorer" />
          </span>
        </a>
      </div>
      <div className="mode-grid app-mode-grid">
        <HomeButton />
      </div>
      <div className="header-right">
        <div className="header-tag">{t('header.tag', 'Quantum Explorer')}</div>
        <select
          className="lang-select"
          id="lang-select"
          aria-label="Language"
          title="Language"
          value={lang}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
        </select>
        <button className="theme-toggle" id="theme-toggle" title={themeLabel} aria-label={themeLabel} onClick={toggleTheme}>
          <span id="theme-icon">{isDark ? '☀' : '☾'}</span>
        </button>
      </div>
    </header>
  );
}
