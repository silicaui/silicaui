import { PowerSearch, usePowerSearchConfig, Button, type PowerSearchFieldDef } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const FIELDS: PowerSearchFieldDef[] = [
    {
        key: "status",
        label: "Status",
        type: "select",
        options: [
            { value: "open", label: "Open" },
            { value: "in-progress", label: "In progress" },
            { value: "done", label: "Done" },
        ],
    },
    { key: "assignee", label: "Assignee", type: "text", placeholder: "e.g. ada" },
    { key: "due", label: "Due date", type: "date" },
    { key: "starred", label: "Starred", type: "boolean" },
    {
        key: "priority",
        label: "Priority",
        type: "custom",
        formatValue: (v) => "⭐".repeat(Number(v) || 1),
        render: ({ onCommit }) => (
            <div className="flex gap-1">
                {[1, 2, 3].map((n) => (
                    <Button key={n} size="sm" variant="outline" onClick={() => onCommit(String(n))}>
                        {"⭐".repeat(n)}
                    </Button>
                ))}
            </div>
        ),
    },
];

export function PowerSearchDemo() {
    const search = usePowerSearchConfig({
        fields: FIELDS,
        defaultValue: {
            query: "",
            terms: [{ id: "seed-1", field: "status", value: "in-progress" }],
        },
    });

    return (
        <Section title="Real use · issue search (select/text/date/boolean/custom fields)">
            <div className="max-w-xl">
                <PowerSearch {...search} placeholder="Search issues…" />
                <pre className="mt-3 rounded-field bg-base-200 p-3 text-xs">
                    {JSON.stringify(search.value, null, 2)}
                </pre>
            </div>
        </Section>
    );
}
