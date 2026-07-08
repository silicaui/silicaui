import { Divider, Button } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function DividerDemo() {
    return (
        <>
            <Section title="Plain & labeled">
                <div className="flex max-w-sm flex-col">
                    <p className="text-sm opacity-70">Continue with your account</p>
                    <Divider />
                    <p className="text-sm opacity-70">Or use a different method</p>
                </div>
            </Section>

            <Section title="Real use · sign-in split">
                <div className="flex max-w-sm flex-col gap-3">
                    <Button color="neutral" variant="outline">
                        Continue with email
                    </Button>
                    <Divider>OR</Divider>
                    <Button color="primary">Continue with Google</Button>
                </div>
            </Section>

            <Section title="Vertical (in a row)">
                <div className="flex h-8 items-center text-sm">
                    <span>Docs</span>
                    <Divider orientation="vertical" />
                    <span>Pricing</span>
                    <Divider orientation="vertical" />
                    <span>Blog</span>
                </div>
            </Section>
        </>
    );
}
