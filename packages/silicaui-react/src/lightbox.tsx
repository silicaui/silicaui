import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { usePortalContainer } from "./portal-container";

export interface LightboxItem {
  src: string;
  alt?: string;
  caption?: React.ReactNode;
}

export interface LightboxProps {
  items: LightboxItem[];
  /** Controlled open index; `null` (or `undefined` while uncontrolled) is closed. */
  index?: number | null;
  defaultIndex?: number | null;
  onIndexChange?: (index: number | null) => void;
  /** Wrap past the first/last item with the nav arrows. Default `true`. */
  loop?: boolean;
  className?: string;
}

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

/**
 * Silica Lightbox — a full-viewport image viewer for a gallery. Not a trigger
 * itself: render your own thumbnails and drive `index` (controlled or
 * uncontrolled) from their click handlers. Left/Right arrow keys navigate;
 * Escape and the backdrop close it (Base UI Dialog underneath).
 *
 *   const [index, setIndex] = useState<number | null>(null);
 *   <div className="grid grid-cols-4 gap-2">
 *     {photos.map((p, i) => (
 *       <button key={p.src} onClick={() => setIndex(i)}><img src={p.src} /></button>
 *     ))}
 *   </div>
 *   <Lightbox items={photos} index={index} onIndexChange={setIndex} />
 */
export function Lightbox({
  items,
  index,
  defaultIndex = null,
  onIndexChange,
  loop = true,
  className,
}: LightboxProps) {
  const sc = useSilicaClass();
  const portalContainer = usePortalContainer();
  const isControlled = index !== undefined;
  const [internal, setInternal] = React.useState<number | null>(defaultIndex);
  const current = isControlled ? index : internal;

  function setIndex(next: number | null) {
    if (!isControlled) setInternal(next);
    onIndexChange?.(next);
  }

  function go(delta: number) {
    if (current == null || items.length === 0) return;
    let next = current + delta;
    if (loop) next = (next + items.length) % items.length;
    else next = Math.max(0, Math.min(items.length - 1, next));
    setIndex(next);
  }

  const open = current != null;
  const item = current != null ? items[current] : undefined;
  const hasPrev = loop || (current != null && current > 0);
  const hasNext = loop || (current != null && current < items.length - 1);

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setIndex(null);
      }}
    >
      <BaseDialog.Portal container={portalContainer}>
        <BaseDialog.Backdrop className={cx(sc("lightbox-backdrop"))} />
        <BaseDialog.Popup
          aria-label="Image viewer"
          className={cx(sc("lightbox-popup"), className)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              go(-1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              go(1);
            }
          }}
          onClick={(e) => {
            // The popup fills the viewport (to center images of any size), so
            // Base UI's own outside-press never fires — treat a click that
            // lands directly on the popup (not the image/buttons/caption) as
            // "clicked the empty scrim" and close it ourselves.
            if (e.target === e.currentTarget) setIndex(null);
          }}
        >
          {item && (
            <>
              <span className={cx(sc("lightbox-counter"))}>
                {(current ?? 0) + 1} / {items.length}
              </span>
              <BaseDialog.Close className={cx(sc("lightbox-close"))} aria-label="Close">
                <XIcon />
              </BaseDialog.Close>

              {items.length > 1 && (
                <button
                  type="button"
                  className={cx(sc("lightbox-nav"), sc("lightbox-nav-prev"))}
                  aria-label="Previous image"
                  disabled={!hasPrev}
                  onClick={() => go(-1)}
                >
                  <ChevronLeftIcon />
                </button>
              )}

              <img src={item.src} alt={item.alt ?? ""} className={cx(sc("lightbox-image"))} />

              {items.length > 1 && (
                <button
                  type="button"
                  className={cx(sc("lightbox-nav"), sc("lightbox-nav-next"))}
                  aria-label="Next image"
                  disabled={!hasNext}
                  onClick={() => go(1)}
                >
                  <ChevronRightIcon />
                </button>
              )}

              {item.caption && (
                <div className={cx(sc("lightbox-caption"))}>{item.caption}</div>
              )}
            </>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
