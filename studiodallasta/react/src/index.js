/**
 * Punto d'ingresso del pacchetto React. React package entry point.
 *
 *   import '@studio/frontend/styles';        // oppure i 4 CSS di src/css
 *   import { StudioProvider, SiteRenderer, DesignStyleWidget } from '@studio/frontend/react';
 */
import '../../src/css/tokens.css';
import '../../src/css/base.css';
import '../../src/css/components.css';
import '../../src/css/widget.css';

export { StudioProvider, useStudio } from './StudioProvider.jsx';
export { SiteRenderer, Header, Footer } from './SiteRenderer.jsx';
export { DesignStyleWidget } from './DesignStyleWidget.jsx';
export { SECTIONS } from './sections/index.jsx';
export { Icon, Illustration, Media } from './primitives.jsx';
export { computeDesign, exportTokens, normalizeState } from '../../src/js/design/engine.js';
