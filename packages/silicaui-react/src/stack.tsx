import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type StackPeek = "top" | "bottom" | "start" | "end";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which way the deck peeks. `top` (default), `bottom`, `start`, or `end`. */
  peek?: StackPeek;
  /** Make the deck clickable — sends the front card to the back to reveal the next. */
  interactive?: boolean;
}

/**
 * Silica Stack — layers its children into a peeking deck (first child on top).
 * With `interactive`, clicking (or Enter/Space) cycles the front card to the
 * back so you can flip through the deck; the re-stack animates.
 *
 *   <Stack interactive>
 *     <Card className="bg-primary text-primary-content"><CardBody>1</CardBody></Card>
 *     <Card className="bg-secondary text-secondary-content"><CardBody>2</CardBody></Card>
 *     <Card className="bg-accent text-accent-content"><CardBody>3</CardBody></Card>
 *   </Stack>
 */
export function Stack({
  peek = "top",
  interactive = false,
  className,
  children,
  onClick,
  onKeyDown,
  ...rest
}: StackProps) {
  const sc = useSilicaClass();
  const items = React.useMemo(() => React.Children.toArray(children), [children]);
  const [order, setOrder] = React.useState<number[]>(() => items.map((_, i) => i));

  // Reset the order if the NUMBER of children changes. Depending on `items`
  // itself is what the exhaustive-deps rule wants and is wrong here: it would
  // throw away the user's cycled order on every re-render that produces a new
  // children array, which is most of them.
  React.useEffect(() => {
    setOrder(items.map((_, i) => i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const cycle = React.useCallback(() => {
    // Move the front card to the back (slice avoids index access → no undefined).
    setOrder((o) => (o.length > 1 ? o.slice(1).concat(o.slice(0, 1)) : o));
  }, []);

  const ordered = order.map((i) => items[i]).filter(Boolean);

  const interactiveProps = interactive
    ? {
        role: "button" as const,
        tabIndex: 0,
        "aria-label": "Cycle stack",
        style: { cursor: "pointer", ...rest.style },
        onClick: (e: React.MouseEvent<HTMLDivElement>) => {
          cycle();
          onClick?.(e);
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cycle();
          }
          onKeyDown?.(e);
        },
      }
    : { onClick, onKeyDown };

  return (
    <div
      className={cx(sc("stack"), peek !== "top" && sc(`stack-${peek}`), className)}
      {...rest}
      {...interactiveProps}
    >
      {ordered}
    </div>
  );
}
