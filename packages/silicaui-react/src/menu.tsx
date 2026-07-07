import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface MenuProps extends React.HTMLAttributes<HTMLUListElement> {}

/**
 * Silica Menu — a styled list of links/actions.
 *
 *   <Menu>
 *     <MenuTitle>Workspace</MenuTitle>
 *     <MenuItem><a href="/" aria-current="page">Overview</a></MenuItem>
 *     <MenuItem><a href="/team">Team</a></MenuItem>
 *     <MenuItem><button type="button">Sign out</button></MenuItem>
 *   </Menu>
 */
export const Menu = React.forwardRef<HTMLUListElement, MenuProps>(
  function Menu({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <ul ref={ref} className={cx(sc("menu"), className)} {...rest} />;
  },
);

/** A single item row — wraps an `<a>` or `<button>`. */
export const MenuItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(function MenuItem({ className, ...rest }, ref) {
  return <li ref={ref} className={className} {...rest} />;
});

/** A muted section label between items. */
export const MenuTitle = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(function MenuTitle({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <li ref={ref} className={cx(sc("menu-title"), className)} {...rest} />
  );
});
