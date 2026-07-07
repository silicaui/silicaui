import { useState } from "react";
import {
    Calendar,
    DatePicker,
    DateRangePicker,
} from "silicaui-react";
import type { DateRange } from "silicaui-react";
import { Section, Row } from "../lib/Section";
import { COLORS } from "../lib/data";

export function CalendarDemo() {
    const [date, setDate] = useState<Date | null>(new Date(2026, 6, 14));
    const [pickedDate, setPickedDate] = useState<Date | null>(null);
    const [range, setRange] = useState<DateRange>({ start: null, end: null });

    return (
        <>
            <Section title="Colors (inline)">
                <Row>
                    {COLORS.slice(0, 3).map((color) => (
                        <Calendar
                            key={color}
                            color={color}
                            value={date}
                            onValueChange={(v) => setDate(v as Date)}
                        />
                    ))}
                </Row>
            </Section>

            <Section title="Real use · date + range pickers">
                <Row>
                    <DatePicker
                        color="primary"
                        value={pickedDate}
                        onValueChange={setPickedDate}
                        placeholder="Pick a date"
                    />
                    <DateRangePicker
                        color="primary"
                        value={range}
                        onValueChange={setRange}
                        placeholder="Pick a range"
                    />
                </Row>
            </Section>
        </>
    );
}
