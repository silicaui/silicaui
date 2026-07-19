"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppShell,
  AppShellSidebar,
  AppShellHeader,
  AppShellMain,
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarHeaderBrand,
  SidebarTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  Navbar,
  NavbarStart,
  NavbarEnd,
  Wordmark,
  Button,
  CommandPalette,
} from "@wizeworks/silicaui-react";
import type { CommandItem } from "@wizeworks/silicaui-react";
import type { NavLink } from "@/lib/nav";

export function DocsShell({
  componentLinks,
  children,
}: {
  componentLinks: NavLink[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const paletteItems: CommandItem[] = useMemo(
    () =>
      componentLinks.map((link) => ({
        id: link.id,
        label: link.title,
        group: "Components",
        onSelect: () => {
          window.location.href = link.href;
        },
      })),
    [componentLinks],
  );

  return (
    <SidebarProvider>
      <AppShell className="h-screen">
        <AppShellSidebar>
          <Sidebar>
            <SidebarHeader>
              <SidebarHeaderBrand>
                <Link href="/">
                  <Wordmark size="sm" color="primary">
                    SilicaUI
                  </Wordmark>
                </Link>
              </SidebarHeaderBrand>
              <SidebarTrigger />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Components</SidebarGroupLabel>
                {componentLinks.map((link) => (
                  <SidebarItem
                    key={link.id}
                    as={Link}
                    href={link.href}
                    active={pathname === `${link.href}/` || pathname === link.href}
                  >
                    {link.title}
                  </SidebarItem>
                ))}
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </AppShellSidebar>

        <AppShellHeader>
          <Navbar className="border-b border-base-200">
            <NavbarStart>
              <span className="text-sm font-medium text-base-content">Docs</span>
            </NavbarStart>
            <NavbarEnd>
              <Button
                size="sm"
                variant="outline"
                color="neutral"
                onClick={() => setPaletteOpen(true)}
              >
                Search
                <kbd className="kbd kbd-sm ms-2">⌘K</kbd>
              </Button>
            </NavbarEnd>
          </Navbar>
        </AppShellHeader>

        <AppShellMain className="overflow-y-auto">{children}</AppShellMain>
      </AppShell>

      <CommandPalette items={paletteItems} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </SidebarProvider>
  );
}
