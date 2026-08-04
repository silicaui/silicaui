import { DisposeBag, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `marquee` — an auto-scrolling ticker. The motion itself is a CSS animation
 * on the component's `track` part (§7 prefers CSS-only where it suffices), and
 * so is the pause: this handler only toggles `data-sui-paused` on the root and
 * lets `marquee.js` decide what that means. That keeps `animation-play-state`
 * with exactly ONE owner — the stylesheet — so the handler never has to know
 * which descendant is actually animated, and an inline style can never end up
 * fighting the `:hover` rule.
 *
 * What's left for JS is the part CSS genuinely can't express: the editor-canvas
 * freeze (§9.8 autoplay suppression), and `params.pauseOnHover` for markup that
 * carries the behavior marker without the `.marquee-pause-on-hover` class
 * (hand-authored HTML; the component macro emits both together).
 *
 * `prefers-reduced-motion` is deliberately NOT handled here — marquee.js
 * already stops the animation and hands the strip back as a plain scroller
 * under that media query, which is the better outcome: content past the first
 * viewport stays reachable instead of being stranded behind `overflow: hidden`.
 * Freezing it from JS as well would only re-strand it.
 */
export const marquee: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const pauseOnHover = params.pauseOnHover !== false;
  const bag = new DisposeBag();

  const setPaused = (paused: boolean) => {
    if (paused) root.setAttribute("data-sui-paused", "");
    else root.removeAttribute("data-sui-paused");
  };

  // In the editor canvas the strip stays still, permanently — a preview that
  // scrolls itself makes the thing impossible to click.
  if (opts.preview === true) {
    setPaused(true);
    return () => {
      setPaused(false);
      bag.dispose();
    };
  }

  if (pauseOnHover) {
    bag.listen(root, "mouseenter", () => setPaused(true));
    bag.listen(root, "mouseleave", () => setPaused(false));
    // Keyboard parity: tabbing to a link inside the strip should stop it moving
    // out from under the focus ring, same as hovering does.
    bag.listen(root, "focusin", () => setPaused(true));
    bag.listen(root, "focusout", () => setPaused(false));
  }

  return () => {
    setPaused(false);
    bag.dispose();
  };
};
