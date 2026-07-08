import { FileUpload } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

export function FileUploadDemo() {
    return (
        <Section title="Real use · attachments with previews, accept/maxSize filtering">
            <div className="max-w-md">
                <FileUpload
                    accept="image/*,.pdf"
                    maxSize={2 * 1024 * 1024}
                    hint="Images or PDF, up to 2MB each"
                />
            </div>
        </Section>
    );
}
