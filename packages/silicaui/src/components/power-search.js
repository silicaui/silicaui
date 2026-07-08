/**
 * PowerSearch — a structured search field: free text plus removable
 * `field: value` filter chips, added via a field-picker → value-picker
 * popover flow. The popup content reuses `.select-popup`-style chrome
 * implicitly (it's rendered through `Popover`, styled here as `power-search-*`
 * lists) so it still reads as part of the same listbox family.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function powerSearch(prefix = "") {
  const sel = (suffix = "") => `.${prefix}power-search${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    [sel()]: {
      position: "relative",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "0.35rem",
      width: "100%",
      minHeight: "calc(var(--size-field, 0.25rem) * 10)",
      paddingInline: "0.5rem",
      paddingBlock: "0.3rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      fontSize: "0.875rem",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    },
    [`${sel()}:focus-within`]: {
      borderColor: "var(--color-primary)",
      boxShadow: "0 0 0 2px color-mix(in oklab, var(--color-primary) 25%, transparent)",
    },

    // ---- Term chip ----------------------------------------------------------
    [sel("-chip")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.15rem",
      paddingInlineStart: "0.1rem",
      borderRadius: "9999px",
      backgroundColor: "color-mix(in oklab, var(--color-primary) 12%, transparent)",
    },
    [sel("-chip-trigger")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.3rem",
      border: "0",
      background: "none",
      paddingInline: "0.5rem",
      paddingBlock: "0.2rem",
      borderRadius: "9999px",
      color: "var(--color-primary)",
      fontSize: "0.8125rem",
      cursor: "pointer",
      "&:hover": { backgroundColor: "color-mix(in oklab, var(--color-primary) 15%, transparent)" },
    },
    [sel("-chip-field")]: { fontWeight: "600", opacity: "0.85" },
    [sel("-chip-remove")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "1rem",
      height: "1rem",
      marginInlineEnd: "0.2rem",
      borderRadius: "9999px",
      border: "0",
      background: "none",
      color: "var(--color-primary)",
      opacity: "0.7",
      cursor: "pointer",
      "& svg": { width: "0.65rem", height: "0.65rem" },
      "&:hover": {
        opacity: "1",
        backgroundColor: "color-mix(in oklab, var(--color-primary) 25%, transparent)",
      },
    },

    // ---- Free-text field ------------------------------------------------------
    [sel("-input")]: {
      flex: "1 1 8rem",
      minWidth: "8rem",
      border: "0",
      outline: "0",
      background: "transparent",
      color: "inherit",
      font: "inherit",
      padding: "0.15rem",
      "&::placeholder": { color: muted(45) },
    },

    // ---- Add-filter trigger ----------------------------------------------------
    [sel("-add")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      flexShrink: "0",
      border: "1px dashed var(--color-base-300)",
      borderRadius: "9999px",
      paddingInline: "0.55rem",
      paddingBlock: "0.2rem",
      background: "none",
      color: muted(65),
      fontSize: "0.8125rem",
      cursor: "pointer",
      "& svg": { width: "0.8rem", height: "0.8rem" },
      "&:hover": { borderColor: "var(--color-base-content)", color: "var(--color-base-content)" },
    },

    // ---- Popover content: field picker / value picker --------------------------
    [sel("-field-list")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.1rem",
      minWidth: "10rem",
    },
    [sel("-field-item")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.4rem 0.5rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      border: "0",
      background: "none",
      textAlign: "start",
      font: "inherit",
      fontSize: "0.8125rem",
      color: "var(--color-base-content)",
      cursor: "pointer",
      "&:hover": { backgroundColor: "var(--color-base-200)" },
    },
    [sel("-value-picker")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      minWidth: "12rem",
    },
    [sel("-value-picker-back")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      alignSelf: "flex-start",
      border: "0",
      background: "none",
      padding: "0",
      color: muted(60),
      fontSize: "0.75rem",
      cursor: "pointer",
      "& svg": { width: "0.75rem", height: "0.75rem" },
      "&:hover": { color: "var(--color-base-content)" },
    },
    [sel("-value-picker-label")]: { fontSize: "0.8125rem", fontWeight: "600" },
    [sel("-option-list")]: { display: "flex", flexDirection: "column", gap: "0.1rem" },
    [sel("-value-form")]: { display: "flex", gap: "0.4rem" },
  };
}
