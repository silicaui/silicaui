import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  /** Center every column and its contents (single-row, centered footer). */
  center?: boolean;
}

/**
 * Silica Footer — a responsive multi-column site footer.
 *
 *   <Footer>
 *     <nav>
 *       <FooterTitle>Product</FooterTitle>
 *       <Link href="#">Features</Link>
 *       <Link href="#">Pricing</Link>
 *     </nav>
 *     …more columns…
 *   </Footer>
 *
 * Renders a `<footer>`. Each direct child (e.g. a `<nav>`) becomes a vertical
 * stack of links under its `<FooterTitle>`.
 */
export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  function Footer({ center, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <footer
        ref={ref}
        className={cx(sc("footer"), center && sc("footer-center"), className)}
        {...rest}
      />
    );
  },
);

export type FooterTitleProps = React.HTMLAttributes<HTMLElement>;

/** A small, muted, upper-cased heading for a footer column. Renders `<h6>`. */
export const FooterTitle = React.forwardRef<HTMLHeadingElement, FooterTitleProps>(
  function FooterTitle({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <h6 ref={ref} className={cx(sc("footer-title"), className)} {...rest} />;
  },
);
