import { useState } from "react";
import {
    Toolbar,
    ToolbarButton,
    ToolbarGroup,
    ToolbarLink,
    ToolbarSeparator,
} from "silicaui-react";
import { Section } from "../lib/Section";

function BoldIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" strokeLinejoin="round" />
        </svg>
    );
}
function ItalicIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 4h-5M14 20H9M14 4l-4 16" strokeLinecap="round" />
        </svg>
    );
}
function UnderlineIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 4v6a5 5 0 0 0 10 0V4M6 21h12" strokeLinecap="round" />
        </svg>
    );
}

export function ToolbarDemo() {
    const [format, setFormat] = useState<string[]>(["bold"]);

    const toggle = (key: string) =>
        setFormat((f) => (f.includes(key) ? f.filter((k) => k !== key) : [...f, key]));

    return (
        <Section title="Real use · text formatting toolbar">
            <Toolbar aria-label="Formatting">
                <ToolbarGroup>
                    <ToolbarButton
                        aria-pressed={format.includes("bold")}
                        onClick={() => toggle("bold")}
                    >
                        <BoldIcon />
                    </ToolbarButton>
                    <ToolbarButton
                        aria-pressed={format.includes("italic")}
                        onClick={() => toggle("italic")}
                    >
                        <ItalicIcon />
                    </ToolbarButton>
                    <ToolbarButton
                        aria-pressed={format.includes("underline")}
                        onClick={() => toggle("underline")}
                    >
                        <UnderlineIcon />
                    </ToolbarButton>
                </ToolbarGroup>
                <ToolbarSeparator />
                <ToolbarLink href="#">Help</ToolbarLink>
            </Toolbar>
        </Section>
    );
}
