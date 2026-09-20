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
  Drawer,
  DrawerContent,
  DrawerTitle,
  ThemeController,
} from "@wizeworks/silicaui-react";
import type { CommandItem } from "@wizeworks/silicaui-react";
import type { NavLink } from "@/lib/nav";
import { GROUP_ORDER } from "@/lib/catalog";

/**
 * The prose pages, as opposed to the 116 generated component pages.
 *
 * Kept as ONE list because the sidebar and the ⌘K palette both read it. They
 * were built from `componentLinks` alone, which is why the docs section had no
 * route to Getting started and why the palette could not find that page by its
 * own title. See docs/personas/issues/033.
 *
 * `group` doubles as the palette's result heading, so it reads as a category
 * there and as the sidebar's group label here.
 */
type GuideLink = NavLink & { description?: string; keywords?: string[] };

const GUIDE_LINKS: GuideLink[] = [
  {
    id: "guide-getting-started",
    title: "Getting started",
    href: "/docs/getting-started",
    group: "Start here",
    description: "Install, register the plugin, themes, and all three paths",
    // `CommandItem` has taken `keywords` all along and nothing passed any, so
    // the palette matched titles only. Every term here is one a real reader
    // typed and got "No results found" for — a Django developer searching for
    // the CSS path, and a static-site author searching for the node tree. The
    // page they wanted was this one both times.
    keywords: [
      "install", "setup", "plugin", "tailwind", "@plugin",
      "theme", "themes", "data-theme", "dark mode", "prefersdark",
      "html", "plain html", "static", "static site", "no framework",
      "without react", "vanilla", "node tree", "toHtml", "generate",
      "django", "rails", "php", "go", "server", "css only",
    ],
  },
  {
    id: "guide-migrating-from-daisyui",
    title: "Migrating from daisyUI",
    href: "/docs/migrating-from-daisyui",
    group: "Start here",
    description: "What it costs, what is a drop-in, and how to do it a screen at a time",
    // The site lists "daisyUI alternative" among its own keywords and had no
    // page for one: searching "daisyui", "migrate", "migration" or "daisy"
    // returned nothing at all, while "button" returned Button
    // (docs/personas/issues/099).
    keywords: [
      "daisyui", "daisy", "daisy ui", "migrate", "migrating", "migration",
      "switch", "move", "port", "convert", "replace daisyui",
      "coming from daisyui", "alternative", "prefix", "coexist",
      "side by side", "drop-in", "class mapping", "equivalent",
    ],
  },
];

export function DocsShell({
  componentLinks,
  children,
}: {
  componentLinks: NavLink[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  // The phone nav. Controlled rather than using `DrawerTrigger`, because picking
  // a component has to close it — a drawer left open over the page you just
  // navigated to is the classic version of this control being wrong.
  const [navOpen, setNavOpen] = useState(false);

  const paletteItems: CommandItem[] = useMemo(
    () =>
      [...GUIDE_LINKS, ...(componentLinks as GuideLink[])].map((link) => ({
        id: link.id,
        label: link.title,
        // The real category, not the constant "Components" this used to pass —
        // which grouped every result under one heading and so grouped nothing.
        group: link.group,
        description: link.description,
        keywords: link.keywords,
        onSelect: () => {
          window.location.href = link.href;
        },
      })),
    [componentLinks],
  );

  /**
   * The links bucketed for the sidebar, in `GROUP_ORDER` rather than alphabetically.
   * Derived from the prop so the shell stays a pure function of what it is given;
   * empty groups are dropped rather than rendered as a bare heading.
   */
  const groups = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        links: componentLinks.filter((l) => l.group === group),
      })).filter((g) => g.links.length > 0),
    [componentLinks],
  );

  /**
   * The component list, rendered once and mounted twice — as the persistent
   * `Sidebar` on desktop, and inside a `Drawer` on a phone. `onNavigate` closes
   * the drawer after a pick; on desktop it is a no-op because nothing opened.
   */
  const navPanel = (onNavigate?: () => void) => (
    <Sidebar>
      <SidebarHeader>
        <SidebarHeaderBrand>
          <Link href="/" onClick={onNavigate}>
            <Wordmark size="sm" color="primary">
              SilicaUI
            </Wordmark>
          </Link>
        </SidebarHeaderBrand>
        <SidebarTrigger />
      </SidebarHeader>
      {/* One group per category, not one "Components" heading over all 116.
          Groups come from the MCP catalog's own `category` via `@/lib/nav`, in a
          reading order rather than alphabetically. See docs/personas/issues/007. */}
      <SidebarContent>
        {/*
          The guide pages, first. Without this group the whole docs section was a
          dead end for anyone not already holding a component name: 118 links on
          /docs/ and 117 of them were component pages, the 118th the wordmark.
          There is no <header> in this shell, so the home page's "Get started"
          button does not follow you in, and the ⌘K palette indexed components
          only — it answered "No results found" for `static`, for `html`, for
          `no framework`, and for `getting started`, which is the page's own
          title. The one page documenting the CSS-only and node-tree paths was
          reachable only by going back to the landing page or by guessing the
          URL. See docs/personas/issues/033.

          One list, read by the sidebar AND by the palette, because a link added
          to one and not the other is how this half-broke in the first place.
        */}
        <SidebarGroup>
          <SidebarGroupLabel>Start here</SidebarGroupLabel>
          {GUIDE_LINKS.map((link) => (
            <SidebarItem
              key={link.id}
              as={Link}
              href={link.href}
              onClick={onNavigate}
              active={pathname === `${link.href}/` || pathname === link.href}
            >
              {link.title}
            </SidebarItem>
          ))}
        </SidebarGroup>
        {groups.map(({ group, links }) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            {links.map((link) => (
              <SidebarItem
                key={link.id}
                as={Link}
                href={link.href}
                onClick={onNavigate}
                active={pathname === `${link.href}/` || pathname === link.href}
              >
                {link.title}
              </SidebarItem>
            ))}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );

  return (
    <SidebarProvider>
      <AppShell className="h-screen">
        {/* Hidden below `md`, where 256px of nav left ~90px for the documentation
            and the body rendered one word per line. It is NOT collapsed to the
            icon rail instead: these items are text-only with no icons, so a
            collapsed rail is 116 blank rows. The phone gets the `Drawer` below —
            the component built to overlay — while `Sidebar` keeps its own rule
            that it never overlays. See docs/personas/issues/003. */}
        <AppShellSidebar className="hidden md:block">{navPanel()}</AppShellSidebar>

        <AppShellHeader>
          <Navbar className="border-b border-base-200">
            <NavbarStart>
              <Button
                size="sm"
                variant="ghost"
                color="neutral"
                className="md:hidden"
                aria-label="Open the component list"
                onClick={() => setNavOpen(true)}
              >
                <MenuIcon />
              </Button>
              <span className="text-sm font-medium text-base-content">Docs</span>
            </NavbarStart>
            <NavbarEnd>
              <ThemeController aria-label="Switch between light and dark" />
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

      <Drawer open={navOpen} onOpenChange={setNavOpen}>
        <DrawerContent side="left" className="w-auto p-0">
          <DrawerTitle className="sr-only">Components</DrawerTitle>
          {navPanel(() => setNavOpen(false))}
        </DrawerContent>
      </Drawer>

      <CommandPalette items={paletteItems} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </SidebarProvider>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="size-5"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
