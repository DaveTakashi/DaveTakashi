/**
 * DesignStyleWidget.jsx — Versione React del widget "Stile grafico".
 * React version of the "Design style" widget (same CSS, same a11y contract).
 */
import { useEffect, useRef, useState } from 'react';
import { useStudio } from './StudioProvider.jsx';
import { Icon } from './primitives.jsx';

function Segmented({ name, legend, options, value, onChange }) {
  return (
    <fieldset className="ds__field">
      <legend className="ds__legend">{legend}</legend>
      <div className="seg">
        {options.map((o) => (
          <label key={o.value} className="seg__opt">
            <input type="radio" name={name} value={o.value} checked={String(value) === String(o.value)} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DesignStyleWidget() {
  const { t, ui, designs, design, setDesign, resetDesign, exportTokens } = useStudio();
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState('');
  const root = useRef(null), fab = useRef(null), title = useRef(null);

  const current = designs.designs.find((d) => d.id === design.design) || designs.designs[0];
  const locked = current.shape?.glassLocked === true;
  const glass = locked ? 0 : (design.glass ?? current.shape?.glass ?? designs.base.glass);

  const update = (patch) => { setDesign(patch); setLive(''); setTimeout(() => setLive(ui('dsApplied')), 60); };

  useEffect(() => { if (open) title.current?.focus(); }, [open]);
  useEffect(() => {
    const out = (e) => { if (open && !root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', out);
    return () => document.removeEventListener('pointerdown', out);
  }, [open]);

  const close = () => { setOpen(false); fab.current?.focus(); };
  const download = () => {
    const blob = new Blob([JSON.stringify(exportTokens(), null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `studio-tokens-${design.design}.json` });
    a.click(); URL.revokeObjectURL(a.href); setLive(ui('dsExported'));
  };

  return (
    <div className={`ds${open ? ' is-open' : ''}`} ref={root} onKeyDown={(e) => e.key === 'Escape' && open && close()}>
      <button ref={fab} className="ds__fab" type="button" aria-expanded={open} aria-controls="ds-panel" onClick={() => setOpen(!open)}>
        <Icon name="palette" size={20} /><span className="ds__fab-label">{ui('designStyle')}</span>
      </button>
      <section className="ds__panel" id="ds-panel" role="dialog" aria-modal="false" aria-labelledby="ds-title" aria-describedby="ds-hint" hidden={!open}>
        <div className="ds__head">
          <div>
            <h2 className="ds__title" id="ds-title" tabIndex={-1} ref={title}>{ui('designStyle')}</h2>
            <p className="ds__hint" id="ds-hint">{ui('designStyleHint')}</p>
          </div>
          <button className="icon-btn" type="button" onClick={close}><Icon name="close" label={ui('dsClose')} /></button>
        </div>
        <form className="ds__body" onSubmit={(e) => e.preventDefault()}>
          <fieldset className="ds__field">
            <legend className="ds__legend">{ui('dsDesign')}</legend>
            <div className="ds__designs">
              {designs.designs.map((d) => {
                const c = d.colors.light;
                return (
                  <label key={d.id} className="ds__design">
                    <input type="radio" name="design" value={d.id} checked={d.id === design.design} onChange={() => update({ design: d.id, glass: null })} />
                    <span className="ds__swatch" aria-hidden="true" style={{ '--sw-bg': c.bg, '--sw-surface': c.surface, '--sw-accent': c.accent, '--sw-orb': c.orb1, '--sw-radius': `${Math.min(10, d.shape?.radius ?? designs.base.radius)}px` }}><i /><b /><em /></span>
                    <span className="ds__design-text"><strong>{t(d.label)}</strong><small>{t(d.description)}</small></span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <Segmented name="scheme" legend={ui('dsScheme')} value={design.scheme} onChange={(v) => update({ scheme: v })}
            options={[{ value: 'auto', label: ui('dsAuto') }, { value: 'light', label: ui('dsLight') }, { value: 'dark', label: ui('dsDark') }]} />
          <fieldset className="ds__field">
            <legend className="ds__legend">{ui('dsAccent')}</legend>
            <div className="ds__accents">
              <label className="ds__accent ds__accent--default">
                <input type="radio" name="accent" checked={!design.accent} onChange={() => update({ accent: null })} />
                <span className="ds__dot" aria-hidden="true" /><span className="sr-only">{ui('dsAccentDefault')}</span>
              </label>
              {(designs.accentPresets || []).map((hex) => (
                <label key={hex} className="ds__accent">
                  <input type="radio" name="accent" checked={design.accent?.toLowerCase() === hex.toLowerCase()} onChange={() => update({ accent: hex })} />
                  <span className="ds__dot" style={{ '--dot': hex }} aria-hidden="true" /><span className="sr-only">{hex}</span>
                </label>
              ))}
              <label className="ds__accent ds__accent--custom">
                <input type="color" aria-label={ui('dsAccentCustom')} value={design.accent || '#0b6b63'} onChange={(e) => update({ accent: e.target.value })} />
              </label>
            </div>
          </fieldset>
          <div className="ds__field">
            <label className="ds__legend" htmlFor="ds-glass">{ui('dsGlass')} <output htmlFor="ds-glass">{glass}%</output></label>
            <input className="range" id="ds-glass" type="range" min="0" max="100" step="5" value={glass} disabled={locked}
              aria-describedby={locked ? 'ds-glass-note' : undefined} onChange={(e) => setDesign({ glass: Number(e.target.value) })} />
            {locked && <p className="ds__note" id="ds-glass-note">{ui('dsGlassLocked')}</p>}
          </div>
          <Segmented name="radius" legend={ui('dsRadius')} value={design.radius} onChange={(v) => update({ radius: v })}
            options={[{ value: 'design', label: ui('dsRadiusDesign') }, { value: 'sharp', label: ui('dsSharp') }, { value: 'soft', label: ui('dsSoft') }, { value: 'round', label: ui('dsRound') }]} />
          <Segmented name="density" legend={ui('dsDensity')} value={design.density} onChange={(v) => update({ density: v })}
            options={[{ value: 'compact', label: ui('dsCompact') }, { value: 'comfortable', label: ui('dsComfortable') }, { value: 'airy', label: ui('dsAiry') }]} />
          <Segmented name="textScale" legend={ui('dsText')} value={design.textScale} onChange={(v) => update({ textScale: Number(v) })}
            options={[{ value: 1, label: '100%' }, { value: 1.125, label: '112%' }, { value: 1.25, label: '125%' }]} />
          <div className="ds__field">
            <label className="switch">
              <input type="checkbox" checked={design.motion === 'reduce'} onChange={(e) => update({ motion: e.target.checked ? 'reduce' : 'auto' })} />
              <span className="switch__track" aria-hidden="true" /><span>{ui('dsMotion')}</span>
            </label>
          </div>
        </form>
        <div className="ds__foot">
          <button className="btn btn--ghost btn--sm" type="button" onClick={() => { resetDesign(); setLive(ui('dsApplied')); }}><Icon name="reset" size={16} /><span>{ui('dsReset')}</span></button>
          <button className="btn btn--primary btn--sm" type="button" onClick={download}><Icon name="download" size={16} /><span>{ui('dsExport')}</span></button>
        </div>
        <p className="sr-only" aria-live="polite">{live}</p>
      </section>
    </div>
  );
}
