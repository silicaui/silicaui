import { Fragment, type ComponentType, type ReactNode } from "react";
import type { SilicaColor, SilicaSize } from "@wizeworks/silicaui-react";
import { Section, Row } from "./Section";
import { COLORS, SIZES } from "./data";

export interface GridSpecimen {
    color?: SilicaColor;
    variant?: string;
    size?: SilicaSize;
}

interface ColorVariantSizeGridProps {
    /** The component under test. Default rendering assumes the standard Silica
     * `color`/`variant`/`size` + children shape (the orthogonal color model —
     * every primitive takes color/variant this way). Pass `render` to override
     * for components with a different prop shape (e.g. `value` instead of
     * children). */
    Component: ComponentType<any>;
    /** Non-default variants this component supports, e.g. `["outline","soft"]`.
     * Omit entirely for color-only components (no variant axis). */
    variants?: string[];
    /** Override how one specimen renders. Receives the facet being demonstrated. */
    render?: (props: GridSpecimen) => ReactNode;
    /** Skip the Sizes section for components with no size ladder. */
    skipSizes?: boolean;
}

function defaultRender(Component: ComponentType<any>, { color, variant, size }: GridSpecimen) {
    return (
        <Component color={color} variant={variant} size={size}>
            {color ?? size}
        </Component>
    );
}

/**
 * The mechanical part of a demo: COLORS (+ optional variants, + the SIZES
 * ladder) rendered as a for-loop under `Section`s. Every Silica primitive
 * shares the same color/variant/size prop shape, so this ONE component covers
 * the repetitive facet for all of them — a demo file only adds what's actually
 * unique to that component (icon slots, structured children, interactive
 * state) around it. This is the thing to reach for BEFORE hand-rolling another
 * `{COLORS.map(...)}` block.
 */
export function ColorVariantSizeGrid({
    Component,
    variants = [],
    render,
    skipSizes = false,
}: ColorVariantSizeGridProps) {
    const renderSpecimen = render ?? ((p) => defaultRender(Component, p));

    return (
        <>
            <Section title="Colors (solid)">
                <Row>
                    {COLORS.map((color) => (
                        <Fragment key={color}>{renderSpecimen({ color })}</Fragment>
                    ))}
                </Row>
            </Section>

            {variants.map((variant) => (
                <Section key={variant} title={`Variant · ${variant}`}>
                    <Row>
                        {COLORS.map((color) => (
                            <Fragment key={color}>
                                {renderSpecimen({ color, variant })}
                            </Fragment>
                        ))}
                    </Row>
                </Section>
            ))}

            {!skipSizes && (
                <Section title="Sizes">
                    <Row>
                        {SIZES.map((size) => (
                            <Fragment key={size}>
                                {renderSpecimen({ color: "primary", size })}
                            </Fragment>
                        ))}
                    </Row>
                </Section>
            )}
        </>
    );
}
