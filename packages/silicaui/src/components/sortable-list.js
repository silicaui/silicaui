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
      color: muted(45),
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
