/**
 * TagInput — a multi-value chip field.
 *
 * The outer `.tag-input` looks and focuses like an `.input`: a flex-wrapping box
 * with a border + focus ring that holds removable `.tag-input-chip`s and a
 * borderless `.tag-input-field` that grows to fill the row. The React
 * `<TagInput>` manages the tag array, key handling, and remove buttons.
 *
 * Colored: a `.tag-input-<name>` class sets `--tag-accent`, which the focus ring
 * and chip fill/text read — so chips can match any semantic color.
 *
 * @param {string[]} colors - color names to generate `.tag-input-<name>` for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function tagInput(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}tag-input${suffix}`;
  const accent = "var(--tag-accent, var(--color-primary))";

  const base = {
    [sel()]: {
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
      cursor: "text",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    },

    // Focus ring when the inner field has focus.
    [`${sel()}:focus-within`]: {
      borderColor: accent,
      boxShadow: `0 0 0 2px color-mix(in oklab, ${accent} 25%, transparent)`,
    },

    [`${sel()}[data-disabled]`]: {
      opacity: "0.6",
      cursor: "not-allowed",
      backgroundColor: "var(--color-base-200)",
    },

    // A chip.
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
    },
    [sel("-chip-label")]: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    // The remove (×) button on a chip.
    [sel("-remove")]: {
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

    // The free-text field that grows to fill the remaining row.
    [sel("-field")]: {
      flex: "1 1 6rem",
      minWidth: "6rem",
      border: "0",
      outline: "0",
      background: "transparent",
      color: "inherit",
      font: "inherit",
      padding: "0.15rem",
      "&::placeholder": {
        color: "color-mix(in oklab, var(--color-base-content) 45%, transparent)",
      },
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
    base[sel(`-${name}`)] = { "--tag-accent": `var(--color-${name})` };
  }

  return base;
}
