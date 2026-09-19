import * as React from "react";
import { composeRender } from "./lib/render-slot";
import { useSilicaConfig } from "./lib/config";
import {
  buttonClasses,
  type ButtonColor,
  type ButtonVariant,
  type ButtonSize,
  type ButtonClassOptions,
} from "./lib/button-classes";

export { buttonClasses };
export type { ButtonColor, ButtonVariant, ButtonSize, ButtonClassOptions };

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
   *
   * CLIENT COMPONENTS ONLY. This package is a `"use client"` module, so an
   * element passed from a React Server Component is serialized across the
   * boundary and arrives without its props — the link renders styled but
   * without its `href`, or throws outright. From a Server Component, style the
   * element directly instead of composing it:
   *
   *   import { buttonClasses } from "@wizeworks/silicaui-react/server";
   *   <a href="/docs" className={buttonClasses({ color: "brand" })}>Docs</a>
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
    const { prefix } = useSilicaConfig();
    const classes = buttonClasses(
      { color, variant, size, shape, block, wide, active, className },
      { prefix },
    );

    const isDisabled = Boolean(disabled) || Boolean(loading);

    /**
     * A BUSY button keeps the native `disabled` attribute OFF, and the reason is
     * focus, not styling.
     *
     * When the element a keyboard user is standing on gains `disabled`, the
     * browser blows focus to `<body>`. So pressing Enter on a submit button
     * stranded them for the length of the request: no ring anywhere, the next
     * Tab restarting from the top of the document, and a screen reader losing
     * its place entirely — with `aria-busy` set and nothing focused to announce
     * it (docs/personas/issues/023).
     *
     * `aria-disabled` says the same thing to assistive tech, stays focusable,
     * and is ALREADY styled identically: `&:disabled, &[aria-disabled='true']`
     * share one rule in button.js, and the spinner keys off `aria-busy`. So
     * nothing about the look changes. The polymorphic `render` path has always
     * taken this route; only the native `<button>` differed from it.
     *
     * A genuinely `disabled` button still gets the real attribute. That one is
     * not temporary, the user did not just press it, and taking it out of the
     * tab order is the correct platform behaviour.
     */
    const busyOnly = Boolean(loading) && !disabled;
    const blockWhileBusy = busyOnly
      ? (e: React.MouseEvent<HTMLButtonElement>) => {
          // `aria-disabled` is advisory — the element is still clickable and
          // still submits a form on Enter, so the activation is stopped here.
          e.preventDefault();
          e.stopPropagation();
        }
      : undefined;
    const content = (
      <>
        {iconStart}
        {children}
        {iconEnd}
      </>
    );

    // Polymorphic path: render the user's element with our props merged in.
    // `composed` is null when `render` is absent or unusable — either way we
    // fall through to the native <button> rather than crashing the page.
    const composed = composeRender(
      render,
      {
        ...rest,
        className: classes,
        children: content,
        ref,
        "aria-busy": loading || undefined,
        "aria-disabled": isDisabled || undefined,
        "data-disabled": isDisabled ? "" : undefined,
      },
      "Button",
    );
    if (composed) return composed;

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={classes}
        disabled={Boolean(disabled)}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        {...rest}
        onClick={blockWhileBusy ?? rest.onClick}
      >
        {content}
      </button>
    );
  },
);
