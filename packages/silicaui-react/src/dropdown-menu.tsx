import * as React from "react";
import { Menu as BaseMenu } from "@base-ui-components/react/menu";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { usePortalContainer } from "./portal-container";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

const asRender = (el: React.ReactElement) =>
  el as React.ReactElement<Record<string, unknown>>;

type PositionerProps = React.ComponentProps<typeof BaseMenu.Positioner>;
export type DropdownMenuSide = NonNullable<PositionerProps["side"]>;
export type DropdownMenuAlign = NonNullable<PositionerProps["align"]>;

export type DropdownMenuProps = React.ComponentProps<typeof BaseMenu.Root>;

/**
 * Silica Dropdown Menu — a command menu (Base UI: roving focus, typeahead,
 * dismissal). Distinct from the static `Menu` nav-list.
 *
 *   <DropdownMenu>
 *     <DropdownMenuTrigger><Button variant="outline">Options</Button></DropdownMenuTrigger>
 *     <DropdownMenuContent>
 *       <DropdownMenuLabel>Actions</DropdownMenuLabel>
 *       <DropdownMenuItem onClick={…}>Edit</DropdownMenuItem>
 *       <DropdownMenuItem onClick={…}>Duplicate</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem disabled>Archive</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 */
export const DropdownMenu = BaseMenu.Root;

export function DropdownMenuTrigger({ children }: { children: React.ReactElement }) {
  return <BaseMenu.Trigger render={asRender(children)} />;
}

export interface DropdownMenuContentProps
  extends Omit<Styled<typeof BaseMenu.Popup>, "children"> {
  children?: React.ReactNode;
  side?: DropdownMenuSide;
  align?: DropdownMenuAlign;
  sideOffset?: number;
}

/** Portal + positioner + the menu popup. */
export function DropdownMenuContent({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  ...rest
}: DropdownMenuContentProps) {
  const sc = useSilicaClass();
  const portalContainer = usePortalContainer();
  return (
    <BaseMenu.Portal container={portalContainer}>
      <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset}>
        <BaseMenu.Popup className={cx(sc("dropdown"), className)} {...rest}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function DropdownMenuItem({ className, ...rest }: Styled<typeof BaseMenu.Item>) {
  const sc = useSilicaClass();
  return <BaseMenu.Item className={cx(sc("dropdown-item"), className)} {...rest} />;
}

export function DropdownMenuSeparator({
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

export function DropdownMenuGroup(props: React.ComponentProps<typeof BaseMenu.Group>) {
  return <BaseMenu.Group {...props} />;
}

export function DropdownMenuLabel({
  className,
  ...rest
}: Styled<typeof BaseMenu.GroupLabel>) {
  const sc = useSilicaClass();
  return (
    <BaseMenu.GroupLabel className={cx(sc("dropdown-label"), className)} {...rest} />
  );
}
