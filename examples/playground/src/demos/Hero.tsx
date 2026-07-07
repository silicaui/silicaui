import { Hero, HeroContent, HeroOverlay, Button } from "silicaui-react";
import { Section } from "../lib/Section";

export function HeroDemo() {
    return (
        <Section title="Real use · landing banner">
            <Hero
                className="rounded-box"
                style={{
                    backgroundImage:
                        "linear-gradient(135deg, #6366f1, #ec4899)",
                }}
            >
                <HeroOverlay />
                <HeroContent className="text-center text-white">
                    <div className="max-w-md">
                        <h1 className="text-4xl font-bold">Ship faster with Silica</h1>
                        <p className="py-4 opacity-90">
                            One token system, every component, zero lock-in.
                        </p>
                        <Button color="primary">Get started</Button>
                    </div>
                </HeroContent>
            </Hero>
        </Section>
    );
}
