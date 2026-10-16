import { Table, Badge, Button } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const ROWS = [
    { name: "Ada Lovelace", role: "Engineer", status: "Active" as const },
    { name: "Grace Hopper", role: "Admin", status: "Active" as const },
    { name: "Alan Turing", role: "Engineer", status: "Away" as const },
];

const INVOICES = [
    { customer: "Harbor Street Bakery", number: "INV-1042", due: "$1,240.00", state: "Overdue" as const },
    { customer: "Juniper and Fern Florists", number: "INV-1043", due: "$386.50", state: "Due" as const },
    { customer: "Ridgeview Family Dental, second location", number: "INV-1044", due: "$12,900.00", state: "Paid" as const },
];

const STATE_COLOR = { Overdue: "error", Due: "warning", Paid: "success" } as const;

/**
 * A list shaped the way real list panes are: a name cell that fills the row
 * and truncates, then nowrap cells for the amount, the state, and the row's own
 * button. As a table that is wider than a 343px pane; stacked, it fits.
 */
function InvoiceList() {
    return (
        <Table stack zebra size="sm">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Due</th>
                    <th>State</th>
                    <th>
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {INVOICES.map((r) => (
                    <tr key={r.number}>
                        <td className="w-full max-w-0 min-w-56">
                            <div className="truncate font-semibold">{r.customer}</div>
                            <div className="truncate">{r.number}</div>
                        </td>
                        <td data-label="Due" className="whitespace-nowrap">
                            {r.due}
                        </td>
                        <td className="whitespace-nowrap">
                            <Badge color={STATE_COLOR[r.state]} variant="soft">
                                {r.state}
                            </Badge>
                        </td>
                        <td className="whitespace-nowrap text-right">
                            <Button size="sm">Send reminder</Button>
                        </td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td>Outstanding</td>
                    <td className="whitespace-nowrap">$1,626.50</td>
                    <td />
                    <td />
                </tr>
            </tfoot>
        </Table>
    );
}

export function TableDemo() {
    return (
        <>
            <Section title="Real use · team table">
                <Table zebra hover className="max-w-xl">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ROWS.map((r) => (
                            <tr key={r.name}>
                                <td>{r.name}</td>
                                <td>{r.role}</td>
                                <td>
                                    <Badge
                                        color={r.status === "Active" ? "success" : "warning"}
                                        variant="soft"
                                    >
                                        {r.status}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Section>

            <Section title="Stacked in a narrow pane">
                <p className="max-w-xl">
                    With <code>stack</code>, a list turns its rows into blocks while its
                    container is narrower than 36rem, so the amount, the state and the
                    button stay in the pane. The same list in a wide pane is an ordinary
                    table. Pass a breakpoint, such as <code>stack="lg"</code>, to switch at
                    a different width.
                </p>
                <div className="flex flex-col gap-6">
                    <div
                        data-demo="stack-narrow"
                        className="w-[343px] max-w-full rounded-box border border-base-300"
                    >
                        <InvoiceList />
                    </div>
                    <div data-demo="stack-wide" className="rounded-box border border-base-300">
                        <InvoiceList />
                    </div>
                </div>
            </Section>

            <Section title="Sizes">
                <div className="flex max-w-xl flex-col gap-4">
                    {(["xs", "sm", "md", "lg"] as const).map((size) => (
                        <Table key={size} size={size} zebra>
                            <thead>
                                <tr>
                                    <th>Size</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{size}</td>
                                    <td>Row height scales with density</td>
                                </tr>
                            </tbody>
                        </Table>
                    ))}
                </div>
            </Section>
        </>
    );
}
