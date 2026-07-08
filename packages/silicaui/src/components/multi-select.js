/**
 * MultiSelect — a searchable, multi-value listbox (Base UI Combobox in
 * `multiple` mode, using its dedicated `Chip`/`Chips`/`ChipRemove` parts).
 *
 * The outer `.multi-select` is the bordered field (looks and focuses like
 * `.tag-input`): a flex-wrapping box holding removable `.multi-select-chip`s
 * and a borderless `.multi-select-input` that grows to fill the row, plus
 * trailing clear (×) / open (chevron) buttons reusing the Combobox icon-button
 * treatment. The dropdown list REUSES the Select surface (`.select-popup`,
 * `.select-item`, `.select-item-indicator`, `.combobox-empty`) so every listbox
 * in the system reads identically — this module only adds the chip field.
 *
 * Colored: `.multi-select-<name>` sets `--multi-select-accent`, read by the
 * focus ring and chip fill/text.
 *
 * @param {string[]} colors - color names to generate `.multi-select-<name>` for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function multiSelect(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}multi-select${suffix}`;
  const accent = "var(--multi-select-accent, var(--color-primary))";

  const iconBtn = {
    position: "absolute",
    top: "0",
    bottom: "0",
    marginBlock: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.5rem",
    height: "1.5rem",
    padding: "0",
    border: "0",
    background: "none",
    borderRadius: "9999px",
    color: "color-mix(in oklab, var(--color-base-content) 60%, transparent)",
    cursor: "pointer",
    "& svg": { width: "1rem", height: "1rem" },
    "&:hover": { color: "var(--color-base-content)" },
    "&:focus-visible": {
      outline: "2px solid var(--color-primary)",
      outlineOffset: "1px",
    },
  };

  const base = {
    [sel()]: {
      position: "relative",
      display: "flex",
      width: "100%",
      minHeight: "calc(var(--size-field, 0.25rem) * 10)",
      paddingInlineStart: "0.5rem",
      paddingInlineEnd: "3.25rem",
      paddingBlock: "0.3rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      fontSize: "0.875rem",
      cursor: "text",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    },

    [`${sel()}:focus-within`]: {
      borderColor: accent,
      boxShadow: `0 0 0 2px color-mix(in oklab, ${accent} 25%, transparent)`,
    },

    [`${sel()}[data-disabled]`]: {
      opacity: "0.6",
      cursor: "not-allowed",
      backgroundColor: "var(--color-base-200)",
    },

    // The chip flow — Base UI's own composite-list container.
    [sel("-chips")]: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "0.35rem",
      flex: "1 1 auto",
      minWidth: "0",
    },

    [sel("-chip")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      maxWidth: "100%",
      paddingInline: "0.5rem",
      paddingBlock: "0.15rem",
      borderRadius: "var(--radius-selector, 1rem)",
      fontSize: "0.8125rem",
      lineHeight: "1.4",
      backgroundColor: `color-mix(in oklab, ${accent} 15%, transparent)`,
      color: accent,
      "&[data-highlighted]": {
        boxShadow: `0 0 0 2px color-mix(in oklab, ${accent} 40%, transparent)`,
      },
    },

    [sel("-chip-remove")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "1rem",
      height: "1rem",
      borderRadius: "9999px",
      border: "0",
      padding: "0",
      cursor: "pointer",
      color: "inherit",
      background: "none",
      opacity: "0.7",
      "&:hover": {
        opacity: "1",
        backgroundColor: `color-mix(in oklab, ${accent} 25%, transparent)`,
      },
      "& svg": { width: "0.7rem", height: "0.7rem", flexShrink: "0" },
    },

    // The typeahead field that grows to fill the remaining row.
    [sel("-input")]: {
      flex: "1 1 6rem",
      minWidth: "6rem",
      border: "0",
      outline: "0",
      background: "transparent",
      color: "inherit",
      font: "inherit",
      fontSize: "0.875rem",
      padding: "0.15rem",
      "&::placeholder": {
        color: "color-mix(in oklab, var(--color-base-content) 45%, transparent)",
      },
    },

    // Clear (×) — sits left of the chevron; Base UI disables it when empty.
    [sel("-clear")]: {
      ...iconBtn,
      insetInlineEnd: "1.9rem",
      "&:disabled": { display: "none" },
    },

    // Open/close chevron.
    [sel("-trigger")]: {
      ...iconBtn,
      insetInlineEnd: "0.4rem",
      "& svg": { width: "1rem", height: "1rem", transition: "transform 0.2s ease" },
      "&[data-popup-open] svg": { transform: "rotate(180deg)" },
    },

    // Sizes.
    [sel("-sm")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 8)",
      fontSize: "0.8125rem",
    },
    [sel("-lg")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 12)",
      fontSize: "1rem",
    },
  };

  for (const name of colors) {
    base[sel(`-${name}`)] = { "--multi-select-accent": `var(--color-${name})` };
  }

  return base;
}
