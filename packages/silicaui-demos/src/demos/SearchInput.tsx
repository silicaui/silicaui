import { useState } from "react";
import { SearchInput } from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";
import { SIZES } from "../lib/data";

export function SearchInputDemo() {
    const [query, setQuery] = useState("");

    return (
        <>
            <Section title="Colors">
                <Stack className="max-w-sm">
                    <SearchInput placeholder="Search…" />
                    <SearchInput color="primary" placeholder="Search…" defaultValue="silica" />
                    <SearchInput disabled placeholder="Search…" defaultValue="disabled" />
                </Stack>
            </Section>

            <Section title="Sizes">
                <Stack className="max-w-sm">
                    {SIZES.map((size) => (
                        <SearchInput key={size} size={size} placeholder={size} defaultValue={size} />
                    ))}
                </Stack>
            </Section>

            <Section title="Controlled">
                <Stack className="max-w-sm">
                    <SearchInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search components…"
                    />
                    <p className="text-xs opacity-60">
                        {query ? `Searching for "${query}"` : "Type to search, × to clear"}
                    </p>
                </Stack>
            </Section>
        </>
    );
}
