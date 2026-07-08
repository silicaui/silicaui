import { useState } from "react";
import { TimeInput, type TimeValue } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function TimeInputDemo() {
    const [time, setTime] = useState<TimeValue | null>({ hour: 14, minute: 30 });

    return (
        <>
            <Section title="Real use · 12h field (type digits, arrows, or paste 'e.g. 2:30 PM')">
                <TimeInput value={time} onValueChange={setTime} color="primary" />
                <p className="mt-2 text-sm opacity-70">
                    {time ? `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")} (24h)` : "No time"}
                </p>
            </Section>

            <Section title="24h + seconds">
                <TimeInput hourCycle={24} showSeconds defaultValue={{ hour: 14, minute: 30, second: 45 }} />
            </Section>

            <Section title="Sizes / disabled">
                <Row>
                    <TimeInput size="sm" defaultValue={{ hour: 9, minute: 0 }} />
                    <TimeInput size="md" defaultValue={{ hour: 9, minute: 0 }} />
                    <TimeInput size="lg" defaultValue={{ hour: 9, minute: 0 }} />
                    <TimeInput disabled defaultValue={{ hour: 9, minute: 0 }} />
                </Row>
            </Section>
        </>
    );
}
