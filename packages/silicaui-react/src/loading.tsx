import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaSize } from "./lib/tokens";

export type LoadingSize = SilicaSize;

export interface LoadingProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Default `md`. */
  size?: LoadingSize;
  /** Accessible label announced to assistive tech. Default "Loading". */
  label?: string;
}

/**
 * Silica Loading — a spinner. Inherits `currentColor`, so color it with a
 * `text-*` utility or let it match the surrounding text.
 *
 *   <Loading />
 *   <Loading size="sm" className="text-primary" />
 *   <Button loading>Saving…</Button>   // Button has its own built-in spinner
 */
export const Loading = React.forwardRef<HTMLSpanElement, LoadingProps>(
  function Loading({ size = "md", label = "Loading", className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <span
        ref={ref}
        role="status"
        aria-label={label}
        className={cx(
          sc("loading"),
          size !== "md" && sc(`loading-${size}`),
          className,
        )}
        {...rest}
      />
    );
  },
);
