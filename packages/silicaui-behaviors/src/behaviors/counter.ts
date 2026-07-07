import { DisposeBag, parseParams, reducedMotion } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `counter` — animates the root's own text content from 0 to a target number
 * once it scrolls into view. `params.target` overrides the parsed initial
 * text (so authored content can show the final value statically); `duration`
 * defaults to 1500ms. Suppressed (jumps straight to the final value) in
 * preview, under reduced motion, or without `IntersectionObserver`.
 */
export const counter: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const el = root as HTMLElement;
  const target =
    typeof params.target === "number"
      ? params.target
      : Number((el.textContent ?? "0").replace(/[^0-9.-]/g, "")) || 0;
  const duration = typeof params.duration === "number" ? params.duration : 1500;
  const bag = new DisposeBag();

  const setValue = (n: number) => {
    el.textContent = String(Math.round(n));
  };

  if (opts.preview || reducedMotion() || typeof IntersectionObserver === "undefined") {
    setValue(target);
    return () => bag.dispose();
  }

  let played = false;
  const animate = () => {
    if (played) return;
    played = true;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(target * t);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) animate();
  });
  observer.observe(el);
  bag.add(() => observer.disconnect());

  return () => bag.dispose();
};
