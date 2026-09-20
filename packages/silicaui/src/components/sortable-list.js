/**
 * SortableList chrome — the visual surface for a dnd-kit reorderable list.
 *
 * dnd-kit owns the drag behavior (sensors, collision, keyboard, transforms);
 * this styles the list rows and the drag handle, plus the lifted look while a row
 * is being dragged (`[data-dragging]`). The React `<SortableList>` (in the
 * optional `@wizeworks/silicaui-dnd` package) drives dnd-kit and hangs these classes on the
 * markup; `transform`/`transition` are applied inline by dnd-kit, so this module
 * deliberately doesn't set them.
 *
 * Colorless: the dragged row's border reads `--color-primary`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function sortableList(prefix = "") {
  const sel = (suffix = "") => `.${prefix}sortable${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    [sel("-list")]: {
      listStyle: "none",
      margin: "0",
      padding: "0",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      width: "100%",
    },

    [sel("-item")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
      padding: "0.6rem 0.75rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      // A row that renders ONE element for its contents gets that element
      // stretched across the row. Without this, a single wrapper is a flex item
      // at its natural width and the row is mostly empty - which is exactly what
      // the documented `renderItem` example produces. Scoped to `:only-child` so
      // the ordinary case (a handle, a label and a badge side by side) keeps its
      // own sizing.
      "& > :only-child": { flex: "1 1 auto", minWidth: "0" },
    },
    [`${sel("-item")}[data-dragging]`]: {
      borderColor: "var(--color-primary)",
      boxShadow: "0 8px 24px -6px rgb(0 0 0 / 0.25)",
      position: "relative",
      zIndex: "1",
    },

    // Grip handle.
    [sel("-handle")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      width: "1.5rem",
      height: "1.5rem",
      padding: "0",
      border: "0",
      background: "none",
      // 65%, not 45%. A grip is a glyph rather than text, so RULE #3's readable-ink
      // probe exempts it -- and under that exemption there was no floor at all. It
      // is still the ONLY thing on the row that says the list can be reordered, so
      // it is a user-interface component and owes 3:1 (WCAG 1.4.11). Measured on
      // the real themes: 45% was 4.09:1 on a dark surface and 2.88:1 on a light
      // one, which fails; 65% is 7.32:1 dark and 5.31:1 light, and still reads as
      // quieter than the label beside it, which is at 16:1.
      color: muted(65),
      cursor: "grab",
      touchAction: "none",
      "&:hover": { color: "var(--color-base-content)" },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "2px",
        borderRadius: "var(--radius-selector, 0.25rem)",
      },
      "&:active": { cursor: "grabbing" },
      "& svg": { width: "1.1rem", height: "1.1rem", flexShrink: "0" },
    },
    [`${sel("-item")}[data-dragging] ${sel("-handle")}`]: {
      cursor: "grabbing",
    },
  };
}
