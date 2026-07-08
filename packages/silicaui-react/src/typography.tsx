import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

/**
 * Typography components for @wizeworks/silicaui's UI type ramp (see the `typography` plugin
 * module). They keep the *semantic* element and its *visual* size independent: a
 * `<Heading level={1} size={3}>` is an `<h1>` for the document outline but reads
 * as an h3. With no `size`, a heading just inherits its tag's global default, so
 * `<Heading level={2} />` and a bare `<h2>` match.
 */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level → renders `<h1>`…`<h6>`. Default 2. */
  level?: HeadingLevel;
  /** Visual size override (`1`–`6` or `"display"`); omit to use the tag default. */
  size?: HeadingLevel | "display";
}

/** A heading whose semantic level and visual size are set independently. */
export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading({ level = 2, size, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const Tag = `h${level}` as "h1";
    // Only emit a size class when it differs from the tag's own default — a bare
    // `<h2>` and `<Heading level={2}>` should render identically.
    const sizeClass = size !== undefined && size !== level ? sc(size === "display" ? "display" : `h${size}`) : undefined;
    return <Tag ref={ref} className={cx(sizeClass, className)} {...rest} />;
  },
);

export interface DisplayProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level for the outline (the look is always `.display`). Default 1. */
  level?: HeadingLevel;
}

/** Oversized hero/display heading (`.display`) on a semantic heading element. */
export const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  function Display({ level = 1, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const Tag = `h${level}` as "h1";
    return <Tag ref={ref} className={cx(sc("display"), className)} {...rest} />;
  },
);

export type TextVariant = "body" | "lead" | "caption";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** `body` (default), `lead` (larger intro), or `caption` (small, muted). */
  variant?: TextVariant;
  /** Element to render. Default `p`. */
  as?: React.ElementType;
}

/** Body-copy text with a semantic variant. `body` carries no class (bare `<p>`). */
export const Text = React.forwardRef<HTMLElement, TextProps>(
  function Text({ variant = "body", as, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const Tag = (as ?? "p") as React.ElementType;
    const variantClass = variant === "lead" ? sc("lead") : variant === "caption" ? sc("caption") : undefined;
    return <Tag ref={ref as React.Ref<HTMLElement>} className={cx(variantClass, className) || undefined} {...rest} />;
  },
);
