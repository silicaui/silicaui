import { DisposeBag, ownParts } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `phone-input` — a `country` `<select>` (options carry `data-dial`) joined
 * with a digits `input`; a hidden input carries the combined `+{dial}{digits}`
 * value for form submission. No React-only mechanism was involved in the
 * original — the country list is plain static data, ported verbatim into
 * the `PhoneInput` macro's expansion (see `component.ts`).
 */
export const phoneInput: BehaviorHandler = (root, _opts) => {
  const country = (ownParts(root, "country")[0] ?? root.querySelector("select")) as HTMLSelectElement | null;
  const input = (ownParts(root, "input")[0] ?? root.querySelector('input[type="tel"]')) as HTMLInputElement | null;
  const hidden = root.querySelector('input[type="hidden"]') as HTMLInputElement | null;
  const bag = new DisposeBag();
  if (!country || !input) return () => bag.dispose();

  const sync = () => {
    const dial = country.selectedOptions[0]?.getAttribute("data-dial") ?? "";
    const digits = input.value.replace(/[^0-9]/g, "");
    if (hidden) {
      hidden.value = digits ? `+${dial}${digits}` : "";
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  bag.listen(country, "change", sync);
  bag.listen(input, "input", sync);
  sync();

  return () => bag.dispose();
};
