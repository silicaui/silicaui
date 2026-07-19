import { DEMO_META } from "@wizeworks/silicaui-demos/meta";
import {
  ClosingCta,
  Ecosystem,
  Hero,
  Pillars,
  PropsSection,
  SiteFooter,
  SiteNav,
} from "@/components/landing/sections";

/**
 * The landing page is built from silicaui-react components directly rather
 * than the `stamp() → toHtml()` blocks pipeline the other marketing routes
 * use. That's deliberate, not a shortcut: this is a *component library*, so
 * the homepage has to let a visitor actually operate the components — a
 * library whose homepage contains no interactive components is arguing
 * against itself. Static export still prerenders all of this to real HTML at
 * build time, so the SEO/AEO requirement is unaffected.
 *
 * The blocks pipeline is still exercised by /about, which is the surface it
 * genuinely fits (schema-driven marketing sections).
 */
export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <Pillars />
        <PropsSection />
        <Ecosystem componentCount={DEMO_META.length} />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
