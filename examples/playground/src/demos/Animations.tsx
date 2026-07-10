import { useState } from "react";
import { Section, Row } from "../lib/Section";

const ENTRANCE_PRESETS = [
    "fade-in",
    "slide-up",
    "slide-down",
    "slide-left",
    "slide-right",
    "scale-in",
    "zoom-in",
];

const HOVER_PRESETS = ["lift", "scale", "glow"];

function Specimen({
    className,
    label,
    inView,
}: {
    className: string;
    label: string;
    inView?: boolean;
}) {
    return (
        <div
            className={`flex h-16 w-28 items-center justify-center rounded-box border border-base-300 bg-base-200 text-xs ${className}`}
            data-sui-inview={inView || undefined}
        >
            {label}
        </div>
    );
}

export function AnimationsDemo() {
    // On Load presets re-play by remounting (key bump) — there's no attribute
    // to toggle, the keyframe just plays on paint.
    const [loadKey, setLoadKey] = useState(0);
    // On Scroll presets are transition-based, gated by [data-sui-inview] — the
    // real behavior (packages/silicaui-behaviors) sets that via
    // IntersectionObserver; here it's toggled by hand to prove the CSS.
    const [inView, setInView] = useState(false);

    return (
        <>
            <Section title="On Load — replays on remount">
                <Row>
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setLoadKey((k) => k + 1)}
                    >
                        Replay
                    </button>
                </Row>
                <Row>
                    {ENTRANCE_PRESETS.map((preset) => (
                        <Specimen
                            key={`${preset}-${loadKey}`}
                            className={`sui-animate-${preset}`}
                            label={preset}
                        />
                    ))}
                </Row>
            </Section>

            <Section title="On Scroll — [data-sui-inview] toggled by hand here">
                <Row>
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setInView((v) => !v)}
                    >
                        Toggle in-view
                    </button>
                </Row>
                <Row>
                    {ENTRANCE_PRESETS.map((preset) => (
                        <Specimen
                            key={preset}
                            className={`sui-reveal-${preset}`}
                            label={preset}
                            inView={inView}
                        />
                    ))}
                </Row>
            </Section>

            <Section title="Hover">
                <Row>
                    {HOVER_PRESETS.map((preset) => (
                        <Specimen
                            key={preset}
                            className={`sui-hover-${preset}`}
                            label={preset}
                        />
                    ))}
                </Row>
            </Section>

            <Section title="Speed / delay — slide-up preset">
                <Row>
                    <Specimen
                        key={`fast-${loadKey}`}
                        className="sui-animate-slide-up sui-duration-fast"
                        label="fast"
                    />
                    <Specimen
                        key={`normal-${loadKey}`}
                        className="sui-animate-slide-up sui-duration-normal"
                        label="normal"
                    />
                    <Specimen
                        key={`slow-${loadKey}`}
                        className="sui-animate-slide-up sui-duration-slow"
                        label="slow"
                    />
                    <Specimen
                        key={`delay-${loadKey}`}
                        className="sui-animate-slide-up sui-delay-2"
                        label="delay 2"
                    />
                </Row>
                <Row>
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setLoadKey((k) => k + 1)}
                    >
                        Replay
                    </button>
                </Row>
            </Section>
        </>
    );
}
