import { useState } from "react";
import { PhoneInput } from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";
import { SIZES } from "../lib/data";

export function PhoneInputDemo() {
    const [national, setNational] = useState("");
    const [e164, setE164] = useState("");

    return (
        <>
            <Section title="Colors">
                <Stack className="max-w-sm">
                    <PhoneInput />
                    <PhoneInput color="primary" defaultCountry="GB" defaultValue="7911123456" />
                    <PhoneInput disabled defaultCountry="DE" defaultValue="15123456789" />
                </Stack>
            </Section>

            <Section title="Sizes">
                <Stack className="max-w-sm">
                    {SIZES.map((size) => (
                        <PhoneInput key={size} size={size} />
                    ))}
                </Stack>
            </Section>

            <Section title="Controlled">
                <Stack className="max-w-sm">
                    <PhoneInput
                        value={national}
                        onValueChange={(nat, e164) => {
                            setNational(nat);
                            setE164(e164);
                        }}
                    />
                    <p className="text-xs opacity-60">E.164: {e164 || "(empty)"}</p>
                </Stack>
            </Section>
        </>
    );
}
