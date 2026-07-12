import { Button, useToast } from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function ToastDemo() {
    const toast = useToast();

    return (
        <Section title="Real use · trigger toasts (uses the app-level ToastProvider)">
            <Row>
                <Button
                    color="primary"
                    onClick={() =>
                        toast.add({
                            title: "Changes saved",
                            description: "Your workspace is up to date.",
                            type: "success",
                        })
                    }
                >
                    Success toast
                </Button>
                <Button
                    color="error"
                    variant="outline"
                    onClick={() =>
                        toast.add({
                            title: "Upload failed",
                            description: "The file was too large.",
                            type: "error",
                        })
                    }
                >
                    Error toast
                </Button>
                <Button
                    color="neutral"
                    variant="ghost"
                    onClick={() =>
                        toast.add({ title: "Heads up — something happened." })
                    }
                >
                    Plain toast
                </Button>
                <Button
                    variant="outline"
                    onClick={() =>
                        toast.add({
                            title: "Glass toast",
                            description: 'toast.add({ data: { className: "glass" } })',
                            data: { className: "glass" },
                        })
                    }
                >
                    Glass toast
                </Button>
                <Button
                    color="info"
                    variant="outline"
                    onClick={() =>
                        toast.add({
                            title: "New version available",
                            description: "toast.add({ actionProps: {...} })",
                            type: "info",
                            timeout: 0,
                            actionProps: {
                                children: "Refresh",
                                onClick: () => alert("Refresh clicked"),
                            },
                        })
                    }
                >
                    Actionable toast
                </Button>
            </Row>
        </Section>
    );
}
