import { DisposeBag } from "../dom";

/**
 * The measuring half of `scroll-strip`, shared with the `tabs` handler.
 *
 * `tabs` can't simply nest a `scroll-strip` behavior root around its list: part
 * lookup is scoped to the NEAREST ancestor behavior root, so every `tab` inside
 * that nested root would stop resolving to the tabs root and the tab strip
 * would go dead. So `tabs` takes the optional `prev`/`next` parts itself (the
 * "one type, optional parts" composition) and calls this — one implementation,
 * two mountings, no chance of the two drifting.
 */

/** Sub-pixel rounding leaves `scrollLeft` a hair short of the maximum; without
 *  slack a control stays enabled at a hard stop and pressing it does nothing. */
const SLACK = 2;

/** Anything the browser already gives a tab stop to (mirrors the React layer). */
const FOCUSABLE =
  "a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled)," +
  "textarea:not(:disabled),audio[controls],video[controls],details,iframe," +
  '[tabindex]:not([tabindex="-1"]),[contenteditable]:not([contenteditable="false"])';

export interface ScrollStripOpts {
  /** Fraction of the visible width moved per press. Default 0.8. */
  step?: number;
  /** Accessible name for the scroller when it has to become a tab stop. */
  label?: string;
}

/**
 * Wire `track` + optional `prev`/`next` into a strip that announces its own
 * overflow. Returns the `sync` function so a caller can re-measure after it
 * changes the content itself.
 */
export function wireScrollStrip(
  root: Element,
  track: HTMLElement,
  prev: Element | undefined,
  next: Element | undefined,
  bag: DisposeBag,
  opts: ScrollStripOpts = {},
): () => void {
  const step = typeof opts.step === "number" ? opts.step : 0.8;

  const rtl = () =>
    typeof window !== "undefined" && window.getComputedStyle(track).direction === "rtl";

  const sync = () => {
    const max = track.scrollWidth - track.clientWidth;
    // Under RTL `scrollLeft` runs 0 → -max, so only the absolute value means
    // "distance from the start" on both directions.
    const pos = Math.abs(track.scrollLeft);
    const overflows = max > SLACK;
    const atStart = pos <= SLACK;
    const atEnd = pos >= max - SLACK;

    // Showing a control narrows the scroller, which can CREATE the overflow
    // that justified it — hide it and the overflow goes, so it comes back,
    // forever. So overflow drives the PAIR and position drives only `disabled`
    // (a disabled control keeps its footprint, which is what makes hiding the
    // pair strictly widen the scroller and never re-trigger itself).
    for (const btn of [prev, next]) btn?.toggleAttribute("hidden", !overflows);
    prev?.toggleAttribute("disabled", atStart);
    next?.toggleAttribute("disabled", atEnd);

    // The edge-fade CSS reads these; they are logical, so RTL needs no branch
    // here (the stylesheet swaps the physical sides).
    root.toggleAttribute("data-at-start", atStart);
    root.toggleAttribute("data-at-end", atEnd);

    // A scroll region with nothing tabbable inside is unreachable by keyboard
    // entirely — arrow keys only scroll what has focus. Give it a tab stop in
    // that case ONLY, so a strip of real tabs gains no redundant stop in front
    // of them.
    const needsStop = overflows && track.querySelector(FOCUSABLE) === null;
    if (needsStop) {
      track.tabIndex = 0;
      track.setAttribute("role", "group");
      if (opts.label && !track.hasAttribute("aria-label")) {
        track.setAttribute("aria-label", opts.label);
      }
    } else if (track.getAttribute("tabindex") === "0") {
      track.removeAttribute("tabindex");
      track.removeAttribute("role");
    }
  };
  sync();

  const nudge = (direction: -1 | 1) => {
    // No `behavior` on purpose: the default resolves to the CSS
    // `scroll-behavior`, which the stylesheet drops to `auto` under
    // prefers-reduced-motion — so there is no motion branch to keep in sync.
    track.scrollBy({ left: (rtl() ? -1 : 1) * direction * track.clientWidth * step });
  };

  if (prev) bag.listen(prev, "click", () => nudge(-1));
  if (next) bag.listen(next, "click", () => nudge(1));
  bag.listen(track, "scroll", sync);

  if (typeof ResizeObserver !== "undefined") {
    // Both are needed. The container is resizable, which changes the element's
    // size with no scroll event; and the CONTENT changes too as items gain
    // counts or badges, which resizes children rather than the container.
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    for (const child of Array.from(track.children)) observer.observe(child);
    bag.add(() => observer.disconnect());
  }

  return sync;
}
