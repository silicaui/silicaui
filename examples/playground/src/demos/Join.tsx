import { useState } from "react";
import { Join, Button, Input } from "silicaui-react";
import { Section, Row } from "../lib/Section";

const RANGES = ["Day", "Week", "Month"];

export function JoinDemo() {
    const [range, setRange] = useState("Week");

    return (
        <>
            <Section title="Real use · segmented range picker">
                <Join>
                    {RANGES.map((r) => (
                        <Button
                            key={r}
                            variant={r === range ? "solid" : "outline"}
                            color={r === range ? "primary" : "neutral"}
                            onClick={() => setRange(r)}
                        >
                            {r}
                        </Button>
                    ))}
                </Join>
            </Section>

            <Section title="Input + button">
                <Row>
                    <Join>
                        <Input placeholder="Search…" />
                        <Button color="primary">Go</Button>
                    </Join>
                </Row>
            </Section>

            <Section title="Vertical">
                <Join orientation="vertical" className="w-32">
                    <Button variant="outline" color="neutral">
                        Top
                    </Button>
                    <Button variant="outline" color="neutral">
                        Middle
                    </Button>
                    <Button variant="outline" color="neutral">
                        Bottom
                    </Button>
                </Join>
            </Section>
        </>
    );
}
