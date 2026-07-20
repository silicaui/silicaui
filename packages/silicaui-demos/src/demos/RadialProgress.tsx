import { useState, useEffect } from "react";
import { RadialProgress } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";
import { COLORS } from "../lib/data";

export function RadialProgressDemo() {
    const [pct, setPct] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setPct((p) => (p >= 100 ? 0 : p + 5)), 200);
        return () => clearInterval(id);
    }, []);

    return (
        <>
            <Section title="Colors">
                <Row>
                    {COLORS.slice(0, 6).map((color) => (
                        <RadialProgress key={color} value={70} color={color} />
                    ))}
                </Row>
            </Section>

            <Section title="Sizes">
                <Row>
                    <RadialProgress value={60} color="primary" size="3rem" thickness="0.35rem" />
                    <RadialProgress value={60} color="primary" size="5rem" thickness="0.5rem" />
                    <RadialProgress value={60} color="primary" size="8rem" thickness="0.75rem" />
                </Row>
            </Section>

            <Section title="Real use · animated upload progress">
                <RadialProgress value={pct} color="brand" size="6rem" />
            </Section>
        </>
    );
}
