/**
 * Optional mount loop for HOST NODES — the client-side companion to the empty
 * `<div data-sui-host>` mount points `@wizeworks/silicaui-html`'s `toHtml` emits for a
 * `HostNode` (host-nodes-and-node-locking spec §A.4). A host component is
 * framework-specific and host-OWNED, so the components never live here; this is
 * only the generic, component-agnostic scan/mount/dispose loop, symmetric with
 * `hydrate()`. A React host will typically skip this and mount its own roots.
 */

export const HOST_ATTR = "data-sui-host";
export const HOST_PROPS_ATTR = "data-sui-host-props";
export const HOST_MOUNTED_ATTR = "data-sui-host-mounted";

/** Mounts a host component into its mount-point element; returns a disposer
 *  (or nothing). `props` is the parsed `data-sui-host-props` (an object, or `{}`
 *  when absent/malformed) — the host RE-VALIDATES it against the component's
 *  declared prop schema, never trusting the serialized blob (spec §7). */
export type HostMounter = (el: HTMLElement, props: Record<string, unknown>) => (() => void) | void;

/** Parse a mount point's `data-sui-host-props`; missing/malformed JSON → `{}`. */
function parseHostProps(el: Element): Record<string, unknown> {
  const raw = el.getAttribute(HOST_PROPS_ATTR);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Mount every not-yet-mounted `[data-sui-host]` under `root` using `registry`
 * (component key → mounter). Idempotent — a `data-sui-host-mounted` marker guards
 * re-mount, so it's safe to call again after the DOM changes. A component key
 * absent from the registry is left inert (an SSR/other host may own it). Returns
 * a disposer that unmounts everything this call mounted.
 */
export function mountHostNodes(
  registry: Record<string, HostMounter>,
  root: ParentNode = document,
): () => void {
  const disposers: Array<() => void> = [];

  for (const el of Array.from(root.querySelectorAll<HTMLElement>(`[${HOST_ATTR}]`))) {
    if (el.hasAttribute(HOST_MOUNTED_ATTR)) continue;
    const key = el.getAttribute(HOST_ATTR);
    const mount = key ? registry[key] : undefined;
    if (!mount) continue;

    el.setAttribute(HOST_MOUNTED_ATTR, "");
    const dispose = mount(el, parseHostProps(el));
    disposers.push(() => {
      if (typeof dispose === "function") dispose();
      el.removeAttribute(HOST_MOUNTED_ATTR);
    });
  }

  return () => {
    for (const dispose of disposers.splice(0)) dispose();
  };
}
