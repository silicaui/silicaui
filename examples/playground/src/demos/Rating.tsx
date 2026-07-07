import { useState } from "react";
import { Rating } from "silicaui-react";
import { Section, Row, LabeledRow } from "../lib/Section";
import { COLORS, SIZES } from "../lib/data";

export function RatingDemo() {
    const [stars, setStars] = useState(3);

    return (
        <>
            <Section title="Colors (read-only)">
                <Row>
                    {COLORS.slice(0, 6).map((color) => (
                        <Rating key={color} color={color} defaultValue={4} readOnly />
                    ))}
                </Row>
            </Section>

            <Section title="Sizes">
                <div className="flex flex-col gap-2">
                    {SIZES.map((size) => (
                        <Rating key={size} color="warning" size={size} defaultValue={3} readOnly />
                    ))}
                </div>
            </Section>

            <Section title="Real use · rate this product">
                <LabeledRow label={`You rated this ${stars} of 5 stars`}>
                    <Rating color="warning" value={stars} onChange={setStars} />
                </LabeledRow>
            </Section>
        </>
    );
}
