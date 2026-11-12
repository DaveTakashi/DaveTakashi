/**
 * app.js — Avvio, API pubblica e comportamenti progressivi.
 * Boot, public API and progressive behaviours.
 *
 * API globale / global API:  window.StudioUI
 *   .setData(obj, { merge })     inietta/aggiorna contenuti      inject/update content
 *   .getData()
 *   .setLocale('it'|'en')
 *   .setDesign(idOrPartialState)  es. setDesign('terra') o setDesign({ scheme:'dark', glass:70 })
 *   .getDesignState() / .resetDesign()
 *   .registerDesign(def)          aggiunge un preset a runtime    add preset at runtime
 *   .registerSection(type, fn)    aggiunge un tipo di sezione     add section type
 *   .exportTokens()               → oggetto JSON dei token        token JSON
 *   .on(evt, fn)                  'ready' | 'render' | 'designchange' | 'localechange'
 */
import { resolveSource, deepMerge, storage } from './core/data.js';
import { createTranslator, DEFAULT_LOCALE } from './core/i18n.js';
import { computeDesign, applyDesign, normalizeState, exportTokens, DEFAULT_STATE } from './design/engine.js';
import { createDesignWidget } from './design/widget.js';
import { renderPage } from './render/layout.js';
import { registerSection } from './render/sections.js';

const STORE_DESIGN = 'studio:design';
const STORE_LOCALE = 'studio:locale';

const state = {
  data: null,
  designs: null,
  locale: DEFAULT_LOCALE,
  design: { ...DEFAULT_STATE },
  widget: null,
  root: null,
  booted: false
};

const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : { matches: false, addEventListener() {} };
const emit = (name, detail) => document.dispatchEvent(new CustomEvent(`studio:${name}`, { detail }));

/* ───────────────────── Design ───────────────────── */
function paintDesign() {
  if (!state.designs) return null;
  const result = computeDesign(state.designs, state.design, { prefersDark: mq.matches });
  state.design = result.state;
  applyDesign(result);
  return result;
}

function setDesign(next, { persist = true, silent = false } = {}) {
  const patch = typeof next === 'string' ? { design: next, glass: null } : next;
  state.design = normalizeState({ ...state.design, ...patch }, state.designs);
  const result = paintDesign();
  if (persist) storage.set(STORE_DESIGN, state.design);
  if (!silent) emit('designchange', { state: state.design, tokens: result?.vars });
  return state.design;
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

/* ───────────────────── Render ───────────────────── */
function updateHead() {
  const t = createTranslator(state.locale, state.data.defaultLocale);
  document.documentElement.lang = state.locale;
  const skip = document.querySelector('.skip-link');
  if (skip && state.data.ui?.skip) skip.textContent = t(state.data.ui.skip);
  if (state.data.meta?.title) document.title = t(state.data.meta.title);
  const desc = document.querySelector('meta[name="description"]');
  if (desc && state.data.meta?.description) desc.setAttribute('content', t(state.data.meta.description));
}

function render({ force = false } = {}) {
  const root = state.root;
  const pre = root.getAttribute('data-prerendered');
  // Se il server ha già prerenderizzato la stessa lingua, non ri-renderizziamo (zero layout shift).
  // If the server prerendered the same locale, skip re-render (zero layout shift).
  if (force || pre !== state.locale) {
    root.innerHTML = renderPage(state.data, state.locale, { langHref: langHref });
    root.setAttribute('data-prerendered', state.locale);
  }
  updateHead();
  enhance(root);
  mountWidget();
  emit('render', { locale: state.locale });
}

function langHref(l) {
  // Build statica: percorsi per lingua in data-lang-hrefs (es. {"it":"./","en":"en/"}); altrimenti ?lang=
  // Static build: per-locale paths in data-lang-hrefs; otherwise live switch via ?lang=
  try {
    const map = JSON.parse(state.root.dataset.langHrefs || 'null');
    if (map?.[l]) return map[l];
  } catch { /* ignore */ }
  return `?lang=${l}`;
}

function mountWidget() {
  const wasOpen = state.widget?.el.classList.contains('is-open');
  state.widget?.destroy();
  const t = createTranslator(state.locale, state.data.defaultLocale);
  state.widget = createDesignWidget({
    designsDoc: state.designs,
    t,
    ui: (k) => t(state.data.ui?.[k]) || k,
    getState: () => state.design,
    setState: (s) => setDesign(s),
    reset: () => { storage.remove(STORE_DESIGN); setDesign({ ...DEFAULT_STATE, design: state.designs.default }); },
    onExport: () => downloadJSON(api.exportTokens(), `studio-tokens-${state.design.design}.json`),
    open: wasOpen
  });
}

/* ───────────────────── Enhancements ───────────────────── */
function enhance(root) {
  navBehaviour(root);
  langBehaviour(root);
  revealBehaviour(root);
  scrollSpy(root);
  formBehaviour(root);
}

function navBehaviour(root) {
  const toggle = root.querySelector('[data-nav-toggle]');
  const nav = root.querySelector('[data-nav]');
  const header = root.querySelector('[data-header]');
  if (!toggle || !nav) return;
  const set = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { set(false); toggle.focus(); }
  });
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function langBehaviour(root) {
  root.querySelectorAll('[data-locale]').forEach((a) => a.addEventListener('click', (e) => {
    const l = a.getAttribute('data-locale');
    if (!state.data.locales?.includes(l)) return;
    // Su build statica con /en/ separato lasciamo navigare; altrimenti cambio lingua live.
    if (!a.getAttribute('href').startsWith('?')) return;
    e.preventDefault();
    api.setLocale(l);
    const url = new URL(location.href);
    url.searchParams.set('lang', l);
    history.replaceState(null, '', url);
    root.querySelector(`[data-locale="${l}"]`)?.focus();
  }));
}

function revealBehaviour(root) {
  const els = root.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((el) => {
    // Gli elementi già visibili non vengono nascosti (nessun flash). Visible ones aren't hidden.
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight) { el.classList.add('is-visible'); return; }
    el.classList.add('will-reveal');
    io.observe(el);
  });
}

function scrollSpy(root) {
  const links = [...root.querySelectorAll('.nav__link[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const link = map.get(en.target.id);
      if (!link) return;
      if (en.isIntersecting) {
        links.forEach((l) => l.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'location');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

function formBehaviour(root) {
  const form = root.querySelector('#contact-form');
  if (!form) return;
  const t = createTranslator(state.locale, state.data.defaultLocale);
  const ui = (k) => t(state.data.ui?.[k]);
  const status = form.querySelector('.form__status');
  const summary = form.querySelector('.form__summary');

  const setError = (input, msg) => {
    const err = form.querySelector(`#${input.id}-err`);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.textContent = msg || ''; err.hidden = !msg; }
  };
  const validate = (input) => {
    if (input.type === 'checkbox') return input.checked ? '' : ui('formErrorPrivacy');
    if (input.required && !input.value.trim()) return ui('formErrorRequired');
    if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value)) return ui('formErrorEmail');
    return '';
  };
  form.querySelectorAll('[required]').forEach((input) => {
    input.addEventListener('blur', () => { if (input.getAttribute('aria-invalid') === 'true' || input.value) setError(input, validate(input)); });
    input.addEventListener('change', () => { if (input.getAttribute('aria-invalid') === 'true') setError(input, validate(input)); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalid = [];
    form.querySelectorAll('[required]').forEach((input) => {
      const msg = validate(input);
      setError(input, msg);
      if (msg) invalid.push(input);
    });
    if (invalid.length) {
      summary.hidden = false;
      summary.textContent = `${ui('formErrorSummary')} (${invalid.length})`;
      invalid[0].focus();
      return;
    }
    summary.hidden = true;
    const payload = Object.fromEntries(new FormData(form));
    const endpoint = form.dataset.endpoint;
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    status.textContent = ui('formSending');
    try {
      if (endpoint) {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        status.textContent = ui('formSuccess');
        form.reset();
      } else {
        const subject = encodeURIComponent(`Richiesta dal sito — ${payload.name}`);
        const body = encodeURIComponent(`${payload.message}\n\n— ${payload.name}\n${payload.email}\n${payload.org || ''}`);
        status.textContent = ui('formMailto');
        location.href = `mailto:${form.dataset.mailto}?subject=${subject}&body=${body}`;
      }
      emit('formsubmit', { payload });
    } catch (err) {
      status.textContent = `⚠ ${err.message}`;
    } finally {
      btn.disabled = false;
    }
  });
}

/* ───────────────────── Public API ───────────────────── */
const api = {
  version: '1.0.0',
  setData(next, { merge = false } = {}) {
    state.data = merge ? deepMerge(state.data, next) : next;
    if (!state.data.locales?.includes(state.locale)) state.locale = state.data.defaultLocale || DEFAULT_LOCALE;
    if (state.booted) render({ force: true });
    return state.data;
  },
  getData: () => state.data,
  setLocale(l) {
    if (!state.data?.locales?.includes(l)) return;
    state.locale = l;
    storage.set(STORE_LOCALE, l);
    render({ force: true });
    emit('localechange', { locale: l });
  },
  getLocale: () => state.locale,
  setDesign: (s) => setDesign(s),
  getDesignState: () => ({ ...state.design }),
  resetDesign() { storage.remove(STORE_DESIGN); setDesign({ ...DEFAULT_STATE, design: state.designs.default }); state.widget?.refresh(); },
  registerDesign(def) {
    state.designs.designs = [...state.designs.designs.filter((d) => d.id !== def.id), def];
    state.widget?.refresh();
  },
  registerSection(type, fn) { registerSection(type, fn); if (state.booted) render({ force: true }); },
  exportTokens: () => exportTokens(computeDesign(state.designs, state.design, { prefersDark: mq.matches })),
  openDesignWidget: () => state.widget?.open(),
  on(evt, fn) { document.addEventListener(`studio:${evt}`, (e) => fn(e.detail)); return api; }
};

/* ───────────────────── Boot ───────────────────── */
export async function boot(rootSel = '#app') {
  state.root = document.querySelector(rootSel);
  if (!state.root) return console.error(`[studio] root ${rootSel} non trovato`);

  // 1) Design subito (prima dei dati di contenuto) → niente flash di stile
  state.designs = await resolveSource({
    globalName: '__STUDIO_DESIGNS__', scriptId: 'studio-designs', url: state.root.dataset.designsSrc
  });
  if (!state.designs?.designs?.length) return console.error('[studio] nessun design disponibile');
  state.design = normalizeState(storage.get(STORE_DESIGN) || {}, state.designs);
  paintDesign();
  mq.addEventListener?.('change', () => { if (state.design.scheme === 'auto') paintDesign(); });

  // 2) Contenuti
  state.data = await resolveSource({
    globalName: '__STUDIO_DATA__', scriptId: 'studio-data', url: state.root.dataset.src
  });
  if (!state.data) return console.error('[studio] nessun dato di contenuto');

  // 3) Lingua: ?lang= → preferenza salvata → <html lang> → default
  const q = new URLSearchParams(location.search).get('lang');
  const candidates = [q, state.root.getAttribute('data-prerendered'), storage.get(STORE_LOCALE), document.documentElement.lang, state.data.defaultLocale];
  state.locale = candidates.find((l) => l && state.data.locales?.includes(l)) || DEFAULT_LOCALE;

  render();
  state.booted = true;
  document.documentElement.classList.add('js-ready');
  emit('ready', { api });
}

if (typeof window !== 'undefined') {
  window.StudioUI = api;
  // Pittura anticipata: se i design sono già inline nel <head>, applicali prima del primo paint.
  // Early paint: if designs are inline in <head>, apply them before first paint (no FOUC).
  try {
    const pre = window.__STUDIO_DESIGNS__ || JSON.parse(document.getElementById('studio-designs')?.textContent || 'null');
    if (pre?.designs?.length) {
      state.designs = pre;
      state.design = normalizeState(storage.get(STORE_DESIGN) || {}, pre);
      paintDesign();
    }
  } catch { /* non bloccante / non-blocking */ }
  const start = () => boot(document.currentScript?.dataset?.root || '#app');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}

export default api;
