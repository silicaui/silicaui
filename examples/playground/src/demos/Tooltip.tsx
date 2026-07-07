import { Tooltip, TooltipProvider, Button } from "silicaui-react";
import { Section, Row } from "../lib/Section";

export function TooltipDemo() {
    return (
        <TooltipProvider>
            <Section title="Real use · sides (hover or focus a trigger)">
                <Row>
                    {(["top", "right", "bottom", "left"] as const).map((side) => (
                        <Tooltip key={side} content={`On the ${side}`} side={side}>
                            <Button variant="outline" color="neutral">
                                {side}
                            </Button>
                        </Tooltip>
                    ))}
                </Row>
            </Section>

            <Section title="Grouped delay (adjacent tooltips open instantly)">
                <Row>
                    <Tooltip content="Copy link">
                        <Button variant="ghost" color="neutral">
                            Copy
                        </Button>
                    </Tooltip>
                    <Tooltip content="Share">
                        <Button variant="ghost" color="neutral">
                            Share
                        </Button>
                    </Tooltip>
                    <Tooltip content="Delete">
                        <Button variant="ghost" color="error">
                            Delete
                        </Button>
                    </Tooltip>
                </Row>
            </Section>
        </TooltipProvider>
    );
}
