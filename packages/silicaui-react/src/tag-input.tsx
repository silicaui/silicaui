import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

export type TagInputSize = "sm" | "md" | "lg";

export interface TagInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "color"> {
  /** Controlled tag list. */
  value?: string[];
  /** Uncontrolled initial tags. */
  defaultValue?: string[];
  /** Called with the next tag list whenever it changes. */
  onValueChange?: (tags: string[]) => void;
  /** Placeholder shown in the text field when there are no tags. */
  placeholder?: string;
  /** Disable the whole control. */
  disabled?: boolean;
  /** Chip + focus-ring accent color. */
  color?: SilicaColor;
  /** Height/type scale. Default `"md"`. */
  size?: TagInputSize;
  /** Keys that commit the current text as a tag. Default `["Enter", ","]`. */
  separators?: string[];
  /** Reject duplicate tags. Default `true`. */
  dedupe?: boolean;
  /** Maximum number of tags. */
  max?: number;
  /** Commit any pending text when the field loses focus. Default `true`. */
  addOnBlur?: boolean;
  /** Extra props for the inner `<input>`. */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

/**
 * A chip-based multi-value text field — tags for segments, recipients,
 * categories, and the like. Type and press Enter (or comma) to add; Backspace on
 * an empty field removes the last tag. Controlled via `value`/`onValueChange` or
 * uncontrolled via `defaultValue`.
 */
export const TagInput = React.forwardRef<HTMLDivElement, TagInputProps>(
  function TagInput(
    {
      value,
      defaultValue,
      onValueChange,
      placeholder,
      disabled,
      color,
      size = "md",
      separators = ["Enter", ","],
      dedupe = true,
      max,
      addOnBlur = true,
      inputProps,
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const sc = useSilicaClass();
    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = React.useState<string[]>(
      defaultValue ?? [],
    );
    const tags = isControlled ? value : uncontrolled;
    const [text, setText] = React.useState("");
    const fieldRef = React.useRef<HTMLInputElement>(null);

    const commit = (next: string[]) => {
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
    };

    const addTag = (raw: string) => {
      const t = raw.trim();
      if (!t) return;
      setText("");
      if (dedupe && tags.includes(t)) return;
      if (max != null && tags.length >= max) return;
      commit([...tags, t]);
    };

    const removeAt = (index: number) => {
      commit(tags.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (separators.includes(e.key)) {
        e.preventDefault();
        addTag(text);
      } else if (e.key === "Backspace" && text === "" && tags.length > 0) {
        removeAt(tags.length - 1);
      }
      inputProps?.onKeyDown?.(e);
    };

    return (
      <div
        ref={forwardedRef}
        className={cx(
          sc("tag-input"),
          color && sc(`tag-input-${color}`),
          size !== "md" && sc(`tag-input-${size}`),
          className,
        )}
        data-disabled={disabled || undefined}
        onMouseDown={(e) => {
          // Clicking the empty part of the box focuses the field without
          // stealing focus from a chip's remove button.
          if (e.target === e.currentTarget) {
            e.preventDefault();
            fieldRef.current?.focus();
          }
        }}
        {...rest}
      >
        {tags.map((tag, i) => (
          <span key={`${tag}-${i}`} className={cx(sc("tag-input-chip"))}>
            <span className={cx(sc("tag-input-chip-label"))}>{tag}</span>
            {!disabled && (
              <button
                type="button"
                className={cx(sc("tag-input-remove"))}
                aria-label={`Remove ${tag}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </span>
        ))}
        <input
          ref={fieldRef}
          type="text"
          className={cx(sc("tag-input-field"))}
          value={text}
          placeholder={tags.length === 0 ? placeholder : undefined}
          disabled={disabled}
          {...inputProps}
          onChange={(e) => {
            setText(e.target.value);
            inputProps?.onChange?.(e);
          }}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            if (addOnBlur) addTag(text);
            inputProps?.onBlur?.(e);
          }}
        />
      </div>
    );
  },
);
