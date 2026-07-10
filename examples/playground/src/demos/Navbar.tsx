import { Navbar, NavbarStart, NavbarCenter, NavbarEnd, Button } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function NavbarDemo() {
    return (
        <>
            <Section title="Real use · site header">
                <Navbar className="rounded-box border border-base-300">
                    <NavbarStart>
                        <span className="text-lg font-bold">◆ Silica</span>
                    </NavbarStart>
                    <NavbarCenter className="hidden gap-4 text-sm sm:flex">
                        <a href="#">Docs</a>
                        <a href="#">Components</a>
                        <a href="#">Pricing</a>
                    </NavbarCenter>
                    <NavbarEnd>
                        <Button variant="ghost" color="neutral">
                            Sign in
                        </Button>
                        <Button color="primary">Get started</Button>
                    </NavbarEnd>
                </Navbar>
            </Section>

            <Section title="Glass · floating over a hero">
                <div
                    className="flex flex-col gap-24 rounded-box p-4"
                    style={{
                        backgroundImage:
                            "linear-gradient(135deg, var(--color-primary), var(--color-accent), var(--color-secondary))",
                    }}
                >
                    <Navbar className="glass">
                        <NavbarStart>
                            <span className="text-lg font-bold">◆ Silica</span>
                        </NavbarStart>
                        <NavbarCenter className="hidden gap-4 text-sm sm:flex">
                            <a href="#">Docs</a>
                            <a href="#">Components</a>
                            <a href="#">Pricing</a>
                        </NavbarCenter>
                        <NavbarEnd>
                            <Button variant="ghost" color="neutral">
                                Sign in
                            </Button>
                            <Button color="primary">Get started</Button>
                        </NavbarEnd>
                    </Navbar>
                </div>
            </Section>
        </>
    );
}
