import { useState } from "react";
import { Switch } from "silicaui-react";
import { Section, Row } from "../lib/Section";
import { SIZES } from "../lib/data";

const SETTINGS = [
    { key: "push", label: "Push notifications", defaultOn: true },
    { key: "email", label: "Email digest", defaultOn: true },
    { key: "sms", label: "SMS alerts", defaultOn: false },
];

export function SwitchDemo() {
    const [on, setOn] = useState<Record<string, boolean>>({
        push: true,
        email: true,
        sms: false,
    });

    return (
        <>
            <Section title="Colors">
                <Row>
                    <Switch defaultChecked />
                    <Switch color="primary" defaultChecked />
                    <Switch color="success" defaultChecked />
                    <Switch color="warning" defaultChecked />
                    <Switch color="error" defaultChecked />
                    <Switch color="brand" defaultChecked />
                    <Switch disabled />
                </Row>
            </Section>

            <Section title="Sizes">
                <Row>
                    {SIZES.filter((s) => s !== "xl").map((size) => (
                        <Switch key={size} color="primary" size={size} defaultChecked />
                    ))}
                </Row>
            </Section>

            <Section title="Real use · notification settings">
                <div className="flex max-w-sm flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4">
                    {SETTINGS.map((s) => (
                        <label key={s.key} className="flex items-center justify-between gap-4 text-sm">
                            {s.label}
                            <Switch
                                color="primary"
                                checked={on[s.key]}
                                onCheckedChange={(v) => setOn((p) => ({ ...p, [s.key]: v }))}
                            />
                        </label>
                    ))}
                </div>
            </Section>
        </>
    );
}
