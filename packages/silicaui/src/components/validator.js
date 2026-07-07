/**
 * The Validator component — validity-driven coloring for form controls.
 *
 * Colorless (semantic error/success only). Add `.validator` alongside `.input`,
 * `.select`, `.textarea`, etc. It recolors the control by (a) the native
 * `:user-invalid` / `:user-valid` states — which only engage AFTER the user has
 * interacted, so a pristine form doesn't shout — and (b) an explicit
 * `[aria-invalid]` attribute for controlled React validation.
 *
 * It works by writing the SAME accent variables the field components already
 * read (`--input-accent`, `--select-accent`, `--textarea-accent`), so the
 * border and focus ring flip to error/success with no per-field wiring. As a
 * fallback it also sets `border-color`/`outline-color` directly for any control
 * that doesn't route through an accent var.
 *
 * `.validator-hint` is an inline message that stays hidden until the control it
 * immediately follows is invalid.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function validator(prefix = "") {
  const sel = (suffix = "") => `.${prefix}validator${suffix}`;

  const invalid = {
    "--input-accent": "var(--color-error)",
    "--select-accent": "var(--color-error)",
    "--textarea-accent": "var(--color-error)",
    borderColor: "var(--color-error)",
  };
  const valid = {
    "--input-accent": "var(--color-success)",
    "--select-accent": "var(--color-success)",
    "--textarea-accent": "var(--color-success)",
    borderColor: "var(--color-success)",
  };

  return {
    // Invalid: native post-interaction state OR explicit aria flag.
    [`${sel()}:user-invalid`]: invalid,
    [`${sel()}[aria-invalid='true']`]: invalid,

    // Valid: only after interaction (never on a pristine field).
    [`${sel()}:user-valid`]: valid,
    [`${sel()}[aria-invalid='false']`]: valid,

    // ---- Hint --------------------------------------------------------------
    [sel("-hint")]: {
      display: "none",
      fontSize: "0.75rem",
      lineHeight: "1.25",
      marginTop: "0.25rem",
      color: "var(--color-error)",
    },
    // Reveal the hint only when the control right before it is invalid.
    [`${sel()}:user-invalid + ${sel("-hint")}`]: { display: "block" },
    [`${sel()}[aria-invalid='true'] + ${sel("-hint")}`]: { display: "block" },
  };
}
