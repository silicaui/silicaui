import { Status } from "silicaui-react";
import { Section, Row } from "../lib/Section";
import { COLORS, SIZES } from "../lib/data";

export function StatusDemo() {
    return (
        <>
            <Section title="Colors">
                <Row>
                    {COLORS.map((color) => (
                        <span key={color} className="flex items-center gap-1.5 text-sm">
                            <Status color={color} label={color} />
                            {color}
                        </span>
                    ))}
                </Row>
            </Section>

            <Section title="Sizes">
                <Row>
                    {SIZES.map((size) => (
                        <span key={size} className="flex items-center gap-1.5 text-sm">
                            <Status color="primary" size={size} />
                            {size}
                        </span>
                    ))}
                </Row>
            </Section>

            <Section title="Real use · team presence">
                <div className="flex flex-col gap-2 text-sm">
                    <span className="flex items-center gap-1.5">
                        <Status color="success" ping label="Online" />
                        Ada Lovelace — active now
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Status color="warning" label="Away" />
                        Grace Hopper — away
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Status color="neutral" label="Offline" />
                        Alan Turing — offline
                    </span>
                </div>
            </Section>
        </>
    );
}
