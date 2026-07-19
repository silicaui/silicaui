import * as React from "react";
import { NavigationMenu as BaseNav } from "@base-ui-components/react/navigation-menu";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { usePortalContainer } from "./portal-container";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

type PositionerProps = React.ComponentProps<typeof BaseNav.Positioner>;
export type NavigationMenuSide = NonNullable<PositionerProps["side"]>;
export type NavigationMenuAlign = NonNullable<PositionerProps["align"]>;

export interface NavigationMenuProps
  extends Omit<Styled<typeof BaseNav.Root>, "children"> {
  children?: React.ReactNode;
  /** Preferred side for the dropdown panel. Default `bottom`. */
  side?: NavigationMenuSide;
  /** Alignment. Default `center`. */
  align?: NavigationMenuAlign;
  /** Gap between the bar and the panel, in px. Default `8`. */
  sideOffset?: number;
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Silica NavigationMenu — a site-nav bar with rich dropdown panels (mega menu).
 * Behavior from Base UI (shared animated viewport that resizes between panels);
 * look from Silica.
 *
 *   <NavigationMenu>
 *     <NavigationMenuItem>
 *       <NavigationMenuTrigger>Products</NavigationMenuTrigger>
 *       <NavigationMenuContent>
 *         <ul className="grid gap-1">…</ul>
 *       </NavigationMenuContent>
 *     </NavigationMenuItem>
 *     <NavigationMenuItem>
 *       <NavigationMenuLink href="/pricing">Pricing</NavigationMenuLink>
 *     </NavigationMenuItem>
 *   </NavigationMenu>
 */
export function NavigationMenu({
  children,
  className,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  ...rest
}: NavigationMenuProps) {
  const sc = useSilicaClass();
  const portalContainer = usePortalContainer();
  return (
    <BaseNav.Root className={cx(sc("navigation-menu"), className)} {...rest}>
      <BaseNav.List className={cx(sc("navigation-menu-list"))}>
        {children}
      </BaseNav.List>
      <BaseNav.Portal container={portalContainer}>
        <BaseNav.Positioner
          className={cx(sc("navigation-menu-positioner"))}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BaseNav.Popup className={cx(sc("navigation-menu-popup"))}>
            <BaseNav.Viewport
              className={cx(sc("navigation-menu-viewport"))}
            />
          </BaseNav.Popup>
        </BaseNav.Positioner>
      </BaseNav.Portal>
    </BaseNav.Root>
  );
}

export type NavigationMenuItemProps = Styled<typeof BaseNav.Item>;

/** A bar item — holds either a Trigger + Content, or a Link. */
export const NavigationMenuItem = React.forwardRef<
  React.ComponentRef<typeof BaseNav.Item>,
  NavigationMenuItemProps
>(function NavigationMenuItem({ className, ...rest }, ref) {
  return <BaseNav.Item ref={ref} className={className} {...rest} />;
});

export type NavigationMenuTriggerProps = Styled<typeof BaseNav.Trigger>;

/** Opens this item's panel; carries an auto-rotating chevron. */
export const NavigationMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  NavigationMenuTriggerProps
>(function NavigationMenuTrigger({ className, children, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <BaseNav.Trigger
      ref={ref}
      className={cx(sc("navigation-menu-trigger"), className)}
      {...rest}
    >
      {children}
      <BaseNav.Icon className={cx(sc("navigation-menu-icon"))}>
        <ChevronDown />
      </BaseNav.Icon>
    </BaseNav.Trigger>
  );
});

export type NavigationMenuContentProps = Styled<typeof BaseNav.Content>;

/** The dropdown panel for an item (teleported into the shared viewport). */
export const NavigationMenuContent = React.forwardRef<
  HTMLDivElement,
  NavigationMenuContentProps
>(function NavigationMenuContent({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <BaseNav.Content
      ref={ref}
      className={cx(sc("navigation-menu-content"), className)}
      {...rest}
    />
  );
});

export type NavigationMenuLinkProps = Styled<typeof BaseNav.Link>;

/** A plain bar link (no panel). */
export const NavigationMenuLink = React.forwardRef<
  HTMLAnchorElement,
  NavigationMenuLinkProps
>(function NavigationMenuLink({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <BaseNav.Link
      ref={ref}
      className={cx(sc("navigation-menu-link"), className)}
      {...rest}
    />
  );
});
