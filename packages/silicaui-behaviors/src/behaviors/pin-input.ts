import { DisposeBag, ownParts } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `pin-input` — real single-char `<input>` `cell`s (index-based, native
 * value/maxlength do the work), unlike `date-segment`'s buffer-accumulate
 * model on non-form-associated divs. Each keystroke is a whole commit with
 * immediate auto-advance; Backspace-on-empty steps back; paste distributes
 * characters starting at the focused cell.
 */
export const pinInput: BehaviorHandler = (root, _opts) => {
  const cells = ownParts(root, "cell") as HTMLInputElement[];
  const hidden = root.querySelector('input[type="hidden"]') as HTMLInputElement | null;
  const bag = new DisposeBag();
  if (!cells.length) return () => bag.dispose();

  const sync = () => {
    if (hidden) {
      hidden.value = cells.map((c) => c.value).join("");
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
    }
    root.toggleAttribute("data-complete", cells.every((c) => c.value !== ""));
  };

  cells.forEach((cell, i) => {
    cell.maxLength = 1;
    bag.listen(cell, "input", () => {
      cell.value = cell.value.replace(/[^0-9a-zA-Z]/g, "").slice(-1);
      cell.toggleAttribute("data-filled", cell.value !== "");
      if (cell.value && i < cells.length - 1) cells[i + 1]!.focus();
      sync();
    });
    bag.listen(cell, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      if (e.key === "Backspace" && cell.value === "" && i > 0) {
        e.preventDefault();
        const prev = cells[i - 1]!;
        prev.value = "";
        prev.removeAttribute("data-filled");
        prev.focus();
        sync();
      } else if (e.key === "ArrowLeft" && i > 0) {
        e.preventDefault();
        cells[i - 1]!.focus();
      } else if (e.key === "ArrowRight" && i < cells.length - 1) {
        e.preventDefault();
        cells[i + 1]!.focus();
      }
    });
    bag.listen(cell, "paste", (ev) => {
      const e = ev as ClipboardEvent;
      const text = e.clipboardData?.getData("text") ?? "";
      if (!text) return;
      e.preventDefault();
      const chars = text.split("");
      for (let j = 0; j < chars.length && i + j < cells.length; j++) {
        const target = cells[i + j]!;
        target.value = chars[j]!;
        target.toggleAttribute("data-filled", true);
      }
      cells[Math.min(cells.length - 1, i + chars.length - 1)]?.focus();
      sync();
    });
  });

  sync();
  return () => bag.dispose();
};
