import { cx } from "./cx";

type Props = Record<string, unknown>;

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
export function mergeProps(ours: Props, theirs: Props): Props {
  const merged: Props = { ...ours, ...theirs };

  merged.className = cx(ours.className as string, theirs.className as string);

  if (ours.style || theirs.style) {
    merged.style = { ...(ours.style as object), ...(theirs.style as object) };
  }

  if (ours.children != null) {
    merged.children = ours.children;
  }

  for (const key of Object.keys(theirs)) {
    if (
      /^on[A-Z]/.test(key) &&
      typeof theirs[key] === "function" &&
      typeof ours[key] === "function"
    ) {
      const a = ours[key] as (...args: unknown[]) => void;
      const b = theirs[key] as (...args: unknown[]) => void;
      merged[key] = (...args: unknown[]) => {
        a(...args);
        b(...args);
      };
    }
  }

  return merged;
}
