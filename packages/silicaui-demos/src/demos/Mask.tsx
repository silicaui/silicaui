import { Mask } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

const PHOTO = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>` +
        `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
        `<stop offset='0' stop-color='#6366f1'/><stop offset='1' stop-color='#ec4899'/>` +
        `</linearGradient></defs>` +
        `<rect width='100' height='100' fill='url(#g)'/>` +
        `<circle cx='50' cy='40' r='18' fill='rgba(255,255,255,.92)'/>` +
        `<rect x='22' y='62' width='56' height='38' rx='19' fill='rgba(255,255,255,.92)'/>` +
        `</svg>`,
)}`;

const SHAPES = [
    "squircle",
    "circle",
    "heart",
    "hexagon",
    "hexagon-2",
    "pentagon",
    "diamond",
    "triangle",
    "star",
    "star-2",
    "decagon",
    "parallelogram",
] as const;

export function MaskDemo() {
    return (
        <Section title="Real use · avatar photo clipped to every shape">
            <Row>
                {SHAPES.map((shape) => (
                    <Mask key={shape} variant={shape} className="h-16 w-16">
                        <img src={PHOTO} alt="" className="h-full w-full object-cover" />
                    </Mask>
                ))}
            </Row>
        </Section>
    );
}
