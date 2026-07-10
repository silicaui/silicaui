import { DisposeBag, reducedMotion, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `reveal` — the ON SCROLL trigger for @wizeworks/silicaui's assignable entrance
 * animations. Sets `data-sui-inview` on the root once it enters the viewport,
 * which a `.sui-reveal-*` preset class (packages/silicaui/src/components/
 * animations.js) reads to transition from its hidden to visible state.
 * `params.once` (default `true`) stops observing after the first reveal;
 * `params.threshold` is passed straight to `IntersectionObserver`. Suppressed
 * (reveals immediately, no observer) in preview, under reduced motion, or
 * without `IntersectionObserver` — same guard shape as `counter`.
 */
export const reveal: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const once = params.once !== false;
  const threshold = typeof params.threshold === "number" ? params.threshold : undefined;
  const bag = new DisposeBag();

  const show = () => root.setAttribute("data-sui-inview", "true");

  if (opts.preview || reducedMotion() || typeof IntersectionObserver === "undefined") {
    show();
    return () => bag.dispose();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        show();
        if (once) observer.unobserve(root);
      }
    },
    threshold != null ? { threshold } : undefined,
  );
  observer.observe(root);
  bag.add(() => observer.disconnect());

  return () => bag.dispose();
};
