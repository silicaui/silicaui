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

export type ToolbarSize = "sm" | "md" | "lg";
export type ToolbarVariant = "muted";
export type ToolbarDividers = "top" | "bottom" | "both";

export type ToolbarProps = Styled<typeof BaseToolbar.Root> & {
  /**
   * Bar height/padding/font-size. Cascades to the native `ToolbarButton`/
   * `ToolbarLink` parts for free (this module owns both ends of that CSS
   * variable chain); a plain `Button`/`Input` dropped into the bar still
   * needs its own explicit size class.
   */
  size?: ToolbarSize;
  /** `"muted"` gives the bar a tinted background for contextual/temporary use (e.g. a bulk-selection bar). */
  variant?: ToolbarVariant;
  /** Swaps the bar's full border box for a rule on just the given edge(s) — for embedding as a Card/Section header. */
  dividers?: ToolbarDividers;
};
export type ToolbarButtonProps = Styled<typeof BaseToolbar.Button>;
export type ToolbarGroupProps = Styled<typeof BaseToolbar.Group>;
export type ToolbarLinkProps = Styled<typeof BaseToolbar.Link>;
export type ToolbarSeparatorProps = Styled<typeof BaseToolbar.Separator>;
export type ToolbarCenterProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Silica Toolbar — a group of controls with roving arrow-key focus.
 *
 *   <Toolbar aria-label="Formatting">
 *     <ToolbarButton><BoldIcon /></ToolbarButton>
 *     <ToolbarButton><ItalicIcon /></ToolbarButton>
 *     <ToolbarSeparator />
 *     <ToolbarLink href="/help">Help</ToolbarLink>
 *   </Toolbar>
 *
 * For a start/center/end layout (e.g. centered tabs with actions on either
 * side), give the bar exactly 3 direct children — a start child, a
 * `<ToolbarCenter>`, and an end child:
 *
 *   <Toolbar aria-label="Section navigation">
 *     <ToolbarGroup>...</ToolbarGroup>
 *     <ToolbarCenter><ToolbarGroup>...tabs...</ToolbarGroup></ToolbarCenter>
 *     <ToolbarGroup>...</ToolbarGroup>
 *   </Toolbar>
 */
export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  function Toolbar({ className, size, variant, dividers, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <BaseToolbar.Root
        ref={ref}
        className={cx(sc("toolbar"), className)}
        data-size={size}
        data-variant={variant}
        data-dividers={dividers}
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

// Purely a layout region (the middle grid column), not a Base UI part — it
// carries no roving-focus semantics of its own; the Buttons/Links/Groups
// inside it still participate in the Toolbar Root's roving focus normally.
export const ToolbarCenter = React.forwardRef<HTMLDivElement, ToolbarCenterProps>(
  function ToolbarCenter({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div ref={ref} className={cx(sc("toolbar-center"), className)} {...rest} />
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
