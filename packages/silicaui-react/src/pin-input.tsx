import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type PinInputColor = SilicaColor;
export type PinInputSize = SilicaSize;

export interface PinInputProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onChange" | "onPaste" | "color"
  > {
  /** Number of cells. Default `6`. */
  length?: number;
  /** Controlled value (a string up to `length` chars). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fires with the next value on every keystroke, paste, or deletion. */
  onValueChange?: (value: string) => void;
  /** Fires once the value reaches `length` characters. */
  onComplete?: (value: string) => void;
  /** Restrict input to digits (`"numeric"`, default) or any single character (`"text"`). */
  mode?: "numeric" | "text";
  /** Render each cell's character as a dot, like a password field. Default `false`. */
  mask?: boolean;
  /** Accent color; maps to `pin-input-cell-<color>` (border + focus ring). */
  color?: PinInputColor;
  /** Default `md`. Matches same-size Input heights. */
  size?: PinInputSize;
  disabled?: boolean;
  /** Focus the first cell on mount. */
  autoFocus?: boolean;
  /** Field name for form submission (submits the joined value as one field). */
  name?: string;
  "aria-label"?: string;
}

/**
 * Silica PinInput — a row of single-character cells for OTP / verification
 * codes. Typing a character auto-advances to the next cell; Backspace on an
 * empty cell steps back; arrow keys move focus; pasting a full code
 * distributes it across the cells.
 */
export const PinInput = React.forwardRef<HTMLDivElement, PinInputProps>(
  function PinInput(
    {
      length = 6,
      value,
      defaultValue,
      onValueChange,
      onComplete,
      mode = "numeric",
      mask = false,
      color,
      size = "md",
      disabled,
      autoFocus,
      name,
      className,
      "aria-label": ariaLabel = "Verification code",
      ...rest
    },
    forwardedRef,
  ) {
    const sc = useSilicaClass();
    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "");
    const current = isControlled ? (value ?? "") : uncontrolled;
    const chars = React.useMemo(() => {
      const arr = current.split("").slice(0, length);
      while (arr.length < length) arr.push("");
      return arr;
    }, [current, length]);

    const cellRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const isAllowed = React.useCallback(
      (ch: string) => (mode === "numeric" ? /^[0-9]$/.test(ch) : ch.length === 1),
      [mode],
    );

    const commit = (nextChars: string[]) => {
      const next = nextChars.join("");
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
      if (next.length === length && nextChars.every((c) => c !== "")) {
        onComplete?.(next);
      }
    };

    const focusCell = (index: number) => {
      cellRefs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
    };

    const handleChange = (
      index: number,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const raw = e.target.value;
      const ch = raw.slice(-1);
      if (ch && !isAllowed(ch)) return;
      const next = [...chars];
      next[index] = ch;
      commit(next);
      if (ch && index < length - 1) focusCell(index + 1);
    };

    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (e.key === "Backspace" && chars[index] === "" && index > 0) {
        e.preventDefault();
        const next = [...chars];
        next[index - 1] = "";
        commit(next);
        focusCell(index - 1);
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusCell(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusCell(index + 1);
      }
    };

    const handlePaste = (
      index: number,
      e: React.ClipboardEvent<HTMLInputElement>,
    ) => {
      const text = e.clipboardData.getData("text");
      const pasted = text.split("").filter(isAllowed);
      if (!pasted.length) return;
      e.preventDefault();
      const next = [...chars];
      let i = index;
      for (const ch of pasted) {
        if (i >= length) break;
        next[i] = ch;
        i++;
      }
      commit(next);
      focusCell(Math.min(i, length - 1));
    };

    return (
      <div
        ref={forwardedRef}
        role="group"
        aria-label={ariaLabel}
        className={cx(sc("pin-input"), className)}
        {...rest}
      >
        {chars.map((ch, i) => (
          <input
            key={i}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            type={mask ? "password" : "text"}
            inputMode={mode === "numeric" ? "numeric" : "text"}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            className={cx(
              sc("pin-input-cell"),
              color && sc(`pin-input-cell-${color}`),
              size !== "md" && sc(`pin-input-cell-${size}`),
            )}
            value={ch}
            data-filled={ch !== "" || undefined}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            aria-label={`Digit ${i + 1} of ${length}`}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
          />
        ))}
        {name && <input type="hidden" name={name} value={current} />}
      </div>
    );
  },
);
