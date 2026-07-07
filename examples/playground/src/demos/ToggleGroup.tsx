import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "silicaui-react";
import { Section } from "../lib/Section";

export function ToggleGroupDemo() {
    const [view, setView] = useState<string[]>(["grid"]);
    const [format, setFormat] = useState<string[]>(["bold"]);

    return (
        <>
            <Section title="Real use · single-select view switcher">
                <ToggleGroup value={view} onValueChange={setView}>
                    <ToggleGroupItem value="list">List</ToggleGroupItem>
                    <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
                    <ToggleGroupItem value="board">Board</ToggleGroupItem>
                </ToggleGroup>
            </Section>

            <Section title="Multi-select text formatting">
                <ToggleGroup multiple value={format} onValueChange={setFormat}>
                    <ToggleGroupItem value="bold">B</ToggleGroupItem>
                    <ToggleGroupItem value="italic">I</ToggleGroupItem>
                    <ToggleGroupItem value="underline">U</ToggleGroupItem>
                </ToggleGroup>
            </Section>
        </>
    );
}
