/**
 * sections/index.jsx — Sezioni React (stesse classi CSS e stesso schema dati del sito HTML).
 * React sections (same CSS classes and same data schema as the HTML site).
 *
 * Aggiungere un tipo / add a type:  SECTIONS.miotipo = (props) => <section>…</section>
 */
import { useStudio } from '../StudioProvider.jsx';
import { Icon, Media, safeUrl } from '../primitives.jsx';
import { formatDate } from '../../../src/js/core/i18n.js';
import { Contact } from './Contact.jsx';

export { Contact };

const cx = (...a) => a.filter(Boolean).join(' ');

function SectionHead({ s, center }) {
  const { t } = useStudio();
  return (
    <header className={cx('section-head', center && 'section-head--center')} data-reveal="">
      {s.eyebrow && <p className="eyebrow">{t(s.eyebrow)}</p>}
      <h2 className="h2" id={`${s.id}-title`}>{t(s.title)}</h2>
      {s.lead && <p className="lead">{t(s.lead)}</p>}
    </header>
  );
}

function Highlight({ title, word }) {
  if (!word || !title.includes(word)) return title;
  const i = title.lastIndexOf(word);
  return <>{title.slice(0, i)}<span className="hl">{word}</span>{title.slice(i + word.length)}</>;
}

export function Hero({ s }) {
  const { t } = useStudio();
  return (
    <section className="section hero" id={s.id} aria-labelledby={`${s.id}-title`}>
      <div className="container hero__grid">
        <div className="hero__copy">
          {s.eyebrow && <p className="eyebrow eyebrow--pill"><Icon name="sparkle" size={16} /><span>{t(s.eyebrow)}</span></p>}
          <h1 className="display" id={`${s.id}-title`}><Highlight title={t(s.title)} word={t(s.highlight)} /></h1>
          <p className="lead lead--xl">{t(s.lead)}</p>
          <div className="actions">
            {(s.actions || []).map((a, i) => (
              <a key={i} className={cx('btn', a.variant === 'ghost' ? 'btn--ghost' : 'btn--primary')} href={safeUrl(a.href)}>
                <span>{t(a.label)}</span><Icon name="arrowRight" size={18} />
              </a>
            ))}
          </div>
          {!!s.badges?.length && (
            <ul className="badges" role="list">
              {s.badges.map((b, i) => <li key={i} className="badge"><Icon name={b.icon} size={18} /><span>{t(b.text)}</span></li>)}
            </ul>
          )}
        </div>
        <div className="hero__media"><Media item={s} fallback="hero" t={t} /></div>
      </div>
    </section>
  );
}

export function Stats({ s }) {
  const { t } = useStudio();
  return (
    <section className="section section--tight" id={s.id} aria-label={t(s.label)}>
      <div className="container">
        <dl className="stats glass">
          {(s.items || []).map((it, i) => (
            <div key={i} className="stat"><dt className="stat__label">{t(it.label)}</dt><dd className="stat__value">{t(it.value)}</dd></div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Services({ s }) {
  const { t } = useStudio();
  return (
    <section className="section" id={s.id} aria-labelledby={`${s.id}-title`}>
      <div className="container">
        <SectionHead s={s} />
        {s.groups?.length > 1 && (
          <nav className="chips" aria-label={t(s.eyebrow)}>
            {s.groups.map((g) => <a key={g.id} className="chip" href={`#${g.id}`}>{t(g.tab || g.title)}</a>)}
          </nav>
        )}
        <div className="service-groups">
          {(s.groups || []).map((g, gi) => (
            <article key={g.id} className={cx('service-group glass', gi % 2 && 'service-group--alt')} id={g.id} aria-labelledby={`${g.id}-title`}>
              <div className="service-group__intro">
                <h3 className="h3" id={`${g.id}-title`}>{t(g.title)}</h3>
                <p className="muted">{t(g.intro)}</p>
                <div className="service-group__media"><Media item={g} fallback={gi ? 'business' : 'community'} t={t} /></div>
              </div>
              <ul className="cards" role="list">
                {(g.items || []).map((it, i) => (
                  <li key={i} className="card">
                    <span className="card__icon"><Icon name={it.icon} /></span>
                    <h4 className="card__title">{t(it.title)}</h4>
                    <p className="card__text">{t(it.text)}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Method({ s }) {
  const { t } = useStudio();
  return (
    <section className="section" id={s.id} aria-labelledby={`${s.id}-title`}>
      <div className="container">
        <SectionHead s={s} />
        <ol className="steps" role="list">
          {(s.steps || []).map((st, i) => (
            <li key={i} className="step glass" style={{ '--i': i }}>
              <span className="step__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="h4">{t(st.title)}</h3>
              <p className="muted">{t(st.text)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Sectors({ s }) {
  const { t } = useStudio();
  return (
    <section className="section" id={s.id} aria-labelledby={`${s.id}-title`}>
      <div className="container">
        <SectionHead s={s} center />
        <ul className="sectors" role="list">
          {(s.items || []).map((it, i) => <li key={i} className="sector glass"><Icon name={it.icon} /><span>{t(it.title)}</span></li>)}
        </ul>
      </div>
    </section>
  );
}

export function About({ s }) {
  const { t } = useStudio();
  const paragraphs = Array.isArray(s.text) ? s.text : [s.text];
  return (
    <section className="section" id={s.id} aria-labelledby={`${s.id}-title`}>
      <div className="container about">
        <div className="about__media"><Media item={s} fallback="studio" t={t} /></div>
        <div className="about__copy">
          <SectionHead s={s} />
          {paragraphs.map((p, i) => <p key={i} className="prose">{t(p)}</p>)}
          <ul className="checklist" role="list">
            {(s.values || []).map((v, i) => <li key={i}><Icon name={v.icon || 'check'} size={20} /><span>{t(v.text)}</span></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Insights({ s }) {
  const { t, data, locale } = useStudio();
  return (
    <section className="section" id={s.id} aria-labelledby={`${s.id}-title`}>
      <div className="container">
        <SectionHead s={s} />
        <ul className="posts" role="list">
          {(s.items || []).map((p, i) => (
            <li key={i} className="post glass">
              <p className="post__meta"><span className="tag">{t(p.tag)}</span><time dateTime={p.date}>{formatDate(p.date, locale)}</time></p>
              <h3 className="h4 post__title"><a className="stretched" href={safeUrl(p.href)}>{t(p.title)}</a></h3>
              <span className="post__more" aria-hidden="true">{t(data.ui?.readMore)} <Icon name="arrowUpRight" size={18} /></span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Faq({ s }) {
  const { t } = useStudio();
  return (
    <section className="section" id={s.id} aria-labelledby={`${s.id}-title`}>
      <div className="container faq">
        <SectionHead s={s} />
        <div className="faq__list">
          {(s.items || []).map((f, i) => (
            <details key={i} className="faq__item glass" open={i === 0}>
              <summary><span>{t(f.q)}</span><span className="faq__icon" aria-hidden="true"><Icon name="plus" size={20} /></span></summary>
              <div className="faq__answer"><p>{t(f.a)}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Cta({ s }) {
  const { t } = useStudio();
  return (
    <section className="section section--tight" id={s.id} aria-labelledby={`${s.id}-title`}>
      <div className="container">
        <div className="cta">
          <div><h2 className="h2" id={`${s.id}-title`}>{t(s.title)}</h2><p className="cta__text">{t(s.text)}</p></div>
          <a className="btn btn--invert" href={safeUrl(s.action?.href)}><span>{t(s.action?.label)}</span><Icon name="arrowRight" size={18} /></a>
        </div>
      </div>
    </section>
  );
}

/** Mappa tipo → componente (estendibile). Type → component map (extensible). */
export const SECTIONS = {
  hero: Hero, stats: Stats, services: Services, method: Method, sectors: Sectors,
  about: About, insights: Insights, faq: Faq, cta: Cta, contact: Contact
};
