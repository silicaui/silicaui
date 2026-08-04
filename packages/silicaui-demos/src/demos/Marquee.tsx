import { Badge, Card, Marquee } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const LOGOS = ["Northwind", "Acme", "Contoso", "Fabrikam", "Globex", "Initech", "Umbrella"];

const QUOTES = [
    "Shipped in a weekend.",
    "Our whole design system, one dependency.",
    "The theme editor alone paid for it.",
    "Finally, a marquee that doesn't hitch.",
];

export function MarqueeDemo() {
    return (
        <>
            <Section title="Real use · logo wall">
                <Marquee className="py-6">
                    {LOGOS.map((name) => (
                        <span key={name} className="text-2xl font-semibold whitespace-nowrap">
                            {name}
                        </span>
                    ))}
                </Marquee>
            </Section>

            <Section title="Reverse, slow, cards">
                <Marquee direction="right" speed="slow" className="py-4">
                    {QUOTES.map((quote) => (
                        <Card key={quote} className="w-72 shrink-0 p-4">
                            <p>{quote}</p>
                        </Card>
                    ))}
                </Marquee>
            </Section>

            <Section title="Vertical · needs a height">
                <Marquee direction="up" speed="fast" className="h-64 w-56 px-2">
                    {LOGOS.map((name) => (
                        <Badge key={name} color="primary" className="whitespace-nowrap">
                            {name}
                        </Badge>
                    ))}
                </Marquee>
            </Section>

            <Section title="Short content · repeat fills the strip">
                {/* Three items can't overflow a wide strip, so two copies would
                    leave a visible blank. More copies, not a padded list. */}
                <Marquee repeat={5} className="py-4">
                    {["Design", "Build", "Ship"].map((word) => (
                        <span key={word} className="text-xl font-medium whitespace-nowrap">
                            {word}
                        </span>
                    ))}
                </Marquee>
            </Section>

            <Section title="No fade, no pause on hover">
                <Marquee fade={false} pauseOnHover={false} className="py-4">
                    {LOGOS.map((name) => (
                        <span key={name} className="text-xl whitespace-nowrap">
                            {name}
                        </span>
                    ))}
                </Marquee>
            </Section>
        </>
    );
}
