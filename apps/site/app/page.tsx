import { atom, toHtml } from "@wizeworks/silicaui-html";
import { DEMO_META } from "@wizeworks/silicaui-demos/meta";
import {
  ClosingCta,
  Ecosystem,
  Hero,
  NoFramework,
  SiteFooter,
  SiteNav,
  StatsBand,
} from "@/components/landing/sections";
import {
  BehaviorGap,
  BrandColor,
  ContainerQueries,
  Showpieces,
  SizeVocabulary,
  TheWall,
} from "@/components/landing/story";

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

/**
 * The markup shown in the "no framework" section, generated at build time by
 * the real `toHtml()` rather than transcribed by hand. If the projection
 * changes, this sample changes with it — a hand-written sample would quietly
 * start lying instead.
 *
 * Line breaks are inserted between tags purely so it reads in a narrow column;
 * the tags, classes and attributes are verbatim.
 */
function generatedSwitchHtml(): string {
  const html = toHtml(atom("Switch", undefined, { color: "accent", defaultChecked: true }));
  return html.replace(/></g, ">\n<");
}

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        {/* Problem → proof, four times, then the claim no peer can make.
            Surfaces alternate base-100 / base-200 so the page has rhythm
            rather than one undifferentiated expanse. */}
        <TheWall />
        <BehaviorGap />
        <BrandColor />
        <Showpieces />
        <SizeVocabulary />
        <ContainerQueries />
        <NoFramework generatedHtml={generatedSwitchHtml()} />
        <StatsBand />
        <Ecosystem components={DEMO_META} />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
