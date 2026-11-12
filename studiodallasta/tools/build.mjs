#!/usr/bin/env node
/**
 * build.mjs — Build statica ad alte prestazioni (zero dipendenze).
 * Zero-dependency high-performance static build.
 *
 *  - Prerender HTML completo per ogni lingua (SEO, First Contentful Paint immediato)
 *  - CSS e JS inline e minificati (1 sola richiesta HTTP, funziona anche da file://)
 *  - Dati e design inline come JSON (sostituibili dal CMS)
 *  - JSON-LD schema.org (AccountingService) + hreflang
 *
 *  Uso / Usage:  node tools/build.mjs        → dist/index.html, dist/en/index.html
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => join(ROOT, p);
const read = (p) => readFile(r(p), 'utf8');

const CSS = ['src/css/tokens.css', 'src/css/base.css', 'src/css/components.css', 'src/css/widget.css'];
// Ordine topologico dei moduli / topological module order
const JS = [
  'src/js/core/html.js', 'src/js/core/i18n.js', 'src/js/core/color.js', 'src/js/core/data.js',
  'src/js/design/engine.js', 'src/js/render/icons.js', 'src/js/render/illustrations.js',
  'src/js/render/sections.js', 'src/js/render/layout.js', 'src/js/design/widget.js', 'src/js/app.js'
];

const minifyCss = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();

/** Mini-bundler: rimuove import/export (moduli nostri, sintassi controllata). */
function bundle(sources) {
  const body = sources.map(({ path, code }) => {
    const stripped = code
      .replace(/^import\s[^;]+;\s*$/gm, '')
      .replace(/^export\s+default\s+[^;]+;\s*$/gm, '')
      .replace(/^export\s+\{[^}]*\};\s*$/gm, '')
      .replace(/^export\s+(?=(async\s+)?(function|const|let|class)\b)/gm, '');
    return `/* ${path} */\n${stripped}`;
  }).join('\n');
  return `(()=>{"use strict";\n${body}\n})();`;
}

const minifyJs = (js) => js
  .replace(/^\s*\/\*\*[\s\S]*?\*\/\s*$/gm, '')   // blocchi JSDoc
  .replace(/^\s*\/\/.*$/gm, '')                  // commenti di riga interi
  .replace(/\n{2,}/g, '\n');

const safeJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

async function main() {
  const t0 = Date.now();
  const [site, designs] = await Promise.all([read('data/site.json'), read('data/designs.json')].map(async (p) => JSON.parse(await p)));
  const css = minifyCss((await Promise.all(CSS.map(read))).join('\n'));
  const js = minifyJs(bundle(await Promise.all(JS.map(async (path) => ({ path, code: await read(path) })))));
  const favicon = `data:image/svg+xml,${encodeURIComponent(await read('assets/img/favicon.svg'))}`;

  const { renderPage, createTranslator } = await import(pathToFileURL(r('src/js/render/layout.js')).href);
  const { computeDesign, varsToCss } = await import(pathToFileURL(r('src/js/design/engine.js')).href);

  // Token di default pre-calcolati (light + dark) → nessun flash prima del JS
  const light = computeDesign(designs, {}, { prefersDark: false });
  const dark = computeDesign(designs, {}, { prefersDark: true });
  const preCss = varsToCss(light.vars) + `@media (prefers-color-scheme:dark){${varsToCss(dark.vars, ':root:not([data-scheme="light"])')}}`;

  const base = site.meta?.url?.replace(/\/$/, '') || '';
  const pages = (site.locales || ['it']).map((locale) => ({
    locale,
    dir: locale === site.defaultLocale ? 'dist' : `dist/${locale}`,
    url: locale === site.defaultLocale ? `${base}/` : `${base}/${locale}/`
  }));

  for (const page of pages) {
    const t = createTranslator(page.locale, site.defaultLocale);
    const langHrefs = Object.fromEntries(pages.map((p) => {
      const rel = relative(r(page.dir), r(p.dir)).replace(/\\/g, '/');
      return [p.locale, rel ? `${rel}/` : './'];
    }));
    const appHtml = renderPage(site, page.locale, { langHref: (l) => langHrefs[l] });
    const c = site.contact || {};
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'AccountingService',
      name: site.brand?.name,
      description: t(site.meta?.description),
      url: page.url,
      email: c.email,
      telephone: c.phone,
      address: t(c.address),
      knowsAbout: ['Terzo Settore', 'RUNTS', 'Bilancio ETS', 'Consulenza fiscale', 'Controllo di gestione'],
      areaServed: 'IT'
    };

    const out = `<!doctype html>
<html lang="${page.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escAttr(t(site.meta?.title))}</title>
<meta name="description" content="${escAttr(t(site.meta?.description))}">
<meta name="theme-color" content="${light.vars['--c-bg']}">
<meta name="color-scheme" content="light dark">
<link rel="canonical" href="${page.url}">
${pages.map((p) => `<link rel="alternate" hreflang="${p.locale}" href="${p.url}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${base}/">
<meta property="og:type" content="website">
<meta property="og:title" content="${escAttr(t(site.meta?.title))}">
<meta property="og:description" content="${escAttr(t(site.meta?.description))}">
<meta property="og:url" content="${page.url}">
<meta property="og:locale" content="${page.locale === 'it' ? 'it_IT' : 'en_GB'}">
<link rel="icon" href="${favicon}" type="image/svg+xml">
<style>${preCss}${css}</style>
<script type="application/ld+json">${safeJson(jsonLd)}</script>
<script type="application/json" id="studio-designs">${safeJson(designs)}</script>
<script>${js}</script>
</head>
<body>
<a class="skip-link" href="#main">${escAttr(t(site.ui?.skip))}</a>
<div id="app" data-prerendered="${page.locale}" data-lang-hrefs='${JSON.stringify(langHrefs)}'>${appHtml}</div>
<script type="application/json" id="studio-data">${safeJson(site)}</script>
</body>
</html>
`;
    await mkdir(r(page.dir), { recursive: true });
    await writeFile(r(`${page.dir}/index.html`), out);
    console.log(`✓ ${page.dir}/index.html  ${(Buffer.byteLength(out) / 1024).toFixed(1)} KB  (${page.locale})`);
  }

  // Token esportati per CMS/React/Figma
  await mkdir(r('dist/tokens'), { recursive: true });
  for (const d of designs.designs) {
    for (const scheme of ['light', 'dark']) {
      const res = computeDesign(designs, { design: d.id, scheme }, {});
      await writeFile(r(`dist/tokens/${d.id}.${scheme}.css`), varsToCss(res.vars, `[data-design="${d.id}"][data-scheme="${scheme}"]`) + '\n');
    }
  }
  console.log(`✓ dist/tokens/*.css  (${designs.designs.length * 2} file)`);
  console.log(`Build completata in ${Date.now() - t0} ms`);
}

main().catch((e) => { console.error(e); process.exit(1); });
