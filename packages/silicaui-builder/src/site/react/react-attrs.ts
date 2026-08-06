/**
 * HTML attribute name → the name React wants for it.
 *
 * The canvas renders authored nodes through `React.createElement`, but a node's
 * `attrs` carry real HTML attribute names — `for`, `stroke-width`, `autoplay` —
 * because that is what `toHtml` has to emit for production. React accepts most
 * of them verbatim and warns loudly on the rest ("Invalid DOM property
 * `autoplay`. Did you mean `autoPlay`?"), so the canvas translates on the way
 * in. Production markup is untouched: this only ever sees the ephemeral
 * render-time copy `canvasAttrs` makes.
 *
 * Its own module so `probe-canvas-attrs.ts` can check it against BOTH ends of
 * the contract it sits between — element.ts's allow-set on one side, React's own
 * `possibleStandardNames` on the other — without importing the React canvas into
 * a node script.
 */

/**
 * The names whose React spelling is NOT derivable from the HTML one. Hyphenated
 * names are handled by rule below, so this table only carries the irregulars.
 *
 * Keep it in step with `element.ts`'s allow-set: `canvasAttrs` runs AFTER
 * `sanitizeElement`, so the universe of names reaching here is exactly what that
 * whitelist permits, and a name added there that React spells differently warns
 * on the canvas until it is listed here. That is how `<video autoplay
 * playsinline>` — legal HTML, and what `toHtml` correctly emits — came to log
 * "Invalid DOM property `autoplay`" for every Video node on the design surface.
 */
const IRREGULAR: ReadonlyMap<string, string> = new Map([
  ["tabindex", "tabIndex"],
  ["readonly", "readOnly"],
  ["maxlength", "maxLength"],
  ["minlength", "minLength"],
  ["colspan", "colSpan"],
  ["rowspan", "rowSpan"],
  ["for", "htmlFor"],
  ["autocomplete", "autoComplete"],
  ["autofocus", "autoFocus"],
  ["spellcheck", "spellCheck"],
  ["crossorigin", "crossOrigin"],
  ["srcset", "srcSet"],
  ["novalidate", "noValidate"],
  ["enctype", "encType"],
  ["inputmode", "inputMode"],
  // media — `<video>` / `<audio>`
  ["autoplay", "autoPlay"],
  ["playsinline", "playsInline"],
  // `<time datetime>`
  ["datetime", "dateTime"],
]);

/** The two hyphenated namespaces React passes through as attributes rather than
 *  mapping to a DOM property — they must NOT be camelized. */
const VERBATIM_PREFIX = /^(?:data|aria)-/;

/**
 * The name React wants for one sanitized attribute.
 *
 * Every hyphenated SVG presentation attribute React knows (`stroke-width`,
 * `clip-path`, `stop-color`, `dominant-baseline`, `letter-spacing`, …) is its
 * HTML name kebab→camel with no exceptions, so deriving it closes the whole
 * class rather than the nineteen instances `SVG_PRESENTATION` happens to list
 * today — a name added there stays correct here for free. Everything else
 * single-word (`role`, `hidden`, `poster`, `preload`, …) already matches.
 */
export function reactAttrName(name: string): string {
  const irregular = IRREGULAR.get(name);
  if (irregular) return irregular;
  if (!name.includes("-") || VERBATIM_PREFIX.test(name)) return name;
  return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
