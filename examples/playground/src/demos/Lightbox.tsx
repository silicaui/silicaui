import { useState } from "react";
import { Lightbox, type LightboxItem } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

// Stand-in "photos" (data URIs, always load offline): a gradient tile with a
// number, so the viewer/nav path is demonstrated without a network request.
function placeholder(n: number, from: string, to: string): string {
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>` +
            `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
            `<stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>` +
            `</linearGradient></defs>` +
            `<rect width='800' height='600' fill='url(#g)'/>` +
            `<text x='400' y='330' font-size='180' font-family='sans-serif' font-weight='700' fill='rgba(255,255,255,.85)' text-anchor='middle'>${n}</text>` +
            `</svg>`,
    )}`;
}

const PHOTOS: LightboxItem[] = [
    { src: placeholder(1, "#6366f1", "#ec4899"), caption: "Photo 1" },
    { src: placeholder(2, "#f97316", "#eab308"), caption: "Photo 2" },
    { src: placeholder(3, "#10b981", "#06b6d4"), caption: "Photo 3" },
    { src: placeholder(4, "#8b5cf6", "#ec4899"), caption: "Photo 4" },
];

export function LightboxDemo() {
    const [index, setIndex] = useState<number | null>(null);

    return (
        <Section title="Real use · thumbnail grid opens a full-viewport viewer">
            <div className="grid grid-cols-4 gap-2">
                {PHOTOS.map((p, i) => (
                    <button
                        key={p.src}
                        type="button"
                        className="overflow-hidden rounded-field"
                        onClick={() => setIndex(i)}
                    >
                        <img src={p.src} alt="" className="block h-24 w-full object-cover" />
                    </button>
                ))}
            </div>
            <Lightbox items={PHOTOS} index={index} onIndexChange={setIndex} />
        </Section>
    );
}
