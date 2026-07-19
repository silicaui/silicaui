import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverTitle,
    PopoverDescription,
    Button,
} from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function PopoverDemo() {
    return (
        <>
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

            <Section title="Glass · frosted panel">
                <div
                    className="flex justify-center rounded-box p-16"
                    style={{
                        backgroundImage:
                            "linear-gradient(135deg, var(--color-primary), var(--color-accent), var(--color-secondary))",
                    }}
                >
                    <Popover>
                        <PopoverTrigger>
                            <Button variant="outline" color="neutral">
                                Storage details
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="glass" arrow>
                            <PopoverTitle>Storage</PopoverTitle>
                            <PopoverDescription>
                                <code>PopoverContent className=&quot;glass&quot;</code> — the
                                gradient behind it shows through the blur.
                            </PopoverDescription>
                        </PopoverContent>
                    </Popover>
                </div>
            </Section>
        </>
    );
}
