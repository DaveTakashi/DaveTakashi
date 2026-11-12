/**
 * layout.js — Header, footer e composizione della pagina.
 * Header, footer and page composition.
 */
import { html, safeUrl } from '../core/html.js';
import { createTranslator } from '../core/i18n.js';
import { icon } from './icons.js';
import { renderSection } from './sections.js';

const LANG_NAMES = { it: 'Italiano', en: 'English' };

function header(ctx) {
  const { t, data, locale } = ctx;
  const ui = (k) => t(data.ui?.[k]);
  return html`
<header class="site-header" data-header>
  <div class="container site-header__inner glass">
    <a class="brand" href="#home" aria-label="${ui('home')}">
      <span class="brand__mark" aria-hidden="true">${data.brand?.monogram}</span>
      <span class="brand__text"><strong>${data.brand?.name}</strong><small>${t(data.brand?.tagline)}</small></span>
    </a>
    <nav class="nav" id="site-nav" aria-label="${ui('mainNav')}" data-nav>
      <ul class="nav__list" role="list">
        ${(data.navigation || []).map((n) => html`<li><a class="nav__link" href="${safeUrl(n.href)}">${t(n.label)}</a></li>`)}
      </ul>
      <div class="nav__extra">
        <ul class="lang" role="list" aria-label="${ui('language')}">
          ${(data.locales || ['it']).map((l) => html`
            <li><a class="lang__link" href="${ctx.langHref(l)}" hreflang="${l}" lang="${l}" data-locale="${l}" ${l === locale ? html`aria-current="true"` : ''}>
              <span aria-hidden="true">${l.toUpperCase()}</span><span class="sr-only">${LANG_NAMES[l] || l}</span>
            </a></li>`)}
        </ul>
        ${data.headerCta ? html`<a class="btn btn--primary btn--sm" href="${safeUrl(data.headerCta.href)}">${t(data.headerCta.label)}</a>` : ''}
      </div>
    </nav>
    <button class="icon-btn nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle
      data-label-open="${ui('menu')}" data-label-close="${ui('closeMenu')}">
      <span class="nav-toggle__open">${icon('menu', { label: ui('menu') })}</span>
      <span class="nav-toggle__close">${icon('close', { label: ui('closeMenu') })}</span>
    </button>
  </div>
</header>`;
}

function footer(ctx) {
  const { t, data } = ctx;
  const c = data.contact || {};
  return html`
<footer class="site-footer">
  <div class="container site-footer__inner">
    <div class="site-footer__brand">
      <span class="brand__mark" aria-hidden="true">${data.brand?.monogram}</span>
      <div><p class="site-footer__name">${data.brand?.name}</p><p class="muted">${t(data.brand?.tagline)}</p></div>
    </div>
    <div class="site-footer__contact muted">
      ${c.address ? html`<p>${t(c.address)}</p>` : ''}
      ${c.email ? html`<p><a href="mailto:${c.email}">${c.email}</a></p>` : ''}
    </div>
    <nav aria-label="Legal">
      <ul class="site-footer__links" role="list">
        ${(data.footer?.links || []).map((l) => html`<li><a href="${safeUrl(l.href)}">${t(l.label)}</a></li>`)}
      </ul>
    </nav>
  </div>
  <div class="container site-footer__legal muted">
    <p>© ${ctx.year} ${t(data.footer?.legal)}</p>
  </div>
</footer>`;
}

/**
 * renderPage(data, locale, opts) → stringa HTML dell'app (header+main+footer).
 * Usata sia dal browser (runtime) che da Node (prerender/SSR).
 */
export function renderPage(data, locale, opts = {}) {
  const t = createTranslator(locale, data.defaultLocale || 'it');
  const ctx = {
    t, data, locale,
    year: opts.year || new Date().getFullYear(),
    langHref: opts.langHref || ((l) => `?lang=${l}`)
  };
  return html`
${header(ctx)}
<main id="main" tabindex="-1">
  ${(data.sections || []).map((s) => renderSection(s, ctx))}
</main>
${footer(ctx)}`.toString();
}

export { createTranslator };
