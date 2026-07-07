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

/** Light theme — also the default registered theme color values. */
export const LIGHT = {
  "base-100": "oklch(100% 0 0)",
  "base-200": "oklch(97% 0 0)",
  "base-300": "oklch(92% 0 0)",
  "base-content": "oklch(25% 0.01 265)",

  primary: "oklch(55% 0.24 262)",
  "primary-content": "oklch(98% 0.01 262)",
  secondary: "oklch(65% 0.22 330)",
  "secondary-content": "oklch(98% 0.01 330)",
  accent: "oklch(72% 0.19 195)",
  "accent-content": "oklch(20% 0.02 195)",
  neutral: "oklch(32% 0.02 265)",
  "neutral-content": "oklch(95% 0 0)",

  info: "oklch(70% 0.16 232)",
  "info-content": "oklch(20% 0.04 232)",
  success: "oklch(72% 0.19 150)",
  "success-content": "oklch(20% 0.04 150)",
  warning: "oklch(80% 0.17 80)",
  "warning-content": "oklch(25% 0.05 80)",
  error: "oklch(63% 0.24 25)",
  "error-content": "oklch(98% 0.01 25)",
};

/** Dark theme — overrides applied under `[data-theme="dark"]`. */
export const DARK = {
  "base-100": "oklch(22% 0.01 265)",
  "base-200": "oklch(20% 0.01 265)",
  "base-300": "oklch(17% 0.01 265)",
  "base-content": "oklch(92% 0.01 265)",

  primary: "oklch(65% 0.22 262)",
  "primary-content": "oklch(14% 0.03 262)",
  secondary: "oklch(70% 0.19 330)",
  "secondary-content": "oklch(14% 0.03 330)",
  accent: "oklch(75% 0.17 195)",
  "accent-content": "oklch(14% 0.02 195)",
  neutral: "oklch(28% 0.02 265)",
  "neutral-content": "oklch(92% 0 0)",

  info: "oklch(72% 0.15 232)",
  "info-content": "oklch(14% 0.03 232)",
  success: "oklch(74% 0.18 150)",
  "success-content": "oklch(14% 0.03 150)",
  warning: "oklch(82% 0.16 80)",
  "warning-content": "oklch(16% 0.04 80)",
  error: "oklch(68% 0.21 25)",
  "error-content": "oklch(14% 0.03 25)",
};
