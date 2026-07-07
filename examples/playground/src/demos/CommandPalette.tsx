import { useState } from "react";
import { CommandPalette, Button } from "silicaui-react";
import type { CommandItem } from "silicaui-react";
import { Section, Row } from "../lib/Section";

export function CommandPaletteDemo() {
    const [open, setOpen] = useState(false);
    const [lastCommand, setLastCommand] = useState<string | null>(null);

    const items: CommandItem[] = [
        {
            id: "new-page",
            label: "Create new page",
            description: "Add a blank page to this site",
            group: "Actions",
            shortcut: "⌘N",
            onSelect: () => setLastCommand("Create new page"),
        },
        {
            id: "invite",
            label: "Invite teammate",
            group: "Actions",
            keywords: ["member", "user", "collaborator"],
            onSelect: () => setLastCommand("Invite teammate"),
        },
        {
            id: "theme-light",
            label: "Switch to light theme",
            group: "Preferences",
            onSelect: () => setLastCommand("Switch to light theme"),
        },
        {
            id: "theme-dark",
            label: "Switch to dark theme",
            group: "Preferences",
            onSelect: () => setLastCommand("Switch to dark theme"),
        },
        {
            id: "billing",
            label: "Open billing settings",
            group: "Preferences",
            disabled: true,
            onSelect: () => setLastCommand("Open billing settings"),
        },
    ];

    return (
        <Section title="Real use · ⌘K launcher (try the hotkey too)">
            <Row>
                <Button color="primary" onClick={() => setOpen(true)}>
                    Open command palette
                </Button>
                {lastCommand && (
                    <span className="text-sm opacity-70">Ran: {lastCommand}</span>
                )}
            </Row>
            <CommandPalette items={items} open={open} onOpenChange={setOpen} />
        </Section>
    );
}
