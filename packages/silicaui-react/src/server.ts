/**
 * Framework-agnostic utilities with no React dependency — safe to import
 * directly into a Server Component. The main entry point is bundled as a
 * single `"use client"` module (every component needs it), so importing
 * `cx` from `"@wizeworks/silicaui-react"` there hands a Server Component an unusable
 * client reference instead of a callable function. Import from
 * `"@wizeworks/silicaui-react/server"` instead.
 */
export { cx } from "./lib/cx";
export { mergeProps } from "./lib/merge-props";

export { buttonClasses } from "./lib/button-classes";
export type {
  ButtonColor,
  ButtonVariant,
  ButtonSize,
  ButtonClassOptions,
} from "./lib/button-classes";

export { badgeClasses } from "./lib/badge-classes";
export type {
  BadgeColor,
  BadgeVariant,
  BadgeSize,
  BadgeClassOptions,
} from "./lib/badge-classes";

export { clickableCardClasses } from "./lib/card-classes";
export type { ClickableCardClassOptions } from "./lib/card-classes";
