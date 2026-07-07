import * as React from "react";
import { Tabs as BaseTabs } from "@base-ui-components/react/tabs";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

export type TabValue = React.ComponentProps<typeof BaseTabs.Tab>["value"];

/** Visual style. `underline` (default), `boxed` (segmented), or `pills`. */
export type TabsVariant = "underline" | "boxed" | "pills";

export type TabsColor = SilicaColor;

export interface TabsProps extends Styled<typeof BaseTabs.Root> {
  variant?: TabsVariant;
  /** Accent color (underline + pills fill); maps to `tabs-<color>`. Default primary. */
  color?: TabsColor;
}

/**
 * Silica Tabs — Base UI selection state + roving focus + a moving indicator.
 *
 *   <Tabs defaultValue="account" variant="boxed">
 *     <TabsList>
 *       <TabsTab value="account">Account</TabsTab>
 *       <TabsTab value="password">Password</TabsTab>
 *     </TabsList>
 *     <TabsPanel value="account">…</TabsPanel>
 *     <TabsPanel value="password">…</TabsPanel>
 *   </Tabs>
 *
 * The same sliding indicator styles per variant — an underline, or a full pill.
 */
export function Tabs({ variant = "underline", color, className, ...rest }: TabsProps) {
  const sc = useSilicaClass();
  return (
    <BaseTabs.Root
      className={cx(
        sc("tabs"),
        variant !== "underline" && sc(`tabs-${variant}`),
        color && sc(`tabs-${color}`),
        className,
      )}
      {...rest}
    />
  );
}

export interface TabsListProps extends Omit<Styled<typeof BaseTabs.List>, "children"> {
  children?: React.ReactNode;
  /** Render the moving underline indicator. Default `true`. */
  indicator?: boolean;
}

export function TabsList({ className, children, indicator = true, ...rest }: TabsListProps) {
  const sc = useSilicaClass();
  return (
    <BaseTabs.List className={cx(sc("tabs-list"), className)} {...rest}>
      {children}
      {indicator && <BaseTabs.Indicator className={cx(sc("tabs-indicator"))} />}
    </BaseTabs.List>
  );
}

export function TabsTab({ className, ...rest }: Styled<typeof BaseTabs.Tab>) {
  const sc = useSilicaClass();
  return <BaseTabs.Tab className={cx(sc("tabs-tab"), className)} {...rest} />;
}

export function TabsPanel({ className, ...rest }: Styled<typeof BaseTabs.Panel>) {
  const sc = useSilicaClass();
  return <BaseTabs.Panel className={cx(sc("tabs-panel"), className)} {...rest} />;
}
