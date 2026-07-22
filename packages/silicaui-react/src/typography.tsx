import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

/**
 * Typography components for @wizeworks/silicaui's UI type ramp (see the `typography` plugin
 * module). They keep the *semantic* element and its *visual* size independent: a
 * `<Heading level={1} visualLevel={3}>` is an `<h1>` for the document outline but
 * reads as an h3. With no `visualLevel`, a heading just inherits its tag's global
 * default, so `<Heading level={2} />` and a bare `<h2>` match.
 */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The oversized display ramp (`.display-1`–`.display-3`); `1` is the largest. */
export type DisplayStep = 1 | 2 | 3;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level → renders `<h1>`…`<h6>`. Default 2. */
  level?: HeadingLevel;
  /**
   * Visual heading scale (`1`–`6`, `"display"`, or `"display-1"`–`"display-3"`),
   * independent of the semantic `level`; omit to use the tag default.
   *
   * Named `visualLevel`, not `size`, on purpose: everywhere else in Silica
   * `size` is the `xs`–`xl` token scale, and a prop that takes `3` in one
   * component and `"lg"` in the next is a prop in name only.
   */
  visualLevel?: HeadingLevel | "display" | `display-${DisplayStep}`;
}

/** A heading whose semantic level and visual size are set independently. */
export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading({ level = 2, visualLevel, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const Tag = `h${level}` as "h1";
    // Only emit a scale class when it differs from the tag's own default — a bare
    // `<h2>` and `<Heading level={2}>` should render identically. A `display*`
    // value is already a class name; a numeric level maps to `h{n}`.
    const sizeClass =
      visualLevel !== undefined && visualLevel !== level
        ? sc(typeof visualLevel === "string" ? visualLevel : `h${visualLevel}`)
        : undefined;
    return <Tag ref={ref} className={cx(sizeClass, className)} {...rest} />;
  },
);

export interface DisplayProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level for the outline (default 1) — independent of the visual size. */
  level?: HeadingLevel;
  /**
   * Which step of the display ramp (`1`–`3`, largest → smallest). Omit for the
   * base `.display` (equal to `.display-3`). Named `visualLevel` to parallel
   * `Heading`, never `size` (which is the `xs`–`xl` token scale everywhere else).
   */
  visualLevel?: DisplayStep;
}

/** Oversized hero/display heading on a semantic heading element. */
export const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  function Display({ level = 1, visualLevel, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const Tag = `h${level}` as "h1";
    return (
      <Tag ref={ref} className={cx(sc(visualLevel ? `display-${visualLevel}` : "display"), className)} {...rest} />
    );
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

export type BlockquoteProps = React.BlockquoteHTMLAttributes<HTMLQuoteElement>;

/**
 * A pull-quote/testimonial block — larger and plainer than `.prose`'s
 * inline-quote-in-a-paragraph styling. Pair with `BlockquoteCite`.
 *
 *   <Blockquote>
 *     “Silica cut our design review time in half.”
 *     <BlockquoteCite>Ada Lovelace, Analytical Engines Inc.</BlockquoteCite>
 *   </Blockquote>
 */
export const Blockquote = React.forwardRef<HTMLQuoteElement, BlockquoteProps>(
  function Blockquote({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <blockquote ref={ref} className={cx(sc("blockquote"), className)} {...rest} />;
  },
);

export interface BlockquoteCiteProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render. Default `footer`. */
  as?: React.ElementType;
}

/** The attribution line for a `Blockquote` (e.g. "— Name, Title"). */
export const BlockquoteCite = React.forwardRef<HTMLElement, BlockquoteCiteProps>(
  function BlockquoteCite({ as, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const Tag = (as ?? "footer") as React.ElementType;
    return (
      <Tag ref={ref as React.Ref<HTMLElement>} className={cx(sc("blockquote-cite"), className)} {...rest} />
    );
  },
);
