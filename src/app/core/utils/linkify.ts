/** Morceau de texte : texte brut ou lien. */
export type TextSegment = { type: 'text'; value: string } | { type: 'link'; value: string; href: string };

// http(s)://… ou www.… jusqu'au prochain espace ou chevron
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi;
// Ponctuation de fin de phrase, non incluse dans le lien (« voir https://x.fr. »)
const TRAILING = /[.,;:!?'"»)\]}]+$/;

/**
 * Découpe un texte en segments texte / lien. Rendu avec @for (pas d'innerHTML) : aucun risque d'injection HTML.
 * Une parenthèse fermante est gardée si le lien en contient une ouvrante (ex. Wikipédia).
 */
export function linkify(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    let url = match[0];
    const trailing = url.match(TRAILING)?.[0] ?? '';
    url = url.slice(0, url.length - trailing.length);
    if (trailing.startsWith(')') && url.includes('(')) {
      url += ')';
    }
    if (!url) {
      continue;
    }
    const start = match.index!;
    if (start > last) {
      segments.push({ type: 'text', value: text.slice(last, start) });
    }
    segments.push({ type: 'link', value: url, href: url.toLowerCase().startsWith('www.') ? `https://${url}` : url });
    last = start + url.length;
  }
  if (last < text.length) {
    segments.push({ type: 'text', value: text.slice(last) });
  }
  return segments;
}

/** Premier lien du texte (aperçu affiché sous un message), ou null. */
export function firstLink(text: string): string | null {
  const link = linkify(text).find((s) => s.type === 'link');
  return link?.type === 'link' ? link.href : null;
}
