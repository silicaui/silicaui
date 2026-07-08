import type { CSSProperties } from "react";
import { Carousel, CarouselItem } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const SLIDES = ["primary", "secondary", "accent", "info", "success"] as const;

function slideStyle(color: string): CSSProperties {
    return {
        backgroundColor: `var(--color-${color})`,
        color: `var(--color-${color}-content, #fff)`,
    };
}

export function CarouselDemo() {
    return (
        <>
            <Section title="Real use · loop + autoplay">
                <Carousel loop autoplay={3000} className="max-w-lg gap-4 rounded-box">
                    {SLIDES.map((color) => (
                        <CarouselItem
                            key={color}
                            className="flex h-40 w-full shrink-0 items-center justify-center rounded-box font-semibold"
                            style={slideStyle(color)}
                        >
                            {color}
                        </CarouselItem>
                    ))}
                </Carousel>
            </Section>

            <Section title="Numbered indicators, no loop">
                <Carousel indicators="numbers" className="max-w-lg gap-4 rounded-box">
                    {SLIDES.slice(0, 3).map((color) => (
                        <CarouselItem
                            key={color}
                            className="flex h-32 w-full shrink-0 items-center justify-center rounded-box font-semibold"
                            style={slideStyle(color)}
                        >
                            {color}
                        </CarouselItem>
                    ))}
                </Carousel>
            </Section>
        </>
    );
}
