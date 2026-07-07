import {
    Alert,
    AlertContent,
    AlertTitle,
    AlertDescription,
    AlertActions,
    Button,
} from "silicaui-react";
import { Section, Stack } from "../lib/Section";
import { InfoIcon, CheckIcon, WarnIcon, XIcon } from "../lib/icons";
import { SIZES } from "../lib/data";

export function AlertDemo() {
    return (
        <>
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
