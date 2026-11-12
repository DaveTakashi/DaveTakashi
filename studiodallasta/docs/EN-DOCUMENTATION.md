# Studio Dall'Asta — Frontend documentation (English)

> Version 1.0.0 · Complete, data-driven, multi-design, accessible (WCAG 2.2 AA) HTML MVP, ready for any CMS and React.
> 🇮🇹 Versione italiana (primary): [IT-DOCUMENTAZIONE.md](./IT-DOCUMENTAZIONE.md)

---

## Contents

1. [Overview](#1-overview)
2. [Quick start](#2-quick-start)
3. [Folder structure](#3-folder-structure)
4. [Architecture: how the frontend is built](#4-architecture-how-the-frontend-is-built)
5. [Dynamic data and injection](#5-dynamic-data-and-injection)
6. [Content schema](#6-content-schema)
7. [Design system: tokens, presets and options](#7-design-system-tokens-presets-and-options)
8. [The "Design style" widget](#8-the-design-style-widget)
9. [Images and illustrations](#9-images-and-illustrations)
10. [Multilingual (IT/EN)](#10-multilingual-iten)
11. [WCAG 2.2 AA accessibility](#11-wcag-22-aa-accessibility)
12. [Performance](#12-performance)
13. [Security and privacy (GDPR)](#13-security-and-privacy-gdpr)
14. [CMS integration](#14-cms-integration)
15. [React / Next.js integration](#15-react--nextjs-integration)
16. [Public JavaScript API](#16-public-javascript-api)
17. [Extending: designs, sections, icons](#17-extending-designs-sections-icons)
18. [Testing and quality](#18-testing-and-quality)
19. [Deployment](#19-deployment)
20. [Placeholder data to replace](#20-placeholder-data-to-replace)
21. [Glossary](#21-glossary)

---

## 1. Overview

The **studiodallasta.it** frontend rests on three principles:

| Principle | In practice |
|---|---|
| **Full separation** | Content (`data/site.json`), appearance (`data/designs.json` + token-based CSS) and logic (`src/js`) are independent. Change one without touching the others. |
| **Agnostic** | No mandatory framework. The same engine runs in the browser, in Node (prerender/SSR) and inside React. Any CMS (WordPress, Strapi, Sanity, Directus, Contentful, a custom CMS) can supply the data. |
| **Professional quality** | WCAG 2.2 AA verified with axe-core on every design, zero runtime dependencies, ~40 KB gzipped for the whole page. |

**Key features**

- 5 ready-made designs (**Glass/Vetro**, **Editorial**, **Earth/Terra**, **Slate/Ardesia**, **High contrast**), each in light and dark mode.
- Combinable design options: colour mode, accent colour (with **automatic contrast correction**), transparency, corners, spacing, text size, reduced motion.
- **"Design style"** widget to switch styles live and **export tokens** as JSON.
- 10 CMS-orderable section types (hero, stats, services, method, sectors, about, insights, FAQ, call-to-action, contact).
- Original SVG illustrations that **recolour themselves** to match the active design.
- Bilingual content (Italian first, English), with dedicated URLs for SEO.

---

## 2. Quick start

Requirements: **Node.js ≥ 18** (only for development and build; the published site needs no Node).

```bash
cd studiodallasta
npm run dev        # dev server → http://localhost:5173
npm run build      # generates dist/ (prerendered static HTML, IT + EN)
npm run preview    # serves dist/ → http://localhost:5173
npm test           # tests: contrast, XSS, translations, data integrity
```

> No `npm install` needed: the project has no dependencies.
> `dist/index.html` also works when opened directly with a double click (file://).

---

## 3. Folder structure

```
studiodallasta/
├── index.html                  Dev page (loads ES modules + JSON via fetch)
├── package.json                npm scripts (no dependencies)
├── data/
│   ├── site.json               ★ CONTENT (IT/EN) — what the CMS provides
│   ├── designs.json            ★ DESIGN PRESETS (colours, shape, typography)
│   └── site.schema.json        JSON Schema to validate content in the CMS
├── src/
│   ├── css/
│   │   ├── tokens.css          Default CSS variable values
│   │   ├── base.css            Reset, typography, layout, accessibility
│   │   ├── components.css      Components (var(--token) only, no hard-coded colours)
│   │   └── widget.css          "Design style" widget
│   └── js/
│       ├── core/
│       │   ├── html.js         Safe template engine (automatic escaping)
│       │   ├── i18n.js         Translations and localised dates
│       │   ├── color.js        WCAG contrast, colour mixing
│       │   └── data.js         Data loading (injection/inline/fetch), safe storage
│       ├── design/
│       │   ├── engine.js       ★ Design engine: preset + options → CSS variables
│       │   └── widget.js       Accessible widget
│       ├── render/
│       │   ├── icons.js        SVG icon set
│       │   ├── illustrations.js Themed SVG illustrations
│       │   ├── sections.js     ★ Section registry
│       │   └── layout.js       Header, footer, page composition
│       └── app.js              Boot, public API, progressive behaviours
├── react/                      React adapter (same CSS, same engine)
│   ├── src/  StudioProvider · SiteRenderer · DesignStyleWidget · sections/
│   └── example/App.jsx
├── tools/
│   ├── build.mjs               Static build + prerender + CSS tokens
│   ├── serve.mjs               Dev server
│   └── check.mjs               Automated tests
├── assets/img/favicon.svg
├── docs/                       This documentation (IT + EN)
└── dist/                       Build output (generated)
    ├── index.html              Italian, everything inline
    ├── en/index.html           English
    └── tokens/*.css            Tokens for every design × scheme
```

---

## 4. Architecture: how the frontend is built

### 4.1 Overall flow

```
   ┌──────────────┐     ┌────────────────┐
   │data/site.json│     │data/designs.json│     ← CMS / server / static file
   └──────┬───────┘     └───────┬────────┘
          │ (injection | inline JSON | fetch)
          ▼                     ▼
   ┌──────────────┐     ┌──────────────────┐
   │  renderPage  │     │  computeDesign   │  ← PURE functions (browser, Node, React)
   │ (layout.js + │     │   (engine.js)    │
   │ sections.js) │     └────────┬─────────┘
   └──────┬───────┘              │ { vars, attrs }
          │ HTML string          ▼
          ▼               <html style="--c-accent:…" data-design="vetro" data-scheme="dark">
   <div id="app">…</div>          │
          │                       ▼
          └──────────► Token-based CSS (components.css only uses var(--…))
                                  ▲
                    "Design style" widget → setDesign() → recompute → new variables
```

### 4.2 The four key design decisions

**1. Isomorphic string renderer.**
Sections are `(section, context) → HTML` functions written with a tagged template (`html\`...\``) that **escapes every interpolated value**. The same function runs:
- in the browser (locale switch, CMS data updates);
- in Node during `npm run build` (prerender → complete HTML for SEO and speed);
- from any backend (PHP, Python, .NET) that prefers calling Node for SSR.

**2. Design as data, not CSS.**
A design is a JSON object (`designs.json`) with light/dark palettes and shape parameters. The engine (`engine.js`) turns it into **CSS variables** applied to `<html>`. Component CSS contains no colours — only `var(--c-…)`. Adding a design = adding a JSON object.

**3. Progressive enhancement.**
The prerendered HTML is complete and navigable without JavaScript. JS adds: mobile menu, reveal animations, active menu highlighting, form validation, the style widget. Animations never hide content that is already visible and are disabled under `prefers-reduced-motion`.

**4. No dependencies.**
No framework, no mandatory bundler. The build (`tools/build.mjs`, ~150 lines) concatenates modules, minifies, prerenders and inlines everything: **a single HTTP request**.

### 4.3 Boot cycle (`app.js`)

1. **Early paint**: if designs are already in `<head>`, the engine immediately applies the user's saved variables → no style flash.
2. **Load designs** → normalise saved state → `applyDesign()`.
3. **Load content** (see §5).
4. **Pick locale**: `?lang=` → prerendered locale → saved preference → `<html lang>` → default.
5. **Render** (skipped if the page is already prerendered in the same locale: zero layout shift).
6. **Enhance**: menu, reveal, scroll-spy, form.
7. **Mount widget** and fire `studio:ready`.

### 4.4 Typography

For GDPR and performance, **no Google Fonts are loaded**. Declared families are `Inter`/`Inter Tight` (if installed or self-hosted), falling back to `Segoe UI Variable` (Windows 11), `system-ui` and San Francisco (Apple). The *Editorial* design uses `Fraunces` → `Iowan Old Style` → `Palatino` → `Georgia`.
To use a brand font: copy the `.woff2` files to `assets/fonts/`, add `@font-face` in `tokens.css` and reference it in `designs.json → base.fontSans/fontDisplay`.

---

## 5. Dynamic data and injection

The site accepts content through **three channels**, in priority order. The first one that responds wins.

| # | Channel | When to use | Example |
|---|---|---|---|
| 1 | **Global variable** `window.__STUDIO_DATA__` | Server/CMS prints the data into the page (WordPress, PHP, Django, .NET) | `<script>window.__STUDIO_DATA__ = <?= json_encode($data) ?>;</script>` |
| 2 | **Inline JSON** `<script type="application/json" id="studio-data">` | Static build, CDN cache, no extra request | generated by `npm run build` |
| 3 | **Fetch** from the `data-src` attribute of `#app` | Headless CMS with REST API | `<div id="app" data-src="https://cms.example.com/api/site?lang=en">` |

Designs work the same way: `window.__STUDIO_DESIGNS__`, `#studio-designs`, `data-designs-src`.

**Updating data on a live page** (e.g. CMS live preview):

```js
StudioUI.setData(newData);                                       // replace everything
StudioUI.setData({ contact: { phone: '+39 …' } }, { merge: true }); // deep merge
```

**WordPress (PHP) example:**

```php
<script>
  window.__STUDIO_DATA__ = <?php echo wp_json_encode( studio_build_site_data() ); ?>;
</script>
<div id="app"></div>
<script type="module" src="<?php echo get_theme_file_uri('src/js/app.js'); ?>"></script>
```

---

## 6. Content schema

The formal schema lives in `data/site.schema.json` (JSON Schema 2020-12): import it into the CMS to validate content.

### 6.1 Multilingual field

Any text can be:

```json
"title": "Same in every language"
"title": { "it": "Titolo italiano", "en": "English title" }
```

If the requested locale is missing, `defaultLocale` is used.

### 6.2 Root

| Key | Type | Description |
|---|---|---|
| `locales` | `string[]` | Active locales, e.g. `["it","en"]` |
| `defaultLocale` | `string` | Main locale (`"it"`) |
| `meta` | object | `url`, `title`, `description` (SEO) |
| `brand` | object | `name`, `monogram` (max 3 letters), `tagline` |
| `ui` | object | Interface strings (menu, form, widget…) |
| `navigation` | `link[]` | Menu items `{ label, href }` |
| `headerCta` | `link` | Header button |
| `sections` | `section[]` | **Sections, in display order** |
| `contact` | object | `email`, `pec`, `phone`, `address`, `hours` |
| `footer` | object | `legal`, `links` |

### 6.3 Sections

Every section has `type` (required), `id` (anchor, required), `hidden` (optional — hide without deleting).

| `type` | Specific fields |
|---|---|
| `hero` | `eyebrow`, `title`, `highlight` (highlighted word), `lead`, `actions[]` (`variant`: `primary`/`ghost`), `badges[] {icon,text}`, `illustration` or `image` |
| `stats` | `label` (for screen readers), `items[] {value,label}` |
| `services` | `eyebrow`, `title`, `lead`, `groups[] {id, tab, title, intro, illustration/image, items[] {icon,title,text}}` |
| `method` | `steps[] {title,text}` |
| `sectors` | `items[] {icon,title}` |
| `about` | `text[]` (paragraphs), `values[] {icon,text}`, `illustration`/`image` |
| `insights` | `items[] {date (ISO), tag, title, href}` |
| `faq` | `items[] {q, a}` |
| `cta` | `title`, `text`, `action {label, href}` |
| `contact` | `form {endpoint, mailto, fields{…}, orgOptions[], privacyHref}` |

**Reorder** sections = reorder the array. **Duplicate** a section = copy it with a new `id`.

---

## 7. Design system: tokens, presets and options

### 7.1 Tokens (CSS variables)

| Token | Role |
|---|---|
| `--c-bg`, `--c-bg-2` | Page background and gradient |
| `--c-orb-1/2/3` | Decorative glowing orb colours |
| `--c-surface` | **Glass** surface (rgba computed from transparency) |
| `--c-surface-solid` / `--c-surface-raised` | Opaque / semi-opaque surface (cards, fields) |
| `--c-border` | Hairline borders |
| `--c-text`, `--c-text-muted` | Primary and secondary text |
| `--c-accent`, `--c-accent-contrast`, `--c-accent-soft` | Brand colour, text on it, light tint |
| `--c-focus` | Keyboard focus ring |
| `--blur`, `--glass-saturate` | Frosted-glass intensity |
| `--radius`, `--radius-sm`, `--radius-lg` | Corner radii |
| `--density` | Spacing multiplier (0.8 / 1 / 1.25) |
| `--text-scale` | Text size multiplier |
| `--font-sans`, `--font-display`, `--display-weight`, `--display-tracking` | Typography |
| `--shadow`, `--border-width`, `--focus-width`, `--orb-opacity` | Material |

### 7.2 Preset structure (`designs.json`)

```json
{
  "id": "terra",
  "label": { "it": "Terra", "en": "Earth" },
  "description": { "it": "…", "en": "Warmth, matter and humanity" },
  "shape": { "radius": 22, "glass": 38 },
  "colors": {
    "light": { "bg": "#FBF6F0", "surface": "#FFFDF9", "text": "#2A1C14", "accent": "#9A3A1C", "…": "…" },
    "dark":  { "bg": "#16100C", "…": "…" }
  }
}
```

`shape` inherits anything it doesn't set from `base`. Available shape parameters: `fontSans`, `fontDisplay`, `displayWeight`, `displayTracking`, `radius`, `glass` (0–100), `blur`, `glassLocked`, `orbs`, `borderWidth`, `focusWidth`, `shadow`, `shadowDark`, `underlineLinks`.

### 7.3 Options (design state)

```js
{
  design: 'vetro',          // preset id
  scheme: 'auto',           // auto | light | dark
  accent: null,             // '#RRGGBB' or null
  glass: null,              // 0–100 or null (= preset default)
  radius: 'design',         // design | sharp | soft | round
  density: 'comfortable',   // compact | comfortable | airy
  textScale: 1,             // 1 | 1.125 | 1.25
  motion: 'auto'            // auto | reduce
}
```

### 7.4 Automatic accessibility rules in the engine

- **Custom accent**: if the chosen colour doesn't reach **4.5:1** against the surface, the engine progressively darkens/lightens it until it does; text on the accent becomes white or black, whichever contrasts better.
- **Bounded transparency**: surface opacity never drops below ~38% to preserve legibility.
- **High contrast**: `glassLocked: true` fully disables transparency and orbs; 2px borders and 4px focus rings.
- The OS-level `prefers-reduced-transparency` forces opaque surfaces.

### 7.5 Exported tokens

`npm run build` produces `dist/tokens/<design>.<scheme>.css`, ready to import into other projects. The widget's **"Export tokens"** button downloads the current state as JSON (handy to hand a chosen configuration to a designer, or to store it in the CMS as the default theme).

---

## 8. The "Design style" widget

Floating button bottom-right → non-modal panel with:

| Control | Native type | a11y notes |
|---|---|---|
| Design | radio (preview cards) | `fieldset` + `legend` |
| Colour mode | segmented radio | System / Light / Dark |
| Accent colour | radio + `input type="color"` | every swatch has a screen-reader name |
| Transparency | `input type="range"` + `output` | disabled with explanation in *High contrast* |
| Corners, Spacing, Text | segmented radios | targets ≥ 40px |
| Reduce motion | switch checkbox | |
| Reset / Export tokens | buttons | announced via `aria-live` |

Behaviour: open → focus moves to the title; **Esc** closes and returns focus to the button; clicking outside closes. Preferences are saved in `localStorage` (key `studio:design`), on the visitor's device only.

**Disable it in production** (single style): add `.ds { display:none }` to the CSS, or don't call `mountWidget()`. The default design is set via `designs.json → default`.

---

## 9. Images and illustrations

The site ships **4 original SVG illustrations** (`hero`, `community`, `business`, `studio`) drawn for this project. They use `var(--c-accent)`, `var(--c-orb-*)` etc., so they **recolour automatically** with the design: no images to regenerate, negligible weight, crisp on any screen.

**Using real photographs** (recommended for "The Firm": professional portrait, office environment):

```json
"image": { "src": "/media/studio.avif", "alt": { "it": "…", "en": "The office in …" }, "width": 1200, "height": 900 }
```

Photo guidelines to keep the *minimal/transparency* look:
- natural light, light desaturated tones, generous negative space;
- **AVIF/WebP**, max width 1600px, < 200 KB;
- descriptive `alt` in both languages (empty only if purely decorative);
- `eager: true` only for the hero image (LCP).

---

## 10. Multilingual (IT/EN)

- Italian is the main locale (`defaultLocale: "it"`), English secondary.
- **Static build**: `/` (IT) and `/en/` (EN) with `hreflang`, `canonical`, `og:locale` → correct SEO.
- **Dev / dynamic CMS**: the language switch changes locale on the fly (`?lang=en`) without reloading.
- `<html lang>`, `<title>`, meta description and the skip link are updated.
- Dates are formatted with `Intl` (`28 ottobre 2026` / `28 October 2026`).
- Adding a locale: add it to `locales` and add the key to every text field. `npm test` reports missing translations.

---

## 11. WCAG 2.2 AA accessibility

Verified with **axe-core 4.10** on all 5 designs (light and dark): **0 violations** (rules wcag2a, wcag2aa, wcag21a/aa, wcag22aa, best-practice). `npm test` additionally checks the contrast ratios of every palette.

| WCAG criterion | Implementation |
|---|---|
| 1.1.1 Non-text content | SVGs with translated `<title>`; decorative icons `aria-hidden` |
| 1.3.1 Info and relationships | Landmarks (`header`, `nav`, `main`, `footer`), heading hierarchy, `dl` for stats, `fieldset/legend` |
| 1.4.3 Contrast (minimum) | Text ≥ 7:1, secondary text ≥ 4.5:1, accent ≥ 4.5:1 (guaranteed even for custom colours) |
| 1.4.4 / 1.4.10 Resize and reflow | `rem` units, fluid layout down to 320px, no horizontal scroll; 125% text option |
| 1.4.11 Non-text contrast | Field borders ≥ 3:1, clearly visible focus |
| 1.4.12 Text spacing | No fixed heights on text containers |
| 2.1.1 Keyboard | Native controls only; menu, FAQ (`details`), widget and form fully keyboard operable |
| 2.3.3 Animation from interactions | `prefers-reduced-motion` + widget switch |
| 2.4.1 Bypass blocks | "Skip to main content" link |
| 2.4.7 / 2.4.11 / 2.4.13 Focus | 3px ring (4px in High contrast), `scroll-padding-top` so focus isn't hidden under the sticky header |
| 2.5.8 Target size | Interactive buttons and links ≥ 44px |
| 3.1.1 / 3.1.2 Language | `<html lang>` updated; `lang` on language links |
| 3.3.1 / 3.3.3 Errors | Specific messages linked via `aria-describedby`, `aria-invalid`, `role="alert"` summary, focus on first invalid field |
| 4.1.2 Name, role, value | `aria-expanded`, `aria-controls`, `aria-current`, `role="dialog"` |
| 4.1.3 Status messages | `aria-live` for form submission and style changes |

Extra support: `forced-colors` (Windows 11 Contrast themes), `prefers-reduced-transparency`, `prefers-color-scheme`.

> Remember to publish the **Accessibility statement** (already linked in the footer: `/accessibilita`).

---

## 12. Performance

| Metric | Value |
|---|---|
| HTTP requests for the page | **1** (CSS, JS, data, illustrations, favicon inline) |
| Page weight (gzip) | **~40 KB** |
| Runtime dependencies | **0** |
| External fonts | **0** |
| Rendering | Prerendered HTML → content visible on first paint |

Techniques: prerendering, critical CSS = all CSS (it's small), precomputed tokens to avoid theme flash, `IntersectionObserver` instead of scroll listeners, `passive` listeners, vector illustrations, no layout shift (explicit dimensions, no re-render when locale matches).

---

## 13. Security and privacy (GDPR)

- **XSS**: the template engine escapes every value; URLs pass through `safeUrl()`, which blocks `javascript:` and other dangerous schemes. Verified by `npm test`. CMS data can therefore be treated as *untrusted* safely.
- **Inline JSON**: `<` is encoded (`<`) to prevent premature `<script>` termination.
- Recommended **Content Security Policy** (build with inline scripts):
  `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.your-cms.com`
  For a CSP without `unsafe-inline`, use the modular version (`index.html` + separate files) with `script-src 'self'`.
- **Privacy**: no cookies, no trackers, no third-party fonts or CDNs. `localStorage` only stores technical preferences (style and locale) → no consent banner required. If you add analytics, update the cookie notice.
- **Form**: without `endpoint` it opens the mail client (`mailto`); with `endpoint` it POSTs JSON. The privacy checkbox is mandatory.

---

## 14. CMS integration

### 14.1 Recommended content model

| CMS type | Maps to |
|---|---|
| *Site settings* (singleton) | `meta`, `brand`, `contact`, `footer`, `navigation`, `headerCta`, `ui` |
| *Page* with a "blocks" field (dynamic zone / flexible content) | `sections[]` — one block per `type` |
| *Theme* (singleton, optional) | `designs.json`, or just `default` + colour overrides |

Localised fields: enable the CMS's native localisation and rebuild `{ it, en }` objects in the endpoint, **or** expose one locale at a time (plain strings) and call the endpoint with `?lang=`.

### 14.2 Three integration modes

1. **Generated static HTML**: the CMS (or a CI pipeline) saves `data/site.json` and runs `npm run build`; publish `dist/`. Maximum performance.
2. **Server-side template**: the CMS theme prints `window.__STUDIO_DATA__` and loads `src/js/app.js` + the 4 CSS files. Client-side rendering.
3. **Headless + React/Next.js**: see §15.

### 14.3 Live preview in the CMS

```js
// inside the preview iframe
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://cms.your-domain.com') return;
  StudioUI.setData(e.data.site, { merge: true });
});
```

---

## 15. React / Next.js integration

The `react/` folder contains an adapter that **reuses the same engine and CSS**: output is identical to the HTML site.

```jsx
import { StudioProvider, SiteRenderer, DesignStyleWidget } from './react/src/index.js';
import site from './data/site.json';
import designs from './data/designs.json';

export default function App() {
  return (
    <StudioProvider data={site} designs={designs} initialLocale="it">
      <SiteRenderer />
      <DesignStyleWidget />
    </StudioProvider>
  );
}
```

| Component | Role |
|---|---|
| `StudioProvider` | Context: data, locale, design state; applies tokens to `<html>` |
| `useStudio()` | Hook: `t`, `ui`, `locale`, `setLocale`, `design`, `setDesign`, `exportTokens` |
| `SiteRenderer` | Header + sections (`type → component` map) + footer. `components` prop for custom sections |
| `DesignStyleWidget` | React widget (same markup/a11y) |
| `SECTIONS` | Extensible section component map |

**Next.js (App Router)**: components use hooks → import them from a `'use client'` file; data can come from a Server Component (`fetch` to the CMS) and be passed as the `data` prop. Server rendering works (tested with React 18 `renderToString`).
**Vite**: import `react/src/index.js`; CSS is already imported by the index.

---

## 16. Public JavaScript API

Available as `window.StudioUI` (and as the default export of `app.js`).

| Method | Description |
|---|---|
| `setData(data, { merge })` | Replace or merge content and re-render |
| `getData()` | Current content |
| `setLocale('it' \| 'en')` / `getLocale()` | Locale |
| `setDesign('terra')` / `setDesign({ scheme:'dark', glass:70 })` | Change preset or options |
| `getDesignState()` / `resetDesign()` | Design state / reset |
| `registerDesign(def)` | Add a preset at runtime |
| `registerSection(type, fn)` | Add a section type |
| `exportTokens()` | Current token JSON |
| `openDesignWidget()` | Open the panel |
| `on(event, fn)` | `ready`, `render`, `designchange`, `localechange`, `formsubmit` |

The same events are dispatched on `document` as `studio:<name>` (`CustomEvent`).

```js
StudioUI.on('designchange', ({ state, tokens }) => console.log(state.design, tokens['--c-accent']));
```

---

## 17. Extending: designs, sections, icons

### New design
Add an object to `designs.json → designs[]` (or call `StudioUI.registerDesign(def)`). Run `npm test`: it checks contrast automatically.

### New section
```js
import { registerSection } from './render/sections.js';
import { html } from './core/html.js';

registerSection('team', (s, { t }) => html`
  <section class="section" id="${s.id}" aria-labelledby="${s.id}-title">
    <div class="container">
      <h2 class="h2" id="${s.id}-title">${t(s.title)}</h2>
      <ul class="cards" role="list">
        ${s.people.map((p) => html`<li class="card"><h3 class="card__title">${p.name}</h3><p class="card__text">${t(p.role)}</p></li>`)}
      </ul>
    </div>
  </section>`);
```
Then in the JSON: `{ "type": "team", "id": "team", "title": {...}, "people": [...] }`. In React: `<SiteRenderer components={{ team: TeamSection }} />`.

### New icon
Add the SVG path (24×24, stroke) to the `P` object in `src/js/render/icons.js`.

### New illustration
`registerIllustration('name', (alt) => '<svg …>')` in `illustrations.js`, using `var(--c-…)` for colours.

---

## 18. Testing and quality

`npm test` (102 checks, zero dependencies):
1. contrast of every palette × scheme (text, secondary, accent, text on accent, tints);
2. automatic correction of non-compliant accents;
3. XSS resistance (injected tags and `javascript:`);
4. translation completeness;
5. integrity: unique ids, valid anchors, existing icons;
6. rendering in every locale with exactly one `<h1>` and `<main>`.

Additional checks run during development: axe-core on 7 design/scheme combinations, no console errors, no horizontal scroll at 390px, widget and form focus behaviour, React SSR render.

---

## 19. Deployment

1. `npm test && npm run build`
2. Upload the contents of `dist/` to the domain root (any static host: Netlify, Cloudflare Pages, Vercel, Apache/Nginx).
3. Recommended headers: `Content-Encoding: br/gzip`, `Cache-Control: no-cache` for HTML, CSP (§13), `Strict-Transport-Security`.
4. Add `robots.txt` and `sitemap.xml` listing `/` and `/en/`.
5. Create the `/privacy`, `/cookie`, `/accessibilita` pages (linked in the footer).

---

## 20. Placeholder data to replace

Before going live, update in `data/site.json`:

| Field | Current (placeholder) value |
|---|---|
| `contact.phone` | `+39 000 000 0000` |
| `contact.address` | `Via Esempio 1, 00000 Città (XX)` |
| `contact.pec` | `studiodallasta@pec.it` |
| `contact.email`, `form.mailto` | `info@studiodallasta.it` (verify) |
| `footer.legal` | `P.IVA 00000000000` |
| `sections[stats].items` | indicative values (2 areas, 24h, 100% digital): confirm |
| `sections[hero].badges` | "Registered with ODCEC": confirm registration and local Order |
| `sections[insights].items` | sample articles with `href: "#"` |
| `contact.hours` | sample opening hours |
| `brand.tagline` | "Dottori Commercialisti" (singular for a sole practitioner) |

It is also recommended to show the professional Order and registration number in the footer (a disclosure duty for Italian professionals).

---

## 21. Glossary

- **Token**: a design variable (colour, radius, spacing) expressed as a CSS variable.
- **Preset / design**: a coherent set of tokens (e.g. *Glass*).
- **Option**: an adjustment applied on top of the preset (e.g. 70% transparency).
- **Prerender**: generating the final HTML at build time, before anyone opens the page.
- **Injection**: the server/CMS supplying data directly into the page.
- **Isomorphic**: code that runs identically in the browser and on the server.
- **ETS / RUNTS**: Third Sector Entity / National Single Register of the Third Sector (Italy).
