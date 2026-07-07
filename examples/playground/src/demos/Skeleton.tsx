import { Skeleton } from "silicaui-react";
import { Section, Row } from "../lib/Section";

export function SkeletonDemo() {
    return (
        <>
            <Section title="Shapes">
                <Row>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton shape="circle" className="h-12 w-12" />
                    <Skeleton shape="text" className="w-40" />
                </Row>
            </Section>

            <Section title="Real use · loading card">
                <div className="flex max-w-sm flex-col gap-3 rounded-box border border-base-300 p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton shape="circle" className="h-10 w-10" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton shape="text" className="w-32" />
                            <Skeleton shape="text" className="w-20" />
                        </div>
                    </div>
                    <Skeleton className="h-32 w-full" />
                    <Skeleton shape="text" className="w-full" />
                    <Skeleton shape="text" className="w-2/3" />
                </div>
            </Section>
        </>
    );
}
