import { useState } from "react";
import { PinInput } from "@wizeworks/silicaui-react";
import { Section, Stack, Row } from "../lib/Section";
import { SIZES } from "../lib/data";

export function PinInputDemo() {
    const [code, setCode] = useState("");
    const [completed, setCompleted] = useState("");

    return (
        <>
            <Section title="Colors">
                <Stack>
                    <PinInput length={4} />
                    <PinInput length={4} color="primary" />
                    <PinInput length={4} color="error" defaultValue="12" />
                    <PinInput length={4} disabled defaultValue="1234" />
                </Stack>
            </Section>

            <Section title="Sizes">
                <Stack>
                    {SIZES.map((size) => (
                        <PinInput key={size} length={4} size={size} />
                    ))}
                </Stack>
            </Section>

            <Section title="Masked (text mode)">
                <Row>
                    <PinInput length={4} mode="text" mask />
                </Row>
            </Section>

            <Section title="Controlled + onComplete">
                <Stack>
                    <PinInput
                        length={6}
                        value={code}
                        onValueChange={setCode}
                        onComplete={setCompleted}
                    />
                    <p className="text-xs opacity-60">
                        Value: {code || "(empty)"}
                        {completed && ` — completed: ${completed}`}
                    </p>
                </Stack>
            </Section>
        </>
    );
}
