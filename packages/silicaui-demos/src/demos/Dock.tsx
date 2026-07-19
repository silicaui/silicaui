import { useState } from "react";
import { Dock, DockItem, DockLabel } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";
import { COLORS } from "../lib/data";

function HomeIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
    );
}
function UserIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7Z" />
        </svg>
    );
}

export function DockDemo() {
    const [tab, setTab] = useState("home");

    return (
        <>
            <Section title="Colors (active item accent)">
                <div className="flex flex-col gap-4">
                    {COLORS.slice(0, 6).map((color) => (
                        <Dock key={color} color={color} className="max-w-xs rounded-box">
                            <DockItem active>
                                <HomeIcon />
                                <DockLabel>Home</DockLabel>
                            </DockItem>
                            <DockItem>
                                <SearchIcon />
                                <DockLabel>Search</DockLabel>
                            </DockItem>
                            <DockItem>
                                <UserIcon />
                                <DockLabel>Profile</DockLabel>
                            </DockItem>
                        </Dock>
                    ))}
                </div>
            </Section>

            <Section title="Real use · interactive bottom nav">
                <Dock color="primary" className="max-w-xs rounded-box">
                    <DockItem active={tab === "home"} onClick={() => setTab("home")}>
                        <HomeIcon />
                        <DockLabel>Home</DockLabel>
                    </DockItem>
                    <DockItem active={tab === "search"} onClick={() => setTab("search")}>
                        <SearchIcon />
                        <DockLabel>Search</DockLabel>
                    </DockItem>
                    <DockItem active={tab === "profile"} onClick={() => setTab("profile")}>
                        <UserIcon />
                        <DockLabel>Profile</DockLabel>
                    </DockItem>
                </Dock>
            </Section>
        </>
    );
}
