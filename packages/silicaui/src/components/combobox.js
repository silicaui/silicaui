import { affordanceButton, textClearance, BOX } from "../lib/field-affordance.js";

/**
 * The Combobox / Autocomplete control chrome — the input-field half of the
 * Base-UI-backed `Combobox` and `Autocomplete` (a searchable, filtered listbox).
 *
 * The popup, list, items, group labels and separators REUSE the Select surface
 * (`.select-popup`, `.select-item`, `.select-item-indicator`, …) so the two read
 * identically; this module only adds the text-input control: a field wrapper
 * (`.combobox-control`) around an `.input`-styled `.combobox-input`, plus the
 * trailing clear (×) and open (chevron) buttons and the empty-state row. The
 * chevron flips while the popup is open (`[data-popup-open]`), and the clear
 * button hides itself when there's nothing to clear (`:disabled`).
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function combobox(prefix = "") {
  const sel = (suffix = "") => `.${prefix}combobox${suffix}`;

  return {
    [sel("-control")]: {
      position: "relative",
      display: "block",
      width: "100%",
    },

    // The text input reuses `.input`; reserve trailing room for the buttons.
    [sel("-input")]: {
      paddingInlineEnd: textClearance(2),
      cursor: "text",
    },

    // Clear (×) — sits left of the chevron; Base UI disables it when empty.
    [sel("-clear")]: {
      ...affordanceButton(1, { unborderedWrapper: true }),
      "&:disabled": { display: "none" },
    },

    // Open/close chevron.
    [sel("-trigger")]: {
      ...affordanceButton(0, { unborderedWrapper: true }),
      "& svg": {
        width: BOX,
        height: BOX,
        transition: "transform var(--duration, 150ms) var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      },
      "&[data-popup-open] svg": { transform: "rotate(180deg)" },
    },

    // Flush item (no leading check) — for Autocomplete, which has no indicator.
    // Reuses `.select-item`; only drops the indent the check would occupy.
    [sel("-item")]: {
      paddingInlineStart: "0.6rem",
    },

    // Empty state — Base UI renders it only when the list has no matches.
    [sel("-empty")]: {
      padding: "0.5rem 0.6rem",
      fontSize: "0.875rem",
      color: "var(--color-base-content)",
    },
  };
}
