import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type AppShellProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Silica AppShell — the outer page skeleton (one CSS Grid, named areas).
 * Render whichever slots you need — `AppShellSidebar`/`AppShellHeader`/
 * `AppShellFooter` are all optional; an unrendered slot's area collapses to
 * zero size, so the SAME AppShell covers "sidebar+top+footer", "top+footer",
 * "sidebar only", etc. `AppShellMain` is the one required slot.
 *
 *   <AppShell>
 *     <AppShellSidebar><Sidebar>…</Sidebar></AppShellSidebar>
 *     <AppShellHeader><Navbar>…</Navbar></AppShellHeader>
 *     <AppShellMain>…page content…</AppShellMain>
 *     <AppShellFooter><Footer>…</Footer></AppShellFooter>
 *   </AppShell>
 *
 *   // top + footer only, no sidebar:
 *   <AppShell>
 *     <AppShellHeader><Navbar>…</Navbar></AppShellHeader>
 *     <AppShellMain>…</AppShellMain>
 *     <AppShellFooter><Footer>…</Footer></AppShellFooter>
 *   </AppShell>
 */
export const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  function AppShell({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("app-shell"), className)} {...rest} />;
  },
);

export type AppShellSidebarProps = React.HTMLAttributes<HTMLDivElement>;

/** The sidebar slot — put a `Sidebar` (or anything) inside. */
export const AppShellSidebar = React.forwardRef<HTMLDivElement, AppShellSidebarProps>(
  function AppShellSidebar({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("app-shell-sidebar"), className)} {...rest} />;
  },
);

export type AppShellHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/** The header slot — put a `Navbar` (or anything) inside. */
export const AppShellHeader = React.forwardRef<HTMLDivElement, AppShellHeaderProps>(
  function AppShellHeader({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("app-shell-header"), className)} {...rest} />;
  },
);

export type AppShellMainProps = React.HTMLAttributes<HTMLDivElement>;

/** The main content slot — the one required part of an `AppShell`; scrolls independently. */
export const AppShellMain = React.forwardRef<HTMLDivElement, AppShellMainProps>(
  function AppShellMain({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <main ref={ref} className={cx(sc("app-shell-main"), className)} {...rest} />;
  },
);

export type AppShellFooterProps = React.HTMLAttributes<HTMLDivElement>;

/** The footer slot — put a `Footer` (or anything) inside. */
export const AppShellFooter = React.forwardRef<HTMLDivElement, AppShellFooterProps>(
  function AppShellFooter({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("app-shell-footer"), className)} {...rest} />;
  },
);
