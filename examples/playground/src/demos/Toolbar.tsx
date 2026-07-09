import { useState } from "react";
import {
    Toolbar,
    ToolbarButton,
    ToolbarCenter,
    ToolbarGroup,
    ToolbarLink,
    ToolbarSeparator,
} from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";

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
function PlusIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
    );
}
function TrashIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ToolbarDemo() {
    const [format, setFormat] = useState<string[]>(["bold"]);

    const toggle = (key: string) =>
        setFormat((f) => (f.includes(key) ? f.filter((k) => k !== key) : [...f, key]));

    return (
        <>
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

            <Section title="Sizes">
                <Stack className="items-start">
                    {(["sm", "md", "lg"] as const).map((size) => (
                        <Toolbar key={size} aria-label={`${size} toolbar`} size={size}>
                            <ToolbarButton>
                                <PlusIcon />
                                Add
                            </ToolbarButton>
                            <ToolbarSeparator />
                            <ToolbarLink href="#">{size}</ToolbarLink>
                        </Toolbar>
                    ))}
                </Stack>
            </Section>

            <Section title="Variant + dividers · bulk-selection bar">
                <div className="w-full max-w-md rounded-box border border-base-300">
                    <Toolbar aria-label="Bulk actions" size="sm" variant="muted" dividers="bottom" className="w-full">
                        <ToolbarGroup>
                            <span className="px-1 text-xs font-medium opacity-70">3 selected</span>
                        </ToolbarGroup>
                        <ToolbarSeparator />
                        <ToolbarGroup>
                            <ToolbarButton>
                                <TrashIcon />
                            </ToolbarButton>
                        </ToolbarGroup>
                        <ToolbarLink href="#" className="ml-auto">
                            Deselect all
                        </ToolbarLink>
                    </Toolbar>
                    <div className="p-4 text-sm opacity-60">…table content…</div>
                </div>
            </Section>

            <Section title="Dividers · card header">
                <div className="w-full max-w-md rounded-box border border-base-300">
                    <Toolbar aria-label="Card actions" dividers="bottom" className="w-full">
                        <span className="px-1 text-sm font-semibold">Card title</span>
                        <ToolbarButton className="ml-auto">
                            <PlusIcon />
                        </ToolbarButton>
                    </Toolbar>
                    <div className="p-4 text-sm opacity-60">…card content…</div>
                </div>
            </Section>

            <Section title="Center region · start / center / end">
                <div className="w-full max-w-md rounded-box border border-base-300">
                    <Toolbar aria-label="Section navigation" dividers="bottom" className="w-full">
                        <ToolbarGroup />
                        <ToolbarCenter>
                            <ToolbarGroup>
                                <ToolbarButton aria-pressed={true}>Overview</ToolbarButton>
                                <ToolbarButton aria-pressed={false}>Analytics</ToolbarButton>
                                <ToolbarButton aria-pressed={false}>Settings</ToolbarButton>
                            </ToolbarGroup>
                        </ToolbarCenter>
                        <ToolbarGroup>
                            <ToolbarButton>
                                <PlusIcon />
                            </ToolbarButton>
                        </ToolbarGroup>
                    </Toolbar>
                </div>
            </Section>
        </>
    );
}
