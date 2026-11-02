import { useSyncExternalStore } from 'react';
import { getNav, subscribeNav } from '../state/nav.js';

export function useNav() {
  return useSyncExternalStore(subscribeNav, getNav);
}
