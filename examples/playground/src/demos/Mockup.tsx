import {
    MockupWindow,
    MockupBrowser,
    MockupCode,
    MockupCodeLine,
    MockupPhone,
} from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function MockupDemo() {
    return (
        <>
            <Section title="Browser frame">
                <MockupBrowser url="https://silica.ui" className="max-w-lg border border-base-300">
                    <div className="flex h-32 items-center justify-center bg-base-200">
                        Your page renders here
                    </div>
                </MockupBrowser>
            </Section>

            <Section title="Window frame">
                <MockupWindow className="max-w-lg border border-base-300">
                    <div className="flex h-24 items-center justify-center bg-base-200">
                        App content
                    </div>
                </MockupWindow>
            </Section>

            <Section title="Code block">
                <MockupCode className="max-w-lg">
                    <MockupCodeLine prefix="$">pnpm add @wizeworks/silicaui</MockupCodeLine>
                    <MockupCodeLine prefix=">" className="text-success">
                        Done in 1.2s
                    </MockupCodeLine>
                </MockupCode>
            </Section>

            <Section title="Phone frame">
                <Row>
                    <MockupPhone>
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-base-200 text-sm">
                            <span className="font-semibold">9:41</span>
                            <span className="opacity-60">Your app screen</span>
                        </div>
                    </MockupPhone>
                </Row>
            </Section>
        </>
    );
}
