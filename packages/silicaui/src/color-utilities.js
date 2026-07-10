import { contentVar } from "./lib/auto-content.js";

/**
 * Color UTILITIES as pure var-setters — `.text-<c>`, `.bg-<c>`, `.border-<c>`.
 *
 * @wizeworks/silicaui already emits component VARIANTS (`.btn-<c>`) for the whole `colors:`
 * list via addBase, so they exist for any declared color with no scanning. Color
 * utilities, by contrast, historically came only from Tailwind's registered
 * `theme.colors` (the built-in set) and were tree-shaken against scanned source —
 * so a user's custom `brand` got `.btn-brand` but NOT `.text-brand`/`.bg-brand`,
 * and even built-ins only appeared if a literal class string was scanned.
 *
 * Emitting them here as var-setters (same mechanism as variants) closes that gap:
 * every color in the list gets the full trio, for ALL N named colors, with no
 * safelist. This is @wizeworks/silicaui's core promise — "n named colors cascade through
 * everything" — made literally true. Tailwind's own utilities (opacity modifiers
 * like `bg-primary/50`) still layer on top for the registered colors; these are
 * additive and never fight them (utilities layer wins over base).
 *
 * Each rule ALSO writes `--u-accent`/`--u-accent-content` — a component-agnostic
 * "what color did this element declare" pair, regardless of which axis (text/bg/
 * border) expressed it. `soft`/`bg-soft`/`text-soft`/`border-soft` (see
 * `softUtilities` below) read it back, so `bg-primary soft` softens whatever
 * color was just declared without either utility needing to know about the other.
 *
 * @param {string[]} names - token names to emit utilities for (e.g. "primary",
 *   "primary-content", "base-100")
 * @param {string} [prefix] - prepended verbatim to every class
 */
export function colorUtilityRules(names, prefix = "") {
  const rules = {};
  for (const name of names) {
    const v = `var(--color-${name})`;
    const accentVars = {
      "--u-accent": v,
      "--u-accent-content": contentVar(name),
    };
    rules[`.${prefix}text-${name}`] = { color: v, ...accentVars };
    rules[`.${prefix}bg-${name}`] = { backgroundColor: v, ...accentVars };
    rules[`.${prefix}border-${name}`] = { borderColor: v, ...accentVars };
  }
  return rules;
}

/**
 * The `soft` family — a component-agnostic version of the `-soft` treatment
 * already on Button/Badge/Alert (a 15%-tinted background, full-accent text,
 * transparent border), usable on ANY element via `--u-accent`.
 *
 * `.soft` is the bundle (all three at once, for the common "give me the whole
 * treatment" case). `.bg-soft`/`.text-soft`/`.border-soft` are its three pieces
 * split into independent axes — parallel to how `.bg-<c>`/`.text-<c>`/
 * `.border-<c>` are independent axes — for callers who want only one property
 * softened (e.g. a tinted background with the default text color left alone).
 *
 * Registered via `addUtilities` (NOT addBase, unlike the rest of this file) so
 * these land in Tailwind's `utilities` layer: a registered semantic color like
 * `bg-primary` gets a REAL utilities-layer rule from Tailwind itself whenever
 * the literal class is scanned, which always outranks anything in the `base`
 * layer regardless of source order.
 *
 * Within the utilities layer, though, Tailwind v4 re-sorts every rule into its
 * OWN canonical order (grouped by property/prefix, then alphabetically) instead
 * of preserving registration order — so `bg-success` (after "soft" alphabetically)
 * would sort AFTER `.bg-soft` and win, while `bg-primary` (before "soft") would
 * sort first and lose, a color-name-dependent bug. Each selector below adds a
 * trailing `[class]` (true of any element carrying the class, so semantically a
 * no-op) purely to bump specificity to 0-2-0, which beats the plain 0-1-0 color
 * utilities regardless of where Tailwind's sort places either rule — verified
 * against `@tailwindcss/node`'s compiled output directly. (A doubled class,
 * `.bg-soft.bg-soft`, reaches the same specificity but Tailwind's candidate
 * parser splits it into a redundant nested-`&` pair; `[class]` compiles clean.)
 *
 * @param {string} [prefix] - prepended verbatim to every class
 */
export function softUtilities(prefix = "") {
  const accent = "var(--u-accent, var(--color-base-content))";
  const tint = `color-mix(in oklab, ${accent} 15%, var(--color-base-100))`;
  const sel = (cls) => `.${prefix}${cls}[class]`;
  return {
    [sel("bg-soft")]: { backgroundColor: tint },
    [sel("text-soft")]: { color: accent },
    [sel("border-soft")]: { borderColor: "transparent" },
    [sel("soft")]: {
      backgroundColor: tint,
      color: accent,
      borderColor: "transparent",
    },
  };
}

/**
 * The `glass` utility — Tier-0 frosted-glass treatment (blur + saturate,
 * no SVG refraction). Rides the same `--u-accent` mechanism as `soft`: a
 * `bg-<c>` stacked alongside `glass` tints the frost with that color; bare
 * `glass` frosts neutral (`base-100`). No new color plumbing.
 *
 * Degrades to a flat tint (no blur, same mix as `soft`'s) under
 * `@supports not (backdrop-filter: …)` and `prefers-reduced-transparency:
 * reduce` — both read as a plain translucent surface, nothing broken.
 *
 * The rim sheen is a `::before` inset box-shadow rather than the host's own
 * `box-shadow`, so it composes with `.card-clickable`'s hover-lift shadow
 * instead of overwriting it. The sheen stays white regardless of theme (it
 * represents a specular highlight, not a themed surface color); the border
 * itself is theme-adaptive via `--color-base-content` so it stays visible
 * against both light and dark backdrops.
 *
 * Same `addUtilities` + `[class]` specificity bump as `soft` (see its doc
 * above) — reliably outranks any `addBase` surface (e.g. Card) and any
 * registered `bg-<c>`, regardless of source order.
 *
 * @param {string} [prefix] - prepended verbatim to every class
 */
export function glassUtilities(prefix = "") {
  const accent = "var(--u-accent, var(--color-base-100))";
  const tint = `color-mix(in oklab, ${accent} var(--glass-tint, 55%), transparent)`;
  const flatTint = `color-mix(in oklab, ${accent} 15%, var(--color-base-100))`;
  const blur = "blur(var(--glass-blur, 16px)) saturate(var(--glass-saturate, 1.4))";
  const sel = (cls) => `.${prefix}${cls}[class]`;

  // addUtilities requires every TOP-LEVEL key to be a single class selector
  // (unlike addBase, which accepts arbitrary CSS) — so the @supports/@media
  // fallbacks must nest INSIDE the `.glass[class]` rule rather than sit
  // alongside it as sibling at-rules.
  //
  // Only the standard `backdropFilter` is declared — Lightning CSS (this
  // plugin's build target) auto-generates the `-webkit-` prefix itself from
  // the configured browserslist. Also declaring `WebkitBackdropFilter`
  // ourselves made Lightning CSS treat the pair as a duplicate and collapse
  // them down to JUST the prefixed one, silently dropping the standard
  // property from the output — verified against the compiled CSS.
  return {
    [sel("glass")]: {
      position: "relative",
      backgroundColor: tint,
      backdropFilter: blur,
      borderColor: "color-mix(in oklab, var(--color-base-content) 20%, transparent)",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: "0",
        borderRadius: "inherit",
        boxShadow: "inset 0 1px 0 0 color-mix(in oklab, white 45%, transparent)",
        pointerEvents: "none",
      },
      "@supports not (backdrop-filter: blur(1px))": {
        backgroundColor: flatTint,
        backdropFilter: "none",
      },
      "@media (prefers-reduced-transparency: reduce)": {
        backgroundColor: flatTint,
        backdropFilter: "none",
      },
    },
  };
}

/** The neutral surface ramp + ink — always emitted (not part of `colors`). */
const SURFACES = ["base-100", "base-200", "base-300", "base-content"];

/**
 * The full build-time utility set: the surface ramp plus each semantic color and
 * its `-content` foreground. Wired into the plugin so every declared color is
 * paintable via `text-`/`bg-`/`border-` without scanning.
 *
 * @param {string[]} colors - the plugin's `colors:` list
 * @param {string} [prefix]
 */
export function colorUtilities(colors, prefix = "") {
  const names = [...SURFACES];
  for (const c of colors) names.push(c, `${c}-content`);
  return colorUtilityRules(names, prefix);
}
