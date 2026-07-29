/**
 * Per-breakpoint class-token surgery — the string layer under responsive
 * authoring (doc 139 §1).
 *
 * A semantic Inspector control owns a GROUP of mutually-exclusive classes
 * (`grid-cols-1 … grid-cols-4`) and needs to set exactly one of them AT a
 * breakpoint, leaving every other token — including the same group at every
 * OTHER breakpoint — untouched. `Editor.setClass` takes a whole replacement
 * string, so a host doing this from outside has to re-implement tokenizing,
 * prefix matching, and the mobile-first cascade, and get all three right.
 *
 * Pure functions over strings, kept out of the engine and out of React so they
 * can be tested directly: this is the part with the edge cases.
 *
 * CONTAINER QUERIES, NOT VIEWPORT ONES. The prefixes here are Tailwind v4
 * container variants (`@md:`), never `md:`. The canvas is an element whose width
 * the device toggle sets, so a container variant reflows honestly when the
 * author switches device; a viewport variant resolves against the browser
 * window and would keep the canvas quietly lying about what mobile looks like.
 */

/**
 * The breakpoint ladder, ASCENDING, with base first. Order is the contract:
 * resolution walks DOWN it to find what a breakpoint inherits, so a wrong order
 * produces a plausible-looking wrong answer rather than an error.
 */
export const BREAKPOINT_ORDER: readonly string[] = [
  "",
  "@xs:",
  "@sm:",
  "@md:",
  "@lg:",
  "@xl:",
  "@2xl:",
  "@3xl:",
  "@4xl:",
  "@5xl:",
];

/**
 * The breakpoints the Inspector actually OFFERS — one per device-toggle
 * position, so what you edit is always something the canvas can show you. Three
 * rungs, not the nine container breakpoints Tailwind defines; an author who
 * needs `@lg:` specifically reaches it through the raw Classes field.
 *
 * Lives here rather than beside the React context because a host safelisting the
 * canvas vocabulary needs it (see `@wizeworks/silicaui-builder/vocab`), and that
 * entry point is framework-neutral by contract.
 */
export const BREAKPOINT_CHOICES: readonly { prefix: string; label: string; hint: string; device: string }[] = [
  { prefix: "", label: "All sizes", hint: "The base value every size inherits", device: "mobile" },
  { prefix: "@3xl:", label: "Tablet and up", hint: "Applies from 768px wide", device: "tablet" },
  { prefix: "@5xl:", label: "Desktop", hint: "Applies from 1024px wide", device: "desktop" },
];

/** Split a class string into tokens (whitespace-separated, empties dropped). */
export const tokenize = (cls: string | undefined): string[] => (cls ?? "").split(/\s+/).filter(Boolean);

/** Split a token into its variant prefix and base class: `"@md:grid-cols-2"` →
 *  `["@md:", "grid-cols-2"]`. A token with no variant yields `["", token]`.
 *
 *  Splits at the LAST colon so a stacked variant (`hover:@md:underline`) keeps
 *  its full prefix rather than being mistaken for a bare `@md:` one. */
export function splitToken(token: string): [prefix: string, base: string] {
  const at = token.lastIndexOf(":");
  return at < 0 ? ["", token] : [token.slice(0, at + 1), token.slice(at + 1)];
}

export interface TokenState {
  /** The group member in effect at the requested breakpoint ("" = none). */
  value: string;
  /** The breakpoint that actually DECLARES it — "" for base, undefined if the
   *  group is unset everywhere at or below the requested breakpoint. */
  setAt: string | undefined;
  /** True when the value comes from a LOWER breakpoint rather than this one.
   *  What lets a control show "inherited" instead of pretending it was set here
   *  — the distinction Webflow's cascade indicator exists to make. */
  inherited: boolean;
}

/**
 * What `group` resolves to at `prefix`, following the mobile-first cascade: an
 * exact declaration at this breakpoint wins; otherwise the nearest declaration
 * BELOW it applies, exactly as CSS would.
 *
 * A breakpoint not on the ladder (a host's own) resolves against base only —
 * we can't place it in the cascade, and guessing an order would be worse than
 * under-reporting inheritance.
 */
export function tokenStateAt(cls: string | undefined, group: readonly string[], prefix: string): TokenState {
  const members = new Set(group);
  /** Which group member (if any) is declared at exactly `p`. */
  const declaredAt = (p: string): string | undefined => {
    for (const token of tokenize(cls)) {
      const [tp, base] = splitToken(token);
      if (tp === p && members.has(base)) return base;
    }
    return undefined;
  };

  const exact = declaredAt(prefix);
  if (exact !== undefined) return { value: exact, setAt: prefix, inherited: false };

  const rung = BREAKPOINT_ORDER.indexOf(prefix);
  const below = rung < 0 ? [""] : BREAKPOINT_ORDER.slice(0, rung).reverse();
  for (const p of below) {
    const found = declaredAt(p);
    if (found !== undefined) return { value: found, setAt: p, inherited: true };
  }
  return { value: "", setAt: undefined, inherited: false };
}

/**
 * Set `group` to `value` at `prefix` — removing every other member of the group
 * AT THAT PREFIX ONLY, and leaving the same group at other breakpoints, and
 * every unrelated token, exactly where it was.
 *
 * `value: ""` clears the group at this breakpoint, which is not the same as
 * setting it to the inherited value: cleared means "whatever the smaller
 * breakpoint says", and re-declaring it would pin the value and stop tracking
 * later edits to base.
 *
 * Returns the new class string. Token ORDER is preserved for everything that
 * survives, and a newly-added token appends — so a diff of two class strings
 * stays readable, and the raw Classes field doesn't reshuffle under the author
 * every time a chip is clicked.
 */
export function setTokenAt(cls: string | undefined, group: readonly string[], value: string, prefix = ""): string {
  const members = new Set(group);
  const kept = tokenize(cls).filter((token) => {
    const [tp, base] = splitToken(token);
    return !(tp === prefix && members.has(base));
  });
  if (value) kept.push(`${prefix}${value}`);
  return kept.join(" ");
}

/** Every breakpoint at which `group` is explicitly declared, ascending. Drives
 *  the "this control is set at 2 other sizes" affordance, so a value the author
 *  can't see from here is at least announced. */
export function declaredBreakpoints(cls: string | undefined, group: readonly string[]): string[] {
  const members = new Set(group);
  const found = new Set<string>();
  for (const token of tokenize(cls)) {
    const [tp, base] = splitToken(token);
    if (members.has(base)) found.add(tp);
  }
  return BREAKPOINT_ORDER.filter((p) => found.has(p));
}

/** Is this a container-query variant (`@md:`), as opposed to base or something
 *  else? Container variants are the only responsive prefix this builder writes. */
export const isContainerPrefix = (prefix: string): boolean => prefix.startsWith("@");

/** Does this class string establish a container-query context? Matches both the
 *  bare `@container` and the named form (`@container/sidebar`). */
export const declaresContainer = (cls: string | undefined): boolean =>
  tokenize(cls).some((t) => t === "@container" || t.startsWith("@container/"));
