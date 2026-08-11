import * as React from "react";
import { Tabs as BaseTabs } from "@base-ui-components/react/tabs";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { useScrollStrip } from "./lib/use-scroll-strip";
import { ScrollStripControl } from "./scroll-strip";
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
  /**
   * Say so when tabs don't fit, instead of letting them fall off the edge.
   * Default `true`.
   *
   * A tab strip is the canonical case for this: `overflow-x` alone leaves the
   * last tabs reachable but unannounced, and on an overlay-scrollbar platform
   * nothing at all is drawn — so from the operator's side those tabs simply do
   * not exist. When on, the list is wrapped in a `ScrollStrip` and gains
   * in-flow prev/next controls the moment a tab is clipped.
   *
   * Note the layout consequence, which is inherent rather than incidental: an
   * `inline-flex` list shrink-wraps its content and therefore can NEVER detect
   * that it overflows. A scrollable list must be constrained by its parent, so
   * the wrapper is block-level and fills the available width. The tabs
   * themselves still shrink-wrap and stay left-aligned. Pass `false` for a
   * strip that must shrink-wrap its own box (e.g. sitting inline beside other
   * controls) and accept that overflowing tabs go unannounced.
   */
  scrollable?: boolean;
  /** Plural noun naming the scroll controls. Default `tabs`. */
  scrollLabel?: string;
}

export function TabsList({
  className,
  children,
  indicator = true,
  scrollable = true,
  scrollLabel = "tabs",
  ...rest
}: TabsListProps) {
  const sc = useSilicaClass();
  // 0.8 of a screenful, matching ScrollStrip — the sliver of overlap is what
  // makes it read as the strip moving rather than jumping somewhere new.
  const strip = useScrollStrip(0.8, children);

  const list = (
    <BaseTabs.List
      // Base UI forwards `ref` to the real element; when scrollable, the list
      // IS the scroller (rather than a div wrapped around it) so the moving
      // indicator keeps measuring against the same box it always did.
      ref={scrollable ? (strip.ref as React.Ref<HTMLDivElement>) : undefined}
      className={cx(sc("tabs-list"), scrollable && sc("tabs-list-scroll"), className)}
      onScroll={scrollable ? strip.measure : undefined}
      {...rest}
    >
      {children}
      {indicator && <BaseTabs.Indicator className={cx(sc("tabs-indicator"))} />}
    </BaseTabs.List>
  );

  if (!scrollable) return list;

  const showControls = strip.overflows;
  return (
    <div
      className={cx(sc("scroll-strip"), sc("tabs-scroller"))}
      data-at-start={strip.atStart || undefined}
      data-at-end={strip.atEnd || undefined}
    >
      {showControls && <ScrollStripControl direction={-1} label={scrollLabel} strip={strip} />}
      {list}
      {showControls && <ScrollStripControl direction={1} label={scrollLabel} strip={strip} />}
    </div>
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
