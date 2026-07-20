import { affordanceButton, textClearance, BOX } from "../lib/field-affordance.js";

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
 * Colored: `.multi-select-<name>` sets `--multi-select-accent` (focus ring, chip
 * fill/text, focused border) and `--multi-select-border` (a softened tint of the
 * same color for the resting border), matching the other field-tier controls.
 *
 * @param {string[]} colors - color names to generate `.multi-select-<name>` for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function multiSelect(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}multi-select${suffix}`;
  const accent = "var(--multi-select-accent, var(--color-primary))";


  const base = {
    [sel()]: {
      position: "relative",
      display: "flex",
      width: "100%",
      minHeight: "calc(var(--size-field, 0.25rem) * 10)",
      paddingInlineStart: "0.5rem",
      paddingInlineEnd: textClearance(2),
      paddingBlock: "0.3rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      // Same two-lever border as the other field-tier controls: the softened
      // resting tint if a color class set one, else the accent, else neutral.
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor:
        "var(--multi-select-border, var(--multi-select-accent, var(--color-base-300)))",
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
      ...affordanceButton(1),
      "&:disabled": { display: "none" },
    },

    // Open/close chevron.
    [sel("-trigger")]: {
      ...affordanceButton(0),
      "& svg": {
        width: BOX,
        height: BOX,
        transition: "transform var(--duration, 150ms) var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      },
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

  // Accent drives the focus ring + chip fill; the border lever softens the
  // resting border so rest -> focus-within is a visible change.
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--multi-select-accent": `var(--color-${name})`,
      "--multi-select-border": `color-mix(in oklab, var(--color-${name}) var(--field-border-tint, 45%), var(--color-base-100))`,
    };
  }

  return base;
}
