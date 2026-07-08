/**
 * The SelectionList component — a selectable list of rows (single- or
 * multi-select), each with a leading Checkbox/Radio indicator.
 *
 * Colorless: the selected row reads `--color-primary` for its tint, matching
 * `tree-view.js`'s convention. The indicator itself is a real `.checkbox`/
 * `.radio` element (@wizeworks/silicaui-react reuses those components directly), so this
 * module only styles the row/label/description chrome around it.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function selectionList(prefix = "") {
  const sel = (suffix = "") => `.${prefix}selection-list${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.125rem",
      listStyle: "none",
      margin: "0",
      padding: "0.25rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-100)",
    },

    [sel("-item")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.65rem",
      paddingBlock: "0.5rem",
      paddingInline: "0.75rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      cursor: "pointer",
      userSelect: "none",
      outline: "0",
      transition: "background-color 0.15s",
      "&:hover": { backgroundColor: muted(6) },
    },
    [`${sel("-item")}[aria-selected="true"]`]: {
      backgroundColor: "color-mix(in oklab, var(--color-primary) 10%, transparent)",
    },
    [`${sel("-item")}:focus-visible`]: {
      outline: "2px solid var(--color-primary)",
      outlineOffset: "-2px",
    },
    [`${sel("-item")}[aria-disabled="true"]`]: {
      opacity: "0.45",
      cursor: "not-allowed",
    },

    [sel("-item-icon")]: {
      display: "inline-flex",
      flexShrink: "0",
      color: muted(65),
      "& svg": { width: "1.1rem", height: "1.1rem", flexShrink: "0" },
    },

    [sel("-item-body")]: {
      flex: "1 1 auto",
      minWidth: "0",
      display: "flex",
      flexDirection: "column",
      gap: "0.05rem",
    },
    [sel("-item-label")]: {
      fontSize: "0.875rem",
      fontWeight: "500",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    [sel("-item-description")]: {
      fontSize: "0.75rem",
      color: muted(60),
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  };
}
