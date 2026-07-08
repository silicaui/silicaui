import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Positioning shell for an `Input` with a leading/trailing icon or button —
 * search icon, password show/hide, clear button, and the like.
 *
 *   <InputGroup>
 *     <InputGroupAddon placement="start"><SearchIcon /></InputGroupAddon>
 *     <Input className="input-affix-start" placeholder="Search…" />
 *   </InputGroup>
 */
export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  function InputGroup({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div ref={ref} className={cx(sc("input-group"), className)} {...rest} />
    );
  },
);

export interface InputGroupAddonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Which side of the field this slot sits on. */
  placement: "start" | "end";
}

/** A leading/trailing slot inside an `InputGroup`. */
export const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  InputGroupAddonProps
>(function InputGroupAddon({ placement, className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <div
      ref={ref}
      className={cx(sc(`input-group-${placement}`), className)}
      {...rest}
    />
  );
});

export interface InputGroupButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/** An interactive icon button living inside an `InputGroupAddon`. */
export const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  InputGroupButtonProps
>(function InputGroupButton({ type = "button", className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <button
      ref={ref}
      type={type}
      className={cx(sc("input-group-btn"), className)}
      {...rest}
    />
  );
});
