/**
 * Theme operations for the Theme-mode surfaces — export-to-CSS and a tasteful
 * "randomize" that rerolls the brand hues over a coherent ramp. Framework-neutral;
 * operate on the `@wizeworks/silicaui-html` `Theme` model.
 */
import type { Theme } from "@wizeworks/silicaui-html";
import { SEMANTIC_ROLES } from "@wizeworks/silicaui-html";

/** Emit the theme as the same `[data-theme="name"]` block @wizeworks/silicaui's plugin uses. */
export function themeToCss(theme: Theme): string {
  const block = (sel: string, bag: Record<string, string>): string => {
    const decls = Object.entries(bag)
      .filter(([k]) => k.startsWith("--"))
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n");
    return `${sel} {\n${decls}\n}`;
  };
  const name = theme.name || "custom";
  const light = block(`[data-theme="${name}"]`, theme.tokens);
  if (!theme.dark || Object.keys(theme.dark).length === 0) return light;
  const dark = block(`[data-theme="${name}"]`, theme.dark)
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
  return `${light}\n\n@media (prefers-color-scheme: dark) {\n${dark}\n}`;
}

/**
 * Reroll the brand roles (primary/secondary/accent) around a fresh base hue while
 * keeping surfaces, neutral, and the status colors stable — random but legible.
 * Edits the ACTIVE mode's token bag. (Math.random is fine in the browser.)
 */
export function randomizePalette(theme: Theme): Theme {
  const h = Math.floor(Math.random() * 360);
  const brand: Record<string, string> = {
    "--color-primary": `oklch(58% 0.23 ${h})`,
    "--color-secondary": `oklch(66% 0.2 ${(h + 60) % 360})`,
    "--color-accent": `oklch(72% 0.18 ${(h + 180) % 360})`,
  };
  const next = structuredClone(theme);
  if (theme.mode === "dark") next.dark = { ...(next.dark ?? {}), ...brand };
  else next.tokens = { ...next.tokens, ...brand };
  return next;
}

/** Whether a role name is one @wizeworks/silicaui defines by default (vs. user-added). */
export function isCustomRole(name: string): boolean {
  return !(SEMANTIC_ROLES as readonly string[]).includes(name);
}

const MAX_THEME_CSS_LENGTH = 20_000; // real themes are 1-3KB; bounds regex worst-case cost
const MAX_DECLARATIONS = 300; // per block, sanity bound only

const NAME_CHARS_RE = /[^A-Za-z0-9 _-]/g;

/** Strip characters outside the safe theme-name charset (also used to sanitize the Name input). */
export function sanitizeThemeName(raw: string): string {
  return raw.replace(NAME_CHARS_RE, "").slice(0, 64);
}

// Mirrors exactly what `themeToCss` emits: one `[data-theme="NAME"] { --k: v; }`
// block, optionally followed by a same-named dark `@media` block. No `m`/`s`/`i`
// flags — `m` would break the whole-string `^...$` guarantee this parser's safety
// relies on, `i` would over-permit case variants of the at-rule keywords.
const BLOCK_RE =
  /^\s*\[data-theme="([^"\\]+)"\]\s*\{\s*([\s\S]*?)\s*\}\s*(?:@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)\s*\{\s*\[data-theme="\1"\]\s*\{\s*([\s\S]*?)\s*\}\s*\}\s*)?$/;
const DECL_RE = /^(--[a-z][a-z0-9-]*)\s*:\s*(.+);$/;
const VALUE_DENY_RE = /url\(|expression\(|import|[:@<>\\]/i;
const VALUE_CHARSET_RE = /^[a-zA-Z0-9%.,#()/'" -]+$/;

type ParseResult = { ok: true; decls: Record<string, string> } | { ok: false; reason: string };

function parseBlock(body: string): ParseResult {
  const decls: Record<string, string> = {};
  const lines = body.split("\n");
  if (lines.filter((l) => l.trim()).length > MAX_DECLARATIONS) {
    return { ok: false, reason: `Too many declarations in one block (max ${MAX_DECLARATIONS}).` };
  }
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = DECL_RE.exec(line);
    if (!m) return { ok: false, reason: `Not a valid declaration: \`${line}\`. Expected \`--token-name: value;\`.` };
    const [, key, value] = m;
    if (VALUE_DENY_RE.test(value!) || !VALUE_CHARSET_RE.test(value!)) {
      return { ok: false, reason: `\`${key}\`: this value contains a character that isn't allowed.` };
    }
    decls[key!] = value!.trim();
  }
  return { ok: true, decls };
}

export type CssToThemeResult =
  | { ok: true; name: string; tokens: Record<string, string>; dark: Record<string, string> }
  | { ok: false; reason: string };

/** The strict reverse of `themeToCss` — accepts ONLY what that function emits, never arbitrary CSS. */
export function cssToTheme(css: string): CssToThemeResult {
  if (css.length > MAX_THEME_CSS_LENGTH) {
    return { ok: false, reason: `This is too long to apply (max ${MAX_THEME_CSS_LENGTH} characters).` };
  }
  if (css.includes("/*")) {
    return { ok: false, reason: "Comments aren't supported here — remove any /* ... */." };
  }
  const m = BLOCK_RE.exec(css);
  if (!m) {
    return {
      ok: false,
      reason:
        "This doesn't look like theme CSS — it must be exactly what Copy produces (one [data-theme] block, optionally with a dark @media block).",
    };
  }
  const [, name, lightBody, darkBody] = m;
  if (!name || sanitizeThemeName(name) !== name) {
    return { ok: false, reason: "Theme name can only use letters, numbers, spaces, -, and _ (max 64 characters)." };
  }
  const light = parseBlock(lightBody ?? "");
  if (!light.ok) return light;
  if (darkBody === undefined) return { ok: true, name, tokens: light.decls, dark: {} };
  const dark = parseBlock(darkBody);
  if (!dark.ok) return dark;
  return { ok: true, name, tokens: light.decls, dark: dark.decls };
}
