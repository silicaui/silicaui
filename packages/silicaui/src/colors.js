/**
 * Semantic color tokens for Silica.
 *
 * Each named color has a paired `-content` token — the legible foreground to
 * use on top of it. This is the daisyUI model: `primary` / `primary-content`.
 *
 * Values are OKLCH, but any CSS color format works as a token value in
 * Tailwind v4 (it uses color-mix() for opacity, so no channel-splitting is
 * required). A user can override any of these — or add brand-new colors — from
 * their own `@theme { --color-brand: #7c3aed; }`.
 */

/** The colors that get component variants (`.btn-primary`, …) by default. */
export const SEMANTIC_COLORS = [
  "primary",
  "secondary",
  "accent",
  "neutral",
  "info",
  "success",
  "warning",
  "error",
];

/**
 * "Quartz" — cool-mineral default. One hue family (250-255, Chalk/Flint/Slate/
 * Obsidian) for structure and a single higher-chroma accent (Quartz, 211)
 * reserved for interactive states. The four semantic roles keep their
 * functional hues but the same chroma discipline: Azurite/Malachite/
 * Citrine/Garnet.
 */

/** Light theme — also the default registered theme color values. */
export const LIGHT = {
  "base-100": "oklch(98% 0.003 250)",
  "base-200": "oklch(95% 0.004 250)",
  "base-300": "oklch(90% 0.006 250)",
  "base-content": "oklch(21% 0.012 255)",

  primary: "oklch(42% 0.055 252)",
  "primary-content": "oklch(98% 0.004 250)",
  secondary: "oklch(55% 0.035 255)",
  "secondary-content": "oklch(98% 0.004 250)",
  accent: "oklch(64% 0.13 211)",
  "accent-content": "oklch(15% 0.02 255)",
  neutral: "oklch(26% 0.014 255)",
  "neutral-content": "oklch(95% 0.004 250)",

  info: "oklch(68% 0.1 232)",
  "info-content": "oklch(16% 0.03 232)",
  success: "oklch(70% 0.12 150)",
  "success-content": "oklch(18% 0.03 150)",
  warning: "oklch(80% 0.11 85)",
  "warning-content": "oklch(24% 0.04 85)",
  error: "oklch(58% 0.17 25)",
  "error-content": "oklch(97% 0.01 25)",
};

/** Dark theme — overrides applied under `[data-theme="dark"]`. */
export const DARK = {
  "base-100": "oklch(16% 0.01 255)",
  "base-200": "oklch(13.5% 0.01 255)",
  "base-300": "oklch(11% 0.01 255)",
  "base-content": "oklch(93% 0.006 250)",

  primary: "oklch(72% 0.06 252)",
  "primary-content": "oklch(14% 0.015 255)",
  secondary: "oklch(78% 0.035 255)",
  "secondary-content": "oklch(15% 0.015 255)",
  accent: "oklch(72% 0.13 211)",
  "accent-content": "oklch(14% 0.02 255)",
  neutral: "oklch(32% 0.016 255)",
  "neutral-content": "oklch(93% 0.006 250)",

  info: "oklch(74% 0.09 232)",
  "info-content": "oklch(14% 0.03 232)",
  success: "oklch(75% 0.11 150)",
  "success-content": "oklch(14% 0.03 150)",
  warning: "oklch(83% 0.1 85)",
  "warning-content": "oklch(16% 0.04 85)",
  error: "oklch(66% 0.18 25)",
  "error-content": "oklch(14% 0.03 25)",
};
