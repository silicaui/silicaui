import { useState } from "react";
import { DateInput, DateRangeInput } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function DateInputDemo() {
    const [date, setDate] = useState<Date | null>(new Date(2026, 6, 8));
    const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({
        start: null,
        end: null,
    });

    return (
        <>
            <Section title="Real use · typeable date field (type digits or paste)">
                <DateInput value={date} onValueChange={setDate} color="primary" />
                <p className="mt-2 text-sm opacity-70">
                    {date ? date.toDateString() : "No date"}
                </p>
            </Section>

            <Section title="Locale-driven segment order (en-US vs en-GB vs de-DE)">
                <Row>
                    <DateInput locale="en-US" defaultValue={new Date(2026, 6, 8)} />
                    <DateInput locale="en-GB" defaultValue={new Date(2026, 6, 8)} />
                    <DateInput locale="de-DE" defaultValue={new Date(2026, 6, 8)} />
                </Row>
            </Section>

            <Section title="DateRangeInput">
                <DateRangeInput value={range} onValueChange={setRange} />
                <p className="mt-2 text-sm opacity-70">
                    {range.start ? range.start.toDateString() : "…"} —{" "}
                    {range.end ? range.end.toDateString() : "…"}
                </p>
            </Section>

            <Section title="Sizes / disabled">
                <Row>
                    <DateInput size="sm" defaultValue={new Date(2026, 6, 8)} />
                    <DateInput size="md" defaultValue={new Date(2026, 6, 8)} />
                    <DateInput size="lg" defaultValue={new Date(2026, 6, 8)} />
                    <DateInput disabled defaultValue={new Date(2026, 6, 8)} />
                </Row>
            </Section>
        </>
    );
}
