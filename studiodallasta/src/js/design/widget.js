/**
 * widget.js — Widget "Stile grafico / Design style".
 * Pannello accessibile (WCAG 2.2 AA) per scegliere design e opzioni in tempo reale.
 * Accessible panel to pick design presets and options live.
 *
 * - Controlli nativi (radio, range, checkbox, color) → tastiera e screen reader gratis
 * - Esc chiude, il focus torna al pulsante; annunci in aria-live
 * - Nessuna dipendenza dal markup del sito: si monta ovunque
 */
import { html, cx } from '../core/html.js';
import { icon } from '../render/icons.js';

export function createDesignWidget({ mount = document.body, designsDoc, t, ui, getState, setState, reset, onExport, open = false }) {
  const root = document.createElement('div');
  root.className = 'ds';
  root.setAttribute('data-ds', '');

  const seg = (name, legend, options, current) => html`
    <fieldset class="ds__field">
      <legend class="ds__legend">${legend}</legend>
      <div class="seg">
        ${options.map((o) => html`
          <label class="seg__opt">
            <input type="radio" name="${name}" value="${o.value}" ${String(o.value) === String(current) ? html`checked` : ''}>
            <span>${o.label}</span>
          </label>`)}
      </div>
    </fieldset>`;

  function template() {
    const s = getState();
    const design = designsDoc.designs.find((d) => d.id === s.design) || designsDoc.designs[0];
    const locked = design.shape?.glassLocked === true;
    const glassValue = locked ? 0 : (s.glass ?? design.shape?.glass ?? designsDoc.base.glass);
    return html`
<button class="ds__fab" type="button" aria-expanded="false" aria-controls="ds-panel">
  ${icon('palette', { size: 20 })}<span class="ds__fab-label">${ui('designStyle')}</span>
</button>
<section class="ds__panel" id="ds-panel" role="dialog" aria-modal="false" aria-labelledby="ds-title" aria-describedby="ds-hint" hidden>
  <div class="ds__head">
    <div>
      <h2 class="ds__title" id="ds-title" tabindex="-1">${ui('designStyle')}</h2>
      <p class="ds__hint" id="ds-hint">${ui('designStyleHint')}</p>
    </div>
    <button class="icon-btn" type="button" data-ds-close>${icon('close', { label: ui('dsClose') })}</button>
  </div>
  <form class="ds__body" data-ds-form>
    <fieldset class="ds__field">
      <legend class="ds__legend">${ui('dsDesign')}</legend>
      <div class="ds__designs">
        ${designsDoc.designs.map((d) => {
          const c = d.colors.light;
          return html`
          <label class="ds__design">
            <input type="radio" name="design" value="${d.id}" ${d.id === s.design ? html`checked` : ''}>
            <span class="ds__swatch" aria-hidden="true" style="--sw-bg:${c.bg};--sw-surface:${c.surface};--sw-accent:${c.accent};--sw-text:${c.text};--sw-orb:${c.orb1};--sw-radius:${Math.min(10, d.shape?.radius ?? designsDoc.base.radius)}px">
              <i></i><b></b><em></em>
            </span>
            <span class="ds__design-text"><strong>${t(d.label)}</strong><small>${t(d.description)}</small></span>
          </label>`;
        })}
      </div>
    </fieldset>

    ${seg('scheme', ui('dsScheme'), [
      { value: 'auto', label: ui('dsAuto') },
      { value: 'light', label: ui('dsLight') },
      { value: 'dark', label: ui('dsDark') }
    ], s.scheme)}

    <fieldset class="ds__field">
      <legend class="ds__legend">${ui('dsAccent')}</legend>
      <div class="ds__accents">
        <label class="ds__accent ds__accent--default">
          <input type="radio" name="accent" value="" ${!s.accent ? html`checked` : ''}>
          <span class="ds__dot" aria-hidden="true"></span><span class="sr-only">${ui('dsAccentDefault')}</span>
        </label>
        ${(designsDoc.accentPresets || []).map((hex) => html`
          <label class="ds__accent">
            <input type="radio" name="accent" value="${hex}" ${s.accent?.toLowerCase() === hex.toLowerCase() ? html`checked` : ''}>
            <span class="ds__dot" style="--dot:${hex}" aria-hidden="true"></span><span class="sr-only">${hex}</span>
          </label>`)}
        <label class="ds__accent ds__accent--custom">
          <span class="sr-only">${ui('dsAccentCustom')}</span>
          <input type="color" name="accentCustom" value="${s.accent || '#0b6b63'}" aria-label="${ui('dsAccentCustom')}">
        </label>
      </div>
    </fieldset>

    <div class="ds__field">
      <label class="ds__legend" for="ds-glass">${ui('dsGlass')} <output for="ds-glass" data-ds-glass-out>${glassValue}%</output></label>
      <input class="range" id="ds-glass" type="range" name="glass" min="0" max="100" step="5" value="${glassValue}"
        ${locked ? html`disabled aria-describedby="ds-glass-note"` : ''}>
      ${locked ? html`<p class="ds__note" id="ds-glass-note">${ui('dsGlassLocked')}</p>` : ''}
    </div>

    ${seg('radius', ui('dsRadius'), [
      { value: 'design', label: ui('dsRadiusDesign') },
      { value: 'sharp', label: ui('dsSharp') },
      { value: 'soft', label: ui('dsSoft') },
      { value: 'round', label: ui('dsRound') }
    ], s.radius)}

    ${seg('density', ui('dsDensity'), [
      { value: 'compact', label: ui('dsCompact') },
      { value: 'comfortable', label: ui('dsComfortable') },
      { value: 'airy', label: ui('dsAiry') }
    ], s.density)}

    ${seg('textScale', ui('dsText'), [
      { value: 1, label: '100%' },
      { value: 1.125, label: '112%' },
      { value: 1.25, label: '125%' }
    ], s.textScale)}

    <div class="ds__field">
      <label class="switch">
        <input type="checkbox" name="motion" ${s.motion === 'reduce' ? html`checked` : ''}>
        <span class="switch__track" aria-hidden="true"></span>
        <span>${ui('dsMotion')}</span>
      </label>
    </div>
  </form>
  <div class="ds__foot">
    <button class="btn btn--ghost btn--sm" type="button" data-ds-reset>${icon('reset', { size: 16 })}<span>${ui('dsReset')}</span></button>
    <button class="btn btn--primary btn--sm" type="button" data-ds-export>${icon('download', { size: 16 })}<span>${ui('dsExport')}</span></button>
  </div>
  <p class="sr-only" aria-live="polite" data-ds-live></p>
</section>`.toString();
  }

  let isOpen = false;
  let announceTimer;

  const $ = (sel) => root.querySelector(sel);
  const announce = (msg) => {
    const live = $('[data-ds-live]');
    if (!live) return;
    clearTimeout(announceTimer);
    live.textContent = '';
    announceTimer = setTimeout(() => { live.textContent = msg; }, 60);
  };

  function setOpen(next, { focus = true } = {}) {
    isOpen = next;
    const panel = $('#ds-panel');
    const fab = $('.ds__fab');
    panel.hidden = !next;
    fab.setAttribute('aria-expanded', String(next));
    root.classList.toggle('is-open', next);
    if (focus) (next ? $('#ds-title') : fab)?.focus?.();
  }

  function readForm() {
    const form = $('[data-ds-form]');
    const fd = new FormData(form);
    const accentRadio = fd.get('accent');
    return {
      design: fd.get('design'),
      scheme: fd.get('scheme'),
      accent: accentRadio || null,
      glass: form.glass.disabled ? null : Number(fd.get('glass')),
      radius: fd.get('radius'),
      density: fd.get('density'),
      textScale: Number(fd.get('textScale')),
      motion: fd.get('motion') ? 'reduce' : 'auto'
    };
  }

  function bind() {
    $('.ds__fab').addEventListener('click', () => setOpen(!isOpen));
    $('[data-ds-close]').addEventListener('click', () => setOpen(false));
    $('[data-ds-reset]').addEventListener('click', () => { reset(); render(true); announce(ui('dsApplied')); });
    $('[data-ds-export]').addEventListener('click', () => { onExport(); announce(ui('dsExported')); });

    const form = $('[data-ds-form]');
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('input', (e) => {
      if (e.target.name === 'glass') $('[data-ds-glass-out]').textContent = `${e.target.value}%`;
      if (e.target.name === 'accentCustom') {
        // il colore personalizzato deseleziona i preset / custom colour clears presets
        form.querySelectorAll('input[name="accent"]').forEach((r) => { r.checked = false; });
        setState({ ...readForm(), accent: e.target.value });
        return;
      }
      if (e.target.type === 'range') setState(readForm());
    });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'accentCustom') return;
      const prevDesign = getState().design;
      const next = readForm();
      // cambiando design si riparte dalla sua trasparenza / new design → its own glass default
      if (next.design !== prevDesign) next.glass = null;
      setState(next);
      if (next.design !== prevDesign) render(true, 'input[name="design"]:checked');
      announce(ui('dsApplied'));
    });

    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) { e.stopPropagation(); setOpen(false); }
    });
  }

  function onDocPointer(e) { if (isOpen && !root.contains(e.target)) setOpen(false, { focus: false }); }
  document.addEventListener('pointerdown', onDocPointer);

  /** Ri-renderizza mantenendo apertura e focus. Re-render keeping open state & focus. */
  function render(keepOpen = isOpen, focusSel) {
    root.innerHTML = template();
    bind();
    if (keepOpen) { setOpen(true, { focus: false }); (focusSel ? $(focusSel) : null)?.focus(); }
  }

  render(open);
  mount.appendChild(root);

  return {
    el: root,
    open: () => setOpen(true),
    close: () => setOpen(false),
    refresh: () => render(isOpen),
    destroy: () => { document.removeEventListener('pointerdown', onDocPointer); root.remove(); }
  };
}
