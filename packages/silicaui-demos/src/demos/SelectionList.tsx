import { useState } from "react";
import { SelectionList } from "@wizeworks/silicaui-react";
import type { SelectionListItem } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

const PlanIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
    </svg>
);

const PLANS: SelectionListItem[] = [
    { id: "free", label: "Free", description: "For trying things out", icon: PlanIcon },
    { id: "pro", label: "Pro", description: "For growing teams", icon: PlanIcon },
    { id: "enterprise", label: "Enterprise", description: "Custom limits & support", icon: PlanIcon },
];

const NOTIFICATIONS: SelectionListItem[] = [
    { id: "email", label: "Email", description: "Order + shipping updates" },
    { id: "sms", label: "SMS", description: "Delivery alerts only" },
    { id: "push", label: "Push", description: "Real-time on this device" },
    { id: "digest", label: "Weekly digest", description: "Coming soon", disabled: true },
];

export function SelectionListDemo() {
    const [plan, setPlan] = useState<string[]>(["pro"]);
    const [channels, setChannels] = useState<string[]>(["email", "push"]);

    return (
        <>
            <Section title="Real use · single-select plan picker">
                <Row>
                    <SelectionList
                        items={PLANS}
                        value={plan}
                        onValueChange={setPlan}
                        className="w-72"
                    />
                </Row>
            </Section>

            <Section title="Multi-select · notification channels">
                <Row>
                    <SelectionList
                        items={NOTIFICATIONS}
                        multiple
                        value={channels}
                        onValueChange={setChannels}
                        className="w-72"
                    />
                </Row>
            </Section>
        </>
    );
}
