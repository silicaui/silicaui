import { Table, Badge, Button, Checkbox } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const ROWS = [
    { name: "Ada Lovelace", role: "Engineer", status: "Active" as const },
    { name: "Grace Hopper", role: "Admin", status: "Active" as const },
    { name: "Alan Turing", role: "Engineer", status: "Away" as const },
];

const INVOICES = [
    { customer: "Harbor Street Bakery", number: "INV-1042", due: "$1,240.00", state: "Overdue" as const, sent: "Sep 2", note: "Asked for net 30" },
    { customer: "Juniper and Fern Florists", number: "INV-1043", due: "$386.50", state: "Due" as const, sent: "Sep 14", note: "Pays by check" },
    { customer: "Ridgeview Family Dental, second location", number: "INV-1044", due: "$12,900.00", state: "Paid" as const, sent: "Sep 21", note: "Paid early" },
];

/**
 * The same invoices with customer names longer than a narrow pane is wide. A
 * truncated name takes no room in a block, but a table grows to fit its
 * longest unbroken line, so these only fit a 343px pane if the stacked table
 * is really a block.
 */
const LONG_NAMES = [
    "Harbor Street Bakery and Cafe, wholesale bread and pastry accounts for the east side",
    "Juniper and Fern Florists, weddings, events and weekly office arrangements downtown",
    "Ridgeview Family Dental, second location, pediatric and orthodontic care on Main Street",
];
const LONG_INVOICES = INVOICES.map((r, i) => ({ ...r, customer: LONG_NAMES[i] ?? r.customer }));

const STATE_COLOR = { Overdue: "error", Due: "warning", Paid: "success" } as const;

/**
 * A list shaped the way real list panes are: a name cell that fills the row
 * and truncates, then nowrap cells for the amount, the state, and the row's own
 * button. As a table that is wider than a 343px pane; stacked, it fits.
 */
function InvoiceList({ rows = INVOICES }: { rows?: typeof INVOICES }) {
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
                {rows.map((r) => (
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

/**
 * The same list with two columns that only show in a wide pane: when it was
 * sent, ahead of the customer, and a note after the button. Both carry Tailwind's
 * `hidden` plus a container variant, so in a narrow pane the row's first and last
 * cells are hidden ones. Stacked, the customer still gets its own line and the
 * button still sits at the end, because the stack skips hidden cells.
 */
function SentInvoiceList() {
    return (
        <Table stack size="sm">
            <thead>
                <tr>
                    <th className="hidden @xl:table-cell">Sent</th>
                    <th>Customer</th>
                    <th>Due</th>
                    <th>State</th>
                    <th>
                        <span className="sr-only">Actions</span>
                    </th>
                    <th className="hidden @xl:table-cell">Note</th>
                </tr>
            </thead>
            <tbody>
                {INVOICES.map((r) => (
                    <tr key={r.number}>
                        <td className="hidden whitespace-nowrap @xl:table-cell">{r.sent}</td>
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
                        <td className="hidden whitespace-nowrap @xl:table-cell">{r.note}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}

/**
 * A list whose rows can be picked for a bulk action: the first cell holds only a
 * checkbox. Stacked, the checkbox stays on the customer's line instead of taking
 * a line of its own. With `hideSelect`, the checkbox cell is hidden below a 24rem
 * pane (`hidden @sm:table-cell`), and the customer gets its own line as usual.
 */
function SelectableInvoiceList({ hideSelect = false }: { hideSelect?: boolean }) {
    const selectCell = hideSelect ? "hidden w-10 @sm:table-cell" : "w-10";
    return (
        <Table stack size="sm">
            <thead>
                <tr>
                    <th className={selectCell}>
                        <Checkbox aria-label="Pick every invoice" />
                    </th>
                    <th>Customer</th>
                    <th>State</th>
                    <th>
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {INVOICES.map((r) => (
                    <tr key={r.number}>
                        <td className={selectCell}>
                            <Checkbox aria-label={`Pick ${r.number}`} />
                        </td>
                        <td className="w-full max-w-0 min-w-56">
                            <div className="truncate font-semibold">{r.customer}</div>
                            <div className="truncate">{r.number}</div>
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

            <Section title="Stacked with names longer than the pane">
                <p className="max-w-xl">
                    A long name truncates inside the pane instead of making the list wider
                    than it. This holds in an app that also uses Tailwind's own{" "}
                    <code>table</code> class, which sets the same name to a table display.
                </p>
                <div
                    data-demo="stack-long-narrow"
                    className="w-[343px] max-w-full rounded-box border border-base-300"
                >
                    <InvoiceList rows={LONG_INVOICES} />
                </div>
            </Section>

            <Section title="Stacked with columns that only show when wide">
                <p className="max-w-xl">
                    A cell hidden with <code>hidden</code> (or the <code>hidden</code>{" "}
                    attribute) does not count while stacked: the first cell that shows
                    takes its own line, and the last one that shows sits at the end. Here
                    the date sent and the note only appear in a wide pane.
                </p>
                <div className="flex flex-col gap-6">
                    <div
                        data-demo="stack-hidden-narrow"
                        className="w-[343px] max-w-full rounded-box border border-base-300"
                    >
                        <SentInvoiceList />
                    </div>
                    <div data-demo="stack-hidden-wide" className="rounded-box border border-base-300">
                        <SentInvoiceList />
                    </div>
                </div>
            </Section>

            <Section title="Stacked with a checkbox to pick rows">
                <p className="max-w-xl">
                    A first cell that holds only a checkbox or radio stays on the same line
                    as the cell after it, which takes the rest of that line. A cell that
                    wraps its control in more markup opts in with{" "}
                    <code>data-stack="select"</code>.
                </p>
                <div className="flex flex-col gap-6">
                    <div
                        data-demo="stack-select-narrow"
                        className="w-[343px] max-w-full rounded-box border border-base-300"
                    >
                        <SelectableInvoiceList />
                    </div>
                    <div
                        data-demo="stack-select-hidden-narrow"
                        className="w-[343px] max-w-full rounded-box border border-base-300"
                    >
                        <SelectableInvoiceList hideSelect />
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
