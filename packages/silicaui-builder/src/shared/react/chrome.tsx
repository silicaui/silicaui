/**
 * Chrome primitives shared by BOTH builder shells (site `Builder.tsx` and
 * email `EmailBuilder.tsx`) — a mode/tab toggle item and a rail section
 * header bar. Kept here (not duplicated per-builder) so a chrome tweak to
 * one applies to both automatically instead of silently drifting apart.
 */
import * as React from "react";
import { Button, Tabs, TabsList, TabsPanel, TabsTab, ToggleGroupItem } from "@wizeworks/silicaui-react";
import { Icon } from "./Icon";
import { Hint, IconButton } from "./Hint";
import type { IconName } from "../icons";

/** Toggle item with a leading icon — a flex row so icon + label align. */
export function IconItem({
  value,
  icon: name,
  className,
  children,
}: {
  value: string;
  icon: IconName;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ToggleGroupItem value={value} className={className}>
      <span className="inline-flex items-center justify-center gap-1.5">
        <Icon name={name} /> {children}
      </span>
    </ToggleGroupItem>
  );
}

/**
 * One item in the STATUS BAR — the shape a host's `statusBarSlot` content should
 * take, in both shells.
 *
 * The strip's rule is that everything in it is a FACT about the session, never a
 * control. That rule was written one case too broad. A status item that reveals
 * its OWN detail — clicking "3 broken" to see which three — is not a new action;
 * it is reading the same fact at more depth, which is what every status bar in
 * every IDE does. What the rule is really protecting against is a 28px strip
 * turning into a second toolbar: something that SENDS, saves, publishes or
 * navigates away belongs in `toolbarSlot`, beside Publish, where a person looks
 * for actions.
 *
 * So the affordance is deliberately narrow rather than a free `<button>`:
 *
 *  - No `onClick` renders a plain `<span>` — no tab stop, no hover, identical to
 *    the engine's own `mode`/`device` labels, which is what most status is.
 *  - With `onClick` it becomes a ghost `btn-xs` — 24px inside a 28px strip, so
 *    the row height never moves — carrying `aria-expanded`/`aria-controls` when
 *    `expanded` is passed, because a disclosure that doesn't say it is a
 *    disclosure is just a mystery target for anyone not using a mouse.
 *
 * `expanded` is what keeps this honest: an item that has no disclosed panel to
 * point at is an action wearing a status item's clothes, and it should be a
 * toolbar button instead.
 */
export function StatusItem({
  onClick,
  expanded,
  controls,
  title,
  className = "",
  children,
  ...rest
}: {
  /** Makes the item a disclosure. Omit for plain status. */
  onClick?: () => void;
  /** Whether the detail this item reveals is currently open. */
  expanded?: boolean;
  /** `id` of the element it reveals, for `aria-controls`. */
  controls?: string;
  title?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<"span">, "onClick" | "title" | "className" | "children">) {
  if (!onClick) {
    return (
      <span className={className} title={title} {...rest}>
        {children}
      </span>
    );
  }
  // Interactive, so `title` becomes a real tooltip rather than the native
  // attribute — same rule as every other control in the chrome. (The
  // non-interactive branch above keeps `title`: it's a plain `<span>`, not a
  // control, and giving unfocusable text a hover-only popup would hide it from
  // anyone not using a mouse.)
  return (
    <Hint label={title} side="top">
      <Button
        type="button"
        size="xs"
        variant="ghost"
        // `font-normal`: it is still status, and a status bar that bolds one fact
        // because it happens to be clickable has made clickability the hierarchy.
        className={`h-6 font-normal ${className}`}
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onClick}
        {...rest}
      >
        {children}
      </Button>
    </Hint>
  );
}

/** A panel header bar (left/right rails). `theme` tints it for the site
 *  builder's Theme mode; email never passes it. */
export function PanelHead({ children, theme }: { children: React.ReactNode; theme?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 h-10 flex-none px-3.5 border-b border-base-200 text-sm font-semibold ${
        theme ? "bg-linear-to-r from-primary/12 to-transparent" : ""
      }`}
    >
      {children}
    </div>
  );
}

/** One tab in a `PanelTabs` strip. */
export interface PanelTabSpec {
  id: string;
  label: string;
  icon?: IconName;
}

/** How close to an edge still counts as "at the end" — sub-pixel scroll offsets
 *  are routine at fractional zoom / rail widths, so an exact `0` comparison
 *  leaves the paging button enabled with nowhere left to go. */
const SCROLL_EPSILON = 2;

/**
 * A panel header made OF its tabs — the rail's header bar and its tab strip are
 * the same 40px row, not one stacked on the other. This is the header for a rail
 * whose whole identity is "which tab is open"; a rail with a fixed title uses
 * `PanelHead`.
 *
 * These are FIRST-LEVEL tabs, so they use the `underline` Tabs variant, not a
 * segmented pill. The distinction is not decoration: a pill is a *mode switch*
 * — a set of options where one is armed, and it reads as a control sitting on a
 * surface. A first-level tab is a *page* of the panel, and the underline strip
 * says so structurally — the list carries the baseline rule, the active tab's
 * indicator sits ON that rule, and the tab therefore reads as continuous with
 * the content below it rather than as a button floating above it. The rail's
 * segmented controls (Editing / All sizes / Tablet, size and weight chips) stay
 * pills precisely because they ARE mode switches; using the same shape for both
 * levels is what made the tabs read as one more row of chips.
 *
 * It owns the panel body as well as the strip (`children`), for the same reason:
 * tabs that don't contain anything aren't tabs. That also makes the ARIA real —
 * Base UI wires `role="tablist"`/`role="tab"` and points each `aria-controls` at
 * a panel that actually exists.
 *
 * The strip is scrollable and its scrollbar is hidden, because a horizontal
 * scrollbar inside a 40px header is both ugly and a poor target. Paging is done
 * with real circle buttons that TAKE LAYOUT SPACE beside the strip rather than
 * floating over the end tabs — an overlay would obscure the very tab you are
 * trying to read, and hide that there is anything more to reach. They mount only
 * when the strip actually overflows, so the common two-tab case is unchanged.
 * (Same trade the Carousel makes: hidden scrollbar + explicit controls, with
 * touch/trackpad swipe still working.)
 */
export function PanelTabs({
  tabs,
  value,
  onValueChange,
  ariaLabel,
  testIdPrefix = "inspector-tab",
  actions,
  children,
}: {
  tabs: readonly PanelTabSpec[];
  value: string;
  onValueChange: (id: string) => void;
  ariaLabel: string;
  /** Test-id namespace for the tabs (`<prefix>-<id>`); one strip per rail. */
  testIdPrefix?: string;
  /** A filter that applies TO the open tab (e.g. the layer-depth toggle) — it
   *  sits with the tab it modifies, off the end of the strip, rather than
   *  spending a second 40px row on a control most people set once. Actions that
   *  belong to the CONTENT (add, rename, delete) go in the body, not here. */
  actions?: React.ReactNode;
  /** The active tab's body — the rest of the rail, below the strip. */
  children: React.ReactNode;
}) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = React.useState({ left: false, right: false });

  const measure = React.useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflow({
      left: el.scrollLeft > SCROLL_EPSILON,
      right: max > SCROLL_EPSILON && el.scrollLeft < max - SCROLL_EPSILON,
    });
  }, []);

  // Re-measure on rail resize AND on the strip's own content changing — a host
  // tab appearing for the newly-selected node changes `scrollWidth` without any
  // resize of the scroller itself, which a ResizeObserver on the box would miss.
  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [measure, tabs.length]);

  // Keep the active tab reachable: selecting one that is scrolled out of view
  // (via keyboard roving focus, or a tab list that changed under the selection)
  // brings it back rather than leaving the strip looking empty-handed.
  React.useEffect(() => {
    const el = scroller.current;
    const active = el?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(value)}"]`);
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [value]);

  const page = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    // 80% of a screenful, so a partly-visible tab at the edge stays on screen
    // as an anchor instead of jumping clean past it.
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const paging = overflow.left || overflow.right;

  return (
    <Tabs
      value={value}
      onValueChange={(v) => typeof v === "string" && onValueChange(v)}
      className="flex flex-1 min-h-0 flex-col"
    >
      {/* The rule lives on this row, not on `tabs-list`, so it runs the full
          width of the rail — including behind the paging buttons. A rule that
          stopped where the scroller stops would read as a broken edge. */}
      <div className="flex items-stretch gap-1 h-10 flex-none px-1.5 border-b border-base-300">
        {paging && <PageButton dir={-1} disabled={!overflow.left} onClick={() => page(-1)} />}
        <div
          ref={scroller}
          onScroll={measure}
          className="flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Tabs sit at their natural width, left-aligned — a page tab is as
              wide as its name, and the rule simply continues past the last one.
              (Stretching them edge-to-edge is pill behavior, and reads as a
              segmented control again no matter what the indicator does.)
              `border-b-0`: the row above owns the rule; `h-full` keeps the
              indicator landing exactly on it. */}
          <TabsList aria-label={ariaLabel} className="h-full items-stretch border-b-0 gap-0">
            {tabs.map((t) => (
              <TabsTab
                key={t.id}
                value={t.id}
                data-tab-id={t.id}
                data-testid={`${testIdPrefix}-${t.id}`}
                className="whitespace-nowrap px-3"
              >
                <span className="inline-flex items-center gap-1.5">
                  {t.icon && <Icon name={t.icon} />} {t.label}
                </span>
              </TabsTab>
            ))}
          </TabsList>
        </div>
        {paging && <PageButton dir={1} disabled={!overflow.right} onClick={() => page(1)} />}
        {actions && <div className="flex items-center gap-1 flex-none self-center">{actions}</div>}
      </div>

      {/* One panel, always matching the active tab — the body is rendered by the
          caller, so there is nothing to gain from mounting N of them. `pt-0`
          drops the component's default top padding: this panel is a whole rail,
          not a block of prose under a tab. */}
      <TabsPanel value={value} className="flex flex-1 min-h-0 flex-col pt-0">
        {children}
      </TabsPanel>
    </Tabs>
  );
}

function PageButton({
  dir,
  disabled,
  onClick,
}: {
  dir: -1 | 1;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <IconButton
      icon={dir === -1 ? "chevronLeft" : "chevron"}
      label={dir === -1 ? "Scroll tabs left" : "Scroll tabs right"}
      // `bottom`: these sit in a 40px header at the top of a rail, where a
      // top-side tooltip would cover the tab strip it's describing.
      side="bottom"
      shape="circle"
      className="flex-none"
      disabled={disabled}
      onClick={onClick}
    />
  );
}
