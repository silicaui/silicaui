import { affordanceIcon, INSET } from "../lib/field-affordance.js";

/**
 * The Select (listbox) surface — the visual half of the Base-UI-backed `Select`,
 * a fully-styled, keyboard-driven, optionally-multi listbox. Distinct from the
 * native-`<select>` `.select` field (see `select.js` / `NativeSelect`): the
 * TRIGGER here reuses `.select` (and its `.select-<color>` / `.select-<size>`
 * modifiers) for pixel-parity, then these sub-parts swap the CSS caret for a
 * flex chevron `Icon` and add the portalled popup, items, groups, and separators.
 *
 * Base UI owns positioning + roving focus + typeahead + dismissal; this paints
 * the surface. Items highlight via `[data-highlighted]` (keyboard OR pointer),
 * mark the current choice via `[data-selected]`, and dim via `[data-disabled]`.
 * The popup width tracks the trigger through `--anchor-width`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function selectMenu(prefix = "") {
  const sel = (suffix = "") => `.${prefix}select${suffix}`;

  return {
    // Trigger reuses `.select` + its color/size modifiers; override the caret.
    [sel("-trigger")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem",
      textAlign: "start",
      backgroundImage: "none", // drop the native CSS caret; the Icon draws it
      // The native field reserves overlap room for its caret; this Icon is a flex
      // item, so the pad IS the affordance inset — which lands the chevron at the
      // same distance from the trailing edge as the native caret it replaces.
      paddingInlineEnd: INSET,

      "&[data-popup-open]": {
        borderColor: "var(--select-accent, var(--color-primary))",
      },
    },

    // Selected-value label (Base UI resolves it from the `items` map).
    [sel("-value")]: {
      minWidth: "0",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    // Placeholder — shown only while nothing is selected (the trigger carries
    // `[data-placeholder]` in that state).
    [sel("-placeholder")]: {
      display: "none",
      minWidth: "0",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "color-mix(in oklab, var(--color-base-content) 55%, transparent)",
    },
    [`${sel("-trigger")}[data-placeholder] ${sel("-placeholder")}`]: {
      display: "block",
    },

    // Trailing chevron; flips while the popup is open.
    [sel("-icon")]: affordanceIcon(),
    [`${sel("-trigger")}[data-popup-open] ${sel("-icon")} svg`]: {
      transform: "rotate(180deg)",
    },

    // Portalled popup surface — width matches the trigger, height is capped.
    [sel("-popup")]: {
      zIndex: "var(--z-popover, 70)",
      minWidth: "var(--anchor-width)",
      maxHeight: "min(var(--available-height), 18rem)",
      overflowY: "auto",
      padding: "0.375rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      boxShadow: "0 10px 30px -10px rgb(0 0 0 / 0.22)",
      outline: "none",
      transformOrigin: "var(--transform-origin)",
      transitionProperty: "opacity, transform",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "scale(0.96)",
      },
    },

    [sel("-item")]: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.4rem 0.6rem",
      paddingInlineStart: "1.75rem", // room for the leading check indicator
      fontSize: "0.875rem",
      lineHeight: "1.4",
      borderRadius: "var(--radius-field, 0.25rem)",
      color: "inherit",
      cursor: "default",
      userSelect: "none",
      outline: "none",

      "& svg": { width: "1rem", height: "1rem", flexShrink: "0" },
      "&[data-highlighted]": { backgroundColor: "var(--color-base-200)" },
      "&[data-selected]": { fontWeight: "600" },
      "&[data-disabled]": { opacity: "0.5", pointerEvents: "none" },
    },

    // The check for the selected item (Base UI mounts it only when selected).
    [sel("-item-indicator")]: {
      position: "absolute",
      insetInlineStart: "0.5rem",
      display: "inline-flex",
      alignItems: "center",
      color: "var(--color-primary)",
    },

    [sel("-group-label")]: {
      padding: "0.375rem 0.6rem",
      fontSize: "0.75rem",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      opacity: "0.55",
    },

    [sel("-separator")]: {
      height: "var(--border, 1px)",
      margin: "0.375rem -0.375rem",
      backgroundColor: "var(--color-base-200)",
    },

    // Scroll affordances — appear only when the list overflows the popup.
    [sel("-scroll-arrow")]: {
      position: "sticky",
      zIndex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "1.25rem",
      backgroundColor: "var(--color-base-100)",
      color: "color-mix(in oklab, var(--color-base-content) 60%, transparent)",
      cursor: "default",
      "&[data-direction='up']": { top: "0" },
      "&[data-direction='down']": { bottom: "0" },
      "& svg": { width: "1rem", height: "1rem" },
    },
  };
}
