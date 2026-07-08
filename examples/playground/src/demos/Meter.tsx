import { Meter } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";
import { COLORS, SIZES } from "../lib/data";

export function MeterDemo() {
    return (
        <>
            <Section title="Colors">
                <div className="grid max-w-md gap-4">
                    {COLORS.slice(0, 6).map((color) => (
                        <Meter key={color} color={color} value={65} label={color} showValue />
                    ))}
                </div>
            </Section>

            <Section title="Sizes">
                <div className="flex max-w-md flex-col gap-3">
                    {SIZES.map((size) => (
                        <Meter key={size} color="primary" size={size} value={60} />
                    ))}
                </div>
            </Section>

            <Section title="Real use · gauges">
                <div className="grid max-w-md gap-4">
                    <Meter color="warning" value={92} label="Storage used" showValue />
                    <Meter color="success" value={78} label="Battery" showValue />
                    <Meter color="error" value={12} min={0} max={100} label="Credit score risk" showValue />
                </div>
            </Section>
        </>
    );
}
