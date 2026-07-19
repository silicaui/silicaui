import { DisposeBag, parseParams, reducedMotion } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `marquee` — an auto-scrolling ticker. The motion itself is a CSS animation
 * authored on the component (§7 prefers CSS-only where it suffices); this
 * handler only wires `params.pauseOnHover` (default `true`) and keeps the
 * animation paused for editor preview, matching the autoplay-suppression rule
 * (§9.8) without a JS animation loop of its own.
 */
export const marquee: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const pauseOnHover = params.pauseOnHover !== false;
  const el = root as HTMLElement;
  const bag = new DisposeBag();

  const setPaused = (paused: boolean) => {
    el.style.animationPlayState = paused ? "paused" : "running";
  };
  // The CSS animation runs unconditionally — this handler is the reduced-
  // motion gate: prefers-reduced-motion keeps the ticker permanently still,
  // same as preview.
  const still = opts.preview === true || reducedMotion();
  setPaused(still);

  if (pauseOnHover && !still) {
    bag.listen(root, "mouseenter", () => setPaused(true));
    bag.listen(root, "mouseleave", () => setPaused(false));
  }

  return () => bag.dispose();
};
