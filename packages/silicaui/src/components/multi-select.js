import { colorVariantRules } from "../color-variants.js";
import { inkOfRole } from "../lib/ink.js";
import { affordanceButton, textClearance, BOX } from "../lib/field-affordance.js";
import { hitArea } from "../lib/tap-target.js";

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
      fontSize: "1rem",
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
      fontSize: "1rem",
      lineHeight: "1.4",
      backgroundColor: `color-mix(in oklab, ${accent} 15%, transparent)`,
      // The chip paints the role colour as TEXT, so it needs the INK form, not
      // the fill the palette tunes. `color-variants.js` has emitted `--multi-select-ink`
      // for every colour all along and nothing read it: a terracotta chip
      // measured 2.78:1 in light, under WCAG AA, while the same chip through
      // the ink measures 6.42. `power-search.js` — the third copy of this exact
      // rule — already used `inkOfRole`, which is why only two of the three
      // were failing. docs/personas/issues/019 and /024 are the same shape.
      color: `var(--multi-select-ink, ${inkOfRole("primary")})`,
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
      // No `opacity` here any more. At 0.7 over a 15%-tint chip this measured
      // 2.78:1 in light — under WCAG 1.4.11's 3:1 for a non-text control — while
      // the label beside it, the same colour at full strength, was legible. The
      // x is not less important than the word it removes; it is already smaller,
      // which is where the hierarchy belongs (root CLAUDE.md RULE #3).
      ...hitArea(16, 16),
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
      fontSize: "1rem",
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
    [sel("-xs")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 6)",
      fontSize: "0.75rem",
    },
    [sel("-sm")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 8)",
      fontSize: "0.875rem",
    },
    [sel("-md")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 10)",
      fontSize: "1rem",
    },
    [sel("-lg")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 12)",
      fontSize: "1.125rem",
    },
    [sel("-xl")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 14)",
      fontSize: "1.25rem",
    },

    // The system's own focus ring, on controls that were falling back to the
    // BROWSER's. The browser's ring is visible -- Chromium adapts it -- but it is
    // 1px where this system's is 2px, it carries no offset, it ignores the theme,
    // and its shape is the browser's choice, not this system's. Focus should not change
    // appearance depending on which control a person is standing on.
    // Found by a sweep of all 116 component pages (P07, docs/personas/issues/092).
    [`${sel("-chip-remove")}:focus-visible`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "var(--focus-offset, 2px)",
    },
  };

  // Accent drives the focus ring + chip fill; the border lever softens the
  // resting border so rest -> focus-within is a visible change.
  Object.assign(base, colorVariantRules("multiSelect", colors, prefix));

  return base;
}
