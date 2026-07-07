import { useState } from "react";
import {
    Input,
    Field,
    FieldLabel,
    FieldControl,
    FieldDescription,
    FieldError,
    FloatingLabel,
    Button,
} from "silicaui-react";
import { Section, Row, Stack } from "../lib/Section";
import { SIZES } from "../lib/data";

export function InputDemo() {
    const [email, setEmail] = useState("not-an-email");
    const invalid = email.length > 0 && !email.includes("@");

    return (
        <>
            <Section title="Colors">
                <Stack className="max-w-md">
                    <Input placeholder="Default (focus for primary ring)" />
                    <Input color="primary" placeholder="Primary" />
                    <Input color="success" placeholder="Success" />
                    <Input color="error" placeholder="Error" defaultValue="not-an-email" />
                    <Input color="brand" placeholder="SilicaUI" />
                    <Input disabled placeholder="Disabled" />
                </Stack>
            </Section>

            <Section title="Sizes">
                <Stack className="max-w-md">
                    {SIZES.map((size) => (
                        <Input key={size} size={size} placeholder={size} />
                    ))}
                </Stack>
            </Section>

            <Section title="Real form · Field + validation">
                <div className="max-w-sm rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <Field
                            validationMode="onChange"
                            validate={() => (invalid ? "Enter a valid email address" : null)}
                        >
                            <FieldLabel>Work email</FieldLabel>
                            <FieldControl
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                            />
                            <FieldDescription>
                                We'll send a magic link to sign in.
                            </FieldDescription>
                            <FieldError />
                        </Field>
                        <FloatingLabel label="Company name">
                            <Input />
                        </FloatingLabel>
                        <Row>
                            <Button color="primary" block>
                                Continue
                            </Button>
                        </Row>
                    </div>
                </div>
            </Section>
        </>
    );
}
