import { useState } from "react";
import { FileInput } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function FileInputDemo() {
    const [name, setName] = useState<string | null>(null);

    return (
        <>
            <Section title="Sizes">
                <Row>
                    <FileInput size="sm" />
                    <FileInput />
                    <FileInput size="lg" />
                </Row>
            </Section>

            <Section title="Real use · avatar upload">
                <div className="flex flex-col gap-2">
                    <FileInput
                        accept="image/*"
                        onChange={(e) => setName(e.target.files?.[0]?.name ?? null)}
                    />
                    <p className="text-xs opacity-60">
                        {name ? `Selected: ${name}` : "PNG or JPG, up to 5MB."}
                    </p>
                </div>
            </Section>
        </>
    );
}
