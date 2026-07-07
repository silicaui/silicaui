import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type HeroProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Silica Hero — a full-width banner that centers its content.
 *
 *   <Hero style={{ backgroundImage: `url(${img})` }}>
 *     <HeroOverlay />
 *     <HeroContent className="text-neutral-content text-center">
 *       <div>
 *         <h1 className="text-5xl font-bold">Ship faster</h1>
 *         <p>…</p>
 *         <Button color="primary">Get started</Button>
 *       </div>
 *     </HeroContent>
 *   </Hero>
 *
 * Set a background image via the `style` prop; add `<HeroOverlay />` to tint it.
 */
export const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  function Hero({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("hero"), className)} {...rest} />;
  },
);

export const HeroContent = React.forwardRef<HTMLDivElement, HeroProps>(
  function HeroContent({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("hero-content"), className)} {...rest} />;
  },
);

/** A translucent dark layer that tints the hero's background image. */
export const HeroOverlay = React.forwardRef<HTMLDivElement, HeroProps>(
  function HeroOverlay({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("hero-overlay"), className)} {...rest} />;
  },
);
