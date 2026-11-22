import en from './locales/en.ts';

export type LanguageCode = 'en' | 'fr' | 'es';
type LocaleNode = string | { [key: string]: LocaleNode };
type LocaleTree = { [key: string]: LocaleNode };

const LOADERS: Partial<Record<LanguageCode, () => Promise<{ default: LocaleTree }>>> = {
  fr: () => import('./locales/fr.ts') as unknown as Promise<{ default: LocaleTree }>,
  es: () => import('./locales/es.ts') as unknown as Promise<{ default: LocaleTree }>,
};

export const LANGUAGES: Array<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
];

const STORAGE_KEY = 'qe-lang';
const DEFAULT: LanguageCode = 'en';
const LOCALES: Partial<Record<LanguageCode, LocaleTree>> = { en: en as unknown as LocaleTree };
let currentLang: LanguageCode = DEFAULT;
let version = 0;
const listeners = new Set<() => void>();
const langChangeCallbacks: Array<() => void> = [];

function readSaved(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

async function loadLocale(code: LanguageCode): Promise<void> {
  if (LOCALES[code] || !LOADERS[code]) return;
  try {
    LOCALES[code] = (await LOADERS[code]!()).default;
  } catch (e) {
    console.error('Could not load locale', code, e);
  }
}

/** Dotted-path lookup into the active locale, falling back to English and
 *  then to `fallback`, so a missing key never shows up blank. */
export function t(key: string, fallback?: string): string {
  const lookup = (code: LanguageCode): string | undefined => {
    const locale = LOCALES[code];
    if (!locale) return undefined;
    const res = key.split('.').reduce<LocaleNode | undefined>(
      (obj, k) => (obj && typeof obj === 'object' && obj[k] !== undefined ? obj[k] : undefined),
      locale
    );
    return typeof res === 'string' ? res : undefined;
  };
  const active = lookup(currentLang);
  if (active !== undefined) return active;
  const english = lookup(DEFAULT);
  if (english !== undefined) return english;
  return fallback !== undefined ? fallback : key;
}

/** Sets text (or an attribute) of every [data-i18n] element under `root`.
 *  [data-i18n-html] values are trusted, hand-written markup. */
export function applyTranslations(root?: ParentNode): void {
  if (typeof document === 'undefined') return;
  (root || document).querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    const value = t(key, el.dataset.i18nDefault);
    if (el.dataset.i18nAttr) el.setAttribute(el.dataset.i18nAttr, value);
    else if (el.dataset.i18nHtml !== undefined) el.innerHTML = value;
    else el.textContent = value;
  });
}

export function onLangChange(fn: () => void): void { langChangeCallbacks.push(fn); }
export const getLanguage = (): LanguageCode => currentLang;

// useSyncExternalStore plumbing: React components re-render on a change.
export const subscribeLanguage = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const getLanguageVersion = (): number => version;

function announce(): void {
  version++;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', currentLang);
    applyTranslations();
  }
  langChangeCallbacks.forEach((fn) => fn());
  listeners.forEach((fn) => fn());
}

export async function setLanguage(code: LanguageCode | string): Promise<void> {
  const validCode = (code === 'en' || code === 'fr' || code === 'es') ? code : DEFAULT;
  await loadLocale(validCode);
  currentLang = LOCALES[validCode] ? validCode : DEFAULT;
  try { localStorage.setItem(STORAGE_KEY, currentLang); } catch { /* private mode */ }
  announce();
}

/** Restores the saved language (loading its locale first) and does the
 *  first translation pass. */
export async function initI18n(): Promise<void> {
  const saved = readSaved();
  if (saved === 'en' || saved === 'fr' || saved === 'es') {
    await loadLocale(saved);
    currentLang = LOCALES[saved] ? saved : DEFAULT;
  } else {
    currentLang = DEFAULT;
  }
  announce();
}
