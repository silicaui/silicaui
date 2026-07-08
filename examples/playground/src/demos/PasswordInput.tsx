import { useState } from "react";
import { PasswordInput } from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";
import { SIZES } from "../lib/data";

export function PasswordInputDemo() {
    const [value, setValue] = useState("hunter2");

    return (
        <>
            <Section title="Colors">
                <Stack className="max-w-sm">
                    <PasswordInput placeholder="Default" />
                    <PasswordInput color="primary" placeholder="Primary" />
                    <PasswordInput color="error" placeholder="Error" defaultValue="tooshort" />
                    <PasswordInput disabled placeholder="Disabled" defaultValue="secret123" />
                </Stack>
            </Section>

            <Section title="Sizes">
                <Stack className="max-w-sm">
                    {SIZES.map((size) => (
                        <PasswordInput key={size} size={size} placeholder={size} />
                    ))}
                </Stack>
            </Section>

            <Section title="Controlled">
                <Stack className="max-w-sm">
                    <PasswordInput
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Password"
                    />
                    <p className="text-xs opacity-60">{value.length} characters</p>
                </Stack>
            </Section>
        </>
    );
}
