#!/usr/bin/env node
/**
 * check.mjs — Test senza dipendenze: integrità dati, contrasto WCAG di ogni design,
 * sicurezza XSS del renderer, completezza traduzioni.
 * Zero-dependency tests: data integrity, WCAG contrast of every design, renderer XSS safety, i18n completeness.
 *
 *   npm test
 */
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrast } from '../src/js/core/color.js';
import { computeDesign } from '../src/js/design/engine.js';
import { renderPage } from '../src/js/render/layout.js';
import { ICON_NAMES } from '../src/js/render/icons.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(await readFile(join(ROOT, 'data/site.json'), 'utf8'));
const designs = JSON.parse(await readFile(join(ROOT, 'data/designs.json'), 'utf8'));

let fail = 0, pass = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.error('✗', msg); } };

// 1) Contrasto per ogni design × schema (testo, testo secondario, accento, testo su accento)
for (const d of designs.designs) {
  for (const scheme of ['light', 'dark']) {
    const c = { ...d.colors.light, ...d.colors[scheme] };
    const tag = `${d.id}/${scheme}`;
    ok(contrast(c.text, c.bg) >= 7, `${tag}: testo/sfondo < 7:1 (${contrast(c.text, c.bg).toFixed(2)})`);
    ok(contrast(c.muted, c.bg) >= 4.5, `${tag}: muted/sfondo < 4.5:1 (${contrast(c.muted, c.bg).toFixed(2)})`);
    ok(contrast(c.muted, c.surface) >= 4.5, `${tag}: muted/superficie < 4.5:1`);
    ok(contrast(c.accent, c.surface) >= 4.5, `${tag}: accento/superficie < 4.5:1 (${contrast(c.accent, c.surface).toFixed(2)})`);
    ok(contrast(c.accentContrast, c.accent) >= 4.5, `${tag}: testo su accento < 4.5:1 (${contrast(c.accentContrast, c.accent).toFixed(2)})`);
    ok(contrast(c.text, c.accentSoft) >= 4.5, `${tag}: testo su accent-soft < 4.5:1`);
  }
}

// 2) Accento personalizzato "cattivo" viene corretto automaticamente
const bad = computeDesign(designs, { accent: '#ffff66', scheme: 'light' });
ok(contrast(bad.vars['--c-accent'], '#ffffff') >= 4.5, 'accento giallo non corretto a 4.5:1');
const badDark = computeDesign(designs, { accent: '#101010', scheme: 'dark' });
ok(contrast(badDark.vars['--c-accent'], designs.designs[0].colors.dark.surface) >= 4.5, 'accento scuro su dark non corretto');

// 3) XSS: i contenuti iniettati vengono sempre escapati
const evil = structuredClone(site);
evil.sections[0].title = '<img src=x onerror=alert(1)>';
evil.sections[0].actions[0].href = 'javascript:alert(1)';
const out = renderPage(evil, 'it');
ok(!out.includes('<img src=x'), 'XSS: tag non escapato');
ok(!out.includes('javascript:alert'), 'XSS: URL javascript: non bloccato');

// 4) Traduzioni complete (ogni oggetto i18n ha tutte le lingue)
const missing = [];
(function walk(node, path) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    const keys = Object.keys(node);
    if (keys.length && keys.every((k) => site.locales.includes(k))) {
      site.locales.forEach((l) => { if (!node[l]) missing.push(`${path}.${l}`); });
      return;
    }
    keys.forEach((k) => walk(node[k], `${path}.${k}`));
  } else if (Array.isArray(node)) node.forEach((n, i) => walk(n, `${path}[${i}]`));
})(site, '$');
ok(missing.length === 0, `traduzioni mancanti: ${missing.join(', ')}`);

// 5) Integrità: id unici, icone esistenti, ancore di navigazione valide
const ids = site.sections.map((s) => s.id);
ok(new Set(ids).size === ids.length, 'id di sezione duplicati');
const allIds = new Set([...ids, ...site.sections.flatMap((s) => (s.groups || []).map((g) => g.id))]);
site.navigation.forEach((n) => ok(!n.href.startsWith('#') || allIds.has(n.href.slice(1)), `ancora inesistente: ${n.href}`));
JSON.stringify(site).replace(/"icon":"(\w+)"/g, (_, name) => { ok(ICON_NAMES.includes(name), `icona sconosciuta: ${name}`); return _; });

// 6) Rendering in ogni lingua
for (const l of site.locales) {
  const html = renderPage(site, l);
  ok((html.match(/<h1[\s>]/g) || []).length === 1, `${l}: deve esserci esattamente un <h1>`);
  ok(html.includes('id="main"'), `${l}: manca <main id="main">`);
}

console.log(`\n${fail ? '✗' : '✓'} ${pass} superati, ${fail} falliti`);
process.exit(fail ? 1 : 0);
