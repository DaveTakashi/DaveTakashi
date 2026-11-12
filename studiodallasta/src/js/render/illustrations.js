/**
 * illustrations.js — Illustrazioni SVG originali, tematizzate via CSS custom properties.
 * Original SVG illustrations, themed via CSS custom properties.
 *
 * Usano var(--c-accent), var(--c-orb-*), var(--c-surface-solid)… quindi cambiano
 * automaticamente con il design scelto (nessun asset da rigenerare).
 * They follow the active design automatically (no assets to regenerate).
 *
 * Per sostituirle con fotografie: nel JSON impostare  "image": { "src": "...", "alt": "..." }
 * To replace with photos set "image": { "src", "alt" } in the JSON.
 */
import { raw, esc } from '../core/html.js';

const uid = (() => { let n = 0; return (p) => `${p}${++n}`; })();

/** Hero: cruscotto di vetro con bilancio ETS e andamento. Glass dashboard composition. */
function hero(alt = "Illustrazione: cruscotto con bilancio, indicatori e scadenze dello studio") {
  const g = uid('hg');
  return `
<svg class="illu illu--hero" viewBox="0 0 560 480" role="img" aria-labelledby="${g}t" xmlns="http://www.w3.org/2000/svg">
  <title id="${g}t">${esc(alt)}</title>
  <defs>
    <linearGradient id="${g}a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="var(--c-orb-1)"/><stop offset="1" stop-color="var(--c-orb-2)"/>
    </linearGradient>
    <linearGradient id="${g}b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--c-accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--c-accent)" stop-opacity="0"/>
    </linearGradient>
    <filter id="${g}s" x="-50%" y="-50%" width="200%" height="220%" filterUnits="objectBoundingBox"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#0b1a1c" flood-opacity=".14"/></filter>
  </defs>
  <circle cx="400" cy="120" r="110" fill="url(#${g}a)" opacity=".75"/>
  <circle cx="120" cy="380" r="80" fill="var(--c-orb-3)" opacity=".8"/>

  <g filter="url(#${g}s)">
    <rect x="40" y="70" width="380" height="270" rx="22" fill="var(--c-surface-solid)" fill-opacity=".72" stroke="var(--c-border)"/>
  </g>
  <rect x="64" y="96" width="120" height="10" rx="5" fill="var(--c-text)" opacity=".75"/>
  <rect x="64" y="116" width="76" height="8" rx="4" fill="var(--c-text-muted)" opacity=".45"/>
  <g fill="var(--c-text-muted)" opacity=".18">
    <rect x="64" y="170" width="332" height="1"/><rect x="64" y="215" width="332" height="1"/><rect x="64" y="260" width="332" height="1"/><rect x="64" y="305" width="332" height="1"/>
  </g>
  <path d="M64 290 C110 280 130 250 170 252 S230 220 262 214 S320 168 352 170 S384 140 396 132 L396 306 L64 306 Z" fill="url(#${g}b)"/>
  <path class="illu-line" d="M64 290 C110 280 130 250 170 252 S230 220 262 214 S320 168 352 170 S384 140 396 132" fill="none" stroke="var(--c-accent)" stroke-width="3" stroke-linecap="round"/>
  <circle cx="352" cy="170" r="6" fill="var(--c-surface-solid)" stroke="var(--c-accent)" stroke-width="3"/>
  <g fill="var(--c-accent)" opacity=".22">
    <rect x="84" y="262" width="18" height="44" rx="4"/><rect x="146" y="246" width="18" height="60" rx="4"/><rect x="208" y="236" width="18" height="70" rx="4"/><rect x="270" y="214" width="18" height="92" rx="4"/><rect x="332" y="196" width="18" height="110" rx="4"/>
  </g>

  <g filter="url(#${g}s)">
    <rect x="330" y="230" width="196" height="196" rx="22" fill="var(--c-surface-solid)" fill-opacity=".86" stroke="var(--c-border)"/>
  </g>
  <circle cx="428" cy="318" r="52" fill="none" stroke="var(--c-accent-soft)" stroke-width="16"/>
  <circle class="illu-donut" cx="428" cy="318" r="52" fill="none" stroke="var(--c-accent)" stroke-width="16" stroke-linecap="round" stroke-dasharray="230 327" transform="rotate(-90 428 318)"/>
  <text x="428" y="314" text-anchor="middle" font-family="var(--font-display)" font-size="22" font-weight="600" fill="var(--c-text)">ETS</text>
  <text x="428" y="334" text-anchor="middle" font-family="var(--font-sans)" font-size="11" fill="var(--c-text-muted)">bilancio</text>
  <rect x="356" y="392" width="64" height="8" rx="4" fill="var(--c-text-muted)" opacity=".4"/>
  <rect x="430" y="392" width="72" height="8" rx="4" fill="var(--c-accent)" opacity=".55"/>

  <g filter="url(#${g}s)">
    <rect x="12" y="300" width="230" height="124" rx="20" fill="var(--c-surface-solid)" fill-opacity=".9" stroke="var(--c-border)"/>
  </g>
  <g font-family="var(--font-sans)" font-size="13" fill="var(--c-text)">
    <circle cx="40" cy="332" r="10" fill="var(--c-accent)"/><path d="M35 332l3.5 3.5 6.5-7" stroke="var(--c-accent-contrast)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <text x="60" y="337">RUNTS</text>
    <circle cx="40" cy="362" r="10" fill="var(--c-accent)"/><path d="M35 362l3.5 3.5 6.5-7" stroke="var(--c-accent-contrast)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <text x="60" y="367">5 per mille</text>
    <circle cx="40" cy="392" r="9" fill="none" stroke="var(--c-accent)" stroke-width="2"/>
    <text x="60" y="397" fill="var(--c-text-muted)">Budget 2027</text>
  </g>
  <circle cx="500" cy="60" r="6" fill="var(--c-accent)" opacity=".6"/>
  <circle cx="24" cy="120" r="4" fill="var(--c-accent)" opacity=".45"/>
</svg>`;
}

/** Terzo settore: comunità, cerchi che si incontrano, foglia. Community / third sector. */
function community(alt = "Illustrazione: persone e organizzazioni connesse, simbolo del Terzo Settore") {
  const g = uid('cm');
  return `
<svg class="illu" viewBox="0 0 400 300" role="img" aria-labelledby="${g}t" xmlns="http://www.w3.org/2000/svg">
  <title id="${g}t">${esc(alt)}</title>
  <defs><linearGradient id="${g}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--c-orb-1)"/><stop offset="1" stop-color="var(--c-orb-3)"/></linearGradient></defs>
  <rect width="400" height="300" rx="24" fill="url(#${g}a)" opacity=".55"/>
  <circle cx="160" cy="150" r="78" fill="var(--c-surface-solid)" fill-opacity=".55" stroke="var(--c-border)"/>
  <circle cx="240" cy="150" r="78" fill="var(--c-surface-solid)" fill-opacity=".55" stroke="var(--c-border)"/>
  <circle cx="200" cy="90" r="78" fill="var(--c-surface-solid)" fill-opacity=".4" stroke="var(--c-border)"/>
  <path d="M200 182c-16-10-34-24-34-42a17 17 0 0 1 34-6 17 17 0 0 1 34 6c0 18-18 32-34 42z" fill="var(--c-accent)"/>
  <g fill="var(--c-text)" opacity=".8">
    <circle cx="112" cy="168" r="10"/><path d="M96 200c2-12 9-18 16-18s14 6 16 18z"/>
    <circle cx="288" cy="168" r="10"/><path d="M272 200c2-12 9-18 16-18s14 6 16 18z"/>
    <circle cx="200" cy="44" r="10"/><path d="M184 76c2-12 9-18 16-18s14 6 16 18z"/>
  </g>
  <path d="M60 260c60-30 110 10 170-10s90-30 120-20" fill="none" stroke="var(--c-accent)" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round" opacity=".7"/>
</svg>`;
}

/** Aziende: crescita, bussola e struttura. Business growth. */
function business(alt = "Illustrazione: grafico di crescita e bussola, simbolo della gestione aziendale") {
  const g = uid('bz');
  return `
<svg class="illu" viewBox="0 0 400 300" role="img" aria-labelledby="${g}t" xmlns="http://www.w3.org/2000/svg">
  <title id="${g}t">${esc(alt)}</title>
  <defs><linearGradient id="${g}a" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="var(--c-orb-2)"/><stop offset="1" stop-color="var(--c-orb-1)"/></linearGradient></defs>
  <rect width="400" height="300" rx="24" fill="url(#${g}a)" opacity=".55"/>
  <g fill="var(--c-surface-solid)" fill-opacity=".7" stroke="var(--c-border)">
    <rect x="60" y="180" width="44" height="70" rx="8"/><rect x="120" y="150" width="44" height="100" rx="8"/><rect x="180" y="118" width="44" height="132" rx="8"/><rect x="240" y="80" width="44" height="170" rx="8"/>
  </g>
  <rect x="240" y="80" width="44" height="170" rx="8" fill="var(--c-accent)" opacity=".85"/>
  <path d="M60 168 L130 136 L196 108 L262 64" fill="none" stroke="var(--c-text)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M250 60 L264 63 L260 77" fill="none" stroke="var(--c-text)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(330 96)">
    <circle r="40" fill="var(--c-surface-solid)" fill-opacity=".85" stroke="var(--c-border)"/>
    <circle r="30" fill="none" stroke="var(--c-text-muted)" stroke-opacity=".4"/>
    <path d="M12 -12 L5 5 L-12 12 L-5 -5 Z" fill="var(--c-accent)"/>
    <circle r="3" fill="var(--c-surface-solid)"/>
  </g>
  <rect x="40" y="250" width="320" height="2" rx="1" fill="var(--c-text)" opacity=".5"/>
</svg>`;
}

/** Studio: architettura, archi e luce. Studio / about. */
function studio(alt = "Illustrazione: lo studio, architettura luminosa con archi e scrivania") {
  const g = uid('st');
  return `
<svg class="illu" viewBox="0 0 480 400" role="img" aria-labelledby="${g}t" xmlns="http://www.w3.org/2000/svg">
  <title id="${g}t">${esc(alt)}</title>
  <defs>
    <linearGradient id="${g}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--c-orb-2)"/><stop offset=".6" stop-color="var(--c-orb-1)"/><stop offset="1" stop-color="var(--c-orb-3)"/></linearGradient>
    <clipPath id="${g}c1"><path d="M70 340V150a70 70 0 0 1 140 0v190z"/></clipPath>
    <clipPath id="${g}c2"><path d="M250 340V150a70 70 0 0 1 140 0v190z"/></clipPath>
  </defs>
  <rect width="480" height="400" rx="28" fill="var(--c-bg-2)"/>
  <g clip-path="url(#${g}c1)"><rect x="60" y="70" width="160" height="280" fill="url(#${g}sky)"/><circle cx="170" cy="150" r="26" fill="var(--c-surface-solid)" opacity=".8"/></g>
  <g clip-path="url(#${g}c2)"><rect x="240" y="70" width="160" height="280" fill="url(#${g}sky)"/><path d="M240 300c40-40 80-30 160-60v110H240z" fill="var(--c-accent)" opacity=".35"/></g>
  <path d="M70 340V150a70 70 0 0 1 140 0v190M250 340V150a70 70 0 0 1 140 0v190" fill="none" stroke="var(--c-text)" stroke-opacity=".55" stroke-width="2"/>
  <rect x="40" y="340" width="400" height="8" rx="4" fill="var(--c-text)" opacity=".7"/>
  <g transform="translate(150 286)">
    <rect x="0" y="40" width="180" height="10" rx="5" fill="var(--c-text)" opacity=".85"/>
    <rect x="16" y="8" width="70" height="32" rx="4" fill="var(--c-surface-solid)" stroke="var(--c-border)"/>
    <rect x="24" y="16" width="40" height="4" rx="2" fill="var(--c-accent)"/>
    <rect x="24" y="25" width="54" height="3" rx="1.5" fill="var(--c-text-muted)" opacity=".5"/>
    <path d="M140 40V6l22-14" stroke="var(--c-text)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M150 -14l24 6-8 14z" fill="var(--c-accent)"/>
  </g>
</svg>`;
}

const ILLUSTRATIONS = { hero, community, business, studio };

/** illustration('hero') → Raw SVG (id univoci ad ogni chiamata). Unique ids per call. */
export const illustration = (name, alt) => raw((ILLUSTRATIONS[name] || hero)(alt || undefined));
export const registerIllustration = (name, fn) => { ILLUSTRATIONS[name] = fn; };
