import { Prose } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function ProseDemo() {
    return (
        <>
            <Section title="Real use · rendered article body">
                <Prose>
                    <h2>Launch checklist</h2>
                    <p>
                        Draft the announcement in <strong>rich text</strong> — headings,
                        lists, and links all export as clean HTML.
                    </p>
                    <ul>
                        <li>Write the copy</li>
                        <li>Add screenshots</li>
                        <li>
                            Link the <a href="#">changelog</a>
                        </li>
                    </ul>
                    <blockquote>Ship small, ship often.</blockquote>
                    <p>
                        Inline <code>code</code> and block code both pick up themed
                        styling automatically.
                    </p>
                </Prose>
            </Section>

            <Section title="Sizes">
                <div className="flex flex-col gap-6">
                    {(["sm", "lg"] as const).map((size) => (
                        <Prose key={size} size={size}>
                            <p>
                                <code>size=&quot;{size}&quot;</code> rescales the whole block
                                by one root font-size.
                            </p>
                        </Prose>
                    ))}
                </div>
            </Section>
        </>
    );
}
