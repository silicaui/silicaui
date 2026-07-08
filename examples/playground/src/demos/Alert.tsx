import { useState } from "react";
import {
    Alert,
    AlertContent,
    AlertTitle,
    AlertDescription,
    AlertActions,
    Collapsible,
    CollapsibleTrigger,
    CollapsiblePanel,
    Button,
} from "@wizeworks/silicaui-react";
import { Section, Stack } from "../lib/Section";
import { InfoIcon, CheckIcon, WarnIcon, XIcon } from "../lib/icons";
import { SIZES } from "../lib/data";

export function AlertDemo() {
    const [dismissed, setDismissed] = useState(false);

    return (
        <>
            <Section title="dismissible · animates away, then unmounts">
                <Stack>
                    {!dismissed && (
                        <Alert color="info" dismissible onDismiss={() => setDismissed(true)}>
                            <InfoIcon />A new software update is available.
                        </Alert>
                    )}
                    {dismissed && (
                        <Button size="sm" variant="outline" onClick={() => setDismissed(false)}>
                            Reset
                        </Button>
                    )}
                </Stack>
            </Section>

            <Section title="banner · full-bleed, edge to edge (no rounding)">
                <Alert color="warning" banner dismissible variant="soft">
                    <WarnIcon />
                    Scheduled maintenance tonight at 10pm PT — expect brief downtime.
                </Alert>
            </Section>

            <Section title="collapsible detail · nests the existing Collapsible, not a bespoke prop">
                <Alert color="error" variant="soft">
                    <XIcon />
                    {/* `className="contents"` (a utility, so it wins over the component's
                        own flex-column) keeps AlertContent + AlertActions as direct row
                        children of Alert — the Collapsible only supplies shared open-state
                        context here, not a layout box. That's what lets the icon trigger
                        sit top-right while the label trigger stays under the title, both
                        toggling the one panel. */}
                    <Collapsible className="contents">
                        <AlertContent>
                            <AlertTitle>3 files failed to upload</AlertTitle>
                            <CollapsibleTrigger chevron={false}>Show details</CollapsibleTrigger>
                            <CollapsiblePanel>
                                <ul className="list-disc pl-4 text-xs">
                                    <li>report-q3.pdf — exceeds 5 MB limit</li>
                                    <li>archive.zip — unsupported type</li>
                                    <li>notes.docx — network error</li>
                                </ul>
                            </CollapsiblePanel>
                        </AlertContent>
                        <AlertActions>
                            <CollapsibleTrigger variant="icon" aria-label="Toggle details" />
                        </AlertActions>
                    </Collapsible>
                </Alert>
            </Section>

            <Section title="Colors & structure">
                <Stack>
                    {/* One-liner: leading icon + message */}
                    <Alert color="info">
                        <InfoIcon />A new software update is available.
                    </Alert>
                    <Alert color="success" variant="soft">
                        <CheckIcon />
                        Your changes have been saved.
                    </Alert>
                    {/* Structured: title + description */}
                    <Alert color="warning" variant="soft">
                        <WarnIcon />
                        <AlertContent>
                            <AlertTitle>Storage almost full</AlertTitle>
                            <AlertDescription>
                                You've used 92% of your quota. Consider upgrading.
                            </AlertDescription>
                        </AlertContent>
                    </Alert>
                    {/* Structured + trailing actions (far right, centered) */}
                    <Alert color="error">
                        <XIcon />
                        <AlertContent>
                            <AlertTitle>Upload failed</AlertTitle>
                            <AlertDescription>
                                The file exceeds the 5 MB limit.
                            </AlertDescription>
                        </AlertContent>
                        <AlertActions>
                            <Button size="sm" color="error" variant="soft">
                                Retry
                            </Button>
                        </AlertActions>
                    </Alert>
                    <Alert color="brand" variant="outline">
                        <InfoIcon />
                        The <code>brand</code> color flows through Alerts too.
                    </Alert>
                    <Alert>
                        <InfoIcon />
                        Neutral alert — no color prop, just the base surface.
                    </Alert>
                </Stack>
            </Section>

            <Section title="Sizes">
                <Stack className="gap-2">
                    {SIZES.slice(0, 4).map((size) => (
                        <Alert key={size} color="info" size={size}>
                            <InfoIcon />
                            {size}
                        </Alert>
                    ))}
                </Stack>
            </Section>
        </>
    );
}
