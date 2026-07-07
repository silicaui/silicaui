import type { ReactNode } from "react";

/**
 * A titled sub-group inside a demo. One demo file typically stacks several
 * `Section`s (Colors, Sizes, States, …). The heading is deliberately small and
 * quiet — the component NAME is the loud heading, rendered once by the shell
 * from the registry; these label the facets underneath it.
 */
export function Section({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50">
                {title}
            </h3>
            {children}
        </section>
    );
}

/** The default demo layout: a wrapping, gap'd flex row of specimens. */
export function Row({ children }: { children: ReactNode }) {
    return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/** A vertical stack (for form controls, alerts, anything full-width). */
export function Stack({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={`grid gap-3 ${className}`}>{children}</div>;
}

/** A labeled slot — a small caption above a single specimen. */
export function LabeledRow({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs opacity-60">{label}</span>
            {children}
        </div>
    );
}
