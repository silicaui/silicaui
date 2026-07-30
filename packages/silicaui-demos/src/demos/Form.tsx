import { useState } from "react";
import {
    Button,
    Field,
    FieldControl,
    FieldError,
    FieldLabel,
    Form,
    PasswordInput,
    ToggleGroup,
    ToggleGroupItem,
} from "@wizeworks/silicaui-react";
import type { FormFocusOnError } from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";

type Errors = Record<string, string>;

/**
 * `Form` runs each Field's validation on submit and moves focus to the first
 * invalid control. `focusOnError` decides how far that goes — the sign-in shape
 * below is where it matters, because the rejection arrives from a server long
 * after the user has moved on to the next field.
 */
export function FormDemo() {
    const [focusOnError, setFocusOnError] = useState<FormFocusOnError>(true);
    const [errors, setErrors] = useState<Errors>({});
    const [pending, setPending] = useState(false);

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrors({});
        setPending(true);
        // Stands in for a sign-in round trip. Type into the password field while
        // it runs: the caret has to stay put when the rejection lands.
        window.setTimeout(() => {
            setPending(false);
            setErrors({ email: "That address isn't registered." });
        }, 1500);
    }

    return (
        <>
            <Section title="focusOnError">
                <Stack className="max-w-sm">
                    <ToggleGroup
                        size="sm"
                        value={[String(focusOnError)]}
                        onValueChange={(v) => {
                            const next = v[0];
                            if (next == null) return; // clicking the active item can't clear it
                            setFocusOnError(
                                next === "false" ? false : next === "scroll" ? "scroll" : true,
                            );
                        }}
                    >
                        <ToggleGroupItem value="true">true</ToggleGroupItem>
                        <ToggleGroupItem value="scroll">scroll</ToggleGroupItem>
                        <ToggleGroupItem value="false">false</ToggleGroupItem>
                    </ToggleGroup>
                    <p className="text-sm">
                        Submit with an invalid email to see the client-side path. For the
                        async path, submit a <em>valid</em> address and keep typing your
                        password during the 1.5s round trip — the rejection must not take
                        the caret.
                    </p>
                </Stack>
            </Section>

            <Section title="Sign in">
                <Form
                    errors={errors}
                    focusOnError={focusOnError}
                    onSubmit={onSubmit}
                    className="grid max-w-sm gap-4"
                >
                    <Field name="email">
                        <FieldLabel required>Email</FieldLabel>
                        <FieldControl
                            type="email"
                            required
                            placeholder="you@example.com"
                            data-testid="demo-email"
                        />
                        <FieldError />
                    </Field>
                    <Field
                        name="password"
                        validate={(v) =>
                            String(v ?? "").length >= 8 ? null : "Use at least 8 characters."
                        }
                    >
                        <FieldLabel required>Password</FieldLabel>
                        <FieldControl
                            required
                            render={<PasswordInput data-testid="demo-password" />}
                        />
                        <FieldError />
                    </Field>
                    <Button type="submit" color="primary" loading={pending}>
                        {pending ? "Signing in…" : "Sign in"}
                    </Button>
                </Form>
            </Section>
        </>
    );
}
