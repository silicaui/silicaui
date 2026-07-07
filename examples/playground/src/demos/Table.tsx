import { Table, Badge } from "silicaui-react";
import { Section } from "../lib/Section";

const ROWS = [
    { name: "Ada Lovelace", role: "Engineer", status: "Active" as const },
    { name: "Grace Hopper", role: "Admin", status: "Active" as const },
    { name: "Alan Turing", role: "Engineer", status: "Away" as const },
];

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
