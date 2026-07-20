import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface ListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add a hover highlight to rows (for interactive lists). */
  hover?: boolean;
}

/**
 * Silica List — a vertical list of rows.
 *
 *   <List hover>
 *     <ListTitle>Team</ListTitle>
 *     <ListRow>
 *       <Avatar size="sm">AL</Avatar>
 *       <ListColGrow>
 *         <div className="font-medium">Ada Lovelace</div>
 *         <div className="text-sm">Owner</div>
 *       </ListColGrow>
 *       <Button size="sm" variant="ghost">Manage</Button>
 *     </ListRow>
 *   </List>
 */
export const List = React.forwardRef<HTMLDivElement, ListProps>(
  function List({ hover, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div ref={ref} className={cx(sc("list"), hover && sc("list-hover"), className)} {...rest} />
    );
  },
);

export type ListRowProps = React.HTMLAttributes<HTMLDivElement>;
export const ListRow = React.forwardRef<HTMLDivElement, ListRowProps>(
  function ListRow({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("list-row"), className)} {...rest} />;
  },
);

/** The cell that should take the remaining width (title/body). */
export type ListColGrowProps = React.HTMLAttributes<HTMLDivElement>;
export const ListColGrow = React.forwardRef<HTMLDivElement, ListColGrowProps>(
  function ListColGrow({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("list-col-grow"), className)} {...rest} />;
  },
);

export type ListTitleProps = React.HTMLAttributes<HTMLDivElement>;
export const ListTitle = React.forwardRef<HTMLDivElement, ListTitleProps>(
  function ListTitle({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("list-title"), className)} {...rest} />;
  },
);
