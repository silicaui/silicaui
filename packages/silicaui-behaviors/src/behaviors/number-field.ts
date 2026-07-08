import { DisposeBag, ownParts } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `number-field` — a native `<input type="number">` plus `increment`/
 * `decrement` step buttons. The CSS here has no Base-UI-only selectors (just
 * `:disabled`/`:hover`), so the input itself is the real source of truth;
 * the buttons just call `stepUp()`/`stepDown()` and fire the events a plain
 * keyboard-driven change would.
 */
export const numberField: BehaviorHandler = (root, _opts) => {
  const input = root.querySelector('input[type="number"]') as HTMLInputElement | null;
  const inc = ownParts(root, "increment")[0] as HTMLButtonElement | undefined;
  const dec = ownParts(root, "decrement")[0] as HTMLButtonElement | undefined;
  const bag = new DisposeBag();
  if (!input) return () => bag.dispose();

  const sync = () => {
    if (inc) inc.disabled = input.max !== "" && Number(input.value || 0) >= Number(input.max);
    if (dec) dec.disabled = input.min !== "" && Number(input.value || 0) <= Number(input.min);
  };
  const fire = () => {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    sync();
  };

  if (inc) {
    bag.listen(inc, "click", () => {
      input.stepUp();
      fire();
    });
  }
  if (dec) {
    bag.listen(dec, "click", () => {
      input.stepDown();
      fire();
    });
  }
  bag.listen(input, "input", sync);
  sync();

  return () => bag.dispose();
};
