/**
 * primitives.jsx — Icone e illustrazioni condivise (stesse sorgenti SVG del sito HTML).
 * Shared icons & illustrations (same SVG sources as the HTML site).
 * Le stringhe SVG sono statiche e interne → dangerouslySetInnerHTML è sicuro qui.
 */
import { icon } from '../../src/js/render/icons.js';
import { illustration } from '../../src/js/render/illustrations.js';
import { safeUrl } from '../../src/js/core/html.js';

export const Icon = ({ name, size = 24, label }) => (
  <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: icon(name, { size, label }).toString() }} />
);

export const Illustration = ({ name, alt }) => (
  <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: illustration(name, alt).toString() }} />
);

/** Foto da CMS o illustrazione SVG. CMS photo or SVG illustration. */
export function Media({ item, fallback, t }) {
  if (item.image?.src) {
    return <img src={safeUrl(item.image.src)} alt={t(item.image.alt)} width={item.image.width || 960} height={item.image.height || 720} loading={item.image.eager ? 'eager' : 'lazy'} decoding="async" />;
  }
  return <Illustration name={item.illustration || fallback} alt={t(item.illustrationAlt) || undefined} />;
}

export { safeUrl };
