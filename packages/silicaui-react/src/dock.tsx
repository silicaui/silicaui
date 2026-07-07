import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

export type DockColor = SilicaColor;

export interface DockProps extends React.HTMLAttributes<HTMLElement> {
  /** Accent color for the active item. Default primary. */
  color?: DockColor;
}

/**
 * Silica Dock — a bottom navigation bar of icon+label items.
 *
 *   <Dock className="fixed inset-x-0 bottom-0">
 *     <DockItem active><HomeIcon /><DockLabel>Home</DockLabel></DockItem>
 *     <DockItem><SearchIcon /><DockLabel>Search</DockLabel></DockItem>
 *     <DockItem><UserIcon /><DockLabel>Profile</DockLabel></DockItem>
 *   </Dock>
 */
export const Dock = React.forwardRef<HTMLElement, DockProps>(
  function Dock({ color, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <nav
        ref={ref}
        className={cx(sc("dock"), color && sc(`dock-${color}`), className)}
        {...rest}
      />
    );
  },
);

export interface DockItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Highlight this item as the current destination. */
  active?: boolean;
}

export const DockItem = React.forwardRef<HTMLButtonElement, DockItemProps>(
  function DockItem({ active, className, type = "button", ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <button
        ref={ref}
        type={type}
        aria-current={active ? "page" : undefined}
        className={cx(sc("dock-item"), active && sc("dock-item-active"), className)}
        {...rest}
      />
    );
  },
);

export type DockLabelProps = React.HTMLAttributes<HTMLSpanElement>;
export const DockLabel = React.forwardRef<HTMLSpanElement, DockLabelProps>(
  function DockLabel({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <span ref={ref} className={cx(sc("dock-label"), className)} {...rest} />;
  },
);
