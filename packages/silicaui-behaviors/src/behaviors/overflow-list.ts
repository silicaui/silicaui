import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `overflow-list` — real `item`s reparent into a hidden `panel` (behind a
 * `trigger` showing "+N") once they no longer fit their row, then reparent
 * back once they do — the SAME elements move, so their event listeners and
 * content survive (no clone-and-lose-interactivity). `params.maxVisible`
 * forces a fixed count instead of measuring (used when real layout isn't
 * available — e.g. under jsdom, or a host that wants deterministic wrapping).
 */
export const overflowList: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const items = ownParts(root, "item");
  const trigger = ownParts(root, "trigger")[0];
  const panel = ownParts(root, "panel")[0];
  const bag = new DisposeBag();
  if (!items.length || !trigger || !panel) return () => bag.dispose();

  const home = trigger.parentElement ?? root;

  const measure = (): number => {
    if (typeof params.maxVisible === "number") return params.maxVisible;
    const available = (home as HTMLElement).clientWidth;
    if (!available) return items.length;
    let used = 0;
    for (let i = 0; i < items.length; i++) {
      used += (items[i] as HTMLElement).getBoundingClientRect().width;
      if (used > available) return i;
    }
    return items.length;
  };

  const recompute = () => {
    for (const item of items) if (item.parentElement !== home) home.insertBefore(item, trigger);
    const visibleCount = Math.max(0, Math.min(items.length, measure()));
    const overflowCount = items.length - visibleCount;
    trigger.toggleAttribute("hidden", overflowCount === 0);
    if (trigger instanceof HTMLElement) {
      trigger.textContent = `+${overflowCount}`;
      // "+3" is a poor accessible name; say what the button does.
      trigger.setAttribute("aria-label", `Show ${overflowCount} more item${overflowCount === 1 ? "" : "s"}`);
    }
    for (let i = visibleCount; i < items.length; i++) panel.appendChild(items[i]!);
  };
  recompute();

  // Disclosure pattern: expanded state on the trigger, Escape closes and
  // returns focus, outside click closes. (The panel holds arbitrary
  // reparented items, so it is NOT a menu — see the OverflowList macro.)
  panel.setAttribute("hidden", "");
  const setOpen = (openNow: boolean) => {
    panel.toggleAttribute("hidden", !openNow);
    trigger.setAttribute("aria-expanded", String(openNow));
  };
  trigger.setAttribute("aria-expanded", "false");
  bag.listen(trigger, "click", () => setOpen(panel.hasAttribute("hidden")));
  bag.listen(root, "keydown", (ev) => {
    if ((ev as KeyboardEvent).key !== "Escape" || panel.hasAttribute("hidden")) return;
    ev.preventDefault();
    setOpen(false);
    (trigger as HTMLElement).focus?.();
  });
  bag.listen(
    document,
    "click",
    (ev) => {
      if (!panel.hasAttribute("hidden") && !panel.contains(ev.target as Node) && !trigger.contains(ev.target as Node)) {
        setOpen(false);
      }
    },
    { capture: true },
  );

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(recompute);
    observer.observe(home as HTMLElement);
    bag.add(() => observer.disconnect());
  }

  void opts;
  return () => bag.dispose();
};
