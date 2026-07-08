import { useState } from "react";
import { Button, SilicaProvider, ToastProvider } from "@wizeworks/silicaui-react";
import { DEMOS } from "./demos/registry";

/**
 * The playground shell. It owns only the chrome — theme toggle, header, and the
 * registry walk — while every component's showcase lives in its own
 * `demos/<Name>.tsx` file (each < 250 lines, self-contained, individually
 * consumable). Adding a component never touches this file.
 */
export function App() {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    function toggleTheme() {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        document.documentElement.dataset.theme = next;
    }

    return (
        <SilicaProvider>
            <ToastProvider>
                <div className="mx-auto flex max-w-4xl flex-col gap-16 px-6 py-12">
                    <header className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Silica UI</h1>
                            <p className="opacity-60">Components on one token system.</p>
                        </div>
                        <Button variant="outline" color="neutral" onClick={toggleTheme}>
                            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
                        </Button>
                    </header>

                    {DEMOS.map(({ id, title, Demo }) => (
                        <section
                            key={id}
                            id={id}
                            className="flex scroll-mt-6 flex-col gap-6"
                        >
                            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                            <Demo />
                        </section>
                    ))}
                </div>
            </ToastProvider>
        </SilicaProvider>
    );
}
