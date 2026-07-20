import { Timestamp } from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";

const now = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function TimestampDemo() {
    return (
        <>
            <Section title="Auto (relative within 24h, absolute beyond)">
                <Stack>
                    <p>
                        Just now — <Timestamp value={now - 30_000} />
                    </p>
                    <p>
                        5 minutes ago — <Timestamp value={now - 5 * MIN} />
                    </p>
                    <p>
                        3 hours ago — <Timestamp value={now - 3 * HOUR} />
                    </p>
                    <p>
                        2 days ago — <Timestamp value={now - 2 * DAY} />
                    </p>
                    <p>
                        2 months ago — <Timestamp value={now - 60 * DAY} />
                    </p>
                </Stack>
            </Section>

            <Section title="Forced format">
                <Stack>
                    <p>
                        Relative — <Timestamp value={now - 3 * DAY} format="relative" />
                    </p>
                    <p>
                        Absolute — <Timestamp value={now - 3 * DAY} format="absolute" />
                    </p>
                </Stack>
            </Section>
        </>
    );
}
