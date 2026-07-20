import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `countdown` — a live days/hours/minutes/seconds display that ticks to a
 * target time and stops at zero, announcing `sui:complete` once.
 *
 * This is NOT `counter`, which was checked first: `counter` tweens text from 0
 * to a target once when it scrolls into view. A one-shot animation and a
 * recurring clock share a shape but not a behavior — different trigger,
 * different cadence, different stopping condition, and time formatting rather
 * than a single number. Reuse would have meant a `counter` that ignores most
 * of its own parameters.
 *
 * `params.to` is an epoch-ms timestamp. Each `value` part carries
 * `data-unit="days|hours|minutes|seconds"` and only the units actually authored
 * are written, so the markup decides which units show — the handler never
 * invents or removes DOM.
 *
 * The authored markup already contains correct values for its render moment, so
 * a page that never hydrates still shows a sensible (if frozen) countdown
 * rather than empty boxes.
 */
const SECOND = 1000;

export const countdown: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const bag = new DisposeBag();
  const target = typeof params.to === "number" ? params.to : Number(params.to);
  const values = ownParts(root, "value");
  if (!values.length || !Number.isFinite(target)) return () => bag.dispose();

  const pad = (n: number) => String(n).padStart(2, "0");
  let completed = false;

  const render = () => {
    const remaining = Math.max(0, target - Date.now());
    const total = Math.floor(remaining / SECOND);
    const parts: Record<string, number> = {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    };

    for (const el of values) {
      const unit = el.getAttribute("data-unit");
      if (!unit || !(unit in parts)) continue;
      const n = parts[unit]!;
      // Days aren't zero-padded — an unbounded unit padded to two digits reads
      // as a fixed-width field it isn't, and breaks outright past 99.
      el.textContent = unit === "days" ? String(n) : pad(n);
    }

    if (remaining === 0 && !completed) {
      completed = true;
      root.setAttribute("data-complete", "");
      root.dispatchEvent(new CustomEvent("sui:complete", { bubbles: true }));
      stop();
    }
  };

  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };

  render();

  // In preview (a builder canvas), paint the correct values once but don't run
  // a timer — a ticking clock in an editing surface is a distraction, and it
  // would keep a rendering loop alive for every countdown on the canvas.
  if (!opts.preview && !completed) {
    timer = setInterval(render, SECOND);
    bag.add(stop);
  }

  return () => bag.dispose();
};
