"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered reveal.
 *
 * Deliberately built from a class toggle plus Tailwind's own transition
 * utilities rather than a keyframe in globals.css — it needs no bespoke CSS
 * and no animation dependency.
 *
 * Two things it must get right, both of which are accessibility rather than
 * polish:
 *
 *  - It starts VISIBLE and only hides itself once the observer is attached.
 *    Rendering `opacity-0` in the static HTML would mean a crawler, a reader
 *    with JS disabled, or anyone whose bundle fails to load gets a blank page.
 *    The content is the product here; it may never depend on JS to be read.
 *  - `prefers-reduced-motion` skips the animation entirely rather than merely
 *    shortening it.
 */
export function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(true);
      return;
    }

    // Only now is it safe to hide: JS is running, so JS can reveal it again.
    setArmed(true);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const hidden = armed && !shown;

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        hidden ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {children}
    </div>
  );
}
