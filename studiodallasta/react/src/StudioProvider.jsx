/**
 * StudioProvider.jsx — Contesto React: dati, lingua, design.
 * React context: content data, locale, design state.
 *
 * Riusa il motore puro (engine.js) e i token → identico al sito HTML.
 * Reuses the pure engine and tokens → pixel-identical to the HTML site.
 *
 *   <StudioProvider data={site} designs={designs} initialLocale="it">
 *     <SiteRenderer />
 *     <DesignStyleWidget />
 *   </StudioProvider>
 */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { computeDesign, normalizeState, exportTokens, DEFAULT_STATE } from '../../src/js/design/engine.js';
import { createTranslator } from '../../src/js/core/i18n.js';

const StudioContext = createContext(null);
const STORE = 'studio:design';
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const readStore = () => { try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; } };
const writeStore = (v) => { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* noop */ } };

export function StudioProvider({ data, designs, initialLocale, initialDesign, persist = true, children }) {
  const [locale, setLocale] = useState(initialLocale || data.defaultLocale || 'it');
  const [design, setDesignState] = useState(() => normalizeState(initialDesign || DEFAULT_STATE, designs));
  const [prefersDark, setPrefersDark] = useState(false);

  // Preferenze salvate e schema di sistema (solo client) / saved prefs & system scheme (client only)
  useEffect(() => {
    const saved = persist ? readStore() : null;
    if (saved) setDesignState(normalizeState(saved, designs));
    const mq = matchMedia('(prefers-color-scheme: dark)');
    setPrefersDark(mq.matches);
    const on = (e) => setPrefersDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [designs, persist]);

  const result = useMemo(() => computeDesign(designs, design, { prefersDark }), [designs, design, prefersDark]);

  // Applica i token su <html> / apply tokens on <html>
  useIsoLayoutEffect(() => {
    const root = document.documentElement;
    Object.entries(result.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    Object.entries(result.attrs).forEach(([k, v]) => root.setAttribute(k, v));
    root.style.colorScheme = result.scheme;
    root.lang = locale;
  }, [result, locale]);

  const setDesign = useCallback((patch) => {
    setDesignState((prev) => {
      const p = typeof patch === 'string' ? { design: patch, glass: null } : patch;
      const next = normalizeState({ ...prev, ...p }, designs);
      if (persist) writeStore(next);
      return next;
    });
  }, [designs, persist]);

  const value = useMemo(() => {
    const t = createTranslator(locale, data.defaultLocale);
    return {
      data, designs, locale, setLocale, t,
      ui: (k) => t(data.ui?.[k]) || k,
      design, setDesign, result,
      resetDesign: () => setDesign({ ...DEFAULT_STATE, design: designs.default }),
      exportTokens: () => exportTokens(result)
    };
  }, [data, designs, locale, design, setDesign, result]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export const useStudio = () => {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio deve essere usato dentro <StudioProvider>');
  return ctx;
};
