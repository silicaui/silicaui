import { useState } from "react";
import { Steps, Step, Button } from "silicaui-react";
import { Section, Row } from "../lib/Section";
import { COLORS } from "../lib/data";

const CHECKOUT = ["Cart", "Shipping", "Payment", "Done"];

export function StepsDemo() {
    const [current, setCurrent] = useState(1);

    return (
        <>
            <Section title="Colors (completed steps)">
                <div className="flex flex-col gap-6">
                    {COLORS.slice(0, 6).map((color) => (
                        <Steps key={color}>
                            <Step color={color} data-content="✓">
                                Cart
                            </Step>
                            <Step color={color} data-content="✓">
                                Shipping
                            </Step>
                            <Step color={color}>Payment</Step>
                            <Step>Done</Step>
                        </Steps>
                    ))}
                </div>
            </Section>

            <Section title="Real use · interactive checkout">
                <div className="flex max-w-lg flex-col gap-4">
                    <Steps>
                        {CHECKOUT.map((label, i) => (
                            <Step
                                key={label}
                                color={i <= current ? "primary" : undefined}
                                data-content={i < current ? "✓" : undefined}
                            >
                                {label}
                            </Step>
                        ))}
                    </Steps>
                    <Row>
                        <Button
                            variant="outline"
                            color="neutral"
                            disabled={current === 0}
                            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                        >
                            Back
                        </Button>
                        <Button
                            color="primary"
                            disabled={current === CHECKOUT.length - 1}
                            onClick={() =>
                                setCurrent((c) => Math.min(CHECKOUT.length - 1, c + 1))
                            }
                        >
                            {current === CHECKOUT.length - 2 ? "Place order" : "Next"}
                        </Button>
                    </Row>
                </div>
            </Section>
        </>
    );
}
