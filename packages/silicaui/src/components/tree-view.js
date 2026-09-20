import { inkOfRole } from "../lib/ink.js";
import { hitArea } from "../lib/tap-target.js";
/**
 * TreeView — a hierarchical, keyboard-navigable tree (page trees, file/section
 * hierarchies, nav builders).
 *
 * Structure follows the ARIA tree pattern: `ul.tree[role=tree]` →
 * `li.tree-item[role=treeitem]` (the focusable node, roving tabindex) → an inner
 * `.tree-node` row (the highlight/click target: chevron + optional icon + label)
 * and, when expanded, a nested `ul.tree-group[role=group]`. Depth indentation is
 * driven by a `--tree-depth` custom prop set inline by the React component.
 *
 * Colorless: the selected row reads `--color-primary` for its tint/text.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function treeView(prefix = "") {
  const sel = (suffix = "") => `.${prefix}tree${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    [sel()]: {
      listStyle: "none",
      margin: "0",
      padding: "0",
      fontSize: "1rem",
      color: "var(--color-base-content)",
    },
    [sel("-group")]: {
      listStyle: "none",
      margin: "0",
      padding: "0",
    },
    [sel("-item")]: {
      // The focus ring lives on the inner row, not the whole (nested) subtree.
      outline: "0",
    },

    // The visible row: highlight + click target.
    [sel("-node")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.4rem",
      width: "100%",
      paddingBlock: "0.3rem",
      paddingInlineEnd: "0.5rem",
      paddingInlineStart: "calc(0.4rem + var(--tree-depth, 0) * 1.15rem)",
      borderRadius: "var(--radius-field, 0.25rem)",
      cursor: "pointer",
      userSelect: "none",
      "&:hover": { backgroundColor: muted(7) },
    },
    [`${sel("-node")}[data-selected]`]: {
      backgroundColor: "color-mix(in oklab, var(--color-primary) 14%, transparent)",
      color: inkOfRole("primary"),
    },
    [`${sel("-node")}[data-disabled]`]: {
      opacity: "0.45",
      cursor: "not-allowed",
    },
    [`${sel("-item")}:focus-visible > ${sel("-node")}`]: {
      outline: "2px solid var(--color-primary)",
      outlineOffset: "-2px",
    },

    // Drag-to-reorder (opt-in via `onMove`). The dragged row dims; the
    // hovered drop target draws a line at the targeted edge (before/after) or
    // a full-row ring ("inside" — dropping as a child).
    [`${sel("-node")}[data-dragging]`]: { opacity: "0.4" },
    [`${sel("-node")}[data-drag-over="inside"]`]: {
      outline: "2px solid var(--color-primary)",
      outlineOffset: "-2px",
      backgroundColor: "color-mix(in oklab, var(--color-primary) 10%, transparent)",
    },
    [`${sel("-node")}[data-drag-over="before"], ${sel("-node")}[data-drag-over="after"]`]: {
      position: "relative",
    },
    [`${sel("-node")}[data-drag-over="before"]::before, ${sel("-node")}[data-drag-over="after"]::after`]: {
      content: '""',
      position: "absolute",
      insetInlineStart: "calc(0.4rem + var(--tree-depth, 0) * 1.15rem)",
      insetInlineEnd: "0.3rem",
      height: "2px",
      borderRadius: "1px",
      backgroundColor: "var(--color-primary)",
    },
    [`${sel("-node")}[data-drag-over="before"]::before`]: { top: "-1px" },
    [`${sel("-node")}[data-drag-over="after"]::after`]: { bottom: "-1px" },

    // Expand/collapse chevron (rotates when open). Leaves get a spacer instead.
    [sel("-toggle")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      width: "1.1rem",
      height: "1.1rem",
      padding: "0",
      border: "0",
      background: "none",
      cursor: "pointer",
      color: muted(55),
      transition: "transform 0.15s ease, color 0.15s ease",
      "&:hover": { color: "var(--color-base-content)" },
      "& svg": { width: "0.8rem", height: "0.8rem", flexShrink: "0" },
    
      // 17.6px square against WCAG 2.2 SC 2.5.8's 24px minimum — the chevron keeps
      // its size, the target grows around it. See lib/tap-target.js.
      ...hitArea(17.6, 17.6),
    },
    [`${sel("-toggle")}[data-expanded]`]: { transform: "rotate(90deg)" },
    [sel("-toggle-spacer")]: {
      flexShrink: "0",
      width: "1.1rem",
    },

    [sel("-node-icon")]: {
      display: "inline-flex",
      flexShrink: "0",
      color: muted(65),
      "& svg": { width: "1rem", height: "1rem", flexShrink: "0" },
    },
    [sel("-node-label")]: {
      flex: "1 1 auto",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    // Inline rename (opt-in via `onRename`): the field replaces the label in
    // place and inherits its type, so committing a name doesn't shift the row.
    [sel("-rename")]: {
      flex: "1 1 auto",
      minWidth: "0",
      font: "inherit",
      lineHeight: "inherit",
      color: "var(--color-base-content)",
      backgroundColor: "var(--color-base-100)",
      border: "1px solid var(--color-primary)",
      borderRadius: "var(--radius-field, 0.25rem)",
      paddingBlock: "0.05rem",
      paddingInline: "0.25rem",
      outline: "0",
    },

    // The system's own focus ring, on controls that were falling back to the
    // BROWSER's. The browser's ring is visible -- Chromium adapts it -- but it is
    // 1px where this system's is 2px, it carries no offset, it ignores the theme,
    // and its shape is the browser's choice, not this system's. Focus should not change
    // appearance depending on which control a person is standing on.
    // Found by a sweep of all 116 component pages (P07, docs/personas/issues/092).
    [`${sel("-toggle")}:focus-visible`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "var(--focus-offset, 2px)",
    },
  };
}
