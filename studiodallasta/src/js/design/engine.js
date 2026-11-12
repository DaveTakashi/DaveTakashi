/**
 * engine.js — Motore di design: da preset + opzioni → CSS custom properties.
 * Design engine: preset + options → CSS custom properties.
 *
 * Funzione pura (usabile in browser, Node/SSR, React). Pure function.
 *
 *   computeDesign(designsDoc, state, { prefersDark }) → { vars, attrs, design, scheme }
 */
import { rgba, mix, readableOn, ensureContrast, parseHex } from '../core/color.js';

export const DEFAULT_STATE = Object.freeze({
  design: null,        // id preset; null → designsDoc.default
  scheme: 'auto',      // 'auto' | 'light' | 'dark'
  accent: null,        // '#rrggbb' | null (usa quello del preset / preset's own)
  glass: null,         // 0–100 trasparenza | null (default del preset)
  radius: 'design',    // 'design' | 'sharp' | 'soft' | 'round'
  density: 'comfortable', // 'compact' | 'comfortable' | 'airy'
  textScale: 1,        // 1 | 1.125 | 1.25
  motion: 'auto'       // 'auto' | 'reduce'
});

const RADIUS = { sharp: 2, soft: 12, round: 24 };
const DENSITY = { compact: 0.8, comfortable: 1, airy: 1.25 };

/** Normalizza lo stato (valori sconosciuti → default). Sanitizes state. */
export function normalizeState(input = {}, designsDoc) {
  const s = { ...DEFAULT_STATE, ...(input || {}) };
  const ids = (designsDoc?.designs || []).map((d) => d.id);
  if (!ids.includes(s.design)) s.design = designsDoc?.default || ids[0] || null;
  if (!['auto', 'light', 'dark'].includes(s.scheme)) s.scheme = 'auto';
  if (s.accent && !parseHex(s.accent)) s.accent = null;
  if (s.glass !== null) s.glass = Math.max(0, Math.min(100, Number(s.glass) || 0));
  if (!['design', 'sharp', 'soft', 'round'].includes(s.radius)) s.radius = 'design';
  if (!(s.density in DENSITY)) s.density = 'comfortable';
  s.textScale = [1, 1.125, 1.25].includes(Number(s.textScale)) ? Number(s.textScale) : 1;
  if (!['auto', 'reduce'].includes(s.motion)) s.motion = 'auto';
  return s;
}

export function computeDesign(designsDoc, rawState, { prefersDark = false } = {}) {
  const state = normalizeState(rawState, designsDoc);
  const design = designsDoc.designs.find((d) => d.id === state.design) || designsDoc.designs[0];
  const scheme = state.scheme === 'auto' ? (prefersDark ? 'dark' : 'light') : state.scheme;
  const palette = { ...design.colors.light, ...(design.colors[scheme] || {}) };
  const shape = { ...designsDoc.base, ...design.shape };

  // — Trasparenza / Transparency —
  const glassAllowed = shape.glassLocked !== true;
  const glass = glassAllowed ? (state.glass ?? shape.glass ?? 0) : 0; // 0..100
  const surfaceAlpha = 1 - (glass / 100) * 0.62;   // mai sotto ~38% di opacità → leggibilità
  const blur = Math.round((glass / 100) * (shape.blur ?? 24));

  // — Accento con contrasto garantito / Accent with guaranteed contrast —
  const bg = palette.bg;
  const accentRaw = state.accent || palette.accent;
  const accent = ensureContrast(accentRaw, palette.surface || bg, 4.5);
  const accentText = state.accent ? readableOn(accent) : (palette.accentContrast || readableOn(accent));
  const accentSoft = state.accent ? mix(accent, bg, scheme === 'dark' ? 0.78 : 0.86) : palette.accentSoft;

  const radius = state.radius === 'design' ? shape.radius : RADIUS[state.radius];

  const vars = {
    '--c-bg': bg,
    '--c-bg-2': palette.bg2,
    '--c-orb-1': palette.orb1,
    '--c-orb-2': palette.orb2,
    '--c-orb-3': palette.orb3,
    '--c-surface': rgba(palette.surface, surfaceAlpha),
    '--c-surface-solid': palette.surface,
    '--c-surface-raised': rgba(palette.surface, Math.min(1, surfaceAlpha + 0.18)),
    '--c-border': palette.border,
    '--c-text': palette.text,
    '--c-text-muted': palette.muted,
    '--c-accent': accent,
    '--c-accent-contrast': accentText,
    '--c-accent-soft': accentSoft,
    '--c-focus': palette.focus || accent,
    '--blur': `${blur}px`,
    '--glass-saturate': glass > 0 ? '160%' : '100%',
    '--radius': `${radius}px`,
    '--radius-sm': `${Math.max(2, Math.round(radius * 0.5))}px`,
    '--radius-lg': `${Math.round(radius * 1.6)}px`,
    '--density': String(DENSITY[state.density]),
    '--text-scale': String(state.textScale),
    '--font-sans': shape.fontSans,
    '--font-display': shape.fontDisplay,
    '--display-weight': String(shape.displayWeight),
    '--display-tracking': shape.displayTracking,
    '--shadow': scheme === 'dark' ? shape.shadowDark : shape.shadow,
    '--border-width': `${shape.borderWidth ?? 1}px`,
    '--focus-width': `${shape.focusWidth ?? 3}px`,
    '--orb-opacity': String(shape.orbs === false ? 0 : (scheme === 'dark' ? 0.55 : 0.85))
  };

  const attrs = {
    'data-design': design.id,
    'data-scheme': scheme,
    'data-motion': state.motion,
    'data-glass': glass > 0 ? 'on' : 'off',
    'data-underline-links': shape.underlineLinks ? 'true' : 'false'
  };

  return { vars, attrs, design, scheme, state };
}

/** Applica il risultato al DOM. Applies the result to an element (default <html>). */
export function applyDesign(result, root = document.documentElement) {
  for (const [k, v] of Object.entries(result.vars)) root.style.setProperty(k, v);
  for (const [k, v] of Object.entries(result.attrs)) root.setAttribute(k, v);
  root.style.colorScheme = result.scheme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', result.vars['--c-bg']);
}

/** Serializza i token correnti (per CMS / Figma / React). Exports tokens. */
export function exportTokens(result) {
  return {
    $schema: 'https://studiodallasta.it/schemas/design-tokens.json',
    design: result.design.id,
    scheme: result.scheme,
    options: result.state,
    tokens: result.vars,
    generatedAt: new Date().toISOString()
  };
}

/** Converte vars in testo CSS (per SSR / prerender). Vars → CSS text. */
export const varsToCss = (vars, selector = ':root') =>
  `${selector}{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}`;
