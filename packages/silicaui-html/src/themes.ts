/**
 * The canonical theme model — the shared source of truth for what colors a
 * silicaui theme exposes, plus a small library of real, considered presets.
 *
 * This lives in silicaui-html (framework-neutral, owns the `Theme` type) on
 * purpose: the theme EDITOR and the property panel's color controls must agree
 * on "what roles exist", and any consumer (the builder, sparx, a headless
 * pipeline) reads the same list. See `docs/silicaui-architecture.md` §5.
 *
 * Color model (matches silicaui's `colors.js`): every theme has a neutral SURFACE
 * ramp (`base-100/200/300` + `base-content` ink) and a set of semantic ROLES
 * (`primary` … `error`), each optionally paired with a `-content` foreground. A
 * theme may add its own custom roles (`--color-brand`); `rolesOf` surfaces those
 * too, so tooling never hardcodes a closed list.
 */
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
 * Non-color design tokens a theme can carry, with their built-in defaults (from
 * `theme.js`). Editors read these to show a current/placeholder value and to
 * offer a reset; components already fall back to the same defaults via
 * `var(--token, default)`, so omitting one is safe.
 */
export const SCALAR_TOKENS = [
  { key: "--radius-selector", label: "Selector radius", group: "radius", default: "1rem", unit: "rem", min: 0, max: 2, step: 0.05 },
  { key: "--radius-field", label: "Field radius", group: "radius", default: "0.25rem", unit: "rem", min: 0, max: 2, step: 0.05 },
  { key: "--radius-box", label: "Box radius", group: "radius", default: "0.5rem", unit: "rem", min: 0, max: 2, step: 0.05 },
  { key: "--border", label: "Border width", group: "form", default: "1px", unit: "px", min: 0, max: 4, step: 0.5 },
  { key: "--size-field", label: "Field size", group: "form", default: "0.25rem", unit: "rem", min: 0.15, max: 0.4, step: 0.01 },
  { key: "--depth", label: "Depth", group: "effects", default: "1", unit: "", min: 0, max: 1, step: 1 },
  { key: "--noise", label: "Noise", group: "effects", default: "0", unit: "", min: 0, max: 1, step: 1 },
  { key: "--focus-width", label: "Focus ring width", group: "effects", default: "2px", unit: "px", min: 0, max: 6, step: 0.5 },
  { key: "--disabled-opacity", label: "Disabled opacity", group: "effects", default: "0.5", unit: "", min: 0.2, max: 1, step: 0.05 },
] as const;

// ── presets ──────────────────────────────────────────────────────────────────
// Real, hand-tuned palettes (OKLCH). Each shifts the brand/status HUES over a
// coherent neutral ramp; the dark delta flips the surfaces + ink while keeping
// the mid-tone role hues (which read on either surface). `-content` foregrounds
// are intentionally omitted — silicaui components derive a legible one via
// `contentVar`'s `oklch(from …)` fallback, so presets stay compact and correct.

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
    name: "default",
    mode: "light",
    tokens: {
      ...surfaces("oklch(100% 0 0)", "oklch(97% 0 0)", "oklch(92% 0 0)", "oklch(25% 0.01 265)"),
      ...roles({
        primary: "oklch(55% 0.24 262)",
        secondary: "oklch(65% 0.22 330)",
        accent: "oklch(72% 0.19 195)",
        neutral: "oklch(32% 0.02 265)",
        ...STATUS,
      }),
    },
    dark: {
      ...surfaces("oklch(22% 0.01 265)", "oklch(20% 0.01 265)", "oklch(17% 0.01 265)", "oklch(92% 0.01 265)"),
      "--color-primary": "oklch(65% 0.22 262)",
      "--color-secondary": "oklch(70% 0.19 330)",
      "--color-accent": "oklch(75% 0.17 195)",
      ...roles({ ...DARK_STATUS } as Record<SemanticRole, string>),
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
      ...DARK_STATUS,
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
      ...DARK_STATUS,
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
      ...DARK_STATUS,
    },
  },
];

/** Look up a preset by name (the value used as `[data-theme]`). */
export function presetByName(name: string): Theme | undefined {
  return THEME_PRESETS.find((t) => t.name === name);
}
