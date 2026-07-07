import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

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
