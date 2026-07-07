import { useState } from "react";
import { Dropzone } from "silicaui-react";
import { Section } from "../lib/Section";

export function DropzoneDemo() {
    const [files, setFiles] = useState<string[]>([]);
    const [rejected, setRejected] = useState<string[]>([]);

    return (
        <Section title="Real use · image upload with rejection reasons">
            <div className="flex max-w-md flex-col gap-3">
                <Dropzone
                    accept="image/*"
                    maxSize={2 * 1024 * 1024}
                    hint="PNG or JPG, up to 2MB"
                    onFiles={(fs) => setFiles(fs.map((f) => f.name))}
                    onReject={(rs) =>
                        setRejected(rs.map((r) => `${r.file.name} (${r.reason})`))
                    }
                />
                {files.length > 0 && (
                    <p className="text-xs text-success">Accepted: {files.join(", ")}</p>
                )}
                {rejected.length > 0 && (
                    <p className="text-xs text-error">Rejected: {rejected.join(", ")}</p>
                )}
            </div>
        </Section>
    );
}
