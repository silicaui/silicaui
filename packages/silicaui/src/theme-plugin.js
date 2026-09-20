import plugin from "tailwindcss/plugin";
import { autoContent } from "./lib/auto-content.js";
import { inkVerdict } from "./lib/measure-ink.js";
import {
  findDeclaredContentProblems,
  findInkProblems,
  findInkTextProblems,
  warnDeclaredContentProblems,
  warnInkProblems,
  warnInkTextProblems,
} from "./lib/warn-auto-ink.js";

/**
 * Tailwind hands a COMMA-SEPARATED option value to a plugin as an ARRAY, not as
 * one string. `index.js` knows this — `parseColors` and `parsePrefix` both open
 * with `Array.isArray(option)` — but that knowledge never reached this file, and
 * the old `unquote` fell straight through on an array because `typeof v` was not
 * `"string"`.
 *
 * The array then reached `addBase`, which emits ONE DECLARATION PER ELEMENT under
 * the same property name, so the last fragment won:
 *
 *   --font-head: "Cormorant Garamond", serif;   →   --font-head: Cormorant Garamond;
 *                                                   --font-head: serif;          ← wins
 *
 * A theme's type faces were therefore impossible to set through the documented
 * CSS path, and it failed silently: you get the generic `serif`, which looks like
 * a font rather than like a bug. Multi-layer shadows split the same way. Joining
 * is the whole fix. See docs/personas/issues/031.
 */
function joinList(v) {
  return Array.isArray(v) ? v.map((part) => String(part).trim()).join(", ") : v;
}

/**
 * Strip ONE matched pair of wrapping quotes, and only when the whole value is
 * wrapped in them. The old regex stripped each end independently, so
 * `"Cormorant Garamond", serif` lost its opening quote and kept the inner one —
 * a malformed stack. `"#7c3aed"` still unwraps, which is the case that made
 * stripping worth doing in the first place.
 */
function unwrap(s) {
  const t = s.trim();
  const q = t[0];
  if ((q === '"' || q === "'") && t.length > 1 && t[t.length - 1] === q) {
    return t.slice(1, -1).trim();
  }
  return t;
}

function unquote(v) {
  const joined = joinList(v);
  return typeof joined === "string" ? unwrap(joined) : joined;
}
function truthy(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}

/**
 * Silica theme customization — define or override a theme entirely in CSS.
 *
 *   @plugin "@wizeworks/silicaui/theme" {
 *     name: midnight;
 *     color-scheme: dark;
 *     default: true;        // apply at :root (make it the default theme)
 *     prefersdark: true;    // auto-apply when the OS prefers dark
 *     --color-primary: #7c3aed;
 *     --color-base-100: #0b1020;
 *     // …any Silica token: --radius-field, --size-field, --depth, etc.
 *   }
 *
 * Load it AFTER `@plugin "@wizeworks/silicaui"` so your values win by source
 * order. Partial overrides are fine — unspecified tokens fall through to the
 * built-in theme's values via the cascade. Any `--color-X` without a matching
 * `--color-X-content` gets an auto-derived legible foreground.
 */
export default plugin.withOptions((options = {}) => ({ addBase }) => {
  const name = unquote(options.name);
  const isDefault = truthy(options.default);
  const prefersDark = truthy(options.prefersdark);
  const colorScheme = unquote(options["color-scheme"]);

  // Collect the token overrides (every `--*` entry) plus optional color-scheme.
  const tokens = {};
  if (colorScheme) tokens.colorScheme = colorScheme;
  for (const [key, value] of Object.entries(options)) {
    if (key.startsWith("--")) tokens[key] = unquote(value);
  }

  // Derive a legible foreground for any color lacking an explicit one.
  //
  // A theme block is the one place where the VALUE is in hand: it arrives as the
  // option itself, a literal, right here. `auto-content.js` says in its own
  // comment that anything the build can see "should get a MEASURED foreground …
  // and never reach this fallback" — and until now this line handed it the
  // fallback anyway, because that is what the file exported.
  //
  // The substitution is deliberately NARROW. The measured ink replaces the CSS
  // rule only when the rule's pick is below AA *and* the ink it rejected is
  // better — the ~2.3% of the color space where a lightness threshold cannot be
  // right (docs/personas/issues/032). Everywhere else the emitted token is
  // byte-identical to what it has always been, so a theme somebody tuned by eye
  // does not move underneath them.
  const declaredColors = {};
  for (const key of Object.keys(tokens)) {
    const match = /^--color-(.+)$/.exec(key);
    if (!match || match[1].endsWith("-content")) continue;
    const role = match[1];
    declaredColors[role] = tokens[key];
    const contentKey = `--color-${role}-content`;
    if (contentKey in tokens) continue;

    const verdict = inkVerdict(tokens[key]);
    tokens[contentKey] =
      verdict && verdict.avoidable
        ? verdict.otherInk === "white"
          ? "oklch(100% 0 0)"
          : "oklch(0% 0 0)"
        : autoContent(`var(${key})`);
  }

  // Nothing is left to say about a FAILING ink here, and that is a result rather
  // than an omission: every failing pick has a better pure ink (black × white
  // contrast is exactly 21 against any color, so the better of the two never
  // drops below 4.58 — see `measure-ink.js`), and the loop above has already
  // taken it. Warning as well would describe a page that no longer exists.
  // `index.js` DOES warn, because it repairs nothing; see the note there.
  //
  // A value that is not a color at all is the exception, because nothing can
  // repair it: `--color-x: oklch(nonsense)` still emits every class for `x` and
  // paints a fill the browser discards.
  const where = name ? ` in theme "${name}"` : " in this theme block";
  warnInkProblems(findInkProblems(declaredColors).filter((f) => f.malformed), where);

  // The other side of that result: a `-content` the AUTHOR declared. The loop
  // above skips those roles entirely — correctly, nothing is being derived — so
  // until now the engine measured the ink it chose and accepted unexamined the
  // ink somebody chose by eye, which is the one more likely to be wrong.
  warnDeclaredContentProblems(findDeclaredContentProblems(tokens), where);

  // The failure the ink derivation cannot see at all: a role whose TEXT form
  // vanishes into the theme's own surface. All three values are literals in
  // this block, so it is measurable exactly here and nowhere else in the CSS
  // layer.
  const surface = tokens["--color-base-100"];
  const baseInk = tokens["--color-base-content"];
  if (surface && baseInk) {
    warnInkTextProblems(findInkTextProblems(declaredColors, surface, baseInk), surface, where);
  }

  if (Object.keys(tokens).length === 0) return;

  const rules = {};
  if (name) rules[`[data-theme="${name}"]`] = { ...tokens };
  if (isDefault) rules[":root"] = { ...tokens };
  if (prefersDark) {
    // Apply when the OS prefers dark AND no explicit theme is set.
    rules["@media (prefers-color-scheme: dark)"] = {
      ":root:not([data-theme])": { ...tokens },
    };
  }

  if (Object.keys(rules).length > 0) addBase(rules);
});
