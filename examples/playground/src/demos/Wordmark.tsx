import { Wordmark, WordmarkAccent } from "silicaui-react";
import { Section, Row } from "../lib/Section";

const Mark = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
    </svg>
);

export function WordmarkDemo() {
    return (
        <>
            <Section title="Real use · brand logotype">
                <Row>
                    <Wordmark>
                        Silica<WordmarkAccent>UI</WordmarkAccent>
                    </Wordmark>
                    <Wordmark as="a" href="#" color="primary">
                        {Mark}
                        Acme
                    </Wordmark>
                </Row>
            </Section>

            <Section title="Sizes">
                <Row>
                    <Wordmark size="xs">Silica</Wordmark>
                    <Wordmark size="sm">Silica</Wordmark>
                    <Wordmark size="md">Silica</Wordmark>
                    <Wordmark size="lg">Silica</Wordmark>
                    <Wordmark size="xl">Silica</Wordmark>
                </Row>
            </Section>

            <Section title="Colors">
                <Row>
                    <Wordmark>Base</Wordmark>
                    <Wordmark color="primary">Primary</Wordmark>
                    <Wordmark color="secondary">Secondary</Wordmark>
                    <Wordmark color="accent">Accent</Wordmark>
                </Row>
            </Section>
        </>
    );
}
