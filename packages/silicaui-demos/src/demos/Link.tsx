import { Link } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";
import { COLORS } from "../lib/data";

export function LinkDemo() {
    return (
        <>
            <Section title="Colors">
                <Row>
                    {COLORS.map((color) => (
                        <Link key={color} href="#" color={color}>
                            {color}
                        </Link>
                    ))}
                </Row>
            </Section>

            <Section title="Hover-only underline">
                <Row>
                    <Link href="#" color="primary" hover>
                        Underlines on hover
                    </Link>
                    <Link href="#" color="brand" hover>
                        Also brand
                    </Link>
                </Row>
            </Section>

            <Section title="Real use · inline in a sentence">
                <p className="max-w-md opacity-80">
                    By continuing you agree to our{" "}
                    <Link href="#" color="primary">
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" color="primary" hover>
                        Privacy Policy
                    </Link>
                    .
                </p>
            </Section>
        </>
    );
}
