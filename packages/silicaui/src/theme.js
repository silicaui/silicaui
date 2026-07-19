import { LIGHT, DARK } from "./colors.js";

/** Turn a { name: value } color map into { "--color-name": value } CSS vars. */
function toColorVars(map) {
  const out = {};
  for (const [name, value] of Object.entries(map)) {
    out[`--color-${name}`] = value;
  }
  return out;
}

/**
 * Base styles injected by the plugin: design tokens, per-theme color overrides,
 * and keyframes. Semantic color *values* are registered through the plugin's
 * theme config (see index.js) so `bg-primary` utilities also exist; here we
 * only add tokens and the theme-switch overrides.
 */
export function buildBase() {
  return {
    ":root": {
      // ---- Token strategy -------------------------------------------------
      // Silica's overridable, NON-namespace tokens are intentionally NOT
      // declared here. `addBase` emits to the `base` layer, which OUTRANKS an
      // app's `@theme { … }` overrides (the lower `theme` layer) — the exact
      // bug that made `--radius-field` un-overridable. So instead:
      //   • Namespace tokens (colors, radius) live in the Tailwind theme config
      //     (index.js) → `theme` layer: overridable AND they generate utilities.
      //   • Every other token carries its DEFAULT in each component's
      //     `var(--token, default)` fallback, so an app's `@theme` / `:root`
      //     override always wins. Defaults, for reference:
      //       --size-field: .25rem   --size-selector: .25rem   --border: 1px
      //       --depth: 1             --noise: 0
      //       --focus-width: 2px     --focus-offset: 2px
      //       --duration: 150ms      --ease: cubic-bezier(.4,0,.2,1)
      //       --disabled-opacity: .5
      //
      // ---- The z-scale ------------------------------------------------------
      // Every globally-stacked surface reads one of these, so the ordering is a
      // property of the SYSTEM rather than of whichever component was written
      // last. The rule that drives it: a transient surface must outrank anything
      // it can be opened from. A picker opened inside a modal is the common case
      // — it has to win, and no component prop can make it win, because a child
      // can't out-stack its own parent's level.
      //
      //       --z-drawer:   40   edge panel
      //       --z-dialog:   50   modal + its backdrop (popup sits at +1)
      //       --z-lightbox: 60   fullscreen media overlay (popup at +1)
      //       --z-popover:  70   dropdown / popover / listbox / combobox /
      //                          nav-menu / preview-card / calendar popup —
      //                          ABOVE every overlay they can open inside
      //       --z-tooltip:  80   describes a popover, so it sits above one
      //       --z-toast:    90   system-level, outranks everything
      //
      // Purely LOCAL stacking (z-index 0–3 inside a component's own stacking
      // context — table headers, indicator dots, step connectors) is deliberately
      // NOT tokenized: it never competes with these, and tokenizing it would
      // invite apps to "fix" a global order by nudging a local one.
      colorScheme: "light",
      // Base font size: 16px. `100%` (not a fixed `16px`) DECLARES the anchor
      // while honoring a user who raised their browser's default — the whole rem
      // type scale (`text-md` = 1rem = 16px, see index.js) then scales with it.
      // Stated here on purpose so 16px is @wizeworks/silicaui's decision, not an accident of
      // the UA default.
      fontSize: "100%",
      // Typeface tokens. System stacks by default — zero network load, native
      // feel — and theme-overridable like every other token: a theme sets
      // `--font-sans` to swap the whole UI face, `--font-head` to give headings a
      // distinct face (falls back to --font-sans). These back the `font-sans` /
      // `font-serif` / `font-mono` utilities (registered in index.js) and the
      // typography ramp.
      "--font-sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      "--font-serif": 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      "--font-mono": 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      // Emit the light color vars so components resolve `var(--color-primary)`
      // even with no `[data-theme]` set; `[data-theme]` blocks re-point them.
      ...toColorVars(LIGHT),
    },

    // Scoped, nestable themes. `[data-theme="light"]` is explicit so a light
    // island can sit inside a dark page (and vice-versa).
    '[data-theme="light"]': {
      colorScheme: "light",
      ...toColorVars(LIGHT),
    },
    '[data-theme="dark"]': {
      colorScheme: "dark",
      ...toColorVars(DARK),
    },

    // Paint the themed surface. Tailwind's Preflight deliberately leaves body
    // color/background to the app, and Silica's tokens don't apply themselves —
    // so without this every consumer hand-writes `body { background; color }`.
    // Any element carrying [data-theme] adopts the base surface + content color:
    // put it on <html> for the whole page, or on a wrapper for a scoped island
    // (a dark card in a light page). Scoped to [data-theme] ON PURPOSE — Silica
    // never repaints a host page you didn't opt into, so it stays embeddable
    // under another design system (the prefixed Sparx case). One generic rule
    // covers every theme, built-in or custom (they only redefine the tokens it
    // reads). Background on <html> propagates to the viewport canvas.
    "[data-theme]": {
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      // The opt-in surface also adopts the UI typeface, so a theme's `--font-sans`
      // override reaches the whole island (chrome, canvas, board) — never a host
      // page you didn't opt into.
      fontFamily: "var(--font-sans)",
      // Anchor body text to @wizeworks/silicaui's 16px base. A themed surface IS the
      // @wizeworks/silicaui context, so it establishes the standard reading size even when
      // nested inside a denser host (e.g. the builder's 14px chrome) — the preview
      // then matches a real page. `1rem` (not px) still tracks a raised UA
      // default. Explicit `text-*` utilities (utilities layer) override per node.
      fontSize: "1rem",
    },

    // Flatten motion in one place for users who ask for it.
    "@media (prefers-reduced-motion: reduce)": {
      ":root": { "--duration": "0.01ms" },
    },

    "@keyframes silica-spin": {
      to: { transform: "rotate(360deg)" },
    },

    // Indeterminate Progress: a short segment travels the full track and off.
    // (bar is 40% wide → translateX(250%) parks its left edge past the end.)
    "@keyframes silica-progress-indeterminate": {
      "0%": { transform: "translateX(-100%)" },
      "100%": { transform: "translateX(250%)" },
    },
    // Skeleton: a translucent sheen sweeps across the placeholder.
    "@keyframes silica-skeleton": {
      "0%": { backgroundPosition: "150% 0" },
      "100%": { backgroundPosition: "-50% 0" },
    },
    // Generic soft opacity breathe — the reduced-motion fallback for both
    // indeterminate Progress and Skeleton (no positional motion).
    "@keyframes silica-pulse": {
      "0%, 100%": { opacity: "1" },
      "50%": { opacity: "0.4" },
    },
    // Chat typing indicator: one dot at a time lifts + brightens. Each dot in
    // the trio gets a staggered `animation-delay` (see chat-suite.js) so they
    // read as a wave, not three dots blinking in lockstep.
    "@keyframes silica-typing-bounce": {
      "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
      "30%": { transform: "translateY(-0.15rem)", opacity: "1" },
    },
  };
}
