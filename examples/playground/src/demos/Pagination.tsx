import { useState } from "react";
import { Pagination } from "silicaui-react";
import { Section } from "../lib/Section";
import { COLORS } from "../lib/data";

export function PaginationDemo() {
    const [page, setPage] = useState(4);

    return (
        <>
            <Section title="Colors">
                <div className="flex flex-col gap-3">
                    {COLORS.slice(0, 6).map((color) => (
                        <Pagination
                            key={color}
                            color={color}
                            page={3}
                            count={10}
                            onChange={() => {}}
                        />
                    ))}
                </div>
            </Section>

            <Section title="Sizes">
                <div className="flex flex-col gap-3">
                    {(["xs", "sm", "md", "lg"] as const).map((size) => (
                        <Pagination
                            key={size}
                            size={size}
                            color="primary"
                            page={3}
                            count={10}
                            onChange={() => {}}
                        />
                    ))}
                </div>
            </Section>

            <Section title="Real use · interactive search results">
                <div className="flex max-w-lg flex-col gap-3">
                    <p className="text-sm opacity-70">
                        Showing page {page} of 12 — 118 results
                    </p>
                    <Pagination
                        color="primary"
                        page={page}
                        count={12}
                        onChange={setPage}
                    />
                </div>
            </Section>
        </>
    );
}
