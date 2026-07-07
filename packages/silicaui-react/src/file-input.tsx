import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type FileInputSize = "sm" | "md" | "lg";

export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  size?: FileInputSize;
}

/**
 * Silica FileInput — a styled `<input type="file">`.
 *
 *   <FileInput onChange={(e) => setFile(e.target.files?.[0])} />
 *   <FileInput accept="image/*" multiple size="lg" />
 */
export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  function FileInput({ size, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <input
        ref={ref}
        type="file"
        className={cx(
          sc("file-input"),
          size && size !== "md" && sc(`file-input-${size}`),
          className,
        )}
        {...rest}
      />
    );
  },
);
