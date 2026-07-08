import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface CollapseProps
  extends React.DetailsHTMLAttributes<HTMLDetailsElement> {
  /** Drop the surface for a flush, borderless accordion row. */
  ghost?: boolean;
}

/**
 * Silica Collapse — a native `<details>` disclosure. Give several the same
 * `name` for an exclusive accordion (only one open at a time).
 *
 *   <Collapse>
 *     <CollapseTitle>Shipping</CollapseTitle>
 *     <CollapseContent>Ships in 2–3 business days.</CollapseContent>
 *   </Collapse>
 *
 *   <Collapse name="faq" open>…</Collapse>
 *   <Collapse name="faq">…</Collapse>
 */
export const Collapse = React.forwardRef<HTMLDetailsElement, CollapseProps>(
  function Collapse({ ghost = false, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      // The CSS class is `.details`, not `.collapse` — see the doc comment in
      // collapse.js for why (Tailwind v4's built-in `.collapse` utility sets
      // `visibility: collapse` and wins over any component base-layer rule of
      // the same name, silently making the whole thing invisible).
      <details
        ref={ref}
        className={cx(sc("details"), ghost && sc("details-ghost"), className)}
        {...rest}
      />
    );
  },
);

/** The clickable header (renders a `<summary>`). */
export const CollapseTitle = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(function CollapseTitle({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <summary ref={ref} className={cx(sc("details-title"), className)} {...rest} />
  );
});

/** The disclosed body. */
export const CollapseContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CollapseContent({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <div ref={ref} className={cx(sc("details-content"), className)} {...rest} />
  );
});
