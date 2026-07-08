import { useState } from "react";
import { Swap } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

function MenuIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
    );
}
function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
    );
}
function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
        </svg>
    );
}
function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
        </svg>
    );
}

export function SwapDemo() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <Section title="Transition variants">
                <Row>
                    <Swap variant="fade" on={<CloseIcon />} off={<MenuIcon />} label="Fade" />
                    <Swap variant="rotate" on={<CloseIcon />} off={<MenuIcon />} label="Rotate" />
                    <Swap variant="flip" on={<MoonIcon />} off={<SunIcon />} label="Flip" />
                </Row>
            </Section>

            <Section title="Real use · controlled mobile menu toggle">
                <div className="flex items-center gap-3">
                    <Swap
                        variant="rotate"
                        active={menuOpen}
                        onActiveChange={setMenuOpen}
                        on={<CloseIcon />}
                        off={<MenuIcon />}
                        label="Toggle menu"
                    />
                    <span className="text-sm opacity-70">
                        Menu is {menuOpen ? "open" : "closed"}
                    </span>
                </div>
            </Section>
        </>
    );
}
