# Studio Dall'Asta — Documentazione frontend (Italiano)

> Versione 1.0.0 · MVP HTML completo, data-driven, multi-design, accessibile (WCAG 2.2 AA), pronto per CMS e React.
> 🇬🇧 English version: [EN-DOCUMENTATION.md](./EN-DOCUMENTATION.md)

---

## Indice

1. [Panoramica](#1-panoramica)
2. [Avvio rapido](#2-avvio-rapido)
3. [Struttura delle cartelle](#3-struttura-delle-cartelle)
4. [Architettura: come è costruito il frontend](#4-architettura-come-è-costruito-il-frontend)
5. [Dati dinamici e iniezione](#5-dati-dinamici-e-iniezione)
6. [Schema dei contenuti](#6-schema-dei-contenuti)
7. [Design system: token, preset e opzioni](#7-design-system-token-preset-e-opzioni)
8. [Il widget "Stile grafico"](#8-il-widget-stile-grafico)
9. [Immagini e illustrazioni](#9-immagini-e-illustrazioni)
10. [Multilingua (IT/EN)](#10-multilingua-iten)
11. [Accessibilità WCAG 2.2 AA](#11-accessibilità-wcag-22-aa)
12. [Prestazioni](#12-prestazioni)
13. [Sicurezza e privacy (GDPR)](#13-sicurezza-e-privacy-gdpr)
14. [Integrazione con un CMS](#14-integrazione-con-un-cms)
15. [Integrazione React / Next.js](#15-integrazione-react--nextjs)
16. [API JavaScript pubblica](#16-api-javascript-pubblica)
17. [Estendere: nuovi design, sezioni, icone](#17-estendere-nuovi-design-sezioni-icone)
18. [Test e qualità](#18-test-e-qualità)
19. [Pubblicazione](#19-pubblicazione)
20. [Dati segnaposto da sostituire](#20-dati-segnaposto-da-sostituire)
21. [Glossario](#21-glossario)

---

## 1. Panoramica

Il frontend del sito **studiodallasta.it** è progettato su tre principi:

| Principio | Cosa significa in pratica |
|---|---|
| **Separazione totale** | Contenuti (`data/site.json`), aspetto (`data/designs.json` + CSS a token) e logica (`src/js`) sono indipendenti. Si cambia uno senza toccare gli altri. |
| **Agnostico** | Nessun framework obbligatorio. Lo stesso motore gira nel browser, in Node (prerender/SSR) e dentro React. Qualsiasi CMS (WordPress, Strapi, Sanity, Directus, Contentful, un CMS proprietario) può fornire i dati. |
| **Qualità professionale** | Accessibilità WCAG 2.2 AA verificata con axe-core su tutti i design, zero dipendenze runtime, ~40 KB gzip per l'intera pagina. |

**Caratteristiche principali**

- 5 design pronti (**Vetro**, **Editoriale**, **Terra**, **Ardesia**, **Alto contrasto**), ognuno in modalità chiara e scura.
- Opzioni di design combinabili: modalità colore, colore d'accento (con **correzione automatica del contrasto**), trasparenza, angoli, spaziatura, dimensione testo, riduzione animazioni.
- Widget **"Stile grafico / Design style"** per cambiare stile in tempo reale ed **esportare i token** in JSON.
- 10 tipi di sezione ordinabili dal CMS (hero, numeri, servizi, metodo, settori, studio, approfondimenti, FAQ, call-to-action, contatti).
- Illustrazioni SVG originali che **si ricolorano da sole** in base al design.
- Contenuti bilingue (italiano prima, inglese), con URL dedicati per la SEO.

---

## 2. Avvio rapido

Requisiti: **Node.js ≥ 18** (solo per sviluppo e build; il sito pubblicato non richiede Node).

```bash
cd studiodallasta
npm run dev        # server di sviluppo → http://localhost:5173
npm run build      # genera dist/ (HTML statico prerenderizzato, IT + EN)
npm run preview    # serve dist/ → http://localhost:5173
npm test           # test: contrasto, XSS, traduzioni, integrità dati
```

> Non serve `npm install`: il progetto non ha dipendenze.
> `dist/index.html` funziona anche aperto direttamente con doppio clic (file://).

---

## 3. Struttura delle cartelle

```
studiodallasta/
├── index.html                  Pagina di sviluppo (carica moduli ES + JSON via fetch)
├── package.json                Script npm (nessuna dipendenza)
├── data/
│   ├── site.json               ★ CONTENUTI (IT/EN) — è ciò che il CMS fornisce
│   ├── designs.json            ★ PRESET DI DESIGN (colori, forma, tipografia)
│   └── site.schema.json        JSON Schema per validare i contenuti nel CMS
├── src/
│   ├── css/
│   │   ├── tokens.css          Valori di default delle variabili CSS
│   │   ├── base.css            Reset, tipografia, layout, accessibilità
│   │   ├── components.css      Componenti (solo var(--token), nessun colore fisso)
│   │   └── widget.css          Widget "Stile grafico"
│   └── js/
│       ├── core/
│       │   ├── html.js         Template engine sicuro (escape automatico)
│       │   ├── i18n.js         Traduzioni e date localizzate
│       │   ├── color.js        Contrasto WCAG, miscelazione colori
│       │   └── data.js         Caricamento dati (injection/inline/fetch), storage sicuro
│       ├── design/
│       │   ├── engine.js       ★ Motore di design: preset + opzioni → variabili CSS
│       │   └── widget.js       Widget accessibile
│       ├── render/
│       │   ├── icons.js        Set di icone SVG
│       │   ├── illustrations.js Illustrazioni SVG tematizzate
│       │   ├── sections.js     ★ Registro delle sezioni
│       │   └── layout.js       Header, footer, composizione pagina
│       └── app.js              Avvio, API pubblica, comportamenti progressivi
├── react/                      Adattatore React (stessi CSS, stesso motore)
│   ├── src/  StudioProvider · SiteRenderer · DesignStyleWidget · sections/
│   └── example/App.jsx
├── tools/
│   ├── build.mjs               Build statica + prerender + token CSS
│   ├── serve.mjs               Server di sviluppo
│   └── check.mjs               Test automatici
├── assets/img/favicon.svg
├── docs/                       Questa documentazione (IT + EN)
└── dist/                       Output di build (generato)
    ├── index.html              Italiano, tutto inline
    ├── en/index.html           Inglese
    └── tokens/*.css            Token per ogni design × schema
```

---

## 4. Architettura: come è costruito il frontend

### 4.1 Flusso complessivo

```
   ┌──────────────┐     ┌───────────────┐
   │ data/site.json│     │data/designs.json│     ← CMS / server / file statico
   └──────┬───────┘     └───────┬───────┘
          │ (injection | JSON inline | fetch)
          ▼                     ▼
   ┌──────────────┐     ┌──────────────────┐
   │  renderPage  │     │  computeDesign   │  ← funzioni PURE (browser, Node, React)
   │ (layout.js + │     │   (engine.js)    │
   │ sections.js) │     └────────┬─────────┘
   └──────┬───────┘              │ { vars, attrs }
          │ stringa HTML         ▼
          ▼               <html style="--c-accent:…" data-design="vetro" data-scheme="dark">
   <div id="app">…</div>          │
          │                       ▼
          └──────────► CSS a token (components.css usa solo var(--…))
                                  ▲
                    Widget "Stile grafico" → setDesign() → ricalcolo → nuove variabili
```

### 4.2 Le quattro scelte progettuali chiave

**1. Renderer isomorfo a stringhe.**
Le sezioni sono funzioni `(sezione, contesto) → HTML` scritte con un *tagged template* (`html\`...\``) che **applica l'escape a ogni valore interpolato**. La stessa funzione viene eseguita:
- nel browser (cambio lingua, dati aggiornati dal CMS);
- in Node durante `npm run build` (prerender → HTML completo per SEO e velocità);
- da qualunque backend (PHP, Python, .NET) che preferisca chiamare Node per l'SSR.

**2. Design come dati, non come CSS.**
Un design è un oggetto JSON (`designs.json`) con palette chiara/scura e parametri di forma. Il motore (`engine.js`) lo trasforma in **variabili CSS** applicate su `<html>`. Il CSS dei componenti non contiene colori: usa solo `var(--c-…)`. Risultato: aggiungere un design = aggiungere un oggetto JSON.

**3. Miglioramento progressivo.**
L'HTML prerenderizzato è completo e navigabile anche senza JavaScript. Il JS aggiunge: menu mobile, animazioni di comparsa, evidenziazione della voce di menu attiva, validazione del form, widget di stile. Le animazioni non nascondono mai contenuti già visibili e si disattivano con `prefers-reduced-motion`.

**4. Nessuna dipendenza.**
Niente framework, niente bundler obbligatorio. Il build (`tools/build.mjs`, ~150 righe) concatena i moduli, minifica, prerenderizza e mette tutto inline: **una sola richiesta HTTP**.

### 4.3 Ciclo di avvio (`app.js`)

1. **Pittura anticipata**: se i design sono già nel `<head>`, il motore applica subito le variabili salvate dall'utente → nessun "lampeggio" di stile.
2. **Caricamento design** → normalizzazione dello stato salvato → `applyDesign()`.
3. **Caricamento contenuti** (vedi §5).
4. **Scelta lingua**: `?lang=` → lingua prerenderizzata → preferenza salvata → `<html lang>` → default.
5. **Render** (saltato se la pagina è già prerenderizzata nella stessa lingua: zero layout shift).
6. **Enhancement**: menu, reveal, scroll-spy, form.
7. **Montaggio widget** e evento `studio:ready`.

### 4.4 Tipografia

Per rispetto del GDPR e per le prestazioni **non vengono caricati font da Google**. Le famiglie dichiarate sono `Inter`/`Inter Tight` (se installate o self-hosted) con fallback su `Segoe UI Variable` (Windows 11), `system-ui` e San Francisco (Apple). Il design *Editoriale* usa `Fraunces` → `Iowan Old Style` → `Palatino` → `Georgia`.
Per usare un font proprietario: copiare i file `.woff2` in `assets/fonts/`, aggiungere `@font-face` in `tokens.css` e indicarne il nome in `designs.json → base.fontSans/fontDisplay`.

---

## 5. Dati dinamici e iniezione

Il sito accetta i contenuti da **tre canali**, in ordine di priorità. Il primo che risponde vince.

| # | Canale | Quando usarlo | Esempio |
|---|---|---|---|
| 1 | **Variabile globale** `window.__STUDIO_DATA__` | Il server/CMS stampa i dati nella pagina (WordPress, PHP, Django, .NET) | `<script>window.__STUDIO_DATA__ = <?= json_encode($data) ?>;</script>` |
| 2 | **JSON inline** `<script type="application/json" id="studio-data">` | Build statica, cache CDN, nessuna richiesta extra | generato da `npm run build` |
| 3 | **Fetch** dall'attributo `data-src` di `#app` | CMS headless con API REST | `<div id="app" data-src="https://cms.esempio.it/api/site?lang=it">` |

Lo stesso vale per i design: `window.__STUDIO_DESIGNS__`, `#studio-designs`, `data-designs-src`.

**Aggiornare i dati a pagina aperta** (es. anteprima live del CMS):

```js
StudioUI.setData(nuoviDati);                         // sostituisce tutto
StudioUI.setData({ contact: { phone: '+39 …' } }, { merge: true }); // merge profondo
```

**Esempio WordPress (PHP):**

```php
<script>
  window.__STUDIO_DATA__ = <?php echo wp_json_encode( studio_build_site_data() ); ?>;
</script>
<div id="app"></div>
<script type="module" src="<?php echo get_theme_file_uri('src/js/app.js'); ?>"></script>
```

---

## 6. Schema dei contenuti

Lo schema formale è in `data/site.schema.json` (JSON Schema 2020-12): importarlo nel CMS per validare i contenuti.

### 6.1 Campo multilingua

Ogni testo può essere:

```json
"title": "Uguale in tutte le lingue"
"title": { "it": "Titolo italiano", "en": "English title" }
```

Se manca la lingua richiesta si usa la lingua di default (`defaultLocale`).

### 6.2 Radice

| Chiave | Tipo | Descrizione |
|---|---|---|
| `locales` | `string[]` | Lingue attive, es. `["it","en"]` |
| `defaultLocale` | `string` | Lingua principale (`"it"`) |
| `meta` | oggetto | `url`, `title`, `description` (SEO) |
| `brand` | oggetto | `name`, `monogram` (max 3 lettere), `tagline` |
| `ui` | oggetto | Stringhe d'interfaccia (menu, form, widget…) |
| `navigation` | `link[]` | Voci di menu `{ label, href }` |
| `headerCta` | `link` | Pulsante nell'header |
| `sections` | `section[]` | **Le sezioni, nell'ordine di visualizzazione** |
| `contact` | oggetto | `email`, `pec`, `phone`, `address`, `hours` |
| `footer` | oggetto | `legal`, `links` |

### 6.3 Sezioni

Ogni sezione ha `type` (obbligatorio), `id` (ancora, obbligatorio), `hidden` (opzionale, nasconde senza cancellare).

| `type` | Campi specifici |
|---|---|
| `hero` | `eyebrow`, `title`, `highlight` (parola evidenziata), `lead`, `actions[]` (`variant`: `primary`/`ghost`), `badges[] {icon,text}`, `illustration` o `image` |
| `stats` | `label` (per screen reader), `items[] {value,label}` |
| `services` | `eyebrow`, `title`, `lead`, `groups[] {id, tab, title, intro, illustration/image, items[] {icon,title,text}}` |
| `method` | `steps[] {title,text}` |
| `sectors` | `items[] {icon,title}` |
| `about` | `text[]` (paragrafi), `values[] {icon,text}`, `illustration`/`image` |
| `insights` | `items[] {date (ISO), tag, title, href}` |
| `faq` | `items[] {q, a}` |
| `cta` | `title`, `text`, `action {label, href}` |
| `contact` | `form {endpoint, mailto, fields{…}, orgOptions[], privacyHref}` |

**Riordinare** le sezioni = riordinare l'array. **Duplicare** una sezione = copiarla con un nuovo `id`.

---

## 7. Design system: token, preset e opzioni

### 7.1 Token (variabili CSS)

| Token | Ruolo |
|---|---|
| `--c-bg`, `--c-bg-2` | Sfondo pagina e gradiente |
| `--c-orb-1/2/3` | Colori delle sfere luminose decorative |
| `--c-surface` | Superficie in **vetro** (rgba calcolato dalla trasparenza) |
| `--c-surface-solid` / `--c-surface-raised` | Superficie opaca / semi-opaca (card, campi) |
| `--c-border` | Bordi sottili |
| `--c-text`, `--c-text-muted` | Testo principale e secondario |
| `--c-accent`, `--c-accent-contrast`, `--c-accent-soft` | Colore del brand, testo sopra di esso, tinta leggera |
| `--c-focus` | Anello del focus da tastiera |
| `--blur`, `--glass-saturate` | Intensità del vetro smerigliato |
| `--radius`, `--radius-sm`, `--radius-lg` | Arrotondamenti |
| `--density` | Moltiplicatore di spaziatura (0.8 / 1 / 1.25) |
| `--text-scale` | Moltiplicatore della dimensione testo |
| `--font-sans`, `--font-display`, `--display-weight`, `--display-tracking` | Tipografia |
| `--shadow`, `--border-width`, `--focus-width`, `--orb-opacity` | Materiale |

### 7.2 Struttura di un preset (`designs.json`)

```json
{
  "id": "terra",
  "label": { "it": "Terra", "en": "Earth" },
  "description": { "it": "Calore, materia e umanità", "en": "…" },
  "shape": { "radius": 22, "glass": 38 },
  "colors": {
    "light": { "bg": "#FBF6F0", "surface": "#FFFDF9", "text": "#2A1C14", "accent": "#9A3A1C", "…": "…" },
    "dark":  { "bg": "#16100C", "…": "…" }
  }
}
```

`shape` eredita da `base` tutto ciò che non specifica. Parametri di forma disponibili: `fontSans`, `fontDisplay`, `displayWeight`, `displayTracking`, `radius`, `glass` (0–100), `blur`, `glassLocked`, `orbs`, `borderWidth`, `focusWidth`, `shadow`, `shadowDark`, `underlineLinks`.

### 7.3 Opzioni (stato del design)

```js
{
  design: 'vetro',          // id preset
  scheme: 'auto',           // auto | light | dark
  accent: null,             // '#RRGGBB' o null
  glass: null,              // 0–100 o null (= default del preset)
  radius: 'design',         // design | sharp | soft | round
  density: 'comfortable',   // compact | comfortable | airy
  textScale: 1,             // 1 | 1.125 | 1.25
  motion: 'auto'            // auto | reduce
}
```

### 7.4 Regole automatiche di accessibilità nel motore

- **Accento personalizzato**: se il colore scelto non raggiunge **4.5:1** sulla superficie, il motore lo scurisce/schiarisce progressivamente finché non lo raggiunge; il testo sopra l'accento diventa bianco o nero in base al contrasto migliore.
- **Trasparenza limitata**: l'opacità della superficie non scende mai sotto il ~38% per preservare la leggibilità.
- **Alto contrasto**: `glassLocked: true` disattiva completamente trasparenze e sfere; bordi da 2px e focus da 4px.
- `prefers-reduced-transparency` del sistema operativo forza superfici opache.

### 7.5 Token esportati

`npm run build` produce `dist/tokens/<design>.<schema>.css` pronti per essere importati in altri progetti. Il widget offre **"Esporta token"** che scarica il JSON dello stato corrente (utile per passare a un grafico la configurazione scelta, o per salvarla nel CMS come tema predefinito).

---

## 8. Il widget "Stile grafico"

Pulsante fluttuante in basso a destra → pannello non modale con:

| Controllo | Tipo nativo | Note a11y |
|---|---|---|
| Design | radio (card con anteprima) | `fieldset` + `legend` |
| Modalità colore | radio segmentato | Sistema / Chiara / Scura |
| Colore d'accento | radio + `input type="color"` | ogni pallino ha un nome per screen reader |
| Trasparenza | `input type="range"` + `output` | disabilitato con spiegazione in *Alto contrasto* |
| Angoli, Spaziatura, Testo | radio segmentati | target ≥ 40px |
| Riduci animazioni | checkbox a interruttore | |
| Ripristina / Esporta token | pulsanti | annuncio in `aria-live` |

Comportamento: apertura → focus sul titolo; **Esc** chiude e riporta il focus sul pulsante; clic esterno chiude. Le preferenze sono salvate in `localStorage` (chiave `studio:design`), solo sul dispositivo del visitatore.

**Disattivarlo in produzione** (se si vuole un solo stile): nel CSS `.ds { display:none }` oppure, nel codice, non chiamare `mountWidget()`. Il design predefinito si sceglie con `designs.json → default`.

---

## 9. Immagini e illustrazioni

Il sito include **4 illustrazioni SVG originali** (`hero`, `community`, `business`, `studio`) disegnate per questo progetto. Usano `var(--c-accent)`, `var(--c-orb-*)` ecc., quindi **cambiano colore automaticamente** con il design: nessuna immagine da rigenerare, peso trascurabile, nitide su qualsiasi schermo.

**Usare fotografie reali** (consigliato per la sezione "Lo Studio": ritratto professionale, ambiente dello studio):

```json
"image": { "src": "/media/studio.avif", "alt": { "it": "Lo studio a …", "en": "…" }, "width": 1200, "height": 900 }
```

Linee guida fotografiche per mantenere lo stile *minimal/trasparenza*:
- luce naturale, toni chiari e desaturati, molto spazio negativo;
- formati **AVIF/WebP**, larghezza max 1600px, < 200 KB;
- `alt` descrittivo in entrambe le lingue (vuoto solo se decorativa);
- `eager: true` solo per l'immagine dell'hero (LCP).

---

## 10. Multilingua (IT/EN)

- Italiano è la lingua principale (`defaultLocale: "it"`), inglese secondaria.
- **Build statica**: `/` (IT) e `/en/` (EN) con `hreflang`, `canonical`, `og:locale` → SEO corretta.
- **Sviluppo / CMS dinamico**: il selettore lingua cambia lingua al volo (`?lang=en`) senza ricaricare.
- `<html lang>`, `<title>`, meta description e link "salta al contenuto" vengono aggiornati.
- Date formattate con `Intl` (`28 ottobre 2026` / `28 October 2026`).
- Aggiungere una lingua: aggiungerla a `locales` e aggiungere la chiave in ogni campo testuale. `npm test` segnala le traduzioni mancanti.

---

## 11. Accessibilità WCAG 2.2 AA

Verificata con **axe-core 4.10** su tutti i 5 design (chiaro e scuro): **0 violazioni** (regole wcag2a, wcag2aa, wcag21a/aa, wcag22aa, best-practice). `npm test` verifica inoltre i rapporti di contrasto di ogni palette.

| Criterio WCAG | Implementazione |
|---|---|
| 1.1.1 Contenuti non testuali | SVG con `<title>` tradotto; icone decorative `aria-hidden` |
| 1.3.1 Info e relazioni | Landmark (`header`, `nav`, `main`, `footer`), titoli gerarchici, `dl` per i numeri, `fieldset/legend` |
| 1.4.3 Contrasto (minimo) | Testo ≥ 7:1, testo secondario ≥ 4.5:1, accento ≥ 4.5:1 (garantito anche per colori personalizzati) |
| 1.4.4 / 1.4.10 Ridimensionamento e reflow | Unità `rem`, layout fluido fino a 320px, nessuno scroll orizzontale; opzione testo 125% |
| 1.4.11 Contrasto non testuale | Bordi dei campi ≥ 3:1, focus ben visibile |
| 1.4.12 Spaziatura testo | Nessuna altezza fissa sui contenitori di testo |
| 2.1.1 Tastiera | Solo controlli nativi; menu, FAQ (`details`), widget e form utilizzabili da tastiera |
| 2.3.3 Animazioni da interazioni | `prefers-reduced-motion` + interruttore nel widget |
| 2.4.1 Salta blocchi | Link "Vai al contenuto principale" |
| 2.4.7 / 2.4.11 / 2.4.13 Focus | Anello 3px (4px in Alto contrasto), `scroll-padding-top` per non finire sotto l'header |
| 2.5.8 Dimensione target | Pulsanti e link interattivi ≥ 44px |
| 3.1.1 / 3.1.2 Lingua | `<html lang>` aggiornato; `lang` sui link di lingua |
| 3.3.1 / 3.3.3 Errori | Messaggi specifici collegati con `aria-describedby`, `aria-invalid`, riepilogo `role="alert"`, focus sul primo campo errato |
| 4.1.2 Nome, ruolo, valore | `aria-expanded`, `aria-controls`, `aria-current`, `role="dialog"` |
| 4.1.3 Messaggi di stato | `aria-live` per invio form e cambi di stile |

Supporto extra: `forced-colors` (Contrasto elevato di Windows 11), `prefers-reduced-transparency`, `prefers-color-scheme`.

> Ricordare di pubblicare la **Dichiarazione di accessibilità** (link già presente nel footer: `/accessibilita`).

---

## 12. Prestazioni

| Metrica | Valore |
|---|---|
| Richieste HTTP per la pagina | **1** (CSS, JS, dati, illustrazioni, favicon inline) |
| Peso pagina (gzip) | **~40 KB** |
| Dipendenze runtime | **0** |
| Font esterni | **0** |
| Rendering | HTML prerenderizzato → contenuto visibile al primo paint |

Tecniche: prerender, CSS critico = tutto il CSS (è piccolo), token precalcolati per evitare il flash di tema, `IntersectionObserver` invece di listener di scroll, listener `passive`, illustrazioni vettoriali, nessun layout shift (dimensioni esplicite, niente re-render se la lingua coincide).

---

## 13. Sicurezza e privacy (GDPR)

- **XSS**: il template engine applica l'escape a ogni valore; gli URL passano per `safeUrl()` che blocca `javascript:` e altri schemi pericolosi. Verificato da `npm test`. I dati dal CMS possono quindi essere considerati *non fidati* senza rischi.
- **JSON inline**: `<` viene codificato (`<`) per impedire la chiusura prematura dello `<script>`.
- **Content Security Policy** consigliata (build con script inline):
  `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.vostro-cms.it`
  Per una CSP senza `unsafe-inline` usare la versione modulare (`index.html` + file separati) con `script-src 'self'`.
- **Privacy**: nessun cookie, nessun tracker, nessun font o CDN di terze parti. `localStorage` conserva solo preferenze tecniche (stile e lingua) → non richiede banner di consenso. Se si aggiungono analytics, adeguare l'informativa cookie.
- **Form**: senza `endpoint` apre il client di posta (`mailto`); con `endpoint` invia JSON via POST. Il checkbox privacy è obbligatorio.

---

## 14. Integrazione con un CMS

### 14.1 Modello di contenuto consigliato

| Tipo nel CMS | Corrisponde a |
|---|---|
| *Impostazioni sito* (singleton) | `meta`, `brand`, `contact`, `footer`, `navigation`, `headerCta`, `ui` |
| *Pagina* con campo "blocchi" (dynamic zone / flexible content) | `sections[]` — un blocco per ogni `type` |
| *Tema* (singleton, opzionale) | `designs.json` o solo `default` + override di colori |

Campi localizzati: abilitare la localizzazione nativa del CMS e, nell'endpoint, ricostruire gli oggetti `{ it, en }`, **oppure** esporre una lingua alla volta (stringhe semplici) e chiamare l'endpoint con `?lang=`.

### 14.2 Tre modalità di integrazione

1. **HTML statico generato**: il CMS (o una pipeline CI) salva `data/site.json` e lancia `npm run build`; si pubblica `dist/`. Massime prestazioni.
2. **Template server-side**: il tema del CMS stampa `window.__STUDIO_DATA__` e carica `src/js/app.js` + i 4 CSS. Rendering lato client.
3. **Headless + React/Next.js**: vedi §15.

### 14.3 Anteprima live nel CMS

```js
// nell'iframe di anteprima
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://cms.vostro-dominio.it') return;
  StudioUI.setData(e.data.site, { merge: true });
});
```

---

## 15. Integrazione React / Next.js

La cartella `react/` contiene un adattatore che **riusa lo stesso motore e gli stessi CSS**: il risultato è identico al sito HTML.

```jsx
import { StudioProvider, SiteRenderer, DesignStyleWidget } from './react/src/index.js';
import site from './data/site.json';
import designs from './data/designs.json';

export default function App() {
  return (
    <StudioProvider data={site} designs={designs} initialLocale="it">
      <SiteRenderer />
      <DesignStyleWidget />
    </StudioProvider>
  );
}
```

| Componente | Ruolo |
|---|---|
| `StudioProvider` | Contesto: dati, lingua, stato design; applica i token su `<html>` |
| `useStudio()` | Hook: `t`, `ui`, `locale`, `setLocale`, `design`, `setDesign`, `exportTokens` |
| `SiteRenderer` | Header + sezioni (mappa `type → componente`) + footer. Prop `components` per sezioni custom |
| `DesignStyleWidget` | Widget in React (stesso markup/a11y) |
| `SECTIONS` | Mappa dei componenti di sezione, estendibile |

**Next.js (App Router)**: i componenti usano hook → importarli in un file con `'use client'`; i dati possono arrivare da un Server Component (`fetch` al CMS) e passati come prop `data`. Il render server funziona (testato con `renderToString` React 18).
**Vite**: importare `react/src/index.js`; i CSS sono già importati dall'indice.

---

## 16. API JavaScript pubblica

Disponibile come `window.StudioUI` (e come export di default di `app.js`).

| Metodo | Descrizione |
|---|---|
| `setData(dati, { merge })` | Sostituisce o unisce i contenuti e ri-renderizza |
| `getData()` | Contenuti correnti |
| `setLocale('it' \| 'en')` / `getLocale()` | Lingua |
| `setDesign('terra')` / `setDesign({ scheme:'dark', glass:70 })` | Cambia preset o opzioni |
| `getDesignState()` / `resetDesign()` | Stato design / ripristino |
| `registerDesign(def)` | Aggiunge un preset a runtime |
| `registerSection(type, fn)` | Aggiunge un tipo di sezione |
| `exportTokens()` | JSON dei token correnti |
| `openDesignWidget()` | Apre il pannello |
| `on(evento, fn)` | `ready`, `render`, `designchange`, `localechange`, `formsubmit` |

Gli stessi eventi sono emessi sul `document` come `studio:<nome>` (`CustomEvent`).

```js
StudioUI.on('designchange', ({ state, tokens }) => console.log(state.design, tokens['--c-accent']));
```

---

## 17. Estendere: nuovi design, sezioni, icone

### Nuovo design
Aggiungere un oggetto in `designs.json → designs[]` (o `StudioUI.registerDesign(def)`). Lanciare `npm test`: verifica automaticamente i contrasti.

### Nuova sezione
```js
import { registerSection } from './render/sections.js';
import { html } from './core/html.js';

registerSection('team', (s, { t }) => html`
  <section class="section" id="${s.id}" aria-labelledby="${s.id}-title">
    <div class="container">
      <h2 class="h2" id="${s.id}-title">${t(s.title)}</h2>
      <ul class="cards" role="list">
        ${s.people.map((p) => html`<li class="card"><h3 class="card__title">${p.name}</h3><p class="card__text">${t(p.role)}</p></li>`)}
      </ul>
    </div>
  </section>`);
```
Poi nel JSON: `{ "type": "team", "id": "team", "title": {...}, "people": [...] }`. In React: `<SiteRenderer components={{ team: TeamSection }} />`.

### Nuova icona
Aggiungere il path SVG (24×24, stroke) all'oggetto `P` in `src/js/render/icons.js`.

### Nuova illustrazione
`registerIllustration('nome', (alt) => '<svg …>')` in `illustrations.js`, usando `var(--c-…)` per i colori.

---

## 18. Test e qualità

`npm test` (102 verifiche, zero dipendenze):
1. contrasto di ogni palette × schema (testo, secondario, accento, testo su accento, tinte);
2. correzione automatica di accenti non conformi;
3. resistenza XSS (tag e `javascript:` iniettati);
4. completezza delle traduzioni;
5. integrità: id unici, ancore valide, icone esistenti;
6. rendering in ogni lingua con un solo `<h1>` e `<main>`.

Verifiche aggiuntive eseguite durante lo sviluppo: axe-core su 7 combinazioni design/schema, assenza di errori console, nessuno scroll orizzontale a 390px, focus del widget e del form, render SSR React.

---

## 19. Pubblicazione

1. `npm test && npm run build`
2. Caricare il contenuto di `dist/` sulla root del dominio (qualsiasi hosting statico: Netlify, Cloudflare Pages, Vercel, Apache/Nginx).
3. Header consigliati: `Content-Encoding: br/gzip`, `Cache-Control: no-cache` per l'HTML, CSP (§13), `Strict-Transport-Security`.
4. Aggiungere `robots.txt` e `sitemap.xml` con `/` e `/en/`.
5. Creare le pagine `/privacy`, `/cookie`, `/accessibilita` (linkate nel footer).

---

## 20. Dati segnaposto da sostituire

Prima della pubblicazione aggiornare in `data/site.json`:

| Campo | Valore attuale (segnaposto) |
|---|---|
| `contact.phone` | `+39 000 000 0000` |
| `contact.address` | `Via Esempio 1, 00000 Città (XX)` |
| `contact.pec` | `studiodallasta@pec.it` |
| `contact.email`, `form.mailto` | `info@studiodallasta.it` (verificare) |
| `footer.legal` | `P.IVA 00000000000` |
| `sections[stats].items` | valori indicativi (2 aree, 24h, 100% digitale): confermare |
| `sections[hero].badges` | "Iscritti all'Albo ODCEC": confermare l'iscrizione e l'Ordine territoriale |
| `sections[insights].items` | articoli d'esempio con `href: "#"` |
| `contact.hours` | orari d'esempio |
| `brand.tagline` | "Dottori Commercialisti" (singolare se professionista unico) |

È consigliato indicare anche Ordine di appartenenza e numero d'iscrizione nel footer (obbligo informativo per i professionisti).

---

## 21. Glossario

- **Token**: variabile di design (colore, raggio, spaziatura) espressa come variabile CSS.
- **Preset / design**: insieme coerente di token (es. *Vetro*).
- **Opzione**: modifica applicata sopra il preset (es. trasparenza 70%).
- **Prerender**: generazione dell'HTML finale durante il build, prima che l'utente apra la pagina.
- **Injection**: fornitura dei dati da parte del server/CMS direttamente nella pagina.
- **Isomorfo**: codice che gira identico nel browser e sul server.
- **ETS / RUNTS**: Ente del Terzo Settore / Registro Unico Nazionale del Terzo Settore.
