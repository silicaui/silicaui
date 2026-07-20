import { useState } from "react";
import { Slider } from "@wizeworks/silicaui-react";
import { Section, LabeledRow } from "../lib/Section";
import { COLORS } from "../lib/data";

export function SliderDemo() {
    const [brightness, setBrightness] = useState(65);
    const [range, setRange] = useState<number[]>([25, 75]);

    return (
        <>
            <Section title="Colors">
                <div className="flex max-w-md flex-col gap-5">
                    {COLORS.slice(0, 6).map((color) => (
                        <Slider key={color} color={color} defaultValue={55} />
                    ))}
                </div>
            </Section>

            <Section title="Sizes">
                <div className="flex max-w-md flex-col gap-5">
                    {(["sm", "md", "lg"] as const).map((size) => (
                        <Slider key={size} color="primary" size={size} defaultValue={55} />
                    ))}
                </div>
            </Section>

            <Section title="Real use · brightness + a two-thumb range">
                <div className="flex max-w-md flex-col gap-6">
                    <LabeledRow label={`Brightness · ${brightness}%`}>
                        <Slider
                            color="brand"
                            value={brightness}
                            onValueChange={(v) => setBrightness(v as number)}
                            showValue={false}
                        />
                    </LabeledRow>
                    <LabeledRow label={`Budget · $${range[0]} – $${range[1]}`}>
                        <Slider
                            color="success"
                            value={range}
                            onValueChange={(v) => setRange(v as number[])}
                        />
                    </LabeledRow>
                </div>
            </Section>
        </>
    );
}
