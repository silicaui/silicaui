import { useState } from "react";
import { ColorPicker, Button } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function ColorPickerDemo() {
    const [brand, setBrand] = useState("oklch(0.62 0.19 29)");
    const [accent, setAccent] = useState("#22c55e");

    return (
        <>
            <Section title="Real use · brand color picker">
                <div className="flex flex-col items-start gap-3">
                    <ColorPicker value={brand} onValueChange={(v) => setBrand(v)} />
                    <Button style={{ backgroundColor: brand, borderColor: brand, color: "#fff" }}>
                        Preview button
                    </Button>
                </div>
            </Section>

            <Section title="variant=&quot;swatch&quot; · compact chip, opens the same panel in a popover">
                <Row>
                    <ColorPicker
                        variant="swatch"
                        value={accent}
                        format="hex"
                        onValueChange={(v) => setAccent(v)}
                    />
                    <span
                        className="text-sm"
                        style={{ color: "var(--color-base-content)" }}
                    >
                        {accent}
                    </span>
                    <ColorPicker variant="swatch" disabled defaultValue="oklch(0.55 0.2 280)" />
                </Row>
            </Section>
        </>
    );
}
