import { Indicator, IndicatorItem, Badge, Button, Status } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function IndicatorDemo() {
    return (
        <>
            <Section title="Placements">
                <Row>
                    {(["top-end", "top-start", "bottom-end", "bottom-start"] as const).map(
                        (placement) => (
                            <Indicator key={placement}>
                                <IndicatorItem placement={placement}>
                                    <Badge color="error" size="xs">
                                        3
                                    </Badge>
                                </IndicatorItem>
                                <Button variant="outline" color="neutral">
                                    {placement}
                                </Button>
                            </Indicator>
                        ),
                    )}
                </Row>
            </Section>

            <Section title="Real use · notification badge + presence dot">
                <Row>
                    <Indicator>
                        <IndicatorItem>
                            <Badge color="error" size="xs">
                                5
                            </Badge>
                        </IndicatorItem>
                        <Button variant="outline" color="neutral">
                            Inbox
                        </Button>
                    </Indicator>
                    <Indicator>
                        <IndicatorItem>
                            <Status color="success" ping />
                        </IndicatorItem>
                        <Button variant="outline" color="neutral">
                            Ada Lovelace
                        </Button>
                    </Indicator>
                </Row>
            </Section>
        </>
    );
}
