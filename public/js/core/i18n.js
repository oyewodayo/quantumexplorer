'use strict';
// No dependencies. Loaded before js/locales/*.js (each of which calls
// registerLocale() at its own top level) and before app.js (which calls
// initI18n() once from DOMContentLoaded, the same place it calls
// refreshThemeColors()/syncThemeIcon() — see core/theme.js for the
// sibling pattern this file deliberately mirrors: a localStorage-backed
// preference, an attribute on <html>, and a callback registry so parts of
// the app that need to react to a change don't have to be known by name
// here.
//
// Scope: this drives translation of static content only — page chrome
// (index.html's [data-i18n] elements), the roadmap lesson/quiz text, and
// gate descriptions (see js/roadmap.js and js/core/gates.js, which read
// through t() with their existing English string as the fallback). It
// does NOT cover the sentences individual tabs build at runtime by
// mixing a variable into a template literal (e.g. circuit-tab.js's
// "Checkpoint 3 is now H." narration) — those stay English; translating
// them safely means restructuring each call site into a template+params
// form, not just swapping a string, and is out of scope here.

// ─── LOCALE REGISTRY ────────────────────────────────────────────────────
const LOCALES = {};
const I18N_STORAGE_KEY = 'qe-lang';
const I18N_DEFAULT = 'en';
let currentLang = I18N_DEFAULT;

/** Called once per language, at the top level of each js/locales/*.js
 *  file — e.g. registerLocale('fr', { nav: {...}, lessons: {...}, ... }). */
function registerLocale(code, data) {
  LOCALES[code] = data;
}

/** Dotted-path lookup (e.g. 'lessons.qubit.title') into the active
 *  locale. Falls back to the English locale if the active one is missing
 *  the key, then to `fallback` (the string already hardcoded at the call
 *  site before i18n existed) if English is missing it too — so a typo'd
 *  key or an incomplete translation degrades to correct English instead
 *  of a blank string or a raw dotted key leaking into the UI. */
function t(key, fallback) {
  const lookup = (localeCode) => {
    const locale = LOCALES[localeCode];
    if (!locale) return undefined;
    return key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : undefined, locale);
  };
  const active = lookup(currentLang);
  if (active !== undefined) return active;
  const english = lookup(I18N_DEFAULT);
  if (english !== undefined) return english;
  return fallback !== undefined ? fallback : key;
}

// ─── APPLYING TRANSLATIONS TO THE DOM ──────────────────────────────────
/** Walks every [data-i18n] element under `root` and sets its text (or,
 *  for [data-i18n-attr="aria-label"] etc., that attribute instead) from
 *  t(key). `root` defaults to the whole document but can be scoped to a
 *  freshly-rendered subtree (e.g. roadmap.js re-renders the mind-map on
 *  every expand/collapse — no need to re-walk the entire page for that).
 *  A handful of elements carry inline markup inside their translatable
 *  text (a <b> emphasis, a <ul> list — e.g. the Introduction tab) — those
 *  add [data-i18n-html] so the locale value is trusted, hand-written
 *  markup (not user input) and gets set via innerHTML instead of
 *  textContent. */
function applyTranslations(root) {
  (root || document).querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const value = t(key, el.dataset.i18nDefault);
    if (el.dataset.i18nAttr) {
      el.setAttribute(el.dataset.i18nAttr, value);
    } else if (el.dataset.i18nHtml !== undefined) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });
}

// ─── LANGUAGE-CHANGE CALLBACKS ──────────────────────────────────────────
// Anything that renders translatable text into markup i18n.js can't
// reach with a static [data-i18n] walk (e.g. roadmap.js's mind-map, built
// fresh from JS on every render) registers a re-render callback here
// instead of this file needing to know those renderers by name.
const langChangeCallbacks = [];
function onLangChange(fn) { langChangeCallbacks.push(fn); }

/** Switches the active language, persists it, updates <html lang>, and
 *  re-renders every translatable surface. Falls back to English for an
 *  unrecognized code (e.g. a locale file that failed to load) rather
 *  than leaving the page in a half-translated state. */
function setLanguage(code) {
  currentLang = LOCALES[code] ? code : I18N_DEFAULT;
  localStorage.setItem(I18N_STORAGE_KEY, currentLang);
  document.documentElement.setAttribute('lang', currentLang);
  const select = document.getElementById('lang-select');
  if (select) select.value = currentLang;
  applyTranslations();
  langChangeCallbacks.forEach(fn => fn());
}

/** Restores a saved language preference (falling back to English if none
 *  is saved, or if the saved code's locale file didn't register — e.g.
 *  it was removed) and does the initial translation pass. Called once
 *  from app.js's DOMContentLoaded, after every locales/*.js file has run. */
function initI18n() {
  const saved = localStorage.getItem(I18N_STORAGE_KEY);
  currentLang = (saved && LOCALES[saved]) ? saved : I18N_DEFAULT;
  document.documentElement.setAttribute('lang', currentLang);
  const select = document.getElementById('lang-select');
  if (select) select.value = currentLang;
  applyTranslations();
}
