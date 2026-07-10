import { Footer, FooterTitle, Link } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function FooterDemo() {
    return (
        <>
            <Section title="Real use · multi-column site footer">
                <Footer className="rounded-box border border-base-300 p-6">
                    <nav>
                        <FooterTitle>Product</FooterTitle>
                        <Link href="#">Features</Link>
                        <Link href="#">Pricing</Link>
                        <Link href="#">Changelog</Link>
                    </nav>
                    <nav>
                        <FooterTitle>Company</FooterTitle>
                        <Link href="#">About</Link>
                        <Link href="#">Careers</Link>
                        <Link href="#">Contact</Link>
                    </nav>
                    <nav>
                        <FooterTitle>Legal</FooterTitle>
                        <Link href="#">Terms</Link>
                        <Link href="#">Privacy</Link>
                    </nav>
                </Footer>
            </Section>

            <Section title="Centered">
                <Footer center className="rounded-box border border-base-300 p-6">
                    <div>
                        <p>© 2026 Silica UI — all rights reserved.</p>
                    </div>
                </Footer>
            </Section>

            <Section title="Glass · footer over a colored page background">
                <div
                    className="flex flex-col justify-end gap-24 rounded-box p-4"
                    style={{
                        backgroundImage:
                            "linear-gradient(135deg, var(--color-primary), var(--color-accent), var(--color-secondary))",
                    }}
                >
                    <Footer className="glass p-6">
                        <nav>
                            <FooterTitle>Product</FooterTitle>
                            <Link href="#">Features</Link>
                            <Link href="#">Pricing</Link>
                            <Link href="#">Changelog</Link>
                        </nav>
                        <nav>
                            <FooterTitle>Company</FooterTitle>
                            <Link href="#">About</Link>
                            <Link href="#">Careers</Link>
                            <Link href="#">Contact</Link>
                        </nav>
                        <nav>
                            <FooterTitle>Legal</FooterTitle>
                            <Link href="#">Terms</Link>
                            <Link href="#">Privacy</Link>
                        </nav>
                    </Footer>
                </div>
            </Section>
        </>
    );
}
