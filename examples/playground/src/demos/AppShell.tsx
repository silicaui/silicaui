import { useState } from "react";
import {
    AppShell,
    AppShellSidebar,
    AppShellHeader,
    AppShellMain,
    AppShellFooter,
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
    Footer,
    Wordmark,
    Button,
} from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const HomeIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12 12 3l9 9" /> <path d="M5 10v10h14V10" />
    </svg>
);
const SettingsIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 17H5" /> <path d="M19 7h-9" /> <circle cx="17" cy="17" r="3" /> <circle cx="7" cy="7" r="3" />
    </svg>
);

export function AppShellDemo() {
    const [active, setActive] = useState("dashboard");

    return (
        <>
            <Section title="Real use · sidebar + header + footer (same AppShell as below, different slots)">
                <div className="h-[26rem] w-full max-w-2xl overflow-hidden rounded-box border border-base-300">
                    <SidebarProvider>
                        <AppShell>
                            <AppShellSidebar>
                                <Sidebar>
                                    <SidebarHeader>
                                        <SidebarHeaderBrand>
                                            <Wordmark size="sm" color="primary">Acme</Wordmark>
                                        </SidebarHeaderBrand>
                                        <SidebarTrigger />
                                    </SidebarHeader>
                                    <SidebarContent>
                                        <SidebarGroup>
                                            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                                            <SidebarItem
                                                icon={HomeIcon}
                                                active={active === "dashboard"}
                                                onClick={() => setActive("dashboard")}
                                            >
                                                Dashboard
                                            </SidebarItem>
                                            <SidebarItem
                                                icon={SettingsIcon}
                                                active={active === "settings"}
                                                onClick={() => setActive("settings")}
                                            >
                                                Settings
                                            </SidebarItem>
                                        </SidebarGroup>
                                    </SidebarContent>
                                </Sidebar>
                            </AppShellSidebar>

                            <AppShellHeader>
                                <Navbar className="border-b border-base-300">
                                    <NavbarStart>
                                        <span className="text-sm font-semibold capitalize">{active}</span>
                                    </NavbarStart>
                                    <NavbarEnd>
                                        <Button size="sm" color="primary">
                                            New
                                        </Button>
                                    </NavbarEnd>
                                </Navbar>
                            </AppShellHeader>

                            <AppShellMain className="p-6">
                                <p className="text-sm opacity-70">
                                    Content for “{active}” — this pane scrolls independently; try
                                    collapsing the sidebar.
                                </p>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <p key={i} className="mt-3 text-sm opacity-60">
                                        Filler paragraph {i + 1} to make the main area scroll.
                                    </p>
                                ))}
                            </AppShellMain>

                            <AppShellFooter>
                                <Footer center className="border-t border-base-300 py-3 text-xs">
                                    © 2026 Acme, Inc.
                                </Footer>
                            </AppShellFooter>
                        </AppShell>
                    </SidebarProvider>
                </div>
            </Section>

            <Section title="Same AppShell, no sidebar · header + footer only">
                <div className="h-64 w-full max-w-2xl overflow-hidden rounded-box border border-base-300">
                    <AppShell>
                        <AppShellHeader>
                            <Navbar className="border-b border-base-300">
                                <NavbarStart>
                                    <span className="text-sm font-semibold">Acme</span>
                                </NavbarStart>
                            </Navbar>
                        </AppShellHeader>
                        <AppShellMain className="p-6">
                            <p className="text-sm opacity-70">
                                No sidebar slot rendered — its grid column collapses to zero
                                automatically.
                            </p>
                        </AppShellMain>
                        <AppShellFooter>
                            <Footer center className="border-t border-base-300 py-3 text-xs">
                                © 2026 Acme, Inc.
                            </Footer>
                        </AppShellFooter>
                    </AppShell>
                </div>
            </Section>
        </>
    );
}
