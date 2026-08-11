import { DisposeBag, ownParts, parseParams } from "../dom";
import { wireScrollStrip } from "./scroll-strip-core";
import type { BehaviorHandler } from "../types";

/**
 * `scroll-strip` — a real `overflow-x: auto` `track` whose `prev`/`next`
 * controls appear only once the content stops fitting, then disable at each
 * end. `params.step` is the fraction of the visible width moved per press
 * (default 0.8).
 *
 * Not `carousel`, which translates a track of full-width slides one at a time
 * and marks the off-screen ones `inert` — here every item is meant to be
 * visible at once and the scroll position is continuous, so there is no slide
 * index to speak of. Not `scroll-area` either: that one paints a decorative
 * thumb for a scrollbar it hid, whereas this hides the scrollbar precisely
 * because the buttons replace it.
 *
 * `Tabs` carries the same wiring itself (see `scroll-strip-core`) rather than
 * nesting one of these inside its list.
 *
 * The controls ship in the static markup already `hidden`, so a no-JS render
 * shows a plain scroller rather than two dead buttons.
 */
export const scrollStrip: BehaviorHandler = (root, _opts) => {
  const params = parseParams(root);
  const track = ownParts(root, "track")[0] as HTMLElement | undefined;
  const bag = new DisposeBag();
  if (!track) return () => bag.dispose();

  wireScrollStrip(root, track, ownParts(root, "prev")[0], ownParts(root, "next")[0], bag, {
    step: typeof params.step === "number" ? params.step : undefined,
    label: typeof params.label === "string" ? params.label : undefined,
  });

  return () => bag.dispose();
};
