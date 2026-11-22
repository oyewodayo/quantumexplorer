import { SIDEBAR_ITEMS, type TabSubMode } from '../components/sidebarItems.ts';
import { MINDMAP_NODE_BY_ID } from '../content/roadmapContent.ts';
import { t } from '../i18n/index.ts';
import { showBlochTooltip, hideBlochTooltip } from '../core/blochRenderer.ts';
import { HOME_META, SITE_URL, getRouteByPath, getRouteByTab, tabToPath } from './routes.ts';

export type AppMode = 'roadmap' | 'sim';

export interface NavState {
  mode: AppMode;
  tab: string;
  sub: Record<string, TabSubMode>;
  openGroup: string | null;
  sharedQubitState: { theta: number; phi: number } | null;
  sharedCircuitGates: string[] | null;
}

const DEFAULT_SUB: Record<string, TabSubMode> = {
  qubit: { qubitMode: 'quantum', qubitSubmode: null },
  gates: { gatesDomain: 'quantum' },
  mathsconcept: { mathsSection: 'complex' },
  circuit: { circuitDomain: 'quantum', circuitMode: '1q' },
};

let state: NavState = {
  mode: 'roadmap',
  tab: 'qubit',
  sub: { ...DEFAULT_SUB },
  openGroup: 'qubit',
  sharedQubitState: null,
  sharedCircuitGates: null,
};

const listeners = new Set<() => void>();

export const getNav = (): NavState => state;

export function setNav(patch: Partial<NavState> | ((prev: NavState) => Partial<NavState>)): void {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  listeners.forEach((fn) => fn());
}

export function subscribeNav(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Records the mode a tab is currently in (sidebar sub-link highlighting). */
export function setTabSub(tab: string, subState: TabSubMode): void {
  setNav((s) => ({
    sub: {
      ...s.sub,
      [tab]: { ...(s.sub[tab] || {}), ...subState },
    },
  }));
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  if (typeof document === 'undefined') return;
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertCanonical(href: string): void {
  if (typeof document === 'undefined') return;
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Keeps the clean URL path (/quantum-gates), canonical link, OpenGraph tags,
 *  and document title synced with the active route. */
export function syncLocationAndTitle(push = false): void {
  if (typeof document === 'undefined' || typeof location === 'undefined') return;
  const home = state.mode === 'roadmap';
  const params = new URLSearchParams(location.search);
  params.delete('tab');

  let targetPath = '/';
  let title = HOME_META.title;
  let description = HOME_META.description;

  if (home) {
    ['theta', 'phi', 'circuit'].forEach((k) => params.delete(k));
  } else {
    const route = getRouteByTab(state.tab);
    targetPath = tabToPath(state.tab);
    const item = SIDEBAR_ITEMS.find((i) => i.tab === state.tab);
    const localizedLabel = item ? t(item.key, item.label) : '';
    title = route ? route.title : localizedLabel ? `${localizedLabel} · Quantum Explorer` : HOME_META.title;
    description = route ? route.description : HOME_META.description;
    if (location.pathname !== targetPath) {
      ['theta', 'phi', 'circuit'].forEach((k) => params.delete(k));
    }
  }

  document.title = title;
  const canonicalUrl = `${SITE_URL}${targetPath === '/' ? '/' : targetPath}`;
  upsertCanonical(canonicalUrl);
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonicalUrl);

  const qs = params.toString();
  const nextUrl = targetPath + (qs ? '?' + qs : '');
  const currentUrl = location.pathname + location.search;
  if (nextUrl !== currentUrl) {
    try {
      if (push) history.pushState(null, '', nextUrl);
      else history.replaceState(null, '', nextUrl);
    } catch { /* sandboxed */ }
  }
}

export function switchToTab(name: string): void {
  setNav({ mode: 'sim', tab: name });
  if (typeof window !== 'undefined') window.scrollTo(0, 0);
  syncLocationAndTitle(true);
}

export function setAppMode(mode: AppMode): void {
  setNav({ mode });
  if (typeof window !== 'undefined') window.scrollTo(0, 0);
  syncLocationAndTitle(true);
}

export function applySub(mode: TabSubMode): void {
  if (mode.qubitMode !== undefined) {
    setTabSub('qubit', {
      qubitMode: mode.qubitMode,
      qubitSubmode: mode.qubitMode === 'quantum' ? (mode.qubitSubmode ?? null) : undefined,
    });
  } else if (mode.qubitSubmode !== undefined) {
    setTabSub('qubit', { qubitMode: 'quantum', qubitSubmode: mode.qubitSubmode });
  }
  if (mode.gatesDomain !== undefined) {
    setTabSub('gates', { gatesDomain: mode.gatesDomain });
  }
  if (mode.mathsSection !== undefined) {
    setTabSub('mathsconcept', { mathsSection: mode.mathsSection });
  }
  if (mode.circuitDomain !== undefined || mode.circuitMode !== undefined) {
    setTabSub('circuit', {
      ...(mode.circuitDomain !== undefined ? { circuitDomain: mode.circuitDomain } : {}),
      ...(mode.circuitMode !== undefined ? { circuitMode: mode.circuitMode } : {}),
    });
  }
}

export function goToNode(nodeId: string): void {
  const node = MINDMAP_NODE_BY_ID[nodeId];
  if (!node || !node.tab) return;
  setNav({ mode: 'sim', tab: node.tab, openGroup: node.tab });
  const subPatch: TabSubMode = {};
  if (node.circuitDomain) subPatch.circuitDomain = node.circuitDomain;
  if (node.circuitMode) subPatch.circuitMode = node.circuitMode;
  if (node.qubitMode) {
    subPatch.qubitMode = node.qubitMode;
    subPatch.qubitSubmode = node.qubitSubmode ?? null;
  } else if (node.qubitSubmode) {
    subPatch.qubitMode = 'quantum';
    subPatch.qubitSubmode = node.qubitSubmode;
  }
  if (node.gatesDomain) subPatch.gatesDomain = node.gatesDomain;
  if (node.statevecMode) subPatch.statevecMode = node.statevecMode;
  if (node.mathsSection) subPatch.mathsSection = node.mathsSection;
  if (Object.keys(subPatch).length > 0) {
    setTabSub(node.tab, subPatch);
  }
  if (typeof window !== 'undefined') window.scrollTo(0, 0);
  syncLocationAndTitle(true);
}

const SIDEBAR_TAB_IDS = new Set(SIDEBAR_ITEMS.map((i) => i.tab));

export function initNavFromURL(): boolean {
  if (typeof location === 'undefined') return false;
  const params = new URLSearchParams(location.search);

  const theta = params.get('theta');
  const phi = params.get('phi');
  const sharedQubitState =
    theta !== null && phi !== null
      ? { theta: parseFloat(theta), phi: parseFloat(phi) }
      : null;

  const circuitParam = params.get('circuit');
  const sharedCircuitGates = circuitParam
    ? circuitParam.split(',').filter(Boolean).slice(0, 8)
    : null;

  if (sharedQubitState || sharedCircuitGates) {
    setNav({ sharedQubitState, sharedCircuitGates });
  }

  // 1. Clean semantic path (/quantum-gates, /grovers-search, ...)
  const pathRoute = getRouteByPath(location.pathname);
  if (pathRoute && SIDEBAR_TAB_IDS.has(pathRoute.tab)) {
    setNav({ mode: 'sim', tab: pathRoute.tab, openGroup: pathRoute.tab });
    if (sharedQubitState && pathRoute.tab === 'qubit') {
      setTabSub('qubit', { qubitMode: 'quantum', qubitSubmode: '1q' });
    }
    syncLocationAndTitle(false);
    return true;
  }

  // 2. Legacy ?tab= fallback (upgrades URL to clean path automatically)
  const legacyTab = params.get('tab');
  if (legacyTab && SIDEBAR_TAB_IDS.has(legacyTab)) {
    setNav({ mode: 'sim', tab: legacyTab, openGroup: legacyTab });
    if (sharedQubitState && legacyTab === 'qubit') {
      setTabSub('qubit', { qubitMode: 'quantum', qubitSubmode: '1q' });
    }
    syncLocationAndTitle(false);
    return true;
  }

  setNav({ mode: 'roadmap' });
  syncLocationAndTitle(false);
  return false;
}

export function bindPopState(): () => void {
  if (typeof window === 'undefined') return () => {};
  const onPop = () => {
    initNavFromURL();
  };
  window.addEventListener('popstate', onPop);
  return () => window.removeEventListener('popstate', onPop);
}

export const engineApi = {
  switchToTab,
  applySub,
  setAppMode,
  goToNode,
  showTooltip: showBlochTooltip,
  hideTooltip: hideBlochTooltip,
};
