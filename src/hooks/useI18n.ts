import { useSyncExternalStore } from 'react';
import { t, getLanguage, setLanguage, subscribeLanguage, getLanguageVersion, type LanguageCode } from '../i18n/index.ts';

/** Re-renders the component whenever the language changes. */
export function useI18n(): {
  t: (key: string, fallback?: string) => string;
  lang: LanguageCode;
  setLanguage: (code: LanguageCode | string) => Promise<void>;
} {
  useSyncExternalStore(subscribeLanguage, getLanguageVersion);
  return { t, lang: getLanguage(), setLanguage };
}
