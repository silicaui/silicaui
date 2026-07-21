/**
 * Single source of truth for the site's identity — canonical origin, naming,
 * the default description, social handles, and the small helpers that turn
 * `DEMO_META` (id + title only) into unique, keyword-rich metadata per page.
 *
 * Everything SEO/AEO-related (metadata, robots, sitemap, JSON-LD, llms.txt)
 * reads from here so there is exactly one place a fact about the site lives —
 * change the tagline once and it propagates to <title>, Open Graph, structured
 * data, and the answer-engine feed together, never drifting apart.
 */

/** Canonical origin. No trailing slash; join paths with `url()`. */
export const SITE_URL = "https://silicaui.com";

export const SITE_NAME = "SilicaUI";

/** The one-line positioning statement. Kept tight enough to be a meta
 *  description and a spoken answer-engine sentence at once. */
export const SITE_TAGLINE =
  "The CSS-first Tailwind component library — Base UI behavior, OKLCH design tokens, and one color × variant × size × shape vocabulary across React, framework-neutral HTML, and vanilla JS.";

/** A fuller paragraph for Open Graph / structured-data `description` slots and
 *  the llms.txt header. Written to be quoted verbatim by an answer engine. */
export const SITE_DESCRIPTION =
  "SilicaUI is an open-source component library built on Tailwind CSS v4 and Base UI. Every component is styled with real CSS classes (not runtime CSS-in-JS) and every color is an OKLCH design token, so a single named color instantly re-tints every variant with no rebuild and no safelist. Components ship in three synchronized layers — React (silicaui-react), a framework-neutral node-tree + HTML projection (silicaui-html), and a zero-dependency vanilla behavior runtime (silicaui-behaviors) — so the same accessible primitives work in React apps, static sites, and server-rendered HTML alike.";

export const AUTHOR = "WizeWorks";
export const GITHUB_URL = "https://github.com/silicaui/silicaui";
export const NPM_URL = "https://www.npmjs.com/package/@wizeworks/silicaui";
export const TWITTER_HANDLE = "@silicaui";

/** Brand color for the manifest theme + favicon. This is the shipped Quartz
 *  `primary` (oklch(42% 0.055 252)) resolved to sRGB — a concrete hex is
 *  required in a JSON manifest and a broadly-supported favicon, the same
 *  sanctioned literal-color context as an OG image (CLAUDE.md RULE #1). */
export const BRAND_HEX = "#374f6a";
export const BRAND_BG_HEX = "#ffffff";

/** Broad SEO keyword set — the terms SilicaUI should be discoverable under.
 *  Deliberately includes the "alternative to X" queries people actually type. */
export const SITE_KEYWORDS = [
  "SilicaUI",
  "Tailwind CSS component library",
  "CSS-first components",
  "Base UI",
  "OKLCH design tokens",
  "React component library",
  "headless UI components",
  "accessible components",
  "themeable components",
  "design system",
  "daisyUI alternative",
  "shadcn/ui alternative",
  "Radix UI alternative",
  "framework-neutral UI",
  "server-rendered components",
  "Tailwind v4",
];

/** Absolute URL from a site-root-relative path. Honors the site's
 *  `trailingSlash: true` for page routes (`/docs` → `/docs/`) but NOT for file
 *  paths (`/sitemap.xml`, `/icon.svg`) — a trailing slash there points at a
 *  directory that doesn't exist. */
export function url(path = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  const isFile = /\.[a-z0-9]+$/i.test(path);
  if (path !== "/" && !path.endsWith("/") && !isFile) path = `${path}/`;
  return `${SITE_URL}${path}`;
}

/**
 * Curated one-liners for the flagship components — the ones a person is most
 * likely to search for and the ones worth their own hand-written sentence.
 * Everything not in this map falls back to `templateDescription`, which is
 * still unique per component (the name varies) and keyword-rich.
 */
const CURATED: Record<string, string> = {
  button:
    "An accessible, fully-tokened button with color, variant (solid/soft/outline/ghost/link), size, and shape props — the same class vocabulary in React and static HTML.",
  combobox:
    "A keyboard-accessible autocomplete combobox built on Base UI: type-ahead filtering, async options, and full ARIA, styled entirely with CSS classes.",
  calendar:
    "A themeable date calendar with keyboard navigation, range selection, and locale support — no date library lock-in, OKLCH-tokened surfaces.",
  "color-picker":
    "An OKLCH-native color picker: pick in a perceptually-uniform color space and get a token that re-tints an entire component set, in vanilla JS with no React required.",
  "data-table":
    "A sortable, filterable data table powered by TanStack Table, wrapped in SilicaUI's tokened styling — an opt-in package so the core stays lean.",
  dialog:
    "An accessible modal dialog with focus trapping, scroll locking, and enter/exit animation, driven by Base UI behavior in React and the vanilla behavior runtime in static HTML.",
  select:
    "A styleable select built on Base UI's listbox — full keyboard support and typeahead, tokened to match every other control.",
  "multi-select":
    "A tag-style multi-select with keyboard chips, filtering, and accessible removal — one component, tokened across themes.",
  toast:
    "An imperative toast/notification system with an accessible live region, auto-dismiss, and tone-by-status coloring.",
  tooltip:
    "An accessible tooltip on Base UI's positioning engine, with hover/focus triggers and reduced-motion-aware animation.",
  dropzone:
    "A drag-and-drop file dropzone with keyboard and click fallbacks, accessible status messaging, and tokened states.",
  "command-palette":
    "A ⌘K command palette with fuzzy search and keyboard navigation, reusing the modal behavior primitive — zero extra runtime.",
  input:
    "A tokened text input with error/warning/success field status (border + icon + message) layered over the base control, never a bespoke variant.",
  badge:
    "A status badge with color × variant × size props for marking state on a row, card, or record — auto-derives a legible foreground from any token.",
  card:
    "A composable surface card that reads the ambient theme's tokens — drop it inside a `data-theme` island and it re-skins with no per-theme CSS.",
};

/** The template every non-curated component uses. Still unique (the name and
 *  slug vary) and rich in the terms this library should rank for. */
function templateDescription(title: string): string {
  return `${title} — a CSS-first, fully-tokened ${title} component from SilicaUI. Accessible by default via Base UI, themeable with color × variant × size × shape props, and available in React, framework-neutral HTML, and a zero-dependency vanilla runtime. No runtime CSS-in-JS, no safelist.`;
}

/** The meta description / structured-data abstract for one component page. */
export function componentDescription(id: string, title: string): string {
  return CURATED[id] ?? templateDescription(title);
}

/** Short abstract used in the answer-engine feed (llms.txt) — trimmed. */
export function componentAbstract(id: string, title: string): string {
  const d = componentDescription(id, title);
  return d.length > 160 ? `${d.slice(0, 157).trimEnd()}…` : d;
}
