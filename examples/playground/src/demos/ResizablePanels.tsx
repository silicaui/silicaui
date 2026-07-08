import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizeHandle,
} from "@wizeworks/silicaui-panels";
import { Section } from "../lib/Section";

export function ResizablePanelsDemo() {
    return (
        <>
            <Section title="Real use · sidebar + editor + preview">
                <ResizablePanelGroup
                    direction="horizontal"
                    className="h-64 max-w-2xl rounded-box border border-base-300"
                >
                    <ResizablePanel defaultSize={20} minSize={15}>
                        <div className="flex h-full items-center justify-center bg-base-200 text-sm">
                            Sidebar
                        </div>
                    </ResizablePanel>
                    <ResizeHandle />
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <div className="flex h-full items-center justify-center text-sm">
                            Editor
                        </div>
                    </ResizablePanel>
                    <ResizeHandle />
                    <ResizablePanel defaultSize={30} minSize={15}>
                        <div className="flex h-full items-center justify-center bg-base-200 text-sm">
                            Preview
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </Section>

            <Section title="Vertical stack">
                <ResizablePanelGroup
                    direction="vertical"
                    className="h-64 max-w-md rounded-box border border-base-300"
                >
                    <ResizablePanel defaultSize={50}>
                        <div className="flex h-full items-center justify-center bg-base-200 text-sm">
                            Top
                        </div>
                    </ResizablePanel>
                    <ResizeHandle />
                    <ResizablePanel defaultSize={50}>
                        <div className="flex h-full items-center justify-center text-sm">
                            Bottom
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </Section>
        </>
    );
}
