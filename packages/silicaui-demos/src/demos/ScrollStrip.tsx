import { useState } from "react";
import { Badge, Button, ScrollStrip } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

// Six, not more: the pane has to be draggable to a width where they all FIT,
// or the demo only ever shows one of the two states it exists to contrast.
const TABS = ["Overview", "Timeline", "Messages", "Activity", "Documents", "Details"];

const CHIPS = ["All", "Open", "Pending review", "Blocked", "Scheduled", "Archived", "Draft"];

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

export function ScrollStripDemo() {
    // The demo has to be narrow-able, because the whole component only exists
    // for the width at which the content stops fitting — a fixed-width showcase
    // would never once show the controls.
    const [width, setWidth] = useState(28);
    const [active, setActive] = useState("Overview");

    return (
        <>
            <Section title="Real use · a tab strip in a pane you can drag narrow">
                <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 text-sm">
                        <span className="w-24 shrink-0">Pane width</span>
                        <input
                            type="range"
                            min={14}
                            max={48}
                            value={width}
                            onChange={(e) => setWidth(Number(e.target.value))}
                            className="range range-sm max-w-xs"
                        />
                        <span className="tabular-nums">{width}rem</span>
                    </label>

                    <div
                        className="rounded-box border border-base-300"
                        style={{ width: `${width}rem` }}
                    >
                        <ScrollStrip data-demo="pane" label="tabs" trackClassName="gap-1 p-1">
                            {TABS.map((tab) => (
                                <Button
                                    key={tab}
                                    variant={tab === active ? "soft" : "ghost"}
                                    color="neutral"
                                    size="sm"
                                    onClick={() => setActive(tab)}
                                >
                                    {tab}
                                </Button>
                            ))}
                        </ScrollStrip>
                        <div className="border-t border-base-300 p-4 text-sm">{active}</div>
                    </div>
                    <p className="max-w-md text-sm">
                        Drag it narrow: the pair of controls appears the moment a tab falls
                        off the edge, and each one disables at its end rather than
                        disappearing — so the strip never jumps sideways.
                    </p>
                </div>
            </Section>

            <Section title="Edge fade — a second, quieter signal">
                <div className="flex w-80 flex-col gap-4">
                    <ScrollStrip data-demo="fade" label="filters" fade size="sm" trackClassName="gap-2">
                        {CHIPS.map((chip) => (
                            <Badge key={chip} variant="outline" color="neutral">
                                {chip}
                            </Badge>
                        ))}
                    </ScrollStrip>
                    <p className="text-sm">
                        The controls say the strip <em>can</em> scroll; the fade says the
                        content continues right there. It clears itself at each end, so a
                        strip that fits is never dimmed.
                    </p>
                </div>
            </Section>

            <Section title="Control sizes">
                <div className="flex flex-col gap-3">
                    {SIZES.map((size) => (
                        <div key={size} className="flex items-center gap-3">
                            <span className="w-8 shrink-0 text-sm">{size}</span>
                            <div className="w-72">
                                <ScrollStrip data-demo={`strip-size-${size}`} label="cards" size={size} trackClassName="gap-2">
                                    {CHIPS.map((chip) => (
                                        <Badge key={chip} color="neutral" variant="outline">
                                            {chip}
                                        </Badge>
                                    ))}
                                </ScrollStrip>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Content that fits — no controls at all">
                <Row>
                    <div className="w-96 rounded-box border border-base-300 p-1">
                        <ScrollStrip data-demo="fits" label="tags" trackClassName="gap-2">
                            <Badge color="neutral">One</Badge>
                            <Badge color="neutral">Two</Badge>
                            <Badge color="neutral">Three</Badge>
                        </ScrollStrip>
                    </div>
                </Row>
            </Section>

            <Section title="Right-to-left">
                <div dir="rtl" className="w-72 rounded-box border border-base-300 p-1">
                    <ScrollStrip data-demo="rtl" label="عناصر" trackClassName="gap-2">
                        {CHIPS.map((chip) => (
                            <Badge key={chip} variant="outline" color="neutral">
                                {chip}
                            </Badge>
                        ))}
                    </ScrollStrip>
                </div>
            </Section>
        </>
    );
}
