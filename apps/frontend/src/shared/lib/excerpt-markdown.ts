/**
 * Strips markdown down to plain text and truncates it — for teaser/preview spots (e.g. the
 * homepage About section) where the full rich rendering (badges, headings, images) would just
 * look like noise. The full content still gets proper MarkdownContent rendering on its own page.
 */
export function excerptMarkdown(markdown: string, maxLength = 220): string {
  const plain = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> link text
    .replace(/(^|\s)#{1,6}(?=\s|$)/g, "$1") // headings — not line-anchored, source may have no real newlines
    .replace(/(^|\s)[-*_]{3,}(?=\s|$)/g, "$1") // horizontal rules, same reasoning
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // inline/fenced code
    .replace(/[*_~]/g, "") // emphasis markers
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;

  const truncated = plain.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}
