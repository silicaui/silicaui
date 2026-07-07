import { useState } from "react";
import { Range } from "silicaui-react";
import { Section, LabeledRow } from "../lib/Section";
import { COLORS } from "../lib/data";

export function RangeDemo() {
    const [volume, setVolume] = useState(40);
    const [priceRange, setPriceRange] = useState<number[]>([20, 70]);

    return (
        <>
            <Section title="Colors">
                <div className="flex max-w-md flex-col gap-4">
                    {COLORS.slice(0, 6).map((color) => (
                        <Range key={color} color={color} defaultValue={55} />
                    ))}
                </div>
            </Section>

            <Section title="Real use · volume + price range">
                <div className="flex max-w-md flex-col gap-5">
                    <LabeledRow label={`Volume · ${volume}%`}>
                        <Range
                            color="brand"
                            value={volume}
                            onValueChange={(v) => setVolume(v as number)}
                        />
                    </LabeledRow>
                    <LabeledRow label={`Price range · $${priceRange[0]} – $${priceRange[1]}`}>
                        <Range
                            color="success"
                            value={priceRange}
                            onValueChange={(v) => setPriceRange(v as number[])}
                        />
                    </LabeledRow>
                </div>
            </Section>
        </>
    );
}
