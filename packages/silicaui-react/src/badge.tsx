import * as React from "react";
import { composeRender } from "./lib/render-slot";
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
  /**
   * Render as a different element while keeping Silica's classes.
   *
   * CLIENT COMPONENTS ONLY — from a React Server Component the element loses
   * its props crossing the `"use client"` boundary. Style the element directly
   * instead: `badgeClasses()` from `@wizeworks/silicaui-react/server`.
   */
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

    // Null when `render` is absent or unusable — both fall through to <span>.
    const composed = composeRender(
      render,
      { ...rest, className: classes, children, ref },
      "Badge",
    );
    if (composed) return composed;

    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
