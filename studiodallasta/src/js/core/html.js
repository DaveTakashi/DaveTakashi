/**
 * html.js — Motore di templating isomorfo e sicuro (browser + Node).
 * Isomorphic, XSS-safe templating engine (browser + Node).
 *
 * Ogni valore interpolato viene sottoposto a escape, salvo che sia
 * esplicitamente marcato con raw(). Every interpolated value is escaped
 * unless explicitly wrapped with raw().
 */

export class Raw {
  constructor(value) { this.value = String(value); }
  toString() { return this.value; }
}

/** Marca una stringa come HTML già sicuro. Marks a string as trusted HTML. */
export const raw = (value) => new Raw(value);

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape di testo/attributi. Escapes text and attribute values. */
export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ESC_MAP[c]);

const format = (v) => {
  if (v === null || v === undefined || v === false) return '';
  if (v instanceof Raw) return v.value;
  if (Array.isArray(v)) return v.map(format).join('');
  return esc(v);
};

/** Tagged template: html`<p>${text}</p>` → Raw */
export const html = (strings, ...values) =>
  raw(strings.reduce((out, str, i) => out + str + (i < values.length ? format(values[i]) : ''), ''));

/**
 * Consente solo URL sicuri (http, https, mailto, tel, ancore e relativi).
 * Allows only safe URLs (http, https, mailto, tel, anchors, relative).
 */
export const safeUrl = (url) => {
  const u = String(url ?? '').trim();
  if (!u) return '#';
  if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(u)) return u;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) return u; // relativo senza schema / relative, no scheme
  return '#';
};

/** Unisce classi condizionali. Joins conditional class names. */
export const cx = (...parts) => parts.flat().filter(Boolean).join(' ');

/** Slug sicuro per id/anchor. Safe slug for ids/anchors. */
export const slug = (s) =>
  String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
