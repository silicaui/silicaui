import { DisposeBag, parseParams } from "../dom";
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
  setPaused(opts.preview === true);

  if (pauseOnHover) {
    bag.listen(root, "mouseenter", () => setPaused(true));
    bag.listen(root, "mouseleave", () => setPaused(opts.preview === true));
  }

  return () => bag.dispose();
};
