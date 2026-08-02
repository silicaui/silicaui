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
 *
 * Scans the dark overrides as well as the base tokens: a role is a role no
 * matter which mode happens to declare it. Reading `tokens` alone made a color
 * added while the theme was in DARK mode invisible everywhere downstream — no
 * palette tile, no Inspector swatch, no generated utilities — even though the
 * token was really there and the color picker could still edit it.
 */
export function rolesOf(theme: Theme): string[] {
  const custom = [...Object.keys(theme.tokens), ...Object.keys(theme.dark ?? {})]
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
 *
 * "AUTHORED" IS PER MODE, and that distinction is the whole correctness of dark.
 * A theme that authors `--color-primary-content` in `tokens` and overrides only
 * `--color-primary` in `dark` — which is the normal shape, because the ink
 * usually needs no thought — used to keep the LIGHT ink in dark mode: the merge
 * carried it through, `tokens[contentKey]` was truthy, and derivation was
 * skipped. The result was white ink on the pale dark-mode primary, on every
 * filled surface in the theme, at roughly 1.7:1. It is the same fall-through
 * `defineTheme` already had to fix for surfaces, one layer up.
 *
 * So a light ink survives into dark only while it is still ABOUT something: if
 * the dark bag re-points the role's color, the light ink is stale by definition
 * and gets re-derived. If the role color is unchanged in dark, the authored ink
 * is still the author's measured decision and is left exactly alone.
 */
export function resolveThemeTokens(theme: Theme, mode: "light" | "dark" = "light"): Record<string, string> {
  const overrides = mode === "dark" ? theme.dark : undefined;
  const tokens: Record<string, string> = { ...theme.tokens, ...overrides };

  for (const role of rolesOf(theme)) {
    const contentKey = `--color-${role}-content`;
    const colorKey = `--color-${role}`;

    // Authored for THIS mode — always wins.
    if (overrides ? contentKey in overrides : contentKey in theme.tokens) continue;
    // Authored for light, and dark didn't move the role color: still valid.
    if (contentKey in theme.tokens && !(overrides && colorKey in overrides)) continue;

    const color = tokens[colorKey];
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
// Real, hand-tuned themes (OKLCH). Each is a complete look, not a hue swap: a
// palette, a type pairing, and a shape language (radii, line weight, depth). A
// preset that only moved the hues would give twenty variations of one design.
//
// `-content` foregrounds are omitted here and filled by `resolveThemeTokens` at
// paint time, from MEASURED contrast. They used to be left to @wizeworks/
// silicaui's CSS `oklch(from …)` fallback, which compares lightness against a
// threshold instead — that picked white on seven role colors across these
// presets where black would have passed WCAG AA and white did not. CSS cannot
// measure contrast; the resolver can, so the decision moved to where the
// measurement is possible. See `contrast.ts`.

/** One mode's complete palette: the surface ramp + its ink, and every semantic
 *  role. Both are REQUIRED in both modes — see `defineTheme`. */
interface Palette {
  /** `base-100`, `base-200`, `base-300`, `base-content`, in that order. */
  surfaces: [string, string, string, string];
  roles: Record<SemanticRole, string>;
}

/** A preset's shape language — the non-color tokens that decide whether it reads
 *  as sharp and technical or soft and friendly. Every key is optional; an omitted
 *  one inherits @wizeworks/silicaui's built-in default (see `SCALAR_TOKENS`), so a
 *  preset states only what it actually changes. */
interface Shape {
  /** `--radius-selector` — pills, chips, toggles, swatches. */
  selector?: string;
  /** `--radius-field` — inputs, buttons, selects. */
  field?: string;
  /** `--radius-box` — cards, dialogs, popovers. */
  box?: string;
  /** `--border` — the hairline weight shared by fields and boxes. */
  border?: string;
  /** `--depth` — shadow intensity. Binary: "1" lifts surfaces, "0" is fully flat. */
  depth?: "0" | "1";
}

/** A webfont pick, in exactly the form the theme editor's Google-catalog option
 *  produces: the CSS stack it writes to `--font-sans`/`--font-head`, and the
 *  weights it records on `Theme.fonts` for a host to self-host at publish time.
 *
 *  Held as a literal table below rather than read from the family catalog,
 *  because that catalog lives DOWNSTREAM in the builder — a preset in the schema
 *  package must not reach forward for it. `verify-theme-presets.mjs` checks each row
 *  against the real catalog so the two cannot drift. */
interface Face {
  family: string;
  stack: string;
  weights: number[];
}

const face = (family: string, generic: string, weights: number[]): Face => ({
  family,
  stack: `"${family}", ${generic}`,
  weights,
});

/** The faces these presets draw on. */
const FACE = {
  archivo: face("Archivo", "sans-serif", [400, 600, 700]),
  bitter: face("Bitter", "serif", [400, 600, 700]),
  cormorant: face("Cormorant Garamond", "serif", [400, 600, 700]),
  epilogue: face("Epilogue", "sans-serif", [400, 600, 700]),
  fraunces: face("Fraunces", "serif", [400, 600, 700]),
  ibmPlexSans: face("IBM Plex Sans", "sans-serif", [400, 600, 700]),
  inter: face("Inter", "sans-serif", [400, 600, 700]),
  karla: face("Karla", "sans-serif", [400, 600, 700]),
  libreBaskerville: face("Libre Baskerville", "serif", [400, 600, 700]),
  manrope: face("Manrope", "sans-serif", [400, 600, 700]),
  nunito: face("Nunito", "sans-serif", [400, 600, 700]),
  outfit: face("Outfit", "sans-serif", [400, 600, 700]),
  playfair: face("Playfair Display", "serif", [400, 600, 700]),
  poppins: face("Poppins", "sans-serif", [400, 600, 700]),
  sora: face("Sora", "sans-serif", [400, 600, 700]),
  sourceSans3: face("Source Sans 3", "sans-serif", [400, 600, 700]),
  spaceGrotesk: face("Space Grotesk", "sans-serif", [400, 600, 700]),
  spectral: face("Spectral", "serif", [400, 600, 700]),
  syne: face("Syne", "sans-serif", [400, 600, 700]),
  workSans: face("Work Sans", "sans-serif", [400, 600, 700]),
} satisfies Record<string, Face>;

interface PresetSpec {
  /** The `[data-theme]` value. Stored on every site that adopts it — renaming one
   *  orphans those sites, so these names are effectively permanent. */
  name: string;
  light: Palette;
  dark: Palette;
  shape?: Shape;
  /** Body face, and the heading face when it differs. Omit entirely to inherit
   *  @wizeworks/silicaui's default UI stack (what `quartz` does, deliberately). */
  type?: { body: Face; head?: Face };
}

/**
 * Assemble a preset into a `Theme`.
 *
 * The signature is the point: `dark` is a full `Palette`, not a partial override
 * bag. Presets used to spread whatever dark tokens felt necessary, and three of
 * the four shipped ones quietly stopped short — `ocean` never restated its brand
 * roles at all, `grape` and `sunset` restated only `primary`. Every unstated role
 * fell THROUGH to the light value, so `ocean` in dark mode painted a 38%-lightness
 * neutral fill onto a 21% surface and called it a theme. Requiring the whole
 * palette makes that a type error instead of something you notice in a screenshot.
 */
function defineTheme(spec: PresetSpec): Theme {
  const [l100, l200, l300, lInk] = spec.light.surfaces;
  const [d100, d200, d300, dInk] = spec.dark.surfaces;

  const tokens: Record<string, string> = {
    ...surfaces(l100, l200, l300, lInk),
    ...roles(spec.light.roles),
    ...shapeTokens(spec.shape),
  };

  const fonts: Theme["fonts"] = {};
  if (spec.type) {
    tokens["--font-sans"] = spec.type.body.stack;
    fonts.sans = { family: spec.type.body.family, source: "google", weights: spec.type.body.weights };
    // A heading face is optional: omitted, headings inherit `--font-sans`, which
    // is @wizeworks/silicaui's own fallback — no token needed to say so.
    if (spec.type.head) {
      tokens["--font-head"] = spec.type.head.stack;
      fonts.head = { family: spec.type.head.family, source: "google", weights: spec.type.head.weights };
    }
  }

  return {
    name: spec.name,
    mode: "light",
    tokens,
    // Shape and type are mode-independent, so they live only in `tokens`;
    // `resolveThemeTokens` merges the two bags and carries them into dark.
    dark: { ...surfaces(d100, d200, d300, dInk), ...roles(spec.dark.roles) },
    ...(Object.keys(fonts).length ? { fonts } : {}),
  };
}

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

function shapeTokens(shape: Shape | undefined): Record<string, string> {
  if (!shape) return {};
  const out: Record<string, string> = {};
  if (shape.selector) out["--radius-selector"] = shape.selector;
  if (shape.field) out["--radius-field"] = shape.field;
  if (shape.box) out["--radius-box"] = shape.box;
  if (shape.border) out["--border"] = shape.border;
  if (shape.depth) out["--depth"] = shape.depth;
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

// Most presets want a status set pitched to their own surfaces rather than the
// shared one — deeper in light so white ink clears AA, brighter in dark. These
// two are the house baseline for a preset that has no reason to differ.
const STATUS_DEEP = {
  info: "oklch(52% 0.13 232)",
  success: "oklch(48% 0.13 150)",
  warning: "oklch(76% 0.14 80)",
  error: "oklch(52% 0.19 25)",
};

const STATUS_BRIGHT = {
  info: "oklch(76% 0.11 232)",
  success: "oklch(76% 0.13 150)",
  warning: "oklch(84% 0.13 80)",
  error: "oklch(70% 0.17 25)",
};

export const THEME_PRESETS: Theme[] = [
  defineTheme({
    // The default, and the only preset that states no type or shape: it is the
    // house baseline, so it renders in @wizeworks/silicaui's own stack at
    // @wizeworks/silicaui's own radii. One cool-mineral hue family
    // (Chalk/Flint/Slate/Obsidian, 250-255) for structure, a single higher-chroma
    // accent (Quartz, 211) reserved for interaction, and the four semantic roles
    // kept to their functional hues but the same chroma discipline:
    // Azurite/Malachite/Citrine/Garnet. Matches @wizeworks/silicaui's `colors.js`
    // LIGHT/DARK exactly — keep the two in sync.
    name: "quartz",
    light: {
      surfaces: ["oklch(98% 0.003 250)", "oklch(95% 0.004 250)", "oklch(90% 0.006 250)", "oklch(21% 0.012 255)"],
      roles: {
        primary: "oklch(42% 0.055 252)",
        secondary: "oklch(55% 0.035 255)",
        accent: "oklch(64% 0.13 211)",
        neutral: "oklch(26% 0.014 255)",
        info: "oklch(68% 0.1 232)",
        success: "oklch(70% 0.12 150)",
        warning: "oklch(80% 0.11 85)",
        error: "oklch(58% 0.17 25)",
      },
    },
    dark: {
      surfaces: ["oklch(16% 0.01 255)", "oklch(13.5% 0.01 255)", "oklch(11% 0.01 255)", "oklch(93% 0.006 250)"],
      roles: {
        primary: "oklch(72% 0.06 252)",
        secondary: "oklch(78% 0.035 255)",
        accent: "oklch(72% 0.13 211)",
        neutral: "oklch(32% 0.016 255)",
        info: "oklch(74% 0.09 232)",
        success: "oklch(75% 0.11 150)",
        warning: "oklch(83% 0.1 85)",
        error: "oklch(66% 0.18 25)",
      },
    },
  }),

  defineTheme({
    // Marine blues over a faintly cool white. Soft edges, humanist sans — the
    // approachable end of professional.
    name: "ocean",
    type: { body: FACE.inter, head: FACE.sora },
    shape: { selector: "1rem", field: "0.5rem", box: "0.75rem", depth: "1" },
    light: {
      surfaces: ["oklch(99% 0.006 230)", "oklch(96% 0.012 230)", "oklch(91% 0.02 230)", "oklch(28% 0.03 245)"],
      roles: {
        primary: "oklch(58% 0.15 235)",
        secondary: "oklch(66% 0.13 200)",
        accent: "oklch(72% 0.14 190)",
        neutral: "oklch(38% 0.03 240)",
        ...STATUS,
      },
    },
    dark: {
      // Was surfaces + status only. The four brand roles are new: without them
      // `neutral` stayed at its 38% light value on a 21% surface — a fill you
      // could barely tell from the card behind it.
      surfaces: ["oklch(21% 0.02 245)", "oklch(19% 0.02 245)", "oklch(16% 0.02 245)", "oklch(91% 0.02 230)"],
      roles: {
        primary: "oklch(76% 0.12 235)",
        secondary: "oklch(80% 0.1 200)",
        accent: "oklch(84% 0.12 190)",
        neutral: "oklch(38% 0.028 240)",
        ...DARK_STATUS,
      },
    },
  }),

  defineTheme({
    // Saturated violet into magenta, on a barely-tinted lilac white. Geometric
    // sans, generous corners — confident and a little loud.
    name: "grape",
    type: { body: FACE.inter, head: FACE.outfit },
    shape: { selector: "1rem", field: "0.625rem", box: "1rem", depth: "1" },
    light: {
      surfaces: ["oklch(99% 0.004 300)", "oklch(97% 0.008 300)", "oklch(92% 0.014 300)", "oklch(26% 0.03 300)"],
      roles: {
        primary: "oklch(56% 0.24 300)",
        secondary: "oklch(64% 0.2 340)",
        accent: "oklch(70% 0.17 200)",
        neutral: "oklch(34% 0.03 300)",
        ...STATUS,
      },
    },
    dark: {
      // `primary` was the only brand role restated here; the other three are new.
      surfaces: ["oklch(22% 0.02 300)", "oklch(20% 0.02 300)", "oklch(17% 0.02 300)", "oklch(92% 0.015 300)"],
      roles: {
        primary: "oklch(66% 0.22 300)",
        secondary: "oklch(76% 0.17 340)",
        accent: "oklch(82% 0.13 200)",
        neutral: "oklch(39% 0.028 300)",
        ...DARK_STATUS,
      },
    },
  }),

  defineTheme({
    // Late-afternoon warmth: orange into red, gold as the highlight, on cream.
    // Serif headings over a soft workhorse sans.
    name: "sunset",
    type: { body: FACE.workSans, head: FACE.fraunces },
    shape: { selector: "1rem", field: "0.5rem", box: "0.75rem", depth: "1" },
    light: {
      surfaces: ["oklch(99% 0.01 70)", "oklch(97% 0.016 70)", "oklch(92% 0.026 60)", "oklch(28% 0.04 40)"],
      roles: {
        primary: "oklch(64% 0.2 45)",
        secondary: "oklch(60% 0.22 15)",
        accent: "oklch(75% 0.16 90)",
        neutral: "oklch(36% 0.03 45)",
        ...STATUS,
      },
    },
    dark: {
      // `primary` was the only brand role restated here; the other three are new.
      surfaces: ["oklch(22% 0.02 40)", "oklch(20% 0.02 40)", "oklch(17% 0.02 40)", "oklch(93% 0.02 60)"],
      roles: {
        primary: "oklch(70% 0.18 45)",
        secondary: "oklch(72% 0.18 15)",
        accent: "oklch(84% 0.14 90)",
        neutral: "oklch(38% 0.028 45)",
        ...DARK_STATUS,
      },
    },
  }),

  defineTheme({
    // Near-monochrome charcoal with one electric cyan reserved for interaction.
    // Square corners, no depth, a technical grotesk — reads like tooling.
    name: "obsidian",
    type: { body: FACE.inter, head: FACE.spaceGrotesk },
    shape: { selector: "0.25rem", field: "0.125rem", box: "0.25rem", depth: "0" },
    light: {
      surfaces: ["oklch(97% 0.002 250)", "oklch(94% 0.003 250)", "oklch(88% 0.005 250)", "oklch(18% 0.008 250)"],
      roles: {
        primary: "oklch(30% 0.02 250)",
        secondary: "oklch(46% 0.015 250)",
        accent: "oklch(52% 0.12 210)",
        neutral: "oklch(22% 0.01 250)",
        ...STATUS_DEEP,
      },
    },
    dark: {
      // The primary inverts to near-white — on a black surface the confident
      // control is the one painted in paper, not in another shade of grey.
      surfaces: ["oklch(14% 0.006 250)", "oklch(11% 0.006 250)", "oklch(8% 0.006 250)", "oklch(94% 0.004 250)"],
      roles: {
        primary: "oklch(88% 0.02 250)",
        secondary: "oklch(66% 0.015 250)",
        accent: "oklch(80% 0.12 210)",
        neutral: "oklch(30% 0.012 250)",
        ...STATUS_BRIGHT,
      },
    },
  }),

  defineTheme({
    // Cool white and slate with an antique-brass accent. High-contrast serif
    // headings, hairline borders, flat surfaces — classical and unhurried.
    name: "marble",
    type: { body: FACE.inter, head: FACE.cormorant },
    shape: { selector: "0.125rem", field: "0.125rem", box: "0.125rem", depth: "0" },
    light: {
      surfaces: ["oklch(99% 0.002 260)", "oklch(97% 0.003 260)", "oklch(92% 0.005 260)", "oklch(20% 0.01 260)"],
      roles: {
        primary: "oklch(34% 0.04 265)",
        secondary: "oklch(48% 0.05 250)",
        accent: "oklch(50% 0.08 75)",
        neutral: "oklch(24% 0.008 260)",
        ...STATUS_DEEP,
      },
    },
    dark: {
      surfaces: ["oklch(17% 0.006 260)", "oklch(14% 0.006 260)", "oklch(11% 0.006 260)", "oklch(93% 0.004 260)"],
      roles: {
        primary: "oklch(78% 0.05 265)",
        secondary: "oklch(72% 0.05 250)",
        accent: "oklch(80% 0.09 75)",
        neutral: "oklch(32% 0.01 260)",
        ...STATUS_BRIGHT,
      },
    },
  }),

  defineTheme({
    // Oxidized metal: copper against the patina it turns into. Warm neutral
    // surfaces, moderate radii, lifted cards.
    name: "copper",
    type: { body: FACE.workSans, head: FACE.spaceGrotesk },
    shape: { selector: "0.5rem", field: "0.25rem", box: "0.375rem", depth: "1" },
    light: {
      surfaces: ["oklch(98% 0.008 60)", "oklch(96% 0.012 60)", "oklch(91% 0.02 55)", "oklch(24% 0.025 45)"],
      roles: {
        primary: "oklch(48% 0.12 45)",
        secondary: "oklch(42% 0.07 200)",
        accent: "oklch(52% 0.1 190)",
        neutral: "oklch(30% 0.02 45)",
        ...STATUS_DEEP,
      },
    },
    dark: {
      surfaces: ["oklch(19% 0.015 45)", "oklch(16% 0.015 45)", "oklch(13% 0.015 45)", "oklch(93% 0.012 55)"],
      roles: {
        primary: "oklch(76% 0.12 45)",
        secondary: "oklch(76% 0.08 200)",
        accent: "oklch(80% 0.1 190)",
        neutral: "oklch(35% 0.022 45)",
        ...STATUS_BRIGHT,
      },
    },
  }),

  defineTheme({
    // Deep jade with gold. Old-world serif headings on a compact grotesk body —
    // heritage without the costume.
    name: "jade",
    type: { body: FACE.karla, head: FACE.cormorant },
    shape: { selector: "1rem", field: "0.375rem", box: "0.5rem", depth: "1" },
    light: {
      surfaces: ["oklch(99% 0.006 145)", "oklch(96% 0.01 145)", "oklch(91% 0.018 145)", "oklch(22% 0.025 155)"],
      roles: {
        primary: "oklch(38% 0.1 160)",
        secondary: "oklch(46% 0.07 175)",
        accent: "oklch(78% 0.13 85)",
        neutral: "oklch(26% 0.02 155)",
        ...STATUS_DEEP,
        success: "oklch(50% 0.14 148)",
      },
    },
    dark: {
      surfaces: ["oklch(17% 0.012 155)", "oklch(14% 0.012 155)", "oklch(11% 0.012 155)", "oklch(93% 0.01 145)"],
      roles: {
        primary: "oklch(74% 0.12 160)",
        secondary: "oklch(78% 0.08 175)",
        accent: "oklch(84% 0.13 85)",
        neutral: "oklch(32% 0.022 155)",
        ...STATUS_BRIGHT,
        success: "oklch(76% 0.13 148)",
      },
    },
  }),

  defineTheme({
    // One saturated blue carrying the whole design. Neutral-cool surfaces, a
    // single geometric sans throughout — corporate in the good sense.
    name: "cobalt",
    type: { body: FACE.manrope },
    shape: { selector: "1rem", field: "0.375rem", box: "0.5rem", depth: "1" },
    light: {
      surfaces: ["oklch(99% 0.004 250)", "oklch(97% 0.008 250)", "oklch(92% 0.014 250)", "oklch(22% 0.025 255)"],
      roles: {
        primary: "oklch(48% 0.2 260)",
        secondary: "oklch(48% 0.13 230)",
        accent: "oklch(74% 0.13 200)",
        neutral: "oklch(28% 0.02 255)",
        ...STATUS_DEEP,
      },
    },
    dark: {
      surfaces: ["oklch(18% 0.015 255)", "oklch(15% 0.015 255)", "oklch(12% 0.015 255)", "oklch(93% 0.008 250)"],
      roles: {
        primary: "oklch(72% 0.17 260)",
        secondary: "oklch(78% 0.11 230)",
        accent: "oklch(84% 0.12 200)",
        neutral: "oklch(34% 0.022 255)",
        ...STATUS_BRIGHT,
      },
    },
  }),

  defineTheme({
    // Dusty rose and mauve with a peach highlight. Display serif over a rounded
    // sans, wide radii, lifted cards — warm and editorial.
    name: "rose",
    type: { body: FACE.nunito, head: FACE.playfair },
    shape: { selector: "1rem", field: "0.625rem", box: "1rem", depth: "1" },
    light: {
      surfaces: ["oklch(99% 0.006 15)", "oklch(97% 0.012 15)", "oklch(92% 0.022 10)", "oklch(24% 0.03 10)"],
      roles: {
        primary: "oklch(48% 0.13 355)",
        secondary: "oklch(46% 0.1 340)",
        accent: "oklch(78% 0.12 45)",
        neutral: "oklch(30% 0.025 10)",
        ...STATUS_DEEP,
      },
    },
    dark: {
      surfaces: ["oklch(19% 0.015 10)", "oklch(16% 0.015 10)", "oklch(13% 0.015 10)", "oklch(93% 0.012 15)"],
      roles: {
        primary: "oklch(76% 0.13 355)",
        secondary: "oklch(76% 0.1 340)",
        accent: "oklch(85% 0.1 45)",
        neutral: "oklch(35% 0.022 10)",
        ...STATUS_BRIGHT,
      },
    },
  }),

  defineTheme({
    // Honey and gold on cream. Slab-ish serif headings over a workhorse text
    // face — the palette of a good paperback.
    name: "amber",
    type: { body: FACE.sourceSans3, head: FACE.bitter },
    shape: { selector: "1rem", field: "0.375rem", box: "0.5rem", depth: "1" },
    light: {
      surfaces: ["oklch(98% 0.014 85)", "oklch(96% 0.022 85)", "oklch(91% 0.035 80)", "oklch(25% 0.035 65)"],
      roles: {
        primary: "oklch(50% 0.12 70)",
        secondary: "oklch(44% 0.09 45)",
        accent: "oklch(80% 0.15 90)",
        neutral: "oklch(30% 0.025 70)",
        ...STATUS_DEEP,
        warning: "oklch(74% 0.15 55)",
      },
    },
    dark: {
      surfaces: ["oklch(19% 0.018 70)", "oklch(16% 0.018 70)", "oklch(13% 0.018 70)", "oklch(93% 0.018 85)"],
      roles: {
        primary: "oklch(78% 0.13 70)",
        secondary: "oklch(74% 0.1 45)",
        accent: "oklch(87% 0.14 90)",
        neutral: "oklch(35% 0.025 70)",
        ...STATUS_BRIGHT,
        warning: "oklch(80% 0.14 55)",
      },
    },
  }),

  defineTheme({
    // Fresh growing green with a lime highlight. One friendly geometric sans,
    // generous corners — bright without being juvenile.
    name: "fern",
    type: { body: FACE.outfit },
    shape: { selector: "1rem", field: "0.5rem", box: "0.75rem", depth: "1" },
    light: {
      surfaces: ["oklch(99% 0.008 140)", "oklch(97% 0.014 140)", "oklch(92% 0.024 140)", "oklch(23% 0.03 150)"],
      roles: {
        primary: "oklch(48% 0.15 135)",
        secondary: "oklch(46% 0.1 175)",
        accent: "oklch(78% 0.16 110)",
        neutral: "oklch(28% 0.025 150)",
        ...STATUS_DEEP,
        success: "oklch(48% 0.13 158)",
      },
    },
    dark: {
      surfaces: ["oklch(18% 0.014 150)", "oklch(15% 0.014 150)", "oklch(12% 0.014 150)", "oklch(93% 0.012 140)"],
      roles: {
        primary: "oklch(78% 0.16 135)",
        secondary: "oklch(76% 0.1 175)",
        accent: "oklch(86% 0.16 110)",
        neutral: "oklch(34% 0.025 150)",
        ...STATUS_BRIGHT,
        success: "oklch(74% 0.13 158)",
      },
    },
  }),

  defineTheme({
    // Sand, clay and shade. Warm greyed surfaces, terracotta highlight, flat —
    // the quietest theme in the set, and the one that ages best.
    name: "dune",
    type: { body: FACE.workSans, head: FACE.fraunces },
    shape: { selector: "0.5rem", field: "0.375rem", box: "0.375rem", depth: "0" },
    light: {
      surfaces: ["oklch(97% 0.012 80)", "oklch(95% 0.018 80)", "oklch(89% 0.028 75)", "oklch(24% 0.025 60)"],
      roles: {
        primary: "oklch(42% 0.06 60)",
        secondary: "oklch(48% 0.05 90)",
        accent: "oklch(52% 0.12 40)",
        neutral: "oklch(28% 0.02 60)",
        ...STATUS_DEEP,
      },
    },
    dark: {
      surfaces: ["oklch(19% 0.014 60)", "oklch(16% 0.014 60)", "oklch(13% 0.014 60)", "oklch(92% 0.014 80)"],
      roles: {
        primary: "oklch(78% 0.07 60)",
        secondary: "oklch(76% 0.05 90)",
        accent: "oklch(78% 0.12 40)",
        neutral: "oklch(34% 0.02 60)",
        ...STATUS_BRIGHT,
      },
    },
  }),

  defineTheme({
    // Wine-dark purple with champagne. Bookish serif headings, tight radii, no
    // depth — restrained luxury rather than the shiny kind.
    name: "plum",
    type: { body: FACE.inter, head: FACE.libreBaskerville },
    shape: { selector: "0.5rem", field: "0.25rem", box: "0.25rem", depth: "0" },
    light: {
      surfaces: ["oklch(98% 0.006 330)", "oklch(96% 0.01 330)", "oklch(91% 0.018 330)", "oklch(22% 0.03 330)"],
      roles: {
        primary: "oklch(38% 0.14 340)",
        secondary: "oklch(44% 0.1 300)",
        accent: "oklch(78% 0.12 85)",
        neutral: "oklch(26% 0.025 330)",
        ...STATUS_DEEP,
        warning: "oklch(74% 0.15 60)",
      },
    },
    dark: {
      surfaces: ["oklch(17% 0.015 330)", "oklch(14% 0.015 330)", "oklch(11% 0.015 330)", "oklch(93% 0.012 330)"],
      roles: {
        primary: "oklch(74% 0.15 340)",
        secondary: "oklch(76% 0.11 300)",
        accent: "oklch(86% 0.11 85)",
        neutral: "oklch(32% 0.025 330)",
        ...STATUS_BRIGHT,
        warning: "oklch(82% 0.14 60)",
      },
    },
  }),

  defineTheme({
    // Almost-white with the faintest blue in it. Low chroma throughout, soft
    // corners, flat — the theme to pick when the content is the design.
    name: "frost",
    type: { body: FACE.inter, head: FACE.sora },
    shape: { selector: "1rem", field: "0.5rem", box: "0.75rem", depth: "0" },
    light: {
      surfaces: ["oklch(99.5% 0.003 220)", "oklch(98% 0.006 220)", "oklch(93% 0.012 215)", "oklch(26% 0.02 230)"],
      roles: {
        primary: "oklch(50% 0.1 220)",
        secondary: "oklch(52% 0.07 205)",
        accent: "oklch(76% 0.1 195)",
        neutral: "oklch(30% 0.015 230)",
        ...STATUS_DEEP,
      },
    },
    dark: {
      surfaces: ["oklch(20% 0.012 230)", "oklch(17% 0.012 230)", "oklch(14% 0.012 230)", "oklch(94% 0.006 220)"],
      roles: {
        primary: "oklch(80% 0.09 220)",
        secondary: "oklch(76% 0.07 205)",
        accent: "oklch(86% 0.1 195)",
        neutral: "oklch(36% 0.015 230)",
        ...STATUS_BRIGHT,
      },
    },
  }),

  defineTheme({
    // Achromatic black and white with one safety orange. Double-weight borders,
    // square corners, zero depth — structure drawn in line, not in shadow.
    name: "carbon",
    type: { body: FACE.ibmPlexSans, head: FACE.archivo },
    shape: { selector: "0.125rem", field: "0.125rem", box: "0.125rem", border: "2px", depth: "0" },
    light: {
      surfaces: ["oklch(97% 0 0)", "oklch(94% 0 0)", "oklch(88% 0 0)", "oklch(16% 0 0)"],
      roles: {
        primary: "oklch(20% 0 0)",
        secondary: "oklch(44% 0 0)",
        accent: "oklch(54% 0.21 40)",
        neutral: "oklch(16% 0 0)",
        ...STATUS_DEEP,
        warning: "oklch(72% 0.17 65)",
      },
    },
    dark: {
      surfaces: ["oklch(13% 0 0)", "oklch(10% 0 0)", "oklch(7% 0 0)", "oklch(95% 0 0)"],
      roles: {
        primary: "oklch(93% 0 0)",
        secondary: "oklch(62% 0 0)",
        accent: "oklch(74% 0.18 40)",
        neutral: "oklch(28% 0 0)",
        ...STATUS_BRIGHT,
        warning: "oklch(82% 0.15 65)",
      },
    },
  }),

  defineTheme({
    // Turquoise water with a spring-green highlight. The roundest theme in the
    // set — pill selectors, big boxes, lifted cards.
    name: "lagoon",
    type: { body: FACE.poppins },
    shape: { selector: "2rem", field: "0.75rem", box: "1.25rem", depth: "1" },
    light: {
      surfaces: ["oklch(99% 0.01 195)", "oklch(97% 0.016 195)", "oklch(92% 0.028 190)", "oklch(24% 0.03 200)"],
      roles: {
        primary: "oklch(50% 0.13 195)",
        secondary: "oklch(48% 0.12 230)",
        accent: "oklch(78% 0.16 130)",
        neutral: "oklch(28% 0.025 200)",
        ...STATUS_DEEP,
        success: "oklch(48% 0.13 160)",
      },
    },
    dark: {
      surfaces: ["oklch(19% 0.018 200)", "oklch(16% 0.018 200)", "oklch(13% 0.018 200)", "oklch(93% 0.014 195)"],
      roles: {
        primary: "oklch(80% 0.12 195)",
        secondary: "oklch(76% 0.11 230)",
        accent: "oklch(87% 0.15 130)",
        neutral: "oklch(34% 0.025 200)",
        ...STATUS_BRIGHT,
        success: "oklch(76% 0.13 160)",
      },
    },
  }),

  defineTheme({
    // Terracotta and sage on warm paper — the palette of a good ceramics shop.
    // Rounded, lifted, unfussy.
    name: "clay",
    type: { body: FACE.karla, head: FACE.epilogue },
    shape: { selector: "1rem", field: "0.5rem", box: "0.75rem", depth: "1" },
    light: {
      surfaces: ["oklch(98% 0.012 45)", "oklch(96% 0.02 45)", "oklch(90% 0.032 40)", "oklch(24% 0.03 35)"],
      roles: {
        primary: "oklch(48% 0.13 40)",
        secondary: "oklch(44% 0.08 140)",
        accent: "oklch(76% 0.12 70)",
        neutral: "oklch(28% 0.025 35)",
        ...STATUS_DEEP,
        error: "oklch(50% 0.2 27)",
      },
    },
    dark: {
      surfaces: ["oklch(19% 0.016 35)", "oklch(16% 0.016 35)", "oklch(13% 0.016 35)", "oklch(93% 0.014 45)"],
      roles: {
        primary: "oklch(78% 0.12 40)",
        secondary: "oklch(74% 0.08 140)",
        accent: "oklch(84% 0.11 70)",
        neutral: "oklch(34% 0.025 35)",
        ...STATUS_BRIGHT,
        error: "oklch(70% 0.18 27)",
      },
    },
  }),

  defineTheme({
    // Navy and gilt. The light mode is tinted deep blue rather than white, so the
    // theme keeps its identity in both — formal, printed, evening.
    name: "midnight",
    type: { body: FACE.inter, head: FACE.spectral },
    shape: { selector: "0.25rem", field: "0.25rem", box: "0.25rem", depth: "0" },
    light: {
      surfaces: ["oklch(98% 0.006 265)", "oklch(95% 0.012 265)", "oklch(90% 0.02 265)", "oklch(20% 0.03 265)"],
      roles: {
        primary: "oklch(32% 0.1 265)",
        secondary: "oklch(44% 0.07 265)",
        accent: "oklch(78% 0.13 85)",
        neutral: "oklch(22% 0.025 265)",
        ...STATUS_DEEP,
        warning: "oklch(74% 0.15 60)",
      },
    },
    dark: {
      surfaces: ["oklch(15% 0.02 265)", "oklch(12% 0.02 265)", "oklch(9% 0.02 265)", "oklch(92% 0.01 265)"],
      roles: {
        primary: "oklch(76% 0.11 265)",
        secondary: "oklch(74% 0.07 265)",
        accent: "oklch(86% 0.12 85)",
        neutral: "oklch(30% 0.025 265)",
        ...STATUS_BRIGHT,
        warning: "oklch(82% 0.14 60)",
      },
    },
  }),

  defineTheme({
    // Magenta and violet with a lime highlight, pitched as high as AA allows.
    // Wide display headings on a technical body face — the loudest theme here,
    // and the one that most needs a light hand.
    name: "neon",
    type: { body: FACE.spaceGrotesk, head: FACE.syne },
    shape: { selector: "0.25rem", field: "0.25rem", box: "0.375rem", depth: "0" },
    light: {
      surfaces: ["oklch(98% 0.003 300)", "oklch(95% 0.006 300)", "oklch(89% 0.012 300)", "oklch(17% 0.015 300)"],
      roles: {
        primary: "oklch(48% 0.25 320)",
        secondary: "oklch(44% 0.2 285)",
        accent: "oklch(80% 0.2 130)",
        neutral: "oklch(20% 0.015 300)",
        ...STATUS_DEEP,
      },
    },
    dark: {
      surfaces: ["oklch(12% 0.012 300)", "oklch(9% 0.012 300)", "oklch(6% 0.012 300)", "oklch(95% 0.01 300)"],
      roles: {
        primary: "oklch(76% 0.22 320)",
        secondary: "oklch(74% 0.18 285)",
        accent: "oklch(88% 0.2 130)",
        neutral: "oklch(30% 0.018 300)",
        ...STATUS_BRIGHT,
      },
    },
  }),
];

/** Look up a preset by name (the value used as `[data-theme]`). */
export function presetByName(name: string): Theme | undefined {
  return THEME_PRESETS.find((t) => t.name === name);
}
