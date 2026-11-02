// Navigation state shared between React components and the simulation
// engine: which page mode is showing, which tab is open, the mode selected
// inside each tab (for sidebar sub-link highlighting) and which sidebar
// group is expanded.
let state = {
  mode: 'roadmap',        // 'roadmap' (Home map) or 'sim' (a simulation tab)
  tab: 'qubit',
  sub: {},                // { [tab]: { qubitMode, qubitSubmode, gatesDomain, mathsSection } }
  openGroup: 'qubit',
};
const listeners = new Set();

export const getNav = () => state;

export function setNav(patch) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  listeners.forEach((fn) => fn());
}

export function subscribeNav(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Records the mode a tab is currently in (sidebar sub-link highlighting). */
export function setTabSub(tab, subState) {
  setNav((s) => ({ sub: { ...s.sub, [tab]: subState } }));
}

// Functions the engine registers so React can drive it.
export const engineApi = { switchToTab() {}, applySub() {} };
