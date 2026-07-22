/**
 * Detecting classes with NO backing CSS — surfacing the "silent drop".
 *
 * The canvas renders schema (DB data) at runtime, which Tailwind never scans, so
 * a class the user types into the raw class field (or that arrives in imported
 * data) can have no CSS behind it — it renders *nothing*, with no signal. That
 * silent no-op is the real papercut behind "my responsive class did nothing".
 *
 * This reads what CSS the document ACTUALLY has (all readable stylesheets, incl.
 * rules nested in `@media`/`@container`/`@supports`/`@layer`) and reports which of
 * a node's class tokens match no rule. It's a best-effort signal, deliberately
 * conservative: if no stylesheet is readable at all, it reports nothing rather
 * than cry wolf.
 */

/** Strip CSS escapes: `w-1\/2` → `w-1/2`, `\@2xl\:grid-cols-4` → `@2xl:grid-cols-4`. */
function unescapeClass(s: string): string {
  return s.replace(/\\(.)/g, "$1");
}

// The compiled selector set is stable for a given stylesheet count (DB classes
// are never scanned into new rules), so cache it and rebuild only when a sheet is
// added/removed (e.g. the color cascade injecting a scoped <style>).
let cache: { count: number; set: Set<string> } | null = null;

/** Every class NAME that appears in any readable rule's selector, unescaped. */
function selectorClassSet(doc: Document): Set<string> {
  const count = doc.styleSheets.length;
  if (cache && cache.count === count) return cache.set;

  const set = new Set<string>();
  const CLASS_RE = /\.((?:\\.|[\w-])+)/g;
  const visit = (rules: CSSRuleList): void => {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i] as (CSSStyleRule & { cssRules?: CSSRuleList }) | undefined;
      if (!rule) continue;
      if (typeof rule.selectorText === "string") {
        for (const m of rule.selectorText.matchAll(CLASS_RE)) {
          const name = m[1];
          if (name) set.add(unescapeClass(name));
        }
      }
      // @media / @container / @supports / @layer group rules carry nested rules.
      if (rule.cssRules) visit(rule.cssRules);
    }
  };
  for (let i = 0; i < doc.styleSheets.length; i++) {
    const sheet = doc.styleSheets[i];
    if (!sheet) continue;
    try {
      visit(sheet.cssRules);
    } catch {
      // Cross-origin stylesheet — cssRules throws a SecurityError; skip it.
    }
  }
  cache = { count, set };
  return set;
}

/**
 * The class tokens in `cls` that no CSS rule backs — i.e. they paint nothing.
 * Empty when every class resolves (the common case) OR when no stylesheet is
 * readable (we don't false-alarm when we simply can't see the CSS).
 *
 * @param cls the node's class string
 * @param doc the document whose stylesheets to check (defaults to `document`)
 */
export function unbackedClasses(cls: string, doc: Document | undefined = typeof document !== "undefined" ? document : undefined): string[] {
  if (!doc) return [];
  const tokens = cls.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const set = selectorClassSet(doc);
  if (set.size === 0) return []; // nothing readable — stay quiet
  return tokens.filter((t) => !set.has(t));
}
