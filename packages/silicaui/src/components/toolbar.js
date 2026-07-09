/**
 * The Toolbar component — a container grouping related controls with roving
 * focus. Behavior (arrow-key navigation, roving tabindex) is Base UI's Toolbar;
 * Silica styles the bar, its buttons, groups, links, and separators.
 *
 * Colorless. A compact base-200 bar with ghost-style buttons that highlight on
 * hover. `data-orientation="vertical"` stacks it. Separators read their own
 * `data-orientation` (a vertical rule inside a horizontal bar, and vice-versa).
 *
 * `data-size` ("sm" | (default) | "lg") sets `--toolbar-height`/
 * `--toolbar-padding-inline` and the bar's own `font-size`, which its native
 * `.toolbar-button`/`.toolbar-link` parts read — so they resize for free. That
 * cascade is real only for THOSE parts (this module owns both ends of it); a
 * bare `.btn`/`.input` dropped into a toolbar still needs its own explicit
 * `-sm`/`-lg` class, since those components pick their size via a literal
 * class, not an inherited variable.
 *
 * `data-variant="muted"` gives the bar a tinted, less prominent background —
 * for contextual/temporary toolbars (e.g. a bulk-selection action bar) that
 * should read as distinct from a standing one.
 *
 * `data-dividers` ("top" | "bottom" | "both") drops the bar's own box (full
 * border on every side) in favor of a rule on just the given edge(s) — for
 * embedding the toolbar as a header inside a Card/Section rather than as a
 * standalone floating bar.
 *
 * A `.toolbar-center` child switches the bar to a 3-column grid
 * (`start | center | end`, via `:has()`) so center content (e.g. tabs) stays
 * visually centered independent of how wide the start/end content is. Give
 * the toolbar exactly 3 direct children when using it: a start child, the
 * `.toolbar-center` child, and an end child (typically each wrapped in a
 * `ToolbarGroup`).
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function toolbar(prefix = "") {
  const sel = (suffix = "") => `.${prefix}toolbar${suffix}`;

  return {
    [sel()]: {
      "--toolbar-gap": "0.25rem",
      "--toolbar-height": "calc(var(--size-field, 0.25rem) * 8)",
      "--toolbar-padding-inline": "0.5rem",

      display: "inline-flex",
      alignItems: "center",
      gap: "var(--toolbar-gap)",
      width: "fit-content",
      maxWidth: "100%",
      padding: "0.25rem",
      fontSize: "0.8125rem",
      backgroundColor: "var(--color-base-200)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      borderRadius: "var(--radius-field, 0.25rem)",

      '&[data-orientation="vertical"]': {
        flexDirection: "column",
        alignItems: "stretch",
        width: "fit-content",
      },

      // ---- Center region: start | center | end grid --------------------
      [`&:has(> ${sel("-center")})`]: {
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        "& > *:first-child": { justifySelf: "start" },
        "& > *:last-child": { justifySelf: "end" },
      },

      // ---- Sizes ----------------------------------------------------------
      '&[data-size="sm"]': {
        "--toolbar-height": "calc(var(--size-field, 0.25rem) * 6)",
        "--toolbar-padding-inline": "0.375rem",
        padding: "0.1875rem",
        fontSize: "0.75rem",
      },
      '&[data-size="lg"]': {
        "--toolbar-height": "calc(var(--size-field, 0.25rem) * 10)",
        "--toolbar-padding-inline": "0.75rem",
        padding: "0.375rem",
        fontSize: "0.875rem",
      },

      // ---- Variant ----------------------------------------------------------
      '&[data-variant="muted"]': {
        backgroundColor:
          "color-mix(in oklab, var(--color-base-300) 45%, var(--color-base-100))",
        borderColor:
          "color-mix(in oklab, var(--color-base-300) 70%, transparent)",
      },

      // ---- Dividers: swap the full-border box for an edge rule -----------
      '&[data-dividers="top"]': {
        backgroundColor: "transparent",
        borderInlineWidth: "0",
        borderBottomWidth: "0",
        borderTopWidth: "var(--border, 1px)",
        borderTopStyle: "solid",
        borderTopColor: "var(--color-base-300)",
        borderRadius: "0",
      },
      '&[data-dividers="bottom"]': {
        backgroundColor: "transparent",
        borderInlineWidth: "0",
        borderTopWidth: "0",
        borderBottomWidth: "var(--border, 1px)",
        borderBottomStyle: "solid",
        borderBottomColor: "var(--color-base-300)",
        borderRadius: "0",
      },
      '&[data-dividers="both"]': {
        backgroundColor: "transparent",
        borderInlineWidth: "0",
        borderTopWidth: "var(--border, 1px)",
        borderTopStyle: "solid",
        borderTopColor: "var(--color-base-300)",
        borderBottomWidth: "var(--border, 1px)",
        borderBottomStyle: "solid",
        borderBottomColor: "var(--color-base-300)",
        borderRadius: "0",
      },
      // A muted variant keeps its tint even when dividers trim the border box.
      '&[data-variant="muted"][data-dividers]': {
        backgroundColor:
          "color-mix(in oklab, var(--color-base-300) 45%, var(--color-base-100))",
      },
    },

    // A subgroup of tightly-packed controls.
    [sel("-group")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.125rem",
    },

    // The center slot — see the parent `:has()` rule above.
    [sel("-center")]: {
      gridColumn: "2",
      justifySelf: "center",
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--toolbar-gap)",
    },

    // Ghost control: transparent until hovered/focused.
    [sel("-button")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.375rem",
      height: "var(--toolbar-height)",
      minWidth: "var(--toolbar-height)",
      paddingInline: "var(--toolbar-padding-inline)",
      fontSize: "inherit",
      fontWeight: "500",
      color: "var(--color-base-content)",
      backgroundColor: "transparent",
      borderWidth: "0",
      borderRadius: "calc(var(--radius-field, 0.25rem) * 0.75)",
      cursor: "pointer",
      transitionProperty: "background-color, color",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "& svg": { width: "1.15rem", height: "1.15rem", flexShrink: "0" },

      "&:hover": { backgroundColor: "var(--color-base-300)" },
      "&:focus-visible": {
        outline: "var(--focus-width, 2px) solid var(--color-primary)",
        outlineOffset: "1px",
      },
      "&[data-disabled], &:disabled": {
        opacity: "var(--disabled-opacity, 0.5)",
        cursor: "not-allowed",
        backgroundColor: "transparent",
      },
    },

    // Link styled to sit in the bar.
    [sel("-link")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      height: "var(--toolbar-height)",
      paddingInline: "var(--toolbar-padding-inline)",
      fontSize: "inherit",
      fontWeight: "500",
      color: "var(--color-base-content)",
      textDecoration: "none",
      borderRadius: "calc(var(--radius-field, 0.25rem) * 0.75)",
      "&:hover": {
        backgroundColor: "var(--color-base-300)",
        textDecoration: "underline",
      },
      "&:focus-visible": {
        outline: "var(--focus-width, 2px) solid var(--color-primary)",
        outlineOffset: "1px",
      },
    },

    // Divider between sections; reads its resolved orientation from Base UI.
    [sel("-separator")]: {
      alignSelf: "stretch",
      backgroundColor: "var(--color-base-300)",
      flexShrink: "0",
      '&[data-orientation="vertical"]': {
        width: "var(--border, 1px)",
        minHeight: "1.25rem",
        marginInline: "0.125rem",
      },
      '&[data-orientation="horizontal"]': {
        height: "var(--border, 1px)",
        marginBlock: "0.125rem",
      },
    },
  };
}
