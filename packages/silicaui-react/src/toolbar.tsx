import * as React from "react";
import { Toolbar as BaseToolbar } from "@base-ui-components/react/toolbar";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

// Narrow Base UI's `className` (which also allows a function) to a string so it
// composes with cx().
type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

export type ToolbarProps = Styled<typeof BaseToolbar.Root>;
export type ToolbarButtonProps = Styled<typeof BaseToolbar.Button>;
export type ToolbarGroupProps = Styled<typeof BaseToolbar.Group>;
export type ToolbarLinkProps = Styled<typeof BaseToolbar.Link>;
export type ToolbarSeparatorProps = Styled<typeof BaseToolbar.Separator>;

/**
 * Silica Toolbar — a group of controls with roving arrow-key focus.
 *
 *   <Toolbar aria-label="Formatting">
 *     <ToolbarButton><BoldIcon /></ToolbarButton>
 *     <ToolbarButton><ItalicIcon /></ToolbarButton>
 *     <ToolbarSeparator />
 *     <ToolbarLink href="/help">Help</ToolbarLink>
 *   </Toolbar>
 */
export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  function Toolbar({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <BaseToolbar.Root
        ref={ref}
        className={cx(sc("toolbar"), className)}
        {...rest}
      />
    );
  },
);

export const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps
>(function ToolbarButton({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <BaseToolbar.Button
      ref={ref}
      className={cx(sc("toolbar-button"), className)}
      {...rest}
    />
  );
});

export const ToolbarGroup = React.forwardRef<HTMLDivElement, ToolbarGroupProps>(
  function ToolbarGroup({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <BaseToolbar.Group
        ref={ref}
        className={cx(sc("toolbar-group"), className)}
        {...rest}
      />
    );
  },
);

export const ToolbarLink = React.forwardRef<HTMLAnchorElement, ToolbarLinkProps>(
  function ToolbarLink({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <BaseToolbar.Link
        ref={ref}
        className={cx(sc("toolbar-link"), className)}
        {...rest}
      />
    );
  },
);

export const ToolbarSeparator = React.forwardRef<
  HTMLDivElement,
  ToolbarSeparatorProps
>(function ToolbarSeparator({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <BaseToolbar.Separator
      ref={ref}
      className={cx(sc("toolbar-separator"), className)}
      {...rest}
    />
  );
});
