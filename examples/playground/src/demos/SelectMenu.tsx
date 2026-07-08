import { useState } from "react";
import {
    Select,
    SelectItem,
    SelectGroup,
    SelectGroupLabel,
    SelectSeparator,
} from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function SelectMenuDemo() {
    const [framework, setFramework] = useState<string | null>(null);
    const [flavor, setFlavor] = useState<string | null>("vanilla");

    return (
        <>
            <Section title="Real use · items-driven, with colors">
                <Row>
                    <Select
                        items={{ react: "React", vue: "Vue", svelte: "Svelte", solid: "Solid" }}
                        value={framework}
                        onValueChange={(v) => setFramework(v as string | null)}
                        placeholder="Framework"
                        color="primary"
                    />
                    <Select
                        items={{ react: "React", vue: "Vue" }}
                        placeholder="Error state"
                        color="error"
                    />
                    <Select items={{ react: "React" }} placeholder="Disabled" disabled />
                </Row>
            </Section>

            <Section title="Composable · grouped options">
                <Select
                    value={flavor}
                    onValueChange={(v) => setFlavor(v as string | null)}
                    placeholder="Flavor"
                    color="primary"
                >
                    <SelectGroup>
                        <SelectGroupLabel>Classic</SelectGroupLabel>
                        <SelectItem value="vanilla">Vanilla</SelectItem>
                        <SelectItem value="chocolate">Chocolate</SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                        <SelectGroupLabel>Specialty</SelectGroupLabel>
                        <SelectItem value="matcha">Matcha</SelectItem>
                        <SelectItem value="pistachio">Pistachio</SelectItem>
                    </SelectGroup>
                </Select>
            </Section>

            <Section title="Sizes">
                <Row>
                    {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
                        <Select
                            key={size}
                            items={{ [size]: size }}
                            defaultValue={size}
                            size={size}
                        />
                    ))}
                </Row>
            </Section>
        </>
    );
}
