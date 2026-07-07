import {
    Timeline,
    TimelineItem,
    TimelineStart,
    TimelineMiddle,
    TimelineEnd,
} from "silicaui-react";
import { Section } from "../lib/Section";

export function TimelineDemo() {
    return (
        <>
            <Section title="Real use · company milestones">
                <Timeline className="max-w-md">
                    <TimelineItem>
                        <TimelineStart>2021</TimelineStart>
                        <TimelineMiddle />
                        <TimelineEnd box>Founded</TimelineEnd>
                    </TimelineItem>
                    <TimelineItem>
                        <TimelineStart>2023</TimelineStart>
                        <TimelineMiddle />
                        <TimelineEnd box>Seed round closed</TimelineEnd>
                    </TimelineItem>
                    <TimelineItem>
                        <TimelineStart>2026</TimelineStart>
                        <TimelineMiddle />
                        <TimelineEnd box>Shipped 1.0</TimelineEnd>
                    </TimelineItem>
                </Timeline>
            </Section>

            <Section title="Horizontal">
                <Timeline orientation="horizontal" className="max-w-lg">
                    <TimelineItem>
                        <TimelineStart>Cart</TimelineStart>
                        <TimelineMiddle />
                    </TimelineItem>
                    <TimelineItem>
                        <TimelineStart>Shipping</TimelineStart>
                        <TimelineMiddle />
                    </TimelineItem>
                    <TimelineItem>
                        <TimelineStart>Payment</TimelineStart>
                        <TimelineMiddle />
                    </TimelineItem>
                </Timeline>
            </Section>
        </>
    );
}
