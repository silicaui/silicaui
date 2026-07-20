/**
 * DataTable chrome — the interactive shell around a `.table`.
 *
 * The base `.table` still styles the cells (this module deliberately does NOT
 * restyle `th`/`td`); `.data-table` only adds what a data grid needs on top:
 * a bordered scroll container, sortable-header buttons with a caret that lights
 * up per sort direction, a selected-row tint, a sticky header, skeleton/empty
 * bodies, and a pagination toolbar. The React `<DataTable>` (in the optional
 * `@wizeworks/silicaui-table` package) drives TanStack Table and hangs these classes on the
 * markup.
 *
 * Colored: a `.data-table-<name>` class only sets `--dt-accent`, which the sort
 * hover + selected-row tint read — so the accent is orthogonal to everything
 * else, same as the rest of Silica.
 *
 * @param {string[]} colors - color names to generate `.data-table-<name>` for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function dataTable(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}data-table${suffix}`;
  const accent = "var(--dt-accent, var(--color-primary))";

  const base = {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      width: "100%",
    },

    // Bordered, horizontally scrollable frame around the table.
    [sel("-scroll")]: {
      width: "100%",
      overflowX: "auto",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "var(--border, 1px) solid var(--color-base-200)",
    },

    // Sticky header: cap the height and pin the header row over scrolling body.
    [`${sel("-sticky")} ${sel("-scroll")}`]: {
      maxHeight: "var(--dt-max-height, 28rem)",
      overflowY: "auto",
    },
    [`${sel("-sticky")} thead th`]: {
      position: "sticky",
      top: "0",
      zIndex: "1",
      backgroundColor: "var(--color-base-100)",
    },

    // Sortable header — a borderless button that fills the cell.
    [sel("-sort")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35em",
      font: "inherit",
      fontWeight: "600",
      color: "inherit",
      background: "none",
      border: "0",
      padding: "0",
      margin: "0",
      cursor: "pointer",
      userSelect: "none",
      "&:hover": { color: accent },
      "&:focus-visible": {
        outline: `2px solid ${accent}`,
        outlineOffset: "2px",
        borderRadius: "var(--radius-selector, 0.25rem)",
      },
    },
    // The stacked up/down caret. Both faint by default; the active direction lit.
    [sel("-sort-icon")]: {
      display: "inline-flex",
      "& svg": {
        width: "0.85em",
        height: "0.85em",
        flexShrink: "0",
      },
    },
    [`${sel("-sort-icon")} [data-part]`]: {
      opacity: "0.35",
      transition: "opacity 0.15s ease",
    },
    [`${sel("-sort")}[data-sort="asc"] ${sel("-sort-icon")} [data-part="up"]`]: {
      opacity: "1",
      color: accent,
    },
    [`${sel("-sort")}[data-sort="desc"] ${sel("-sort-icon")} [data-part="down"]`]:
      {
        opacity: "1",
        color: accent,
      },

    // Selected-row tint (a translucent wash of the accent — oklab, not oklch).
    [`${sel()} tbody tr[data-selected]`]: {
      backgroundColor: `color-mix(in oklab, ${accent} 12%, transparent)`,
    },
    [sel("-row-clickable")]: { cursor: "pointer" },

    // Empty body.
    [sel("-empty")]: {
      textAlign: "center",
      padding: "2.5rem 1rem",
      color: "var(--color-base-content)",
    },

    // Loading skeleton bar (sits inside a cell).
    [sel("-skeleton")]: {
      display: "block",
      height: "0.85rem",
      width: "70%",
      borderRadius: "var(--radius-field, 0.25rem)",
    },

    // Pagination toolbar under the table.
    [sel("-pagination")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
      flexWrap: "wrap",
      fontSize: "0.875rem",
      color: "var(--color-base-content)",
    },
    [sel("-pager")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
    },
  };

  // A color class only re-points the accent var.
  for (const name of colors) {
    base[sel(`-${name}`)] = { "--dt-accent": `var(--color-${name})` };
  }

  return base;
}
