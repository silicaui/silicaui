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
import { applyCollectionLimit, findSource } from "@wizeworks/silicaui-html";
import type { DataScope, DataSource, EmailNode, ResolveDiagnostic, Resolved } from "./schema";

/** Twin of `@wizeworks/silicaui-html`'s `ResolveHost`, including its
 *  unknown-vs-empty distinction: `undefined` means "I've never heard of this
 *  ref" (authored content stays, diagnostic fires), `{ value: undefined }`
 *  means "I know it and it's empty" (renders empty). Same rule as the site
 *  resolver — see data-resolution-and-brand-mark.md §A. */
export interface EmailResolveHost {
  resolveBinding?(ref: string, scope: DataScope): Resolved | undefined;
  resolveCollection?(ref: string, scope: DataScope): readonly unknown[] | undefined;
  /**
   * Resolve an inline `{{…}}` token whose contents are NOT a bare dotted path
   * — i.e. anything silica's own token grammar deliberately does not parse:
   * `{{customer.firstName ?? "there"}}`, `{{price | currency}}`, whatever an
   * ESP's documented syntax happens to be.
   *
   * This hook exists so the EXPRESSION LANGUAGE stays out of silica. Silica
   * owns exactly one production — a dotted path — and hands everything else to
   * the host verbatim (trimmed of its braces and surrounding whitespace, and
   * NOTHING else: no tokenizing, no unquoting, no evaluation). A host that
   * already runs its own interpolation pass over the projected HTML can reuse
   * that same evaluator here and get an identical answer on the canvas.
   *
   * Same three-state contract as `resolveBinding`: `undefined` = "I don't
   * understand this expression" (the literal `{{…}}` stays exactly as authored
   * and an `unknown-expression` diagnostic fires), `{ value: undefined }` /
   * `visible: false` = "understood, renders empty".
   *
   * Absent → non-path tokens pass through verbatim, which is what they did
   * before this hook existed. Wiring it is purely additive.
   */
  resolveExpression?(expr: string, scope: DataScope): Resolved | undefined;
  onDiagnostic?(d: ResolveDiagnostic): void;
}

const EMPTY_SCOPE: DataScope = {};

/**
 * A node kind's bindable scalar fields — the `attr` allowlist for a `value`
 * bind, plus which one a bind with NO `attr` targets by default (the common
 * case: a text node's copy, a button's label, an image's source). Kinds with
 * no sensible single scalar (`social`'s links are a list; `columns`/`column`
 * are pure layout) are simply absent — `fillEmailValue` no-ops on them.
 *
 * EXPORTED because it is a CONTRACT, not an implementation detail: it is the
 * complete answer to "what may `data.attr` say on this kind", which a host
 * building its own binding UI (and the MCP catalog, which reads it rather than
 * re-describing it) otherwise has to guess at or duplicate. A bind naming a
 * field that isn't here is inert — it writes nothing and reports nothing —
 * which is precisely the failure a published allowlist prevents.
 */
export const EMAIL_BINDABLE_FIELDS: Partial<Record<EmailNode["kind"], { default?: string; fields: Record<string, "string" | "number" | "boolean"> }>> = {
  text: { default: "html", fields: { html: "string" } },
  image: { default: "src", fields: { src: "string", alt: "string", href: "string", width: "number" } },
  // The per-item destination of a repeated card — `href` is BOTH the default
  // target and the only field, so `{ kind: 'value', ref: 'url' }` and
  // `{ kind: 'value', ref: 'url', attr: 'href' }` are the same bind. Filling it
  // leaves `children` to resolve on their own (see the container branch in
  // `resolveNode`), which is the whole point: the link carries the URL while
  // each child still binds its own field.
  link: { default: "href", fields: { href: "string" } },
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
  const config = EMAIL_BINDABLE_FIELDS[node.kind];
  if (!config) return node;
  const field = attr ?? config.default;
  const type = field ? config.fields[field] : undefined;
  if (!field || !type) return node;
  let coerced = coerce(value, type);
  if (type === "string" && field === "html" && node.kind === "text") coerced = escapeInline(coerced as string);
  return { ...node, [field]: coerced };
}

/**
 * The SCANNER — finds every `{{…}}` run, deliberately lenient about what sits
 * inside it. It is not the grammar; `TOKEN_PATH_RE` below is. Splitting the two
 * is the whole point: silica FINDS every token an author typed, then decides
 * who owns it, instead of silently not seeing the ones it can't parse.
 *
 * Known limit, documented rather than papered over: `[^{}]*` stops at the first
 * `}`, so an expression with a brace inside a string literal
 * (`{{ a ?? "}" }}`) truncates. Balancing braces would mean parsing the host's
 * language — exactly what this design refuses to do. Hosts whose syntax needs
 * literal braces should use a whole-field `data` bind instead.
 */
const TOKEN_RE = /\{\{([^{}]*)\}\}/g;

/**
 * Silica's ENTIRE token grammar: a bare dotted path. Anything else inside the
 * braces is an EXPRESSION and belongs to `resolveExpression` — see the note
 * there for why the grammar stops here and does not grow a `??`, a pipe, or a
 * conditional. Kept byte-identical to the pattern this file has always matched,
 * so a path token resolves exactly as it did before expressions existed.
 */
const TOKEN_PATH_RE = /^[a-zA-Z0-9_.]+$/;

/**
 * Substitute every `{{ref}}` merge token inside `text` via the host's
 * `resolveBinding` — the INLINE counterpart to a whole-field `value` bind
 * (Q23): a sentence like "Hi {{customer.firstName}}, your order shipped" has
 * no single field to bind wholesale, so each token resolves independently
 * against the SAME `resolveBinding` hook a whole-field bind uses. Absent BOTH
 * hooks, `text` passes through untouched (an author who's typed `{{` before a
 * host is wired doesn't see it silently vanish).
 *
 * A token whose contents aren't a bare dotted path is an EXPRESSION and routes
 * to `resolveExpression` instead — same substitution, same escaping, same
 * unknown-keeps-the-literal rule; only the hook differs. See that hook's note
 * for why the grammar stops at a path. An UNKNOWN ref likewise keeps
 * its own literal source (`{{logo}}`) and reports — the same "keep what was
 * authored" rule as everywhere else, and a visible artifact in a test send
 * beats a silently mangled sentence. A KNOWN-but-empty (or `visible:false`)
 * resolution elides to empty string — there's no way to hide part of a
 * sentence, and an author who bound an empty field meant the sentence to close
 * over it. `escapeHtml` is true only for a field the projector embeds
 * VERBATIM as markup (`TextNode.html`); fields the projector escapes itself
 * at render time (button label, subject, preheader) pass the raw resolved
 * value through so it isn't double-escaped.
 */
export function resolveTokens(text: string, host: EmailResolveHost, scope: DataScope, escapeHtml: boolean): string {
  if (!text.includes("{{")) return text;
  if (!host.resolveBinding && !host.resolveExpression) return text;
  return text.replace(TOKEN_RE, (match, raw: string) => {
    const inner = raw.trim();
    // `{{}}` / `{{  }}` is punctuation an author typed, not a token — leave it
    // alone and don't report it as a broken reference.
    if (inner === "") return match;

    const isPath = TOKEN_PATH_RE.test(inner);
    const resolved = isPath ? host.resolveBinding?.(inner, scope) : host.resolveExpression?.(inner, scope);
    if (!resolved) {
      host.onDiagnostic?.({ code: isPath ? "unknown-ref" : "unknown-expression", ref: inner, kind: "value" });
      // The literal source, byte-for-byte. Note this can now contain HTML-special
      // characters (an expression may quote anything), where the old
      // path-only pattern could not — but returning `match` is STRING IDENTITY:
      // the field ends up holding precisely what the author authored, which is
      // what an unmatched token did before this scanner widened. Escaping here
      // would be the actual change in behavior, mangling authored copy.
      return match;
    }
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
    // Unknown ref: keep the node exactly as authored (marker included) and
    // report. Tokens still apply — an unknown WHOLE-FIELD bind says nothing
    // about the node's inline tokens, which resolve independently.
    if (!resolved) {
      host.onDiagnostic?.({ code: "unknown-ref", ref: node.data.ref, nodeId: node.id, kind: "value" });
      return applyTokens(node, host, scope);
    }
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

  // CONDITIONAL VISIBILITY — the email twin of the site resolver's `visible`
  // kind (they share the `DataBinding` type, so they must share the semantics).
  // The canonical email case is the one the site's pagination case is for
  // marketing: a discount block that must not render when there is no discount.
  //
  // No `editing` policy here, unlike the site walk: this resolver runs at
  // PROJECTION time (preview / send), never over the editing canvas, which
  // edits the authored tree directly. There is no author to strand.
  if (node.data?.kind === "visible" && host.resolveBinding) {
    const { ref, negate } = node.data;
    const resolved = host.resolveBinding(ref, scope);
    // An unknown ref keeps the node — hiding content because a resolver has a
    // typo is the one failure mode with no visible trace.
    if (!resolved) {
      host.onDiagnostic?.({ code: "unknown-ref", ref, nodeId: node.id, kind: "visible" });
      return applyTokens(node, host, scope);
    }
    const v = resolved.value;
    const present =
      resolved.visible === false ? false : Array.isArray(v) ? v.length > 0 : !(v == null || v === false || v === "");
    if ((negate ? !present : present) === false) return undefined;

    const { data: _data, ...rest } = node as EmailNode & { data?: unknown };
    const kept =
      "children" in rest
        ? { ...rest, children: resolveChildren((rest as { children: EmailNode[] }).children, host, scope) }
        : rest;
    return applyTokens(kept as EmailNode, host, scope);
  }

  if (node.data?.kind === "collection" && host.resolveCollection && "children" in node) {
    const all = host.resolveCollection(node.data.ref, scope);
    if (!all) {
      host.onDiagnostic?.({ code: "unknown-ref", ref: node.data.ref, nodeId: node.id, kind: "collection" });
      return node;
    }
    // Per-instance `limit`, applied before anything reads the length — same
    // clamp function the site resolver uses, so "4" means the same thing in a
    // campaign as it does on the page it links to.
    const items = applyCollectionLimit(all, node.data.limit);
    // `omitWhenEmpty` deliberately does NOT apply to an unknown ref (above): it
    // means "legitimately empty, render nothing" — a claim only a host that
    // KNOWS the ref can make.
    if (items.length === 0 && node.data.omitWhenEmpty) return undefined;
    const { data: _data, children, ...rest } = node as EmailNode & { children: EmailNode[]; data?: unknown };
    const resolvedChildren =
      items.length === 0
        ? // No items: the authored children render once, as the editor's own
          // "one placeholder item" convention (builder-contract.md §3) — unless
          // `omitWhenEmpty` opted out above, dropping the node entirely instead.
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
 * child-set per resolved item. Absent ALL THREE resolve hooks → returns `root`
 * UNCHANGED (a static host never pays for this). `action` nodes are never
 * touched.
 */
export function resolveEmailTree<T extends EmailNode>(root: T, host: EmailResolveHost, scope: DataScope = EMPTY_SCOPE): T {
  if (!host.resolveBinding && !host.resolveCollection && !host.resolveExpression) return root;
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

/**
 * Flatten a `DataSource` tree into pickable options, deepest-first label path
 * ("Products > Price") — shared by the Inspector's Reference picker and the
 * merge-token autocomplete (`email/react/token-query.ts`'s consumers): both
 * need "what scalar fields can I pick from here" as a flat list.
 *
 * A RE-EXPORT, not a port. This and `findSource` were hand-copied from their
 * site twins, so both inherited the same unbounded recursion: a host catalog
 * that referred back to itself overflowed the stack mid-render, and one that
 * merely SHARED sub-shapes between content types went exponential without any
 * cycle at all. Email is the hotter of the two paths — the autocomplete
 * flattens while the author types — so it takes the bounded walker by
 * construction rather than by a second fix free to drift again.
 */
export { flattenSources as flattenEmailSources } from "@wizeworks/silicaui-html";
