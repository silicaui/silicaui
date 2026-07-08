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
    );
}
