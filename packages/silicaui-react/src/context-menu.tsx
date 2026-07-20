import * as React from "react";
import { ContextMenu as BaseContextMenu } from "@base-ui-components/react/context-menu";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { usePortalContainer } from "./portal-container";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

export type ContextMenuProps = React.ComponentProps<typeof BaseContextMenu.Root>;

/**
 * Silica ContextMenu — a right-click menu. Behavior from Base UI (opens at the
 * pointer, roving focus, typeahead, dismissal); its popup reuses the shared
 * `.dropdown*` surface.
 *
 *   <ContextMenu>
 *     <ContextMenuTrigger className="grid h-40 place-items-center rounded-box border border-dashed">
 *       Right-click here
 *     </ContextMenuTrigger>
 *     <ContextMenuContent>
 *       <ContextMenuGroup>
 *         <ContextMenuLabel>Actions</ContextMenuLabel>
 *         <ContextMenuItem>Cut</ContextMenuItem>
 *         <ContextMenuItem>Copy</ContextMenuItem>
 *       </ContextMenuGroup>
 *       <ContextMenuSeparator />
 *       <ContextMenuItem disabled>Paste</ContextMenuItem>
 *     </ContextMenuContent>
 *   </ContextMenu>
 */
export const ContextMenu = BaseContextMenu.Root;

export type ContextMenuTriggerProps = Styled<typeof BaseContextMenu.Trigger>;

/** The right-click area. */
export const ContextMenuTrigger = React.forwardRef<
  HTMLDivElement,
  ContextMenuTriggerProps
>(function ContextMenuTrigger({ className, ...rest }, ref) {
  return <BaseContextMenu.Trigger ref={ref} className={className} {...rest} />;
});

export interface ContextMenuContentProps
  extends Omit<Styled<typeof BaseContextMenu.Popup>, "children"> {
  children?: React.ReactNode;
}

/** Portal + positioner + the menu popup (shared dropdown surface). */
export function ContextMenuContent({
  className,
  children,
  ...rest
}: ContextMenuContentProps) {
  const sc = useSilicaClass();
  const portalContainer = usePortalContainer();
  return (
    <BaseContextMenu.Portal container={portalContainer}>
      <BaseContextMenu.Positioner>
        <BaseContextMenu.Popup className={cx(sc("dropdown"), className)} {...rest}>
          {children}
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}

export function ContextMenuItem({
  className,
  ...rest
}: Styled<typeof BaseContextMenu.Item>) {
  const sc = useSilicaClass();
  return (
    <BaseContextMenu.Item
      className={cx(sc("dropdown-item"), className)}
      {...rest}
    />
  );
}

export function ContextMenuSeparator({
  className,
  ...rest
}: Styled<typeof BaseContextMenu.Separator>) {
  const sc = useSilicaClass();
  return (
    <BaseContextMenu.Separator
      className={cx(sc("dropdown-separator"), className)}
      {...rest}
    />
  );
}

export function ContextMenuGroup(
  props: React.ComponentProps<typeof BaseContextMenu.Group>,
) {
  return <BaseContextMenu.Group {...props} />;
}

export function ContextMenuLabel({
  className,
  ...rest
}: Styled<typeof BaseContextMenu.GroupLabel>) {
  const sc = useSilicaClass();
  return (
    <BaseContextMenu.GroupLabel
      className={cx(sc("dropdown-label"), className)}
      {...rest}
    />
  );
}
