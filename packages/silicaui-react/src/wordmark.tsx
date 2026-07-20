import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export interface WordmarkProps
  // `AllHTMLAttributes` (not the plain `HTMLAttributes` most components here
  // use) is deliberate, and matches `SidebarItem`: with `as="a"` the anchor's
  // own attributes have to type-check. `href` used to be declared as a one-off
  // prop, which made the documented `as="a"` usage half-work — `href` compiled
  // and `target`/`rel`/`download` did not. `color`/`size` are omitted so the
  // token unions below win over the native string/number attributes, and
  // `src`/`alt` so their Wordmark-specific meaning is documented here.
  // (`as` too: AllHTMLAttributes carries the native `<link rel=preload as>`
  // attribute, which collides with the polymorphic `as` below.)
  extends Omit<React.AllHTMLAttributes<HTMLElement>, "color" | "size" | "src" | "alt" | "as"> {
  /** Solid accent color for the whole mark; maps to `wordmark-<color>`. */
  color?: SilicaColor;
  /** Default `md`. */
  size?: SilicaSize;
  /** Render as a different element — typically `"a"` when the mark links home. */
  as?: React.ElementType;
  /** A logo image rendered before the name. The one-prop path, for when the mark
   *  is a URL rather than a slotted component; `children` composition is the
   *  richer path and both lower to the same DOM. Ignored when `children` is
   *  given a mark of its own — pick one. */
  src?: string;
  /** Alt text for `src`. Defaults to `""` (decorative): the brand NAME renders
   *  beside the logo, so announcing both just repeats it. Set it explicitly for
   *  a mark-only wordmark, where the logo carries the name. */
  alt?: string;
}

/**
 * Silica Wordmark — a stylized logotype for a brand/product name. Wrap a
 * highlighted portion in `<WordmarkAccent>` for a two-tone mark (e.g. the "UI"
 * in "Silica UI"); a leading icon/glyph works as a plain child too.
 *
 *   <Wordmark>Silica<WordmarkAccent>UI</WordmarkAccent></Wordmark>
 *   <Wordmark as="a" href="/" color="primary"><LogoMark />Acme</Wordmark>
 *   <Wordmark src="/logo.svg">Acme</Wordmark>
 */
export const Wordmark = React.forwardRef<HTMLElement, WordmarkProps>(
  function Wordmark({ color, size = "md", as, src, alt = "", className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    const Tag = (as ?? "span") as React.ElementType;
    return (
      <Tag
        ref={ref as React.Ref<HTMLElement>}
        className={cx(
          sc("wordmark"),
          color && sc(`wordmark-${color}`),
          size !== "md" && sc(`wordmark-${size}`),
          className,
        )}
        {...rest}
      >
        {src ? <img className={cx(sc("wordmark-mark"))} src={src} alt={alt} loading="lazy" /> : null}
        {children}
      </Tag>
    );
  },
);

export type WordmarkAccentProps = React.HTMLAttributes<HTMLSpanElement>;

/** The highlighted portion of a `Wordmark` (defaults to the primary color). */
export const WordmarkAccent = React.forwardRef<HTMLSpanElement, WordmarkAccentProps>(
  function WordmarkAccent({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <span ref={ref} className={cx(sc("wordmark-accent"), className)} {...rest} />;
  },
);
