import { useSyncExternalStore } from 'react';
import { onThemeChange, toggleTheme } from '../core/theme.ts';

const getTheme = (): 'dark' | 'light' =>
  typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') !== 'light' ? 'dark' : 'light';

export function useTheme(): { theme: 'dark' | 'light'; isDark: boolean; toggleTheme: () => void } {
  const theme = useSyncExternalStore(onThemeChange, getTheme);
  return { theme, isDark: theme === 'dark', toggleTheme };
}
