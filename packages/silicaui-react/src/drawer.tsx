import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

const asRender = (el: React.ReactElement) =>
  el as React.ReactElement<Record<string, unknown>>;

export type DrawerSide = "left" | "right" | "top" | "bottom";
export type DrawerProps = React.ComponentProps<typeof BaseDialog.Root>;

/**
 * Silica Drawer — a panel that slides in from an edge (Base UI Dialog behavior).
 *
 *   <Drawer>
 *     <DrawerTrigger><Button>Menu</Button></DrawerTrigger>
 *     <DrawerContent side="left">
 *       <DrawerTitle>Navigation</DrawerTitle>
 *       <nav>…</nav>
 *       <DrawerClose><Button variant="ghost">Close</Button></DrawerClose>
 *     </DrawerContent>
 *   </Drawer>
 */
export const Drawer = BaseDialog.Root;

export function DrawerTrigger({ children }: { children: React.ReactElement }) {
  return <BaseDialog.Trigger render={asRender(children)} />;
}

export function DrawerClose({ children }: { children: React.ReactElement }) {
  return <BaseDialog.Close render={asRender(children)} />;
}

export interface DrawerContentProps
  extends Omit<Styled<typeof BaseDialog.Popup>, "children"> {
  children?: React.ReactNode;
  /** Edge the drawer slides from. Default `left`. */
  side?: DrawerSide;
  /** Class for the backdrop layer. */
  backdropClassName?: string;
}

/** Portals + backdrop + the edge-pinned sliding panel in one. */
export function DrawerContent({
  side = "left",
  className,
  backdropClassName,
  children,
  ...rest
}: DrawerContentProps) {
  const sc = useSilicaClass();
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={cx(sc("drawer-backdrop"), backdropClassName)} />
      <BaseDialog.Popup
        data-side={side}
        className={cx(sc("drawer-popup"), className)}
        {...rest}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DrawerTitle({ className, ...rest }: Styled<typeof BaseDialog.Title>) {
  const sc = useSilicaClass();
  return <BaseDialog.Title className={cx(sc("drawer-title"), className)} {...rest} />;
}

export function DrawerDescription({
  className,
  ...rest
}: Styled<typeof BaseDialog.Description>) {
  const sc = useSilicaClass();
  return (
    <BaseDialog.Description
      className={cx(sc("drawer-description"), className)}
      {...rest}
    />
  );
}
