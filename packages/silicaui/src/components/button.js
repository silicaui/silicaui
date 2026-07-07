import { contentVar } from "../lib/auto-content.js";

/**
 * The color-variant var-setters for the button, as a standalone rule map.
 *
 * Each `.btn-<name>` only assigns the source variables (`--btn-bg`/`--btn-fg`
 * drive the solid look; `--btn-accent`/`--btn-accent-content` drive
 * outline/soft/ghost/link/dash). Split out so the SAME generator produces the
 * build-time variants AND the builder's runtime cascade for colors invented
 * live in the theme editor — guaranteeing byte-for-byte parity (a runtime
 * `brand` behaves exactly like a declared one).
 *
 * @param {string[]} colors - color names to generate `.btn-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class
 */
export function buttonColorVars(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}btn${suffix}`;
  const rules = {};
  for (const name of colors) {
    const color = `var(--color-${name})`;
    const content = contentVar(name);
    rules[sel(`-${name}`)] = {
      "--btn-bg": color,
      "--btn-fg": content,
      "--btn-accent": color,
      "--btn-accent-content": content,
    };
  }
  return rules;
}

/**
 * The Button component.
 *
 * Design: color and style are orthogonal axes.
 *   - A color class (`.btn-primary`, `.btn-brand`, …) only sets CSS variables
 *     (`--btn-bg`, `--btn-fg`, `--btn-accent`, …). It renders nothing itself.
 *   - `.btn` and the style classes (`.btn-outline`, `.btn-soft`, …) read those
 *     variables to paint the button.
 *
 * Because color classes only set variables (never concrete properties), they
 * never fight the style classes on specificity, and any new color composes with
 * every style for free.
 *
 * @param {string[]} colors - color names to generate `.btn-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-` →
 *   `.sx-btn`). Only affects Silica class names, never the internal `--btn-*`
 *   variables or the shared `silica-spin` keyframes.
 */
export function button(colors, prefix = "") {
  // Class-selector helper: sel() → `.<prefix>btn`, sel("-outline") →
  // `.<prefix>btn-outline`. Everything class-named routes through here so the
  // prefix is applied in exactly one place.
  const sel = (suffix = "") => `.${prefix}btn${suffix}`;

  const base = {
    [sel()]: {
      "--btn-size": "calc(var(--size-field, 0.25rem) * 10)",
      "--btn-spinner": "var(--btn-fg, var(--color-base-content))",

      display: "inline-block",
      alignContent: "center",
      height: "var(--btn-size)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 4)",
      fontSize: "0.875rem",
      fontWeight: "600",
      lineHeight: "1",
      // Vertical centering is block-level `align-content: center` (set above).
      // Broadly supported since 2024, and unlike flexbox it centers the text's
      // OWN line box rather than an anonymous flex item — the flex path is what
      // left small labels sitting ~8% low. `text-box-trim` then refines it to
      // the x-height band on browsers that support it (progressive enhancement,
      // silently ignored elsewhere). Horizontal centering is `text-align`.
      textBoxTrim: "trim-both",
      textBoxEdge: "ex alphabetic",
      textAlign: "center",
      whiteSpace: "nowrap",
      userSelect: "none",
      cursor: "pointer",
      appearance: "none",
      borderRadius: "var(--radius-field, 0.25rem)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--btn-bg, var(--color-base-300))",
      backgroundColor: "var(--btn-bg, var(--color-base-200))",
      color: "var(--btn-fg, var(--color-base-content))",
      // Depth: subtle top highlight + drop shadow, scaled by the global
      // `--depth` flag (0 = flat, 1 = tactile). Meaningful on solid fills; the
      // transparent-bg variants reset it to none below.
      boxShadow:
        "inset 0 1px 0 0 rgb(255 255 255 / calc(var(--depth, 1) * 0.12)), 0 1px 2px -1px rgb(0 0 0 / calc(var(--depth, 1) * 0.28))",
      transitionProperty:
        "color, background-color, border-color, box-shadow, transform",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "& svg": {
        width: "1.25em",
        height: "1.25em",
        flexShrink: "0",
      },

      "&:hover": {
        backgroundColor:
          "color-mix(in oklab, var(--btn-bg, var(--color-base-200)) 88%, black)",
        borderColor:
          "color-mix(in oklab, var(--btn-bg, var(--color-base-300)) 88%, black)",
      },
      "&:active": {
        transform: "translateY(0.5px) scale(0.985)",
      },
      "&:focus-visible": {
        outline:
          "var(--focus-width, 2px) solid var(--btn-accent, var(--color-base-content))",
        outlineOffset: "var(--focus-offset, 2px)",
      },
      [`&:disabled, &[aria-disabled='true'], &${sel("-disabled")}`]: {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },

      // Loading: driven by `aria-busy`. Hide the label, show a spinner, and
      // make the button non-interactive.
      "&[aria-busy='true']": {
        color: "transparent",
        pointerEvents: "none",
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "1.15em",
          height: "1.15em",
          marginTop: "-0.575em",
          marginLeft: "-0.575em",
          borderRadius: "9999px",
          border: "2px solid var(--btn-spinner)",
          borderTopColor: "transparent",
          animation: "silica-spin 0.6s linear infinite",
        },
      },
    },

    // Icon buttons: lay the icon + label out as a centered flex row (with gap),
    // and turn OFF text-box-trim so the icon and text agree on ONE center.
    // Text-only buttons keep the block/align-content centering above (which nails
    // small labels); but once an icon is present, the icon sits on the x-height
    // midline while a trimmed text box would put capital-bearing labels on a
    // different line — so the two disagree. Flex centers them together instead.
    [`${sel()}:has(svg)`]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      textBoxTrim: "normal",
    },

    // ---- Style variants (default is solid, painted by `.btn` above) --------
    [sel("-outline")]: {
      backgroundColor: "transparent",
      boxShadow: "none",
      color: "var(--btn-accent, var(--color-base-content))",
      borderColor: "var(--btn-accent, var(--color-base-content))",
      "--btn-spinner": "var(--btn-accent, var(--color-base-content))",
      "&:hover": {
        backgroundColor: "var(--btn-accent, var(--color-base-content))",
        borderColor: "var(--btn-accent, var(--color-base-content))",
        color: "var(--btn-accent-content, var(--color-base-100))",
      },
    },
    [sel("-dash")]: {
      backgroundColor: "transparent",
      boxShadow: "none",
      color: "var(--btn-accent, var(--color-base-content))",
      borderColor: "var(--btn-accent, var(--color-base-content))",
      borderStyle: "dashed",
      "--btn-spinner": "var(--btn-accent, var(--color-base-content))",
      "&:hover": {
        backgroundColor:
          "color-mix(in oklab, var(--btn-accent, var(--color-base-content)) 12%, transparent)",
        borderColor: "var(--btn-accent, var(--color-base-content))",
      },
    },
    [sel("-soft")]: {
      backgroundColor:
        "color-mix(in oklab, var(--btn-accent, var(--color-base-content)) 15%, var(--color-base-100))",
      boxShadow: "none",
      color: "var(--btn-accent, var(--color-base-content))",
      borderColor: "transparent",
      "--btn-spinner": "var(--btn-accent, var(--color-base-content))",
      "&:hover": {
        backgroundColor:
          "color-mix(in oklab, var(--btn-accent, var(--color-base-content)) 25%, var(--color-base-100))",
        borderColor: "transparent",
      },
    },
    [sel("-ghost")]: {
      backgroundColor: "transparent",
      boxShadow: "none",
      color: "var(--btn-accent, var(--color-base-content))",
      borderColor: "transparent",
      "--btn-spinner": "var(--btn-accent, var(--color-base-content))",
      "&:hover": {
        backgroundColor:
          "color-mix(in oklab, var(--btn-accent, var(--color-base-content)) 12%, transparent)",
        borderColor: "transparent",
      },
    },
    [sel("-link")]: {
      backgroundColor: "transparent",
      boxShadow: "none",
      borderColor: "transparent",
      color: "var(--btn-accent, var(--color-primary))",
      textDecorationLine: "underline",
      textUnderlineOffset: "2px",
      "--btn-spinner": "var(--btn-accent, var(--color-primary))",
      "&:hover": {
        textDecorationThickness: "2px",
        backgroundColor: "transparent",
        borderColor: "transparent",
      },
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: {
      "--btn-size": "calc(var(--size-field, 0.25rem) * 6)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 2)",
      fontSize: "0.6875rem",
    },
    [sel("-sm")]: {
      "--btn-size": "calc(var(--size-field, 0.25rem) * 8)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 3)",
      fontSize: "0.75rem",
    },
    [sel("-md")]: {
      "--btn-size": "calc(var(--size-field, 0.25rem) * 10)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 4)",
      fontSize: "0.875rem",
    },
    [sel("-lg")]: {
      "--btn-size": "calc(var(--size-field, 0.25rem) * 12)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 5)",
      fontSize: "1rem",
    },
    [sel("-xl")]: {
      "--btn-size": "calc(var(--size-field, 0.25rem) * 14)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 6)",
      fontSize: "1.125rem",
    },

    // ---- Shapes & layout ---------------------------------------------------
    [sel("-block")]: { width: "100%" },
    [sel("-wide")]: { paddingInline: "2rem" },
    [sel("-square")]: {
      width: "var(--btn-size)",
      paddingInline: "0",
    },
    [sel("-circle")]: {
      width: "var(--btn-size)",
      paddingInline: "0",
      borderRadius: "9999px",
    },

    // ---- Forced state ------------------------------------------------------
    [sel("-active")]: {
      transform: "translateY(0.5px) scale(0.985)",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  // Emitted by the shared generator so the builder's runtime cascade matches.
  Object.assign(base, buttonColorVars(colors, prefix));

  return base;
}
