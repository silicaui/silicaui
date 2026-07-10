import { cx } from "./cx";

export interface ClickableCardClassOptions {
  className?: string;
}

/**
 * The class-string logic behind `<ClickableCard>`, as a standalone function
 * with no React dependency — usable from a Server Component to style a plain
 * element directly. Pass `prefix` to match a non-default `<SilicaProvider prefix>`.
 */
export function clickableCardClasses(
  { className }: ClickableCardClassOptions = {},
  { prefix = "" }: { prefix?: string } = {},
): string {
  const sc = (name: string) => `${prefix}${name}`;
  return cx(sc("card"), sc("card-clickable"), className);
}
