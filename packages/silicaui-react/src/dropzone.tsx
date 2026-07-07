import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface DropzoneRejection {
  file: File;
  reason: "type" | "size";
}

export interface DropzoneProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrop" | "title"> {
  /** Called with the accepted files (from a drop or the picker). */
  onFiles?: (files: File[]) => void;
  /** Called with files rejected by `accept` / `maxSize`. */
  onReject?: (rejections: DropzoneRejection[]) => void;
  /** Native-style accept list, e.g. `"image/*,.pdf"`. */
  accept?: string;
  /** Allow selecting/dropping more than one file. Default `true`. */
  multiple?: boolean;
  /** Max size per file, in bytes. */
  maxSize?: number;
  disabled?: boolean;
  /** Primary line. Default `"Drop files here, or click to browse"`. */
  title?: React.ReactNode;
  /** Secondary hint line (e.g. accepted types). */
  hint?: React.ReactNode;
  /** Override the default upload icon. */
  icon?: React.ReactNode;
  /** Extra props for the underlying `<input type=file>`. */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

const UploadIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V3" />
    <path d="m7 8 5-5 5 5" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  </svg>
);

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const types = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (types.length === 0) return true;
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return types.some((t) => {
    if (t.startsWith(".")) return name.endsWith(t);
    if (t.endsWith("/*")) return mime.startsWith(t.slice(0, -1));
    return mime === t;
  });
}

/**
 * Dropzone — drag files onto it or click to open the picker. Emits accepted
 * files via `onFiles` and anything filtered out by `accept`/`maxSize` via
 * `onReject`. Purely presentational about the *result* — render your own file
 * list from what `onFiles` hands you.
 */
export const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(
  function Dropzone(
    {
      onFiles,
      onReject,
      accept,
      multiple = true,
      maxSize,
      disabled,
      title = "Drop files here, or click to browse",
      hint,
      icon,
      inputProps,
      className,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const sc = useSilicaClass();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const dragDepth = React.useRef(0);
    const [dragging, setDragging] = React.useState(false);

    const process = (fileList: FileList | null) => {
      if (!fileList || disabled) return;
      const accepted: File[] = [];
      const rejected: DropzoneRejection[] = [];
      for (const file of Array.from(fileList)) {
        if (!matchesAccept(file, accept)) {
          rejected.push({ file, reason: "type" });
        } else if (maxSize != null && file.size > maxSize) {
          rejected.push({ file, reason: "size" });
        } else {
          accepted.push(file);
        }
      }
      const finalAccepted = multiple ? accepted : accepted.slice(0, 1);
      if (finalAccepted.length) onFiles?.(finalAccepted);
      if (rejected.length) onReject?.(rejected);
    };

    const openPicker = () => {
      if (!disabled) inputRef.current?.click();
    };

    return (
      <div
        ref={forwardedRef}
        className={cx(sc("dropzone"), className)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        data-dragging={dragging || undefined}
        data-disabled={disabled || undefined}
        onClick={(e) => {
          // The programmatic input.click() bubbles back here — ignore it.
          if (e.target === inputRef.current) return;
          openPicker();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (disabled) return;
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (disabled) return;
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (disabled) return;
          dragDepth.current = 0;
          setDragging(false);
          process(e.dataTransfer.files);
        }}
        {...rest}
      >
        <input
          ref={inputRef}
          type="file"
          className={cx(sc("dropzone-input"))}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          {...inputProps}
          onChange={(e) => {
            process(e.target.files);
            // Allow re-selecting the same file.
            e.target.value = "";
            inputProps?.onChange?.(e);
          }}
        />
        {children ?? (
          <>
            <span className={cx(sc("dropzone-icon"))}>{icon ?? UploadIcon}</span>
            <span className={cx(sc("dropzone-title"))}>{title}</span>
            {hint && <span className={cx(sc("dropzone-hint"))}>{hint}</span>}
          </>
        )}
      </div>
    );
  },
);
