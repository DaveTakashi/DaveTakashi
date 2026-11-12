/**
 * Esempio d'uso (Vite / Next.js App Router con 'use client').
 * Usage example (Vite / Next.js App Router with 'use client').
 */
'use client';
import { StudioProvider, SiteRenderer, DesignStyleWidget } from '../src/index.js';
import site from '../../data/site.json';
import designs from '../../data/designs.json';

export default function App({ cmsData }) {
  // cmsData: contenuti dal CMS (stesso schema di data/site.json). CMS content, same schema.
  return (
    <StudioProvider data={cmsData || site} designs={designs} initialLocale="it">
      <SiteRenderer
        components={{
          // Esempio: sezione personalizzata dal CMS / custom CMS section
          // team: ({ s }) => <section id={s.id}>…</section>
        }}
      />
      <DesignStyleWidget />
    </StudioProvider>
  );
}
