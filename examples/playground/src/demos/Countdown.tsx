import { useState } from "react";
import { Countdown } from "silicaui-react";
import { Section } from "../lib/Section";

export function CountdownDemo() {
    const [target] = useState(() => Date.now() + 90 * 1000);

    return (
        <>
            <Section title="Real use · launch countdown (90s demo)">
                <Countdown to={target} />
            </Section>

            <Section title="Selected units, plain style">
                <Countdown to={target} units={["minutes", "seconds"]} plain />
            </Section>
        </>
    );
}
