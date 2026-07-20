import { useState } from "react";
import { RichTextEditor } from "@wizeworks/silicaui-editor";
import { Section } from "../lib/Section";

export function RichTextEditorDemo() {
    const [doc, setDoc] = useState(
        "<h2>Launch checklist</h2><p>Draft the announcement in <strong>rich text</strong> — headings, lists, and links all export as clean HTML.</p><ul><li>Write the copy</li><li>Add screenshots</li></ul>",
    );

    return (
        <Section title="Real use · a full formatting toolbar over TipTap">
            <RichTextEditor
                value={doc}
                onValueChange={setDoc}
                className="max-w-xl"
            />
        </Section>
    );
}
