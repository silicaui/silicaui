import * as React from "react";
import { cx } from "./lib/cx";
import { mergeProps } from "./lib/merge-props";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type BadgeColor = SilicaColor;

export type BadgeVariant = "solid" | "outline" | "soft" | "ghost" | "dash";

export type BadgeSize = SilicaSize;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic or custom color; maps to `badge-<color>`. */
  color?: BadgeColor;
  /** How the color is applied. Default `solid`. */
  variant?: BadgeVariant;
  /** Default `md`. */
  size?: BadgeSize;
  /** Render as a different element while keeping Silica's classes. */
  render?: React.ReactElement;
}

/**
 * Silica Badge — a small pill for labels, counts, and statuses. Presentational;
 * `render` covers polymorphism (e.g. wrap a link).
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge(
    { color, variant = "solid", size = "md", render, className, children, ...rest },
    ref,
  ) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("badge"),
      color && sc(`badge-${color}`),
      variant !== "solid" && sc(`badge-${variant}`),
      size !== "md" && sc(`badge-${size}`),
      className,
    );

    if (render) {
      const ownProps: Record<string, unknown> = {
        ...rest,
        className: classes,
        children,
        ref,
      };
      return React.cloneElement(
        render,
        mergeProps(ownProps, render.props as Record<string, unknown>),
      );
    }

    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
