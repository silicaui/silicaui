/**
 * The canonical theme model — the shared source of truth for what colors a
 * @wizeworks/silicaui theme exposes, plus a small library of real, considered presets.
 *
 * This lives in @wizeworks/silicaui-html (framework-neutral, owns the `Theme` type) on
 * purpose: the theme EDITOR and the property panel's color controls must agree
 * on "what roles exist", and any consumer (the builder, sparx, a headless
 * pipeline) reads the same list. See `docs/silicaui-architecture.md` §5.
 *
 * Color model (matches @wizeworks/silicaui's `colors.js`): every theme has a neutral SURFACE
 * ramp (`base-100/200/300` + `base-content` ink) and a set of semantic ROLES
 * (`primary` … `error`), each optionally paired with a `-content` foreground. A
 * theme may add its own custom roles (`--color-brand`); `rolesOf` surfaces those
 * too, so tooling never hardcodes a closed list.
 */
import { AA_NORMAL, contrastRatio, deriveContent, parseColor } from "./contrast";
import type { Theme } from "./schema";

/** The neutral surface ramp + default ink, in paint order. */
export const SURFACE_TOKENS = ["base-100", "base-200", "base-300", "base-content"] as const;

/** The semantic roles that get component variants (`.btn-primary`, …) by default. */
export const SEMANTIC_ROLES = [
  "primary",
  "secondary",
  "accent",
  "neutral",
  "info",
  "success",
  "warning",
  "error",
] as const;

export type SurfaceToken = (typeof SURFACE_TOKENS)[number];
export type SemanticRole = (typeof SEMANTIC_ROLES)[number];

const CONTENT_RE = /-content$/;
const COLOR_TOKEN_RE = /^--color-(.+)$/;

/**
 * The role names a theme exposes — the canonical semantic roles PLUS any custom
 * `--color-X` the theme defines (excluding surfaces and `-content` foregrounds).
 * This is the list tooling should render, so a user-added `brand` color flows
 * through to the palette automatically.
 */
export function rolesOf(theme: Theme): string[] {
  const custom = Object.keys(theme.tokens)
    .map((k) => COLOR_TOKEN_RE.exec(k)?.[1])
    .filter(
      (n): n is string =>
        !!n &&
        !CONTENT_RE.test(n) &&
        !SURFACE_TOKENS.includes(n as SurfaceToken) &&
        !SEMANTIC_ROLES.includes(n as SemanticRole),
    );
  return [...SEMANTIC_ROLES, ...new Set(custom)];
}

/**
 * The effective value of a `--color-<name>` token for the given mode, following
 * the same resolution the canvas uses: a dark-mode delta wins over the base
 * token. Returns `undefined` if the theme doesn't define it (the component-level
 * `-content` fallback or the registered default then applies).
 */
export function colorValue(theme: Theme, name: string, mode: "light" | "dark" = "light"): string | undefined {
  const key = `--color-${name}`;
  if (mode === "dark" && theme.dark && key in theme.dark) return theme.dark[key];
  return theme.tokens[key];
}

/**
 * A theme's EFFECTIVE token map for one mode: the base tokens with the dark
 * delta merged over them, and a contrast-derived `--color-<role>-content` filled
 * in for every role that doesn't declare one.
 *
 * This is the seam every surface that PAINTS a theme should go through — the
 * canvas, a preview swatch, a publish pipeline. Deriving here rather than baking
 * `-content` into the stored `Theme` is deliberate:
 *
 *  - a stored pair goes STALE the moment the author edits the role color, and
 *    nothing in the schema records whether the pair was authored or derived, so
 *    a later "refresh" would have to guess whether it may overwrite;
 *  - a color invented at runtime gets the same treatment as a shipped one, with
 *    no separate path;
 *  - the `Theme` an author edits stays the small set of decisions they made.
 *
 * An explicitly authored `-content` always wins — this only FILLS gaps. A color
 * that can't be parsed (a `color-mix()`, a `var()`) is left alone: @wizeworks/
 * silicaui's CSS `autoContent` fallback still covers it at paint time, which is
 * the honest outcome for a value we can't measure.
 */
export function resolveThemeTokens(theme: Theme, mode: "light" | "dark" = "light"): Record<string, string> {
  const tokens: Record<string, string> = {
    ...theme.tokens,
    ...(mode === "dark" ? theme.dark : undefined),
  };

  for (const role of rolesOf(theme)) {
    const contentKey = `--color-${role}-content`;
    if (tokens[contentKey]) continue;
    const color = tokens[`--color-${role}`];
    if (!color) continue;
    const derived = deriveContent(color);
    if (derived) tokens[contentKey] = derived.value;
  }

  return tokens;
}

/**
 * Every role in `theme` whose foreground — authored or derived — fails WCAG AA
 * for body text, with the measured ratio. Empty is the healthy state.
 *
 * A theme editor surfaces this as a warning on the offending swatch; a publish
 * pipeline can treat it as a gate. It exists because "the best available ink"
 * and "a legible ink" are different claims, and a mid-tone high-chroma color can
 * fail both black and white — the author has to know that, not discover it from
 * a customer.
 */
export function contrastWarnings(
  theme: Theme,
  mode: "light" | "dark" = "light",
): { role: string; ratio: number }[] {
  const tokens = resolveThemeTokens(theme, mode);
  const out: { role: string; ratio: number }[] = [];
  for (const role of rolesOf(theme)) {
    const color = parseColor(tokens[`--color-${role}`] ?? "");
    const ink = parseColor(tokens[`--color-${role}-content`] ?? "");
    if (!color || !ink) continue;
    const ratio = +contrastRatio(color, ink).toFixed(2);
    if (ratio < AA_NORMAL) out.push({ role, ratio });
  }
  return out;
}

/**
 * Non-color design tokens a theme can carry, with their built-in defaults (from
 * `theme.js`). Editors read these to show a current/placeholder value and to
 * offer a reset; components already fall back to the same defaults via
 * `var(--token, default)`, so omitting one is safe.
 */
export const SCALAR_TOKENS = [
  { key: "--radius-selector", label: "Selector radius", group: "radius", default: "1rem", unit: "rem", min: 0, max: 2, step: 0.05, doc: "Corner radius for round selector controls (Radio, Checkbox, Switch, Toggle)." },
  { key: "--radius-field", label: "Field radius", group: "radius", default: "0.25rem", unit: "rem", min: 0, max: 2, step: 0.05, doc: "Corner radius for form fields — Input, Select, Textarea, Button, etc." },
  { key: "--radius-box", label: "Box radius", group: "radius", default: "0.5rem", unit: "rem", min: 0, max: 2, step: 0.05, doc: "Corner radius for box-tier surfaces — Card, Dialog, Popover, Dropdown, and similar containers." },
  { key: "--border", label: "Border width", group: "form", default: "1px", unit: "px", min: 0, max: 4, step: 0.5, doc: "Hairline border width shared by fields and box surfaces (Input, Card, etc.)." },
  { key: "--size-field", label: "Field size", group: "form", default: "0.25rem", unit: "rem", min: 0.15, max: 0.4, step: 0.01, doc: "Base unit fields scale their height/padding from — raising it enlarges Input/Select/Button uniformly." },
  { key: "--depth", label: "Depth", group: "effects", default: "1", unit: "", min: 0, max: 1, step: 1, doc: "Shadow intensity on Card (resting + hover-lift box-shadow) and Button (inset highlight + drop shadow on solid fills). Set to 0 for fully flat surfaces — no per-component shadow-none needed." },
  { key: "--noise", label: "Noise", group: "effects", default: "0", unit: "", min: 0, max: 1, step: 1, doc: "Reserved for a grain/noise surface texture. Not yet wired into any component's CSS — currently has no visible effect." },
  { key: "--focus-width", label: "Focus ring width", group: "effects", default: "2px", unit: "px", min: 0, max: 6, step: 0.5, doc: "Outline width of the keyboard focus ring across interactive components." },
  { key: "--disabled-opacity", label: "Disabled opacity", group: "effects", default: "0.5", unit: "", min: 0.2, max: 1, step: 0.05, doc: "Opacity applied to disabled controls." },
] as const;

// ── presets ──────────────────────────────────────────────────────────────────
// Real, hand-tuned palettes (OKLCH). Each shifts the brand/status HUES over a
// coherent neutral ramp; the dark delta flips the surfaces + ink while keeping
// the mid-tone role hues (which read on either surface).
//
// `-content` foregrounds are omitted here and filled by `resolveThemeTokens` at
// paint time, from MEASURED contrast. They used to be left to @wizeworks/
// silicaui's CSS `oklch(from …)` fallback, which compares lightness against a
// threshold instead — that picked white on seven role colors across these four
// presets where black would have passed WCAG AA and white did not. CSS cannot
// measure contrast; the resolver can, so the decision moved to where the
// measurement is possible. See `contrast.ts`.

function surfaces(l100: string, l200: string, l300: string, content: string): Record<string, string> {
  return {
    "--color-base-100": l100,
    "--color-base-200": l200,
    "--color-base-300": l300,
    "--color-base-content": content,
  };
}

function roles(r: Record<SemanticRole, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(r)) out[`--color-${k}`] = v;
  return out;
}

// A shared, sensible status set (info/success/warning/error) most presets reuse.
const STATUS = {
  info: "oklch(70% 0.16 232)",
  success: "oklch(72% 0.19 150)",
  warning: "oklch(80% 0.17 80)",
  error: "oklch(63% 0.24 25)",
};

const DARK_STATUS = {
  info: "oklch(72% 0.15 232)",
  success: "oklch(74% 0.18 150)",
  warning: "oklch(82% 0.16 80)",
  error: "oklch(68% 0.21 25)",
};

export const THEME_PRESETS: Theme[] = [
  {
    // The default. One cool-mineral hue family (Chalk/Flint/Slate/Obsidian, 250-255)
    // for structure, a single higher-chroma accent (Quartz, 211) reserved for
    // interaction, and the four semantic roles kept to their functional hues but
    // the same chroma discipline: Azurite/Malachite/Citrine/Garnet. Matches
    // @wizeworks/silicaui's `colors.js` LIGHT/DARK exactly — keep the two in sync.
    name: "quartz",
    mode: "light",
    tokens: {
      ...surfaces("oklch(98% 0.003 250)", "oklch(95% 0.004 250)", "oklch(90% 0.006 250)", "oklch(21% 0.012 255)"),
      ...roles({
        primary: "oklch(42% 0.055 252)",
        secondary: "oklch(55% 0.035 255)",
        accent: "oklch(64% 0.13 211)",
        neutral: "oklch(26% 0.014 255)",
        info: "oklch(68% 0.1 232)",
        success: "oklch(70% 0.12 150)",
        warning: "oklch(80% 0.11 85)",
        error: "oklch(58% 0.17 25)",
      }),
    },
    dark: {
      ...surfaces("oklch(16% 0.01 255)", "oklch(13.5% 0.01 255)", "oklch(11% 0.01 255)", "oklch(93% 0.006 250)"),
      "--color-primary": "oklch(72% 0.06 252)",
      "--color-secondary": "oklch(78% 0.035 255)",
      "--color-accent": "oklch(72% 0.13 211)",
      "--color-neutral": "oklch(32% 0.016 255)",
      "--color-info": "oklch(74% 0.09 232)",
      "--color-success": "oklch(75% 0.11 150)",
      "--color-warning": "oklch(83% 0.1 85)",
      "--color-error": "oklch(66% 0.18 25)",
    },
  },
  {
    name: "ocean",
    mode: "light",
    tokens: {
      ...surfaces("oklch(99% 0.006 230)", "oklch(96% 0.012 230)", "oklch(91% 0.02 230)", "oklch(28% 0.03 245)"),
      ...roles({
        primary: "oklch(58% 0.15 235)",
        secondary: "oklch(66% 0.13 200)",
        accent: "oklch(72% 0.14 190)",
        neutral: "oklch(38% 0.03 240)",
        ...STATUS,
      }),
    },
    dark: {
      ...surfaces("oklch(21% 0.02 245)", "oklch(19% 0.02 245)", "oklch(16% 0.02 245)", "oklch(91% 0.02 230)"),
      ...roles({ ...DARK_STATUS } as Record<SemanticRole, string>),
    },
  },
  {
    name: "grape",
    mode: "light",
    tokens: {
      ...surfaces("oklch(99% 0.004 300)", "oklch(97% 0.008 300)", "oklch(92% 0.014 300)", "oklch(26% 0.03 300)"),
      ...roles({
        primary: "oklch(56% 0.24 300)",
        secondary: "oklch(64% 0.2 340)",
        accent: "oklch(70% 0.17 200)",
        neutral: "oklch(34% 0.03 300)",
        ...STATUS,
      }),
    },
    dark: {
      ...surfaces("oklch(22% 0.02 300)", "oklch(20% 0.02 300)", "oklch(17% 0.02 300)", "oklch(92% 0.015 300)"),
      "--color-primary": "oklch(66% 0.22 300)",
      ...roles({ ...DARK_STATUS } as Record<SemanticRole, string>),
    },
  },
  {
    name: "sunset",
    mode: "light",
    tokens: {
      ...surfaces("oklch(99% 0.01 70)", "oklch(97% 0.016 70)", "oklch(92% 0.026 60)", "oklch(28% 0.04 40)"),
      ...roles({
        primary: "oklch(64% 0.2 45)",
        secondary: "oklch(60% 0.22 15)",
        accent: "oklch(75% 0.16 90)",
        neutral: "oklch(36% 0.03 45)",
        ...STATUS,
      }),
    },
    dark: {
      ...surfaces("oklch(22% 0.02 40)", "oklch(20% 0.02 40)", "oklch(17% 0.02 40)", "oklch(93% 0.02 60)"),
      "--color-primary": "oklch(70% 0.18 45)",
      ...roles({ ...DARK_STATUS } as Record<SemanticRole, string>),
    },
  },
];

/** Look up a preset by name (the value used as `[data-theme]`). */
export function presetByName(name: string): Theme | undefined {
  return THEME_PRESETS.find((t) => t.name === name);
}
