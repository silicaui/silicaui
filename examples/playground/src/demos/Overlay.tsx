import { Overlay, Badge, Button } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

function placeholder(label: string, from: string, to: string): string {
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260'>` +
            `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
            `<stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>` +
            `</linearGradient></defs>` +
            `<rect width='400' height='260' fill='url(#g)'/>` +
            `</svg>`,
    )}`;
}

export function OverlayDemo() {
    return (
        <>
            <Section title="Real use · caption scrim, always visible">
                <div className="max-w-sm">
                    <Overlay
                        className="rounded-box"
                        overlay={
                            <div>
                                <h3 className="text-base font-semibold">Mountain sunrise</h3>
                                <p className="text-sm opacity-80">Banff National Park</p>
                            </div>
                        }
                    >
                        <img src={placeholder("1", "#0ea5e9", "#1e3a8a")} alt="" />
                    </Overlay>
                </div>
            </Section>

            <Section title="Placement · top / bottom / full">
                <Row>
                    {(["top", "bottom", "full"] as const).map((placement) => (
                        <div key={placement} className="w-48">
                            <Overlay
                                className="rounded-box"
                                placement={placement}
                                overlay={<Badge color="primary">{placement}</Badge>}
                            >
                                <img src={placeholder(placement, "#f97316", "#7c2d12")} alt="" />
                            </Overlay>
                        </div>
                    ))}
                </Row>
            </Section>

            <Section title="reveal=&quot;hover&quot; · gallery grid, scrim fades in on hover/focus">
                <div className="grid max-w-md grid-cols-3 gap-2">
                    {["10b981-06b6d4", "8b5cf6-ec4899", "f59e0b-ef4444"].map((pair, i) => {
                        const [from, to] = pair.split("-").map((c) => `#${c}`);
                        return (
                            <Overlay
                                key={pair}
                                className="rounded-field"
                                reveal="hover"
                                placement="full"
                                overlay={
                                    <Button size="sm" color="primary">
                                        View
                                    </Button>
                                }
                            >
                                <img src={placeholder(`g${i}`, from!, to!)} alt="" />
                            </Overlay>
                        );
                    })}
                </div>
            </Section>
        </>
    );
}
