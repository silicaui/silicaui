import { useState } from "react";
import { MultiSelect } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

const FRAMEWORKS = ["React", "Vue", "Svelte", "Solid", "Angular", "Qwik", "Preact"];

const COUNTRIES = [
    { value: "us", label: "United States" },
    { value: "ca", label: "Canada" },
    { value: "mx", label: "Mexico" },
    { value: "gb", label: "United Kingdom" },
    { value: "fr", label: "France" },
    { value: "de", label: "Germany" },
];

export function MultiSelectDemo() {
    const [frameworks, setFrameworks] = useState<string[]>(["React", "Svelte"]);
    const [countries, setCountries] = useState<{ value: string; label: string }[]>([]);

    return (
        <>
            <Section title="Real use · pick several frameworks (string items)">
                <MultiSelect
                    items={FRAMEWORKS}
                    value={frameworks}
                    onValueChange={(v) => setFrameworks(v as string[])}
                    placeholder="Add a framework…"
                    color="primary"
                />
            </Section>

            <Section title="Object items · label ≠ value">
                <MultiSelect
                    items={COUNTRIES}
                    value={countries}
                    onValueChange={(v) => setCountries(v as { value: string; label: string }[])}
                    placeholder="Add countries…"
                />
            </Section>

            <Section title="Sizes">
                <Row>
                    {(["sm", "md", "lg"] as const).map((size) => (
                        <MultiSelect
                            key={size}
                            items={["A", "B", "C"]}
                            defaultValue={["A"]}
                            size={size}
                            placeholder={size}
                        />
                    ))}
                </Row>
            </Section>

            <Section title="Disabled">
                <MultiSelect items={FRAMEWORKS} defaultValue={["Vue"]} disabled />
            </Section>
        </>
    );
}
