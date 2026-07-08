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
    if (trigger instanceof HTMLElement) trigger.textContent = `+${overflowCount}`;
    for (let i = visibleCount; i < items.length; i++) panel.appendChild(items[i]!);
  };
  recompute();

  panel.setAttribute("hidden", "");
  bag.listen(trigger, "click", () => panel.toggleAttribute("hidden"));
  bag.listen(
    document,
    "click",
    (ev) => {
      if (!panel.hasAttribute("hidden") && !panel.contains(ev.target as Node) && !trigger.contains(ev.target as Node)) {
        panel.setAttribute("hidden", "");
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
