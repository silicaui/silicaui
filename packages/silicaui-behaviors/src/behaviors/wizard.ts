import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `wizard` — `step`/`panel` pairs like `tabs`, but with real state-machine
 * rules `tabs` doesn't have: `params.linear` (default `true`) only allows
 * clicking BACK to a completed step, never ahead; a `next`/`prev` footer
 * pair drives forward/back, and `next` relabels to "Finish" on the last
 * step. Host-driven validation gates progress via `aria-disabled` on the
 * `next` part (the author/host toggles it — this behavior only reads it,
 * it doesn't invent its own validation).
 */
export const wizard: BehaviorHandler = (root, _opts) => {
  const params = parseParams(root);
  const linear = params.linear !== false;
  const steps = ownParts(root, "step");
  const panels = ownParts(root, "panel");
  const prev = ownParts(root, "prev")[0] as HTMLButtonElement | undefined;
  const next = ownParts(root, "next")[0] as HTMLElement | undefined;
  const bag = new DisposeBag();

  const pairs = steps
    .map((step, i) => ({ step, panel: panels[i] }))
    .filter((p): p is { step: Element; panel: Element } => p.panel != null);
  if (!pairs.length) return () => bag.dispose();

  let current = pairs.findIndex((p) => !p.panel.hasAttribute("hidden"));
  if (current === -1) current = 0;

  const render = () => {
    pairs.forEach(({ step, panel }, i) => {
      panel.toggleAttribute("hidden", i !== current);
      step.toggleAttribute("data-active", i === current);
      // APG step navigator: the active step is conveyed to AT, not just styled.
      if (i === current) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
      step.toggleAttribute("data-complete", i < current);
      const disabled = step.getAttribute("data-disabled") === "true";
      const clickable = !disabled && i !== current && (!linear || i < current);
      if (i === current || clickable) step.removeAttribute("aria-disabled");
      else step.setAttribute("aria-disabled", "true");
    });
    if (prev) prev.disabled = current === 0;
    if (next) {
      const isLast = current === pairs.length - 1;
      next.textContent = isLast ? (next.getAttribute("data-finish-label") ?? "Finish") : (next.getAttribute("data-next-label") ?? "Next");
    }
  };
  render();

  pairs.forEach(({ step }, i) => {
    bag.listen(step, "click", () => {
      if (step.getAttribute("aria-disabled") === "true" || i === current) return;
      current = i;
      render();
    });
  });

  if (prev) {
    bag.listen(prev, "click", () => {
      if (current > 0) {
        current--;
        render();
      }
    });
  }
  if (next) {
    bag.listen(next, "click", () => {
      if (next.getAttribute("aria-disabled") === "true") return;
      if (current < pairs.length - 1) {
        current++;
        render();
      } else {
        root.dispatchEvent(new CustomEvent("sui:finish", { bubbles: true }));
      }
    });
  }

  return () => bag.dispose();
};
