import * as React from "react";
import { Menubar as BaseMenubar } from "@base-ui-components/react/menubar";
import { Menu as BaseMenu } from "@base-ui-components/react/menu";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

type PositionerProps = React.ComponentProps<typeof BaseMenu.Positioner>;
export type MenubarSide = NonNullable<PositionerProps["side"]>;
export type MenubarAlign = NonNullable<PositionerProps["align"]>;

export type MenubarProps = Styled<typeof BaseMenubar>;

/**
 * Silica Menubar — a bar of menus (File / Edit / View …). Behavior from Base UI
 * (arrow between menus, hover to switch once open, roving focus). Each menu is a
 * `MenubarMenu`; its popup reuses the shared `.dropdown*` surface.
 *
 *   <Menubar>
 *     <MenubarMenu>
 *       <MenubarTrigger>File</MenubarTrigger>
 *       <MenubarContent>
 *         <MenubarItem>New</MenubarItem>
 *         <MenubarSeparator />
 *         <MenubarItem>Exit</MenubarItem>
 *       </MenubarContent>
 *     </MenubarMenu>
 *   </Menubar>
 */
export const Menubar = React.forwardRef<HTMLDivElement, MenubarProps>(
  function Menubar({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <BaseMenubar ref={ref} className={cx(sc("menubar"), className)} {...rest} />
    );
  },
);

/** A single menu within the bar. */
export const MenubarMenu = BaseMenu.Root;

export type MenubarTriggerProps = Styled<typeof BaseMenu.Trigger>;

export const MenubarTrigger = React.forwardRef<
  HTMLButtonElement,
  MenubarTriggerProps
>(function MenubarTrigger({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <BaseMenu.Trigger
      ref={ref}
      className={cx(sc("menubar-trigger"), className)}
      {...rest}
    />
  );
});

export interface MenubarContentProps
  extends Omit<Styled<typeof BaseMenu.Popup>, "children"> {
  children?: React.ReactNode;
  side?: MenubarSide;
  align?: MenubarAlign;
  sideOffset?: number;
}

/** Portal + positioner + the menu popup (shared dropdown surface). */
export function MenubarContent({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  ...rest
}: MenubarContentProps) {
  const sc = useSilicaClass();
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset}>
        <BaseMenu.Popup className={cx(sc("dropdown"), className)} {...rest}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function MenubarItem({
  className,
  ...rest
}: Styled<typeof BaseMenu.Item>) {
  const sc = useSilicaClass();
  return (
    <BaseMenu.Item className={cx(sc("dropdown-item"), className)} {...rest} />
  );
}

export function MenubarSeparator({
  className,
  ...rest
}: Styled<typeof BaseMenu.Separator>) {
  const sc = useSilicaClass();
  return (
    <BaseMenu.Separator
      className={cx(sc("dropdown-separator"), className)}
      {...rest}
    />
  );
}

export function MenubarGroup(
  props: React.ComponentProps<typeof BaseMenu.Group>,
) {
  return <BaseMenu.Group {...props} />;
}

export function MenubarLabel({
  className,
  ...rest
}: Styled<typeof BaseMenu.GroupLabel>) {
  const sc = useSilicaClass();
  return (
    <BaseMenu.GroupLabel
      className={cx(sc("dropdown-label"), className)}
      {...rest}
    />
  );
}
