/**
 * The Label components — a static `.label` and an animated `.floating-label`.
 *
 * Colorless.
 *
 * `.label` is a plain inline caption for a control (muted, icon-friendly). Use
 * it above an input or inside a `.join` as an addon.
 *
 * `.floating-label` wraps a control + a `<span>` caption that sits inside the
 * field at rest and floats up onto the top border once the field is focused or
 * filled. It keys off `:placeholder-shown`, so the control MUST carry a
 * placeholder (even a single space) for the "filled" state to resolve. Works
 * whether the `<span>` comes before or after the control (`:has()` handles the
 * ordering), and `select`/textarea are treated as always-floated when they hold
 * a value.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function label(prefix = "") {
  const sel = (suffix = "") => `.${prefix}label${suffix}`;
  const floating = `.${prefix}floating-label`;

  return {
    // ---- Static label ------------------------------------------------------
    [sel()]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      fontSize: "0.875rem",
      lineHeight: "1.25",
      // Real ink. A field label is text the reader MUST read to use the form,
      // so it doesn't get a faded fill — the smaller size already carries the
      // hierarchy against the field's own value.
      color: "var(--color-base-content)",

      "& svg": { width: "1em", height: "1em", flexShrink: "0" },
    },

    // A label wrapping its own control (checkbox/radio/toggle + caption), as
    // opposed to `.label` standing above a field. Two differences follow from
    // that: the whole row is the click target, and the caption is text the
    // reader is meant to READ — so it gets real ink, not the muted field-caption
    // color `.label` uses.
    [sel("-control")]: {
      cursor: "pointer",
      gap: "0.5rem",
      color: "var(--color-base-content)",

      "&:has(> input:disabled)": {
        cursor: "not-allowed",
        opacity: "0.5",
      },
    },

    [sel("-required")]: {
      color: "var(--color-error)",
      marginInlineStart: "0.125rem",
    },

    // ---- Floating label ----------------------------------------------------
    [floating]: {
      position: "relative",
      display: "block",

      "& > span": {
        position: "absolute",
        insetInlineStart: "calc(var(--size-field, 0.25rem) * 3)",
        top: "50%",
        // Anchor the shrink to the leading edge so it tucks into the corner.
        transformOrigin: "left center",
        transform: "translateY(-50%)",
        paddingInline: "0.25rem",
        maxWidth: "calc(100% - var(--size-field, 0.25rem) * 4)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "0.875rem",
        lineHeight: "1",
        // Real ink, same reason as `.label`: this caption IS the field's name.
        // At rest it sits in an empty field, so full-strength reads as the
        // label it is, not as a filled value.
        color: "var(--color-base-content)",
        backgroundColor: "var(--color-base-100)",
        pointerEvents: "none",
        transitionProperty: "transform, color, font-size",
        transitionDuration: "var(--duration, 150ms)",
        transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      },
    },

    // Floated state: filled (placeholder hidden), or a select/textarea holding
    // content. Sits on the top border with a shrunk caption.
    [`${floating}:has(> input:not(:placeholder-shown)) > span`]: floatUp(),
    [`${floating}:has(> textarea:not(:placeholder-shown)) > span`]: floatUp(),
    [`${floating}:has(> select) > span`]: floatUp(),

    // While focused, float AND tint the caption with the field's accent so it
    // reads as the active field (matches the input focus ring color).
    [`${floating}:focus-within > span`]: {
      ...floatUp(),
      color: "var(--input-accent, var(--color-primary))",
    },
  };
}

/** The floated position/scale, shared by every trigger selector. */
function floatUp() {
  return {
    transform: "translateY(-50%) scale(0.8)",
    top: "0",
    color: "var(--color-base-content)",
  };
}
