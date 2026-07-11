/**
 * Shared caret-relative parser for an in-progress `{{ref` merge token being
 * typed — used by BOTH the Canvas's contentEditable rich-text editor
 * (`Canvas.tsx`'s `EditableHtml`) and the Inspector's plain-text token fields
 * (Subject/Preview text/Button label, `Inspector.tsx`'s `TokenTextField`), so
 * "what counts as an open, still-being-typed token" is defined exactly once.
 * Pure string logic, no DOM — each caller supplies its own notion of "the
 * text" and "the caret".
 */
export interface TokenMatch {
  /** Offset of the opening `{{` within the source string. */
  start: number;
  /** Text typed so far between `{{` and the caret — the filter query. */
  query: string;
}

const MAX_QUERY_LENGTH = 60;

/** `undefined` unless the caret sits inside an OPEN `{{…` not yet closed by
 *  `}}`, with no newline/brace inside the partial query — a closed token, or
 *  one abandoned mid-typing, isn't "in progress" anymore. */
export function matchTokenQuery(text: string, caret: number): TokenMatch | undefined {
  const braceIndex = text.lastIndexOf("{{", caret - 1);
  if (braceIndex === -1) return undefined;
  const between = text.slice(braceIndex + 2, caret);
  if (between.length > MAX_QUERY_LENGTH || /[\n{}]/.test(between)) return undefined;
  return { start: braceIndex, query: between };
}

/** Case-insensitive filter over flattened `{value,label}` options, matching
 *  either side (a user typing "price" should find `product.price`). */
export function filterTokenOptions<T extends { value: string; label: string }>(options: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...options];
  return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
}
