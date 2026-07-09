/**
 * Resolves a real `@wizeworks/silicaui` brand `Theme` down to plain hex color
 * defaults for the email engine (`EmailColorDefaults`). Lives in the REACT
 * layer (not `email/engine.ts`) on purpose: the conversion needs an OKLCH→hex
 * routine, which is `@wizeworks/silicaui-react`'s (a React-layer dependency) —
 * the framework-neutral engine must not depend on it. Email HTML can't ship
 * OKLCH at all (Outlook and most clients don't parse CSS color functions), so
 * this conversion is mandatory, not a nicety.
 */
import { colorValue } from "@wizeworks/silicaui-html";
import type { Theme } from "@wizeworks/silicaui-html";
import { oklchToHex, parseOklch } from "@wizeworks/silicaui-react";
import { DEFAULT_EMAIL_COLORS } from "../schema";
import type { EmailColorDefaults } from "../schema";

/** `"oklch(42% 0.055 252)"` or `"#111827"` → `"#111827"`. Falls back to
 *  `undefined` for anything unparseable, so the caller's default applies. */
function toHex(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("#")) return value;
  const parsed = parseOklch(value);
  return parsed ? oklchToHex(parsed.l, parsed.c, parsed.h) : undefined;
}

/** Resolve a theme's light-mode tokens to email-safe hex defaults. Emails are
 *  authored for light mode by convention (no reliable dark-mode signal across
 *  clients), so this deliberately ignores `theme.dark`. Missing/unparseable
 *  tokens fall back to the built-in neutral defaults field-by-field. */
export function resolveEmailColorDefaults(theme: Theme | undefined): EmailColorDefaults {
  if (!theme) return DEFAULT_EMAIL_COLORS;
  return {
    primary: toHex(colorValue(theme, "primary")) ?? DEFAULT_EMAIL_COLORS.primary,
    primaryContent: toHex(colorValue(theme, "primary-content")) ?? DEFAULT_EMAIL_COLORS.primaryContent,
    baseContent: toHex(colorValue(theme, "base-content")) ?? DEFAULT_EMAIL_COLORS.baseContent,
    base100: toHex(colorValue(theme, "base-100")) ?? DEFAULT_EMAIL_COLORS.base100,
    base200: toHex(colorValue(theme, "base-200")) ?? DEFAULT_EMAIL_COLORS.base200,
    base300: toHex(colorValue(theme, "base-300")) ?? DEFAULT_EMAIL_COLORS.base300,
    secondary: toHex(colorValue(theme, "secondary")) ?? DEFAULT_EMAIL_COLORS.secondary,
    accent: toHex(colorValue(theme, "accent")) ?? DEFAULT_EMAIL_COLORS.accent,
    neutral: toHex(colorValue(theme, "neutral")) ?? DEFAULT_EMAIL_COLORS.neutral,
    info: toHex(colorValue(theme, "info")) ?? DEFAULT_EMAIL_COLORS.info,
    success: toHex(colorValue(theme, "success")) ?? DEFAULT_EMAIL_COLORS.success,
    warning: toHex(colorValue(theme, "warning")) ?? DEFAULT_EMAIL_COLORS.warning,
    error: toHex(colorValue(theme, "error")) ?? DEFAULT_EMAIL_COLORS.error,
  };
}
