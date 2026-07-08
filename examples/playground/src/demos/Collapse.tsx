import { Collapse, CollapseTitle, CollapseContent } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const FAQS = [
    { q: "Can I change plans later?", a: "Yes — upgrade or downgrade anytime from Settings." },
    { q: "Do you offer refunds?", a: "Full refund within 14 days, no questions asked." },
    { q: "Is there a free trial?", a: "14 days on every paid plan, no card required." },
];

export function CollapseDemo() {
    return (
        <>
            <Section title="Real use · FAQ (exclusive — one open at a time)">
                <div className="flex max-w-md flex-col gap-2">
                    {FAQS.map((f, i) => (
                        <Collapse key={f.q} name="faq" open={i === 0}>
                            <CollapseTitle>{f.q}</CollapseTitle>
                            <CollapseContent>{f.a}</CollapseContent>
                        </Collapse>
                    ))}
                </div>
            </Section>

            <Section title="Ghost (borderless)">
                <Collapse ghost className="max-w-md">
                    <CollapseTitle>Shipping details</CollapseTitle>
                    <CollapseContent>Ships in 2–3 business days.</CollapseContent>
                </Collapse>
            </Section>
        </>
    );
}
