import { useState } from "react";
import { Checkbox } from "silicaui-react";
import { Section } from "../lib/Section";
import { ColorVariantSizeGrid } from "../lib/ColorGrid";

const TASKS = ["Write the announcement", "Add screenshots", "Ping the design team"];

export function CheckboxDemo() {
    const [done, setDone] = useState<Record<string, boolean>>({
        "Write the announcement": true,
    });

    return (
        <>
            <ColorVariantSizeGrid
                Component={Checkbox}
                render={({ color, size }) => (
                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox color={color} size={size} defaultChecked />
                        {color ?? size}
                    </label>
                )}
            />

            <Section title="Real use · launch checklist">
                <div className="flex flex-col gap-2">
                    {TASKS.map((task) => (
                        <label key={task} className="flex items-center gap-2 text-sm">
                            <Checkbox
                                color="primary"
                                checked={!!done[task]}
                                onChange={(e) =>
                                    setDone((p) => ({ ...p, [task]: e.target.checked }))
                                }
                            />
                            <span className={done[task] ? "line-through opacity-50" : ""}>
                                {task}
                            </span>
                        </label>
                    ))}
                </div>
            </Section>
        </>
    );
}
