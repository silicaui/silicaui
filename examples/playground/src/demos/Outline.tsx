import { useRef } from "react";
import { Outline } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const SECTIONS = [
    { id: "outline-install", label: "Installation", depth: 0 },
    { id: "outline-npm", label: "Via npm", depth: 1 },
    { id: "outline-cdn", label: "Via CDN", depth: 1 },
    { id: "outline-usage", label: "Usage", depth: 0 },
    { id: "outline-theming", label: "Theming", depth: 0 },
    { id: "outline-tokens", label: "Color tokens", depth: 1 },
    { id: "outline-dark", label: "Dark mode", depth: 1 },
    { id: "outline-faq", label: "FAQ", depth: 0 },
];

export function OutlineDemo() {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <Section title="Real use · scroll-spy docs page (scroll the panel below)">
            <div className="grid grid-cols-[1fr_12rem] gap-6">
                <div
                    ref={containerRef}
                    className="h-80 overflow-y-auto rounded-box border border-base-300 p-6"
                >
                    {SECTIONS.map((s) => (
                        <section key={s.id} id={s.id} className="mb-10 scroll-mt-4">
                            <h3 className="mb-2 text-base font-semibold">{s.label}</h3>
                            <p className="text-sm opacity-70">
                                Placeholder copy for the “{s.label}” section — long enough to
                                make the panel actually scroll so the active link updates as
                                you go.
                            </p>
                        </section>
                    ))}
                </div>

                <Outline items={SECTIONS} container={containerRef} offset={24} />
            </div>
        </Section>
    );
}
