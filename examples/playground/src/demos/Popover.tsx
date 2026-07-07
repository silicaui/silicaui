import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverTitle,
    PopoverDescription,
    Button,
} from "silicaui-react";
import { Section } from "../lib/Section";

export function PopoverDemo() {
    return (
        <Section title="Real use · click-triggered info panel">
            <Popover>
                <PopoverTrigger>
                    <Button variant="outline" color="neutral">
                        Storage details
                    </Button>
                </PopoverTrigger>
                <PopoverContent arrow>
                    <PopoverTitle>Storage</PopoverTitle>
                    <PopoverDescription>
                        92% of your 100 GB quota is used. Upgrade your plan for more
                        space.
                    </PopoverDescription>
                </PopoverContent>
            </Popover>
        </Section>
    );
}
