import {
    Stats,
    Stat,
    StatTitle,
    StatValue,
    StatDesc,
    StatFigure,
} from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";
import { UserIcon } from "../lib/icons";

export function StatDemo() {
    return (
        <>
            <Section title="Real use · dashboard KPIs">
                <Stats>
                    <Stat>
                        <StatFigure>
                            <UserIcon />
                        </StatFigure>
                        <StatTitle>New users</StatTitle>
                        <StatValue>1,204</StatValue>
                        <StatDesc>↗︎ 3.2% this month</StatDesc>
                    </Stat>
                    <Stat>
                        <StatTitle>Revenue</StatTitle>
                        <StatValue>$14,300</StatValue>
                        <StatDesc>↗︎ 12.4% this month</StatDesc>
                    </Stat>
                    <Stat>
                        <StatTitle>Churn</StatTitle>
                        <StatValue>1.8%</StatValue>
                        <StatDesc>↘︎ 0.6% this month</StatDesc>
                    </Stat>
                </Stats>
            </Section>

            <Section title="Vertical layout">
                <Stats vertical className="max-w-xs">
                    <Stat>
                        <StatTitle>Storage used</StatTitle>
                        <StatValue>72 GB</StatValue>
                        <StatDesc>of 100 GB</StatDesc>
                    </Stat>
                    <Stat>
                        <StatTitle>Bandwidth</StatTitle>
                        <StatValue>1.2 TB</StatValue>
                        <StatDesc>this billing cycle</StatDesc>
                    </Stat>
                </Stats>
            </Section>

            <Section title="Glass · KPI band over a colored hero">
                <div
                    className="rounded-box p-8"
                    style={{
                        backgroundImage:
                            "linear-gradient(135deg, var(--color-primary), var(--color-accent), var(--color-secondary))",
                    }}
                >
                    <Stats className="glass">
                        <Stat>
                            <StatFigure>
                                <UserIcon />
                            </StatFigure>
                            <StatTitle>New users</StatTitle>
                            <StatValue>1,204</StatValue>
                            <StatDesc>↗︎ 3.2% this month</StatDesc>
                        </Stat>
                        <Stat>
                            <StatTitle>Revenue</StatTitle>
                            <StatValue>$14,300</StatValue>
                            <StatDesc>↗︎ 12.4% this month</StatDesc>
                        </Stat>
                        <Stat>
                            <StatTitle>Churn</StatTitle>
                            <StatValue>1.8%</StatValue>
                            <StatDesc>↘︎ 0.6% this month</StatDesc>
                        </Stat>
                    </Stats>
                </div>
            </Section>
        </>
    );
}
