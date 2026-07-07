import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

export type LinkColor = SilicaColor;

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Accent color; maps to `link-<color>`. Defaults to the surrounding text color. */
  color?: LinkColor;
  /** Show the underline only on hover / focus. */
  hover?: boolean;
}

/**
 * Silica Link — a styled inline anchor.
 *
 *   <Link href="/docs">Docs</Link>
 *   <Link href="/pricing" color="primary">Pricing</Link>
 *   <Link href="#" hover>Underlines on hover</Link>
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function Link({ color, hover, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <a
        ref={ref}
        className={cx(
          sc("link"),
          hover && sc("link-hover"),
          color && sc(`link-${color}`),
          className,
        )}
        {...rest}
      />
    );
  },
);
