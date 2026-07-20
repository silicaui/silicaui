/**
 * The segmented-field chrome shared by `DateInput`, `TimeInput`,
 * `DateTimeInput`, and `DateRangeInput` — a bordered box (looks and focuses
 * like `.input`) holding individually-focusable segment cells
 * (`role="spinbutton"`, e.g. mm / dd / yyyy) separated by literal text
 * (the "/" or ":" the locale's own format inserts).
 *
 * Colored: `.segment-field-<name>` sets `--segment-field-accent`, read by the
 * focus ring and the focused-segment highlight.
 *
 * @param {string[]} colors - color names to generate `.segment-field-<name>` for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function segmentField(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}segment-field${suffix}`;
  const accent = "var(--segment-field-accent, var(--color-primary))";

  const base = {
    [sel()]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.1rem",
      width: "fit-content",
      height: "calc(var(--size-field, 0.25rem) * 10)",
      paddingInline: "0.6rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      // Same two-lever border as the other field-tier controls: the softened
      // resting tint if a color class set one, else the accent, else neutral.
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor:
        "var(--segment-field-border, var(--segment-field-accent, var(--color-base-300)))",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      fontSize: "0.875rem",
      fontVariantNumeric: "tabular-nums",
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

    [sel("-segment")]: {
      display: "inline-block",
      minWidth: "1ch",
      padding: "0.1rem 0.15rem",
      borderRadius: "0.2rem",
      textAlign: "center",
      cursor: "default",
      outline: "none",
      "&:focus": {
        backgroundColor: `color-mix(in oklab, ${accent} 20%, transparent)`,
        color: accent,
      },
      "&[data-placeholder]": {
        color: "color-mix(in oklab, var(--color-base-content) 45%, transparent)",
      },
      "&[aria-disabled]": {
        pointerEvents: "none",
      },
    },

    [sel("-literal")]: {
      color: "color-mix(in oklab, var(--color-base-content) 45%, transparent)",
      userSelect: "none",
    },

    // Sizes.
    [sel("-sm")]: {
      height: "calc(var(--size-field, 0.25rem) * 8)",
      fontSize: "0.8125rem",
      paddingInline: "0.5rem",
    },
    [sel("-lg")]: {
      height: "calc(var(--size-field, 0.25rem) * 12)",
      fontSize: "1rem",
      paddingInline: "0.75rem",
    },
  };

  // DateRangeInput — two DateInputs side by side.
  base[`.${prefix}date-range-input`] = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  };
  base[`.${prefix}date-range-input-sep`] = {
    color: "color-mix(in oklab, var(--color-base-content) 45%, transparent)",
  };

  // Accent drives the focus ring; the border lever softens the resting border
  // so rest -> focus-within is a visible change.
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--segment-field-accent": `var(--color-${name})`,
      "--segment-field-border": `color-mix(in oklab, var(--color-${name}) var(--field-border-tint, 45%), var(--color-base-100))`,
    };
  }

  return base;
}
