import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@wizeworks/silicaui-react";
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

            <Section title="Sizes">
                <div className="flex flex-wrap items-center gap-4">
                    {(["xs", "sm", "md", "lg"] as const).map((size) => (
                        <ToggleGroup key={size} size={size} defaultValue={["grid"]}>
                            <ToggleGroupItem value="list">List</ToggleGroupItem>
                            <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
                        </ToggleGroup>
                    ))}
                </div>
            </Section>

            <Section title="Colored active pill">
                <div className="flex flex-wrap items-center gap-4">
                    {(["primary", "secondary", "accent", "success"] as const).map((color) => (
                        <ToggleGroup key={color} color={color} defaultValue={["grid"]}>
                            <ToggleGroupItem value="list">List</ToggleGroupItem>
                            <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
                        </ToggleGroup>
                    ))}
                </div>
            </Section>
        </>
    );
}
