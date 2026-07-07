import { Stack, Card, CardBody } from "silicaui-react";
import { Section } from "../lib/Section";

const CARDS = [
    { label: "1", color: "primary" },
    { label: "2", color: "secondary" },
    { label: "3", color: "accent" },
];

export function StackDemo() {
    return (
        <>
            <Section title="Real use · interactive peeking deck (click to cycle)">
                <Stack interactive className="h-32 w-48">
                    {CARDS.map((c) => (
                        <Card
                            key={c.label}
                            style={{
                                backgroundColor: `var(--color-${c.color})`,
                                color: `var(--color-${c.color}-content, #fff)`,
                            }}
                        >
                            <CardBody className="items-center justify-center text-2xl font-bold">
                                {c.label}
                            </CardBody>
                        </Card>
                    ))}
                </Stack>
            </Section>

            <Section title="Peek direction">
                <div className="flex gap-8">
                    {(["top", "bottom", "start", "end"] as const).map((peek) => (
                        <Stack key={peek} peek={peek} className="h-20 w-28">
                            {CARDS.map((c) => (
                                <Card
                                    key={c.label}
                                    style={{
                                        backgroundColor: `var(--color-${c.color})`,
                                        color: `var(--color-${c.color}-content, #fff)`,
                                    }}
                                >
                                    <CardBody className="items-center justify-center text-sm">
                                        {peek}
                                    </CardBody>
                                </Card>
                            ))}
                        </Stack>
                    ))}
                </div>
            </Section>
        </>
    );
}
