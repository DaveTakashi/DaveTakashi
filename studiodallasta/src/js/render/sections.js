/**
 * sections.js — Registro delle sezioni (data-driven, ordinabili da CMS).
 * Section registry (data-driven, CMS-orderable).
 *
 * Ogni renderer: (section, ctx) → Raw HTML. ctx = { t, data, locale }
 * Per aggiungere un tipo: registerSection('miotipo', (s, ctx) => html`...`)
 */
import { html, raw, safeUrl, cx } from '../core/html.js';
import { formatDate } from '../core/i18n.js';
import { icon } from './icons.js';
import { illustration } from './illustrations.js';

const REGISTRY = new Map();
export const registerSection = (type, renderer) => REGISTRY.set(type, renderer);
export const hasSection = (type) => REGISTRY.has(type);

/** Media: foto da CMS se presente, altrimenti illustrazione SVG. Photo from CMS or SVG. */
function media(s, ctx, fallback) {
  const img = s.image;
  if (img && img.src) {
    return html`<img src="${safeUrl(img.src)}" alt="${ctx.t(img.alt)}" width="${img.width || 960}" height="${img.height || 720}" loading="${img.eager ? 'eager' : 'lazy'}" decoding="async">`;
  }
  return illustration(s.illustration || fallback, ctx.t(s.illustrationAlt) || undefined);
}

const head = (s, ctx, { center = false, level = 2 } = {}) => html`
  <header class="${cx('section-head', center && 'section-head--center')}" data-reveal>
    ${s.eyebrow ? html`<p class="eyebrow">${ctx.t(s.eyebrow)}</p>` : ''}
    ${raw(`<h${level} class="h2" id="${s.id}-title">`)}${ctx.t(s.title)}${raw(`</h${level}>`)}
    ${s.lead ? html`<p class="lead">${ctx.t(s.lead)}</p>` : ''}
  </header>`;

function highlightTitle(title, word) {
  if (!word || !title.includes(word)) return title;
  const i = title.lastIndexOf(word);
  return html`${title.slice(0, i)}<span class="hl">${word}</span>${title.slice(i + word.length)}`;
}

/* ───────────────────────────── HERO ───────────────────────────── */
registerSection('hero', (s, ctx) => html`
<section class="section hero" id="${s.id}" aria-labelledby="${s.id}-title">
  <div class="container hero__grid">
    <div class="hero__copy">
      ${s.eyebrow ? html`<p class="eyebrow eyebrow--pill">${icon('sparkle', { size: 16 })}<span>${ctx.t(s.eyebrow)}</span></p>` : ''}
      <h1 class="display" id="${s.id}-title">${highlightTitle(ctx.t(s.title), ctx.t(s.highlight))}</h1>
      <p class="lead lead--xl">${ctx.t(s.lead)}</p>
      <div class="actions">
        ${(s.actions || []).map((a) => html`
          <a class="${cx('btn', a.variant === 'ghost' ? 'btn--ghost' : 'btn--primary')}" href="${safeUrl(a.href)}">
            <span>${ctx.t(a.label)}</span>${icon('arrowRight', { size: 18 })}
          </a>`)}
      </div>
      ${s.badges?.length ? html`<ul class="badges" role="list">
        ${s.badges.map((b) => html`<li class="badge">${icon(b.icon, { size: 18 })}<span>${ctx.t(b.text)}</span></li>`)}
      </ul>` : ''}
    </div>
    <div class="hero__media" data-reveal="zoom">${media(s, ctx, 'hero')}</div>
  </div>
</section>`);

/* ───────────────────────────── STATS ───────────────────────────── */
registerSection('stats', (s, ctx) => html`
<section class="section section--tight" id="${s.id}" aria-label="${ctx.t(s.label)}">
  <div class="container">
    <dl class="stats glass" data-reveal>
      ${(s.items || []).map((it) => html`
        <div class="stat">
          <dt class="stat__label">${ctx.t(it.label)}</dt>
          <dd class="stat__value">${ctx.t(it.value)}</dd>
        </div>`)}
    </dl>
  </div>
</section>`);

/* ───────────────────────────── SERVICES ───────────────────────────── */
registerSection('services', (s, ctx) => html`
<section class="section" id="${s.id}" aria-labelledby="${s.id}-title">
  <div class="container">
    ${head(s, ctx)}
    ${s.groups?.length > 1 ? html`
      <nav class="chips" aria-label="${ctx.t(s.eyebrow)}">
        ${s.groups.map((g) => html`<a class="chip" href="#${g.id}">${ctx.t(g.tab || g.title)}</a>`)}
      </nav>` : ''}
    <div class="service-groups">
      ${(s.groups || []).map((g, gi) => html`
        <article class="${cx('service-group glass', gi % 2 && 'service-group--alt')}" id="${g.id}" aria-labelledby="${g.id}-title" data-reveal>
          <div class="service-group__intro">
            <h3 class="h3" id="${g.id}-title">${ctx.t(g.title)}</h3>
            <p class="muted">${ctx.t(g.intro)}</p>
            <div class="service-group__media">${media(g, ctx, gi ? 'business' : 'community')}</div>
          </div>
          <ul class="cards" role="list">
            ${(g.items || []).map((it) => html`
              <li class="card">
                <span class="card__icon">${icon(it.icon)}</span>
                <h4 class="card__title">${ctx.t(it.title)}</h4>
                <p class="card__text">${ctx.t(it.text)}</p>
              </li>`)}
          </ul>
        </article>`)}
    </div>
  </div>
</section>`);

/* ───────────────────────────── METHOD ───────────────────────────── */
registerSection('method', (s, ctx) => html`
<section class="section" id="${s.id}" aria-labelledby="${s.id}-title">
  <div class="container">
    ${head(s, ctx)}
    <ol class="steps" role="list">
      ${(s.steps || []).map((st, i) => html`
        <li class="step glass" data-reveal style="--i:${i}">
          <span class="step__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="h4">${ctx.t(st.title)}</h3>
          <p class="muted">${ctx.t(st.text)}</p>
        </li>`)}
    </ol>
  </div>
</section>`);

/* ───────────────────────────── SECTORS ───────────────────────────── */
registerSection('sectors', (s, ctx) => html`
<section class="section" id="${s.id}" aria-labelledby="${s.id}-title">
  <div class="container">
    ${head(s, ctx, { center: true })}
    <ul class="sectors" role="list" data-reveal>
      ${(s.items || []).map((it) => html`
        <li class="sector glass">${icon(it.icon)}<span>${ctx.t(it.title)}</span></li>`)}
    </ul>
  </div>
</section>`);

/* ───────────────────────────── ABOUT ───────────────────────────── */
registerSection('about', (s, ctx) => html`
<section class="section" id="${s.id}" aria-labelledby="${s.id}-title">
  <div class="container about">
    <div class="about__media" data-reveal="zoom">${media(s, ctx, 'studio')}</div>
    <div class="about__copy">
      ${head(s, ctx)}
      ${(Array.isArray(s.text) ? s.text : [s.text]).map((p) => html`<p class="prose" data-reveal>${ctx.t(p)}</p>`)}
      <ul class="checklist" role="list" data-reveal>
        ${(s.values || []).map((v) => html`<li>${icon(v.icon || 'check', { size: 20 })}<span>${ctx.t(v.text)}</span></li>`)}
      </ul>
    </div>
  </div>
</section>`);

/* ───────────────────────────── INSIGHTS ───────────────────────────── */
registerSection('insights', (s, ctx) => html`
<section class="section" id="${s.id}" aria-labelledby="${s.id}-title">
  <div class="container">
    ${head(s, ctx)}
    <ul class="posts" role="list">
      ${(s.items || []).map((p, i) => html`
        <li class="post glass" data-reveal style="--i:${i}">
          <p class="post__meta"><span class="tag">${ctx.t(p.tag)}</span><time datetime="${p.date}">${formatDate(p.date, ctx.locale)}</time></p>
          <h3 class="h4 post__title"><a class="stretched" href="${safeUrl(p.href)}">${ctx.t(p.title)}</a></h3>
          <span class="post__more" aria-hidden="true">${ctx.t(ctx.data.ui?.readMore)} ${icon('arrowUpRight', { size: 18 })}</span>
        </li>`)}
    </ul>
  </div>
</section>`);

/* ───────────────────────────── FAQ ───────────────────────────── */
registerSection('faq', (s, ctx) => html`
<section class="section" id="${s.id}" aria-labelledby="${s.id}-title">
  <div class="container faq">
    ${head(s, ctx)}
    <div class="faq__list" data-reveal>
      ${(s.items || []).map((f, i) => html`
        <details class="faq__item glass" ${i === 0 ? raw('open') : ''}>
          <summary><span>${ctx.t(f.q)}</span><span class="faq__icon" aria-hidden="true">${icon('plus', { size: 20 })}</span></summary>
          <div class="faq__answer"><p>${ctx.t(f.a)}</p></div>
        </details>`)}
    </div>
  </div>
</section>`);

/* ───────────────────────────── CTA ───────────────────────────── */
registerSection('cta', (s, ctx) => html`
<section class="section section--tight" id="${s.id}" aria-labelledby="${s.id}-title">
  <div class="container">
    <div class="cta" data-reveal>
      <div>
        <h2 class="h2" id="${s.id}-title">${ctx.t(s.title)}</h2>
        <p class="cta__text">${ctx.t(s.text)}</p>
      </div>
      <a class="btn btn--invert" href="${safeUrl(s.action?.href)}"><span>${ctx.t(s.action?.label)}</span>${icon('arrowRight', { size: 18 })}</a>
    </div>
  </div>
</section>`);

/* ───────────────────────────── CONTACT ───────────────────────────── */
registerSection('contact', (s, ctx) => {
  const f = s.form || {};
  const L = (k) => ctx.t(f.fields?.[k]);
  const c = ctx.data.contact || {};
  const req = html`<span class="req" aria-hidden="true">*</span><span class="sr-only"> (${ctx.t(ctx.data.ui?.formRequired)})</span>`;
  const tel = String(c.phone || '').replace(/[^\d+]/g, '');
  return html`
<section class="section" id="${s.id}" aria-labelledby="${s.id}-title">
  <div class="container contact">
    <div class="contact__info">
      ${head(s, ctx)}
      <ul class="contact__list" role="list" data-reveal>
        ${c.email ? html`<li>${icon('mail')}<a href="mailto:${c.email}">${c.email}</a></li>` : ''}
        ${c.phone ? html`<li>${icon('phone')}<a href="tel:${tel}">${c.phone}</a></li>` : ''}
        ${c.pec ? html`<li>${icon('shield')}<span><abbr title="Posta Elettronica Certificata">PEC</abbr> ${c.pec}</span></li>` : ''}
        ${c.address ? html`<li>${icon('pin')}<address>${ctx.t(c.address)}</address></li>` : ''}
        ${c.hours ? html`<li>${icon('clock')}<span>${ctx.t(c.hours)}</span></li>` : ''}
      </ul>
    </div>
    <form class="form glass" id="contact-form" novalidate data-endpoint="${f.endpoint || ''}" data-mailto="${f.mailto || c.email || ''}" data-reveal>
      <div class="form__summary" role="alert" tabindex="-1" hidden></div>
      <div class="field">
        <label for="cf-name">${L('name')} ${req}</label>
        <input id="cf-name" name="name" type="text" autocomplete="name" required aria-describedby="cf-name-err">
        <p class="field__error" id="cf-name-err" hidden></p>
      </div>
      <div class="field">
        <label for="cf-email">${L('email')} ${req}</label>
        <input id="cf-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="cf-email-err">
        <p class="field__error" id="cf-email-err" hidden></p>
      </div>
      <div class="field">
        <label for="cf-org">${L('org')}</label>
        <select id="cf-org" name="org">
          ${(f.orgOptions || []).map((o) => html`<option value="${o.value}">${ctx.t(o.label)}</option>`)}
        </select>
      </div>
      <div class="field">
        <label for="cf-message">${L('message')} ${req}</label>
        <textarea id="cf-message" name="message" rows="5" required aria-describedby="cf-message-err"></textarea>
        <p class="field__error" id="cf-message-err" hidden></p>
      </div>
      <div class="field field--check">
        <input id="cf-privacy" name="privacy" type="checkbox" required aria-describedby="cf-privacy-err">
        <label for="cf-privacy">${L('privacy')} ${f.privacyHref ? html`<a href="${safeUrl(f.privacyHref)}">Privacy</a>` : ''} ${req}</label>
        <p class="field__error" id="cf-privacy-err" hidden></p>
      </div>
      <button class="btn btn--primary btn--block" type="submit"><span>${L('submit')}</span>${icon('arrowRight', { size: 18 })}</button>
      <p class="form__status" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>`;
});

/** Renderizza una sezione (ignora tipi sconosciuti con avviso). Renders one section. */
export function renderSection(section, ctx) {
  if (section?.hidden) return '';
  const r = REGISTRY.get(section?.type);
  if (!r) { if (typeof console !== 'undefined') console.warn(`[studio] sezione sconosciuta: ${section?.type}`); return ''; }
  return r(section, ctx);
}
