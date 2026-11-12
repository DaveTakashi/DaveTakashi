/**
 * data.js — Caricamento dati agnostico (injection, JSON inline, fetch).
 * System-agnostic data loading (injection, inline JSON, fetch).
 *
 * Ordine di priorità / Priority order:
 *   1. window[globalName]                  ← iniettato dal server/CMS (SSR, PHP, Node…)
 *   2. <script type="application/json" id> ← JSON inline nella pagina
 *   3. fetch(url)                          ← endpoint REST / headless CMS / file statico
 *   4. fallback                            ← oggetto vuoto sicuro
 */

export async function resolveSource({ globalName, scriptId, url, fallback = null }) {
  const g = typeof window !== 'undefined' ? window : {};

  // 1. Injection globale / global injection
  if (g[globalName] && typeof g[globalName] === 'object') return g[globalName];

  // 2. JSON inline
  if (typeof document !== 'undefined' && scriptId) {
    const el = document.getElementById(scriptId);
    if (el && el.textContent.trim()) {
      try { return JSON.parse(el.textContent); } catch (e) { console.warn(`[studio] JSON non valido in #${scriptId}`, e); }
    }
  }

  // 3. Fetch remoto / remote fetch
  if (url) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
      if (res.ok) return await res.json();
      console.warn(`[studio] ${url} → HTTP ${res.status}`);
    } catch (e) {
      console.warn(`[studio] impossibile caricare ${url}`, e);
    }
  }
  return fallback;
}

/** Merge profondo non distruttivo (oggetti), gli array vengono sostituiti. Deep merge; arrays replace. */
export function deepMerge(base, patch) {
  if (Array.isArray(patch) || typeof patch !== 'object' || patch === null) return patch;
  const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(out[k], v) : v;
  }
  return out;
}

/** Storage sicuro (modalità privata, iframe sandbox…). Safe storage wrapper. */
export const storage = {
  get(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignorato / ignored */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* ignorato */ }
  }
};
