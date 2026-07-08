/**
 * The PhoneInput component's only bespoke rule — a fixed, compact width for
 * the country-code `Select` trigger when it's joined (via `Join`) to the
 * national-number `Input`. Everything else is composed from `Select`,
 * `Input`, and `Join`, which is why this module is so small.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function phoneInput(prefix = "") {
  const sel = (suffix = "") => `.${prefix}phone-input${suffix}`;

  return {
    [sel("-country")]: {
      width: "6.5rem",
      flexShrink: "0",
      flexGrow: "0",
    },
  };
}
