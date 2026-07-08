import {
    Field,
    FieldLabel,
    FieldControl,
    FieldDescription,
    FieldError,
    Textarea,
} from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";

export function FieldDemo() {
    return (
        <>
            <Section title="Real use · required field with description">
                <Field className="max-w-sm">
                    <FieldLabel>Full name</FieldLabel>
                    <FieldControl required placeholder="Ada Lovelace" />
                    <FieldDescription>As it appears on your ID.</FieldDescription>
                    <FieldError />
                </Field>
            </Section>

            <Section title="Non-input control via render (Textarea)">
                <Field className="max-w-sm">
                    <FieldLabel>Bio</FieldLabel>
                    <FieldControl render={<Textarea rows={3} />} />
                    <FieldDescription>Shown on your public profile.</FieldDescription>
                </Field>
            </Section>

            <Section title="Disabled">
                <Stack className="max-w-sm">
                    <Field disabled>
                        <FieldLabel>Organization</FieldLabel>
                        <FieldControl defaultValue="Silica UI" />
                    </Field>
                </Stack>
            </Section>
        </>
    );
}
