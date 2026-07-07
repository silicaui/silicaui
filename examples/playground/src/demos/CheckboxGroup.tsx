import { useState } from "react";
import { CheckboxGroup, CheckboxOption } from "silicaui-react";
import { Section } from "../lib/Section";

export function CheckboxGroupDemo() {
    const [channels, setChannels] = useState<string[]>(["email", "push"]);

    return (
        <>
            <Section title="Real use · notification channels">
                <CheckboxGroup value={channels} onValueChange={setChannels} color="primary">
                    <CheckboxOption value="email">Email</CheckboxOption>
                    <CheckboxOption value="push">Push</CheckboxOption>
                    <CheckboxOption value="sms">SMS</CheckboxOption>
                </CheckboxGroup>
                <p className="pt-2 text-xs opacity-60">
                    Selected: {channels.join(", ") || "none"}
                </p>
            </Section>

            <Section title="Horizontal">
                <CheckboxGroup defaultValue={["mon", "wed", "fri"]} orientation="horizontal" color="primary">
                    <CheckboxOption value="mon">Mon</CheckboxOption>
                    <CheckboxOption value="wed">Wed</CheckboxOption>
                    <CheckboxOption value="fri">Fri</CheckboxOption>
                </CheckboxGroup>
            </Section>
        </>
    );
}
