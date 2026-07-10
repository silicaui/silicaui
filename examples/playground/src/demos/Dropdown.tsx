import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuLabel,
    Button,
} from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function DropdownDemo() {
    return (
        <>
            <Section title="Real use · row actions menu">
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Button variant="outline" color="neutral">
                            Options
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Section>

            <Section title="Glass · frosted menu">
                <div
                    className="flex justify-center rounded-box p-16"
                    style={{
                        backgroundImage:
                            "linear-gradient(135deg, var(--color-primary), var(--color-accent), var(--color-secondary))",
                    }}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button variant="outline" color="neutral">
                                Options
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="glass">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Section>
        </>
    );
}
