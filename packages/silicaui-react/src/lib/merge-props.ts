import { cx } from "./cx";
import { warnRender } from "./dev";

export type Props = Record<string, unknown>;

/**
 * Merge Silica's own props (`ours`) with the props of a user-supplied element
 * passed via `render` (`theirs`).
 *
 * Rules:
 *   - `className` is concatenated (ours first).
 *   - `style` is shallow-merged (theirs wins on conflict).
 *   - `on*` event handlers present on both are composed (ours runs, then theirs).
 *   - `children` defaults to ours (the button's label) unless we have none.
 *   - Everything else: theirs wins, so `<Button render={<a href="…" />}>` keeps
 *     its own `href`, `target`, etc.
 */
/**
 * `theirs` defaults to `{}` because `render.props` can be `undefined` at
 * runtime — an element that crossed a Server→Client Component boundary comes
 * across as a lazy client reference, and reading `.props` off it is `undefined`
 * rather than a real props object.
 *
 * That default keeps us from throwing, but it is damage control, not a fix:
 * the element's own props (`href`, `target`, …) are gone, so the result is a
 * correctly-styled element that does nothing — a dead link that looks fine.
 * `owner` lets us name the component in the warning, since the stack trace
 * points here rather than at the call site that actually needs changing.
 */
export function mergeProps(ours: Props, theirs?: Props, owner?: string): Props {
  // `owner` is only passed by `composeRender`, so it doubles as "this call is
  // a render composition". `mergeProps` is public API via the `/server` entry;
  // a consumer calling it with one argument means it deliberately, and must
  // not be warned at.
  if (theirs === undefined && owner !== undefined) {
    warnRender(
      owner,
      "received an element whose props could not be read, so it rendered with " +
        "Silica's classes but WITHOUT its own props (href, target, …).",
    );
  }

  const safe: Props = theirs ?? {};
  const merged: Props = { ...ours, ...safe };

  merged.className = cx(ours.className as string, safe.className as string);

  if (ours.style || safe.style) {
    merged.style = { ...(ours.style as object), ...(safe.style as object) };
  }

  if (ours.children != null) {
    merged.children = ours.children;
  }

  for (const key of Object.keys(safe)) {
    if (
      /^on[A-Z]/.test(key) &&
      typeof safe[key] === "function" &&
      typeof ours[key] === "function"
    ) {
      const a = ours[key] as (...args: unknown[]) => void;
      const b = safe[key] as (...args: unknown[]) => void;
      merged[key] = (...args: unknown[]) => {
        a(...args);
        b(...args);
      };
    }
  }

  return merged;
}
