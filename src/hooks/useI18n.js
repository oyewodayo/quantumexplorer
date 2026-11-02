import { useSyncExternalStore } from 'react';
import { t, getLanguage, setLanguage, subscribeLanguage, getLanguageVersion } from '../i18n/index.js';

/** Re-renders the component whenever the language changes. */
export function useI18n() {
  useSyncExternalStore(subscribeLanguage, getLanguageVersion);
  return { t, lang: getLanguage(), setLanguage };
}
