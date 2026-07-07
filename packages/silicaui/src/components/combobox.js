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

  return {
    [sel("-control")]: {
      position: "relative",
      display: "block",
      width: "100%",
    },

    // The text input reuses `.input`; reserve trailing room for the buttons.
    [sel("-input")]: {
      paddingInlineEnd: "3.25rem",
      cursor: "text",
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

    // Flush item (no leading check) — for Autocomplete, which has no indicator.
    // Reuses `.select-item`; only drops the indent the check would occupy.
    [sel("-item")]: {
      paddingInlineStart: "0.6rem",
    },

    // Empty state — Base UI renders it only when the list has no matches.
    [sel("-empty")]: {
      padding: "0.5rem 0.6rem",
      fontSize: "0.875rem",
      color: "color-mix(in oklab, var(--color-base-content) 55%, transparent)",
    },
  };
}
