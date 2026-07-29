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

/**
 * The first source keyed `ref`, depth-first.
 *
 * `seen` is GLOBAL to one search, not per-path: whether a shape contains `ref`
 * doesn't depend on the route taken to reach it, so a shape already searched
 * and found wanting can never pay off on a second route. That makes the search
 * linear in DISTINCT sources rather than exponential in paths through them, and
 * terminates on a catalog that contains itself (`post.author → author.posts →
 * post`) instead of overflowing the stack.
 */
export function findSource(sources: readonly DataSource[], ref: string): DataSource | undefined {
  const seen = new Set<DataSource>();
  const search = (ss: readonly DataSource[]): DataSource | undefined => {
    for (const s of ss) {
      if (s.key === ref) return s;
      if (!s.fields?.length || seen.has(s)) continue;
      seen.add(s);
      const nested = search(s.fields);
      if (nested) return nested;
    }
    return undefined;
  };
  return search(sources);
}

/** One pickable scalar field: the opaque `ref` an author binds, and the full
 *  path that got there ("Products > Price"). */
export interface PickableSource {
  value: string;
  label: string;
}

/**
 * Why a flattened list is INCOMPLETE. Reported rather than swallowed: a picker
 * that quietly drops half a host's catalog is indistinguishable, to the author
 * staring at it, from a host that never declared those fields.
 */
export type SourceTruncation = "cycle" | "depth" | "size";

export interface FlattenedSources {
  options: PickableSource[];
  /** Empty when the list is complete — the only "nothing went wrong" signal. */
  truncated: readonly SourceTruncation[];
}

/** Deepest nesting a picker path is walked to. Past this the label is a
 *  sentence and the field is unreachable in practice. */
export const MAX_SOURCE_DEPTH = 6;
/** Hard ceiling on options produced. A picker this long is already unusable;
 *  the cap exists so a pathological catalog can't take the editor with it. */
export const MAX_SOURCE_OPTIONS = 500;

/**
 * Flatten a `DataSource` tree into the flat option list a binding picker (and
 * the email merge-token autocomplete) shows, deepest-first label path.
 *
 * BOUNDED ON PURPOSE — this walks data the HOST supplies, and no host data may
 * be able to hang the editor. Two distinct hazards, two distinct guards:
 *
 *  - A CYCLE (`post.author → author.posts → post`, the ordinary shape of a CMS
 *    schema with a back-reference) recursed forever and overflowed the stack in
 *    ~3ms — thrown mid-render, so it surfaced as the whole editor tripping its
 *    error boundary. `path` holds only the sources on the CURRENT route, since a
 *    shape reachable two ways ("Post > Author > Name" AND "Comment > Author >
 *    Name") is two real options and a global seen-set would wrongly drop the
 *    second. Only a source containing ITSELF is a cycle.
 *
 *  - SHARING WITHOUT A CYCLE is the subtler one, and needs no cycle at all: a
 *    handful of content types embedding the same few sub-shapes is finite and
 *    small to author, but exponential in paths. Measured, 51 distinct authored
 *    sources produced 1.86M options; 55 produced 16.7M, each destined to become
 *    a real `<option>` element. `MAX_SOURCE_OPTIONS` short-circuits the walk —
 *    it is a bound on work done, not a slice of work already done.
 */
export function flattenSources(sources: readonly DataSource[]): FlattenedSources {
  const options: PickableSource[] = [];
  const reasons = new Set<SourceTruncation>();
  const path = new Set<DataSource>();
  const atCap = (): boolean => {
    if (options.length < MAX_SOURCE_OPTIONS) return false;
    reasons.add("size");
    return true;
  };

  const walk = (ss: readonly DataSource[], pathLabel: string, depth: number): void => {
    if (atCap()) return;
    if (depth > MAX_SOURCE_DEPTH) {
      reasons.add("depth");
      return;
    }
    for (const s of ss) {
      if (atCap()) return;
      const label = pathLabel ? `${pathLabel} > ${s.label}` : s.label;
      if (s.cardinality === "scalar") options.push({ value: s.key, label });
      if (!s.fields?.length) continue;
      if (path.has(s)) {
        reasons.add("cycle");
        continue;
      }
      path.add(s);
      walk(s.fields, label, depth + 1);
      path.delete(s);
    }
  };

  walk(sources, "", 0);
  return { options, truncated: [...reasons] };
}

/** One sentence an author can act on, for a `truncated` list. `undefined` when
 *  nothing was dropped, so a caller can render it unconditionally. */
export function truncationMessage(truncated: readonly SourceTruncation[]): string | undefined {
  if (truncated.length === 0) return undefined;
  const parts: string[] = [];
  if (truncated.includes("cycle")) parts.push("it refers back to itself");
  if (truncated.includes("depth")) parts.push(`fields nest deeper than ${MAX_SOURCE_DEPTH} levels`);
  if (truncated.includes("size")) parts.push(`there are more than ${MAX_SOURCE_OPTIONS} fields`);
  return `Some fields aren't listed — ${parts.join(", and ")}. Type the reference directly if you need one that's missing.`;
}
