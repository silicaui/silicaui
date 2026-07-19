import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function CollapsibleDemo() {
    return (
        <Section title="Real use · single show/hide region">
            <Collapsible defaultOpen className="max-w-md">
                <CollapsibleTrigger>Shipping details</CollapsibleTrigger>
                <CollapsiblePanel>
                    Ships in 2–3 business days via standard shipping. Express options
                    are available at checkout.
                </CollapsiblePanel>
            </Collapsible>
        </Section>
    );
}
