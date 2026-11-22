import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import AppHeader from './components/AppHeader.tsx';
import Sidebar from './components/Sidebar.tsx';
import AppFooter from './components/AppFooter.tsx';
import Tour from './components/Tour.tsx';
import { initI18n } from './i18n/index.ts';
import { refreshThemeColors } from './core/theme.ts';
import { bindPopState, initNavFromURL, syncLocationAndTitle } from './state/nav.ts';
import { useNav } from './hooks/useNav.ts';

const RoadmapView = lazy(() => import('./components/RoadmapView.tsx'));

const TAB_COMPONENTS: Record<string, React.LazyExoticComponent<ComponentType>> = {
  introduction: lazy(() => import('./components/tabs/IntroductionTab.tsx')),
  'important-concepts': lazy(() => import('./components/tabs/ImportantConceptsTab.tsx')),
  qubit: lazy(() => import('./components/tabs/QubitTab.tsx')),
  mathsconcept: lazy(() => import('./components/tabs/MathsconceptTab.tsx')),
  gates: lazy(() => import('./components/tabs/GatesTab.tsx')),
  circuit: lazy(() => import('./components/tabs/CircuitTab.tsx')),
  bellstates: lazy(() => import('./components/tabs/BellstatesTab.tsx')),
  measure: lazy(() => import('./components/tabs/MeasureTab.tsx')),
  entangle: lazy(() => import('./components/tabs/EntangleTab.tsx')),
  tunnel: lazy(() => import('./components/tabs/TunnelTab.tsx')),
  interference: lazy(() => import('./components/tabs/InterferenceTab.tsx')),
  beamsplitter: lazy(() => import('./components/tabs/BeamsplitterTab.tsx')),
  sterngerlach: lazy(() => import('./components/tabs/SterngerlachTab.tsx')),
  teleport: lazy(() => import('./components/tabs/TeleportTab.tsx')),
  superdense: lazy(() => import('./components/tabs/SuperdenseTab.tsx')),
  noise: lazy(() => import('./components/tabs/NoiseTab.tsx')),
  grover: lazy(() => import('./components/tabs/GroverTab.tsx')),
};

function initModeGridThumbs(): () => void {
  const ensureAndSync = () => {
    const grids = document.querySelectorAll<HTMLElement>('.mode-grid');
    grids.forEach((grid) => {
      let thumb = grid.querySelector<HTMLDivElement>(':scope > .mode-grid-thumb');
      if (!thumb) {
        thumb = document.createElement('div');
        thumb.className = 'mode-grid-thumb';
        grid.insertBefore(thumb, grid.firstChild);
      }
      const active = grid.querySelector<HTMLElement>('.mode-btn.active');
      if (!active || active.offsetWidth === 0) {
        thumb.style.opacity = '0';
        return;
      }
      thumb.style.opacity = '1';
      thumb.style.width = `${active.offsetWidth}px`;
      thumb.style.height = `${active.offsetHeight}px`;
      thumb.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    });
  };

  let rafId = 0;
  const scheduleSync = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      ensureAndSync();
    });
  };

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'style'],
    childList: true,
    subtree: true,
  });
  ensureAndSync();
  window.addEventListener('resize', scheduleSync);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    observer.disconnect();
    window.removeEventListener('resize', scheduleSync);
  };
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [openedSharedLink, setOpenedSharedLink] = useState(false);
  const nav = useNav();

  useEffect(() => {
    refreshThemeColors();
    const shared = initNavFromURL();
    setOpenedSharedLink(shared);
    initI18n().then(() => {
      syncLocationAndTitle(false);
      setReady(true);
    });
    const cleanupPop = bindPopState();
    const cleanupThumbs = initModeGridThumbs();
    return () => {
      cleanupPop();
      cleanupThumbs();
    };
  }, []);

  const ActiveTab = TAB_COMPONENTS[nav.tab] ?? TAB_COMPONENTS.qubit;

  return (
    <>
      <AppHeader />
      <Sidebar />
      <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
        {nav.mode === 'roadmap' ? <RoadmapView /> : <ActiveTab />}
      </Suspense>
      <AppFooter />
      {ready && <Tour skipTour={openedSharedLink} />}
    </>
  );
}
