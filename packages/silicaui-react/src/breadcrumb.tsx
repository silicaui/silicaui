import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {}

/**
 * Silica Breadcrumb — a navigation trail. Pass `<li>` items as children; the
 * chevron separators are drawn by CSS, so no separator markup is needed.
 *
 *   <Breadcrumb>
 *     <li><a href="/">Home</a></li>
 *     <li><a href="/projects">Projects</a></li>
 *     <li><span aria-current="page">Silica</span></li>
 *   </Breadcrumb>
 */
export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  function Breadcrumb({ className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cx(sc("breadcrumb"), className)}
        {...rest}
      >
        <ol>{children}</ol>
      </nav>
    );
  },
);
