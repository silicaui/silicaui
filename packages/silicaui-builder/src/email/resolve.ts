/**
 * The email twin of `@wizeworks/silicaui-html`'s data-resolution layer
 * (`resolve.ts` — builder-contract.md §3, the Q3/Q19 keystone), ported for
 * `EmailNode`'s closed, typed-prop schema instead of a free element tree. Same
 * shape, same contract: pure and SYNCHRONOUS by design (a host with an async
 * source fetches once, up front); absent BOTH hooks it's a zero-cost no-op;
 * `action` nodes are never touched, they stay inert markers for the host's own
 * wiring. `resolveEmailTree` feeds BOTH `toEmailHtml(doc, resolver)` (a host's
 * live-send path) and the Inspector's `DataPreview` row — one resolution
 * primitive for preview and send, per Q25.
 *
 * Where this genuinely differs from the site version (not a shortcut, a
 * consequence of the schema): only `body`/`section`/`columns`/`column` HAVE a
 * `children` array to repeat, so `collection` binds are only meaningful there
 * — a leaf content kind has no slot to expand into. And `fillValue` can't
 * auto-detect "the primary prop" from a generic element shape the way the
 * site version does (there's no `attrs`/`children` uniformity); it works off
 * an explicit per-kind field table instead.
 */
import type { DataScope, DataSource, EmailNode, Resolved } from "./schema";

export interface EmailResolveHost {
  resolveBinding?(ref: string, scope: DataScope): Resolved;
  resolveCollection?(ref: string, scope: DataScope): readonly unknown[];
}

const EMPTY_SCOPE: DataScope = {};

/** A node kind's bindable scalar fields — the `attr` allowlist for a `value`
 *  bind, plus which one a bind with NO `attr` targets by default (the common
 *  case: a text node's copy, a button's label, an image's source). Kinds with
 *  no sensible single scalar (`social`'s links are a list; `columns`/`column`
 *  are pure layout) are simply absent — `fillEmailValue` no-ops on them. */
const BINDABLE_FIELDS: Partial<Record<EmailNode["kind"], { default?: string; fields: Record<string, "string" | "number" | "boolean"> }>> = {
  text: { default: "html", fields: { html: "string" } },
  image: { default: "src", fields: { src: "string", alt: "string", href: "string", width: "number" } },
  button: { default: "label", fields: { label: "string", href: "string", bg: "string", color: "string" } },
  divider: { fields: { color: "string", thickness: "number" } },
  spacer: { fields: { height: "number" } },
  html: { default: "html", fields: { html: "string" } },
  video: { default: "href", fields: { href: "string", thumbnail: "string", width: "number" } },
  section: { fields: { bg: "string", bgImage: "string" } },
  body: { fields: { bg: "string", contentBg: "string", fontFamily: "string" } },
};

function coerce(value: unknown, type: "string" | "number" | "boolean"): unknown {
  if (type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (type === "boolean") return Boolean(value);
  // `text`'s `html` field renders as inline-safe HTML verbatim — escape a bound
  // scalar so a name/title containing `<`/`>`/`&` can't break the table markup
  // or inject markup the author never authored. `html`'s own `html` field is
  // the deliberate raw-passthrough exception (same contract as authoring it).
  return String(value ?? "");
}

const HTML_ESCAPE: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
function escapeInline(s: string): string {
  return s.replace(/[&<>]/g, (c) => HTML_ESCAPE[c]!);
}

/** Fill `node`'s bindable field with `resolved` — `attr` picks it explicitly,
 *  else the kind's default. No-op (returns `node` unchanged) for a kind with
 *  no bindable fields, an unknown `attr`, or a kind with no default when
 *  `attr` is omitted — a bind with nothing to write to is inert, not an error. */
function fillEmailValue(node: EmailNode, value: unknown, attr?: string): EmailNode {
  const config = BINDABLE_FIELDS[node.kind];
  if (!config) return node;
  const field = attr ?? config.default;
  const type = field ? config.fields[field] : undefined;
  if (!field || !type) return node;
  let coerced = coerce(value, type);
  if (type === "string" && field === "html" && node.kind === "text") coerced = escapeInline(coerced as string);
  return { ...node, [field]: coerced };
}

const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/**
 * Substitute every `{{ref}}` merge token inside `text` via the host's
 * `resolveBinding` — the INLINE counterpart to a whole-field `value` bind
 * (Q23): a sentence like "Hi {{customer.firstName}}, your order shipped" has
 * no single field to bind wholesale, so each token resolves independently
 * against the SAME `resolveBinding` hook a whole-field bind uses. Absent the
 * hook, `text` passes through untouched (an author who's typed `{{` before a
 * host is wired doesn't see it silently vanish). A `visible:false` or missing
 * resolution elides to empty string — there's no way to hide part of a
 * sentence. `escapeHtml` is true only for a field the projector embeds
 * VERBATIM as markup (`TextNode.html`); fields the projector escapes itself
 * at render time (button label, subject, preheader) pass the raw resolved
 * value through so it isn't double-escaped.
 */
export function resolveTokens(text: string, host: EmailResolveHost, scope: DataScope, escapeHtml: boolean): string {
  if (!host.resolveBinding || !text.includes("{{")) return text;
  return text.replace(TOKEN_RE, (_match, ref: string) => {
    const resolved = host.resolveBinding!(ref, scope);
    if (resolved.visible === false || resolved.value == null) return "";
    const s = String(resolved.value);
    return escapeHtml ? escapeInline(s) : s;
  });
}

/** Apply inline token substitution to a node's prose fields — independent of
 *  any whole-field `data` bind on the SAME node (a button's label can carry a
 *  token while its href is a separate `action` bind, and vice versa). No-op
 *  for kinds with no prose field (everything but text/button). */
function applyTokens(node: EmailNode, host: EmailResolveHost, scope: DataScope): EmailNode {
  if (node.kind === "text") return { ...node, html: resolveTokens(node.html, host, scope, true) };
  if (node.kind === "button") return { ...node, label: resolveTokens(node.label, host, scope, false) };
  return node;
}

function resolveChildren(children: EmailNode[] | undefined, host: EmailResolveHost, scope: DataScope): EmailNode[] {
  if (!children) return [];
  const out: EmailNode[] = [];
  for (const child of children) {
    const resolved = resolveNode(child, host, scope);
    if (resolved) out.push(resolved);
  }
  return out;
}

function resolveNode(node: EmailNode, host: EmailResolveHost, scope: DataScope): EmailNode | undefined {
  if (node.data?.kind === "value" && host.resolveBinding) {
    const resolved = host.resolveBinding(node.data.ref, scope);
    if (resolved.visible === false) return undefined;
    const filled = fillEmailValue(node, resolved.value, node.data.attr);
    const { data: _data, ...rest } = filled as EmailNode & { data?: unknown };
    // Unlike a text/leaf fill (nothing left to walk), an attr-targeted fill on
    // a CONTAINER leaves `children` untouched — resolve them too, so a bound
    // section background doesn't strand the bindings inside it unresolved
    // (the exact defect Q22 flags in the site version's early return).
    const withChildren = "children" in rest ? { ...rest, children: resolveChildren((rest as { children: EmailNode[] }).children, host, scope) } : rest;
    return applyTokens(withChildren as EmailNode, host, scope);
  }

  if (node.data?.kind === "collection" && host.resolveCollection && "children" in node) {
    const items = host.resolveCollection(node.data.ref, scope);
    const { data: _data, children, ...rest } = node as EmailNode & { children: EmailNode[]; data?: unknown };
    const resolvedChildren =
      items.length === 0
        ? // No items: the authored children render once, as the editor's own
          // "one placeholder item" convention (builder-contract.md §3).
          resolveChildren(children, host, scope)
        : items.flatMap((item, index) => resolveChildren(children, host, { item, index }));
    return { ...rest, children: resolvedChildren } as EmailNode;
  }

  if ("children" in node) {
    const container = node as EmailNode & { children: EmailNode[] };
    return { ...container, children: resolveChildren(container.children, host, scope) } as EmailNode;
  }
  return applyTokens(node, host, scope);
}

/**
 * Walk `doc`'s root, substituting `data:'value'` nodes with resolved values
 * and expanding `data:'collection'` container nodes into one cloned
 * child-set per resolved item. Absent BOTH hooks → returns `root` UNCHANGED
 * (a static host never pays for this). `action` nodes are never touched.
 */
export function resolveEmailTree<T extends EmailNode>(root: T, host: EmailResolveHost, scope: DataScope = EMPTY_SCOPE): T {
  if (!host.resolveBinding && !host.resolveCollection) return root;
  return (resolveNode(root, host, scope) ?? root) as T;
}

/**
 * The email twin of `@wizeworks/silicaui-html`'s `scopeAt` — narrow a host's
 * flat `DataSource` catalog to what's bindable from a node whose ancestors
 * (root-first, NOT including the node itself, from `EmailEditor.ancestorsOf`)
 * are `ancestors`. Any ancestor whose `data.kind === 'collection'` narrows to
 * that source's own `fields` for every descendant scope below it — the
 * innermost (closest) matching ancestor wins.
 */
export function emailScopeAt(sources: readonly DataSource[], ancestors: readonly EmailNode[]): readonly DataSource[] {
  let scoped: readonly DataSource[] = sources;
  for (const node of ancestors) {
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

/** Flatten a `DataSource` tree into pickable options, deepest-first label
 *  path ("Products > Price") — shared by the Inspector's Reference picker and
 *  the merge-token autocomplete (`email/react/token-query.ts`'s consumers):
 *  both need "what scalar fields can I pick from here" as a flat list. */
export function flattenEmailSources(sources: readonly DataSource[], pathLabel = ""): Array<{ value: string; label: string }> {
  return sources.flatMap((s) => {
    const label = pathLabel ? `${pathLabel} > ${s.label}` : s.label;
    const own = s.cardinality === "scalar" ? [{ value: s.key, label }] : [];
    const nested = s.fields ? flattenEmailSources(s.fields, label) : [];
    return [...own, ...nested];
  });
}
