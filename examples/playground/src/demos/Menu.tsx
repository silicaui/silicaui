import { Menu, MenuItem, MenuTitle } from "silicaui-react";
import { Section } from "../lib/Section";

export function MenuDemo() {
    return (
        <Section title="Real use · sidebar navigation">
            <Menu className="max-w-xs">
                <MenuTitle>Workspace</MenuTitle>
                <MenuItem>
                    <a href="#" aria-current="page">
                        Overview
                    </a>
                </MenuItem>
                <MenuItem>
                    <a href="#">Projects</a>
                </MenuItem>
                <MenuItem>
                    <a href="#">Team</a>
                </MenuItem>
                <MenuTitle>Account</MenuTitle>
                <MenuItem>
                    <a href="#">Settings</a>
                </MenuItem>
                <MenuItem>
                    <button type="button">Sign out</button>
                </MenuItem>
            </Menu>
        </Section>
    );
}
