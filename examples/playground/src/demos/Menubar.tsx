import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "silicaui-react";
import { Section } from "../lib/Section";

export function MenubarDemo() {
    return (
        <Section title="Real use · desktop-app style menu bar">
            <Menubar>
                <MenubarMenu>
                    <MenubarTrigger>File</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>New</MenubarItem>
                        <MenubarItem>Open…</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>Exit</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>Edit</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>Undo</MenubarItem>
                        <MenubarItem>Redo</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>Cut</MenubarItem>
                        <MenubarItem>Copy</MenubarItem>
                        <MenubarItem>Paste</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>View</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>Zoom in</MenubarItem>
                        <MenubarItem>Zoom out</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        </Section>
    );
}
