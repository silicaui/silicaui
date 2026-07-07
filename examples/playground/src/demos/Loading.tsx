import { Loading, Button } from "silicaui-react";
import { Section, Row } from "../lib/Section";
import { SIZES } from "../lib/data";

export function LoadingDemo() {
    return (
        <>
            <Section title="Sizes">
                <Row>
                    {SIZES.map((size) => (
                        <Loading key={size} size={size} />
                    ))}
                </Row>
            </Section>

            <Section title="Real use · inline with text, and colored">
                <div className="flex flex-col gap-2 text-sm">
                    <span className="flex items-center gap-2">
                        <Loading size="sm" />
                        Loading your dashboard…
                    </span>
                    <span className="flex items-center gap-2 text-primary">
                        <Loading size="sm" />
                        Syncing changes…
                    </span>
                </div>
            </Section>

            <Section title="Button's built-in spinner (for comparison)">
                <Row>
                    <Button color="primary" loading>
                        Saving…
                    </Button>
                </Row>
            </Section>
        </>
    );
}
