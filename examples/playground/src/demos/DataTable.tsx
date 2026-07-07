import { useState } from "react";
import { Badge } from "silicaui-react";
import type { SilicaColor } from "silicaui-react";
import { DataTable } from "silicaui-table";
import type { DataTableColumn } from "silicaui-table";
import { Sparkline } from "silicaui-charts";
import { Section } from "../lib/Section";

interface TeamRow {
    name: string;
    email: string;
    role: string;
    plan: string;
    mrr: number;
    trend: number[];
    status: { label: string; color: SilicaColor };
}

const TEAM: TeamRow[] = [
    { name: "Ada Lovelace", email: "ada@silica.dev", role: "Owner", plan: "Enterprise", mrr: 2400, trend: [12, 18, 15, 22, 28, 26, 31], status: { label: "Active", color: "success" } },
    { name: "Grace Hopper", email: "grace@silica.dev", role: "Admin", plan: "Pro", mrr: 990, trend: [8, 9, 11, 10, 13, 15, 14], status: { label: "Active", color: "success" } },
    { name: "Alan Turing", email: "alan@silica.dev", role: "Member", plan: "Pro", mrr: 720, trend: [5, 6, 6, 8, 7, 9, 12], status: { label: "Away", color: "warning" } },
    { name: "Katherine Johnson", email: "kate@silica.dev", role: "Member", plan: "Starter", mrr: 190, trend: [2, 3, 3, 4, 5, 5, 6], status: { label: "Invited", color: "neutral" } },
    { name: "Edsger Dijkstra", email: "edsger@silica.dev", role: "Admin", plan: "Enterprise", mrr: 3100, trend: [20, 22, 25, 24, 29, 33, 38], status: { label: "Active", color: "success" } },
    { name: "Barbara Liskov", email: "barbara@silica.dev", role: "Member", plan: "Pro", mrr: 880, trend: [9, 10, 12, 11, 14, 13, 16], status: { label: "Active", color: "success" } },
    { name: "Donald Knuth", email: "don@silica.dev", role: "Member", plan: "Starter", mrr: 140, trend: [1, 2, 2, 3, 3, 4, 4], status: { label: "Suspended", color: "error" } },
    { name: "Margaret Hamilton", email: "maggie@silica.dev", role: "Admin", plan: "Enterprise", mrr: 2750, trend: [18, 19, 21, 26, 30, 29, 34], status: { label: "Active", color: "success" } },
];

const COLUMNS: DataTableColumn<TeamRow>[] = [
    {
        accessorKey: "name",
        header: "Member",
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium">{row.original.name}</span>
                <span className="text-xs opacity-60">{row.original.email}</span>
            </div>
        ),
    },
    { accessorKey: "role", header: "Role" },
    {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => <Badge>{row.original.plan}</Badge>,
    },
    {
        accessorKey: "mrr",
        header: "MRR",
        cell: ({ row }) => (
            <span className="tabular-nums">${row.original.mrr.toLocaleString()}</span>
        ),
    },
    {
        id: "trend",
        header: "Trend",
        enableSorting: false,
        cell: ({ row }) => (
            <Sparkline
                data={row.original.trend}
                area
                style={{ width: "5rem", height: "1.75rem" }}
            />
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => (
            <Badge color={row.original.status.color}>{row.original.status.label}</Badge>
        ),
    },
];

export function DataTableDemo() {
    const [selected, setSelected] = useState<TeamRow[]>([]);
    const [loading, setLoading] = useState(false);

    return (
        <>
            <Section title="Real use · sortable, selectable, paginated team table">
                <div className="flex flex-col gap-2">
                    <DataTable
                        data={TEAM}
                        columns={COLUMNS}
                        sortable
                        selectable
                        pagination={5}
                        zebra
                        color="primary"
                        onSelectionChange={setSelected}
                    />
                    <p className="text-xs opacity-60">
                        {selected.length} row{selected.length === 1 ? "" : "s"} selected
                    </p>
                </div>
            </Section>

            <Section title="Loading & empty states">
                <div className="flex flex-col gap-3">
                    <button
                        className="w-fit text-xs underline opacity-70"
                        onClick={() => {
                            setLoading(true);
                            setTimeout(() => setLoading(false), 1500);
                        }}
                    >
                        Simulate loading
                    </button>
                    <DataTable
                        data={loading ? [] : TEAM.slice(0, 3)}
                        columns={COLUMNS}
                        loading={loading}
                        loadingRows={3}
                        emptyState={<span className="opacity-60">No members found.</span>}
                    />
                </div>
            </Section>
        </>
    );
}
