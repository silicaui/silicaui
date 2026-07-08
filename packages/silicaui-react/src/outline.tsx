import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface OutlineItem {
  /** The heading element's `id` — both scroll target and observed section. */
  id: string;
  label: React.ReactNode;
  /** Indent level (0 = top-level, e.g. an h2; 1 = a nested h3; …). Default 0. */
  depth?: number;
}

export interface OutlineProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items: OutlineItem[];
  /**
   * Distance in px from the scroll container's top edge that counts as the
   * "active" boundary — a heading is current once it's scrolled to here.
   * Default 96 (roughly a sticky header's height).
   */
  offset?: number;
  /** Scrollable ancestor to track. Default: the window (a real full-page TOC). */
  container?: React.RefObject<HTMLElement | null>;
  onActiveChange?: (id: string | null) => void;
}

/**
 * Silica Outline — a scroll-spy table of contents, built from scratch (no
 * IntersectionObserver ambiguity — a heading is "active" once its top has
 * scrolled past `offset`, the last such heading in document order wins).
 *
 *   <Outline
 *     items={[{ id: "install", label: "Installation" }, { id: "usage", label: "Usage", depth: 1 }]}
 *   />
 */
export const Outline = React.forwardRef<HTMLElement, OutlineProps>(
  function Outline({ items, offset = 96, container, onActiveChange, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const [activeId, setActiveId] = React.useState<string | null>(items[0]?.id ?? null);
    const itemsKey = items.map((item) => item.id).join("|");

    React.useEffect(() => {
      const target: Window | HTMLElement = container?.current ?? window;
      let ticking = false;

      const recompute = () => {
        ticking = false;
        // `offset` is measured from the scroll container's own top edge, not
        // the viewport's — matters once `container` isn't the window (a
        // nested scroll pane can sit anywhere on the page).
        const containerTop = target instanceof HTMLElement ? target.getBoundingClientRect().top : 0;
        let current: string | null = null;
        for (const item of items) {
          const el = document.getElementById(item.id);
          if (!el) continue;
          if (el.getBoundingClientRect().top - containerTop - offset <= 0) {
            current = item.id;
          }
        }
        if (!current && items.length > 0) current = items[0]?.id ?? null;
        setActiveId((prev) => {
          if (prev !== current) onActiveChange?.(current);
          return current;
        });
      };

      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(recompute);
      };

      recompute();
      target.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => {
        target.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsKey, offset, container]);

    return (
      <nav ref={ref} aria-label="On this page" className={cx(sc("outline"), className)} {...rest}>
        <ul className={cx(sc("outline-list"))}>
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cx(sc("outline-link"))}
                data-active={item.id === activeId || undefined}
                style={{ paddingInlineStart: `calc(0.85rem + ${item.depth ?? 0} * 0.85rem)` }}
                onClick={(event) => {
                  const el = document.getElementById(item.id);
                  if (el) {
                    event.preventDefault();
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  },
);
