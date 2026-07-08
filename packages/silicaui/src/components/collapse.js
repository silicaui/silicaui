/**
 * The Collapse component — a disclosure panel built on native
 * `<details>`/`<summary>`, so open/close, keyboard, and screen-reader support
 * come for free (no JS). Several with a shared `name` form an exclusive
 * accordion (native HTML behavior).
 *
 * The CSS class is `.details`, NOT `.collapse` — Tailwind v4 ships a built-in
 * `.collapse { visibility: collapse }` utility (for table row/column
 * collapsing), and utility-layer rules always beat component base-layer rules
 * regardless of source order or specificity. A `.collapse` class here would
 * still get this component's box styling (border/bg/radius all still apply,
 * since Tailwind's utility only sets `visibility`), but Tailwind's
 * `visibility: collapse` would ALSO apply and silently make the whole thing
 * invisible while it still occupies layout space — exactly the "empty box"
 * bug this dodges. `Collapse`/`CollapseTitle`/`CollapseContent` (the public
 * React names) are unaffected; only the underlying class token changed.
 *
 * Colorless. The `.details-title` (the `<summary>`) hides the default marker
 * and draws its own chevron via `::after`, which rotates when the parent is
 * `[open]`. `.details-content` holds the body. `-ghost` drops the surface for
 * a flush, borderless accordion.
 *
 * Toggle is instant by design — animating `<details>` height needs bleeding-edge
 * CSS (`interpolate-size`/`::details-content`) that isn't universally shipped;
 * only the chevron animates, which is safe everywhere.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function collapse(prefix = "") {
  const sel = (suffix = "") => `.${prefix}details${suffix}`;

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
