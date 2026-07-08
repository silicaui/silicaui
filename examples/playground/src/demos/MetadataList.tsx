import { MetadataList, MetadataItem, Badge, Avatar } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function MetadataListDemo() {
    return (
        <>
            <Section title="Real use · project detail panel">
                <div className="max-w-sm rounded-box border border-base-300 p-4">
                    <MetadataList>
                        <MetadataItem label="Status">
                            <Badge color="success" variant="soft">
                                Active
                            </Badge>
                        </MetadataItem>
                        <MetadataItem label="Owner">
                            <div className="flex items-center justify-end gap-2">
                                <Avatar size="xs" alt="Ada Lovelace" color="primary">
                                    AL
                                </Avatar>
                                Ada Lovelace
                            </div>
                        </MetadataItem>
                        <MetadataItem label="Created">Jan 1, 2026</MetadataItem>
                        <MetadataItem label="Last updated">2 hours ago</MetadataItem>
                        <MetadataItem label="Repository">wizeworks/silicaui</MetadataItem>
                    </MetadataList>
                </div>
            </Section>

            <Section title="layout=&quot;stack&quot; · label above value, for narrow cards">
                <Row>
                    <div className="w-56 rounded-box border border-base-300 p-4">
                        <MetadataList layout="stack">
                            <MetadataItem label="Plan">Pro</MetadataItem>
                            <MetadataItem label="Seats">12 / 20</MetadataItem>
                            <MetadataItem label="Renews">Aug 1, 2026</MetadataItem>
                        </MetadataList>
                    </div>
                </Row>
            </Section>
        </>
    );
}
