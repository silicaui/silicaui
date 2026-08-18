import { useRef, useState } from "react";
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

            <ElementAnchor />
            <PointerAnchor />
        </>
    );
}

/**
 * `anchor` — position against something OTHER than the trigger. Without it a
 * popup can only ever sit against the element that opened it, which breaks the
 * common case of a toolbar button that annotates a row, a cell, or a chart mark.
 */
function ElementAnchor() {
    const target = useRef<HTMLDivElement>(null);

    return (
        <Section title="anchor · position against another element">
            <div className="flex items-start gap-8">
                <Popover>
                    <PopoverTrigger>
                        <Button variant="outline" color="neutral" data-demo="anchor-trigger">
                            Explain the total
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        anchor={target}
                        side="right"
                        arrow
                        data-demo="anchor-popup"
                    >
                        <PopoverTitle>Order total</PopoverTitle>
                        <PopoverDescription>
                            The panel is anchored to the figure, not to the button that
                            opened it.
                        </PopoverDescription>
                    </PopoverContent>
                </Popover>

                <div
                    ref={target}
                    data-demo="anchor-target"
                    className="rounded-box border border-base-300 px-6 py-4 text-2xl font-bold"
                >
                    $1,284.00
                </div>
            </div>
        </Section>
    );
}

/**
 * A virtual element is just `{ getBoundingClientRect() }` — enough to pin a
 * popup to a caret, a pointer, or a spot on a canvas that has no DOM node.
 */
function PointerAnchor() {
    const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

    return (
        <Section title="anchor · a virtual element at the pointer">
            <div
                data-demo="pointer-surface"
                className="grid h-40 place-items-center rounded-box border border-dashed border-base-300"
                onClick={(e) => setPoint({ x: e.clientX, y: e.clientY })}
            >
                Click anywhere in this box
            </div>

            <Popover open={point !== null} onOpenChange={() => setPoint(null)}>
                <PopoverContent
                    data-demo="pointer-popup"
                    side="bottom"
                    align="start"
                    anchor={
                        point && {
                            getBoundingClientRect: () =>
                                new DOMRect(point.x, point.y, 0, 0),
                        }
                    }
                >
                    <PopoverDescription>
                        Anchored at {point?.x}, {point?.y}
                    </PopoverDescription>
                </PopoverContent>
            </Popover>
        </Section>
    );
}
