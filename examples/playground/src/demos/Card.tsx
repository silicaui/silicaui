import {
    Card,
    CardBody,
    CardTitle,
    CardActions,
    Button,
    Badge,
    Input,
} from "silicaui-react";
import { Section } from "../lib/Section";

export function CardDemo() {
    return (
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
    );
}
