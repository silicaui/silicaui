import { useState } from "react";
import { Radio } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";
import { ColorVariantSizeGrid } from "../lib/ColorGrid";

const PLANS = [
    { id: "starter", label: "Starter — $9/mo" },
    { id: "pro", label: "Pro — $29/mo" },
    { id: "enterprise", label: "Enterprise — custom" },
];

export function RadioDemo() {
    const [plan, setPlan] = useState("pro");

    return (
        <>
            <ColorVariantSizeGrid
                Component={Radio}
                render={({ color, size }) => (
                    <label className="flex items-center gap-2 text-sm">
                        <Radio name={`radio-${color ?? size}`} color={color} size={size} defaultChecked />
                        {color ?? size}
                    </label>
                )}
            />

            <Section title="Real use · pick a plan">
                <div className="flex flex-col gap-2">
                    {PLANS.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm">
                            <Radio
                                name="plan"
                                color="primary"
                                checked={plan === p.id}
                                onChange={() => setPlan(p.id)}
                            />
                            {p.label}
                        </label>
                    ))}
                </div>
            </Section>
        </>
    );
}
