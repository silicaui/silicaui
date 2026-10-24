import plugin from "tailwindcss/plugin";
import { LIGHT, SEMANTIC_COLORS } from "./colors.js";
import { buildBase } from "./theme.js";
import { colorUtilities, softUtilities, glassUtilities, textInkUtilities } from "./color-utilities.js";
import { warnUnregisteredColors } from "./lib/warn-unregistered-colors.js";
import { findInkProblems, registeredColorValues, warnInkProblems } from "./lib/warn-auto-ink.js";
import { TYPE_SCALE } from "./type-scale.js";
import { COMPONENTS } from "./components/registry.js";

/**
 * Parse the `colors` option from `@plugin "@wizeworks/silicaui" { colors: … }`.
 * Tailwind may hand this to us as an array or a comma/space-separated string.
 */
function parseColors(option) {
  if (!option) return SEMANTIC_COLORS;
  const raw = Array.isArray(option) ? option : String(option).split(/[\s,]+/);
  const list = raw.map((s) => s.trim()).filter(Boolean);
  return list.length ? list : SEMANTIC_COLORS;
}

/**
 * Parse the `prefix` option from `@plugin "@wizeworks/silicaui" { prefix: sx-; }`.
 * Prepended verbatim to every Silica component class, so the caller controls the
 * separator (`sx-` → `.sx-btn`). Whitespace/quotes are stripped; empty → "".
 * NOTE: this must match the prefix given to `<SilicaProvider prefix>` in the
 * React package, since React rebuilds these class names at runtime.
 */
function parsePrefix(option) {
  if (option == null) return "";
  const raw = Array.isArray(option) ? option.join("") : String(option);
  return raw.trim().replace(/^['"]+|['"]+$/g, "");
}

/**
 * Parse `prefersdark` from `@plugin "@wizeworks/silicaui" { prefersdark: true; }`.
 *
 * Opt-in and default OFF: turning it on changes what an app looks like on a
 * dark-OS visitor's first paint, and Silica never repaints a page you did not
 * opt into (same principle as the `[data-theme]`-scoped surface painting in
 * buildBase). Tailwind hands option values through as strings, so `true`,
 * `"true"` and a bare `prefersdark;` all count.
 */
function parsePrefersDark(option) {
  if (option == null) return false;
  const raw = Array.isArray(option) ? option.join("") : String(option);
  const v = raw.trim().replace(/^['"]+|['"]+$/g, "").toLowerCase();
  return v === "" || v === "true" || v === "1" || v === "yes";
}

/**
 * Parse `components` from `@plugin "@wizeworks/silicaui" { components: button, card; }`.
 *
 * Opt-in. Absent → null → every component is emitted, byte-for-byte as before.
 * Present → only the listed component files (names as in `components/registry.js`)
 * are emitted, in the SAME order as the full build so the cascade does not move.
 * Tokens, base styles and color utilities are not components and always ship.
 */
function parseComponents(option) {
  if (option == null) return null;
  const raw = Array.isArray(option) ? option : String(option).split(/[\s,]+/);
  const names = raw.map((s) => String(s).trim().replace(/^['"]+|['"]+$/g, "")).filter(Boolean);
  return new Set(names);
}

/** True for `chunkmarkers: true`: a build-tool aid that tags where each component starts. */
function parseFlag(option) {
  return option != null && parsePrefersDark(option);
}

/**
 * Silica CSS — a Tailwind v4 plugin.
 *
 * Usage (CSS-first, no tailwind.config):
 *
 *   @import "tailwindcss";
 *   @plugin "@wizeworks/silicaui";
 *
 * Add your own component colors — they get the full treatment, including an
 * auto-derived foreground if you don't supply a `-content`:
 *
 *   @plugin "@wizeworks/silicaui" { colors: primary, secondary, brand; }
 *   @theme { --color-brand: #7c3aed; }
 *
 * Namespace every Silica class with a prefix (e.g. to coexist with another
 * design system). The value is prepended verbatim, so include your own
 * separator. Must match `<SilicaProvider prefix>` in @wizeworks/silicaui-react:
 *
 *   @plugin "@wizeworks/silicaui" { prefix: sx-; }   // → .sx-btn, .sx-btn-primary, …
 *
 * Follow the visitor's operating system on first paint, with no theme script:
 *
 *   @plugin "@wizeworks/silicaui" { prefersdark: true; }
 *
 * Off by default. It emits `@media (prefers-color-scheme: dark)` scoped to
 * `:root:not([data-theme])`, so an explicit `data-theme` — a stored choice from
 * `<ThemeController>`, or a theme island — always outranks the OS. Do NOT also
 * hardcode `<html data-theme="light">`: that makes the rule permanently
 * unmatchable and silently disables this.
 */
export default plugin.withOptions(
  (options = {}) =>
    ({ addBase, addUtilities, theme }) => {
      const colors = parseColors(options.colors);
      const prefix = parsePrefix(options.prefix);
      // A color declared in @theme but left out of `colors:` produces working
      // `bg-*` utilities and silently missing `btn-*`/`badge-*` variants. Say
      // so rather than letting it read as "the color is broken".
      warnUnregisteredColors(theme, colors);
      // A registered color with no `-content` token gets its ink from a CSS
      // lightness rule, which is right for ~97.7% of the color space and silent
      // for the rest. `theme("color")` hands this plugin the VALUE, not just the
      // name, so the wrong ones are measurable here — see `warn-auto-ink.js`.
      //
      // This warns and does not substitute, which is the opposite of what
      // `theme-plugin.js` does, and the asymmetry is the point. A theme block
      // scopes its color and its ink together under one `[data-theme]`, so
      // writing the ink there is safe. A color declared in `@theme` is GLOBAL:
      // emitting `--color-x-content` at `:root` from here would outlive any
      // theme that later re-declares `--color-x` and paint the old ink on the
      // new color. Naming the line and letting the author place it is the only
      // correct move.
      warnInkProblems(findInkProblems(registeredColorValues(theme, colors)), " registered with the plugin");
      // Read ONCE and passed to everything that scopes to a Silica surface.
      // `prefersdark` adds the unthemed root as a second surface, and anything
      // that only knew about `[data-theme]` silently switched itself off for
      // apps that turned the option on — the surface paint and then the whole
      // type ramp (docs/personas/issues/013, /015).
      const prefersDark = parsePrefersDark(options.prefersdark);
      addBase(buildBase({ prefersDark }));
      const only = parseComponents(options.components);
      const markers = parseFlag(options.chunkmarkers);
      // Components are emitted via addBase, not addComponents, on purpose.
      // Tailwind v4 tree-shakes addComponents/addUtilities output against
      // scanned content — but a React component library builds its class names
      // dynamically (`btn-${color}`), so the scanner never sees them and would
      // drop everything. addBase is always emitted, which is what a component
      // library needs. Utilities still win over these (higher layer), so
      // `<Button className="w-full">` overrides as expected.
      for (const [name, build] of COMPONENTS) {
        if (only && !only.has(name)) continue;
        // A marker rule lets a post-build step cut the stylesheet per component.
        if (markers) addBase({ [`.sui-chunk-${name}`]: { "--sui-chunk": "1" } });
        addBase(build(colors, prefix, prefersDark));
      }
      if (markers) addBase({ ".sui-chunk-end": { "--sui-chunk": "1" } });
      // Color utilities as var-setters for EVERY declared color — parity with the
      // component variants above. Custom colors get `text-brand`/`bg-brand`/
      // `border-brand` with no scanning or safelist (@wizeworks/silicaui's N-color promise).
      // Emitted LAST so an explicit `text-*`/`bg-*` still layers over a
      // component's own color, matching Tailwind's utilities-beat-components rule.
      addBase(colorUtilities(colors, prefix));
      // The `soft` family goes through addUtilities, not addBase: a registered
      // semantic color (e.g. `bg-primary`) gets a REAL utilities-layer rule from
      // Tailwind's own generator whenever it's scanned, which always beats a
      // base-layer rule regardless of source order. addUtilities lands `.soft`/
      // `.bg-soft`/`.text-soft`/`.border-soft` in that same utilities layer, after
      // Tailwind's core output, so they reliably win. See softUtilities' doc.
      // `text-<role>` in the utilities layer, so the ink form beats Tailwind's own
      // raw-token rule for any colour whose literal class gets scanned.
      addUtilities(textInkUtilities(colors, prefix));
      addUtilities(softUtilities(prefix));
      // `glass` — Tier-0 frosted-glass utility (blur/saturate, no SVG
      // refraction). Same addUtilities + [class] bump as `soft`, for the
      // same reason: must reliably outrank addBase surfaces (Card) and any
      // registered `bg-<c>`. See glassUtilities' doc.
      addUtilities(glassUtilities(prefix));
    },
  // Register the semantic colors as real theme values so Tailwind generates the
  // matching CSS variables (`--color-primary`, …) AND utilities (`bg-primary`,
  // `text-primary-content`, …). `[data-theme]` overrides in buildBase() then
  // re-point those same variables per theme.
  () => ({
    theme: {
      extend: {
        // Point color utilities at the CSS variables (defined and theme-switched
        // in buildBase) instead of literal values. Registering literals here
        // froze `bg-base-*` / `text-primary` / etc. to the LIGHT palette —
        // Tailwind inlined the value — while components reading `var(--color-*)`
        // switched under `[data-theme]`, so the two diverged in dark mode (a
        // light footer/menu sitting on a dark page). Referencing the same vars
        // keeps every color utility in lockstep with the active theme. Opacity
        // modifiers (`bg-primary/50`) still work — v4 wraps var colors in
        // color-mix() for those.
        colors: Object.fromEntries(
          Object.keys(LIGHT).map((name) => [name, `var(--color-${name})`]),
        ),
        // Same rationale as colors: reference the radius vars (with each
        // component's default as the fallback) so `rounded-box` / `rounded-field`
        // / `rounded-selector` track a theme's radius overrides instead of
        // freezing to the literal registered here.
        borderRadius: {
          selector: "var(--radius-selector, 1rem)",
          field: "var(--radius-field, 0.25rem)",
          box: "var(--radius-box, 0.5rem)",
        },
        // The type scale — `text-xs` … `text-10xl`, anchored to a 16px root (see
        // buildBase) with `text-md` == `text-base` == 1rem. Declared in ONE place
        // (`./type-scale.js`) so the MCP catalog documents the exact scale the
        // plugin emits and can't drift. Always prefer a scale step over a
        // `text-[13px]`-style magic number.
        fontSize: TYPE_SCALE,
        // Point the font utilities at the typeface tokens (defined + theme-
        // switched in buildBase), same var strategy as colors/radius — so
        // `font-sans` / `font-serif` / `font-mono` track a theme's `--font-*`
        // override instead of freezing to a literal stack.
        fontFamily: {
          sans: "var(--font-sans)",
          serif: "var(--font-serif)",
          mono: "var(--font-mono)",
        },
      },
    },
  }),
);
