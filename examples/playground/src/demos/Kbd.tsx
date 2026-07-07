import { Kbd } from "silicaui-react";
import { Section, Row } from "../lib/Section";
import { SIZES } from "../lib/data";

export function KbdDemo() {
    return (
        <>
            <Section title="Sizes">
                <Row>
                    {SIZES.map((size) => (
                        <Kbd key={size} size={size}>
                            {size}
                        </Kbd>
                    ))}
                </Row>
            </Section>

            <Section title="Real use · shortcuts inline">
                <div className="flex flex-col gap-2 text-sm">
                    <p>
                        Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the command palette.
                    </p>
                    <p>
                        <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>P</Kbd> on Windows.
                    </p>
                    <p>
                        <Kbd>Esc</Kbd> to close any dialog.
                    </p>
                </div>
            </Section>
        </>
    );
}
