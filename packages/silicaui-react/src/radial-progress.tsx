import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

export type RadialProgressColor = SilicaColor;

export interface RadialProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress percentage, 0–100. */
  value: number;
  /** Overall diameter (any CSS length). Default `5rem`. */
  size?: string;
  /** Ring thickness (any CSS length). Default `0.5rem`. */
  thickness?: string;
  /** Accent color. Default primary. */
  color?: RadialProgressColor;
}

/**
 * Silica RadialProgress — a circular progress ring with a centered label.
 *
 *   <RadialProgress value={70} color="success" />
 *   <RadialProgress value={40} size="7rem" thickness="0.75rem">40%</RadialProgress>
 *
 * Defaults the label to `{value}%`; pass children to override.
 */
export const RadialProgress = React.forwardRef<HTMLDivElement, RadialProgressProps>(
  function RadialProgress(
    { value, size = "5rem", thickness = "0.5rem", color, className, children, style, ...rest },
    ref,
  ) {
    const sc = useSilicaClass();
    const pct = Math.max(0, Math.min(100, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cx(sc("radial-progress"), className)}
        style={
          {
            "--value": pct,
            "--size": size,
            "--thickness": thickness,
            ...(color ? { "--radial-accent": `var(--color-${color})` } : {}),
            ...style,
          } as React.CSSProperties
        }
        {...rest}
      >
        <span>{children ?? `${Math.round(pct)}%`}</span>
      </div>
    );
  },
);
