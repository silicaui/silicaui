import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";
import { InputGroup, InputGroupAddon, InputGroupButton } from "./input-group";

export type PasswordInputColor = SilicaColor;
export type PasswordInputSize = SilicaSize;

export interface PasswordInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "color" | "type"
  > {
  /** Accent color; maps to `input-<color>` (border + focus ring). */
  color?: PasswordInputColor;
  /** Default `md`. Matches same-size Button/Input heights. */
  size?: PasswordInputSize;
  /** Reveal the password on initial render. Default `false`. */
  defaultVisible?: boolean;
  /** Accessible label for the show/hide toggle. Default `"Show password"` / `"Hide password"`. */
  toggleAriaLabel?: { show: string; hide: string };
}

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.06 4.14M6.61 6.61C3.99 8.32 2 11 2 11s3.5 7 10 7a9.16 9.16 0 0 0 4.24-1.02" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.53 9.53a3 3 0 0 0 4.24 4.24" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 2l20 20" strokeLinecap="round" />
  </svg>
);

/**
 * Silica PasswordInput — an `Input` with a leading lock affix slot reserved and
 * a trailing show/hide toggle. Uncontrolled visibility state; all native
 * `<input>` attributes (`value`, `onChange`, `placeholder`, `disabled`, …) pass
 * straight through.
 */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(function PasswordInput(
  {
    color,
    size = "md",
    defaultVisible = false,
    toggleAriaLabel = { show: "Show password", hide: "Hide password" },
    className,
    disabled,
    ...rest
  },
  ref,
) {
  const sc = useSilicaClass();
  const [visible, setVisible] = React.useState(defaultVisible);

  const classes = cx(
    sc("input"),
    sc("input-affix-end"),
    color && sc(`input-${color}`),
    size !== "md" && sc(`input-${size}`),
    className,
  );

  return (
    <InputGroup>
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={classes}
        disabled={disabled}
        {...rest}
      />
      <InputGroupAddon placement="end">
        <InputGroupButton
          disabled={disabled}
          aria-label={visible ? toggleAriaLabel.hide : toggleAriaLabel.show}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
});
