import * as React from "react";
import { Popover as BasePopover } from "@base-ui-components/react/popover";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { usePortalContainer } from "./portal-container";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

const asRender = (el: React.ReactElement) =>
  el as React.ReactElement<Record<string, unknown>>;

type PositionerProps = React.ComponentProps<typeof BasePopover.Positioner>;
export type PopoverSide = NonNullable<PositionerProps["side"]>;
export type PopoverAlign = NonNullable<PositionerProps["align"]>;

export type PopoverProps = React.ComponentProps<typeof BasePopover.Root>;

/**
 * Silica Popover — a click-triggered floating panel (Base UI).
 *
 *   <Popover>
 *     <PopoverTrigger><Button variant="outline">Details</Button></PopoverTrigger>
 *     <PopoverContent>
 *       <PopoverTitle>Storage</PopoverTitle>
 *       <PopoverDescription>92% of your quota is used.</PopoverDescription>
 *     </PopoverContent>
 *   </Popover>
 */
export const Popover = BasePopover.Root;

export function PopoverTrigger({ children }: { children: React.ReactElement }) {
  return <BasePopover.Trigger render={asRender(children)} />;
}

export function PopoverClose({ children }: { children: React.ReactElement }) {
  return <BasePopover.Close render={asRender(children)} />;
}

export interface PopoverContentProps
  extends Omit<Styled<typeof BasePopover.Popup>, "children"> {
  children?: React.ReactNode;
  side?: PopoverSide;
  align?: PopoverAlign;
  sideOffset?: number;
  /** Show the little arrow. Default `false`. */
  arrow?: boolean;
}

/**
 * Portal + positioner + the popup panel.
 *
 * Focus-move escape hatch: `initialFocus`/`finalFocus` pass straight through to
 * Base UI's `Popover.Popup` (already part of `PopoverContentProps` — no extra
 * wiring needed). Each accepts `false` (don't move focus at all — useful for a
 * hover-triggered popover where stealing focus reads as a flicker), a
 * `RefObject` to focus a specific element, or a function for more control.
 *
 *   <PopoverContent initialFocus={false} finalFocus={false}>…</PopoverContent>
 */
export function PopoverContent({
  className,
  children,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  arrow = false,
  ...rest
}: PopoverContentProps) {
  const sc = useSilicaClass();
  const portalContainer = usePortalContainer();
  return (
    <BasePopover.Portal container={portalContainer}>
      <BasePopover.Positioner side={side} align={align} sideOffset={sideOffset}>
        <BasePopover.Popup className={cx(sc("popover"), className)} {...rest}>
          {arrow && <BasePopover.Arrow className={cx(sc("popover-arrow"))} />}
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export function PopoverTitle({ className, ...rest }: Styled<typeof BasePopover.Title>) {
  const sc = useSilicaClass();
  return (
    <BasePopover.Title className={cx(sc("popover-title"), className)} {...rest} />
  );
}

export function PopoverDescription({
  className,
  ...rest
}: Styled<typeof BasePopover.Description>) {
  const sc = useSilicaClass();
  return (
    <BasePopover.Description
      className={cx(sc("popover-description"), className)}
      {...rest}
    />
  );
}
