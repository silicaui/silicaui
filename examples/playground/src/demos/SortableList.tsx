import { useState } from "react";
import { SortableList } from "silicaui-dnd";
import { useSilicaClass } from "silicaui-react";
import { Section } from "../lib/Section";

interface SectionBlock {
    id: string;
    label: string;
}

const INITIAL: SectionBlock[] = [
    { id: "hero", label: "Hero banner" },
    { id: "features", label: "Feature grid" },
    { id: "pricing", label: "Pricing table" },
    { id: "testimonials", label: "Testimonials" },
    { id: "faq", label: "FAQ" },
];

const GripIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
    </svg>
);

export function SortableListDemo() {
    const [blocks, setBlocks] = useState<SectionBlock[]>(INITIAL);
    const sc = useSilicaClass();

    return (
        <Section title="Real use · reorder a page's sections (drag the handle)">
            <div className="max-w-sm">
                <SortableList
                    items={blocks}
                    getItemId={(b) => b.id}
                    onReorder={setBlocks}
                    handle
                    renderItem={(block, ctx) => (
                        <>
                            <span
                                {...ctx.handleProps}
                                className={sc("sortable-handle") as string}
                                aria-label={`Drag ${block.label}`}
                            >
                                {GripIcon}
                            </span>
                            {block.label}
                        </>
                    )}
                />
            </div>
        </Section>
    );
}
