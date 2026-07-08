import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { Dropzone, type DropzoneProps, type DropzoneRejection } from "./dropzone";

export type FileUploadRejection = DropzoneRejection;

export interface FileUploadProps
  extends Omit<DropzoneProps, "onFiles" | "onReject" | "children" | "defaultValue"> {
  /** Controlled file list. */
  value?: File[];
  /** Uncontrolled initial file list. */
  defaultValue?: File[];
  /** Fires with the full accepted-file list whenever it changes (add or remove). */
  onFilesChange?: (files: File[]) => void;
  /** Fires with anything filtered out by `accept`/`maxSize`. */
  onReject?: (rejections: FileUploadRejection[]) => void;
  /** Render an `<img>` thumbnail for image files instead of a generic icon. Default `true`. */
  previewImages?: boolean;
  /** Show rejected-file reasons below the dropzone. Default `true`. */
  showRejections?: boolean;
}

const FileIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

const RemoveIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * FileUpload — a `Dropzone` plus a managed preview list. `Dropzone` alone is
 * purely presentational about the *result*; this owns the accepted-file list
 * (controlled or uncontrolled), renders image thumbnails / generic icons +
 * name + size, and a per-file remove button.
 *
 *   <FileUpload
 *     accept="image/*,.pdf"
 *     maxSize={5 * 1024 * 1024}
 *     onFilesChange={setFiles}
 *     onReject={(r) => toast.add({ title: `${r.length} file(s) rejected` })}
 *   />
 */
export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  function FileUpload(
    {
      value,
      defaultValue,
      onFilesChange,
      onReject,
      previewImages = true,
      showRejections = true,
      multiple = true,
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const sc = useSilicaClass();
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<File[]>(defaultValue ?? []);
    const files = isControlled ? value : internal;
    const [rejections, setRejections] = React.useState<DropzoneRejection[]>([]);
    const urlsRef = React.useRef(new Map<string, string>());

    const commit = (next: File[]) => {
      if (!isControlled) setInternal(next);
      onFilesChange?.(next);
    };

    const handleFiles = (accepted: File[]) => {
      setRejections([]);
      commit(multiple ? [...files, ...accepted] : accepted.slice(0, 1));
    };

    const handleReject = (rejected: DropzoneRejection[]) => {
      setRejections(rejected);
      onReject?.(rejected);
    };

    const remove = (key: string) => {
      commit(files.filter((f) => fileKey(f) !== key));
    };

    const previewUrl = (file: File): string | undefined => {
      if (!previewImages || !file.type.startsWith("image/")) return undefined;
      const key = fileKey(file);
      let url = urlsRef.current.get(key);
      if (!url) {
        url = URL.createObjectURL(file);
        urlsRef.current.set(key, url);
      }
      return url;
    };

    // Revoke object URLs for files that have been removed.
    React.useEffect(() => {
      const urls = urlsRef.current;
      const liveKeys = new Set(files.map(fileKey));
      for (const [key, url] of urls) {
        if (!liveKeys.has(key)) {
          URL.revokeObjectURL(url);
          urls.delete(key);
        }
      }
    }, [files]);

    // Revoke everything on unmount.
    React.useEffect(() => {
      const urls = urlsRef.current;
      return () => {
        for (const url of urls.values()) URL.revokeObjectURL(url);
      };
    }, []);

    return (
      <div ref={forwardedRef} className={cx(sc("file-upload"), className)}>
        <Dropzone multiple={multiple} onFiles={handleFiles} onReject={handleReject} {...rest} />

        {showRejections && rejections.length > 0 && (
          <div className={cx(sc("file-upload-rejections"))}>
            {rejections.map((r) => (
              <span key={fileKey(r.file)}>
                {r.file.name} — {r.reason === "size" ? "too large" : "unsupported type"}
              </span>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <ul className={cx(sc("file-upload-list"))}>
            {files.map((file) => {
              const key = fileKey(file);
              const url = previewUrl(file);
              return (
                <li key={key} className={cx(sc("file-upload-item"))}>
                  {url ? (
                    <img src={url} alt="" className={cx(sc("file-upload-item-thumb"))} />
                  ) : (
                    <span className={cx(sc("file-upload-item-icon"))}>{FileIcon}</span>
                  )}
                  <span className={cx(sc("file-upload-item-meta"))}>
                    <span className={cx(sc("file-upload-item-name"))}>{file.name}</span>
                    <span className={cx(sc("file-upload-item-size"))}>
                      {formatBytes(file.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={cx(sc("file-upload-item-remove"))}
                    aria-label={`Remove ${file.name}`}
                    onClick={() => remove(key)}
                  >
                    {RemoveIcon}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  },
);
