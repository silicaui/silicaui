import { useState } from "react";
import { Textarea } from "@wizeworks/silicaui-react";
import { Section, Row, Stack } from "../lib/Section";
import { SIZES } from "../lib/data";

export function TextareaDemo() {
    const [note, setNote] = useState(
        "Shipping was fast and the packaging held up well.",
    );
    const max = 200;

    return (
        <>
            <Section title="Colors">
                <Stack className="max-w-md">
                    <Textarea placeholder="Default textarea — drag the corner to resize" />
                    <Textarea
                        color="primary"
                        defaultValue="Primary accent — border and focus ring."
                    />
                    <Textarea color="success" placeholder="Success" />
                    <Textarea color="error" placeholder="Error" />
                    <Textarea color="brand" placeholder="Brand accent" rows={2} />
                    <Textarea disabled defaultValue="Disabled" />
                </Stack>
            </Section>

            <Section title="Sizes">
                <Row>
                    {SIZES.map((size) => (
                        <Textarea key={size} size={size} placeholder={size} rows={2} />
                    ))}
                </Row>
            </Section>

            <Section title="Real use · review with a live character count">
                <div className="max-w-sm rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Your review</label>
                        <Textarea
                            color={note.length > max ? "error" : "primary"}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                        />
                        <span
                            className={`self-end text-xs ${
                                note.length > max ? "text-error" : "opacity-60"
                            }`}
                        >
                            {note.length} / {max}
                        </span>
                    </div>
                </div>
            </Section>
        </>
    );
}
