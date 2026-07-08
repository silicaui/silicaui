import { useState } from "react";
import { OverflowList, Avatar, Badge } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const PEOPLE = [
    "Ada Lovelace",
    "Grace Hopper",
    "Alan Turing",
    "Katherine Johnson",
    "Margaret Hamilton",
    "Radia Perlman",
    "Barbara Liskov",
    "Tim Berners-Lee",
];

const TAGS = ["design-system", "accessibility", "performance", "dark-mode", "tokens", "typography", "motion"];

export function OverflowListDemo() {
    const [width, setWidth] = useState(420);

    return (
        <>
            <Section title="Real use · assignee avatars, resizable to see the fold point">
                <div className="flex flex-col gap-3">
                    <input
                        type="range"
                        min={120}
                        max={640}
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="max-w-md"
                    />
                    <div style={{ width }} className="rounded-box border border-base-300 p-3">
                        <OverflowList
                            items={PEOPLE}
                            renderItem={(name) => (
                                <Avatar key={name} alt={name} color="primary" size="sm">
                                    {name
                                        .split(" ")
                                        .map((w) => w[0])
                                        .join("")}
                                </Avatar>
                            )}
                        />
                    </div>
                </div>
            </Section>

            <Section title="Tags with custom overflow renderer">
                <div className="w-80 rounded-box border border-base-300 p-3">
                    <OverflowList
                        items={TAGS}
                        gap={6}
                        renderItem={(tag) => (
                            <Badge key={tag} color="neutral" variant="soft">
                                {tag}
                            </Badge>
                        )}
                        renderOverflow={(hidden) => (
                            <Badge color="primary" variant="soft" title={hidden.join(", ")}>
                                +{hidden.length} more
                            </Badge>
                        )}
                    />
                </div>
            </Section>
        </>
    );
}
