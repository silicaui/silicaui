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
    // aria-current is present-or-absent, not true/false — a literal "false"
    // is announced as noise. `inert` (not just aria-hidden) on off-screen
    // slides also removes their links/buttons from the tab order; aria-hidden
    // alone leaves ghost tab stops inside hidden content.
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    slides.forEach((slide, i) => {
      const off = i !== index;
      slide.setAttribute("aria-hidden", String(off));
      (slide as HTMLElement).inert = off;
    });
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
    let timer: number | undefined = window.setInterval(() => go(index + 1), interval);
    let stopped = false; // sticky user stop (explicit pause part)
    const halt = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const resume = () => {
      if (stopped || timer !== undefined) return;
      timer = window.setInterval(() => go(index + 1), interval);
    };
    // WCAG 2.2.2: auto-advance needs a pause reachable by every input mode —
    // hover for pointer users, focus-in for keyboard users (tabbing into the
    // carousel stops it moving underneath them), and an optional authored
    // `pause` part as a sticky toggle.
    bag.listen(root, "mouseenter", halt);
    bag.listen(root, "mouseleave", resume);
    bag.listen(root, "focusin", halt);
    bag.listen(root, "focusout", (ev) => {
      const to = (ev as FocusEvent).relatedTarget as Node | null;
      if (!to || !root.contains(to)) resume();
    });
    const pause = ownParts(root, "pause")[0];
    if (pause) {
      pause.setAttribute("aria-pressed", "false");
      bag.listen(pause, "click", () => {
        stopped = !stopped;
        pause.setAttribute("aria-pressed", String(stopped));
        pause.toggleAttribute("data-paused", stopped);
        if (stopped) halt();
        else resume();
      });
    }
    bag.add(halt);
  }

  return () => bag.dispose();
};
