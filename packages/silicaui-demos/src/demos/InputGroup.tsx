import { Input, InputGroup, InputGroupAddon } from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";

const AtIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-5.5 8.28" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export function InputGroupDemo() {
    return (
        <Section title="Custom affix composition">
            <p className="max-w-sm text-xs opacity-60">
                The primitive behind PasswordInput/SearchInput/PhoneInput — compose your
                own leading/trailing icon or text around any Input.
            </p>
            <Stack className="max-w-sm">
                <InputGroup>
                    <InputGroupAddon placement="start">
                        <AtIcon />
                    </InputGroupAddon>
                    <Input className="input-affix-start" placeholder="username" />
                </InputGroup>
            </Stack>
        </Section>
    );
}
