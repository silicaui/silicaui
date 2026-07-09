/**
 * The raw-element / attribute security floor (builder-contract.md §9). Enforced
 * UNCONDITIONALLY by `toHtml` on every `el:<tag>` node — not a host-optional
 * policy, the same category of thing HTML-escaping already is. A closed
 * positive whitelist: only these tags render as themselves (anything else
 * downgrades to `div`, keeping the node's slot in the tree rather than
 * dropping content), and only these attribute keys copy through, per tag.
 * `on*` handlers are excluded by NEVER being enumerated — fails closed, not
 * stripped by a fragile pattern match.
 */
export type ElementGroup = "structure" | "text" | "list" | "media" | "table" | "form" | "interactive";

export interface RawElementMeta {
  group: ElementGroup;
  /** Extra attribute keys allowed on this tag, ON TOP of GLOBAL_ATTRS. Real HTML
   *  attribute-name strings — `node.attrs` keys are already HTML-cased. */
  attrs?: readonly string[];
}

/** Allowed on every whitelisted tag. `aria-*` and `data-*` are handled
 *  separately, by PREFIX, in `sanitizeElement` — both namespaces are safe by
 *  construction (inert metadata, never parsed as a URL or executed as code),
 *  so enumerating every possible `aria-*` key here would only create gaps
 *  (real regression: `aria-current` on a Breadcrumb's active link) without
 *  buying any actual safety. `data-*` is also how a deliberate, sanctioned
 *  product feature works (the Inspector's "custom data-*" escape hatch). */
export const GLOBAL_ATTRS: readonly string[] = ["id", "title", "role", "tabindex", "hidden"];

/** Deliberately excludes `script style object embed link meta base noscript
 *  template iframe`. Also deliberately excludes `action`/`formaction`/`method`
 *  on `form`/`button` — real submission is a behavior marker (`data-sui-action`)
 *  the host wires, never a raw attribute, so a raw form can't be pointed at an
 *  arbitrary exfiltration endpoint. */
export const RAW_ELEMENTS: ReadonlyMap<string, RawElementMeta> = new Map(
  Object.entries({
    // structure
    div: { group: "structure" },
    section: { group: "structure" },
    article: { group: "structure" },
    nav: { group: "structure" },
    header: { group: "structure" },
    footer: { group: "structure" },
    aside: { group: "structure" },
    main: { group: "structure" },
    span: { group: "structure" },

    // text
    h1: { group: "text" },
    h2: { group: "text" },
    h3: { group: "text" },
    h4: { group: "text" },
    h5: { group: "text" },
    h6: { group: "text" },
    p: { group: "text" },
    strong: { group: "text" },
    em: { group: "text" },
    b: { group: "text" },
    i: { group: "text" },
    small: { group: "text" },
    mark: { group: "text" },
    blockquote: { group: "text", attrs: ["cite"] },
    pre: { group: "text" },
    code: { group: "text" },
    kbd: { group: "text" },
    var: { group: "text" },
    samp: { group: "text" },
    sub: { group: "text" },
    sup: { group: "text" },
    abbr: { group: "text", attrs: ["title"] },
    dfn: { group: "text" },
    q: { group: "text", attrs: ["cite"] },
    s: { group: "text" },
    u: { group: "text" },
    del: { group: "text" },
    ins: { group: "text" },
    address: { group: "text" },
    time: { group: "text", attrs: ["datetime"] },
    br: { group: "text" },
    hr: { group: "text" },
    wbr: { group: "text" },

    // list
    ul: { group: "list" },
    ol: { group: "list", attrs: ["start", "reversed", "type"] },
    li: { group: "list" },
    dl: { group: "list" },
    dt: { group: "list" },
    dd: { group: "list" },

    // media
    img: { group: "media", attrs: ["src", "alt", "width", "height", "loading", "decoding", "srcset", "sizes"] },
    picture: { group: "media" },
    source: { group: "media", attrs: ["src", "srcset", "media", "type", "sizes"] },
    figure: { group: "media" },
    figcaption: { group: "media" },
    svg: { group: "media", attrs: ["viewBox", "width", "height", "fill", "stroke"] },
    path: { group: "media", attrs: ["d", "fill", "stroke", "stroke-width"] },
    circle: { group: "media", attrs: ["cx", "cy", "r", "fill", "stroke"] },
    rect: { group: "media", attrs: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke"] },
    line: { group: "media", attrs: ["x1", "y1", "x2", "y2", "stroke"] },
    polygon: { group: "media", attrs: ["points", "fill", "stroke"] },
    polyline: { group: "media", attrs: ["points", "fill", "stroke"] },
    g: { group: "media", attrs: ["fill", "stroke", "transform"] },

    // table
    table: { group: "table" },
    thead: { group: "table" },
    tbody: { group: "table" },
    tfoot: { group: "table" },
    tr: { group: "table" },
    th: { group: "table", attrs: ["colspan", "rowspan", "scope"] },
    td: { group: "table", attrs: ["colspan", "rowspan"] },
    caption: { group: "table" },
    colgroup: { group: "table" },
    col: { group: "table", attrs: ["span"] },

    // form
    form: { group: "form", attrs: ["novalidate"] },
    input: {
      group: "form",
      attrs: [
        "type", "name", "value", "placeholder", "checked", "disabled", "required",
        "readonly", "min", "max", "step", "pattern", "autocomplete", "multiple",
      ],
    },
    textarea: { group: "form", attrs: ["name", "placeholder", "rows", "cols", "disabled", "required", "readonly"] },
    select: { group: "form", attrs: ["name", "disabled", "required", "multiple"] },
    option: { group: "form", attrs: ["value", "disabled", "selected"] },
    optgroup: { group: "form", attrs: ["label", "disabled"] },
    label: { group: "form", attrs: ["for"] },
    button: { group: "form", attrs: ["type", "disabled"] },
    fieldset: { group: "form", attrs: ["disabled"] },
    legend: { group: "form" },
    output: { group: "form", attrs: ["for", "name"] },
    progress: { group: "form", attrs: ["value", "max"] },
    meter: { group: "form", attrs: ["value", "min", "max", "low", "high", "optimum"] },

    // interactive
    a: { group: "interactive", attrs: ["href", "target", "rel", "download"] },
    details: { group: "interactive", attrs: ["open"] },
    summary: { group: "interactive" },
  }),
);

/** Attributes that carry a URL get a scheme check independent of the tag whitelist. */
const URL_ATTRS: ReadonlySet<string> = new Set(["href", "src", "srcset", "cite"]);
const SAFE_SCHEME = /^(?:https?:|mailto:|tel:)/i;
/** A schemeless (relative/anchor/query) URL is always safe — it can't leave the origin. */
function isSafeUrl(value: string): boolean {
  if (value === "") return true;
  if (value.startsWith("/") || value.startsWith("#") || value.startsWith("?") || value.startsWith(".")) return true;
  return SAFE_SCHEME.test(value);
}

export interface SanitizedElement {
  tag: string;
  attrs: Record<string, string | number | boolean> | undefined;
}

/**
 * Sanitize an element node's tag + attrs against the whitelist above. An
 * unlisted tag downgrades to `div` (the node keeps its slot in the tree rather
 * than vanishing); attrs not on the allow-set for the resolved tag are dropped
 * silently, including anything with a disallowed URL scheme. `target="_blank"`
 * always gets `rel="noopener noreferrer"` force-set, regardless of what was
 * authored.
 */
export function sanitizeElement(
  tag: string,
  attrs: Record<string, string | number | boolean> | undefined,
): SanitizedElement {
  const meta = RAW_ELEMENTS.get(tag);
  const safeTag = meta ? tag : "div";
  if (!attrs) return { tag: safeTag, attrs: undefined };

  const allowed = new Set([...GLOBAL_ATTRS, ...(meta?.attrs ?? [])]);
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attrs)) {
    const isSafeNamespace = key.startsWith("aria-") || key.startsWith("data-");
    if (!allowed.has(key) && !isSafeNamespace) continue;
    if (URL_ATTRS.has(key) && typeof value === "string" && !isSafeUrl(value)) continue;
    out[key] = value;
  }
  if (out.target === "_blank") out.rel = "noopener noreferrer";
  return { tag: safeTag, attrs: Object.keys(out).length ? out : undefined };
}
