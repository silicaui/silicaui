import { useState, useEffect } from "react";
import { Progress, Button } from "silicaui-react";
import { Section, Row, LabeledRow } from "../lib/Section";
import { COLORS, SIZES } from "../lib/data";

export function ProgressDemo() {
    const [pct, setPct] = useState(40);
    const [upload, setUpload] = useState(0);

    useEffect(() => {
        const id = setInterval(
            () => setUpload((p) => (p >= 100 ? 0 : p + 4)),
            180,
        );
        return () => clearInterval(id);
    }, []);

    return (
        <>
            <Section title="Colors">
                <div className="grid max-w-md gap-4">
                    {COLORS.map((color) => (
                        <LabeledRow key={color} label={color}>
                            <Progress color={color} value={65} />
                        </LabeledRow>
                    ))}
                </div>
            </Section>

            <Section title="Sizes">
                <div className="flex max-w-md flex-col gap-2">
                    {SIZES.map((size) => (
                        <Progress key={size} color="primary" size={size} value={60} />
                    ))}
                </div>
            </Section>

            <Section title="Real use · task + upload progress">
                <div className="grid max-w-md gap-4">
                    <LabeledRow label="Onboarding · 3 of 4 steps">
                        <Progress color="success" value={3} max={4} />
                    </LabeledRow>
                    <LabeledRow label={`Uploading photo.png · ${upload}%`}>
                        <Progress color="brand" value={upload} />
                    </LabeledRow>
                    <LabeledRow label="Indeterminate (duration unknown)">
                        <Progress color="primary" />
                    </LabeledRow>
                    <LabeledRow label={`Interactive · ${pct}%`}>
                        <Progress color="warning" value={pct} />
                    </LabeledRow>
                    <Row>
                        <Button
                            size="sm"
                            variant="outline"
                            color="neutral"
                            onClick={() => setPct((p) => Math.max(0, p - 10))}
                        >
                            −10
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            color="neutral"
                            onClick={() => setPct((p) => Math.min(100, p + 10))}
                        >
                            +10
                        </Button>
                    </Row>
                </div>
            </Section>
        </>
    );
}
