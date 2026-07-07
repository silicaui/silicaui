import * as React from "react";
import { cx } from "./lib/cx";
import { mergeProps } from "./lib/merge-props";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Semantic or custom color; maps to `btn-<color>`. */
  color?: ButtonColor;
  /** How the color is applied. Default `solid`. */
  variant?: ButtonVariant;
  /** Default `md`. */
  size?: ButtonSize;
  /** Icon-only button shape. */
  shape?: "square" | "circle";
  /** Full-width. */
  block?: boolean;
  /** Extra-wide. */
  wide?: boolean;
  /** Force the pressed look. */
  active?: boolean;
  /** Show a spinner, set `aria-busy`, and make the button non-interactive. */
  loading?: boolean;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  /**
   * Render as a different element (e.g. an anchor or router link) while keeping
   * Silica's classes and behavior. Mirrors Base UI's `render` composition model.
   *
   *   <Button render={<a href="/docs" />}>Docs</Button>
   */
  render?: React.ReactElement;
}

/**
 * Silica Button — a thin wrapper that applies Silica's `btn` classes. It's a
 * presentational component, so it doesn't pull in a headless primitive; the
 * `render` prop covers polymorphism.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      color,
      variant = "solid",
      size = "md",
      shape,
      block,
      wide,
      active,
      loading,
      disabled,
      iconStart,
      iconEnd,
      render,
      className,
      children,
      type,
      ...rest
    },
    ref,
  ) {
    // Bound to the active <SilicaProvider prefix>, so `sc("btn")` → `sx-btn`.
    // `className` (the user's own utilities) is passed through untouched.
    const sc = useSilicaClass();
    const classes = cx(
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

    const isDisabled = Boolean(disabled) || Boolean(loading);
    const content = (
      <>
        {iconStart}
        {children}
        {iconEnd}
      </>
    );

    // Polymorphic path: render the user's element with our props merged in.
    if (render) {
      const ownProps: Record<string, unknown> = {
        ...rest,
        className: classes,
        children: content,
        ref,
        "aria-busy": loading || undefined,
        "aria-disabled": isDisabled || undefined,
        "data-disabled": isDisabled ? "" : undefined,
      };
      return React.cloneElement(
        render,
        mergeProps(ownProps, render.props as Record<string, unknown>),
      );
    }

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...rest}
      >
        {content}
      </button>
    );
  },
);
