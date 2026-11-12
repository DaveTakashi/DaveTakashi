# Studio Dall'Asta — Frontend

**🇮🇹** Sito per lo studio commercialista *studiodallasta.it*, specializzato in **Terzo Settore** e **gestione aziendale**.
MVP HTML completo: dati dinamici iniettabili da qualsiasi CMS, 5 design + opzioni combinabili con widget **"Stile grafico"**, trasparenze (glassmorphism), accessibilità **WCAG 2.2 AA**, pronto per l'import in un CMS custom in **React** o **HTML**. Zero dipendenze, ~40 KB gzip.

**🇬🇧** Website for the accounting firm *studiodallasta.it* (Third Sector & business management). Complete HTML MVP: CMS-injectable dynamic data, 5 designs + combinable options via a **"Design style"** widget, glass transparency, **WCAG 2.2 AA**, ready to import into a custom **React** or **HTML** CMS. Zero dependencies, ~40 KB gzipped.

```bash
npm run dev      # http://localhost:5173
npm run build    # dist/index.html (IT) · dist/en/index.html (EN) · dist/tokens/
npm test         # contrasto WCAG, XSS, traduzioni / WCAG contrast, XSS, i18n
```

| | |
|---|---|
| 📘 Documentazione (IT) | [docs/IT-DOCUMENTAZIONE.md](docs/IT-DOCUMENTAZIONE.md) |
| 📗 Documentation (EN) | [docs/EN-DOCUMENTATION.md](docs/EN-DOCUMENTATION.md) |
| ✏️ Contenuti / Content | [data/site.json](data/site.json) · schema [data/site.schema.json](data/site.schema.json) |
| 🎨 Design | [data/designs.json](data/designs.json) |
| ⚛️ React | [react/](react/) · esempio [react/example/App.jsx](react/example/App.jsx) |

> ⚠️ Prima di pubblicare sostituire i dati segnaposto (telefono, indirizzo, P.IVA…): vedi §20 della documentazione.
