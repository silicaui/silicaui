/**
 * The behavior marker vocabulary (architecture §7). Duplicated here — not
 * imported from `silicaui-html` — on purpose: the contract is the STRING
 * values in `data-sui-*` attributes, not shared TS identity, so this runtime
 * stays buildable with zero dependencies (any host lowering the same names
 * drives it identically).
 */
export type BehaviorType =
  | "carousel"
  | "disclosure"
  | "tabs"
  | "menu"
  | "marquee"
  | "scrollspy"
  | "counter"
  | "dismiss"
  | "toc";

export interface HydrateOptions {
  /**
   * Editor-canvas preview mode (§9.8): autoplay (carousel/marquee/counter)
   * is suppressed and collapsed panels (disclosure/tabs/menu) are revealed.
   */
  preview?: boolean;
}

/** A behavior handler wires one root element and returns its teardown. */
export type BehaviorHandler = (root: Element, opts: HydrateOptions) => () => void;
