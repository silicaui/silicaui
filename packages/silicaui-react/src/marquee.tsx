import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

/**
 * Mark a duplicated copy `inert` — set on the node, not passed as a prop,
 * because neither spelling of the prop survives both supported React majors:
 * React 18's types don't know `inert` and drop `inert={true}` as a non-boolean
 * attribute, while React 19 knows it as a boolean and drops `inert=""`. One
 * `toggleAttribute` behaves identically on both, with no version sniffing and
 * no console warning. (Server-rendered markup therefore carries `aria-hidden`
 * but not `inert` until hydration — the duplicates are announced correctly the
 * whole time, they're just briefly tabbable on a cold SSR paint.)
 */
const markInert = (el: HTMLDivElement | null): void => {
  // Braced, not a concise arrow: React 19 reads a ref callback's return value
  // as a cleanup function, so leaking `toggleAttribute`'s boolean out of here
  // is a type error (and would be a runtime bug if it weren't).
  el?.toggleAttribute("inert", true);
};

export type MarqueeDirection = "left" | "right" | "up" | "down";
export type MarqueeSpeed = "slow" | "normal" | "fast";

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Travel direction. `left` (default) and `right` are horizontal; `up`/`down`
   *  are vertical and need a height on the marquee or its parent. */
  direction?: MarqueeDirection;
  /** Loop speed — `slow` 80s, `normal` (default) 40s, `fast` 20s per cycle.
   *  For anything else set `--marquee-duration` via `style`. */
  speed?: MarqueeSpeed;
  /** Freeze the strip while the pointer is over it, or while something inside
   *  it has keyboard focus. Default `true`. */
  pauseOnHover?: boolean;
  /** Soften both ends so items dissolve rather than getting guillotined at the
   *  edge. Default `true`; width is `--marquee-fade` (4rem). */
  fade?: boolean;
  /** How many times the content is repeated to build the loop, 2–6. Two is
   *  enough whenever one pass already overflows the container; raise it when it
   *  doesn't (three short logos in a wide strip) rather than padding the list
   *  by hand. Default `2`. */
  repeat?: 2 | 3 | 4 | 5 | 6;
}

/**
 * Silica Marquee — an infinitely-looping ticker.
 *
 *   <Marquee>{logos}</Marquee>
 *   <Marquee direction="right" speed="slow">{quotes}</Marquee>
 *   <Marquee direction="up" className="h-80">{cards}</Marquee>
 *
 * The children are rendered `repeat` times so the loop has something to hand
 * over to at the seam; every copy after the first is `aria-hidden`, so a screen
 * reader hears the list once. Motion is CSS-only and collapses to a plain
 * scroller under `prefers-reduced-motion`.
 */
export const Marquee = React.forwardRef<HTMLDivElement, MarqueeProps>(
  function Marquee(
    {
      direction = "left",
      speed = "normal",
      pauseOnHover = true,
      fade = true,
      repeat = 2,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const sc = useSilicaClass();
    const vertical = direction === "up" || direction === "down";
    // `left`/`up` run the keyframe forwards; `right`/`down` are the same
    // keyframe reversed, so there's one animation, not four.
    const reverse = direction === "right" || direction === "down";
    const copies = Math.min(6, Math.max(2, Math.floor(repeat)));

    return (
      <div
        ref={ref}
        className={cx(
          sc("marquee"),
          vertical && sc("marquee-vertical"),
          reverse && sc("marquee-reverse"),
          sc(`marquee-${speed}`),
          sc(`marquee-copies-${copies}`),
          fade && sc("marquee-fade"),
          pauseOnHover && sc("marquee-pause-on-hover"),
          className,
        )}
        style={style}
        {...rest}
      >
        <div className={cx(sc("marquee-track"))}>
          {Array.from({ length: copies }, (_, i) => (
            // Every copy past the first is scenery: same pixels, out of both
            // the accessibility tree AND the tab order. `aria-hidden` alone
            // isn't enough — a link in copy #2 is the same link, and tabbing
            // into an announced-as-nothing duplicate is a real trap.
            <div
              key={i}
              className={cx(sc("marquee-group"))}
              aria-hidden={i > 0 || undefined}
              ref={i > 0 ? markInert : undefined}
            >
              {children}
            </div>
          ))}
        </div>
      </div>
    );
  },
);
