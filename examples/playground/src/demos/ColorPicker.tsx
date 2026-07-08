import { useState } from "react";
import { ColorPicker, Button } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function ColorPickerDemo() {
    const [brand, setBrand] = useState("oklch(0.62 0.19 29)");

    return (
        <Section title="Real use · brand color picker">
            <div className="flex flex-col items-start gap-3">
                <ColorPicker value={brand} onValueChange={(v) => setBrand(v)} />
                <Button style={{ backgroundColor: brand, borderColor: brand, color: "#fff" }}>
                    Preview button
                </Button>
            </div>
        </Section>
    );
}
