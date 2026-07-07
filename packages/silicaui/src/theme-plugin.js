import plugin from "tailwindcss/plugin";
import { autoContent } from "./lib/auto-content.js";

function unquote(v) {
  return typeof v === "string" ? v.replace(/^["']|["']$/g, "").trim() : v;
}
function truthy(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}

/**
 * Silica theme customization — define or override a theme entirely in CSS.
 *
 *   @plugin "silicaui/theme" {
 *     name: midnight;
 *     color-scheme: dark;
 *     default: true;        // apply at :root (make it the default theme)
 *     prefersdark: true;    // auto-apply when the OS prefers dark
 *     --color-primary: #7c3aed;
 *     --color-base-100: #0b1020;
 *     // …any Silica token: --radius-field, --size-field, --depth, etc.
 *   }
 *
 * Load it AFTER `@plugin "silicaui"` so your values win by source
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

  // Auto-derive a legible foreground for any color lacking an explicit one.
  for (const key of Object.keys(tokens)) {
    const match = /^--color-(.+)$/.exec(key);
    if (match && !match[1].endsWith("-content")) {
      const contentKey = `--color-${match[1]}-content`;
      if (!(contentKey in tokens)) tokens[contentKey] = autoContent(`var(${key})`);
    }
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
