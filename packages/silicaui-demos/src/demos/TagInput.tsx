import { useState } from "react";
import { TagInput } from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";
import { COLORS } from "../lib/data";

export function TagInputDemo() {
    const [tags, setTags] = useState<string[]>(["design", "ui", "tokens"]);

    return (
        <>
            <Section title="Colors">
                <Stack className="max-w-md">
                    {COLORS.slice(0, 6).map((color) => (
                        <TagInput
                            key={color}
                            color={color}
                            defaultValue={[color]}
                            placeholder="Add a tag…"
                        />
                    ))}
                </Stack>
            </Section>

            <Section title="Real use · post tags (max 6, dedupe on)">
                <div className="flex max-w-md flex-col gap-2">
                    <TagInput
                        color="primary"
                        value={tags}
                        onValueChange={setTags}
                        placeholder="Press Enter or , to add"
                        max={6}
                    />
                    <p className="text-xs opacity-60">
                        {tags.length} / 6 tags — {tags.join(", ") || "none yet"}
                    </p>
                </div>
            </Section>
        </>
    );
}
