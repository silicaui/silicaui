import { EmptyState, Button } from "silicaui-react";
import { Section } from "../lib/Section";

function InboxIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
            <path d="M4 12h4l2 3h4l2-3h4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 6h14l1.5 6.5v6a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-6z" strokeLinejoin="round" />
        </svg>
    );
}

export function EmptyStateDemo() {
    return (
        <>
            <Section title="Real use · empty inbox">
                <EmptyState
                    icon={<InboxIcon />}
                    title="No messages yet"
                    description="When someone sends you a message, it'll show up here."
                    actions={<Button color="primary">Invite teammates</Button>}
                    className="max-w-sm rounded-box border border-base-300"
                />
            </Section>

            <Section title="Compact (sm)">
                <EmptyState
                    size="sm"
                    title="No results"
                    description="Try a different search term."
                    className="max-w-sm rounded-box border border-base-300"
                />
            </Section>
        </>
    );
}
