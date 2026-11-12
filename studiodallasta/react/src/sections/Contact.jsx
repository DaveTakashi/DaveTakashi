/**
 * Contact.jsx — Form contatti accessibile (validazione, errori collegati, riepilogo con focus).
 * Accessible contact form (validation, linked errors, focused summary).
 */
import { useRef, useState } from 'react';
import { useStudio } from '../StudioProvider.jsx';
import { Icon, safeUrl } from '../primitives.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Contact({ s, onSubmit }) {
  const { t, ui, data } = useStudio();
  const f = s.form || {};
  const c = data.contact || {};
  const L = (k) => t(f.fields?.[k]);
  const [values, setValues] = useState({ name: '', email: '', org: f.orgOptions?.[0]?.value || '', message: '', privacy: false });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const summaryRef = useRef(null);
  const refs = { name: useRef(null), email: useRef(null), message: useRef(null), privacy: useRef(null) };

  const validate = (v) => {
    const e = {};
    if (!v.name.trim()) e.name = ui('formErrorRequired');
    if (!v.email.trim()) e.email = ui('formErrorRequired');
    else if (!EMAIL.test(v.email)) e.email = ui('formErrorEmail');
    if (!v.message.trim()) e.message = ui('formErrorRequired');
    if (!v.privacy) e.privacy = ui('formErrorPrivacy');
    return e;
  };

  const set = (k) => (e) => setValues((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) { refs[first].current?.focus(); return; }
    setBusy(true); setStatus(ui('formSending'));
    try {
      if (onSubmit) await onSubmit(values);
      else if (f.endpoint) {
        const res = await fetch(f.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        location.href = `mailto:${f.mailto || c.email}?subject=${encodeURIComponent('Richiesta dal sito — ' + values.name)}&body=${encodeURIComponent(values.message)}`;
      }
      setStatus(ui('formSuccess'));
    } catch (err) { setStatus(`⚠ ${err.message}`); } finally { setBusy(false); }
  }

  const Req = () => <><span className="req" aria-hidden="true">*</span><span className="sr-only"> ({ui('formRequired')})</span></>;
  const Err = ({ k }) => errors[k] ? <p className="field__error" id={`cf-${k}-err`}>{errors[k]}</p> : null;
  const aria = (k) => ({ 'aria-invalid': errors[k] ? 'true' : 'false', 'aria-describedby': errors[k] ? `cf-${k}-err` : undefined });
  const count = Object.keys(errors).length;

  return (
    <section className="section" id={s.id} aria-labelledby={`${s.id}-title`}>
      <div className="container contact">
        <div className="contact__info">
          <header className="section-head">
            {s.eyebrow && <p className="eyebrow">{t(s.eyebrow)}</p>}
            <h2 className="h2" id={`${s.id}-title`}>{t(s.title)}</h2>
            {s.lead && <p className="lead">{t(s.lead)}</p>}
          </header>
          <ul className="contact__list" role="list">
            {c.email && <li><Icon name="mail" /><a href={`mailto:${c.email}`}>{c.email}</a></li>}
            {c.phone && <li><Icon name="phone" /><a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>{c.phone}</a></li>}
            {c.address && <li><Icon name="pin" /><address>{t(c.address)}</address></li>}
            {c.hours && <li><Icon name="clock" /><span>{t(c.hours)}</span></li>}
          </ul>
        </div>
        <form className="form glass" noValidate onSubmit={submit}>
          {count > 0 && <div className="form__summary" role="alert" ref={summaryRef} tabIndex={-1}>{ui('formErrorSummary')} ({count})</div>}
          <div className="field">
            <label htmlFor="cf-name">{L('name')} <Req /></label>
            <input ref={refs.name} id="cf-name" name="name" autoComplete="name" required value={values.name} onChange={set('name')} {...aria('name')} />
            <Err k="name" />
          </div>
          <div className="field">
            <label htmlFor="cf-email">{L('email')} <Req /></label>
            <input ref={refs.email} id="cf-email" name="email" type="email" inputMode="email" autoComplete="email" required value={values.email} onChange={set('email')} {...aria('email')} />
            <Err k="email" />
          </div>
          <div className="field">
            <label htmlFor="cf-org">{L('org')}</label>
            <select id="cf-org" name="org" value={values.org} onChange={set('org')}>
              {(f.orgOptions || []).map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cf-message">{L('message')} <Req /></label>
            <textarea ref={refs.message} id="cf-message" name="message" rows={5} required value={values.message} onChange={set('message')} {...aria('message')} />
            <Err k="message" />
          </div>
          <div className="field field--check">
            <input ref={refs.privacy} id="cf-privacy" name="privacy" type="checkbox" required checked={values.privacy} onChange={set('privacy')} {...aria('privacy')} />
            <label htmlFor="cf-privacy">{L('privacy')} {f.privacyHref && <a href={safeUrl(f.privacyHref)}>Privacy</a>} <Req /></label>
            <Err k="privacy" />
          </div>
          <button className="btn btn--primary btn--block" type="submit" disabled={busy}><span>{L('submit')}</span><Icon name="arrowRight" size={18} /></button>
          <p className="form__status" role="status" aria-live="polite">{status}</p>
        </form>
      </div>
    </section>
  );
}
