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

/** Presentation attributes safe on any SVG shape/group — inert styling that
 *  never carries a script or a script-executing URL, so a pasted logo keeps its
 *  fills, opacities, dashes, clips, and transforms. `style` is deliberately
 *  EXCLUDED (matches the no-inline-style rule + dodges CSS `url()` injection);
 *  `clip-path`/`mask` here only ever reference an internal `url(#id)`. */
const SVG_PRESENTATION: readonly string[] = [
  "fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity",
  "fill-rule", "clip-rule", "stroke-linecap", "stroke-linejoin", "stroke-dasharray",
  "stroke-dashoffset", "stroke-miterlimit", "transform", "clip-path", "mask", "color",
];

/** Deliberately excludes `script style object embed link meta base noscript
 *  template iframe`. `iframe` in particular stays out on purpose — it embeds an
 *  arbitrary origin (script execution, clickjacking, framebusting), a different
 *  threat class from `img`/`video`/`audio`, which only play media from a
 *  scheme-checked URL and so ride the same floor as the already-allowed `img`.
 *  Also deliberately excludes `action`/`formaction`/`method` on `form`/`button`
 *  — real submission is a behavior marker (`data-sui-action`) the host wires,
 *  never a raw attribute, so a raw form can't be pointed at an arbitrary
 *  exfiltration endpoint. */
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
    video: {
      group: "media",
      attrs: [
        "src", "poster", "controls", "autoplay", "loop", "muted", "playsinline",
        "preload", "width", "height", "crossorigin",
      ],
    },
    audio: { group: "media", attrs: ["src", "controls", "autoplay", "loop", "muted", "preload", "crossorigin"] },
    figure: { group: "media" },
    figcaption: { group: "media" },
    // ── inline SVG — a broad, safe subset so a pasted brand logo/illustration
    // survives (structure + gradients + clips/masks + text), while the genuine
    // vectors stay closed: `script`/`style`/`foreignObject`/`animate*` are NOT
    // listed (downgrade to div), `on*` fails closed, and external `<use>` /
    // gradient / pattern refs are blocked in `sanitizeElement` (fragment-only).
    svg: { group: "media", attrs: [...SVG_PRESENTATION, "viewBox", "width", "height", "xmlns", "preserveAspectRatio"] },
    g: { group: "media", attrs: [...SVG_PRESENTATION] },
    defs: { group: "media", attrs: [...SVG_PRESENTATION] },
    symbol: { group: "media", attrs: ["viewBox", "preserveAspectRatio"] },
    use: { group: "media", attrs: [...SVG_PRESENTATION, "href", "x", "y", "width", "height"] },
    title: { group: "media" },
    desc: { group: "media" },
    path: { group: "media", attrs: [...SVG_PRESENTATION, "d", "pathLength"] },
    circle: { group: "media", attrs: [...SVG_PRESENTATION, "cx", "cy", "r"] },
    ellipse: { group: "media", attrs: [...SVG_PRESENTATION, "cx", "cy", "rx", "ry"] },
    rect: { group: "media", attrs: [...SVG_PRESENTATION, "x", "y", "width", "height", "rx", "ry"] },
    line: { group: "media", attrs: [...SVG_PRESENTATION, "x1", "y1", "x2", "y2"] },
    polygon: { group: "media", attrs: [...SVG_PRESENTATION, "points"] },
    polyline: { group: "media", attrs: [...SVG_PRESENTATION, "points"] },
    text: {
      group: "media",
      attrs: [...SVG_PRESENTATION, "x", "y", "dx", "dy", "text-anchor", "dominant-baseline", "font-size", "font-family", "font-weight", "letter-spacing"],
    },
    tspan: { group: "media", attrs: [...SVG_PRESENTATION, "x", "y", "dx", "dy", "text-anchor"] },
    clipPath: { group: "media", attrs: ["clipPathUnits"] },
    mask: { group: "media", attrs: ["maskUnits", "maskContentUnits", "x", "y", "width", "height"] },
    pattern: {
      group: "media",
      attrs: ["x", "y", "width", "height", "patternUnits", "patternContentUnits", "patternTransform", "viewBox", "preserveAspectRatio", "href"],
    },
    linearGradient: { group: "media", attrs: ["x1", "y1", "x2", "y2", "gradientUnits", "gradientTransform", "spreadMethod", "href"] },
    radialGradient: { group: "media", attrs: ["cx", "cy", "r", "fx", "fy", "fr", "gradientUnits", "gradientTransform", "spreadMethod", "href"] },
    stop: { group: "media", attrs: ["offset", "stop-color", "stop-opacity"] },
    image: { group: "media", attrs: ["href", "x", "y", "width", "height", "preserveAspectRatio"] },

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
        // `accept` was missing, so every <input type="file" accept="image/*">
        // silently lost its filter — the picker still opened, just unfiltered.
        // It's an inert hint string (no URL, no script surface).
        "accept",
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
const URL_ATTRS: ReadonlySet<string> = new Set(["href", "src", "srcset", "cite", "poster"]);
/** SVG tags whose `href` may ONLY be an internal fragment (`#id`). An external
 *  `<use>` / gradient / pattern reference can pull in a cross-document resource
 *  (data-exfil, and historically a script vector via external SVG) — so these
 *  inherit-from-another-node refs are fragment-only, stricter than `isSafeUrl`. */
const INTERNAL_REF_TAGS: ReadonlySet<string> = new Set(["use", "pattern", "linearGradient", "radialGradient"]);
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
    // `<use>`/gradient/pattern href: internal fragment refs only (never external).
    if (key === "href" && INTERNAL_REF_TAGS.has(safeTag) && !(typeof value === "string" && value.startsWith("#"))) continue;
    out[key] = value;
  }
  if (out.target === "_blank") out.rel = "noopener noreferrer";
  return { tag: safeTag, attrs: Object.keys(out).length ? out : undefined };
}
