/**
 * SiteRenderer.jsx — Header + sezioni dinamiche + footer.
 * Le sezioni vengono scelte in base a section.type → l'ordine lo decide il CMS.
 * Sections are chosen by section.type → the CMS decides the order.
 */
import { useEffect, useState } from 'react';
import { useStudio } from './StudioProvider.jsx';
import { Icon, safeUrl } from './primitives.jsx';
import { SECTIONS } from './sections/index.jsx';

const LANG_NAMES = { it: 'Italiano', en: 'English' };

export function Header() {
  const { t, ui, data, locale, setLocale } = useStudio();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener('scroll', on, { passive: true });
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => { window.removeEventListener('scroll', on); document.removeEventListener('keydown', esc); };
  }, []);

  return (
    <header className={['site-header', open && 'is-open', scrolled && 'is-scrolled'].filter(Boolean).join(' ')}>
      <div className="container site-header__inner glass">
        <a className="brand" href="#home" aria-label={ui('home')}>
          <span className="brand__mark" aria-hidden="true">{data.brand?.monogram}</span>
          <span className="brand__text"><strong>{data.brand?.name}</strong><small>{t(data.brand?.tagline)}</small></span>
        </a>
        <nav className="nav" id="site-nav" aria-label={ui('mainNav')} onClick={(e) => e.target.closest('a') && setOpen(false)}>
          <ul className="nav__list" role="list">
            {(data.navigation || []).map((n, i) => <li key={i}><a className="nav__link" href={safeUrl(n.href)}>{t(n.label)}</a></li>)}
          </ul>
          <div className="nav__extra">
            <ul className="lang" role="list" aria-label={ui('language')}>
              {(data.locales || []).map((l) => (
                <li key={l}>
                  <a className="lang__link" href={`?lang=${l}`} hrefLang={l} lang={l} aria-current={l === locale ? 'true' : undefined}
                    onClick={(e) => { e.preventDefault(); setLocale(l); }}>
                    <span aria-hidden="true">{l.toUpperCase()}</span><span className="sr-only">{LANG_NAMES[l] || l}</span>
                  </a>
                </li>
              ))}
            </ul>
            {data.headerCta && <a className="btn btn--primary btn--sm" href={safeUrl(data.headerCta.href)}>{t(data.headerCta.label)}</a>}
          </div>
        </nav>
        <button className="icon-btn nav-toggle" type="button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          {open ? <Icon name="close" label={ui('closeMenu')} /> : <Icon name="menu" label={ui('menu')} />}
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  const { t, data } = useStudio();
  const c = data.contact || {};
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <span className="brand__mark" aria-hidden="true">{data.brand?.monogram}</span>
          <div><p className="site-footer__name">{data.brand?.name}</p><p className="muted">{t(data.brand?.tagline)}</p></div>
        </div>
        <div className="site-footer__contact muted">
          {c.address && <p>{t(c.address)}</p>}
          {c.email && <p><a href={`mailto:${c.email}`}>{c.email}</a></p>}
        </div>
        <nav aria-label="Legal">
          <ul className="site-footer__links" role="list">
            {(data.footer?.links || []).map((l, i) => <li key={i}><a href={safeUrl(l.href)}>{t(l.label)}</a></li>)}
          </ul>
        </nav>
      </div>
      <div className="container site-footer__legal muted"><p>© {new Date().getFullYear()} {t(data.footer?.legal)}</p></div>
    </footer>
  );
}

/** components: sovrascrivi/aggiungi tipi di sezione. Override/add section types. */
export function SiteRenderer({ components = {} }) {
  const { data, ui } = useStudio();
  const map = { ...SECTIONS, ...components };
  return (
    <>
      <a className="skip-link" href="#main">{ui('skip')}</a>
      <Header />
      <main id="main" tabIndex={-1}>
        {(data.sections || []).filter((s) => !s.hidden).map((s) => {
          const C = map[s.type];
          return C ? <C key={s.id || s.type} s={s} /> : null;
        })}
      </main>
      <Footer />
    </>
  );
}
