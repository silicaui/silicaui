import { useState } from "react";
import { NumberField } from "silicaui-react";
import { Section, Row } from "../lib/Section";

export function NumberFieldDemo() {
    const [qty, setQty] = useState<number | null>(2);

    return (
        <>
            <Section title="Real use · cart quantity">
                <Row>
                    <NumberField
                        label="Quantity"
                        value={qty}
                        onValueChange={setQty}
                        min={1}
                        max={10}
                    />
                    <span className="text-sm opacity-60">{qty ?? 0} in cart</span>
                </Row>
            </Section>

            <Section title="Step + bounds">
                <Row>
                    <NumberField label="Percent" defaultValue={50} min={0} max={100} step={5} />
                </Row>
            </Section>
        </>
    );
}
