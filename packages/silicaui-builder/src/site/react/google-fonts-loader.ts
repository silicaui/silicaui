/**
 * Editor-time Google Font preview — injects a <link> into document.head so the
 * live canvas + component board (no iframe, so this reaches the real page) show a
 * theme's webfonts immediately. Editor-only: published output must never hotlink
 * Google's CDN (see @wizeworks/silicaui-fonts' selfHostGoogleFonts for the
 * publish-time path).
 *
 * The load is driven off the ACTIVE THEME (`useThemeWebfonts`), not off the click
 * that picked a font. Those are different claims, and only the first one is true
 * of every way a theme arrives: the font picker, applying a preset or saved theme,
 * pasting theme CSS, a host-supplied theme at mount, crash-recovery restore, undo,
 * and a remote editor's op. Loading on the PICK covered exactly one of those, so
 * the other seven rendered `--font-head: "Syne", sans-serif` against a font that
 * was never fetched — the token was right, the specimen silently fell back to the
 * generic, and a heading font "didn't change" when you switched themes.
 */
import * as React from "react";
import type { Theme } from "@wizeworks/silicaui-html";
import { googleFontsCatalog } from "./google-fonts-catalog";

const LINK_ID_PREFIX = "silicaui-google-font-preview-";

function linkId(family: string): string {
  return LINK_ID_PREFIX + family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function loadGoogleFontPreview(family: string, weights: readonly number[]): void {
  if (typeof document === "undefined") return;
  const id = linkId(family);
  if (document.getElementById(id)) return; // already loaded this session
  const query = `family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weights.join(";")}&display=swap`;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${query}`;
  // A theme can name a face the editor then fails to fetch — offline, a blocked
  // CDN, a CSP that omits fonts.googleapis.com. The token still resolves, so the
  // canvas paints the generic fallback and looks merely "wrong" rather than broken.
  // Say so, on the affordance rather than at each call site. `error` on a
  // stylesheet link is the precise signal here; `document.fonts.check` is not — it
  // reports TRUE for a family with no matching @font-face at all (the spec treats
  // an unmatched family as an available system font).
  link.addEventListener("error", () => {
    console.warn(
      `[silicaui-builder] couldn't fetch the webfont "${family}" — the canvas and component board will ` +
        `paint a fallback face. Check network access to fonts.googleapis.com.`,
    );
  });
  document.head.appendChild(link);
}

/** Regular/semibold/bold when the family has them; else its first 3 weights.
 *  Shared with the theme editor's picker so a font loads with the same weights
 *  however it was chosen. */
export function pickWeights(available: readonly number[]): number[] {
  const desired = [400, 600, 700].filter((w) => available.includes(w));
  return desired.length ? desired : available.slice(0, 3);
}

const CATALOG_BY_FAMILY = new Map(googleFontsCatalog.map((f) => [f.family.toLowerCase(), f]));

/** CSS generic + `ui-*` system keywords — a stack leading with one names no
 *  installable family, so there's nothing to fetch and nothing to warn about. */
const GENERIC = new Set([
  "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "math",
  "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded",
  "inherit", "initial", "unset", "revert",
]);

/** Faces the shipped system stacks name on purpose, expecting the OS to supply
 *  them. Absent from the Google catalog by definition, so they'd otherwise trip
 *  the "can't source this" warning on every author who picks "Rounded". */
const SYSTEM_FACES = new Set(["sf pro rounded", "hiragino maru gothic pron", "segoe ui", "helvetica", "arial"]);

/** The first family a CSS font stack names, unquoted — or `""` when it leads with
 *  a generic keyword, a system face, or a `var()` (the "Match body" head pick is
 *  `var(--font-sans)`, which resolves to the body token already being handled). */
function leadFamily(stack: string): string {
  const first = (stack.split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "");
  const lower = first.toLowerCase();
  if (!first || first.startsWith("var(") || GENERIC.has(lower) || SYSTEM_FACES.has(lower)) return "";
  return first;
}

/** A family the editor should fetch so it can render the theme truthfully. */
export interface ThemeWebfont {
  family: string;
  weights: number[];
}

const FONT_TOKENS = [
  { key: "sans", cssVar: "--font-sans" },
  { key: "head", cssVar: "--font-head" },
] as const;

/**
 * Every Google family the active theme needs loaded, plus every family it names
 * that we can't source.
 *
 * `theme.fonts` is preferred — it's the unambiguous provenance record the picker
 * and the shipped presets both write, and it carries the exact weights. The raw
 * token is the fallback, which is what makes PASTED theme CSS work: `--font-head:
 * "Syne", sans-serif` with no `fonts.head` still resolves against the catalog.
 */
export function themeWebfonts(theme: Theme): { load: ThemeWebfont[]; unsourced: string[] } {
  const load: ThemeWebfont[] = [];
  const unsourced: string[] = [];
  const seen = new Set<string>();

  for (const { key, cssVar } of FONT_TOKENS) {
    const picked = theme.fonts?.[key];
    const family = picked?.source === "google" ? picked.family : leadFamily(theme.tokens[cssVar] ?? "");
    if (!family) continue;
    const lower = family.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);

    if (picked?.source === "google") {
      const weights = picked.weights?.length
        ? picked.weights
        : pickWeights(CATALOG_BY_FAMILY.get(lower)?.weights ?? [400, 700]);
      load.push({ family: picked.family, weights });
      continue;
    }
    const entry = CATALOG_BY_FAMILY.get(lower);
    if (entry) load.push({ family: entry.family, weights: pickWeights(entry.weights) });
    else unsourced.push(family);
  }
  return { load, unsourced };
}

/**
 * The `fonts` provenance record implied by a theme's raw font TOKENS.
 *
 * For a theme that arrived as CSS text there is no picker interaction to record,
 * so `fonts` would be empty — and `fonts` is precisely what the publish-time
 * self-hosting step (@wizeworks/silicaui-fonts' `selfHostGoogleFonts`) reads. The
 * editor already infers the family from the token to preview it; recording the
 * same inference keeps the published page from shipping `--font-head: "Fraunces"`
 * with no `@font-face` behind it. Preview and output have to agree about the font,
 * or the preview is a lie.
 *
 * Only catalog matches are recorded — a family we can't source stays unrecorded
 * rather than becoming a publish step that 404s.
 */
export function inferThemeFonts(tokens: Record<string, string>): Theme["fonts"] {
  const fonts: NonNullable<Theme["fonts"]> = {};
  for (const { key, cssVar } of FONT_TOKENS) {
    const family = leadFamily(tokens[cssVar] ?? "");
    const entry = family ? CATALOG_BY_FAMILY.get(family.toLowerCase()) : undefined;
    if (entry) fonts[key] = { family: entry.family, source: "google", weights: pickWeights(entry.weights) };
  }
  return Object.keys(fonts).length ? fonts : undefined;
}

/** Unsourceable families already reported, so switching back to a theme doesn't re-log. */
const warned = new Set<string>();

/**
 * Keep the document's preview `<link>`s in sync with the active theme's fonts.
 *
 * Mount this ONCE at the root of the editor and every path that can change the
 * theme is covered, because it watches the result rather than the cause.
 *
 * A family the theme names but no catalog entry matches is reported too — the
 * editor has nowhere to fetch it from, so it renders a fallback unless the author
 * happens to have it installed, and that's worth knowing before a screenshot.
 */
export function useThemeWebfonts(theme: Theme): void {
  const { load, unsourced } = themeWebfonts(theme);
  // Effects compare by identity, so key on the resolved plan's VALUE — otherwise
  // every unrelated token edit (a color swatch drag) re-runs this.
  const plan = JSON.stringify({ load, unsourced, name: theme.name });

  React.useEffect(() => {
    const { load: fonts, unsourced: missing, name } = JSON.parse(plan) as {
      load: ThemeWebfont[];
      unsourced: string[];
      name: string;
    };
    for (const f of fonts) loadGoogleFontPreview(f.family, f.weights);
    for (const family of missing) {
      if (warned.has(family)) continue;
      warned.add(family);
      console.warn(
        `[silicaui-builder] theme "${name}" names font family "${family}", which isn't in the Google Fonts ` +
          `catalog. The editor can't fetch it — text will render a fallback face unless it's installed locally.`,
      );
    }
  }, [plan]);
}
