import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

export type SidebarSide = "left" | "right";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export interface SidebarProviderProps {
  children: React.ReactNode;
  /** Controlled collapsed state. */
  collapsed?: boolean;
  /** Uncontrolled initial collapsed state. Default `false`. */
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

/**
 * Silica SidebarProvider — shares collapsed state between a `Sidebar` and any
 * `SidebarTrigger`, including a trigger rendered OUTSIDE the sidebar itself
 * (e.g. a hamburger button in the main content's own header). Wrap the whole
 * shell (sidebar + main content) in one provider.
 *
 *   <SidebarProvider>
 *     <Sidebar>…</Sidebar>
 *     <main><SidebarTrigger />…</main>
 *   </SidebarProvider>
 */
export function SidebarProvider({
  children,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
}: SidebarProviderProps) {
  const controlled = collapsed !== undefined;
  const [internal, setInternal] = React.useState(defaultCollapsed);
  const current = controlled ? (collapsed as boolean) : internal;

  const setCollapsed = React.useCallback(
    (next: boolean) => {
      if (!controlled) setInternal(next);
      onCollapsedChange?.(next);
    },
    [controlled, onCollapsedChange],
  );

  const ctx = React.useMemo<SidebarContextValue>(
    () => ({
      collapsed: current,
      setCollapsed,
      toggle: () => setCollapsed(!current),
    }),
    [current, setCollapsed],
  );

  return <SidebarContext.Provider value={ctx}>{children}</SidebarContext.Provider>;
}

/** Read the nearest `SidebarProvider`'s state, or `null` outside one. */
export function useSidebar(): SidebarContextValue | null {
  return React.useContext(SidebarContext);
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** Which edge the panel sits on. Default `left`. */
  side?: SidebarSide;
  /** Accent color for the active `SidebarItem`; maps to `sidebar-<color>`. */
  color?: SilicaColor;
  /**
   * Explicit collapsed override. When omitted, reads the ancestor
   * `SidebarProvider` (defaults to expanded if neither is present).
   */
  collapsed?: boolean;
}

/**
 * Silica Sidebar — a persistent layout nav panel, distinct from `Drawer` (which
 * overlays content and dismisses). A Sidebar never overlays: it collapses IN
 * PLACE to a narrow icon rail.
 *
 *   <Sidebar>
 *     <SidebarHeader>
 *       <SidebarHeaderBrand><Wordmark>Acme</Wordmark></SidebarHeaderBrand>
 *       <SidebarTrigger />
 *     </SidebarHeader>
 *     <SidebarContent>
 *       <SidebarGroup>
 *         <SidebarGroupLabel>Workspace</SidebarGroupLabel>
 *         <SidebarItem icon={<HomeIcon />} active>Dashboard</SidebarItem>
 *         <SidebarItem icon={<SettingsIcon />}>Settings</SidebarItem>
 *       </SidebarGroup>
 *     </SidebarContent>
 *   </Sidebar>
 */
export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  function Sidebar({ side = "left", color, collapsed, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const ctx = useSidebar();
    const isCollapsed = collapsed ?? ctx?.collapsed ?? false;
    return (
      <aside
        ref={ref as React.Ref<HTMLElement>}
        data-side={side !== "left" ? side : undefined}
        data-collapsed={isCollapsed || undefined}
        className={cx(sc("sidebar"), color && sc(`sidebar-${color}`), className)}
        {...rest}
      />
    );
  },
);

export type SidebarHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  function SidebarHeader({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("sidebar-header"), className)} {...rest} />;
  },
);

/** Wraps a logo/`Wordmark` inside `SidebarHeader`; auto-hides when collapsed. */
export type SidebarHeaderBrandProps = React.HTMLAttributes<HTMLDivElement>;
export const SidebarHeaderBrand = React.forwardRef<HTMLDivElement, SidebarHeaderBrandProps>(
  function SidebarHeaderBrand({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("sidebar-header-brand"), className)} {...rest} />;
  },
);

export type SidebarContentProps = React.HTMLAttributes<HTMLDivElement>;
export const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  function SidebarContent({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("sidebar-content"), className)} {...rest} />;
  },
);

export type SidebarFooterProps = React.HTMLAttributes<HTMLDivElement>;
export const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  function SidebarFooter({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("sidebar-footer"), className)} {...rest} />;
  },
);

export type SidebarGroupProps = React.HTMLAttributes<HTMLDivElement>;
export const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  function SidebarGroup({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("sidebar-group"), className)} {...rest} />;
  },
);

export type SidebarGroupLabelProps = React.HTMLAttributes<HTMLDivElement>;
export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, SidebarGroupLabelProps>(
  function SidebarGroupLabel({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("sidebar-group-label"), className)} {...rest} />;
  },
);

export interface SidebarItemProps extends Omit<React.HTMLAttributes<HTMLElement>, "color"> {
  /** Leading icon. */
  icon?: React.ReactNode;
  /** Trailing content (badge, chevron); hidden when collapsed. */
  trailing?: React.ReactNode;
  /** Highlights the row with the sidebar's accent color. */
  active?: boolean;
  disabled?: boolean;
  /** Render as a different element, typically `"a"` for real navigation. */
  as?: React.ElementType;
}

/** One nav row inside `SidebarContent`/`SidebarFooter` — icon + label + trailing. */
export const SidebarItem = React.forwardRef<HTMLElement, SidebarItemProps>(
  function SidebarItem(
    { icon, trailing, active, disabled, as, className, children, ...rest },
    ref,
  ) {
    const sc = useSilicaClass();
    const Tag = (as ?? "button") as React.ElementType;
    const extra = Tag === "button" ? { type: "button" as const } : {};
    return (
      <Tag
        ref={ref}
        data-active={active || undefined}
        data-disabled={disabled || undefined}
        aria-disabled={disabled || undefined}
        aria-current={active ? "page" : undefined}
        className={cx(sc("sidebar-item"), className)}
        {...extra}
        {...rest}
      >
        {icon != null && <span className={cx(sc("sidebar-item-icon"))}>{icon}</span>}
        <span className={cx(sc("sidebar-item-label"))}>{children}</span>
        {trailing != null && (
          <span className={cx(sc("sidebar-item-trailing"))}>{trailing}</span>
        )}
      </Tag>
    );
  },
);

const PanelLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </svg>
);

export interface SidebarTriggerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {}

/**
 * Silica SidebarTrigger — the sidebar's collapse/expand toggle. Must be used
 * within a `SidebarProvider` (it has no other way to reach the sidebar's
 * state), and can live inside the sidebar's own header or anywhere else in the
 * provider's subtree (e.g. a hamburger button in the main content).
 */
export const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  function SidebarTrigger({ onClick, children, className, "aria-label": ariaLabel, ...rest }, ref) {
    const sc = useSilicaClass();
    const ctx = useSidebar();
    if (!ctx) {
      throw new Error("SidebarTrigger must be used within a SidebarProvider.");
    }
    return (
      <button
        ref={ref}
        type="button"
        className={cx(sc("sidebar-trigger"), className)}
        aria-label={ariaLabel ?? (ctx.collapsed ? "Expand sidebar" : "Collapse sidebar")}
        aria-expanded={!ctx.collapsed}
        onClick={(e) => {
          ctx.toggle();
          onClick?.(e);
        }}
        {...rest}
      >
        {children ?? <PanelLeftIcon />}
      </button>
    );
  },
);
