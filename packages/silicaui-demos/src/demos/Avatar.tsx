import { Avatar, AvatarGroup } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";
import { COLORS, SIZES } from "../lib/data";

// A stand-in "photo" (data URI, always loads offline): a head-and-shoulders
// silhouette on a gradient, so the image path — object-fit cover + rounding —
// is demonstrated without a network request.
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

export function AvatarDemo() {
    return (
        <>
            <Section title="Colors (initials fallback)">
                <Row>
                    {COLORS.map((color) => (
                        <Avatar key={color} color={color} alt={color}>
                            {color.slice(0, 2).toUpperCase()}
                        </Avatar>
                    ))}
                </Row>
            </Section>

            <Section title="Sizes">
                <Row>
                    {SIZES.map((size) => (
                        <Avatar key={size} color="primary" size={size} alt={size}>
                            {size.toUpperCase()}
                        </Avatar>
                    ))}
                </Row>
            </Section>

            <Section title="Real use · team roster with presence">
                <Row>
                    <Avatar src={PHOTO} alt="Ada Lovelace" ring status="online" />
                    <Avatar color="secondary" alt="Grace Hopper" ring status="online">
                        GH
                    </Avatar>
                    <Avatar color="neutral" alt="Alan Turing" status="offline">
                        AT
                    </Avatar>
                    <Avatar shape="rounded" color="brand" alt="Katherine Johnson">
                        KJ
                    </Avatar>
                </Row>
                <Row>
                    <span className="text-xs opacity-60">Overlapping group —</span>
                    <AvatarGroup>
                        <Avatar src={PHOTO} alt="Ada Lovelace" />
                        <Avatar color="secondary" alt="Grace Hopper">
                            GH
                        </Avatar>
                        <Avatar color="accent" alt="Alan Turing">
                            AT
                        </Avatar>
                        <Avatar color="neutral" alt="+3 more">
                            +3
                        </Avatar>
                    </AvatarGroup>
                </Row>
            </Section>
        </>
    );
}
