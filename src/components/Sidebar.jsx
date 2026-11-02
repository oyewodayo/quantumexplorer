import { useI18n } from '../hooks/useI18n.js';
import { useNav } from '../hooks/useNav.js';
import { setNav, engineApi } from '../state/nav.js';
import { SIDEBAR_ITEMS } from './sidebarItems.js';

// A sub-link is active when every mode key it declares matches the tab's
// current mode (links with only `gatesDomain` ignore `qubitSubmode`, etc.).
const subIsActive = (mode, current = {}) => {
  const keys = Object.keys(mode);
  return keys.length > 0 && keys.every((k) => mode[k] === current[k]);
};

export default function Sidebar() {
  const { t } = useI18n();
  const nav = useNav();

  const openTab = (item) => {
    engineApi.switchToTab(item.tab);
    if (item.subs) setNav({ openGroup: item.tab });
  };

  const tabButton = (item, chevron) => (
    <button
      className={`tab${nav.tab === item.tab ? ' active' : ''}`}
      data-tab={item.tab}
      onClick={() => openTab(item)}
    >
      <span className="tab-badge">{item.badge}</span>
      <span className="tab-label">{t(item.key, item.label)}</span>
      {chevron && (
        <span
          className="tab-chevron"
          onClick={(e) => {
            e.stopPropagation();
            setNav({ openGroup: nav.openGroup === item.tab ? null : item.tab });
          }}
        >
          ▸
        </span>
      )}
    </button>
  );

  return (
    <aside id="tab-sidebar" style={{ display: nav.mode === 'sim' ? undefined : 'none' }} aria-label="Simulation tabs">
      {SIDEBAR_ITEMS.map((item) => {
        if (!item.subs) return <span key={item.tab} style={{ display: 'contents' }}>{tabButton(item, false)}</span>;
        return (
          <div key={item.tab} className={`tab-group${nav.openGroup === item.tab ? ' open' : ''}`}>
            {tabButton(item, true)}
            <div className="tab-subnav">
              {item.subs.map((sub) => (
                <button
                  key={sub.key}
                  className={`tab-sub${subIsActive(sub.mode, nav.sub[item.tab]) ? ' active' : ''}`}
                  data-tab={item.tab}
                  onClick={() => { engineApi.switchToTab(item.tab); engineApi.applySub(sub.mode); }}
                >
                  {t(sub.key, sub.label)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
