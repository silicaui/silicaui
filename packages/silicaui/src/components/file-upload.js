/**
 * FileUpload — a Dropzone plus a managed preview list. The dropzone itself is
 * unstyled here (reuses `.dropzone`); this only styles the list of
 * accepted-file rows rendered below it: a thumbnail/icon, name + size, and a
 * remove button.
 *
 * Colorless.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function fileUpload(prefix = "") {
  const sel = (suffix = "") => `.${prefix}file-upload${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      width: "100%",
    },

    [sel("-list")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      margin: "0",
      padding: "0",
      listStyle: "none",
    },

    [sel("-item")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.5rem 0.75rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
    },

    [sel("-item-thumb")]: {
      flexShrink: "0",
      width: "2.5rem",
      height: "2.5rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      objectFit: "cover",
      backgroundColor: "var(--color-base-200)",
    },
    [sel("-item-icon")]: {
      flexShrink: "0",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "2.5rem",
      height: "2.5rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      backgroundColor: "var(--color-base-200)",
      color: muted(60),
      "& svg": { width: "1.15rem", height: "1.15rem", flexShrink: "0" },
    },

    [sel("-item-meta")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.1rem",
      minWidth: "0",
      flex: "1 1 auto",
    },
    [sel("-item-name")]: {
      fontSize: "0.85rem",
      fontWeight: "500",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    [sel("-item-size")]: {
      fontSize: "0.75rem",
      color: muted(60),
    },

    [sel("-item-remove")]: {
      flexShrink: "0",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "1.75rem",
      height: "1.75rem",
      borderRadius: "9999px",
      border: "0",
      background: "transparent",
      color: muted(60),
      cursor: "pointer",
      "& svg": { width: "1rem", height: "1rem", flexShrink: "0" },
      "&:hover": {
        backgroundColor: "var(--color-base-200)",
        color: "var(--color-error)",
      },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "2px",
      },
    },

    [sel("-rejections")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.2rem",
      fontSize: "0.78rem",
      color: "var(--color-error)",
    },
  };
}
