import { PreviewCard, Link, Avatar } from "silicaui-react";
import { Section } from "../lib/Section";

export function PreviewCardDemo() {
    return (
        <Section title="Real use · hover a link to preview the profile">
            <p className="max-w-md text-sm">
                Reviewed by{" "}
                <PreviewCard
                    content={
                        <div className="flex items-center gap-3">
                            <Avatar color="primary" alt="Ada Lovelace">
                                AL
                            </Avatar>
                            <div>
                                <div className="font-medium">Ada Lovelace</div>
                                <div className="text-xs opacity-60">
                                    Founding engineer · @ada
                                </div>
                            </div>
                        </div>
                    }
                    arrow
                >
                    <Link href="#" color="primary">
                        @ada
                    </Link>
                </PreviewCard>{" "}
                on the pull request.
            </p>
        </Section>
    );
}
