import * as React from "react";
import { Collapsible as BaseCollapsible } from "@base-ui-components/react/collapsible";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

const ChevronIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export type CollapsibleProps = Styled<typeof BaseCollapsible.Root>;

/**
 * Silica Collapsible — a single show/hide disclosure (Base UI behavior, animated
 * height). The primitive behind `Accordion`; use it when you have just one
 * region to reveal.
 *
 *   <Collapsible defaultOpen>
 *     <CollapsibleTrigger>Shipping details</CollapsibleTrigger>
 *     <CollapsiblePanel>Ships in 2–3 business days.</CollapsiblePanel>
 *   </Collapsible>
 */
export function Collapsible({ className, ...rest }: CollapsibleProps) {
  const sc = useSilicaClass();
  return (
    <BaseCollapsible.Root className={cx(sc("collapsible"), className)} {...rest} />
  );
}

export interface CollapsibleTriggerProps
  extends Styled<typeof BaseCollapsible.Trigger> {
  /** Set false to omit the built-in chevron. */
  chevron?: boolean;
}

export function CollapsibleTrigger({
  className,
  children,
  chevron = true,
  ...rest
}: CollapsibleTriggerProps) {
  const sc = useSilicaClass();
  return (
    <BaseCollapsible.Trigger
      className={cx(sc("collapsible-trigger"), className)}
      {...rest}
    >
      <span>{children}</span>
      {chevron && <ChevronIcon />}
    </BaseCollapsible.Trigger>
  );
}

export interface CollapsiblePanelProps
  extends Styled<typeof BaseCollapsible.Panel> {
  children?: React.ReactNode;
}

export function CollapsiblePanel({
  className,
  children,
  ...rest
}: CollapsiblePanelProps) {
  const sc = useSilicaClass();
  return (
    <BaseCollapsible.Panel
      className={cx(sc("collapsible-panel"), className)}
      {...rest}
    >
      <div className={cx(sc("collapsible-content"))}>{children}</div>
    </BaseCollapsible.Panel>
  );
}
