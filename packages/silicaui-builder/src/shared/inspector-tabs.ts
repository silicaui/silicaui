/**
 * Merging host-contributed Inspector tabs with the builder's own.
 *
 * Shared by both shells because the RULES are identical even though the node
 * types aren't: the site and email Inspectors each declare their own tab shape
 * (their `Node`, their mutation ctx), and hand the flattened list here to be
 * validated and ordered. Keeping one copy is the point — a tab that a host can
 * register in email but not on a site, or that sorts differently between them,
 * is a difference nobody chose.
 *
 * Every rejection warns. A host tab that quietly never renders looks identical
 * to a builder bug from the outside, and the host has no way to inspect why.
 */
import { warnOnce } from "./warn";
import { isIconName } from "./icons";
import type { IconName } from "./icons";

/** The fields the merge cares about; each shell's own def extends this. */
export interface TabLike {
  id: string;
  label: string;
  icon?: string;
  order?: number;
}

/** Where a host tab lands when it doesn't ask — after every built-in, in the
 *  order the host returned them. Built-ins claim low numbers (0, 10, …) so a
 *  host that DOES care can still slot between them. */
export const HOST_TAB_ORDER = 100;

/**
 * Built-in tabs first, then whatever the host contributed that survives:
 *
 * - a host `id` colliding with a built-in is REJECTED, not shadowed. The
 *   built-ins are the panel's floor; letting a host replace Design by naming a
 *   tab "design" would silently remove the only way to style a node.
 * - a host `id` colliding with an EARLIER host tab is rejected (first wins), for
 *   the same reason two React children can't share a key.
 * - a blank `id` or `label` is rejected — an unlabeled tab is unreachable.
 * - an unknown `icon` renders without one rather than as a broken glyph.
 *
 * Sort is stable within an `order`, so tabs that don't specify one keep the
 * order the host listed them in.
 */
export function mergeInspectorTabs<T extends TabLike>(
  builtIns: readonly T[],
  hostTabs: readonly T[],
): T[] {
  const seen = new Set(builtIns.map((t) => t.id));
  const kept: T[] = [];

  for (const tab of hostTabs) {
    const id = tab.id?.trim();
    if (!id || !tab.label?.trim()) {
      warnOnce(
        `tab:blank:${id ?? ""}`,
        `inspectorTabs(): dropped a tab with a blank id or label (id: ${JSON.stringify(tab.id)}).`,
      );
      continue;
    }
    if (seen.has(id)) {
      warnOnce(
        `tab:dupe:${id}`,
        `inspectorTabs(): dropped a second tab with id "${id}" — ids must be unique, ` +
          `and "design"/"settings" are the builder's own.`,
      );
      continue;
    }
    seen.add(id);
    kept.push(tab);
  }

  return [...builtIns, ...kept].sort(
    (a, b) => (a.order ?? HOST_TAB_ORDER) - (b.order ?? HOST_TAB_ORDER),
  );
}

/** A host's loose icon string → a real icon, or none. Warns once per bad name so
 *  a typo is findable instead of just invisible. */
export function tabIcon(icon: string | undefined, tabId: string): IconName | undefined {
  if (!icon) return undefined;
  if (isIconName(icon)) return icon;
  warnOnce(`tab:icon:${icon}`, `inspectorTabs(): tab "${tabId}" asked for unknown icon "${icon}".`);
  return undefined;
}
