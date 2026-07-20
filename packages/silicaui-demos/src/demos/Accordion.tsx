import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionPanel,
} from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function AccordionDemo() {
    return (
        <>
            <Section title="Real use · FAQ (single-open)">
                <Accordion defaultValue={["a"]} className="max-w-md">
                    <AccordionItem value="a">
                        <AccordionTrigger>What is Silica?</AccordionTrigger>
                        <AccordionPanel>
                            A component library and design system built on one CSS-first
                            token model.
                        </AccordionPanel>
                    </AccordionItem>
                    <AccordionItem value="b">
                        <AccordionTrigger>Is it themeable?</AccordionTrigger>
                        <AccordionPanel>
                            Yes — every color, radius, and size is a CSS variable you can
                            override per theme.
                        </AccordionPanel>
                    </AccordionItem>
                    <AccordionItem value="c">
                        <AccordionTrigger>Does it work with any framework?</AccordionTrigger>
                        <AccordionPanel>
                            The core is a Tailwind plugin; React components are a thin
                            typed layer on top.
                        </AccordionPanel>
                    </AccordionItem>
                </Accordion>
            </Section>

            <Section title="Multiple open at once">
                <Accordion multiple defaultValue={["a", "b"]} className="max-w-md">
                    <AccordionItem value="a">
                        <AccordionTrigger>Section one</AccordionTrigger>
                        <AccordionPanel>Both of these can be open together.</AccordionPanel>
                    </AccordionItem>
                    <AccordionItem value="b">
                        <AccordionTrigger>Section two</AccordionTrigger>
                        <AccordionPanel>Set the `multiple` prop to allow it.</AccordionPanel>
                    </AccordionItem>
                </Accordion>
            </Section>
        </>
    );
}
