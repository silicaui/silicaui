import { useState } from "react";
import {
    Button,
    Field,
    FieldLabel,
    FieldControl,
    FieldDescription,
    FieldError,
    FieldStatus,
    Textarea,
} from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";

export function FieldDemo() {
    const [floatingError, setFloatingError] = useState(false);
    return (
        <>
            <Section title="Real use · required field with description">
                <Field className="max-w-sm">
                    <FieldLabel required>Full name</FieldLabel>
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
                    <Field disabled disabledMessage="Contact your admin to change this.">
                        <FieldLabel>Billing plan</FieldLabel>
                        <FieldControl defaultValue="Enterprise" />
                    </Field>
                </Stack>
            </Section>

            <Section title="FieldStatus · attached (border+icon+message panel)">
                <Stack className="max-w-sm">
                    <Field status="error" statusMessage="Please enter a valid email address.">
                        <FieldLabel>Email</FieldLabel>
                        <FieldControl defaultValue="sarah@" />
                    </Field>
                    <Field status="warning" statusMessage="This username is already taken — try adding a number.">
                        <FieldLabel>Username</FieldLabel>
                        <FieldControl defaultValue="sarah_chen" />
                    </Field>
                    <Field status="success" statusMessage="URL is valid and reachable.">
                        <FieldLabel>Website</FieldLabel>
                        <FieldControl defaultValue="https://sarahchen.dev" />
                    </Field>
                    <Field status="error">
                        <FieldLabel>Status without message</FieldLabel>
                        <FieldControl defaultValue="test" />
                    </Field>
                    <Field status="error" statusMessage="Key is required.">
                        <FieldLabel required>Key</FieldLabel>
                        <FieldControl placeholder="case_study" />
                        <FieldDescription>
                            Immutable URL-safe identifier (lowercase, underscores).
                        </FieldDescription>
                    </Field>
                    <Field loading>
                        <FieldLabel>Loading field</FieldLabel>
                        <FieldControl defaultValue="sarahc" />
                    </Field>
                </Stack>
            </Section>

            <Section title="FieldStatus · floating (overlays instead of pushing sibling fields)">
                <Stack className="max-w-sm">
                    <Button size="sm" onClick={() => setFloatingError((v) => !v)}>
                        Toggle error
                    </Button>
                    <Field
                        floating
                        status={floatingError ? "error" : undefined}
                        statusMessage={
                            floatingError ? "Please enter a valid email address." : undefined
                        }
                    >
                        <FieldLabel>Email</FieldLabel>
                        <FieldControl defaultValue="sarah@" />
                    </Field>
                    <Field>
                        <FieldLabel>Next field (stays put either way)</FieldLabel>
                        <FieldControl defaultValue="unaffected" />
                    </Field>
                </Stack>
            </Section>

            <Section title="FieldStatus · detached (for checkboxes/switches/custom controls)">
                <Stack className="max-w-sm">
                    <FieldStatus status="error" attached={false}>
                        This field is required
                    </FieldStatus>
                    <FieldStatus status="success" attached={false}>
                        Your changes have been saved
                    </FieldStatus>
                </Stack>
            </Section>
        </>
    );
}
