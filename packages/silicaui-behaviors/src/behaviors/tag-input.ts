import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `tag-input` — a chip-based multi-value text field. Type and press Enter (or
 * comma) to add; Backspace on an empty field removes the last chip; each chip's
 * `close` part removes that one.
 *
 * Nothing existing modelled this. `selection-list` and `toggle-group` both
 * choose among items that ALREADY EXIST in the markup; this one creates them
 * from typed text, which is a different contract, not a parameter.
 *
 * New chips are cloned from a `template` part rather than built in JS. That
 * keeps every class name in the authored markup, so the runtime stays correct
 * under a `SilicaProvider` prefix — a handler that constructed
 * `<span class="tag-input-chip">` itself would silently emit unprefixed classes
 * and render unstyled in exactly the apps that opted into a prefix.
 *
 * The value travels on a real `input[type=hidden]`, so the field submits with a
 * normal form post and the `form` behavior needs no special case. Chips are
 * comma-joined, matching what the React component posts.
 */
export const tagInput: BehaviorHandler = (root, _opts) => {
  const params = parseParams(root);
  const bag = new DisposeBag();
  const field = ownParts(root, "input")[0] as HTMLInputElement | undefined;
  const template = ownParts(root, "template")[0] as HTMLTemplateElement | undefined;
  const hidden = root.querySelector('input[type="hidden"]') as HTMLInputElement | null;
  if (!field || !template) return () => bag.dispose();

  const max = typeof params.max === "number" ? params.max : Infinity;
  const allowDuplicates = params.allowDuplicates === true;

  const chips = () => ownParts(root, "item");
  const labelOf = (chip: Element) => chip.textContent?.trim() ?? "";

  const sync = () => {
    const values = chips().map(labelOf);
    if (hidden) {
      hidden.value = values.join(",");
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
    }
    // The placeholder belongs to the empty state only — with chips present it
    // reads as a stray value sitting next to real ones.
    if (params.placeholder != null) {
      field.placeholder = values.length ? "" : String(params.placeholder);
    }
    root.dispatchEvent(new CustomEvent("sui:change", { detail: { value: values }, bubbles: true }));
  };

  const wireRemove = (chip: Element) => {
    const btn = chip.querySelector('[data-sui-part="close"]');
    if (!btn) return;
    bag.listen(btn, "click", (ev) => {
      ev.stopPropagation();
      chip.remove();
      sync();
      field.focus();
    });
  };

  const add = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    // Clear BEFORE the dedupe/max checks, matching React's `addTag`: a rejected
    // duplicate still empties the field there, and a handler that kept the text
    // would leave the two layers behaving differently for the same input.
    field.value = "";
    const existing = chips().map(labelOf);
    if (!allowDuplicates && existing.includes(value)) return;
    if (existing.length >= max) return;

    const frag = template.content.cloneNode(true) as DocumentFragment;
    const chip = frag.firstElementChild;
    if (!chip) return;
    const label = chip.querySelector('[data-sui-part="label"]') ?? chip;
    label.textContent = value;
    const btn = chip.querySelector('[data-sui-part="close"]');
    if (btn) btn.setAttribute("aria-label", `Remove ${value}`);

    root.insertBefore(chip, field);
    wireRemove(chip);
    sync();
  };

  for (const chip of chips()) wireRemove(chip);

  bag.listen(field, "keydown", (ev) => {
    const e = ev as KeyboardEvent;
    if (e.key === "Enter" || e.key === ",") {
      // Enter inside a form would submit before the chip is committed.
      e.preventDefault();
      add(field.value);
    } else if (e.key === "Backspace" && field.value === "") {
      const all = chips();
      const last = all[all.length - 1];
      if (last) {
        last.remove();
        sync();
      }
    }
  });

  if (params.addOnBlur === true) {
    bag.listen(field, "blur", () => add(field.value));
  }

  // Clicking the box's own padding focuses the field, without stealing focus
  // from a chip's remove button (which is why the target check is required).
  bag.listen(root, "mousedown", (ev) => {
    if (ev.target === root) {
      ev.preventDefault();
      field.focus();
    }
  });

  sync();
  return () => bag.dispose();
};
