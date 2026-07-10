import { cx } from "./cx";
import type { SilicaColor, SilicaSize } from "./tokens";

export type BadgeColor = SilicaColor;

export type BadgeVariant = "solid" | "outline" | "soft" | "ghost" | "dash";

export type BadgeSize = SilicaSize;

export interface BadgeClassOptions {
  color?: BadgeColor;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

/**
 * The class-string logic behind `<Badge>`, as a standalone function with no
 * React dependency — usable from a Server Component to style a plain element
 * directly. Pass `prefix` to match a non-default `<SilicaProvider prefix>`.
 */
export function badgeClasses(
  { color, variant = "solid", size = "md", className }: BadgeClassOptions = {},
  { prefix = "" }: { prefix?: string } = {},
): string {
  const sc = (name: string) => `${prefix}${name}`;
  return cx(
    sc("badge"),
    color && sc(`badge-${color}`),
    variant !== "solid" && sc(`badge-${variant}`),
    size !== "md" && sc(`badge-${size}`),
    className,
  );
}
