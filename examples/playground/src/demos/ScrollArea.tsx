import { ScrollArea } from "silicaui-react";
import { Section, Row } from "../lib/Section";

const ITEMS = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);

export function ScrollAreaDemo() {
    return (
        <>
            <Section title="Real use · scrollable list panel">
                <ScrollArea className="h-64 w-72 rounded-box border border-base-300">
                    <div className="flex flex-col gap-1 p-4">
                        {ITEMS.map((item) => (
                            <div key={item} className="rounded-field px-2 py-1 text-sm">
                                {item}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </Section>

            <Section title="Both axes">
                <Row>
                    <ScrollArea
                        orientation="both"
                        className="h-48 w-64 rounded-box border border-base-300"
                    >
                        <div style={{ width: "40rem", height: "24rem" }} className="p-4">
                            Wide + tall content — scroll both directions.
                        </div>
                    </ScrollArea>
                </Row>
            </Section>
        </>
    );
}
