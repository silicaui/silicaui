import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass, useSilicaConfig } from "./lib/config";
import { mergeProps } from "./lib/merge-props";
import { Checkbox } from "./checkbox";
import { Radio } from "./radio";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Silica Card — a surface container. Compose it from parts:
 *
 *   <Card>
 *     <figure><img src={cover} alt="" /></figure>
 *     <CardBody>
 *       <CardTitle>Heading</CardTitle>
 *       <p>Body copy…</p>
 *       <CardActions>
 *         <Button color="primary">Action</Button>
 *       </CardActions>
 *     </CardBody>
 *   </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  function Card({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("card"), className)} {...rest} />;
  },
);

/** Padded content stack inside a Card. */
export const CardBody = React.forwardRef<HTMLDivElement, CardProps>(
  function CardBody({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("card-body"), className)} {...rest} />;
  },
);

/** Card heading. Renders a `div` — pair with your own heading level if needed. */
export const CardTitle = React.forwardRef<HTMLDivElement, CardProps>(
  function CardTitle({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("card-title"), className)} {...rest} />;
  },
);

/** Right-aligned action row (buttons, links) at the bottom of a Card body. */
export const CardActions = React.forwardRef<HTMLDivElement, CardProps>(
  function CardActions({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div ref={ref} className={cx(sc("card-actions"), className)} {...rest} />
    );
  },
);

export interface ClickableCardProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /**
   * Render as a different element (e.g. an anchor) while keeping Card's
   * classes and interaction styles. Mirrors Base UI's `render` composition.
   *
   *   <ClickableCard render={<a href="/projects/silica" />}>…</ClickableCard>
   */
  render?: React.ReactElement;
}

/**
 * The class-string logic behind `<ClickableCard>`, as a standalone function
 * with no React context dependency — usable from a Server Component to style
 * a plain element directly. Pass `prefix` to match a non-default
 * `<SilicaProvider prefix>`.
 */
export function clickableCardClasses(
  { className }: { className?: string } = {},
  { prefix = "" }: { prefix?: string } = {},
): string {
  const sc = (name: string) => `${prefix}${name}`;
  return cx(sc("card"), sc("card-clickable"), className);
}

/** A `Card` that's a whole clickable surface — a `<button>` by default, or any element via `render`. */
export const ClickableCard = React.forwardRef<HTMLButtonElement, ClickableCardProps>(
  function ClickableCard({ render, className, children, ...rest }, ref) {
    const { prefix } = useSilicaConfig();
    const classes = clickableCardClasses({ className }, { prefix });

    if (render) {
      const ownProps: Record<string, unknown> = { ...rest, className: classes, children, ref };
      return React.cloneElement(
        render,
        mergeProps(ownProps, render.props as Record<string, unknown>),
      );
    }

    return (
      <button ref={ref} type="button" className={classes} {...rest}>
        {children}
      </button>
    );
  },
);

export interface SelectableCardProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** `"radio"` for a single-select group (shared `name`), `"checkbox"` for multi-select. Default `"radio"`. */
  type?: "radio" | "checkbox";
}

/**
 * A `Card` that's a selectable option tile — a real `<input type="radio">` /
 * `<input type="checkbox">`, visually hidden, wrapped in a `<label>` so the
 * whole card is the click target. Selection reads as a border + ring in the
 * theme's primary color — no checkbox/radio glyph. Group several with the
 * same `name` for single-select; use `type="checkbox"` for multi-select.
 *
 *   <SelectableCard name="plan" value="pro" defaultChecked>
 *     <CardTitle>Pro</CardTitle>
 *     <p>For growing teams.</p>
 *   </SelectableCard>
 */
export const SelectableCard = React.forwardRef<HTMLInputElement, SelectableCardProps>(
  function SelectableCard({ type = "radio", className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    const Control = type === "checkbox" ? Checkbox : Radio;
    return (
      <label className={cx(sc("card"), sc("card-selectable"), className)}>
        <Control ref={ref} className={cx(sc("card-selectable-indicator"))} {...rest} />
        {children}
      </label>
    );
  },
);
