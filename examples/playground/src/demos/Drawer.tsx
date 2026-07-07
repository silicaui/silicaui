import {
    Drawer,
    DrawerTrigger,
    DrawerClose,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
    Button,
} from "silicaui-react";
import { Section, Row } from "../lib/Section";

export function DrawerDemo() {
    return (
        <Section title="Real use · navigation drawer">
            <Row>
                {(["left", "right", "top", "bottom"] as const).map((side) => (
                    <Drawer key={side}>
                        <DrawerTrigger>
                            <Button variant="outline" color="neutral">
                                {side}
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent side={side}>
                            <DrawerTitle>Navigation</DrawerTitle>
                            <DrawerDescription>
                                Slides in from the {side} edge.
                            </DrawerDescription>
                            <nav className="flex flex-col gap-2 py-4 text-sm">
                                <a href="#">Dashboard</a>
                                <a href="#">Projects</a>
                                <a href="#">Settings</a>
                            </nav>
                            <DrawerClose>
                                <Button variant="ghost" color="neutral">
                                    Close
                                </Button>
                            </DrawerClose>
                        </DrawerContent>
                    </Drawer>
                ))}
            </Row>
        </Section>
    );
}
