import { useState } from "react";
import { Wizard, Input } from "@wizeworks/silicaui-react";
import type { WizardStep } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";
import { COLORS } from "../lib/data";

const MINI_STEPS: WizardStep[] = [
    { id: "a", title: "Cart" },
    { id: "b", title: "Shipping" },
    { id: "c", title: "Payment" },
];

const STEPS: WizardStep[] = [
    {
        id: "account",
        title: "Account",
        content: (
            <div className="flex max-w-sm flex-col gap-3">
                <Input placeholder="Work email" type="email" />
                <Input placeholder="Choose a password" type="password" />
            </div>
        ),
    },
    {
        id: "profile",
        title: "Profile",
        content: (
            <div className="flex max-w-sm flex-col gap-3">
                <Input placeholder="Full name" />
                <Input placeholder="Company" />
            </div>
        ),
    },
    {
        id: "billing",
        title: "Billing",
        optional: true,
        content: (
            <div className="flex max-w-sm flex-col gap-3">
                <Input placeholder="Card number" />
                <span className="text-xs opacity-60">
                    Optional — you can add this later from Settings.
                </span>
            </div>
        ),
    },
    {
        id: "review",
        title: "Review",
        content: (
            <p className="max-w-sm text-sm opacity-80">
                You're all set. Review your details and press Finish to create the
                workspace.
            </p>
        ),
    },
];

export function WizardDemo() {
    const [step, setStep] = useState(0);
    const [done, setDone] = useState(false);

    return (
        <>
            <Section title="Colors (step markers)">
                <div className="flex flex-col gap-6">
                    {COLORS.slice(0, 3).map((color) => (
                        <Wizard
                            key={color}
                            color={color}
                            steps={MINI_STEPS}
                            defaultStep={1}
                            hideFooter
                        />
                    ))}
                </div>
            </Section>

            <Section title="Real use · workspace onboarding">
                <Wizard
                    color="primary"
                    steps={STEPS}
                    activeStep={step}
                    onStepChange={setStep}
                    onFinish={() => setDone(true)}
                />
                {done && (
                    <p className="text-sm text-success">
                        🎉 Workspace created — you can close this wizard.
                    </p>
                )}
            </Section>
        </>
    );
}
