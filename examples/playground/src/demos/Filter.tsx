import { useState } from "react";
import { Filter, FilterItem } from "silicaui-react";
import { Section } from "../lib/Section";
import { COLORS } from "../lib/data";

const CATEGORIES = ["All", "Apparel", "Footwear", "Accessories", "Sale"];

export function FilterDemo() {
    const [category, setCategory] = useState<string | undefined>("All");

    return (
        <>
            <Section title="Colors">
                <div className="flex flex-col gap-3">
                    {COLORS.slice(0, 6).map((color) => (
                        <Filter key={color} color={color} defaultValue="all">
                            <FilterItem value="all">All</FilterItem>
                            <FilterItem value="new">New</FilterItem>
                            <FilterItem value="sale">Sale</FilterItem>
                        </Filter>
                    ))}
                </div>
            </Section>

            <Section title="Real use · category filter">
                <div className="flex flex-col gap-2">
                    <Filter color="primary" value={category} onValueChange={setCategory}>
                        {CATEGORIES.map((c) => (
                            <FilterItem key={c} value={c}>
                                {c}
                            </FilterItem>
                        ))}
                    </Filter>
                    <p className="text-sm opacity-60">
                        Showing: {category ?? "nothing selected"}
                    </p>
                </div>
            </Section>
        </>
    );
}
