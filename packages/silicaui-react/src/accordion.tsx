import * as React from "react";
import { Accordion as BaseAccordion } from "@base-ui-components/react/accordion";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Silica Accordion — collapsible sections (Base UI behavior, animated height).
 *
 *   <Accordion multiple={false} defaultValue={["a"]}>
 *     <AccordionItem value="a">
 *       <AccordionTrigger>What is Silica?</AccordionTrigger>
 *       <AccordionPanel>A design system on one token model.</AccordionPanel>
 *     </AccordionItem>
 *     <AccordionItem value="b">
 *       <AccordionTrigger>Is it themeable?</AccordionTrigger>
 *       <AccordionPanel>Yes — every color is a token.</AccordionPanel>
 *     </AccordionItem>
 *   </Accordion>
 */
export function Accordion({ className, ...rest }: Styled<typeof BaseAccordion.Root>) {
  const sc = useSilicaClass();
  return <BaseAccordion.Root className={cx(sc("accordion"), className)} {...rest} />;
}

export function AccordionItem({ className, ...rest }: Styled<typeof BaseAccordion.Item>) {
  const sc = useSilicaClass();
  return <BaseAccordion.Item className={cx(sc("accordion-item"), className)} {...rest} />;
}

export interface AccordionTriggerProps extends Styled<typeof BaseAccordion.Trigger> {
  /** Set false to omit the built-in chevron. */
  chevron?: boolean;
}

export function AccordionTrigger({
  className,
  children,
  chevron = true,
  ...rest
}: AccordionTriggerProps) {
  const sc = useSilicaClass();
  return (
    <BaseAccordion.Header className={cx(sc("accordion-header"))}>
      <BaseAccordion.Trigger className={cx(sc("accordion-trigger"), className)} {...rest}>
        <span>{children}</span>
        {chevron && <ChevronIcon />}
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

export function AccordionPanel({
  className,
  children,
  ...rest
}: Styled<typeof BaseAccordion.Panel>) {
  const sc = useSilicaClass();
  return (
    <BaseAccordion.Panel className={cx(sc("accordion-panel"), className)} {...rest}>
      <div className={cx(sc("accordion-content"))}>{children}</div>
    </BaseAccordion.Panel>
  );
}
