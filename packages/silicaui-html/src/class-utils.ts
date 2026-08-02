/**
 * String helpers shared by the projections: HTML escaping, attribute rendering,
 * the void-element set, and prefix application.
 */

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** HTML-escape text content and attribute values. */
export function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ESC[c] as string);
}

/**
 * Render one attribute. Boolean `true` → bare attribute (`hidden`); `false`,
 * `null`, and `undefined` → omitted entirely; anything else → `name="value"`.
 */
export function attr(name: string, value: unknown): string {
  if (value === false || value == null) return "";
  if (value === true) return ` ${name}`;
  return ` ${name}="${esc(value)}"`;
}

/** Void elements never get a closing tag or children. */
export const VOID_ELEMENTS: ReadonlySet<string> = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/**
 * @wizeworks/silicaui component-class STEMS — the first segment of a component class (e.g.
 * `btn` in `btn-primary`). This set is the sole source of truth for prefixing:
 * a class token is prefixed iff its stem is a component, so `btn`→`st-btn` while
 * utilities (`grid`, `gap-8`, `bg-primary`, `rounded-box`) are left untouched.
 */
export const COMPONENT_STEMS: ReadonlySet<string> = new Set([
  "btn",
  "badge",
  "card",
  "alert",
  "input",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "toggle",
  "range",
  "progress",
  "avatar",
  "skeleton",
  "table",
  "divider",
  "kbd",
  "breadcrumb",
  "stat",
  "steps",
  "join",
  "menu",
  "details",
  "indicator",
  "loading",
  "navbar",
  "footer",
  "hero",
  "link",
  "mockup",
  "timeline",
  "carousel",
  "stack",
  "rating",
  "pagination",
  "accordion",
  "chat",
  "toast",
  "swap",
  "status",
  "countdown",
  "drawer",
  "list",
  "dock",
  "fieldset",
  "label",
  "validator",
  "diff",
  "mask",
  "meter",
  "tooltip",
  "dialog",
  "popover",
  "dropdown",
  "tabs",
  "tab",
  "filter",
  "calendar",
  "slider",
  "toolbar",
  "prose",
  // `wordmark` (a real component, `wordmark-sm`/`-lg`/`-accent`/`-<color>`) and
  // `glass` (the Tier-0 frosted utility) are BOTH emitted with the configured
  // prefix by the plugin — `wordmark(colors, prefix)` and `glassUtilities(prefix)`
  // — so omitting them here made a prefixed projection emit a bare class that
  // matched no CSS. The palette has authored `atom("Wordmark", "wordmark")` since
  // it shipped, so this was already live for anyone running a class prefix.
  "wordmark",
  "glass",
  // The UI type ramp (silicaui/src/components/typography.js): `.display` /
  // `.display-1`–`-3`, `.h1`–`.h6`, `.lead`, `.blockquote` + `.blockquote-cite`.
  // All are emitted WITH the configured prefix by `typography(prefix)`, so
  // omitting their stems made a prefixed projection emit a bare class matching no
  // CSS — the same silent breakage `wordmark` and `glass` were added to close.
  // Live the moment a block reached for the ramp, which the hero family does:
  // `.display-*` is fluid via `cqi`, so it is the only way to size a hero
  // headline off its container instead of hand-rolling breakpoint variants.
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "lead",
  "blockquote",
  // KNOWN GAP, same shape as `soft` below: `.caption` is emitted prefixed too,
  // but its stem collides with Tailwind's real `caption-top`/`caption-bottom`
  // utilities — adding it would rewrite those into classes that match nothing.
  // Breaking a working utility is worse than leaving `.caption` unprefixed, so
  // it stays out until the stem scheme grows a full-token exception list.
  //
  // KNOWN GAP, deliberately not "fixed" here: `soft`'s other three forms
  // (`bg-soft` / `text-soft` / `border-soft`) are prefixed by the plugin too, but
  // their stems are `bg` / `text` / `border` — indistinguishable from real
  // utilities by this stem scheme. Only the bare `.soft` shorthand is reachable,
  // and adding it alone would prefix a third of the family and leave the rest,
  // which is worse than the honest gap. Fixing it needs a full-token exception
  // list, not a stem.
]);

/**
 * Apply a class prefix to the @wizeworks/silicaui component classes within a class string,
 * leaving utilities alone. Any variant prefix (`@3xl:`, `hover:`) is preserved
 * and only the base token is rewritten: `@3xl:btn-lg` → `@3xl:st-btn-lg`.
 */
export function applyPrefix(cls: string, prefix: string): string {
  if (!prefix) return cls;
  return cls
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const colon = token.lastIndexOf(":");
      const variant = colon === -1 ? "" : token.slice(0, colon + 1);
      const base = colon === -1 ? token : token.slice(colon + 1);
      const stem = base.split("-")[0] ?? base;
      return COMPONENT_STEMS.has(stem) ? `${variant}${prefix}${base}` : token;
    })
    .join(" ");
}
