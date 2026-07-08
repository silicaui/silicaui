import { useState } from "react";
import {
    Button,
    useControllableState,
    useMediaQuery,
    useBreakpoint,
    useTheme,
    useImperativeAlertDialog,
} from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

function ControllableDemo() {
    const [value, setValue] = useControllableState({ defaultValue: 0 });
    return (
        <Row>
            <Button size="sm" variant="outline" onClick={() => setValue((v) => v - 1)}>
                −
            </Button>
            <span className="w-6 text-center tabular-nums">{value}</span>
            <Button size="sm" variant="outline" onClick={() => setValue((v) => v + 1)}>
                +
            </Button>
        </Row>
    );
}

function MediaQueryDemo() {
    const isWide = useMediaQuery("(min-width: 48rem)");
    const isDesktop = useBreakpoint("lg");
    return (
        <p className="text-sm">
            {"(min-width: 48rem)"}: <strong>{String(isWide)}</strong> · lg breakpoint:{" "}
            <strong>{String(isDesktop)}</strong>
        </p>
    );
}

function ThemeDemo() {
    const [theme, setTheme] = useTheme();
    return (
        <Row>
            <span className="text-sm">
                Current: <strong>{theme}</strong>
            </span>
            <Button size="sm" variant="outline" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                Toggle theme
            </Button>
        </Row>
    );
}

function ImperativeConfirmDemo() {
    const confirm = useImperativeAlertDialog();
    const [result, setResult] = useState<string>("—");

    async function handleDelete() {
        const ok = await confirm({
            title: "Delete project?",
            description: "This permanently removes it. This can't be undone.",
            confirmLabel: "Delete",
            color: "error",
        });
        setResult(ok ? "confirmed" : "cancelled");
    }

    return (
        <Row>
            <Button color="error" variant="outline" onClick={handleDelete}>
                Delete project…
            </Button>
            <span className="text-sm opacity-70">Result: {result}</span>
        </Row>
    );
}

export function HooksDemo() {
    return (
        <>
            <Section title="useControllableState · uncontrolled counter">
                <ControllableDemo />
            </Section>
            <Section title="useMediaQuery / useBreakpoint">
                <MediaQueryDemo />
            </Section>
            <Section title="useTheme · reads/writes the shared [data-theme]">
                <ThemeDemo />
            </Section>
            <Section title="useImperativeAlertDialog · window.confirm(), but styled and async">
                <ImperativeConfirmDemo />
            </Section>
        </>
    );
}
