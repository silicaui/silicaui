/**
 * The Collapse component — a disclosure panel built on native
 * `<details>`/`<summary>`, so open/close, keyboard, and screen-reader support
 * come for free (no JS). Several with a shared `name` form an exclusive
 * accordion (native HTML behavior).
 *
 * Colorless. The `.collapse-title` (the `<summary>`) hides the default marker
 * and draws its own chevron via `::after`, which rotates when the parent is
 * `[open]`. `.collapse-content` holds the body. `-ghost` drops the surface for
 * a flush, borderless accordion.
 *
 * Toggle is instant by design — animating `<details>` height needs bleeding-edge
 * CSS (`interpolate-size`/`::details-content`) that isn't universally shipped;
 * only the chevron animates, which is safe everywhere.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function collapse(prefix = "") {
  const sel = (suffix = "") => `.${prefix}collapse${suffix}`;

  return {
    [sel()]: {
      borderRadius: "var(--radius-box, 0.5rem)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      overflow: "hidden",
    },

    // The clickable header (the <summary>).
    [sel("-title")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
      padding: "1rem 1.25rem",
      fontWeight: "600",
      cursor: "pointer",
      userSelect: "none",
      listStyle: "none",

      // Drop the native disclosure triangle across engines.
      "&::-webkit-details-marker": { display: "none" },

      // Self-drawn chevron (points down; flips up when open).
      "&::after": {
        content: '""',
        width: "0.5rem",
        height: "0.5rem",
        flexShrink: "0",
        borderRight: "2px solid currentColor",
        borderBottom: "2px solid currentColor",
        transform: "rotate(45deg)",
        opacity: "0.5",
        transitionProperty: "transform",
        transitionDuration: "var(--duration, 150ms)",
        transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      },
    },
    [`${sel()}[open] > ${sel("-title")}::after`]: {
      transform: "rotate(-135deg)",
    },

    // The disclosed body.
    [sel("-content")]: {
      padding: "0 1.25rem 1.25rem",
    },

    // Borderless / flush variant (good for stacked accordions).
    [sel("-ghost")]: {
      borderRadius: "0",
      borderWidth: "0",
      backgroundColor: "transparent",
    },
  };
}
