/**
 * The Field component — an accessible form field that wires a label, control,
 * description, and error together (ids + aria + validity). Behavior is Base UI's
 * Field (it tracks dirty/touched/valid/invalid and associates the parts);
 * Silica styles them. Use it around any Silica control.
 *
 * Colorless (semantic error). `.field-error` only renders when the field is
 * invalid (Base UI controls that). When the control is marked `[data-invalid]`
 * its accent flips to error, so the border + focus ring turn red to match.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */

/**
 * Drives a validation status onto whichever control it lands on. (Helper —
 * `field()` itself is defined below.)
 *
 * Sets the accent solid AND clears `--*-border` back to `initial`. That reset
 * is load-bearing: a decorative color class (`.input-primary`) sets the border
 * lever on the element itself to a soft tint, and would otherwise survive this
 * rule and leave an invalid field wearing a primary border. Falling the lever
 * back to `initial` drops it through to the accent — so a status border is
 * always solid, which is the whole point of a status.
 */
function statusAccent(name) {
  const color = `var(--color-${name})`;
  const out = {};
  for (const part of ["input", "select", "textarea"]) {
    out[`--${part}-accent`] = color;
    out[`--${part}-border`] = "initial";
  }
  return out;
}

export function field(prefix = "") {
  const sel = (suffix = "") => `.${prefix}field${suffix}`;
  const status = (suffix = "") => `.${prefix}field-status${suffix}`;

  const base = {
    [sel()]: {
      "--field-gap": "0.375rem",
      "--field-ring-reach": "calc(var(--focus-offset, 2px) + var(--focus-width, 2px) + 2px)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: "var(--field-gap)",
    },

    [sel("-label")]: {
      fontSize: "0.875rem",
      fontWeight: "500",
      lineHeight: "1.25",
      color: "var(--color-base-content)",
    },

    [sel("-description")]: {
      fontSize: "0.75rem",
      lineHeight: "1.4",
      color: "color-mix(in oklab, var(--color-base-content) 65%, transparent)",
    },

    [sel("-error")]: {
      fontSize: "0.75rem",
      lineHeight: "1.4",
      color: "var(--color-error)",
    },

    // When Base UI flags the control invalid, drive the shared input accent to
    // error so border + focus ring recolor (same lever the inputs already read).
    [`.${prefix}input[data-invalid], .${prefix}select[data-invalid], .${prefix}textarea[data-invalid]`]:
      statusAccent("error"),

    // ---- FieldStatus (error/warning/success/loading, attached or detached) --
    // `data-status` lands on the control itself (FieldControl stamps it, mirroring
    // the `[data-invalid]` lever above) so a color class isn't needed per field.
    [`.${prefix}input[data-status="error"], .${prefix}select[data-status="error"], .${prefix}textarea[data-status="error"]`]:
      statusAccent("error"),
    [`.${prefix}input[data-status="warning"], .${prefix}select[data-status="warning"], .${prefix}textarea[data-status="warning"]`]:
      statusAccent("warning"),
    [`.${prefix}input[data-status="success"], .${prefix}select[data-status="success"], .${prefix}textarea[data-status="success"]`]:
      statusAccent("success"),

    // A status panel that follows flattens the control's bottom corners so the
    // two read as one continuous shape (attached mode only).
    [`${sel()}:has(${status("-attached")}) .${prefix}input, ${sel()}:has(${status("-attached")}) .${prefix}select, ${sel()}:has(${status("-attached")}) .${prefix}textarea`]:
      { borderEndStartRadius: "0", borderEndEndRadius: "0" },

    [status()]: {
      display: "flex",
      alignItems: "center",
      gap: "0.375rem",
      fontSize: "0.75rem",
      lineHeight: "1.4",
      color: "var(--field-status-color, var(--color-base-content))",
      "& svg": { width: "1rem", height: "1rem", flexShrink: "0" },
    },

    // Floating status (`floating` prop): taken out of flow entirely, so it
    // never pushes sibling fields up or down when it appears/disappears —
    // it overlays whatever sits below the field instead. Positioned off the
    // `.field` root (made `position: relative` above), not the control, so
    // it settles under the field's whole flow (control + description).
    [status("-floating")]: {
      position: "absolute",
      insetInlineStart: "0",
      insetInlineEnd: "0",
      top: "100%",
      zIndex: "1",
    },
    [`${status("-floating")}${status("-detached")}`]: {
      marginBlockStart: "var(--field-gap, 0.375rem)",
    },
    [`${status("-floating")}${status("-attached")}`]: {
      marginBlockStart: "0",
    },

    [status("-attached")]: {
      marginBlockStart: "calc(var(--field-gap, 0.375rem) * -1)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 3)",
      paddingBlock: "0.5rem",
      borderBottomLeftRadius: "var(--radius-field, 0.25rem)",
      borderBottomRightRadius: "var(--radius-field, 0.25rem)",
      backgroundColor:
        "color-mix(in oklab, var(--field-status-color, var(--color-base-content)) 12%, var(--color-base-100))",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--field-status-color, var(--color-base-300))",
      borderTopWidth: "0",
    },

    // When a control is focused inside a Field with an attached status panel,
    // draw ONE continuous ring around the whole compound shape (control +
    // panel), keeping the SAME gapped look as every other control's own
    // `outline`/`outline-offset` ring — just built from a double `box-shadow`
    // (an inner shadow matching the surface color stands in for the gap, an
    // outer shadow draws the ring) since a real `outline` can't merge across
    // a touching sibling. Each piece clips its shadow with `clip-path` so it
    // only shows on the OUTER perimeter: the control's ring is cut flush at
    // its bottom edge, the panel's ring is cut flush at its top edge, so the
    // two never double up into a visible line at the shared seam.
    [`${sel()}:has(${status("-attached")}) .${prefix}input:focus`]: {
      outline: "none",
      boxShadow:
        "0 0 0 var(--focus-offset, 2px) var(--color-base-100), 0 0 0 calc(var(--focus-offset, 2px) + var(--focus-width, 2px)) var(--input-accent, var(--color-primary))",
      clipPath:
        "inset(calc(-1 * var(--field-ring-reach)) calc(-1 * var(--field-ring-reach)) 0 calc(-1 * var(--field-ring-reach)))",
    },
    [`${sel()}:has(${status("-attached")}) .${prefix}select:focus`]: {
      outline: "none",
      boxShadow:
        "0 0 0 var(--focus-offset, 2px) var(--color-base-100), 0 0 0 calc(var(--focus-offset, 2px) + var(--focus-width, 2px)) var(--select-accent, var(--color-primary))",
      clipPath:
        "inset(calc(-1 * var(--field-ring-reach)) calc(-1 * var(--field-ring-reach)) 0 calc(-1 * var(--field-ring-reach)))",
    },
    [`${sel()}:has(${status("-attached")}) .${prefix}textarea:focus`]: {
      outline: "none",
      boxShadow:
        "0 0 0 var(--focus-offset, 2px) var(--color-base-100), 0 0 0 calc(var(--focus-offset, 2px) + var(--focus-width, 2px)) var(--textarea-accent, var(--color-primary))",
      clipPath:
        "inset(calc(-1 * var(--field-ring-reach)) calc(-1 * var(--field-ring-reach)) 0 calc(-1 * var(--field-ring-reach)))",
    },
    [`${sel()}:has(.${prefix}input:focus, .${prefix}select:focus, .${prefix}textarea:focus) ${status("-attached")}`]:
      {
        boxShadow:
          "0 0 0 var(--focus-offset, 2px) var(--color-base-100), 0 0 0 calc(var(--focus-offset, 2px) + var(--focus-width, 2px)) var(--field-status-color, var(--color-primary))",
        clipPath:
          "inset(0 calc(-1 * var(--field-ring-reach)) calc(-1 * var(--field-ring-reach)) calc(-1 * var(--field-ring-reach)))",
      },
  };

  for (const [name, color] of [
    ["error", "var(--color-error)"],
    ["warning", "var(--color-warning)"],
    ["success", "var(--color-success)"],
  ]) {
    base[status(`-${name}`)] = { "--field-status-color": color };
  }

  return base;
}
