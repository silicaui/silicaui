/**
 * The binding-picker scope model (builder-contract.md §5, §3). A host computes
 * its `DataSource` catalog ONCE and hands it to the engine; per-node
 * availability is then a pure derivation over the tree the engine already
 * owns — which ancestor `repeat` narrows the scope is structure, not domain
 * knowledge, so it lives here rather than being recomputed per host.
 */
import type { Node } from "./schema";

export interface DataSource {
  key: string;
  label: string;
  cardinality: "scalar" | "array" | "object";
  /** Nested shape — populated for 'object'/'array' sources so a collection's
   *  item fields are pickable once a `repeat` ancestor is in scope. */
  fields?: readonly DataSource[];
}

/**
 * Narrow `sources` to what's bindable from a node whose ancestors (root-first,
 * NOT including the node itself) are `ancestors`. Any ancestor whose
 * `data.kind === "collection"` narrows to that source's own `fields` for every
 * descendant scope below it — the innermost (closest) matching ancestor wins,
 * since ancestors are walked outside-in and each match replaces the scope.
 */
export function scopeAt(sources: readonly DataSource[], ancestors: readonly Node[]): readonly DataSource[] {
  let scoped: readonly DataSource[] = sources;
  for (const node of ancestors) {
    if (node.kind === "outlet") continue;
    if (node.data?.kind === "collection") {
      const match = findSource(scoped, node.data.ref);
      if (match?.fields) scoped = match.fields;
    }
  }
  return scoped;
}

function findSource(sources: readonly DataSource[], ref: string): DataSource | undefined {
  for (const s of sources) {
    if (s.key === ref) return s;
    if (s.fields) {
      const nested = findSource(s.fields, ref);
      if (nested) return nested;
    }
  }
  return undefined;
}
