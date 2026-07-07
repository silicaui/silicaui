import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * Shared implementation behind `scrollspy` and `toc`: `spy` parts are links
 * (`href="#id"`) tracked against the section they point to; the in-view one
 * gets `aria-current="true"` for a nav/TOC to style. `toc` differs only in its
 * default intersection threshold (a smaller sliver of a heading counts as
 * "current" for a table of contents than a full scrollspy section does).
 */
function spyBehavior(defaultThreshold: number): BehaviorHandler {
  return (root, _opts) => {
    const params = parseParams(root);
    const threshold = typeof params.threshold === "number" ? params.threshold : defaultThreshold;
    const spies = ownParts(root, "spy");
    const bag = new DisposeBag();

    const targets = new Map<Element, Element>();
    for (const spy of spies) {
      const href = spy.getAttribute("href") ?? "";
      if (!href.startsWith("#")) continue;
      const section = document.getElementById(href.slice(1));
      if (section) targets.set(section, spy);
    }
    if (targets.size === 0) return () => bag.dispose();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const spy = targets.get(entry.target);
          if (!spy) continue;
          if (entry.isIntersecting) spy.setAttribute("aria-current", "true");
          else spy.removeAttribute("aria-current");
        }
      },
      { threshold },
    );
    for (const section of targets.keys()) observer.observe(section);
    bag.add(() => observer.disconnect());

    return () => bag.dispose();
  };
}

export const scrollspy = spyBehavior(0.5);
export const toc = spyBehavior(0.1);
