import { useState } from "react";
import { Diff } from "silicaui-react";
import { Section } from "../lib/Section";

function Panel({ label, color }: { label: string; color: string }) {
    return (
        <div
            className="flex h-full w-full items-center justify-center text-lg font-semibold text-white"
            style={{ backgroundColor: color }}
        >
            {label}
        </div>
    );
}

export function DiffDemo() {
    const [pos, setPos] = useState(50);

    return (
        <Section title="Real use · draggable before/after comparison">
            <Diff
                className="max-w-lg"
                style={{ aspectRatio: "16 / 9" }}
                position={pos}
                onPositionChange={setPos}
                before={<Panel label="Before" color="#64748b" />}
                after={<Panel label="After" color="#6366f1" />}
            />
            <p className="pt-2 text-xs opacity-60">
                Split at {Math.round(pos)}% — drag the handle or use ←/→.
            </p>
        </Section>
    );
}
