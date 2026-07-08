import { useState } from "react";
import { RadioGroup, RadioOption } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function RadioGroupDemo() {
    const [plan, setPlan] = useState("pro");

    return (
        <>
            <Section title="Real use · billing plan">
                <RadioGroup value={plan} onValueChange={setPlan} color="primary">
                    <RadioOption value="starter">Starter — $9/mo</RadioOption>
                    <RadioOption value="pro">Pro — $29/mo</RadioOption>
                    <RadioOption value="enterprise">Enterprise — custom</RadioOption>
                </RadioGroup>
            </Section>

            <Section title="Horizontal">
                <RadioGroup defaultValue="md" orientation="horizontal" color="primary">
                    <RadioOption value="sm">Small</RadioOption>
                    <RadioOption value="md">Medium</RadioOption>
                    <RadioOption value="lg">Large</RadioOption>
                </RadioGroup>
            </Section>
        </>
    );
}
