import en from './locales/en.js';

// English ships in the main bundle (it is the fallback for every key);
// French and Spanish are fetched only when selected.
const LOADERS = {
  fr: () => import('./locales/fr.js'),
  es: () => import('./locales/es.js'),
};
export const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
];

const STORAGE_KEY = 'qe-lang';
const DEFAULT = 'en';
const LOCALES = { en };
let currentLang = DEFAULT;
let version = 0;
const listeners = new Set();
const langChangeCallbacks = [];

function readSaved() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

async function loadLocale(code) {
  if (LOCALES[code] || !LOADERS[code]) return;
  try {
    LOCALES[code] = (await LOADERS[code]()).default;
  } catch (e) {
    console.error('Could not load locale', code, e);
  }
}

/** Dotted-path lookup into the active locale, falling back to English and
 *  then to `fallback`, so a missing key never shows up blank. */
export function t(key, fallback) {
  const lookup = (code) => {
    const locale = LOCALES[code];
    if (!locale) return undefined;
    return key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), locale);
  };
  const active = lookup(currentLang);
  if (active !== undefined) return active;
  const english = lookup(DEFAULT);
  if (english !== undefined) return english;
  return fallback !== undefined ? fallback : key;
}

/** Sets text (or an attribute) of every [data-i18n] element under `root`.
 *  [data-i18n-html] values are trusted, hand-written markup. */
export function applyTranslations(root) {
  (root || document).querySelectorAll('[data-i18n]').forEach((el) => {
    const value = t(el.dataset.i18n, el.dataset.i18nDefault);
    if (el.dataset.i18nAttr) el.setAttribute(el.dataset.i18nAttr, value);
    else if (el.dataset.i18nHtml !== undefined) el.innerHTML = value;
    else el.textContent = value;
  });
}

export function onLangChange(fn) { langChangeCallbacks.push(fn); }
export const getLanguage = () => currentLang;

// useSyncExternalStore plumbing: React components re-render on a change.
export const subscribeLanguage = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getLanguageVersion = () => version;

function announce() {
  version++;
  document.documentElement.setAttribute('lang', currentLang);
  applyTranslations();
  langChangeCallbacks.forEach((fn) => fn());
  listeners.forEach((fn) => fn());
}

export async function setLanguage(code) {
  await loadLocale(code);
  currentLang = LOCALES[code] ? code : DEFAULT;
  try { localStorage.setItem(STORAGE_KEY, currentLang); } catch { /* private mode */ }
  announce();
}

/** Restores the saved language (loading its locale first) and does the
 *  first translation pass. */
export async function initI18n() {
  const saved = readSaved();
  if (saved) await loadLocale(saved);
  currentLang = saved && LOCALES[saved] ? saved : DEFAULT;
  announce();
}
