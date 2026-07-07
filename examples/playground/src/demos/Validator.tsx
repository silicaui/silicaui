import { Validator, ValidatorHint, Input } from "silicaui-react";
import { Section, Stack } from "../lib/Section";

export function ValidatorDemo() {
    return (
        <Section title="Real use · native validity styling (type to see it flip)">
            <Stack className="max-w-sm">
                <Validator>
                    <Input required type="email" placeholder="you@example.com" />
                </Validator>
                <ValidatorHint>Enter a valid email address.</ValidatorHint>

                <Validator>
                    <Input required minLength={8} type="password" placeholder="Password (min 8 chars)" />
                </Validator>
                <ValidatorHint>Must be at least 8 characters.</ValidatorHint>
            </Stack>
        </Section>
    );
}
