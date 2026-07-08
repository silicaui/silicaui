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
