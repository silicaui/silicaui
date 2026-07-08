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
  "collapse",
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
