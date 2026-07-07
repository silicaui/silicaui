import { Label, FloatingLabel, Input } from "silicaui-react";
import { Section, Stack } from "../lib/Section";

export function LabelDemo() {
    return (
        <>
            <Section title="Plain label">
                <div className="flex max-w-sm flex-col gap-1.5">
                    <Label htmlFor="email-plain">Email</Label>
                    <Input id="email-plain" placeholder="you@example.com" />
                </div>
            </Section>

            <Section title="Real use · floating label form">
                <Stack className="max-w-sm">
                    <FloatingLabel label="Email">
                        <Input type="email" />
                    </FloatingLabel>
                    <FloatingLabel label="Password">
                        <Input type="password" />
                    </FloatingLabel>
                </Stack>
            </Section>
        </>
    );
}
