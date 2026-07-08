import { useState } from "react";
import { DateTimeInput } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function DateTimeInputDemo() {
    const [when, setWhen] = useState<Date | null>(new Date(2026, 6, 8, 14, 30));

    return (
        <>
            <Section title="Real use · schedule a post (type or paste 'e.g. 7/8/2026 2:30 PM')">
                <DateTimeInput value={when} onValueChange={setWhen} color="primary" />
                <p className="mt-2 text-sm opacity-70">
                    {when ? when.toString() : "No date/time"}
                </p>
            </Section>

            <Section title="24h + seconds, min bound to now">
                <DateTimeInput hourCycle={24} showSeconds min={new Date()} />
            </Section>

            <Section title="Sizes / disabled">
                <Row>
                    <DateTimeInput size="sm" defaultValue={new Date(2026, 6, 8, 9, 0)} />
                    <DateTimeInput size="lg" defaultValue={new Date(2026, 6, 8, 9, 0)} />
                    <DateTimeInput disabled defaultValue={new Date(2026, 6, 8, 9, 0)} />
                </Row>
            </Section>
        </>
    );
}
