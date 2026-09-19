"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  AppShell,
  AppShellSidebar,
  AppShellHeader,
  AppShellMain,
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarHeaderBrand,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  SidebarTrigger,
  Navbar,
  NavbarStart,
  NavbarEnd,
  Drawer,
  DrawerContent,
  DrawerTitle,
  Button,
  ThemeController,
  Wordmark,
} from "@wizeworks/silicaui-react";

const BoxIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
    <path d="M3 8l9 5 9-5" />
    <path d="M12 13v8" />
  </svg>
);
const StampIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21h14" />
    <path d="M6 17h12v2H6z" />
    <path d="M9 17V9a3 3 0 1 1 6 0v8" />
  </svg>
);
const UsersIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 6a3 3 0 0 1 0 6" />
    <path d="M18 20a6 6 0 0 0-2-4.5" />
  </svg>
);
const GaugeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 18a8 8 0 1 1 16 0" />
    <path d="m12 14 4-4" />
  </svg>
);

const NAV = [
  { href: "/", label: "Overview", icon: GaugeIcon },
  { href: "/shipments", label: "Shipments", icon: BoxIcon },
  { href: "/customs", label: "Customs", icon: StampIcon },
  { href: "/consignees", label: "Consignees", icon: UsersIcon },
];

/**
 * The console chrome. One `AppShell` grid: sidebar, header, scrolling main.
 *
 * `SidebarProvider` has to sit OUTSIDE `AppShell` — the trigger in the sidebar
 * header and the one in the navbar are in different grid areas and both read
 * the same open state.
 */
export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  /**
   * Mounted TWICE — in the `AppShellSidebar` from `md` up, and inside the phone
   * `Drawer` below it. `AppShell` ships no media queries and `Sidebar` collapses
   * in place to a 4.5rem icon rail rather than overlaying, which is right for a
   * 13" laptop and wrong for a 360px phone where the rail still eats a fifth of
   * the screen. So the responsive behaviour is the app's to write.
   */
  const navList = (onNavigate?: () => void) => (
    <Sidebar className="border-e border-base-300">
      <SidebarHeader>
        <SidebarHeaderBrand>
          <Wordmark size="sm" color="primary">
            Peregrine
          </Wordmark>
        </SidebarHeaderBrand>
        <SidebarTrigger className="hidden md:inline-flex" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          {NAV.map((item) => (
            <SidebarItem
              key={item.href}
              render={<Link href={item.href} />}
              icon={item.icon}
              active={isActive(item.href)}
              onClick={onNavigate}
            >
              {item.label}
            </SidebarItem>
          ))}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  return (
    <SidebarProvider>
      <AppShell className="h-full">
        <AppShellSidebar className="hidden md:block">
          {navList()}
        </AppShellSidebar>

        <AppShellHeader>
          <Navbar className="border-b border-base-300">
            <NavbarStart className="gap-2">
              <Button
                variant="ghost"
                color="neutral"
                size="sm"
                className="md:hidden"
                aria-label="Open navigation"
                onClick={() => setNavOpen(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="size-5">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </Button>
              <span className="text-sm font-semibold">
                {NAV.find((n) =>
                  n.href === "/" ? pathname === "/" : pathname.startsWith(n.href),
                )?.label ?? "Ops"}
              </span>
            </NavbarStart>
            <NavbarEnd>
              <ThemeController aria-label="Switch between light and dark" />
            </NavbarEnd>
          </Navbar>
        </AppShellHeader>

        <AppShellMain className="p-4 md:p-6">{children}</AppShellMain>
      </AppShell>

      {/* The phone nav. Same rows, same active state — and a portal, which is
          what proves the theme toggle reaches outside the AppShell subtree. */}
      <Drawer open={navOpen} onOpenChange={setNavOpen}>
        <DrawerContent side="left" className="w-auto p-0">
          <DrawerTitle className="sr-only">Operations navigation</DrawerTitle>
          {navList(() => setNavOpen(false))}
        </DrawerContent>
      </Drawer>
    </SidebarProvider>
  );
}
