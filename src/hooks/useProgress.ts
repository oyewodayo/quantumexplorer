import { useSyncExternalStore } from 'react';
import { getProgress, subscribeProgress, type ProgressState } from '../state/progress.ts';

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribeProgress, getProgress);
}
