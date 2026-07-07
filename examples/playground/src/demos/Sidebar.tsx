import { useState } from "react";
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarHeaderBrand,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarItem,
    SidebarTrigger,
    Wordmark,
    Avatar,
} from "silicaui-react";
import { Section } from "../lib/Section";

const HomeIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12 12 3l9 9" /> <path d="M5 10v10h14V10" />
    </svg>
);
const SearchIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /> <path d="m21 21-4.3-4.3" />
    </svg>
);
const UsersIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const SettingsIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 17H5" /> <path d="M19 7h-9" /> <circle cx="17" cy="17" r="3" /> <circle cx="7" cy="7" r="3" />
    </svg>
);

function AppShell() {
    const [active, setActive] = useState("dashboard");

    return (
        <div className="flex h-[26rem] w-full max-w-2xl overflow-hidden rounded-box border border-base-200">
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
                            icon={SearchIcon}
                            active={active === "search"}
                            onClick={() => setActive("search")}
                        >
                            Search
                        </SidebarItem>
                        <SidebarItem
                            icon={UsersIcon}
                            active={active === "team"}
                            onClick={() => setActive("team")}
                            trailing={<span className="badge badge-primary badge-xs">4</span>}
                        >
                            Team
                        </SidebarItem>
                    </SidebarGroup>
                    <SidebarGroup>
                        <SidebarGroupLabel>Account</SidebarGroupLabel>
                        <SidebarItem
                            icon={SettingsIcon}
                            active={active === "settings"}
                            onClick={() => setActive("settings")}
                        >
                            Settings
                        </SidebarItem>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarItem icon={<Avatar size="xs">AL</Avatar>}>Ada Lovelace</SidebarItem>
                </SidebarFooter>
            </Sidebar>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    <h4 className="text-sm font-semibold capitalize">{active}</h4>
                </div>
                <p className="text-sm opacity-70">
                    The trigger above lives OUTSIDE the sidebar (in this main content
                    area) yet still toggles it — both triggers share one
                    SidebarProvider.
                </p>
            </div>
        </div>
    );
}

export function SidebarDemo() {
    return (
        <Section title="Real use · app shell (collapsible, cross-tree trigger)">
            <SidebarProvider>
                <AppShell />
            </SidebarProvider>
        </Section>
    );
}
