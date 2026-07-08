/**
 * The InputGroup component — a positioning shell that lets a leading/trailing
 * icon or button sit inside an `.input` (search icon, password show/hide,
 * clear button, a country-code prefix, …).
 *
 * `.input-group` is the relative-positioned shell; `.input-group-start` /
 * `.input-group-end` are absolutely-placed slots for the decoration itself;
 * `.input-group-btn` is an interactive icon button that can live inside a slot.
 * The `.input` living inside the shell reserves room for its decorations via
 * `.input-affix-start` / `.input-affix-end` (defined in `input.js`, applied
 * alongside the base `.input` class).
 *
 * Slot sizing is intentionally fixed (not per Input `size`), matching the
 * existing Combobox/Autocomplete trailing-button precedent.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function inputGroup(prefix = "") {
  const sel = (suffix = "") => `.${prefix}input-group${suffix}`;

  const slot = {
    position: "absolute",
    top: "0",
    bottom: "0",
    marginBlock: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "1.5rem",
    color: "color-mix(in oklab, var(--color-base-content) 60%, transparent)",
    "& svg": { width: "1rem", height: "1rem", flexShrink: "0" },
  };

  return {
    [sel()]: {
      position: "relative",
      display: "block",
      width: "100%",
    },

    // Leading slot — usually a decorative, non-interactive icon.
    [sel("-start")]: {
      ...slot,
      insetInlineStart: "0.75rem",
      pointerEvents: "none",
    },

    // Trailing slot — decorative or interactive (holds `.input-group-btn`s).
    [sel("-end")]: {
      ...slot,
      insetInlineEnd: "0.5rem",
      gap: "0.125rem",
    },

    // An icon button living inside a slot (password toggle, clear button, …).
    [sel("-btn")]: {
      position: "relative",
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
      pointerEvents: "auto",
      "& svg": { width: "1rem", height: "1rem", flexShrink: "0" },
      "&:hover": { color: "var(--color-base-content)" },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "1px",
      },
      "&:disabled": { cursor: "not-allowed", opacity: "0.5" },
    },
  };
}
