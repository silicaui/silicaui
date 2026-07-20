/**
 * The component registry (architecture spec §4) — the SINGLE definition each
 * @wizeworks/silicaui component derives from, and the spine that lets the catalog grow to
 * "lots more" without a renderer edit per component.
 *
 * A component is a MACRO: atomic in the node tree (you select the `Button`, not
 * its inner text), but at render time it EXPANDS to an element (sub)tree that
 * every projection — `toHtml` here, and the builder canvas — renders through its
 * normal ELEMENT path. So a brand-new component ships zero new renderer branches
 * anywhere; it only declares which elements it lowers to.
 *
 * `expand(node)` is pure (Node in, Node out). Its root MUST carry the source
 * node's class + system metadata (id/data/behavior/part), so the lowered element
 * emits the exact same classes + `data-sui-*` attributes the component would —
 * `lower()` does this correctly, so defs should always build through it.
 */
import type { Child, ComponentNode, ElementNode, Node } from "./schema";
import { esc } from "./class-utils";

/**
 * Known embed providers for the curated `Embed` component: how a shareable URL
 * maps to a provider EMBED URL, plus the closed host allowlist an emitted
 * `<iframe>` may point at. `iframe` is deliberately NOT in the raw-element floor
 * (an arbitrary authored `<iframe>` still downgrades to `<div>`); ONLY this
 * component emits one, and only to an allowlisted third-party host, sandboxed —
 * so maps/video embeds work without opening arbitrary-origin embedding to every
 * authored page. Anything unrecognized falls back to a plain link, never an iframe.
 */
const EMBED_PROVIDERS: ReadonlyArray<{ test: RegExp; embed: (m: RegExpMatchArray) => string }> = [
  // YouTube (watch / youtu.be / embed) → privacy-friendly nocookie embed.
  {
    test: /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
    embed: (m) => `https://www.youtube-nocookie.com/embed/${m[1]}`,
  },
  // Vimeo.
  { test: /vimeo\.com\/(?:video\/)?(\d+)/, embed: (m) => `https://player.vimeo.com/video/${m[1]}` },
  // Google Maps — must already be an /maps/embed URL (the shareable "embed a map" form).
  { test: /^https:\/\/www\.google\.com\/maps\/embed\?[^\s"'<>]+$/, embed: (m) => m[0] },
];
/** The ONLY hosts an emitted embed `<iframe>` src may resolve to (post-normalization). */
const EMBED_HOSTS = /^https:\/\/(?:www\.youtube-nocookie\.com|player\.vimeo\.com|www\.google\.com)\//;

/** Map a user URL to a safe, allowlisted embed URL — or `undefined` if it isn't a
 *  recognized provider (caller falls back to a link, never a raw iframe). */
function resolveEmbed(url: string): string | undefined {
  for (const p of EMBED_PROVIDERS) {
    const m = url.match(p.test);
    if (m) {
      const embed = p.embed(m);
      if (EMBED_HOSTS.test(embed)) return embed;
    }
  }
  return EMBED_HOSTS.test(url) ? url : undefined; // already a bare allowlisted embed URL
}

export interface ComponentDef {
  /** The key as it appears in `ComponentNode.component` (e.g. 'Button'). */
  name: string;
  /** Palette grouping for hosts: 'layout' | 'content' | 'media' | 'form' | … */
  category: string;
  /** Human label for palette rows + the Navigator. */
  label: string;
  /** Icon NAME a host resolves to a glyph (the builder maps it to inline SVG). */
  icon: string;
  /**
   * Whether this component holds child nodes (a layout/wrapper) rather than being
   * a leaf. Drives a host's insert-INSIDE vs insert-BESIDE choice — the builder
   * derives its container set from this flag instead of hand-listing names, so a
   * new container component needs no engine edit. Render-neutral (no effect on
   * `expand()`/toHtml).
   */
  container?: boolean;
  /**
   * The prop a bare `data:'value'` bind fills when no explicit `attr` is given —
   * this component's PRIMARY content. A component DECLARES its own bind target
   * instead of the resolver guessing at one: `resolve.ts` used to hardcode
   * `node.component === "Image" || node.component === "Avatar"` plus a
   * `"src" in props` sniff, which meant (a) every new bindable component needed
   * a resolver edit, and (b) any component that merely HAS a `src` prop would
   * silently take a bound name into its image URL. Same coupling `container`
   * was introduced to kill.
   *
   * Absent → the auto-detection default applies (`label` if present, else
   * `text`). Render-neutral: `expand()` never reads it.
   */
  primary?: string;
  /**
   * Lower this component node to an element (sub)tree. Pure. The returned root
   * carries the source node's class + system metadata so projections emit
   * identical markup — build it with `lower()`.
   */
  expand: (node: ComponentNode) => Node;
}

/** `ratio` prop → the aspect utility an Image wears. */
const RATIO_CLASS: Record<string, string> = {
  wide: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

interface LowerOpts {
  /** Class override. When omitted, the source node's own class is inherited;
   *  when the key is present (even `""`), it REPLACES it (Image needs this). */
  class?: string;
  attrs?: ElementNode["attrs"];
  children?: Child[];
}

/**
 * Build a component's expansion root: an element that inherits the source node's
 * class + every system-metadata marker, so the lowered element is byte-for-byte
 * indistinguishable from a hand-authored one (same class tokens for the prefixer,
 * same `data-sui-*` lowering). This is what makes "component = element subtree"
 * transparent to the projections.
 */
function lower(node: ComponentNode, tag: string, opts: LowerOpts = {}): ElementNode {
  const out: ElementNode = { kind: "element", tag };
  const cls = "class" in opts ? opts.class : node.class;
  if (cls) out.class = cls;
  if (opts.attrs) out.attrs = opts.attrs;
  if (opts.children && opts.children.length) out.children = opts.children;
  // Carry identity + system metadata verbatim (HTML lowering reads these).
  if (node.id != null) out.id = node.id;
  // A resolved trusted-HTML bind sits on the component node; carry it to the
  // expansion element so `toHtml` emits it (rich text on e.g. a RichText/Prose).
  if (node.rawHtml != null) out.rawHtml = node.rawHtml;
  if (node.label != null) out.label = node.label;
  if (node.slot) out.slot = node.slot;
  if (node.data) out.data = node.data;
  if (node.behavior) out.behavior = node.behavior;
  if (node.part) out.part = node.part;
  return out;
}

/**
 * Children for a text-bearing atom: its real children if any, else its text-like
 * prop lowered to a lone string child (the element path escapes it, matching the
 * old atom's `esc(text)`). Mirrors `childrenHtml || text` for every real input.
 */
function textChildren(node: ComponentNode, key: string): Child[] | undefined {
  if (node.children && node.children.length) return node.children;
  const text = node.props?.[key];
  return text != null ? [String(text)] : undefined;
}

/**
 * Pull the whitelisted form attributes a control carries from its props onto a
 * base attr set. Values pass RAW (cast) so `attr()`'s boolean/omit semantics match
 * a hand-authored element exactly. The whitelist is intentionally the lowercase
 * HTML attribute names the inspector/palette set — casing that React also accepts
 * (`name`/`required`/`disabled`/`rows`), so the same attrs render clean on the
 * builder canvas without a DOM-property warning.
 */
function formAttrs(
  node: ComponentNode,
  base: NonNullable<ElementNode["attrs"]>,
  keys: readonly string[],
): NonNullable<ElementNode["attrs"]> {
  const out: NonNullable<ElementNode["attrs"]> = { ...base };
  const props = node.props ?? {};
  for (const k of keys) {
    const v = props[k];
    if (v != null) out[k] = v as string | number | boolean;
  }
  return out;
}

/** Text-bearing form controls (value optional; canvas lowers value→defaultValue). */
const FIELD_KEYS = ["name", "placeholder", "value", "required", "disabled"] as const;
/** Selectable controls — checkbox/radio/toggle. */
const CHECK_KEYS = ["name", "value", "checked", "required", "disabled"] as const;

/**
 * Checkbox / Radio / Toggle, bare or captioned — one shape for both layers.
 *
 * Without children the control renders bare. With children it's wrapped in a
 * `<label>` so the caption is a real click target, matching what
 * `silicaui-react` emits for `<Checkbox>Run tests</Checkbox>`.
 *
 * The node's own `class` always lands on the **input**, never the wrapper.
 * That's the fix for a real bug in the old captioned path: `lower()` carries
 * `node.class` to whatever tag it's given, so routing it to the `<label>` left
 * the actual control with no `.checkbox`/`.radio` class — i.e. an unstyled
 * native control in every static/non-React output.
 */
function checkControl(
  n: ComponentNode,
  type: "checkbox" | "radio",
  extraAttrs?: Record<string, string>,
): ElementNode {
  const attrs = { ...formAttrs(n, { type, ...extraAttrs }, CHECK_KEYS) };
  if (!n.children?.length) return lower(n, "input", { attrs });
  const input = elc("input", n.class, undefined, attrs);
  return lower(n, "label", {
    class: "label label-control",
    children: [input, ...n.children],
  });
}

/** One `props.options` entry → an `<option>` element child of a Select. */
function toOption(opt: unknown): Child {
  if (opt != null && typeof opt === "object") {
    const o = opt as { value?: unknown; label?: unknown };
    const label = o.label != null ? String(o.label) : String(o.value ?? "");
    const node: ElementNode = { kind: "element", tag: "option", children: [label] };
    if (o.value != null) node.attrs = { value: String(o.value) };
    return node;
  }
  const s = String(opt);
  return { kind: "element", tag: "option", children: [s] };
}

/** Build a plain INNER element of a component expansion (not the macro root, so
 *  it carries no source metadata — that lives on the root via `lower`). */
function elc(
  tag: string,
  cls?: string,
  children?: Child[],
  attrs?: ElementNode["attrs"],
): ElementNode {
  const node: ElementNode = { kind: "element", tag };
  if (cls) node.class = cls;
  if (attrs) node.attrs = attrs;
  if (children && children.length) node.children = children;
  return node;
}

/** A component's `props.items` list (Breadcrumb/Menu/Steps/Timeline) as strings.
 *  Absent/non-array → `[]` (an empty structure; the palette seeds demo items). */
function itemsOf(node: ComponentNode): string[] {
  const raw = node.props?.items;
  return Array.isArray(raw) ? raw.map(String) : [];
}

/** `props.items` for Combobox/Autocomplete/MultiSelect: bare strings or
 *  `{value, label}` objects, normalized to `{value, label}` (default 'string
 *  is value+label' matches the React components' own `defaultLabel`). */
function valueLabelItems(raw: unknown): Array<{ value: string; label: string }> {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((entry) => {
    const o = entry != null && typeof entry === "object" ? (entry as { value?: unknown; label?: unknown }) : undefined;
    const value = o?.value != null ? String(o.value) : String(entry);
    const label = o?.label != null ? String(o.label) : value;
    return { value, label };
  });
}

/** Determinate Progress fill → a LITERAL width utility (no inline style; the raw
 *  strings must be present in-source so the harness `@source` scan safelists them).
 *  The value snaps to the nearest bucket. */
const PROGRESS_WIDTHS: ReadonlyArray<readonly [number, string]> = [
  [0, "w-0"],
  [25, "w-1/4"],
  [33, "w-1/3"],
  [50, "w-1/2"],
  [66, "w-2/3"],
  [75, "w-3/4"],
  [100, "w-full"],
];
function progressWidth(value: number): string {
  let best: readonly [number, string] = PROGRESS_WIDTHS[0]!;
  for (const bucket of PROGRESS_WIDTHS) {
    if (Math.abs(bucket[0] - value) < Math.abs(best[0] - value)) best = bucket;
  }
  return best[1];
}

/** Builds a Combobox/Autocomplete/MultiSelect `expand()`: the whole
 *  input+popup+options structure from `props.items`, since these are
 *  single, self-contained React components (an `items` prop, not authored
 *  child nodes) — see the registrations below. `mode` becomes the
 *  `combobox` behavior's `params.mode`. */
function comboboxExpand(mode: "select" | "freetext" | "multiple") {
  return (n: ComponentNode): Node => {
    const p = n.props ?? {};
    const items = valueLabelItems(p.items);
    const rawSelected = mode === "multiple" ? (p.value ?? p.defaultValue) : [p.value ?? p.defaultValue];
    const selected = new Set((Array.isArray(rawSelected) ? rawSelected : rawSelected != null ? [rawSelected] : []).map(String));

    const optionEls: ElementNode[] = items.map((item) => {
      const isSelected = selected.has(item.value);
      const attrs: NonNullable<ElementNode["attrs"]> = {
        role: "option",
        "data-value": item.value,
        "aria-selected": String(isSelected),
      };
      if (isSelected && mode === "multiple") attrs.hidden = true;
      const opt = elc("div", "select-item", [item.label], attrs);
      opt.part = "item";
      return opt;
    });
    const panelChildren: Child[] = optionEls.length
      ? optionEls
      : [elc("div", "combobox-empty", [String(p.emptyMessage ?? "No results found.")])];
    const panel = elc("div", "select-popup", panelChildren, { role: "listbox", hidden: true });
    panel.part = "panel";

    const singleLabel = mode === "multiple" ? undefined : items.find((i) => selected.has(i.value))?.label;
    const inputAttrs = formAttrs(
      n,
      {
        type: "text",
        role: "combobox",
        "aria-expanded": "false",
        autocomplete: "off",
        ...(singleLabel ? { value: singleLabel } : {}),
      },
      ["name", "placeholder", "required", "disabled"],
    );
    const input = elc("input", "combobox-input", undefined, inputAttrs);

    const children: Child[] = [input, panel];
    if (mode === "multiple") {
      const chips = items
        .filter((i) => selected.has(i.value))
        .map((i) =>
          elc("span", "multi-select-chip", [
            i.label,
            elc("button", "multi-select-chip-remove", ["×"], {
              type: "button",
              "aria-label": `Remove ${i.label}`,
              "data-remove-value": i.value,
            }),
          ], { "data-chip-value": i.value }),
        );
      children.unshift(elc("div", "multi-select-chips", chips));
    }

    const out = lower(n, "div", { children });
    if (!out.behavior) out.behavior = { type: "combobox", params: { mode } };
    return out;
  };
}

interface SegmentCfg {
  kind: "segment";
  role: string;
  digits: number;
  min?: number;
  max?: number;
  cycle?: string[];
}
interface LiteralCfg {
  kind: "literal";
  text: string;
}

/** One `data-segment` cell, configured for `date-segment`'s digit-buffer /
 *  cycle logic to read at hydrate time (see `component.ts`'s expand-time
 *  Intl-derived segment order — same "compute via Intl, don't hardcode
 *  MM/DD/YYYY" rule `Timestamp` already established). */
function segmentEl(cfg: SegmentCfg, value: number | null): ElementNode {
  // Each spinbutton needs a name — without one a SR announces three anonymous
  // spinners. The segment role ("month"/"day"/"year"…) IS the name.
  const label = cfg.role.charAt(0).toUpperCase() + cfg.role.slice(1);
  const attrs: NonNullable<ElementNode["attrs"]> = {
    role: "spinbutton",
    tabindex: 0,
    "aria-label": label,
    "data-role": cfg.role,
  };
  if (cfg.cycle) attrs["data-cycle"] = JSON.stringify(cfg.cycle);
  else {
    attrs["data-min"] = cfg.min ?? 0;
    attrs["data-max"] = cfg.max ?? 0;
    attrs["data-digits"] = cfg.digits;
  }
  if (value != null) attrs["aria-valuenow"] = value;
  const el = elc("span", "segment-field-segment", undefined, attrs);
  el.part = "segment";
  return el;
}
function literalEl(text: string): ElementNode {
  return elc("span", "segment-field-literal", [text], { "aria-hidden": "true" });
}

/** `new Date("YYYY-MM-DD")` parses as UTC midnight, which reads back a day
 *  early in any timezone behind UTC once `.getDate()` runs in local time —
 *  a date-only string is parsed as local components instead; anything else
 *  (a full ISO datetime, a `Date` instance) goes through `new Date()` as-is. */
function parseDateLike(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function partsFromDateValue(v: unknown): { month?: number; day?: number; year?: number } | null {
  const d = parseDateLike(v);
  if (!d) return null;
  return { month: d.getMonth() + 1, day: d.getDate(), year: d.getFullYear() };
}

/** Segment order + literal separators for a date, derived from `Intl` for
 *  the given locale — never hardcoded to MM/DD/YYYY. */
function buildDateSegments(locale?: string): Array<SegmentCfg | LiteralCfg> {
  const parts = new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
    new Date(2000, 0, 2),
  );
  const out: Array<SegmentCfg | LiteralCfg> = [];
  for (const part of parts) {
    if (part.type === "month") out.push({ kind: "segment", role: "month", digits: 2, min: 1, max: 12 });
    else if (part.type === "day") out.push({ kind: "segment", role: "day", digits: 2, min: 1, max: 31 });
    else if (part.type === "year") out.push({ kind: "segment", role: "year", digits: 4, min: 1, max: 9999 });
    else if (part.type === "literal") out.push({ kind: "literal", text: part.value });
  }
  return out;
}
function dateSegmentChildren(locale: string | undefined, dateValue: unknown): Child[] {
  const parts = partsFromDateValue(dateValue) as Record<string, number> | null;
  return buildDateSegments(locale).map((cfg) =>
    cfg.kind === "literal" ? literalEl(cfg.text) : segmentEl(cfg, parts?.[cfg.role] ?? null),
  );
}

/** Segment order + literals for a time, derived from `Intl` given
 *  `hourCycle`/`showSeconds` (mirrors `resolveHour12`'s locale-fallback rule). */
function buildTimeSegments(locale: string | undefined, hourCycle: 12 | 24 | undefined, showSeconds: boolean): Array<SegmentCfg | LiteralCfg> {
  const hour12 = hourCycle === 12 ? true : hourCycle === 24 ? false : new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12;
  const sample = new Date(2000, 0, 1, 13, 5, 9);
  const parts = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    ...(showSeconds ? { second: "2-digit" } : {}),
    hour12,
  }).formatToParts(sample);
  const out: Array<SegmentCfg | LiteralCfg> = [];
  for (const part of parts) {
    if (part.type === "hour") out.push({ kind: "segment", role: "hour", digits: 2, min: hour12 ? 1 : 0, max: hour12 ? 12 : 23 });
    else if (part.type === "minute") out.push({ kind: "segment", role: "minute", digits: 2, min: 0, max: 59 });
    else if (part.type === "second") out.push({ kind: "segment", role: "second", digits: 2, min: 0, max: 59 });
    else if (part.type === "dayPeriod") out.push({ kind: "segment", role: "period", digits: 0, cycle: ["AM", "PM"] });
    else if (part.type === "literal") out.push({ kind: "literal", text: part.value });
  }
  return out;
}

/** The invented calendar-grid shell (header w/ prev/next/title + an empty
 *  grid the `calendar` behavior populates at hydrate time — see
 *  `calendar.ts`; day cells can't be authored statically since they depend
 *  on which month is showing). Shared by `Calendar` and the
 *  `DatePicker`/`DateRangePicker` popover content, which nest this same
 *  shell as an inner `calendar`-behavior root inside their own `panel`. */
function calendarParts(): { header: ElementNode; grid: ElementNode; hidden: ElementNode } {
  // NOT role=grid: the behavior renders 42 flat buttons (CSS grid does the
  // layout), and a `grid` without row/gridcell descendants is an ARIA
  // structure violation. A labeled group of fully-named day buttons (see
  // calendar.ts) is the honest shape.
  const grid = elc("div", "calendar-grid", undefined, { role: "group", "aria-label": "Calendar" });
  grid.part = "grid";
  const title = elc("div", "calendar-title", undefined, { "aria-live": "polite" });
  title.part = "title";
  const prev = elc("button", "calendar-nav", ["‹"], { type: "button", "aria-label": "Previous month" });
  prev.part = "prev";
  const next = elc("button", "calendar-nav", ["›"], { type: "button", "aria-label": "Next month" });
  next.part = "next";
  const header = elc("div", "calendar-header", [prev, title, next]);
  const hidden = elc("input", undefined, undefined, { type: "hidden" });
  return { header, grid, hidden };
}
function calendarParamsFromProps(p: Record<string, unknown>): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (p.mode === "range") params.mode = "range";
  if (typeof p.weekStartsOn === "number") params.weekStartsOn = p.weekStartsOn;
  const value = p.value ?? p.defaultValue;
  if (typeof value === "string") params.defaultValue = value;
  return params;
}

/** Builds a Range/Slider `expand()`: both are single self-contained React
 *  components (Root>Control>Track>Indicator+Thumb[], `value`/`defaultValue`
 *  shape decides thumb count) — same "auto-generate from props" precedent
 *  as `SelectionList`/`Carousel`'s invented structure. `kind` only changes
 *  the class-name prefix (Range = compact, Slider = rich w/ `showValue`). */
function sliderExpand(kind: "range" | "slider") {
  return (n: ComponentNode): Node => {
    const p = n.props ?? {};
    const min = typeof p.min === "number" ? p.min : 0;
    const max = typeof p.max === "number" ? p.max : 100;
    const step = typeof p.step === "number" ? p.step : 1;
    const raw = p.value ?? p.defaultValue;
    const values = (Array.isArray(raw) ? raw : [typeof raw === "number" ? raw : min]).map(Number);

    const thumbs = values.map((v, i) => {
      // An unnamed role=slider is announced as a bare number; two of them in
      // a range are indistinguishable. Default names, author-overridable via
      // a wrapping label.
      const thumbLabel =
        values.length === 1 ? "Value" : values.length === 2 ? (i === 0 ? "Minimum value" : "Maximum value") : `Value ${i + 1}`;
      const t = elc("div", `${kind}-thumb`, undefined, {
        role: "slider",
        tabindex: 0,
        "aria-label": thumbLabel,
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": v,
      });
      t.part = "thumb";
      return t;
    });
    const hiddenInputs = values.map((v) =>
      elc("input", undefined, undefined, { type: "hidden", value: v, ...(p.name != null ? { name: String(p.name) } : {}) }),
    );
    const indicator = elc("div", `${kind}-indicator`);
    const track = elc("div", `${kind}-track`, [indicator, ...thumbs]);
    track.part = "track";
    const control = elc("div", `${kind}-control`, [track]);

    const children: Child[] = [control, ...hiddenInputs];
    if (kind === "slider" && p.showValue === true) {
      children.unshift(elc("output", "slider-value", [String(values[0] ?? "")]));
    }
    const out = lower(n, "div", { children });
    if (!out.behavior) out.behavior = { type: "slider", params: { min, max, step } };
    return out;
  };
}

/** Builds a Dropzone/FileUpload `expand()`: root itself is the draggable/
 *  clickable target (matches `dropzone.ts`'s expectation that drag/drop/
 *  click listeners attach to `root`), carrying a hidden `input` and (for
 *  FileUpload only) a `list` part the behavior renders managed file rows
 *  into. */
function dropzoneExpand(withList: boolean) {
  return (n: ComponentNode): Node => {
    const p = n.props ?? {};
    const inputAttrs: NonNullable<ElementNode["attrs"]> = { type: "file", tabindex: -1 };
    if (p.accept != null) inputAttrs.accept = String(p.accept);
    if (p.multiple !== false) inputAttrs.multiple = true;
    if (p.disabled === true) inputAttrs.disabled = true;
    const input = elc("input", "dropzone-input", undefined, inputAttrs);
    input.part = "input";

    const body: Child[] =
      n.children && n.children.length
        ? n.children
        : [
            elc("span", "dropzone-icon", ["⬆"]),
            elc("span", "dropzone-title", [String(p.title ?? "Drop files here, or click to browse")]),
            ...(p.hint != null ? [elc("span", "dropzone-hint", [String(p.hint)])] : []),
          ];

    const children: Child[] = [input, ...body];
    if (withList) {
      const list = elc("div", "dropzone-file-list");
      list.part = "list";
      children.push(list);
    }

    const attrs: NonNullable<ElementNode["attrs"]> = { role: "button", tabindex: p.disabled === true ? -1 : 0 };
    if (p.disabled === true) attrs["aria-disabled"] = "true";
    const out = lower(n, "div", { attrs, children });
    if (!out.behavior) {
      const params: Record<string, unknown> = {};
      if (p.accept != null) params.accept = String(p.accept);
      if (typeof p.maxSize === "number") params.maxSize = p.maxSize;
      out.behavior = { type: "dropzone", params };
    }
    return out;
  };
}

/** A curated, dependency-free calling-code default for `PhoneInput` — a
 *  trimmed set (the full ~100-country list lives in
 *  `silicaui-react/lib/countries.ts`; a host passes `props.countries` to
 *  extend/replace this, same escape hatch the React component offers). */
const DEFAULT_COUNTRIES: Array<{ iso2: string; name: string; dial: string }> = [
  { iso2: "US", name: "United States", dial: "1" },
  { iso2: "CA", name: "Canada", dial: "1" },
  { iso2: "MX", name: "Mexico", dial: "52" },
  { iso2: "GB", name: "United Kingdom", dial: "44" },
  { iso2: "IE", name: "Ireland", dial: "353" },
  { iso2: "FR", name: "France", dial: "33" },
  { iso2: "DE", name: "Germany", dial: "49" },
  { iso2: "ES", name: "Spain", dial: "34" },
  { iso2: "IT", name: "Italy", dial: "39" },
  { iso2: "NL", name: "Netherlands", dial: "31" },
  { iso2: "PT", name: "Portugal", dial: "351" },
  { iso2: "CH", name: "Switzerland", dial: "41" },
  { iso2: "SE", name: "Sweden", dial: "46" },
  { iso2: "NO", name: "Norway", dial: "47" },
  { iso2: "DK", name: "Denmark", dial: "45" },
  { iso2: "FI", name: "Finland", dial: "358" },
  { iso2: "PL", name: "Poland", dial: "48" },
  { iso2: "BR", name: "Brazil", dial: "55" },
  { iso2: "AR", name: "Argentina", dial: "54" },
  { iso2: "IN", name: "India", dial: "91" },
  { iso2: "CN", name: "China", dial: "86" },
  { iso2: "JP", name: "Japan", dial: "81" },
  { iso2: "KR", name: "South Korea", dial: "82" },
  { iso2: "AU", name: "Australia", dial: "61" },
  { iso2: "NZ", name: "New Zealand", dial: "64" },
  { iso2: "ZA", name: "South Africa", dial: "27" },
];

/** RadialProgress's `--value` fill, bucketed to literal `[--value:N]` utility
 *  classes (5% steps) — the arbitrary-property equivalent of `PROGRESS_WIDTHS`,
 *  needed because a continuous value can't be an inline style (no inline style,
 *  ever) but a conic-gradient ring wants finer granularity than 7 fixed widths. */
const RADIAL_VALUE_CLASSES: Record<number, string> = Object.fromEntries(
  Array.from({ length: 21 }, (_, i) => i * 5).map((v) => [v, `[--value:${v}]`]),
);

/** A plain element atom: one tag carrying class + (children | text prop). */
function elementDef(
  name: string,
  category: string,
  icon: string,
  tag: string,
  container = false,
): ComponentDef {
  return {
    name,
    category,
    label: name,
    icon,
    container,
    expand: (n) => lower(n, tag, { children: textChildren(n, "text") }),
  };
}

/** The built-in components — the 12 original atoms, now registry-driven. */
export const BUILTIN_COMPONENTS: ComponentDef[] = [
  // Button — a <button>, or an <a> when it carries an href; label is text sugar.
  {
    name: "Button",
    category: "content",
    label: "Button",
    icon: "button",
    expand: (n) => {
      const children =
        n.children && n.children.length
          ? n.children
          : n.props?.label != null
            ? [String(n.props.label)]
            : undefined;
      const href = n.props?.href;
      if (href != null) return lower(n, "a", { attrs: { href: href as string }, children });
      const type = (n.props?.type ?? "button") as string;
      return lower(n, "button", { attrs: { type }, children });
    },
  },
  // Image — a self-closing <img>; `ratio` maps to an aspect utility appended to
  // the class, then the whole string is prefixed as normal.
  {
    name: "Image",
    category: "media",
    label: "Image",
    icon: "image",
    primary: "src", // an image IS its source — a bare bind fills the URL, not alt text
    expand: (n) => {
      const ratio = n.props?.ratio;
      const ratioClass = typeof ratio === "string" ? RATIO_CLASS[ratio] ?? "" : "";
      const full = [n.class, ratioClass].filter(Boolean).join(" ");
      const attrs: NonNullable<ElementNode["attrs"]> = {};
      if (n.props?.src != null) attrs.src = n.props.src as string;
      attrs.alt = (n.props?.alt ?? "") as string;
      attrs.loading = "lazy";
      return lower(n, "img", { class: full, attrs });
    },
  },
  // Video — a native <video>; `ratio` maps to an aspect utility like Image. A
  // single `src` renders on the element; `props.sources` (`{src,type}[]`) OR
  // authored children (hand-authored <source>/<track>) render nested instead,
  // so the browser can pick a format. Boolean playback props follow the `=== true`
  // convention every other boolean prop uses (the inspector toggle writes
  // `undefined` when off), so a freshly-dropped Video seeds `controls: true`.
  {
    name: "Video",
    category: "media",
    label: "Video",
    icon: "video",
    expand: (n) => {
      const p = n.props ?? {};
      const ratio = p.ratio;
      const ratioClass = typeof ratio === "string" ? RATIO_CLASS[ratio] ?? "" : "";
      const full = [n.class, ratioClass].filter(Boolean).join(" ");
      const sources = Array.isArray(p.sources) ? p.sources : [];
      const sourceEls = sources
        .map((s): { src?: unknown; type?: unknown } =>
          s != null && typeof s === "object" ? (s as { src?: unknown; type?: unknown }) : { src: s },
        )
        .filter((s) => s.src != null)
        .map((s) => {
          const attrs: NonNullable<ElementNode["attrs"]> = { src: String(s.src) };
          if (s.type != null) attrs.type = String(s.type);
          return elc("source", undefined, undefined, attrs);
        });
      const children: Child[] | undefined =
        n.children && n.children.length ? n.children : sourceEls.length ? sourceEls : undefined;
      const attrs: NonNullable<ElementNode["attrs"]> = {};
      // A direct `src` only when there's no nested <source> set (they'd conflict).
      if (!children && p.src != null) attrs.src = String(p.src);
      if (p.poster != null) attrs.poster = String(p.poster);
      if (p.controls === true) attrs.controls = true;
      if (p.autoplay === true) attrs.autoplay = true;
      if (p.loop === true) attrs.loop = true;
      if (p.muted === true) attrs.muted = true;
      if (p.playsinline === true) attrs.playsinline = true;
      if (p.preload != null) attrs.preload = String(p.preload);
      return lower(n, "video", { class: full, attrs, children });
    },
  },
  // Embed — a curated third-party embed (YouTube / Vimeo / Google Maps). The
  // ONLY component that emits an <iframe>, and only to an allowlisted host, in a
  // sandbox, via `rawHtml` (so it bypasses the floor that downgrades arbitrary
  // authored iframes to <div>). `props.url` is normalized to the provider's embed
  // URL; anything unrecognized falls back to a plain link — never a raw iframe.
  // `ratio` sizes the responsive frame (default 16:9).
  {
    name: "Embed",
    category: "media",
    label: "Embed",
    icon: "video",
    expand: (n) => {
      const p = n.props ?? {};
      const url = String(p.url ?? p.src ?? "").trim();
      const ratioClass = typeof p.ratio === "string" ? RATIO_CLASS[p.ratio] ?? "aspect-video" : "aspect-video";
      const full = [n.class, ratioClass].filter(Boolean).join(" ");
      const title = p.title != null ? String(p.title) : "Embedded content";
      const embed = resolveEmbed(url);
      if (embed) {
        // Trusted, macro-built iframe: fixed sandbox + permissions, allowlisted
        // src. Sized via utility classes, not a style attribute — a style
        // attribute needs CSP `style-src 'unsafe-inline'`, and these classes ride
        // the same scan as the wrapper's macro-added `relative`/ratio utilities.
        const iframe =
          `<iframe src="${esc(embed)}" title="${esc(title)}" loading="lazy" ` +
          `class="absolute inset-0 h-full w-full border-0" ` +
          `referrerpolicy="strict-origin-when-cross-origin" ` +
          `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" ` +
          `allowfullscreen sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms"></iframe>`;
        const out = lower(n, "div", { class: `${full} relative`.trim() });
        out.rawHtml = iframe;
        return out;
      }
      // Not a recognized provider → a plain link (or a hint when empty). Never an iframe.
      const fallback: Child = url
        ? elc("a", "link link-primary", [title], { href: url, target: "_blank", rel: "noopener noreferrer" })
        : elc("span", "text-base-content/50 text-sm", ["Add a YouTube, Vimeo, or Google Maps URL"]);
      return lower(n, "div", { class: full, children: [fallback] });
    },
  },
  // Heading — <h1>…<h6> from props.level (default 2, clamped).
  {
    name: "Heading",
    category: "content",
    label: "Heading",
    icon: "heading",
    expand: (n) => {
      const raw = Number(n.props?.level ?? 2);
      const level = Number.isInteger(raw) && raw >= 1 && raw <= 6 ? raw : 2;
      return lower(n, `h${level}`, { children: textChildren(n, "text") });
    },
  },
  // Icon — an inline <span> carrying its name for a runtime/icon font to resolve.
  {
    name: "Icon",
    category: "content",
    label: "Icon",
    icon: "box",
    expand: (n) => {
      const attrs: NonNullable<ElementNode["attrs"]> = { "aria-hidden": "true" };
      if (n.props?.name != null) attrs["data-icon"] = n.props.name as string;
      return lower(n, "span", { attrs });
    },
  },
  // Divider — a void <hr>.
  { name: "Divider", category: "content", label: "Divider", icon: "box", expand: (n) => lower(n, "hr") },
  // Link — a styled inline <a>. Static output had no way to author one at all,
  // so every link in a projected page had to be a raw element node.
  {
    name: "Link",
    category: "nav",
    label: "Link",
    icon: "link",
    container: true,
    expand: (n) => {
      const attrs: NonNullable<ElementNode["attrs"]> = {};
      for (const k of ["href", "target", "rel", "download"] as const) {
        if (n.props?.[k] != null) attrs[k] = n.props[k] as string;
      }
      return lower(n, "a", { attrs, children: textChildren(n, "text") });
    },
  },

  // ── form controls ─────────────────────────────────────────────────────────
  // Each lowers to a native form element, so the browser's built-in behavior +
  // accessibility come for free and the Phase 2 form contract wires the same tags.
  // Input — a single-line <input>; props.type picks the mode (default 'text').
  {
    name: "Input",
    category: "form",
    label: "Input",
    icon: "input",
    expand: (n) =>
      lower(n, "input", {
        attrs: formAttrs(n, { type: (n.props?.type ?? "text") as string }, FIELD_KEYS),
      }),
  },
  // FileInput — an <input type="file">. `type` is fixed, so it isn't reachable
  // through Input's props.type the way the other field modes are.
  {
    name: "FileInput",
    category: "form",
    label: "File input",
    icon: "input",
    expand: (n) =>
      lower(n, "input", {
        attrs: formAttrs(n, { type: "file" }, [...FIELD_KEYS, "accept", "multiple"]),
      }),
  },
  // FloatingLabel — <label> wrapping the control, caption LAST (the CSS floats
  // it via the control's :placeholder-shown, which needs the sibling order the
  // React component also produces: control first, caption second).
  {
    name: "FloatingLabel",
    category: "form",
    label: "Floating label",
    icon: "label",
    container: true,
    expand: (n) => {
      const caption = n.props?.label;
      const children: Child[] = [...(n.children ?? [])];
      if (caption != null) children.push(elc("span", undefined, [String(caption)]));
      return lower(n, "label", { class: n.class ?? "floating-label", children });
    },
  },
  // Textarea — a multi-line <textarea>; text/children are its value.
  {
    name: "Textarea",
    category: "form",
    label: "Textarea",
    icon: "textarea",
    expand: (n) =>
      lower(n, "textarea", {
        attrs: formAttrs(n, {}, [...FIELD_KEYS, "rows"]),
        children: textChildren(n, "text"),
      }),
  },
  // Select — a native <select>; options come from props.options (or child nodes).
  {
    name: "Select",
    category: "form",
    label: "Select",
    icon: "select",
    expand: (n) => {
      const raw = n.props?.options;
      const opts = Array.isArray(raw) ? raw.map(toOption) : [];
      const children = n.children && n.children.length ? n.children : opts;
      return lower(n, "select", {
        attrs: formAttrs(n, {}, ["name", "required", "disabled"]),
        children,
      });
    },
  },
  // Checkbox / Radio / Toggle — native <input>s of the matching type. Toggle shares
  // checkbox semantics; only its class (`toggle`) plus role="switch" makes it a switch.
  {
    name: "Checkbox",
    category: "form",
    label: "Checkbox",
    icon: "checkbox",
    container: true,
    expand: (n) => checkControl(n, "checkbox"),
  },
  {
    name: "Radio",
    category: "form",
    label: "Radio",
    icon: "radio",
    container: true,
    expand: (n) => checkControl(n, "radio"),
  },
  {
    name: "Toggle",
    category: "form",
    label: "Toggle",
    icon: "toggle",
    container: true,
    expand: (n) => checkControl(n, "checkbox", { role: "switch" }),
  },

  // Simple element atoms.
  elementDef("Text", "content", "text", "p"),
  elementDef("Badge", "content", "label", "span"),
  // Wordmark — the brand lockup: an optional MARK (logo image or a slotted
  // svg/Icon child) beside the brand name. It was `elementDef(…, "span")` —
  // text-only, container:false — while its CSS (`& :is(svg,img)` sizing) and its
  // React wrapper (`<Wordmark as="a"><LogoMark/>Acme</Wordmark>`) both already
  // assumed a mark. The schema is the layer the builder reads, so the builder
  // won and "put the logo in the wordmark" was impossible by construction. Two
  // paths, one DOM: nest a child (the power path), or set `src` (the one-control
  // Inspector path). `primary: "text"` keeps a bare bind on the NAME — without
  // it, adding `src` would make a bound site name fill the image URL instead.
  {
    name: "Wordmark",
    category: "content",
    label: "Wordmark",
    icon: "wordmark",
    container: true,
    primary: "text",
    expand: (n) => {
      const href = n.props?.href;
      const tag = href != null ? "a" : "span";
      const attrs = href != null ? { href: href as string } : undefined;
      // Authored children win outright — the documented composition.
      if (n.children && n.children.length) return lower(n, tag, { attrs, children: n.children });
      const src = n.props?.src;
      const children: Child[] = [];
      if (typeof src === "string" && src) {
        children.push(
          elc("img", "wordmark-mark", undefined, {
            src,
            // Decorative by default: the name renders beside it, so announcing
            // the logo too would just repeat it. An author shipping mark-only
            // sets `alt` explicitly. Matches Image's `alt: (props.alt ?? "")`.
            alt: (n.props?.alt ?? "") as string,
            loading: "lazy",
          }),
        );
      }
      if (n.props?.text != null) children.push(String(n.props.text));
      return lower(n, tag, { attrs, children });
    },
  },
  elementDef("Card", "layout", "box", "div", true),
  // SelectableCard — a card that IS an option tile: a real (visually hidden)
  // radio/checkbox inside a <label>, so the whole card is the click target and
  // the selection posts with the form. Matches the React component's DOM.
  {
    name: "SelectableCard",
    category: "form",
    label: "Selectable card",
    icon: "box",
    container: true,
    expand: (n) => {
      const type = n.props?.type === "checkbox" ? "checkbox" : "radio";
      const input = elc(
        "input",
        "card-selectable-indicator",
        undefined,
        formAttrs(n, { type }, CHECK_KEYS),
      );
      return lower(n, "label", {
        class: n.class ?? "card card-selectable",
        children: [input, ...(n.children ?? [])],
      });
    },
  },
  elementDef("Section", "layout", "section", "section", true),
  elementDef("Container", "layout", "box", "div", true),
  elementDef("Grid", "layout", "grid", "div", true),
  elementDef("Stack", "layout", "stack", "div", true),
  // Feedback leaves — colorless status surfaces (class carries size/variant).
  elementDef("Loading", "feedback", "loading", "span"),
  elementDef("Skeleton", "feedback", "box", "div"),
  elementDef("Status", "feedback", "dot", "span"),
  elementDef("Kbd", "feedback", "kbd", "kbd"),
  // Navbar / Table — structural containers (children authored in the tree).
  elementDef("Navbar", "nav", "header", "div", true),
  elementDef("Table", "data", "table", "table", true),
  // Field — a form-row container (label + control as children).
  elementDef("Field", "form", "label", "div", true),
  // Form — a <form> that ALWAYS lowers with the `form` behavior marker so a
  // published form is functional (validate + submit) with zero author wiring.
  // `props.action` names the host action a valid submit dispatches to; an
  // explicitly-set behavior/data on the node is respected and never overwritten.
  {
    name: "Form",
    category: "form",
    label: "Form",
    icon: "form",
    container: true,
    expand: (n) => {
      const out = lower(n, "form", { children: n.children });
      if (!out.behavior) out.behavior = { type: "form" };
      const action = n.props?.action;
      if (action != null && !out.data) out.data = { kind: "action", ref: String(action) };
      return out;
    },
  },

  // Sidebar — a persistent nav panel (`<aside>`) that collapses in place to an
  // icon rail, unlike Drawer (which overlays and dismisses). Always carries the
  // `sidebar` behavior so a `SidebarTrigger` nested anywhere inside it works
  // with zero authored wiring; `props.defaultCollapsed` seeds the initial state.
  {
    name: "Sidebar",
    category: "nav",
    label: "Sidebar",
    icon: "sidebar",
    container: true,
    expand: (n) => {
      const out = lower(n, "aside", { children: n.children });
      if (!out.behavior) {
        const defaultCollapsed = n.props?.defaultCollapsed;
        out.behavior = {
          type: "sidebar",
          ...(defaultCollapsed ? { params: { defaultCollapsed: true } } : {}),
        };
      }
      return out;
    },
  },
  // SidebarTrigger — the sidebar's collapse/expand button. A structural PART
  // (`trigger`), not a behavior root itself — it must be authored somewhere
  // inside the `Sidebar` it controls (e.g. its header).
  {
    name: "SidebarTrigger",
    category: "nav",
    label: "Sidebar toggle",
    icon: "sidebarTrigger",
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button", "aria-label": "Toggle sidebar" } });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },

  // SelectionList — a selectable listbox (single- or multi-select), items driven
  // by props (not authored children, like Breadcrumb/Steps). Always carries the
  // `selection-list` behavior so it's clickable/keyboard-navigable once published,
  // with zero authored wiring. `props.items`: `{id, label, description?}[]` (or
  // plain strings); `props.multiple`; `props.selected`: array of selected ids.
  {
    name: "SelectionList",
    category: "form",
    label: "Selection List",
    icon: "selectionList",
    expand: (n) => {
      const p = n.props ?? {};
      const multiple = p.multiple === true;
      const selected = new Set(
        (Array.isArray(p.selected) ? p.selected : []).map((v) => String(v)),
      );
      const raw = Array.isArray(p.items) ? p.items : [];
      const items = raw.map((entry, i) => {
        const o =
          entry != null && typeof entry === "object"
            ? (entry as { id?: unknown; label?: unknown; description?: unknown })
            : { id: String(entry), label: String(entry) };
        const id = o.id != null ? String(o.id) : `item-${i}`;
        const label = o.label != null ? String(o.label) : id;
        const description = o.description != null ? String(o.description) : undefined;
        return { id, label, description };
      });

      const lis = items.map((item): ElementNode => {
        const isSelected = selected.has(item.id);
        const body: Child[] = [elc("span", "selection-list-item-label", [item.label])];
        if (item.description != null) {
          body.push(elc("span", "selection-list-item-description", [item.description]));
        }
        const indicator = elc("input", multiple ? "checkbox" : "radio", undefined, {
          type: multiple ? "checkbox" : "radio",
          tabindex: -1,
          "aria-hidden": "true",
          ...(isSelected ? { checked: true } : {}),
        });
        const li = elc(
          "li",
          "selection-list-item",
          [indicator, elc("span", "selection-list-item-body", body)],
          { role: "option", "aria-selected": String(isSelected), "data-id": item.id },
        );
        li.part = "item";
        return li;
      });

      const out = lower(n, "ul", {
        attrs: { role: "listbox", ...(multiple ? { "aria-multiselectable": "true" } : {}) },
        children: lis,
      });
      if (!out.behavior) {
        out.behavior = { type: "selection-list", params: { multiple } };
      }
      return out;
    },
  },

  // ── navigation ─────────────────────────────────────────────────────────────
  // Breadcrumb — a <nav class="breadcrumb"> wrapping an <ol>; each item is a link,
  // the last marked aria-current="page". Items come from props.items (strings).
  {
    name: "Breadcrumb",
    category: "nav",
    label: "Breadcrumb",
    icon: "breadcrumb",
    expand: (n) => {
      const items = itemsOf(n);
      const last = items.length - 1;
      const lis = items.map((label, i) =>
        elc("li", undefined, [
          elc("a", undefined, [label], i === last ? { href: "#", "aria-current": "page" } : { href: "#" }),
        ]),
      );
      return lower(n, "nav", { children: [elc("ol", undefined, lis)] });
    },
  },
  // Menu — a vertical <ul class="menu"> of link items (sidebars / popover bodies).
  {
    name: "Menu",
    category: "nav",
    label: "Menu",
    icon: "nav",
    expand: (n) =>
      lower(n, "ul", {
        children: itemsOf(n).map((label) =>
          elc("li", undefined, [elc("a", undefined, [label], { href: "#" })]),
        ),
      }),
  },
  // Steps — a <ul class="steps"> tracker; items up to props.current are `-primary`
  // (read as completed). Both from props.
  {
    name: "Steps",
    category: "nav",
    label: "Steps",
    icon: "steps",
    expand: (n) => {
      const current = Number(n.props?.current ?? -1);
      return lower(n, "ul", {
        children: itemsOf(n).map((label, i) =>
          elc("li", i <= current ? "step step-primary" : "step", [label]),
        ),
      });
    },
  },
  // Pagination — a joined button row (1…props.pages), the first marked active.
  {
    name: "Pagination",
    category: "nav",
    label: "Pagination",
    icon: "pagination",
    expand: (n) => {
      const pages = Math.max(1, Math.min(20, Math.floor(Number(n.props?.pages ?? 3))));
      const btns: Child[] = [];
      for (let p = 1; p <= pages; p++) {
        btns.push(
          elc("button", p === 1 ? "join-item btn btn-active" : "join-item btn", [String(p)], {
            type: "button",
          }),
        );
      }
      return lower(n, "div", { children: btns });
    },
  },

  // ── feedback ───────────────────────────────────────────────────────────────
  // Alert — a role="alert" surface; its children (or text prop) sit in the flex row.
  {
    name: "Alert",
    category: "feedback",
    label: "Alert",
    icon: "warning",
    // `dismissible` is a real feature in the React layer AND has a working
    // `dismiss` handler in silicaui-behaviors — but this macro used to emit a
    // bare <div role="alert">, so a static/Sparx page rendered no close button
    // at all. Emitting the button + the behavior marker is what makes the
    // feature exist outside React.
    expand: (n) => {
      const children: Child[] = textChildren(n, "text") ?? ["Alert message"];
      if (!n.props?.dismissible) {
        return lower(n, "div", { attrs: { role: "alert" }, children });
      }
      const close = elc(
        "button",
        "alert-close",
        [{ kind: "component", component: "Icon", props: { name: "close" } }],
        { type: "button", "aria-label": "Dismiss" },
      );
      close.part = "trigger";
      const out = lower(n, "div", {
        attrs: { role: "alert" },
        children: [...children, close],
      });
      if (!out.behavior) out.behavior = { type: "dismiss" };
      return out;
    },
  },
  // Progress — a track div + a fill div whose LITERAL width utility encodes value.
  {
    name: "Progress",
    category: "feedback",
    label: "Progress",
    icon: "progress",
    expand: (n) => {
      const value = Number(n.props?.value ?? 50);
      return lower(n, "div", { children: [elc("div", `progress-bar ${progressWidth(value)}`)] });
    },
  },

  // ── data display ───────────────────────────────────────────────────────────
  // Stat — a .stats container holding one .stat (title / value / desc from props).
  {
    name: "Stat",
    category: "data",
    label: "Stat",
    icon: "stat",
    expand: (n) => {
      const p = n.props ?? {};
      const rows: Child[] = [];
      if (p.title != null) rows.push(elc("div", "stat-title", [String(p.title)]));
      rows.push(elc("div", "stat-value", [String(p.value ?? "0")]));
      if (p.desc != null) rows.push(elc("div", "stat-desc", [String(p.desc)]));
      return lower(n, "div", { children: [elc("div", "stat", rows)] });
    },
  },
  // Avatar — a single .avatar div whose inner <img> rounds via inherited radius.
  {
    name: "Avatar",
    category: "data",
    label: "Avatar",
    icon: "avatar",
    primary: "src",
    expand: (n) => {
      const attrs: NonNullable<ElementNode["attrs"]> = {
        alt: (n.props?.alt ?? "") as string,
        loading: "lazy",
      };
      if (n.props?.src != null) attrs.src = n.props.src as string;
      return lower(n, "div", { children: [elc("img", undefined, undefined, attrs)] });
    },
  },
  // Collapse — a native <details> disclosure (works with zero JS on publish). Not
  // a container: its body is `props.content` (text). `expand` still honors authored
  // children as the body for direct toHtml use, but the builder edits it as a prop.
  // Root class is author-supplied (see palette.ts) and should be `details`, NOT
  // `collapse` — Tailwind v4's built-in `.collapse` utility (`visibility: collapse`)
  // wins over any component rule of that name and silently hides the whole thing;
  // see the doc comment in silicaui/src/components/collapse.js for the full story.
  {
    name: "Collapse",
    category: "data",
    label: "Collapse",
    icon: "collapse",
    expand: (n) => {
      const p = n.props ?? {};
      return lower(n, "details", {
        children: [
          elc("summary", "details-title", [String(p.title ?? "Details")]),
          elc("div", "details-content", n.children?.length ? n.children : [String(p.content ?? "")]),
        ],
      });
    },
  },
  // Timeline — a <ul class="timeline"> of events (marker + content per item).
  {
    name: "Timeline",
    category: "data",
    label: "Timeline",
    icon: "timeline",
    expand: (n) =>
      lower(n, "ul", {
        children: itemsOf(n).map((label) =>
          elc("li", undefined, [
            elc("div", "timeline-middle", ["●"]),
            elc("div", "timeline-end", [label]),
          ]),
        ),
      }),
  },

  // ── structural/presentational catch-up (2026-07-08 sync pass) ──────────────
  // Plain element atoms — same shape as `elementDef`, one tag each, no behavior.
  // Sub-parts that carry no semantic tag of their own (a styled <div>/<span> —
  // Card's CardBody/CardTitle, Hero's HeroContent, etc.) are deliberately NOT
  // registered here: a host authors them as plain class-carrying children, per
  // the confirmed Card precedent. Only parts with real semantic value (a
  // distinct tag, or "part" behavior metadata) get their own atom.
  elementDef("Label", "form", "label", "label"),
  elementDef("AvatarGroup", "data", "avatar", "span", true),
  elementDef("Prose", "content", "text", "div", true),
  // RichText — a `.prose` container for TRUSTED rich-text / CMS long-form HTML.
  // Authored children render as-is; pair it with an `html` data binding and
  // `resolveTree` fills its inner HTML from the host-sanitized resolved value
  // (see NodeBase.rawHtml). This is the data-bound content-page primitive.
  {
    name: "RichText",
    category: "content",
    label: "Rich text",
    icon: "text",
    container: true,
    expand: (n) => lower(n, "div", { children: n.children }),
  },
  elementDef("Hero", "layout", "box", "div", true),
  elementDef("Footer", "layout", "box", "footer", true),
  elementDef("FooterTitle", "layout", "heading", "h6"),
  elementDef("MockupWindow", "media", "box", "div", true),
  elementDef("MockupBrowser", "media", "box", "div", true),
  elementDef("MockupCode", "media", "box", "div", true),
  // MockupCodeLine — a <pre> row inside MockupCode. The gutter marker is a real
  // `data-prefix` attribute the CSS reads, not text content.
  {
    name: "MockupCodeLine",
    category: "media",
    label: "Code line",
    icon: "box",
    container: true,
    expand: (n) => {
      const attrs: NonNullable<ElementNode["attrs"]> = {};
      if (n.props?.prefix != null) attrs["data-prefix"] = String(n.props.prefix);
      return lower(n, "pre", { attrs, children: textChildren(n, "text") });
    },
  },
  elementDef("MockupPhone", "media", "box", "div", true),
  elementDef("List", "data", "box", "div", true),
  elementDef("Dock", "nav", "sidebar", "div", true),
  elementDef("Join", "layout", "box", "div", true),
  elementDef("Indicator", "feedback", "dot", "span", true),
  elementDef("Mask", "media", "box", "div", true),
  elementDef("Fieldset", "form", "box", "fieldset", true),
  elementDef("FieldsetLegend", "form", "label", "legend"),
  elementDef("Blockquote", "content", "text", "blockquote", true),
  elementDef("BlockquoteCite", "content", "text", "footer"),
  elementDef("MetadataList", "data", "box", "dl", true),
  elementDef("AppShell", "layout", "box", "div", true),
  elementDef("AppShellSidebar", "layout", "sidebar", "aside", true),
  elementDef("AppShellHeader", "layout", "header", "header", true),
  elementDef("AppShellMain", "layout", "box", "main", true),
  elementDef("AppShellFooter", "layout", "box", "footer", true),
  elementDef("InputGroup", "form", "input", "div", true),
  elementDef("Diff", "media", "box", "div", true),
  // Toolbar — size/variant/dividers are props on the source node, forwarded
  // as data-attrs the CSS reads (mirrors DrawerContent's `data-side` below).
  {
    name: "Toolbar",
    category: "nav",
    label: "Toolbar",
    icon: "box",
    container: true,
    expand: (n) => {
      const attrs: NonNullable<ElementNode["attrs"]> = {};
      if (n.props?.size != null) attrs["data-size"] = String(n.props.size);
      if (n.props?.variant != null) attrs["data-variant"] = String(n.props.variant);
      if (n.props?.dividers != null) attrs["data-dividers"] = String(n.props.dividers);
      return lower(n, "div", {
        attrs: Object.keys(attrs).length ? attrs : undefined,
        children: n.children,
      });
    },
  },
  elementDef("ToolbarCenter", "nav", "box", "div", true),

  // Button-shaped structural atoms — a real <button>/<a>, so registering them
  // (vs. plain divs) buys the host correct semantics + tab order for free.
  {
    name: "DockItem",
    category: "nav",
    label: "Dock item",
    icon: "sidebarTrigger",
    container: true,
    expand: (n) => lower(n, "button", { attrs: { type: "button" }, children: n.children }),
  },
  {
    name: "InputGroupButton",
    category: "form",
    label: "Input group button",
    icon: "button",
    container: true,
    expand: (n) => lower(n, "button", { attrs: { type: "button" }, children: n.children }),
  },
  {
    name: "ToolbarButton",
    category: "nav",
    label: "Toolbar button",
    icon: "button",
    container: true,
    expand: (n) => lower(n, "button", { attrs: { type: "button" }, children: n.children }),
  },
  {
    name: "ToolbarLink",
    category: "nav",
    label: "Toolbar link",
    icon: "nav",
    container: true,
    expand: (n) => lower(n, "a", { attrs: { href: (n.props?.href ?? "#") as string }, children: n.children }),
  },
  {
    name: "ToolbarSeparator",
    category: "nav",
    label: "Toolbar separator",
    icon: "box",
    expand: (n) => lower(n, "div", { attrs: { role: "separator", "aria-orientation": "vertical" } }),
  },
  // ClickableCard — a Card that's a whole clickable surface; a <button>, or an
  // <a> when it carries an href (mirrors Button's own href-swap rule).
  {
    name: "ClickableCard",
    category: "layout",
    label: "Clickable card",
    icon: "box",
    container: true,
    expand: (n) => {
      const href = n.props?.href;
      if (href != null) return lower(n, "a", { attrs: { href: href as string }, children: n.children });
      return lower(n, "button", { attrs: { type: "button" }, children: n.children });
    },
  },

  // Leaf form inputs — native controls only; the show/hide + clear-button
  // chrome the React versions add needs real JS, so those are dropped here
  // rather than shipping a dead button (see the sync-gap memory).
  {
    name: "SearchInput",
    category: "form",
    label: "Search input",
    icon: "input",
    expand: (n) => lower(n, "input", { attrs: formAttrs(n, { type: "search" }, FIELD_KEYS) }),
  },
  {
    name: "PasswordInput",
    category: "form",
    label: "Password input",
    icon: "input",
    expand: (n) => lower(n, "input", { attrs: formAttrs(n, { type: "password" }, FIELD_KEYS) }),
  },

  // CheckboxGroup / CheckboxOption — a native fieldset-free group of checkboxes;
  // CheckboxOption's label text is its children, matching the React shape.
  {
    name: "CheckboxGroup",
    category: "form",
    label: "Checkbox group",
    icon: "checkbox",
    container: true,
    expand: (n) => lower(n, "div", { attrs: { role: "group" }, children: n.children }),
  },
  {
    name: "CheckboxOption",
    category: "form",
    label: "Checkbox option",
    icon: "checkbox",
    container: true,
    // Always the captioned form — `checkControl` keeps the control class on the
    // <input> where it belongs (see its doc comment).
    expand: (n) => checkControl(n, "checkbox"),
  },
  // Swap — a hidden checkbox driving a pure-CSS cross-fade between two children
  // (`.swap-on` / `.swap-off`, authored by the host as the node's children).
  {
    name: "Swap",
    category: "feedback",
    label: "Swap",
    icon: "box",
    container: true,
    expand: (n) => {
      const input = elc("input", undefined, undefined, formAttrs(n, { type: "checkbox" }, CHECK_KEYS));
      return lower(n, "label", { children: [input, ...(n.children ?? [])] });
    },
  },

  // Display — an oversized hero heading; always `.display`-styled, semantic
  // level from props (mirrors Heading's own level handling).
  {
    name: "Display",
    category: "content",
    label: "Display",
    icon: "heading",
    expand: (n) => {
      const raw = Number(n.props?.level ?? 1);
      const level = Number.isInteger(raw) && raw >= 1 && raw <= 6 ? raw : 1;
      return lower(n, `h${level}`, { children: textChildren(n, "text") });
    },
  },

  // Timestamp — dependency-free `Intl`-formatted date text. Computed once at
  // render time (no live "3m ago" ticking without a JS runtime); `props.value`
  // is an ISO date string, `props.format` picks relative vs. absolute.
  {
    name: "Timestamp",
    category: "data",
    label: "Timestamp",
    icon: "box",
    expand: (n) => {
      const iso = String(n.props?.value ?? "");
      const date = iso ? parseDateLike(iso) : null;
      const valid = date && !Number.isNaN(date.getTime());
      let text = iso;
      if (valid) {
        if (n.props?.format === "relative") {
          const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
          const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
          const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
            ["year", 31536000],
            ["month", 2592000],
            ["day", 86400],
            ["hour", 3600],
            ["minute", 60],
            ["second", 1],
          ];
          const [unit, secs] = units.find(([, s]) => Math.abs(diffSec) >= s) ?? units[units.length - 1]!;
          text = rtf.format(Math.round(diffSec / secs), unit);
        } else {
          text = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
        }
      }
      return lower(n, "time", { attrs: valid ? { dateTime: iso } : {}, children: [text] });
    },
  },

  // EmptyState — the centered "nothing here yet" placeholder; icon/title/
  // description/actions are DATA slots (mirrors Stat's prop-driven rows).
  {
    name: "EmptyState",
    category: "feedback",
    label: "Empty state",
    icon: "box",
    expand: (n) => {
      const p = n.props ?? {};
      const rows: Child[] = [];
      if (p.icon != null) rows.push(elc("div", "empty-state-icon", [String(p.icon)]));
      if (p.title != null) rows.push(elc("div", "empty-state-title", [String(p.title)]));
      if (p.description != null) rows.push(elc("div", "empty-state-description", [String(p.description)]));
      if (n.children && n.children.length) rows.push(...n.children);
      if (p.actions != null) rows.push(elc("div", "empty-state-actions", [String(p.actions)]));
      return lower(n, "div", { children: rows });
    },
  },

  // RadioGroup / RadioOption — same shape as CheckboxGroup/CheckboxOption, one
  // native radio per option (shared `name` gives arrow-key nav for free).
  {
    name: "RadioGroup",
    category: "form",
    label: "Radio group",
    icon: "radio",
    container: true,
    expand: (n) => lower(n, "div", { attrs: { role: "radiogroup" }, children: n.children }),
  },
  {
    name: "RadioOption",
    category: "form",
    label: "Radio option",
    icon: "radio",
    container: true,
    expand: (n) => checkControl(n, "radio"),
  },
  // Stats — a flex row grouping multiple Stat blocks (mirrors AvatarGroup).
  elementDef("Stats", "data", "stat", "div", true),

  // Meter — a static measurement (not task advancement, unlike Progress); same
  // bucketed-literal-width technique so the fill needs no inline style.
  {
    name: "Meter",
    category: "feedback",
    label: "Meter",
    icon: "progress",
    expand: (n) => {
      const value = Number(n.props?.value ?? 50);
      return lower(n, "div", { children: [elc("div", `meter-indicator ${progressWidth(value)}`)] });
    },
  },

  // RadialProgress — a circular ring; `--value` can't be an inline style (no
  // inline style, ever), so the value snaps to the nearest of 21 literal
  // `[--value:N]` utility buckets, same principle as Progress's width buckets.
  {
    name: "RadialProgress",
    category: "feedback",
    label: "Radial progress",
    icon: "progress",
    expand: (n) => {
      const value = Number(n.props?.value ?? 0);
      const pct = Math.max(0, Math.min(100, value));
      const bucket = Math.round(pct / 5) * 5;
      const cls = RADIAL_VALUE_CLASSES[bucket] ?? RADIAL_VALUE_CLASSES[0]!;
      return lower(n, "div", {
        class: [n.class, cls].filter(Boolean).join(" "),
        attrs: {
          role: "progressbar",
          "aria-valuenow": Math.round(pct),
          "aria-valuemin": 0,
          "aria-valuemax": 100,
        },
        children: [elc("span", undefined, textChildren(n, "text") ?? [`${Math.round(pct)}%`])],
      });
    },
  },

  // ── interactive: existing BehaviorTypes (2026-07-08 sync pass) ─────────────
  // These reuse one of the 12 closed `@wizeworks/silicaui-behaviors` marker types — the
  // root auto-carries `behavior`, and each authored sub-part carries a `part`
  // role the handler looks up via `ownParts()` (nesting-scoped, not by id).
  // A part with no distinct tag of its own (Accordion's item wrapper, a menu's
  // Group/Label/Separator) is NOT registered — author it as a plain element,
  // same rule as the structural sub-parts above.

  // Accordion — `disclosure` with `params.single`; AccordionItem is a plain
  // wrapper div (no part), Trigger/Panel carry the trigger/panel roles.
  {
    name: "Accordion",
    category: "data",
    label: "Accordion",
    icon: "collapse",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) {
        const single = n.props?.single !== false;
        out.behavior = { type: "disclosure", params: { single } };
      }
      return out;
    },
  },
  elementDef("AccordionItem", "data", "collapse", "div", true),
  {
    name: "AccordionTrigger",
    category: "data",
    label: "Accordion trigger",
    icon: "collapse",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "AccordionPanel",
    category: "data",
    label: "Accordion panel",
    icon: "collapse",
    container: true,
    expand: (n) => {
      const attrs = n.props?.defaultOpen === true ? undefined : { hidden: true };
      const out = lower(n, "div", { attrs, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },

  // Collapsible — a single `disclosure` trigger/panel pair (not single-open —
  // there's only one pair under this root).
  {
    name: "Collapsible",
    category: "data",
    label: "Collapsible",
    icon: "collapse",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "disclosure" };
      return out;
    },
  },
  {
    name: "CollapsibleTrigger",
    category: "data",
    label: "Collapsible trigger",
    icon: "collapse",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "CollapsiblePanel",
    category: "data",
    label: "Collapsible panel",
    icon: "collapse",
    container: true,
    expand: (n) => {
      const attrs = n.props?.defaultOpen === true ? undefined : { hidden: true };
      const out = lower(n, "div", { attrs, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },

  // Filter — a single-select chip row with a reset. This is the EXISTING
  // `toggle-group` behavior, not a new one: same single-select press semantics,
  // same roving focus, same aria-pressed buttons. The only delta was the reset,
  // which is now an optional `reset` part on that handler. Reusing kept the
  // BehaviorType vocabulary closed, which is deliberate.
  {
    name: "Filter",
    category: "form",
    label: "Filter chips",
    icon: "box",
    container: true,
    expand: (n) => {
      const children: Child[] = [...(n.children ?? [])];
      if (n.props?.showReset !== false) {
        const reset = elc("button", "filter-reset", [String(n.props?.resetLabel ?? "×")], {
          type: "button",
          "aria-label": String(n.props?.resetLabel ?? "Reset filter"),
          hidden: true, // nothing selected at rest; the handler reveals it
        });
        reset.part = "close";
        children.push(reset);
      }
      const out = lower(n, "div", { class: n.class ?? "filter", children });
      if (!out.behavior) out.behavior = { type: "toggle-group" };
      return out;
    },
  },
  {
    name: "FilterItem",
    category: "form",
    label: "Filter chip",
    icon: "box",
    container: true,
    expand: (n) => {
      const pressed = n.props?.selected === true;
      const attrs: NonNullable<ElementNode["attrs"]> = {
        type: "button",
        "aria-pressed": String(pressed),
      };
      if (n.props?.value != null) attrs["data-value"] = String(n.props.value);
      if (pressed) attrs["data-pressed"] = true;
      const out = lower(n, "button", {
        class: n.class ?? "filter-item",
        attrs,
        children: textChildren(n, "text"),
      });
      if (!out.part) out.part = "item";
      return out;
    },
  },

  // ── chat ──────────────────────────────────────────────────────────────────
  // The whole family lands together on purpose. Half a family is worse than
  // none: a consumer who finds `Chat` but no `ChatComposer` hand-rolls the
  // missing half in markup that then drifts from the React layer, which is the
  // exact failure this registry exists to prevent.
  //
  // The primitives (image/header/footer/bubble/layout) take their class from
  // the authored node like `Card` does; the composites below build inner
  // structure the author never writes, so those classes ARE emitted here.
  elementDef("ChatImage", "data", "box", "div", true),
  elementDef("ChatHeader", "data", "box", "div", true),
  elementDef("ChatFooter", "data", "box", "div", true),
  elementDef("ChatBubble", "data", "box", "div", true),
  elementDef("ChatLayout", "data", "box", "div", true),
  elementDef("ChatLayoutMessages", "data", "box", "div", true),
  elementDef("ChatMessageMetadata", "data", "box", "div", true),
  // Chat — one message row. `side: "end"` flips it to the outgoing side.
  {
    name: "Chat",
    category: "data",
    label: "Chat row",
    icon: "box",
    container: true,
    expand: (n) => {
      const end = n.props?.side === "end";
      return lower(n, "div", {
        class: n.class ?? (end ? "chat chat-end" : "chat"),
        children: n.children,
      });
    },
  },
  // A centered notice ("Today", "Ada joined") — attributed to neither side.
  {
    name: "ChatSystemMessage",
    category: "data",
    label: "Chat system message",
    icon: "box",
    container: true,
    expand: (n) =>
      lower(n, "div", {
        class: n.class ?? "chat-system-message",
        attrs: { role: "status" },
        children: textChildren(n, "text"),
      }),
  },
  // ChatMessage — the convenience composite the React layer also exposes,
  // lowering to the same primitives. `avatar` is a STRING here (initials); a
  // rich avatar node is authored by composing Chat/ChatImage/ChatBubble
  // directly, exactly as in React.
  {
    name: "ChatMessage",
    category: "data",
    label: "Chat message",
    icon: "box",
    container: true,
    expand: (n) => {
      const p = n.props ?? {};
      const end = p.side === "end";
      const compact = p.compact === true;
      const kids: Child[] = [];
      if (p.avatar != null && !compact) {
        kids.push(elc("div", "chat-image", [String(p.avatar)]));
      }
      const bubbleClass = p.color ? `chat-bubble chat-bubble-${String(p.color)}` : "chat-bubble";
      kids.push(elc("div", bubbleClass, n.children ?? []));
      if (!compact && (p.name != null || p.time != null)) {
        const footer: Child[] = [];
        if (p.name != null) footer.push(String(p.name));
        if (p.time != null) footer.push(elc("time", undefined, [` ${String(p.time)}`]));
        kids.push(elc("div", "chat-footer", footer));
      }
      if (p.metadata != null) {
        kids.push(elc("div", "chat-footer", [String(p.metadata)]));
      }
      return lower(n, "div", {
        class: n.class ?? (end ? "chat chat-end" : "chat"),
        children: kids,
      });
    },
  },
  // Three animated dots inside a real bubble, so it occupies the slot the next
  // message will land in rather than reading as a stray line of muted text.
  {
    name: "ChatTypingIndicator",
    category: "data",
    label: "Chat typing indicator",
    icon: "box",
    container: true,
    expand: (n) => {
      const p = n.props ?? {};
      const end = p.side === "end";
      const dots = [0, 1, 2].map(() => elc("span", "chat-typing-dot"));
      const typing = elc("span", "chat-typing", dots, {
        role: "status",
        "aria-label": p.name != null ? `${String(p.name)} is typing` : "Typing",
      });
      const kids: Child[] = [];
      if (p.avatar != null) kids.push(elc("div", "chat-image", [String(p.avatar)]));
      kids.push(elc("div", "chat-bubble", [typing]));
      return lower(n, "div", {
        class: n.class ?? (end ? "chat chat-end" : "chat"),
        children: kids,
      });
    },
  },
  // ChatToolCalls — reuses the existing `disclosure` behavior and the
  // Collapsible part classes the CSS already targets, rather than inventing a
  // new BehaviorType for what is structurally a collapsible.
  {
    name: "ChatToolCalls",
    category: "data",
    label: "Chat tool calls",
    icon: "collapse",
    container: true,
    expand: (n) => {
      const p = n.props ?? {};
      const open = p.defaultOpen === true;
      const trigger = elc("button", "collapsible-trigger", [String(p.label ?? "Tool call")], {
        type: "button",
      });
      trigger.part = "trigger";
      const panel = elc("div", "collapsible-content", n.children ?? [], open ? undefined : { hidden: true });
      panel.part = "panel";
      const out = lower(n, "div", {
        class: n.class ?? "chat-tool-calls",
        children: [trigger, panel],
      });
      if (!out.behavior) out.behavior = { type: "disclosure" };
      return out;
    },
  },
  // ChatComposer — a real <form> so a static page can actually send. React
  // adds autoresize and Enter-to-send on top; those are progressive
  // enhancements, and their absence degrades to a normal textarea + submit
  // rather than to something broken.
  {
    name: "ChatComposer",
    category: "form",
    label: "Chat composer",
    icon: "textarea",
    container: true,
    expand: (n) => {
      const p = n.props ?? {};
      const kids: Child[] = [];
      if (n.children?.length) kids.push(elc("div", "chat-composer-actions", n.children));
      kids.push(
        elc("textarea", "textarea chat-composer-field", undefined, {
          rows: 1,
          name: (p.name as string) ?? "message",
          placeholder: (p.placeholder as string) ?? "Message…",
          "aria-label": (p.ariaLabel as string) ?? "Message",
          ...(p.disabled === true ? { disabled: true } : {}),
        }),
      );
      kids.push(
        elc("button", "btn btn-primary btn-sm btn-circle", [String(p.sendLabel ?? "Send")], {
          type: "submit",
          "aria-label": "Send message",
        }),
      );
      const out = lower(n, "form", { class: n.class ?? "chat-composer", children: kids });
      if (!out.behavior) out.behavior = { type: "form" };
      return out;
    },
  },

  // Carousel — `carousel`; unlike Accordion/Tabs/Menu, Track/Prev/Next/Dot
  // aren't part of the public React API (Carousel/CarouselItem only), so the
  // macro builds that inner structure itself from `node.children`, matching
  // what the React component does internally.
  {
    name: "Carousel",
    category: "media",
    label: "Carousel",
    icon: "box",
    container: true,
    expand: (n) => {
      const slides = n.children ?? [];
      const track = elc("div", "carousel-track", slides);
      track.part = "track";
      const prev = elc("button", "carousel-prev", ["‹"], { type: "button", "aria-label": "Previous slide" });
      prev.part = "prev";
      const next = elc("button", "carousel-next", ["›"], { type: "button", "aria-label": "Next slide" });
      next.part = "next";
      const dots = elc(
        "div",
        "carousel-dots",
        slides.map((_, i) => {
          const dot = elc("button", "carousel-dot", undefined, { type: "button", "aria-label": `Slide ${i + 1}` });
          dot.part = "dot";
          return dot;
        }),
      );
      const out = lower(n, "div", { children: [track, prev, next, dots] });
      if (!out.behavior) {
        const p = n.props ?? {};
        const params: Record<string, unknown> = {};
        if (p.autoplay === true) params.autoplay = true;
        if (typeof p.interval === "number") params.interval = p.interval;
        out.behavior = { type: "carousel", ...(Object.keys(params).length ? { params } : {}) };
      }
      return out;
    },
  },
  {
    name: "CarouselItem",
    category: "media",
    label: "Carousel item",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.part) out.part = "slide";
      return out;
    },
  },

  // DropdownMenu — `menu`; Trigger/Content/Item carry the trigger/panel/item
  // roles. Content starts hidden (menu.ts reads its own `hidden` attribute to
  // determine open state). Group/Label/Separator are plain elements — author
  // them directly inside Content, same rule as every other sub-part above.
  {
    name: "DropdownMenu",
    category: "nav",
    label: "Dropdown menu",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "menu" };
      return out;
    },
  },
  {
    name: "DropdownMenuTrigger",
    category: "nav",
    label: "Dropdown trigger",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "DropdownMenuContent",
    category: "nav",
    label: "Dropdown content",
    icon: "nav",
    container: true,
    expand: (n) => {
      // role=menu: its items are role=menuitem, which REQUIRE a menu ancestor
      // (ContextMenuContent/MenubarContent already do this).
      const out = lower(n, "div", { attrs: { hidden: true, role: "menu" }, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "DropdownMenuItem",
    category: "nav",
    label: "Dropdown item",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button", role: "menuitem" }, children: n.children });
      if (!out.part) out.part = "item";
      return out;
    },
  },

  // Tabs — `tabs`; Tab/Panel pair by position. TabsList is a plain wrapper
  // (tabs.ts scopes `ownParts` to the whole root, not a specific list part).
  {
    name: "Tabs",
    category: "data",
    label: "Tabs",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "tabs" };
      return out;
    },
  },
  // TabsList carries the tablist role its role=tab children require; the tabs
  // behavior fills in aria-selected/tabindex at hydrate. Panels stay visible
  // pre-hydration on purpose (progressive enhancement — no-JS readers get all
  // content), the runtime hides the inactive ones.
  {
    name: "TabsList",
    category: "data",
    label: "Tabs list",
    icon: "box",
    container: true,
    expand: (n) => lower(n, "div", { attrs: { role: "tablist" }, children: n.children }),
  },
  {
    name: "TabsTab",
    category: "data",
    label: "Tab",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button", role: "tab" }, children: n.children });
      if (!out.part) out.part = "tab";
      return out;
    },
  },
  {
    name: "TabsPanel",
    category: "data",
    label: "Tab panel",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { attrs: { role: "tabpanel" }, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },

  // Outline — `toc`; unlike the React version (which derives its list from
  // scanning heading elements at runtime), the vanilla macro is prop-driven
  // like Breadcrumb/Steps/Timeline: `props.items`: `{id, label}[]` becomes
  // the anchor links the `toc` behavior tracks via IntersectionObserver.
  {
    name: "Outline",
    category: "nav",
    label: "Outline",
    icon: "nav",
    expand: (n) => {
      const raw = n.props?.items;
      const items = Array.isArray(raw) ? raw : [];
      const links = items.map((entry): ElementNode => {
        const o =
          entry != null && typeof entry === "object"
            ? (entry as { id?: unknown; label?: unknown })
            : { id: String(entry), label: String(entry) };
        const id = o.id != null ? String(o.id) : "";
        const label = o.label != null ? String(o.label) : id;
        const link = elc("a", "outline-link", [label], { href: `#${id}` });
        link.part = "spy";
        return link;
      });
      const out = lower(n, "nav", { children: links });
      if (!out.behavior) out.behavior = { type: "toc" };
      return out;
    },
  },

  // ── interactive: new primitives (2026-07-08 bucket-2b sync pass) ──────────
  // `modal` — Dialog/Drawer/AlertDialog/Lightbox/CommandPalette all share one
  // Root(behavior) > Trigger(part=trigger) + Backdrop(part=backdrop) +
  // Content(part=panel) + Close(part=close) shape; Lightbox layers `slide`/
  // `prev`/`next`/`title`(counter) parts and CommandPalette layers `search`/
  // `item` parts on the SAME behavior type rather than getting their own —
  // see `modal.ts`. Header/Footer/Group/Label sub-parts are NOT registered
  // (plain docking-bar divs — same sub-part rule as Card's CardBody).
  {
    name: "Dialog",
    category: "overlay",
    label: "Dialog",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "modal" };
      return out;
    },
  },
  {
    name: "DialogTrigger",
    category: "overlay",
    label: "Dialog trigger",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "DialogBackdrop",
    category: "overlay",
    label: "Dialog backdrop",
    icon: "box",
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true } });
      if (!out.part) out.part = "backdrop";
      return out;
    },
  },
  {
    name: "DialogContent",
    category: "overlay",
    label: "Dialog content",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", {
        attrs: { hidden: true, role: "dialog", "aria-modal": "true" },
        children: n.children,
      });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "DialogClose",
    category: "overlay",
    label: "Dialog close",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "close";
      return out;
    },
  },
  elementDef("DialogTitle", "overlay", "heading", "h2"),
  elementDef("DialogDescription", "overlay", "text", "p"),

  // Drawer — identical shape to Dialog; `props.side` becomes a `data-side`
  // attribute on the panel for the CSS to slide from (render-neutral to the
  // behavior itself).
  {
    name: "Drawer",
    category: "overlay",
    label: "Drawer",
    icon: "sidebar",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "modal" };
      return out;
    },
  },
  {
    name: "DrawerTrigger",
    category: "overlay",
    label: "Drawer trigger",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "DrawerBackdrop",
    category: "overlay",
    label: "Drawer backdrop",
    icon: "box",
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true } });
      if (!out.part) out.part = "backdrop";
      return out;
    },
  },
  {
    name: "DrawerContent",
    category: "overlay",
    label: "Drawer content",
    icon: "sidebar",
    container: true,
    expand: (n) => {
      const side = String(n.props?.side ?? "left");
      const out = lower(n, "div", {
        attrs: { hidden: true, "data-side": side, role: "dialog", "aria-modal": "true" },
        children: n.children,
      });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "DrawerClose",
    category: "overlay",
    label: "Drawer close",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "close";
      return out;
    },
  },
  elementDef("DrawerTitle", "overlay", "heading", "h2"),
  elementDef("DrawerDescription", "overlay", "text", "p"),

  // AlertDialog — same shape, `params.dismissible: false` (backdrop is inert
  // — clicking it does NOT close, only Escape/an explicit close does, per the
  // ARIA alert-dialog pattern). Action/Cancel are both `close` parts — a
  // host's own click listener on Action still runs before this one closes it.
  {
    name: "AlertDialog",
    category: "overlay",
    label: "Alert dialog",
    icon: "warning",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "modal", params: { dismissible: false } };
      return out;
    },
  },
  {
    name: "AlertDialogTrigger",
    category: "overlay",
    label: "Alert dialog trigger",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "AlertDialogBackdrop",
    category: "overlay",
    label: "Alert dialog backdrop",
    icon: "box",
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true } });
      if (!out.part) out.part = "backdrop";
      return out;
    },
  },
  {
    name: "AlertDialogContent",
    category: "overlay",
    label: "Alert dialog content",
    icon: "warning",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", {
        attrs: { hidden: true, role: "alertdialog", "aria-modal": "true" },
        children: n.children,
      });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "AlertDialogClose",
    category: "overlay",
    label: "Alert dialog close",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "close";
      return out;
    },
  },
  {
    name: "AlertDialogCancel",
    category: "overlay",
    label: "Alert dialog cancel",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "close";
      return out;
    },
  },
  {
    name: "AlertDialogAction",
    category: "overlay",
    label: "Alert dialog action",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "close";
      return out;
    },
  },
  elementDef("AlertDialogTitle", "overlay", "heading", "h2"),
  elementDef("AlertDialogDescription", "overlay", "text", "p"),

  // Lightbox — trigger[i] opens slide[i] (positional pairing, like `tabs`);
  // Counter reuses the `title` role (same "text this behavior keeps in sync"
  // convention `calendar`'s month label uses).
  {
    name: "Lightbox",
    category: "media",
    label: "Lightbox",
    icon: "image",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "modal" };
      return out;
    },
  },
  {
    name: "LightboxTrigger",
    category: "media",
    label: "Lightbox trigger",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "LightboxBackdrop",
    category: "media",
    label: "Lightbox backdrop",
    icon: "box",
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true } });
      if (!out.part) out.part = "backdrop";
      return out;
    },
  },
  {
    name: "LightboxContent",
    category: "media",
    label: "Lightbox content",
    icon: "image",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", {
        attrs: { hidden: true, role: "dialog", "aria-modal": "true", "aria-label": "Image viewer" },
        children: n.children,
      });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "LightboxSlide",
    category: "media",
    label: "Lightbox slide",
    icon: "image",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.part) out.part = "slide";
      return out;
    },
  },
  {
    name: "LightboxPrev",
    category: "media",
    label: "Lightbox previous",
    icon: "button",
    expand: (n) => {
      const out = lower(n, "button", {
        attrs: { type: "button", "aria-label": "Previous image" },
        children: textChildren(n, "text") ?? ["‹"],
      });
      if (!out.part) out.part = "prev";
      return out;
    },
  },
  {
    name: "LightboxNext",
    category: "media",
    label: "Lightbox next",
    icon: "button",
    expand: (n) => {
      const out = lower(n, "button", {
        attrs: { type: "button", "aria-label": "Next image" },
        children: textChildren(n, "text") ?? ["›"],
      });
      if (!out.part) out.part = "next";
      return out;
    },
  },
  {
    name: "LightboxClose",
    category: "media",
    label: "Lightbox close",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", {
        attrs: { type: "button", "aria-label": "Close" },
        children: n.children,
      });
      if (!out.part) out.part = "close";
      return out;
    },
  },
  {
    name: "LightboxCounter",
    category: "media",
    label: "Lightbox counter",
    icon: "box",
    expand: (n) => {
      const out = lower(n, "span");
      if (!out.part) out.part = "title";
      return out;
    },
  },

  // CommandPalette — `params.hotkey` binds ⌘K/Ctrl+K globally (default
  // `true`; `props.hotkey === false` disables it). Input/Item reuse the
  // `search`/`item` parts `modal.ts` optionally wires filter+arrow-nav for.
  {
    name: "CommandPalette",
    category: "overlay",
    label: "Command palette",
    icon: "search",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) {
        const hotkey = n.props?.hotkey;
        out.behavior = { type: "modal", params: { hotkey: hotkey === false ? false : hotkey ?? true } };
      }
      return out;
    },
  },
  {
    name: "CommandPaletteBackdrop",
    category: "overlay",
    label: "Command palette backdrop",
    icon: "box",
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true } });
      if (!out.part) out.part = "backdrop";
      return out;
    },
  },
  {
    name: "CommandPaletteContent",
    category: "overlay",
    label: "Command palette content",
    icon: "search",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", {
        attrs: { hidden: true, role: "dialog", "aria-modal": "true", "aria-label": "Command palette" },
        children: n.children,
      });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "CommandPaletteInput",
    category: "overlay",
    label: "Command palette input",
    icon: "input",
    expand: (n) => {
      const out = lower(n, "input", {
        attrs: formAttrs(n, { type: "text", placeholder: "Type a command or search…" }, ["placeholder"]),
      });
      if (!out.part) out.part = "search";
      return out;
    },
  },
  {
    name: "CommandPaletteItem",
    category: "overlay",
    label: "Command palette item",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { attrs: { role: "option" }, children: n.children });
      if (!out.part) out.part = "item";
      return out;
    },
  },

  // `popover` — anchored trigger/panel pairs; positioning is computed at
  // runtime (see `popover.ts`), same precedent as `carousel`'s
  // `track.style.transform`. Popover/Tooltip/PreviewCard differ only by
  // `params.trigger` — real parameters, not a papered-over mismatch.
  {
    name: "Popover",
    category: "overlay",
    label: "Popover",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "popover" };
      return out;
    },
  },
  {
    name: "PopoverTrigger",
    category: "overlay",
    label: "Popover trigger",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "PopoverContent",
    category: "overlay",
    label: "Popover content",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true, role: "dialog" }, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "PopoverClose",
    category: "overlay",
    label: "Popover close",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "close";
      return out;
    },
  },
  elementDef("PopoverTitle", "overlay", "heading", "h3"),
  elementDef("PopoverDescription", "overlay", "text", "p"),

  // Tooltip — `params.trigger: "hover"`; the trigger wraps an arbitrary
  // element (Base UI merges hover/focus onto it directly — a framework-free
  // host instead gets a small inline wrapper, a documented simplification).
  {
    name: "Tooltip",
    category: "overlay",
    label: "Tooltip",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "popover", params: { trigger: "hover" } };
      return out;
    },
  },
  {
    name: "TooltipTrigger",
    category: "overlay",
    label: "Tooltip trigger",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "span", { children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "TooltipContent",
    category: "overlay",
    label: "Tooltip content",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true, role: "tooltip" }, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },

  // PreviewCard — same shape as Tooltip (hover trigger), rich card content
  // rather than a short text label.
  {
    name: "PreviewCard",
    category: "overlay",
    label: "Preview card",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "popover", params: { trigger: "hover" } };
      return out;
    },
  },
  {
    name: "PreviewCardTrigger",
    category: "overlay",
    label: "Preview card trigger",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "span", { children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "PreviewCardContent",
    category: "overlay",
    label: "Preview card content",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true }, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },

  // ContextMenu — reuses `menu` (not `popover`): its content is a flat
  // action-item list that wants the SAME arrow-key/Home/End roving focus
  // DropdownMenu already has, not a rich anchored panel. `params.trigger:
  // "context"` swaps the open event to `contextmenu` and positions at the
  // pointer instead of the trigger rect (see `menu.ts`).
  {
    name: "ContextMenu",
    category: "overlay",
    label: "Context menu",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "menu", params: { trigger: "context" } };
      return out;
    },
  },
  {
    name: "ContextMenuTrigger",
    category: "overlay",
    label: "Context menu area",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "ContextMenuContent",
    category: "overlay",
    label: "Context menu content",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true, role: "menu" }, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "ContextMenuItem",
    category: "overlay",
    label: "Context menu item",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button", role: "menuitem" }, children: n.children });
      if (!out.part) out.part = "item";
      return out;
    },
  },

  // Menubar — each menu is its OWN independent `menu` root (a documented
  // simplification: no bar-wide single-open coordination or hover-to-switch
  // in vanilla, since sibling behavior roots can't see each other — but
  // every menu still fully opens/closes/roves/dismisses on its own).
  elementDef("Menubar", "nav", "nav", "div", true),
  {
    name: "MenubarMenu",
    category: "nav",
    label: "Menu",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "menu" };
      return out;
    },
  },
  {
    name: "MenubarTrigger",
    category: "nav",
    label: "Menubar trigger",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "MenubarContent",
    category: "nav",
    label: "Menubar content",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true, role: "menu" }, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "MenubarItem",
    category: "nav",
    label: "Menubar item",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button", role: "menuitem" }, children: n.children });
      if (!out.part) out.part = "item";
      return out;
    },
  },

  // NavigationMenu — each item is its own independent `popover` root
  // (`hover` trigger; same bar-wide-coordination simplification as Menubar).
  // Content is rich mega-menu markup, not a flat item list, so this reuses
  // `popover` (no item roving assumed) rather than `menu`.
  elementDef("NavigationMenu", "nav", "nav", "nav", true),
  {
    name: "NavigationMenuItem",
    category: "nav",
    label: "Navigation menu item",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "popover", params: { trigger: "hover" } };
      return out;
    },
  },
  {
    name: "NavigationMenuTrigger",
    category: "nav",
    label: "Navigation menu trigger",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "NavigationMenuContent",
    category: "nav",
    label: "Navigation menu content",
    icon: "nav",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true }, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "NavigationMenuLink",
    category: "nav",
    label: "Navigation menu link",
    icon: "nav",
    container: true,
    expand: (n) => lower(n, "a", { attrs: { href: String(n.props?.href ?? "#") }, children: n.children }),
  },

  // `combobox` — Combobox/Autocomplete/MultiSelect are all SINGLE, self-
  // contained React components with an `items` prop (like `Select`, not a
  // Root/Trigger/Content compound tree), so their vanilla macros follow the
  // same shape: build the whole input+popup+options structure from
  // `props.items` (unauthored structural sugar, same precedent as
  // `Carousel`'s invented track/dots). Only `params.mode` differs.
  {
    name: "Combobox",
    category: "form",
    label: "Combobox",
    icon: "select",
    expand: comboboxExpand("select"),
  },
  {
    name: "Autocomplete",
    category: "form",
    label: "Autocomplete",
    icon: "select",
    expand: comboboxExpand("freetext"),
  },
  {
    name: "MultiSelect",
    category: "form",
    label: "Multi select",
    icon: "select",
    expand: comboboxExpand("multiple"),
  },

  // `date-segment` — DateInput/DateTimeInput/TimeInput carry the behavior on
  // their own root; DateRangeInput is two INDEPENDENT `date-segment` roots
  // nested side by side (hydrate() scans the whole document for behavior
  // roots, not just top-level ones, so both wire up with zero extra code).
  {
    name: "DateInput",
    category: "form",
    label: "Date input",
    icon: "input",
    expand: (n) => {
      const p = n.props ?? {};
      const locale = typeof p.locale === "string" ? p.locale : undefined;
      const children = dateSegmentChildren(locale, p.value ?? p.defaultValue);
      const hidden = elc("input", undefined, undefined, {
        type: "hidden",
        ...(p.name != null ? { name: String(p.name) } : {}),
      });
      const out = lower(n, "div", { attrs: { role: "group" }, children: [...children, hidden] });
      if (!out.behavior) out.behavior = { type: "date-segment" };
      return out;
    },
  },
  {
    name: "DateRangeInput",
    category: "form",
    label: "Date range input",
    icon: "input",
    expand: (n) => {
      const p = n.props ?? {};
      const locale = typeof p.locale === "string" ? p.locale : undefined;
      const range = (p.value ?? p.defaultValue) as { start?: unknown; end?: unknown } | undefined;
      const startGroup = elc("div", "segment-field-group", dateSegmentChildren(locale, range?.start), { role: "group" });
      startGroup.behavior = { type: "date-segment" };
      const endGroup = elc("div", "segment-field-group", dateSegmentChildren(locale, range?.end), { role: "group" });
      endGroup.behavior = { type: "date-segment" };
      return lower(n, "div", { children: [startGroup, literalEl("–"), endGroup] });
    },
  },
  {
    name: "DateTimeInput",
    category: "form",
    label: "Date & time input",
    icon: "input",
    expand: (n) => {
      const p = n.props ?? {};
      const locale = typeof p.locale === "string" ? p.locale : undefined;
      const dateChildren = dateSegmentChildren(locale, p.value ?? p.defaultValue);
      const timeChildren = buildTimeSegments(
        locale,
        p.hourCycle === 12 || p.hourCycle === 24 ? p.hourCycle : undefined,
        p.showSeconds === true,
      ).map((cfg) => (cfg.kind === "literal" ? literalEl(cfg.text) : segmentEl(cfg, null)));
      const hidden = elc("input", undefined, undefined, {
        type: "hidden",
        ...(p.name != null ? { name: String(p.name) } : {}),
      });
      const out = lower(n, "div", {
        attrs: { role: "group" },
        children: [...dateChildren, literalEl(" "), ...timeChildren, hidden],
      });
      if (!out.behavior) out.behavior = { type: "date-segment" };
      return out;
    },
  },
  {
    name: "TimeInput",
    category: "form",
    label: "Time input",
    icon: "input",
    expand: (n) => {
      const p = n.props ?? {};
      const locale = typeof p.locale === "string" ? p.locale : undefined;
      const cfgs = buildTimeSegments(
        locale,
        p.hourCycle === 12 || p.hourCycle === 24 ? p.hourCycle : undefined,
        p.showSeconds === true,
      );
      const children = cfgs.map((cfg) => (cfg.kind === "literal" ? literalEl(cfg.text) : segmentEl(cfg, null)));
      const hidden = elc("input", undefined, undefined, {
        type: "hidden",
        ...(p.name != null ? { name: String(p.name) } : {}),
      });
      const out = lower(n, "div", { attrs: { role: "group" }, children: [...children, hidden] });
      if (!out.behavior) out.behavior = { type: "date-segment" };
      return out;
    },
  },

  // `pin-input` — real single-char `<input>` cells (index-based), unlike
  // `date-segment`'s buffer-accumulate model — see `pin-input.ts`.
  {
    name: "PinInput",
    category: "form",
    label: "PIN input",
    icon: "input",
    expand: (n) => {
      const p = n.props ?? {};
      const length = Math.max(1, Math.floor(Number(p.length ?? 6)));
      const numeric = p.mode !== "text";
      const initial = typeof p.value === "string" ? p.value : typeof p.defaultValue === "string" ? p.defaultValue : "";
      const cells = Array.from({ length }, (_, i) => {
        const attrs: NonNullable<ElementNode["attrs"]> = {
          type: "text",
          inputmode: numeric ? "numeric" : "text",
          maxlength: 1,
          "aria-label": `Digit ${i + 1}`,
        };
        const ch = initial[i];
        if (ch) {
          attrs.value = ch;
          attrs["data-filled"] = true;
        }
        const cell = elc("input", "pin-input-cell", undefined, attrs);
        cell.part = "cell";
        return cell;
      });
      const hidden = elc("input", undefined, undefined, {
        type: "hidden",
        value: initial,
        ...(p.name != null ? { name: String(p.name) } : {}),
      });
      const out = lower(n, "div", {
        attrs: { role: "group", "aria-label": String(p["aria-label"] ?? "Verification code") },
        children: [...cells, hidden],
      });
      if (!out.behavior) out.behavior = { type: "pin-input" };
      return out;
    },
  },

  // `calendar` — Calendar carries the behavior directly; DatePicker/
  // DateRangePicker are the SAME calendar shell nested inside a `popover`
  // root's panel (a `calendar` behavior root nested inside a `popover` one —
  // `ownParts` already stops at nested behavior boundaries, so this needs no
  // extra code, same composition trick as Lightbox nesting inside `modal`).
  {
    name: "Calendar",
    category: "form",
    label: "Calendar",
    icon: "calendar",
    expand: (n) => {
      const { header, grid, hidden } = calendarParts();
      const out = lower(n, "div", { children: [header, grid, hidden] });
      if (!out.behavior) out.behavior = { type: "calendar", params: calendarParamsFromProps(n.props ?? {}) };
      return out;
    },
  },
  {
    name: "DatePicker",
    category: "form",
    label: "Date picker",
    icon: "calendar",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "popover" };
      return out;
    },
  },
  {
    name: "DatePickerTrigger",
    category: "form",
    label: "Date picker trigger",
    icon: "calendar",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "DatePickerContent",
    category: "form",
    label: "Date picker content",
    icon: "calendar",
    expand: (n) => {
      const { header, grid, hidden } = calendarParts();
      const inner = elc("div", "calendar", [header, grid, hidden]);
      inner.behavior = { type: "calendar", params: calendarParamsFromProps(n.props ?? {}) };
      const out = lower(n, "div", { attrs: { hidden: true }, children: [inner] });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "DateRangePicker",
    category: "form",
    label: "Date range picker",
    icon: "calendar",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "popover" };
      return out;
    },
  },
  {
    name: "DateRangePickerTrigger",
    category: "form",
    label: "Date range picker trigger",
    icon: "calendar",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: n.children });
      if (!out.part) out.part = "trigger";
      return out;
    },
  },
  {
    name: "DateRangePickerContent",
    category: "form",
    label: "Date range picker content",
    icon: "calendar",
    expand: (n) => {
      const params = calendarParamsFromProps(n.props ?? {});
      params.mode = "range";
      const { header, grid, hidden } = calendarParts();
      const inner = elc("div", "calendar", [header, grid, hidden]);
      inner.behavior = { type: "calendar", params };
      const out = lower(n, "div", { attrs: { hidden: true }, children: [inner] });
      if (!out.part) out.part = "panel";
      return out;
    },
  },

  // `tree` — TreeGroup defaults hidden unless `defaultExpanded`, same
  // convention `AccordionPanel`/`CollapsiblePanel` established (the
  // behavior only READS existing hidden state on hydrate, never forces it).
  {
    name: "TreeView",
    category: "data",
    label: "Tree view",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "ul", { attrs: { role: "tree" }, children: n.children });
      if (!out.behavior) out.behavior = { type: "tree" };
      return out;
    },
  },
  {
    name: "TreeNode",
    category: "data",
    label: "Tree node",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "li", { attrs: { role: "treeitem" }, children: n.children });
      if (!out.part) out.part = "node";
      return out;
    },
  },
  {
    name: "TreeToggle",
    category: "data",
    label: "Tree toggle",
    icon: "button",
    expand: (n) => {
      const out = lower(n, "button", {
        attrs: { type: "button", "aria-hidden": "true", tabindex: -1 },
        children: textChildren(n, "text") ?? ["▸"],
      });
      if (!out.part) out.part = "toggle";
      return out;
    },
  },
  {
    name: "TreeGroup",
    category: "data",
    label: "Tree group",
    icon: "box",
    container: true,
    expand: (n) => {
      const attrs: NonNullable<ElementNode["attrs"]> = { role: "group" };
      if (n.props?.defaultExpanded !== true) attrs.hidden = true;
      return lower(n, "ul", { attrs, children: n.children });
    },
  },

  // `wizard` — Back/Next reuse the `prev`/`next` roles (already exist).
  {
    name: "Wizard",
    category: "data",
    label: "Wizard",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.behavior) out.behavior = { type: "wizard", params: { linear: n.props?.linear !== false } };
      return out;
    },
  },
  {
    name: "WizardStep",
    category: "data",
    label: "Wizard step",
    icon: "box",
    container: true,
    expand: (n) => {
      const attrs: NonNullable<ElementNode["attrs"]> = { type: "button" };
      if (n.props?.disabled === true) attrs["data-disabled"] = "true";
      const out = lower(n, "button", { attrs, children: n.children });
      if (!out.part) out.part = "step";
      return out;
    },
  },
  {
    name: "WizardPanel",
    category: "data",
    label: "Wizard panel",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { attrs: { hidden: true }, children: n.children });
      if (!out.part) out.part = "panel";
      return out;
    },
  },
  {
    name: "WizardBack",
    category: "data",
    label: "Wizard back",
    icon: "button",
    container: true,
    expand: (n) => {
      const out = lower(n, "button", { attrs: { type: "button" }, children: textChildren(n, "text") ?? ["Back"] });
      if (!out.part) out.part = "prev";
      return out;
    },
  },
  {
    name: "WizardNext",
    category: "data",
    label: "Wizard next",
    icon: "button",
    container: true,
    expand: (n) => {
      const attrs: NonNullable<ElementNode["attrs"]> = { type: "button" };
      if (n.props?.nextLabel != null) attrs["data-next-label"] = String(n.props.nextLabel);
      if (n.props?.finishLabel != null) attrs["data-finish-label"] = String(n.props.finishLabel);
      const out = lower(n, "button", { attrs, children: textChildren(n, "text") ?? ["Next"] });
      if (!out.part) out.part = "next";
      return out;
    },
  },

  // `number-field` — native `<input type=number>`, no Base-UI-only CSS
  // selectors to work around (confirmed via the CSS check this pass).
  {
    name: "NumberField",
    category: "form",
    label: "Number field",
    icon: "input",
    container: true,
    expand: (n) => {
      const attrs = formAttrs(n, { type: "number" }, [
        "name",
        "min",
        "max",
        "step",
        "value",
        "required",
        "disabled",
        "placeholder",
      ]);
      const input = elc("input", "number-field-input", undefined, attrs);
      const dec = elc("button", "number-field-decrement", ["–"], { type: "button", "aria-label": "Decrease" });
      dec.part = "decrement";
      const inc = elc("button", "number-field-increment", ["+"], { type: "button", "aria-label": "Increase" });
      inc.part = "increment";
      const out = lower(n, "div", { children: [dec, input, inc] });
      if (!out.behavior) out.behavior = { type: "number-field" };
      return out;
    },
  },

  // `toggle-group` — a toolbar of toggle buttons, NOT a listbox (distinct
  // ARIA pattern from `SelectionList`: `aria-pressed` on real buttons).
  {
    name: "ToggleGroup",
    category: "form",
    label: "Toggle group",
    icon: "toggle",
    container: true,
    expand: (n) => {
      const p = n.props ?? {};
      const out = lower(n, "div", { attrs: { role: "group" }, children: n.children });
      if (!out.behavior) {
        const params: Record<string, unknown> = {};
        if (p.multiple === true) params.multiple = true;
        if (p.orientation === "vertical") params.orientation = "vertical";
        out.behavior = { type: "toggle-group", params };
      }
      return out;
    },
  },
  {
    name: "ToggleGroupItem",
    category: "form",
    label: "Toggle group item",
    icon: "toggle",
    container: true,
    expand: (n) => {
      const pressed = n.props?.pressed === true;
      const attrs: NonNullable<ElementNode["attrs"]> = { type: "button", "aria-pressed": String(pressed) };
      if (pressed) attrs["data-pressed"] = true;
      const out = lower(n, "button", { attrs, children: n.children });
      if (!out.part) out.part = "item";
      return out;
    },
  },

  // `slider` — Range (compact) and Slider (rich, `showValue`) are both
  // single self-contained components; see `sliderExpand`. Base UI's three
  // addressable Track/Indicator/Thumb nodes are rebuilt here since a bare
  // `<input type=range>` has no such structure (confirmed via the CSS check
  // this pass) — real pointer-drag + keyboard geometry, not a native fallback.
  { name: "Range", category: "form", label: "Range", icon: "input", expand: sliderExpand("range") },
  { name: "Slider", category: "form", label: "Slider", icon: "input", expand: sliderExpand("slider") },

  // `switch` — a `role=switch` element the CSS keys off `[data-checked]`
  // for (Base UI's synthetic attribute, ported verbatim — a bare
  // `<input type=checkbox>` would NOT match `.switch`'s selectors).
  {
    name: "Switch",
    category: "form",
    label: "Switch",
    icon: "toggle",
    expand: (n) => {
      const p = n.props ?? {};
      const checked = p.checked === true || p.defaultChecked === true;
      const inputAttrs: NonNullable<ElementNode["attrs"]> = { type: "checkbox" };
      if (checked) inputAttrs.checked = true;
      if (p.name != null) inputAttrs.name = String(p.name);
      if (p.disabled === true) inputAttrs.disabled = true;
      const input = elc("input", "switch-input", undefined, inputAttrs);
      const attrs: NonNullable<ElementNode["attrs"]> = { role: "switch", tabindex: 0, "aria-checked": String(checked) };
      if (checked) attrs["data-checked"] = true;
      if (p.disabled === true) attrs["aria-disabled"] = "true";
      const out = lower(n, "span", { attrs, children: [input] });
      if (!out.behavior) out.behavior = { type: "switch" };
      return out;
    },
  },

  // `rating` — not Base UI-backed in React either (plain JSX-set
  // `data-filled`), so this ports near 1:1.
  {
    name: "Rating",
    category: "form",
    label: "Rating",
    icon: "star",
    expand: (n) => {
      const p = n.props ?? {};
      const max = Math.max(1, Math.floor(Number(p.max ?? 5)));
      const value = Number(p.value ?? p.defaultValue ?? 0);
      const stars = Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        const star = elc("button", "rating-star", undefined, {
          type: "button",
          role: "radio",
          "aria-checked": String(filled),
          "data-filled": String(filled),
          "aria-label": `${i + 1} star${i === 0 ? "" : "s"}`,
        });
        star.part = "item";
        return star;
      });
      const hidden = elc("input", undefined, undefined, {
        type: "hidden",
        value: String(value),
        ...(p.name != null ? { name: String(p.name) } : {}),
      });
      const out = lower(n, "div", { attrs: { role: "radiogroup" }, children: [...stars, hidden] });
      if (!out.behavior) out.behavior = { type: "rating" };
      return out;
    },
  },

  // `scroll-area` — a real `overflow:auto` `track` (CSS hides its native
  // scrollbar) with a custom `thumb` the behavior sizes/positions from the
  // viewport/content ratio — not achievable as a pure-CSS trick (confirmed
  // this pass).
  {
    name: "ScrollArea",
    category: "layout",
    label: "Scroll area",
    icon: "box",
    container: true,
    expand: (n) => {
      const track = elc("div", "scroll-area-viewport", n.children);
      track.part = "track";
      const thumb = elc("div", "scroll-area-thumb");
      thumb.part = "thumb";
      const out = lower(n, "div", { children: [track, thumb] });
      if (!out.behavior) out.behavior = { type: "scroll-area" };
      return out;
    },
  },

  // `overflow-list` — real `item`s reparent into the `panel` behind a "+N"
  // `trigger` once they don't fit; `params.maxVisible` forces a fixed count
  // when real layout isn't available (see `overflow-list.ts`).
  {
    name: "OverflowList",
    category: "layout",
    label: "Overflow list",
    icon: "box",
    container: true,
    expand: (n) => {
      const p = n.props ?? {};
      const trigger = elc("button", "overflow-list-trigger", undefined, {
        type: "button",
        hidden: true,
        "aria-haspopup": "true",
      });
      trigger.part = "trigger";
      // No role=menu: the panel receives arbitrary reparented items (chips,
      // links, anything) — menu REQUIRES menuitem children. This is a
      // disclosure, and the behavior wires aria-expanded/Escape accordingly.
      const panel = elc("div", "overflow-list-panel", undefined, { hidden: true });
      panel.part = "panel";
      const out = lower(n, "div", { children: [...(n.children ?? []), trigger, panel] });
      if (!out.behavior) {
        const params: Record<string, unknown> = {};
        if (typeof p.maxVisible === "number") params.maxVisible = p.maxVisible;
        out.behavior = { type: "overflow-list", params };
      }
      return out;
    },
  },
  {
    name: "OverflowListItem",
    category: "layout",
    label: "Overflow list item",
    icon: "box",
    container: true,
    expand: (n) => {
      const out = lower(n, "div", { children: n.children });
      if (!out.part) out.part = "item";
      return out;
    },
  },

  // `dropzone` — Dropzone is bare (presentational only, host owns the file
  // list via `onFiles`-equivalent listening for `sui:file`); FileUpload adds
  // a managed `list` part the behavior renders thumbnail/name/remove rows
  // into directly (the one place a behavior owns real create-your-own-markup
  // state, same precedent as `Carousel`'s track/dots).
  { name: "Dropzone", category: "form", label: "Dropzone", icon: "input", container: true, expand: dropzoneExpand(false) },
  { name: "FileUpload", category: "form", label: "File upload", icon: "input", container: true, expand: dropzoneExpand(true) },

  // `phone-input` — a country `<select>` (options carry `data-dial`) joined
  // with a digits `input`; the country list is plain static data, ported
  // verbatim (no React-only mechanism was involved in the original).
  {
    name: "PhoneInput",
    category: "form",
    label: "Phone input",
    icon: "input",
    expand: (n) => {
      const p = n.props ?? {};
      const list =
        Array.isArray(p.countries) && p.countries.length
          ? (p.countries as Array<{ iso2: string; name: string; dial: string }>)
          : DEFAULT_COUNTRIES;
      const selectedIso = String(p.country ?? p.defaultCountry ?? "US");
      const options = list.map((c) => {
        const attrs: NonNullable<ElementNode["attrs"]> = { value: c.iso2, "data-dial": c.dial };
        if (c.iso2 === selectedIso) attrs.selected = true;
        return elc("option", undefined, [`+${c.dial} ${c.name}`], attrs);
      });
      const country = elc("select", "phone-input-country", options, { "aria-label": "Country code" });
      country.part = "country";

      const inputAttrs = formAttrs(n, { type: "tel" }, ["name", "placeholder", "required", "disabled"]);
      const value = p.value ?? p.defaultValue;
      if (typeof value === "string") inputAttrs.value = value;
      const input = elc("input", "phone-input-number", undefined, inputAttrs);
      input.part = "input";

      const hidden = elc("input", undefined, undefined, {
        type: "hidden",
        ...(p.name != null ? { name: `${String(p.name)}-e164` } : {}),
      });
      const out = lower(n, "div", { children: [country, input, hidden] });
      if (!out.behavior) out.behavior = { type: "phone-input" };
      return out;
    },
  },

  // `theme-toggle` — thin wiring over the existing `setTheme`/`getTheme`
  // primitives (see `theme-toggle.ts`); there was no new state machine to
  // build here, just a registration.
  {
    name: "ThemeController",
    category: "form",
    label: "Theme controller",
    icon: "box",
    container: true,
    expand: (n) => {
      const p = n.props ?? {};
      const out = lower(n, "button", { attrs: { type: "button" }, children: textChildren(n, "text") ?? n.children });
      if (!out.behavior) {
        const params: Record<string, unknown> = {};
        if (Array.isArray(p.themes) && p.themes.length) params.themes = p.themes.map(String);
        out.behavior = { type: "theme-toggle", params };
      }
      return out;
    },
  },

  // Overlay — pure CSS (`[data-reveal="hover"]:hover .overlay-scrim`); no
  // behavior at all (confirmed this pass). OverlayScrim is a real sub-atom
  // (not a plain div) because `data-placement` is behavior-relevant to the
  // CSS, same rule that earned ToolbarSeparator its own atom.
  {
    name: "Overlay",
    category: "media",
    label: "Overlay",
    icon: "image",
    container: true,
    expand: (n) => lower(n, "div", { attrs: { "data-reveal": String(n.props?.reveal ?? "always") }, children: n.children }),
  },
  {
    name: "OverlayScrim",
    category: "media",
    label: "Overlay scrim",
    icon: "image",
    container: true,
    expand: (n) => lower(n, "div", { attrs: { "data-placement": String(n.props?.placement ?? "bottom") }, children: n.children }),
  },
];

// ── registry ────────────────────────────────────────────────────────────────

const registry = new Map<string, ComponentDef>();

/** Register (or replace) a component definition. Built-ins register at load. */
export function registerComponent(def: ComponentDef): void {
  registry.set(def.name, def);
}

/** Look up a component definition by name. */
export function getComponent(name: string): ComponentDef | undefined {
  return registry.get(name);
}

/** Every registered component, in registration order. */
export function listComponents(): ComponentDef[] {
  return [...registry.values()];
}

/**
 * Lower a component node to its element expansion. Throws (with the atom-registry
 * message projections have always used) if the component is unregistered.
 */
export function expandComponent(node: ComponentNode): Node {
  const def = registry.get(node.component);
  if (!def) {
    throw new Error(
      `Unknown @wizeworks/silicaui atom: "${node.component}". Register it in the atom registry.`,
    );
  }
  return def.expand(node);
}

for (const def of BUILTIN_COMPONENTS) registerComponent(def);
