import { useI18n } from '../hooks/useI18n.js';

export default function AppFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="app-footer-top">
        <div className="app-footer-brand">
          <span className="logo-badge app-footer-badge">
            <img className="logo-badge-img" src="icons/quantum-explorer.svg" alt="Quantum Explorer" />
          </span>
          <div>
            <div className="app-footer-title">Quantum Explorer</div>
            <div className="app-footer-tagline">
              {t('footer.tagline', 'An interactive platform for learning quantum computing & quantum mechanics')}
            </div>
          </div>
        </div>
      </div>
      <div className="app-footer-bottom">
        <span id="footer-copyright">
          {t('footer.copyright', 'Copyright © {year} Quantum Explorer').replace('{year}', year)}
        </span>
      </div>
    </footer>
  );
}
