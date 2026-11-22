import { useSyncExternalStore } from 'react';
import { getNav, subscribeNav, type NavState } from '../state/nav.ts';

export function useNav(): NavState {
  return useSyncExternalStore(subscribeNav, getNav);
}
