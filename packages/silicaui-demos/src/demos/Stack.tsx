import { Stack, Card, CardBody } from "@wizeworks/silicaui-react";
import type { SilicaSize } from "@wizeworks/silicaui-react";
import { Section, LabeledRow } from "../lib/Section";

const CARDS = [
    { label: "1", tone: "bg-primary text-primary-content" },
    { label: "2", tone: "bg-secondary text-secondary-content" },
    { label: "3", tone: "bg-accent text-accent-content" },
];

/**
 * The deck's three cards. A `stack` stretches its children to its own WIDTH but
 * leaves their height to them, so the height class goes here on the card — not
 * on the `<Stack>`, where it would size an empty box around content-height
 * cards and make the fan look far smaller than asked for.
 */
function Deck({ card, body }: { card: string; body: string }) {
    return (
        <>
            {CARDS.map((c) => (
                <Card key={c.label} className={`${c.tone} ${card}`}>
                    <CardBody className={`items-center justify-center ${body}`}>
                        {c.label}
                    </CardBody>
                </Card>
            ))}
        </>
    );
}

export function StackDemo() {
    return (
        <>
            <Section title="Real use · interactive peeking deck (click to cycle)">
                <Stack interactive className="w-48" data-demo="interactive">
                    <Deck card="h-32" body="text-2xl font-bold" />
                </Stack>
            </Section>

            <Section title="Peek direction">
                <div className="flex gap-8">
                    {(["top", "bottom", "start", "end"] as const).map((peek) => (
                        <Stack
                            key={peek}
                            peek={peek}
                            className="w-28"
                            data-demo={`dir-${peek}`}
                        >
                            <Deck card="h-20" body="text-sm" />
                        </Stack>
                    ))}
                </div>
            </Section>

            <Section title="Fan distance">
                <div className="flex flex-wrap items-end gap-8">
                    {(["xs", "sm", "md", "lg", "xl"] as SilicaSize[]).map((size) => (
                        <LabeledRow key={size} label={size}>
                            <Stack
                                size={size}
                                className="w-32"
                                data-demo={`size-${size}`}
                            >
                                <Deck card="h-24" body="text-sm" />
                            </Stack>
                        </LabeledRow>
                    ))}
                </div>
            </Section>

            {/*
              The peek is a share of the card's own size, so it survives a real
              content-height card. Fixed-distance nudges did not: the shrink from
              `scale()` out-ran them and the deck collapsed to a single card above
              ~320px. Keep a large specimen here so that cannot come back
              unnoticed — e2e/stack-peek.spec.ts measures exactly these two.
            */}
            <Section title="Large cards · the peek scales with the card">
                <div className="flex flex-wrap items-end gap-10">
                    <LabeledRow label="480 × 448">
                        <Stack className="w-[480px]" data-demo="large">
                            <Deck card="h-[448px]" body="text-4xl" />
                        </Stack>
                    </LabeledRow>
                    <LabeledRow label="480 × 448 · [--stack-peek:4%]">
                        <Stack
                            className="w-[480px] [--stack-peek:4%]"
                            data-demo="large-tuned"
                        >
                            <Deck card="h-[448px]" body="text-4xl" />
                        </Stack>
                    </LabeledRow>
                </div>
            </Section>
        </>
    );
}
