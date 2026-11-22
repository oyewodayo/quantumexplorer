import { useI18n } from '../hooks/useI18n.ts';
import { useTheme } from '../hooks/useTheme.ts';
import { useNav } from '../hooks/useNav.ts';
import { useProgress } from '../hooks/useProgress.ts';
import { setAppMode } from '../state/nav.ts';
import { ROADMAP_LESSONS } from '../content/roadmapContent.ts';
import { LANGUAGES } from '../i18n/index.ts';

function HomeButton() {
  const { t } = useI18n();
  const nav = useNav();
  const { completedLessons } = useProgress();
  return (
    <a
      href="/"
      className={`preset-btn mode-btn${nav.mode === 'roadmap' ? ' active' : ''}`}
      id="btn-roadmap-toggle"
      style={{ textDecoration: 'none' }}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        setAppMode('roadmap');
      }}
    >
      {t('nav.home', 'Home')}
      <span className="roadmap-badge-count"> · {completedLessons.length}/{ROADMAP_LESSONS.length}</span>
    </a>
  );
}

export default function AppHeader() {
  const { t, lang, setLanguage } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const themeLabel = t('header.themeToggle', 'Toggle light / dark');

  return (
    <header>
      <div className="logo">
        <a href="/" aria-label="Quantum Explorer home" style={{ color: 'inherit', textDecoration: 'none' }}>
          <span className="logo-badge">
            <img className="logo-badge-img" src="/icons/quantum-explorer.svg" alt="Quantum Explorer" />
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
