import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
} from "silicaui-react";
import { Section } from "../lib/Section";

export function NavigationMenuDemo() {
    return (
        <Section title="Real use · site nav with a mega-menu panel">
            <NavigationMenu>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-80 gap-1 p-2">
                            <li>
                                <a href="#" className="block rounded-field p-2 hover:bg-base-200">
                                    <div className="font-medium">Components</div>
                                    <div className="text-xs opacity-60">
                                        95+ primitives on one token system.
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a href="#" className="block rounded-field p-2 hover:bg-base-200">
                                    <div className="font-medium">Builder</div>
                                    <div className="text-xs opacity-60">
                                        Drag-and-drop pages, no code.
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink href="#">Pricing</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink href="#">Docs</NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenu>
        </Section>
    );
}
