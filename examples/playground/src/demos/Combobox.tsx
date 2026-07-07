import { useState } from "react";
import { Combobox } from "silicaui-react";
import { Section, Row } from "../lib/Section";

const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
];

const DOC_SUGGESTIONS = [
    "Getting started", "Installation", "Theming", "Color tokens",
    "Dark mode", "Components", "Button", "Select", "Combobox",
    "Form validation", "Accessibility", "Migration guide",
];

export function ComboboxDemo() {
    const [usState, setUsState] = useState<string | null>(null);
    const [docQuery, setDocQuery] = useState("");

    return (
        <>
            <Section title="Real use · searchable state picker">
                <Combobox
                    items={US_STATES}
                    value={usState}
                    onValueChange={(v) => setUsState(v as string | null)}
                    placeholder="Search states…"
                    color="primary"
                />
            </Section>

            <Section title="Docs search (no clear button)">
                <Combobox
                    items={DOC_SUGGESTIONS}
                    value={docQuery || null}
                    onValueChange={(v) => setDocQuery((v as string) ?? "")}
                    placeholder="Search docs…"
                    clearable={false}
                />
            </Section>

            <Section title="Sizes">
                <Row>
                    {(["sm", "md", "lg"] as const).map((size) => (
                        <Combobox key={size} items={["A", "B", "C"]} size={size} placeholder={size} />
                    ))}
                </Row>
            </Section>
        </>
    );
}
