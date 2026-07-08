/**
 * The Card component — a surface container.
 *
 * Box-tier element: rounds with `--radius-box`. Sits on the `base-100` surface
 * with a `base-300` hairline and a `--depth`-scaled shadow (flat when
 * `--depth: 0`). Composes from parts: `.card` (frame) → `.card-body` (padded
 * stack) with `.card-title` and `.card-actions` inside. A full-bleed `<figure>`
 * (e.g. a cover image) is handled by the nested rules below.
 *
 * Card has no color variants — it's a neutral surface — so unlike the other
 * components it takes only the prefix.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function card(prefix = "") {
  const sel = (suffix = "") => `.${prefix}card${suffix}`;

  return {
    [sel()]: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      minWidth: "0",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      borderRadius: "var(--radius-box, 0.5rem)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      boxShadow:
        "0 1px 3px 0 rgb(0 0 0 / calc(var(--depth, 1) * 0.1)), 0 1px 2px -1px rgb(0 0 0 / calc(var(--depth, 1) * 0.1))",
      overflow: "hidden",

      // Full-bleed media (cover image) — cancel default figure margin and let
      // the image fill the card's width.
      "& > figure": {
        margin: "0",
      },
      "& > figure img": {
        display: "block",
        width: "100%",
        height: "auto",
      },
    },

    [sel("-body")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      flex: "1 1 auto",
      padding: "1.5rem",
    },

    [sel("-title")]: {
      fontSize: "1.125rem",
      fontWeight: "600",
      lineHeight: "1.4",
    },

    [sel("-actions")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "0.5rem",
      marginTop: "0.5rem",
    },

    // ClickableCard — the whole surface is a <button> (or a `render`-polymorphic
    // element). Resets button UA chrome, then adds hover lift + press + focus ring.
    [sel("-clickable")]: {
      display: "flex",
      width: "100%",
      padding: "0",
      margin: "0",
      appearance: "none",
      font: "inherit",
      textAlign: "left",
      cursor: "pointer",
      transitionProperty: "border-color, box-shadow, transform",
      transitionDuration: "0.15s",
      transitionTimingFunction: "ease",
      "&:hover": {
        borderColor: "color-mix(in oklab, var(--color-base-content) 25%, var(--color-base-300))",
        boxShadow:
          "0 4px 12px -2px rgb(0 0 0 / calc(var(--depth, 1) * 0.15)), 0 2px 6px -2px rgb(0 0 0 / calc(var(--depth, 1) * 0.1))",
      },
      "&:active": { transform: "scale(0.99)" },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "2px",
      },
      "&:disabled, &[data-disabled]": {
        opacity: "0.6",
        cursor: "not-allowed",
        transform: "none",
      },
    },

    // SelectableCard — a <label> wrapping a real checkbox/radio, visually
    // hidden (`-selectable-indicator`, same sr-only technique as the Dropzone's
    // hidden file input): no checkbox/radio glyph, just the card's own border
    // reading `:checked` via `:has()`. The control stays a real, keyboard-
    // operable, screen-reader-visible form field — only its own glyph is hidden.
    [sel("-selectable")]: {
      position: "relative",
      cursor: "pointer",
      transitionProperty: "border-color, box-shadow",
      transitionDuration: "0.15s",
      transitionTimingFunction: "ease",
      "&:hover": {
        borderColor: "color-mix(in oklab, var(--color-base-content) 25%, var(--color-base-300))",
      },
      "&:has(:checked)": {
        borderColor: "var(--color-primary)",
        boxShadow: "0 0 0 1px var(--color-primary)",
      },
      "&:has(:focus-visible)": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "2px",
      },
      "&:has(:disabled)": {
        opacity: "0.6",
        cursor: "not-allowed",
      },
    },
    // Compound with `.checkbox`/`.radio` (both classes land on the same
    // element) so this wins on specificity regardless of addBase() order —
    // `.checkbox`/`.radio` set an explicit `--checkbox-size`/`--radio-size`
    // width/height that would otherwise clobber the sr-only sizing here.
    [`.${prefix}checkbox${sel("-selectable-indicator")}, .${prefix}radio${sel("-selectable-indicator")}`]: {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: "0",
    },
  };
}
