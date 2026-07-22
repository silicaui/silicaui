import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

/**
 * Typography components for @wizeworks/silicaui's UI type ramp (see the `typography` plugin
 * module). They keep the *semantic* element and its *visual* size independent: a
 * `<Heading level={1} size={3}>` is an `<h1>` for the document outline but reads as
 * an h3. With no `size`, a heading just inherits its tag's global default, so
 * `<Heading level={2} />` and a bare `<h2>` match.
 *
 * `size` here is the TYPOGRAPHIC scale — an h-level (`1`–`6`) or a display step —
 * not the `xs`–`xl` control scale `size` names on Button/Input/etc. That's a
 * deliberate, probe-sanctioned exception (see verify-prop-vocabulary.mjs): `size`
 * always means "how big, on a silicaui scale"; which scale applies depends on
 * whether the thing is a control or a piece of type. Heading/Display values keep
 * the ramp's designed per-step weight + tracking, which a raw `text-*` size drops.
 */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The oversized display ramp (`.display-1`–`.display-3`); `1` is the largest. */
export type DisplayStep = 1 | 2 | 3;

/** A heading's visual size: an h-level, or a step of the display ramp. */
export type HeadingSize = HeadingLevel | "display" | `display-${DisplayStep}`;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level → renders `<h1>`…`<h6>`. Default 2. */
  level?: HeadingLevel;
  /**
   * Visual size, independent of the semantic `level`: an h-level (`1`–`6`),
   * `"display"`, or `"display-1"`–`"display-3"`. Omit to use the tag default —
   * set it only when the outline needs one level but the design wants another
   * size (an `<h2>` that should read as an h4, a hero `<h1>` sized to `display-1`).
   */
  size?: HeadingSize;
  /** @deprecated Renamed to `size`. Still honored; `size` wins if both are set. */
  visualLevel?: HeadingSize;
}

/** A heading whose semantic level and visual size are set independently. */
export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading({ level = 2, size, visualLevel, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const Tag = `h${level}` as "h1";
    const visual = size ?? visualLevel; // `size` is canonical; `visualLevel` is the deprecated alias.
    // Only emit a scale class when it differs from the tag's own default — a bare
    // `<h2>` and `<Heading level={2}>` should render identically. A `display*`
    // value is already a class name; a numeric level maps to `h{n}`.
    const sizeClass =
      visual !== undefined && visual !== level
        ? sc(typeof visual === "string" ? visual : `h${visual}`)
        : undefined;
    return <Tag ref={ref} className={cx(sizeClass, className)} {...rest} />;
  },
);

export interface DisplayProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level for the outline (default 1) — independent of the visual size. */
  level?: HeadingLevel;
  /**
   * Which step of the display ramp (`1`–`3`, largest → smallest). Omit for the
   * base `.display` (equal to `.display-3`).
   */
  size?: DisplayStep;
  /** @deprecated Renamed to `size`. Still honored; `size` wins if both are set. */
  visualLevel?: DisplayStep;
}

/** Oversized hero/display heading on a semantic heading element. */
export const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  function Display({ level = 1, size, visualLevel, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const Tag = `h${level}` as "h1";
    const step = size ?? visualLevel; // `size` is canonical; `visualLevel` is the deprecated alias.
    return (
      <Tag ref={ref} className={cx(sc(step ? `display-${step}` : "display"), className)} {...rest} />
    );
  },
);

export type TextVariant = "body" | "lead" | "caption";

/** Body-text sizes — the lower reach of the type scale (`text-*`). */
export type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** `body` (default), `lead` (larger intro), or `caption` (small, muted). */
  variant?: TextVariant;
  /**
   * Explicit font size from the type scale (`text-*`). Overrides the size implied
   * by `variant`; omit to use the variant's own size.
   */
  size?: TextSize;
  /** Element to render. Default `p`. */
  as?: React.ElementType;
}

/** Body-copy text with a semantic variant. `body` carries no class (bare `<p>`). */
export const Text = React.forwardRef<HTMLElement, TextProps>(
  function Text({ variant = "body", size, as, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const Tag = (as ?? "p") as React.ElementType;
    const variantClass = variant === "lead" ? sc("lead") : variant === "caption" ? sc("caption") : undefined;
    // `text-*` is a Tailwind utility (not a silica class), so no prefix; placed
    // after the variant class so it wins the font-size when both are present.
    const sizeClass = size ? `text-${size}` : undefined;
    return (
      <Tag ref={ref as React.Ref<HTMLElement>} className={cx(variantClass, sizeClass, className) || undefined} {...rest} />
    );
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
