import { cx } from "./cx";
import type { SilicaColor, SilicaSize } from "./tokens";

/** Semantic or custom color. Alias of the shared {@link SilicaColor}. */
export type ButtonColor = SilicaColor;

export type ButtonVariant =
  | "solid"
  | "outline"
  | "soft"
  | "ghost"
  | "link"
  | "dash";

export type ButtonSize = SilicaSize;

export interface ButtonClassOptions {
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: "square" | "circle";
  block?: boolean;
  wide?: boolean;
  active?: boolean;
  className?: string;
}

/**
 * The class-string logic behind `<Button>`, as a standalone function with no
 * React dependency — usable from a Server Component (where the `render` prop's
 * client-side `cloneElement` can't run) to style a plain element directly:
 *
 *   <Link className={buttonClasses({ color: "neutral", variant: "ghost" })}>Clear</Link>
 *
 * Pass `prefix` to match a non-default `<SilicaProvider prefix>`.
 */
export function buttonClasses(
  {
    color,
    variant = "solid",
    size = "md",
    shape,
    block,
    wide,
    active,
    className,
  }: ButtonClassOptions = {},
  { prefix = "" }: { prefix?: string } = {},
): string {
  const sc = (name: string) => `${prefix}${name}`;
  return cx(
    sc("btn"),
    color && sc(`btn-${color}`),
    variant !== "solid" && sc(`btn-${variant}`),
    size !== "md" && sc(`btn-${size}`),
    shape && sc(`btn-${shape}`),
    block && sc("btn-block"),
    wide && sc("btn-wide"),
    active && sc("btn-active"),
    className,
  );
}
