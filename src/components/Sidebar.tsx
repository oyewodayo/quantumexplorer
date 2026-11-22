import { useI18n } from '../hooks/useI18n.ts';
import { useNav } from '../hooks/useNav.ts';
import { setNav, switchToTab, applySub } from '../state/nav.ts';
import { tabToPath } from '../state/routes.ts';
import { SIDEBAR_ITEMS, type SidebarItem, type TabSubMode } from './sidebarItems.ts';

const subIsActive = (mode: TabSubMode, current: TabSubMode = {}) => {
  const keys = Object.keys(mode) as Array<keyof TabSubMode>;
  return keys.length > 0 && keys.every((k) => mode[k] === current[k]);
};

export default function Sidebar() {
  const { t } = useI18n();
  const nav = useNav();

  const openTab = (item: SidebarItem, e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow Ctrl/Cmd/Shift-click or middle-click to open route in a new tab natively
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    switchToTab(item.tab);
    if (item.subs) setNav({ openGroup: item.tab });
  };

  const tabLink = (item: SidebarItem, chevron: boolean) => (
    <a
      href={tabToPath(item.tab)}
      className={`tab${nav.tab === item.tab ? ' active' : ''}`}
      data-tab={item.tab}
      style={{ textDecoration: 'none' }}
      onClick={(e) => openTab(item, e)}
    >
      <span className="tab-badge">{item.badge}</span>
      <span className="tab-label">{t(item.key, item.label)}</span>
      {chevron && (
        <span
          className="tab-chevron"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setNav({ openGroup: nav.openGroup === item.tab ? null : item.tab });
          }}
        >
          ▸
        </span>
      )}
    </a>
  );

  return (
    <aside id="tab-sidebar" style={{ display: nav.mode === 'sim' ? undefined : 'none' }} aria-label="Simulation navigation">
      {SIDEBAR_ITEMS.map((item) => {
        if (!item.subs) return <span key={item.tab} style={{ display: 'contents' }}>{tabLink(item, false)}</span>;
        return (
          <div key={item.tab} className={`tab-group${nav.openGroup === item.tab ? ' open' : ''}`}>
            {tabLink(item, true)}
            <div className="tab-subnav">
              {item.subs.map((sub) => (
                <button
                  key={sub.key}
                  className={`tab-sub${subIsActive(sub.mode, nav.sub[item.tab]) ? ' active' : ''}`}
                  data-tab={item.tab}
                  onClick={() => { switchToTab(item.tab); applySub(sub.mode); }}
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
