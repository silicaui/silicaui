import { LIGHT, DARK } from "./colors.js";

/**
 * The grain texture behind `--noise`, as a self-contained SVG data URI — no
 * asset to host, nothing to fetch, and it tiles seamlessly (`stitchTiles`).
 *
 * The filter chain matters, and each step earns its place:
 *
 *  • `feFlood` + `feComposite over` FIRST, flattening the noise onto opaque
 *    mid-grey. Turbulence emits a noisy ALPHA channel, and `feColorMatrix` /
 *    `feComponentTransfer` operate on UN-premultiplied color — so run directly
 *    on turbulence they divide RGB by a near-zero alpha, clamp the result to
 *    white, and hand `overlay` a mostly-white layer. That is not a theory: the
 *    first two cuts of this measured +7.7/255 mean lightening with a standard
 *    deviation of 0.5, i.e. all wash and no grain. `feComposite` works on
 *    PREMULTIPLIED color, so compositing first never divides by that alpha.
 *  • `color-interpolation-filters='sRGB'` is LOAD-BEARING, not boilerplate. SVG
 *    filters default to linearRGB, which pushed the flattened layer's mean off
 *    mid-grey and made every hand-derived coefficient wrong. Pinned to sRGB the
 *    layer measures mean=128.0 exactly — no correction term needed.
 *  • `feColorMatrix saturate=0` drains the (now opaque) layer to grey —
 *    otherwise the grain tints the theme it is supposed to texture.
 *  • `feFuncR/G/B linear slope=2 intercept=-0.5` stretches contrast ABOUT 0.5,
 *    which is the identity point of `overlay` (b<0.5 → 2bs = b, b>=0.5 →
 *    1-2(1-b)(1-s) = b). Centering there is what keeps the surface color exactly
 *    where the theme put it while the deviation reads as texture; the stretch
 *    takes the layer from sd 11.6 to 23.3, since `overlay` compresses a
 *    near-white surface by 2(1-b) ≈ 0.12 and 11.6 alone lands under a level.
 *
 * A consequence of `overlay` worth knowing: its response flattens as the surface
 * approaches pure white or pure black, so grain is quietest on the most extreme
 * surfaces. Silica's own base-100 is `oklch(98% …)`, not `#fff`, so it reads —
 * and mean-preservation is the right trade, since a texture toggle must never
 * silently move the surface color a designer chose.
 *
 * The `#` in the filter reference MUST stay percent-encoded — a literal `#` in a
 * data: URI starts the fragment and truncates the document at that byte.
 */
const NOISE_IMAGE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch' result='t'/%3E%3CfeFlood flood-color='%23808080' result='f'/%3E%3CfeComposite in='t' in2='f' operator='over' result='c'/%3E%3CfeColorMatrix in='c' type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='2' intercept='-0.5'/%3E%3CfeFuncG type='linear' slope='2' intercept='-0.5'/%3E%3CfeFuncB type='linear' slope='2' intercept='-0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Turn a { name: value } color map into { "--color-name": value } CSS vars. */
function toColorVars(map) {
  const out = {};
  for (const [name, value] of Object.entries(map)) {
    out[`--color-${name}`] = value;
  }
  return out;
}

/**
 * The selectors that establish a Silica surface — the single answer to "where
 * does Silica own the page?", which more than one module needs and more than one
 * module has now got wrong.
 *
 * There are exactly two opt-ins and they are equals:
 *
 *   [data-theme]            an explicit theme, on <html> or on a nested island
 *   :root:not([data-theme]) `prefersdark: true`, when nothing has chosen
 *
 * Neither matches a page that did not ask, so the embeddable promise holds: a
 * host app that sets no attribute and no option is never restyled.
 *
 * WHY THIS IS A LIST AND NOT TWO STRINGS. `prefersdark` shipped re-pointing the
 * colour tokens at the second selector while everything that makes a page
 * actually LOOK like Silica stayed scoped to the first. Two separate features
 * were silently switched off for anyone who turned the option on: the surface
 * paint (issues/013) and the ENTIRE type ramp — every `<h1>` in the app rendered
 * at 16px/400, identical to a paragraph (issues/015). The reduced-motion rule
 * below already spelled both selectors out by hand, so the knowledge existed and
 * simply never travelled. Anything scoped to a Silica surface reads this list,
 * so the next such rule cannot be the fourth mistake.
 */
export function surfaceScopes(prefersDark = false) {
  return prefersDark ? ["[data-theme]", ":root:not([data-theme])"] : ["[data-theme]"];
}

/**
 * What it MEANS to be a Silica surface, in one place.
 *
 * Two different selectors establish one — `[data-theme]`, and the
 * `prefers-color-scheme: dark` block below when `prefersdark` is on — and they
 * have to agree. They did not: `prefersdark` was added beside the token blocks
 * and re-pointed every `--color-*` to its dark value, while the paint rule lived
 * further down and still matched `[data-theme]` alone. An OS-dark visitor with
 * no stored choice therefore got Silica's light ink swapped for its dark ink over
 * a page background that was never painted at all — readable only because the UA
 * darkens its own canvas under `color-scheme: dark`, and never actually
 * `--color-base-100` (docs/personas/issues/013).
 *
 * Extracted rather than copied so a sixth declaration added here reaches both
 * selectors for free. That is the whole point: the drift is the defect.
 */
function surface() {
  return {
    backgroundColor: "var(--color-base-100)",
    color: "var(--color-base-content)",
    // Grain (`--noise`). The themed surface is the ONLY place it belongs: this
    // rule is what "surface" means in this system, so one declaration covers
    // the page and every scoped island, and a Card keeps its clean opaque fill
    // — a raised surface sitting ON textured paper, which is the effect grain
    // is actually for.
    //
    // Gated by `background-size`, not by a pseudo-element: a zero-sized
    // background image is not painted at all (so `--noise: 0` costs nothing),
    // and unlike an `::after` overlay this needs no `position: relative` on
    // every `[data-theme]` — which would silently re-parent any absolutely
    // positioned descendant that resolves against an ancestor outside the
    // island. A theme must not move a consumer's layout.
    //
    // It is a SWITCH, not a strength dial (SCALAR_TOKENS declares step: 1) —
    // a fractional value scales the TILE, not the intensity.
    //
    // `overlay` blends the grey grain against whatever `--color-base-100` is,
    // so one texture reads correctly on a light surface and a dark one; the
    // noise is desaturated in the filter so it never tints the theme.
    backgroundImage: `var(--noise-image, ${NOISE_IMAGE})`,
    backgroundSize:
      "calc(var(--noise, 0) * 128px) calc(var(--noise, 0) * 128px)",
    backgroundBlendMode: "overlay",
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
  };
}

/**
 * Base styles injected by the plugin: design tokens, per-theme color overrides,
 * and keyframes. Semantic color *values* are registered through the plugin's
 * theme config (see index.js) so `bg-primary` utilities also exist; here we
 * only add tokens and the theme-switch overrides.
 */
export function buildBase({ prefersDark = false } = {}) {
  return {
    // Opt-in, via `@plugin "@wizeworks/silicaui" { prefersdark: true; }`.
    //
    // Emitted FIRST so the explicit `[data-theme]` blocks below outrank it: a
    // visitor's stored choice must beat their OS, and a theme island must beat
    // both. `:root:not([data-theme])` is the whole mechanism — the moment
    // anything sets `data-theme` on <html> (a ThemeController, or a hardcoded
    // attribute in a layout) this rule stops matching and the explicit value
    // wins. That is also the classic way to break it: hardcoding
    // `<html data-theme="light">` makes the OS preference permanently
    // unreachable, which is exactly how silicaui.com shipped without dark for
    // its own visitors (docs/personas/issues/002).
    //
    // Pure CSS on purpose: no inline theme script, so there is no flash of the
    // wrong theme and nothing for a strict CSP to refuse.
    ...(prefersDark
      ? {
          // Paint OUTSIDE the media query, deliberately. `surface()` declares
          // `background: var(--color-base-100)` — it names the token, never a
          // value — so the one declaration already follows whichever palette is
          // live, and the media query below only has to move the tokens.
          //
          // It was inside at first (issues/013), which painted the dark side and
          // left OS-LIGHT on the browser's white instead of the theme's
          // `oklch(98% …)`. That asymmetry was recorded as known and is now
          // simply gone: asking for `prefersdark` means Silica manages this
          // page's light AND dark, which is the only reading under which the
          // option does what its name promises.
          ":root:not([data-theme])": { ...surface() },
          "@media (prefers-color-scheme: dark)": {
            ":root:not([data-theme])": {
              colorScheme: "dark",
              ...toColorVars(DARK),
            },
          },
        }
      : {}),
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
      //
      // ---- The presence sentinel --------------------------------------------
      // The one thing that proves, from inside the browser, that this plugin was
      // actually wired into the app's CSS. Nothing reads its VALUE — only whether
      // it exists.
      //
      // It is here because forgetting the `@plugin` line is completely silent:
      // `@wizeworks/silicaui-react` renders `class="btn btn-primary"` exactly as
      // it always does, the class resolves to no rules, and the page renders as
      // bare unstyled text with no build error, no console warning and a clean
      // `GET / 200`. The component is the only piece in a position to notice —
      // but it cannot ask "is my CSS here?" without something to look for
      // (docs/personas/issues/011).
      //
      // A custom property, deliberately: the `prefix` option renames CLASSES,
      // never custom properties, so this sentinel is spelled the same in a
      // prefixed install as in a plain one and every path can test it the same
      // way. Kept out of the theme config so an app's `@theme` block can neither
      // shadow it nor accidentally declare it.
      "--sui-plugin": "1",
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
    // (a dark card in a light page). Scoped to an OPT-IN on purpose — Silica
    // never repaints a host page you didn't ask it to, so it stays embeddable
    // under another design system (the prefixed Sparx case). There are exactly
    // two opt-ins, and both paint through `surface()`: this attribute, and the
    // `prefersdark` block at the top. One generic rule covers every theme,
    // built-in or custom (they only redefine the tokens it reads). Background on
    // <html> propagates to the viewport canvas.
    "[data-theme]": {
      ...surface(),
    },

    // Flatten motion in one place for users who ask for it.
    //
    // `:root` alone is NOT enough, and the reason is the cascade rather than
    // specificity: a custom property declared on a DESCENDANT shadows the
    // inherited value for that whole subtree. A theme island (`[data-theme]`,
    // the sanctioned way to carry a palette — and now a motion speed) declares
    // `--duration` on itself, so everything inside it would go on animating at
    // the theme's pace no matter what this rule said about `:root`. Matching
    // `[data-theme]` puts the override on the same element, and `!important`
    // makes it beat the inline `style` a live editor writes there — an author
    // declaration marked important outranks a non-important inline one.
    "@media (prefers-reduced-motion: reduce)": {
      ":root, [data-theme]": { "--duration": "0.01ms !important" },
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
