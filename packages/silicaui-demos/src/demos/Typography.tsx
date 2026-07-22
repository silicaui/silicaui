import { Heading, Display, Text, Blockquote, BlockquoteCite } from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";

export function TypographyDemo() {
    return (
        <>
            <Section title="Display · oversized hero ramp (display-1 → display-3)">
                <Stack>
                    <Display visualLevel={1}>Display 1</Display>
                    <Display visualLevel={2}>Display 2</Display>
                    <Display visualLevel={3}>Display 3</Display>
                    <Display>Display (base · = display-3)</Display>
                </Stack>
            </Section>

            <Section title="Heading · semantic level + visual size are independent">
                <Stack>
                    <Heading level={1}>Heading 1</Heading>
                    <Heading level={2}>Heading 2</Heading>
                    <Heading level={3}>Heading 3</Heading>
                    <Heading level={2} visualLevel={5}>
                        h2 that reads as h5
                    </Heading>
                    <Text variant="lead">
                        Lead text — a slightly larger, muted intro paragraph.
                    </Text>
                    <Text>Body text — the default paragraph style.</Text>
                    <Text variant="caption">Caption — small, muted, for metadata.</Text>
                </Stack>
            </Section>

            <Section title="Blockquote · pull-quote with attribution">
                <Stack className="max-w-lg">
                    <Blockquote>
                        “Silica cut our design review time in half — everything just lines
                        up on the same token system.”
                        <BlockquoteCite>Ada Lovelace, Analytical Engines Inc.</BlockquoteCite>
                    </Blockquote>
                    <Blockquote>No attribution needed for a short pull-quote.</Blockquote>
                </Stack>
            </Section>
        </>
    );
}
