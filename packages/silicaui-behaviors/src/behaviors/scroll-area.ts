import { DisposeBag, ownParts } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `scroll-area` — a real `overflow:auto` `track` (the CSS hides its native
 * scrollbar) with a custom `thumb` whose size/position is computed from the
 * viewport/content ratio on `scroll` + `ResizeObserver`. This can't be a
 * pure-CSS `scrollbar-gutter` trick — the CSS expects an addressable thumb
 * element to size/position, which only JS can drive.
 */
export const scrollArea: BehaviorHandler = (root, _opts) => {
  const track = (ownParts(root, "track")[0] ?? root) as HTMLElement;
  const thumb = ownParts(root, "thumb")[0] as HTMLElement | undefined;
  const bag = new DisposeBag();
  if (!thumb) return () => bag.dispose();

  const sync = () => {
    const { scrollHeight, clientHeight, scrollTop } = track;
    if (scrollHeight <= clientHeight) {
      thumb.style.display = "none";
      return;
    }
    thumb.style.display = "";
    const ratio = clientHeight / scrollHeight;
    thumb.style.height = `${Math.max(ratio * 100, 10)}%`;
    thumb.style.top = `${(scrollTop / scrollHeight) * 100}%`;
  };
  sync();

  bag.listen(track, "scroll", sync);
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    bag.add(() => observer.disconnect());
  }

  bag.listen(track, "mouseenter", () => root.setAttribute("data-hovering", ""));
  bag.listen(track, "mouseleave", () => root.removeAttribute("data-hovering"));

  return () => bag.dispose();
};
