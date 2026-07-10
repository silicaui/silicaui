import * as React from "react";
import { mergeProps } from "./lib/merge-props";
import { useSilicaConfig } from "./lib/config";
import {
  badgeClasses,
  type BadgeColor,
  type BadgeVariant,
  type BadgeSize,
  type BadgeClassOptions,
} from "./lib/badge-classes";

export { badgeClasses };
export type { BadgeColor, BadgeVariant, BadgeSize, BadgeClassOptions };

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
    const { prefix } = useSilicaConfig();
    const classes = badgeClasses({ color, variant, size, className }, { prefix });

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
