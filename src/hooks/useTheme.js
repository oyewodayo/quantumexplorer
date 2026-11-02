import { useSyncExternalStore } from 'react';
import { onThemeChange, toggleTheme } from '../core/theme.js';

const getTheme = () => (document.documentElement.getAttribute('data-theme') !== 'light' ? 'dark' : 'light');

export function useTheme() {
  const theme = useSyncExternalStore(onThemeChange, getTheme);
  return { theme, isDark: theme === 'dark', toggleTheme };
}
