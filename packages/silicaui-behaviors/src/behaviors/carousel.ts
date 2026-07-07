import { DisposeBag, ownParts, parseParams, reducedMotion } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `carousel` — a `track` of `slide`s with optional `prev`/`next` buttons and
 * `dot` pagination. `params.autoplay` (+ `params.interval`, default 5000ms)
 * advances automatically, pausing on hover; suppressed entirely in preview
 * and when the user prefers reduced motion (§7, §9.8).
 */
export const carousel: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const track = ownParts(root, "track")[0] as HTMLElement | undefined;
  const bag = new DisposeBag();
  if (!track) return () => bag.dispose();

  const slides = ownParts(root, "slide");
  if (slides.length === 0) return () => bag.dispose();

  const prev = ownParts(root, "prev")[0];
  const next = ownParts(root, "next")[0];
  const dots = ownParts(root, "dot");

  track.style.display = "flex";
  for (const slide of slides) (slide as HTMLElement).style.flex = "0 0 100%";

  let index = 0;
  const render = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === index)));
    slides.forEach((slide, i) => slide.setAttribute("aria-hidden", String(i !== index)));
  };
  render();

  const go = (i: number) => {
    index = ((i % slides.length) + slides.length) % slides.length;
    render();
  };

  if (prev) bag.listen(prev, "click", () => go(index - 1));
  if (next) bag.listen(next, "click", () => go(index + 1));
  dots.forEach((dot, i) => bag.listen(dot, "click", () => go(i)));

  if (params.autoplay === true && !opts.preview && !reducedMotion()) {
    const interval = typeof params.interval === "number" ? params.interval : 5000;
    let timer = window.setInterval(() => go(index + 1), interval);
    bag.listen(root, "mouseenter", () => window.clearInterval(timer));
    bag.listen(root, "mouseleave", () => {
      timer = window.setInterval(() => go(index + 1), interval);
    });
    bag.add(() => window.clearInterval(timer));
  }

  return () => bag.dispose();
};
