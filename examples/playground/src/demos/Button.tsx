import { useState } from "react";
import { Button } from "silicaui-react";
import { Section, Row, Stack } from "../lib/Section";
import { ColorVariantSizeGrid } from "../lib/ColorGrid";
import { PlusIcon } from "../lib/icons";
import { VARIANTS } from "../lib/data";

export function ButtonDemo() {
    const [loading, setLoading] = useState(false);

    function fakeSave() {
        setLoading(true);
        setTimeout(() => setLoading(false), 1800);
    }

    return (
        <>
            <ColorVariantSizeGrid
                Component={Button}
                variants={VARIANTS.filter((v) => v !== "solid")}
            />

            <Section title="Icon buttons (square / circle)">
                <Row>
                    <Button color="primary" shape="square" aria-label="Add">
                        <PlusIcon />
                    </Button>
                    <Button color="secondary" shape="circle" aria-label="Add">
                        <PlusIcon />
                    </Button>
                    <Button color="accent" variant="outline" shape="circle" aria-label="Add">
                        <PlusIcon />
                    </Button>
                    <Button color="brand" iconStart={<PlusIcon />}>
                        with icon
                    </Button>
                </Row>
            </Section>

            <Section title="States">
                <Row>
                    <Button color="primary" loading={loading} onClick={fakeSave}>
                        {loading ? "Saving…" : "Click to load"}
                    </Button>
                    <Button color="primary" disabled>
                        Disabled
                    </Button>
                    <Button color="primary" variant="outline" active>
                        Active
                    </Button>
                </Row>
            </Section>

            <Section title="Polymorphism · render → a real <a href>">
                <Row>
                    <Button
                        color="brand"
                        variant="link"
                        render={<a href="https://example.com" />}
                    >
                        Anchor · link style
                    </Button>
                    <Button color="brand" render={<a href="https://example.com" />}>
                        Anchor · button style
                    </Button>
                </Row>
            </Section>

            <Section title="Layout">
                <Stack className="w-full">
                    <Button color="primary" block>
                        Block
                    </Button>
                    <Button color="neutral" variant="outline" wide>
                        Wide
                    </Button>
                </Stack>
            </Section>
        </>
    );
}
