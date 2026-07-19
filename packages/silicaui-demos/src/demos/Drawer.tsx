import {
    Drawer,
    DrawerTrigger,
    DrawerClose,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
    DrawerHeader,
    DrawerFooter,
    Button,
} from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function DrawerDemo() {
    return (
        <>
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

            <Section title="Header + Footer · sticky, scrolling content">
                <Drawer>
                    <DrawerTrigger>
                        <Button variant="outline">Filters (sticky header/footer)</Button>
                    </DrawerTrigger>
                    <DrawerContent side="right">
                        <DrawerHeader sticky>
                            <DrawerTitle>Filters</DrawerTitle>
                            <DrawerClose>
                                <Button variant="ghost" shape="circle" size="sm">
                                    ✕
                                </Button>
                            </DrawerClose>
                        </DrawerHeader>
                        <div className="flex flex-col gap-3 text-sm">
                            {Array.from({ length: 14 }, (_, i) => (
                                <label key={i} className="flex items-center gap-2">
                                    <input type="checkbox" /> Filter option {i + 1}
                                </label>
                            ))}
                        </div>
                        <DrawerFooter sticky>
                            <DrawerClose>
                                <Button variant="ghost" color="neutral">
                                    Reset
                                </Button>
                            </DrawerClose>
                            <DrawerClose>
                                <Button>Apply</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            </Section>
        </>
    );
}
