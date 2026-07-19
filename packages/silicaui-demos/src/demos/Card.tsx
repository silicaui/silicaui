import {
    Card,
    CardBody,
    CardTitle,
    CardActions,
    ClickableCard,
    SelectableCard,
    Button,
    Badge,
    Input,
} from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function CardDemo() {
    return (
        <>
            <Section title="Surfaces">
                <div className="grid gap-6 sm:grid-cols-2">
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <CardTitle>Project Silica</CardTitle>
                                <Badge color="success" variant="soft">
                                    Active
                                </Badge>
                            </div>
                            <p className="opacity-70">
                                A card sits on the <code>base-100</code> surface, rounds
                                with <code>--radius-box</code>, and lifts with{" "}
                                <code>--depth</code>.
                            </p>
                            <CardActions>
                                <Button variant="ghost" color="neutral">
                                    Cancel
                                </Button>
                                <Button color="primary">Deploy</Button>
                            </CardActions>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <CardTitle>Newsletter</CardTitle>
                            <p className="opacity-70">
                                Inputs and buttons share the field tier, so they line up.
                            </p>
                            <div className="flex gap-2">
                                <Input placeholder="you@example.com" />
                                <Button color="primary">Subscribe</Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </Section>

            <Section title="ClickableCard · whole surface is a button (or render as a link)">
                <div className="grid gap-4 sm:grid-cols-3">
                    <ClickableCard onClick={() => console.log("open repo")}>
                        <CardBody>
                            <CardTitle>Repository</CardTitle>
                            <p className="opacity-70">Click anywhere on this card.</p>
                        </CardBody>
                    </ClickableCard>
                    <ClickableCard render={<a href="#card" />}>
                        <CardBody>
                            <CardTitle>As a link</CardTitle>
                            <p className="opacity-70">Renders an &lt;a&gt;, same styling.</p>
                        </CardBody>
                    </ClickableCard>
                    <ClickableCard disabled>
                        <CardBody>
                            <CardTitle>Disabled</CardTitle>
                            <p className="opacity-70">Not interactive.</p>
                        </CardBody>
                    </ClickableCard>
                </div>
            </Section>

            <Section title="SelectableCard · radio group and independent checkboxes">
                <div className="grid gap-4 sm:grid-cols-3">
                    {(["Starter", "Pro", "Enterprise"] as const).map((plan, i) => (
                        <SelectableCard key={plan} name="selectable-plan" defaultChecked={i === 1}>
                            <CardBody>
                                <CardTitle>{plan}</CardTitle>
                                <p className="opacity-70">
                                    {i === 0 ? "For side projects." : i === 1 ? "For growing teams." : "For scale."}
                                </p>
                            </CardBody>
                        </SelectableCard>
                    ))}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {(["Email alerts", "SMS alerts", "Push alerts"] as const).map((opt) => (
                        <SelectableCard key={opt} type="checkbox" defaultChecked={opt === "Email alerts"}>
                            <CardBody>
                                <CardTitle>{opt}</CardTitle>
                            </CardBody>
                        </SelectableCard>
                    ))}
                </div>
            </Section>

            <Section title="Glass · Tier-0 frosted treatment (backdrop-filter blur + saturate, no SVG refraction)">
                <div
                    className="rounded-box p-8"
                    style={{
                        backgroundImage:
                            "linear-gradient(135deg, var(--color-primary), var(--color-accent), var(--color-secondary))",
                    }}
                >
                    <div className="grid gap-6 sm:grid-cols-2">
                        <Card className="glass">
                            <CardBody>
                                <CardTitle>Neutral frost</CardTitle>
                                <p className="opacity-80">
                                    Plain <code>glass</code> — no color declared, so it
                                    frosts the neutral <code>base-100</code> surface.
                                </p>
                            </CardBody>
                        </Card>

                        <Card className="bg-primary glass">
                            <CardBody>
                                <CardTitle>Tinted frost</CardTitle>
                                <p className="opacity-80">
                                    <code>bg-primary glass</code> — same{" "}
                                    <code>--u-accent</code> hook <code>soft</code> uses,
                                    so the frost picks up primary for colored depth.
                                </p>
                            </CardBody>
                        </Card>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <ClickableCard
                            className="glass"
                            onClick={() => console.log("open repo")}
                        >
                            <CardBody>
                                <CardTitle>Clickable + glass</CardTitle>
                                <p className="opacity-80">
                                    Hover still lifts — the rim sheen lives on its own
                                    pseudo-element, not the hover shadow.
                                </p>
                            </CardBody>
                        </ClickableCard>

                        {(["Starter", "Pro"] as const).map((plan, i) => (
                            <SelectableCard
                                key={plan}
                                name="selectable-plan-glass"
                                defaultChecked={i === 0}
                                className="glass"
                            >
                                <CardBody>
                                    <CardTitle>{plan}</CardTitle>
                                    <p className="opacity-80">
                                        Checked ring still reads through the frost.
                                    </p>
                                </CardBody>
                            </SelectableCard>
                        ))}
                    </div>
                </div>
            </Section>
        </>
    );
}
