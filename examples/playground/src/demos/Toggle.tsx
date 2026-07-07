import { useState } from "react";
import { Toggle } from "silicaui-react";
import { Section } from "../lib/Section";
import { ColorVariantSizeGrid } from "../lib/ColorGrid";

export function ToggleDemo() {
    const [wifi, setWifi] = useState(true);

    return (
        <>
            <ColorVariantSizeGrid
                Component={Toggle}
                render={({ color, size }) => (
                    <label className="flex items-center gap-2 text-sm">
                        <Toggle color={color} size={size} defaultChecked />
                        {color ?? size}
                    </label>
                )}
            />

            <Section title="Real use · Wi-Fi setting">
                <label className="flex items-center gap-2 text-sm">
                    <Toggle
                        color="primary"
                        checked={wifi}
                        onChange={(e) => setWifi(e.target.checked)}
                    />
                    Wi-Fi is {wifi ? "on" : "off"}
                </label>
            </Section>
        </>
    );
}
