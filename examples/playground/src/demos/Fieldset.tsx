import { Fieldset, FieldsetLegend, FieldsetLabel, Input } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function FieldsetDemo() {
    return (
        <>
            <Section title="Real use · profile group">
                <Fieldset className="max-w-sm">
                    <FieldsetLegend>Profile</FieldsetLegend>
                    <Input placeholder="Full name" />
                    <FieldsetLabel>Your full legal name.</FieldsetLabel>
                </Fieldset>
            </Section>

            <Section title="Disabled cascades to every control">
                <Fieldset disabled className="max-w-sm">
                    <FieldsetLegend>Billing (locked)</FieldsetLegend>
                    <Input placeholder="Card number" />
                    <FieldsetLabel>Contact support to change billing.</FieldsetLabel>
                </Fieldset>
            </Section>
        </>
    );
}
