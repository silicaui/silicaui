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

/**
 * A Tailwind SCALE value — the `4` in `py-4`: a number, the `px` hairline, an
 * arbitrary value (`py-[3.5rem]`) or a CSS-var one (`py-(--gutter)`). Anything a
 * hand-written class or an imported template can put where a scale step goes.
 */
const SCALE_VALUE = String.raw`(?:\d+(?:\.\d+)?|px|\[[^\]]*\]|\([^)]*\))`;

/** Escape a derived class head for use inside a RegExp (heads are plain
 *  `a-z0-9-` today; escaping keeps a host-supplied group from injecting syntax). */
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The class FAMILY a group owns, or undefined if it owns only its own members.
 *
 * A group enumerates a control's OFFERED values (`py-0 … py-16`), which is not
 * the same as the values the underlying CSS property can hold. When a node
 * already wears a step the control doesn't offer — `py-20` on a hero, which is
 * what most starter templates author — matching by membership alone appends
 * instead of replacing, both classes ship, and the larger one wins in Tailwind's
 * source order. The control moves, the model changes, and the padding doesn't:
 * an edit that silently does nothing, which is worse than one that's disabled.
 *
 * So a group that enumerates a NUMERIC SCALE claims the whole scale: every
 * member matches `<head>-<number>`, they share a head, and picking any step
 * replaces any other value at that head. `py-0 … py-16` owns `py-20`,
 * `py-[3rem]`, `py-px`. Derived rather than declared so it holds for a host's
 * own groups too, not just this builder's vocabulary.
 *
 * DELIBERATELY NARROW. It fires only when every member's last dash-segment is a
 * bare number, because the alternative — "same head" alone — is actively wrong:
 * `text-left/center/right` would then own `text-primary` and `text-2xl`, and
 * setting the alignment would strip the node's color and size. A group of NAMED
 * values (`rounded-none/field/box/full`, `max-w-xs … max-w-5xl`) keeps the old
 * membership-only behavior, which is correct for it — a named set can't be
 * enumerated from its own members.
 */
function groupFamily(group: readonly string[]): RegExp | undefined {
  let head: string | undefined;
  for (const member of group) {
    const at = member.lastIndexOf("-");
    if (at <= 0) return undefined;
    if (!/^\d+(\.\d+)?$/.test(member.slice(at + 1))) return undefined;
    const h = member.slice(0, at);
    if (head === undefined) head = h;
    else if (head !== h) return undefined;
  }
  return head ? new RegExp(`^${escapeRe(head)}-${SCALE_VALUE}$`) : undefined;
}

/** Does `base` belong to this group — as a listed member, or as another step of
 *  the numeric scale the group owns (see `groupFamily`)? */
function memberTest(group: readonly string[]): (base: string) => boolean {
  const members = new Set(group);
  const family = groupFamily(group);
  return family ? (base) => members.has(base) || family.test(base) : (base) => members.has(base);
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
 *
 * `value` can be a class the group doesn't LIST — another step of the scale it
 * owns (`py-20` for a `py-0 … py-16` control). A chip row renders that as
 * nothing selected, which is honest; reporting "" instead would claim the
 * property is unset on a node that visibly has it, and would make the row's
 * inherited-from badge describe the wrong breakpoint.
 */
export function tokenStateAt(cls: string | undefined, group: readonly string[], prefix: string): TokenState {
  const isMember = memberTest(group);
  /** Which group member (if any) is declared at exactly `p`. */
  const declaredAt = (p: string): string | undefined => {
    for (const token of tokenize(cls)) {
      const [tp, base] = splitToken(token);
      if (tp === p && isMember(base)) return base;
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
 * Set `group` to `value` at `prefix` — removing every other value the group
 * OWNS (its listed members, plus any other step of a numeric scale it
 * enumerates — see `groupFamily`) AT THAT PREFIX ONLY, and leaving the same
 * group at other breakpoints, and every unrelated token, exactly where it was.
 *
 * Owning the scale rather than just the list is what makes a control able to
 * overwrite a value it wouldn't have offered. Setting `py-16` on a section
 * authored as `py-20` replaces it; before, both survived and `py-20` won.
 *
 * `value: ""` clears the group at this breakpoint, which is not the same as
 * setting it to the inherited value: cleared means "whatever the smaller
 * breakpoint says", and re-declaring it would pin the value and stop tracking
 * later edits to base. Clearing drops owned-but-unlisted values too — an "Auto"
 * that left `py-20` standing would be the same silent no-op wearing a different
 * label.
 *
 * Returns the new class string. Token ORDER is preserved for everything that
 * survives, and a newly-added token appends — so a diff of two class strings
 * stays readable, and the raw Classes field doesn't reshuffle under the author
 * every time a chip is clicked.
 */
export function setTokenAt(cls: string | undefined, group: readonly string[], value: string, prefix = ""): string {
  const isMember = memberTest(group);
  const kept = tokenize(cls).filter((token) => {
    const [tp, base] = splitToken(token);
    return !(tp === prefix && isMember(base));
  });
  if (value) kept.push(`${prefix}${value}`);
  return kept.join(" ");
}

/** Every breakpoint at which `group` is explicitly declared, ascending. Drives
 *  the "this control is set at 2 other sizes" affordance, so a value the author
 *  can't see from here is at least announced — including an owned-but-unlisted
 *  one (`@3xl:py-20`), which is exactly the override hardest to discover. */
export function declaredBreakpoints(cls: string | undefined, group: readonly string[]): string[] {
  const isMember = memberTest(group);
  const found = new Set<string>();
  for (const token of tokenize(cls)) {
    const [tp, base] = splitToken(token);
    if (isMember(base)) found.add(tp);
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
