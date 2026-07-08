import { List, ListRow, ListColGrow, ListTitle, Avatar, Button } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const MEMBERS = [
    { initials: "AL", name: "Ada Lovelace", role: "Owner" },
    { initials: "GH", name: "Grace Hopper", role: "Admin" },
    { initials: "AT", name: "Alan Turing", role: "Member" },
];

export function ListDemo() {
    return (
        <Section title="Real use · team member list">
            <List hover className="max-w-md">
                <ListTitle>Team</ListTitle>
                {MEMBERS.map((m) => (
                    <ListRow key={m.initials}>
                        <Avatar color="primary" size="sm" alt={m.name}>
                            {m.initials}
                        </Avatar>
                        <ListColGrow>
                            <div className="font-medium">{m.name}</div>
                            <div className="text-sm opacity-60">{m.role}</div>
                        </ListColGrow>
                        <Button size="sm" variant="ghost" color="neutral">
                            Manage
                        </Button>
                    </ListRow>
                ))}
            </List>
        </Section>
    );
}
