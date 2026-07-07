import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type NavbarProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Silica Navbar — a top bar with optional start / center / end slots.
 *
 *   <Navbar>
 *     <NavbarStart><a className="text-lg font-bold">Silica</a></NavbarStart>
 *     <NavbarCenter>…nav links…</NavbarCenter>
 *     <NavbarEnd><Button>Sign in</Button></NavbarEnd>
 *   </Navbar>
 */
export const Navbar = React.forwardRef<HTMLDivElement, NavbarProps>(
  function Navbar({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("navbar"), className)} {...rest} />;
  },
);

export const NavbarStart = React.forwardRef<HTMLDivElement, NavbarProps>(
  function NavbarStart({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("navbar-start"), className)} {...rest} />;
  },
);

export const NavbarCenter = React.forwardRef<HTMLDivElement, NavbarProps>(
  function NavbarCenter({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("navbar-center"), className)} {...rest} />;
  },
);

export const NavbarEnd = React.forwardRef<HTMLDivElement, NavbarProps>(
  function NavbarEnd({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("navbar-end"), className)} {...rest} />;
  },
);
