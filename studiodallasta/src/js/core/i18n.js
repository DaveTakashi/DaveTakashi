/**
 * i18n.js — Risoluzione dei contenuti multilingua.
 * Multilingual content resolution.
 *
 * Un campo può essere una stringa semplice oppure un oggetto per lingua:
 * A field can be a plain string or a per-locale object:
 *   "title": "Ciao"                       → uguale in tutte le lingue / same everywhere
 *   "title": { "it": "Ciao", "en": "Hi" } → tradotto / translated
 */

export const DEFAULT_LOCALE = 'it';

export function createTranslator(locale, fallback = DEFAULT_LOCALE) {
  /** Risolve un valore localizzato. Resolves a localized value. */
  const t = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(t);
    if (typeof value === 'object') {
      if (locale in value) return value[locale];
      if (fallback in value) return value[fallback];
      const first = Object.values(value)[0];
      return typeof first === 'string' ? first : '';
    }
    return String(value);
  };

  /** Stringhe di interfaccia da data.ui con chiave. UI strings by key. */
  t.ui = (data, key) => t(data?.ui?.[key]) || key;
  t.locale = locale;
  return t;
}

/** Formattazione date localizzata. Localized date formatting. */
export const formatDate = (iso, locale) => {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'it-IT', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(iso));
  } catch { return iso; }
};
