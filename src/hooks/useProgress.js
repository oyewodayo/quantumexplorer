import { useSyncExternalStore } from 'react';
import { getProgress, subscribeProgress } from '../state/progress.js';

export function useProgress() {
  return useSyncExternalStore(subscribeProgress, getProgress);
}
