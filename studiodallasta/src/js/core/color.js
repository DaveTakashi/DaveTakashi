/**
 * color.js — Utilità colore e contrasto WCAG 2.2.
 * Color & WCAG 2.2 contrast utilities.
 */

export function parseHex(hex) {
  let h = String(hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export const toHex = (rgb) =>
  '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

export const rgba = (hex, alpha) => {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.round(alpha * 1000) / 1000})`;
};

/** Luminanza relativa (WCAG). Relative luminance. */
export function luminance(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapporto di contrasto 1–21. Contrast ratio 1–21. */
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Miscela due colori (t=0 → a, t=1 → b). Mixes two colors. */
export function mix(a, b, t) {
  const A = parseHex(a), B = parseHex(b);
  if (!A || !B) return a;
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
}

/** Testo leggibile (bianco o quasi-nero) su uno sfondo. Readable text on a background. */
export const readableOn = (bg) =>
  contrast(bg, '#ffffff') >= contrast(bg, '#0b0b0b') ? '#ffffff' : '#0b0b0b';

/**
 * Regola un colore finché raggiunge il contrasto minimo sullo sfondo.
 * Nudges a color until it meets the minimum contrast on the background.
 * Garantisce AA (4.5:1) anche con colori d'accento scelti dall'utente.
 */
export function ensureContrast(color, bg, min = 4.5) {
  if (!parseHex(color) || !parseHex(bg)) return color;
  if (contrast(color, bg) >= min) return color;
  const target = luminance(bg) > 0.4 ? '#000000' : '#ffffff';
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = mix(color, target, t);
    if (contrast(c, bg) >= min) return c;
  }
  return target;
}
