/**
 * The blocks index (architecture spec §6.5) — `@wizeworks/silicaui-html/blocks`.
 *
 * A validated catalog of composed patterns, with lookup + filtering and a
 * tree-free summary for lightweight listings and a host's palette.
 */
import type { Template } from "../schema";
import { navbar } from "./navbar";
import { navbarCenterLinks } from "./navbar-center-links";
import { navbarCenterLogo } from "./navbar-center-logo";
import { navbarMegaMenu } from "./navbar-mega-menu";
import { navbarFloatingPill } from "./navbar-floating-pill";
import { heroSplitCta } from "./hero-split-cta";
import { heroCentered } from "./hero-centered";
import { heroSpotlight } from "./hero-spotlight";
import { heroSignup } from "./hero-signup";
import { heroStatement } from "./hero-statement";
import { featureGrid } from "./feature-grid";
import { featureMedia } from "./feature-media";
import { featureAlternating } from "./feature-alternating";
import { featureBento } from "./feature-bento";
import { featureChecklist } from "./feature-checklist";
import { logoCloud } from "./logo-cloud";
import { statsBand } from "./stats-band";
import { testimonialQuote } from "./testimonial-quote";
import { testimonialsGrid } from "./testimonials-grid";
import { testimonialCarousel } from "./testimonial-carousel";
import { testimonialLogos } from "./testimonial-logos";
import { testimonialPortrait } from "./testimonial-portrait";
import { pricingTiers } from "./pricing-tiers";
import { pricingToggle } from "./pricing-toggle";
import { pricingDuo } from "./pricing-duo";
import { pricingSingle } from "./pricing-single";
import { pricingTable } from "./pricing-table";
import { faqAccordion } from "./faq-accordion";
import { contentProse } from "./content-prose";
import { teamGrid } from "./team-grid";
import { contactSection } from "./contact-section";
import { ctaBand } from "./cta-band";
import { ctaSplit } from "./cta-split";
import { ctaCard } from "./cta-card";
import { ctaSignup } from "./cta-signup";
import { ctaInline } from "./cta-inline";
import { footer } from "./footer";
import { footerMinimal } from "./footer-minimal";
import { footerNewsletter } from "./footer-newsletter";
import { footerClosingCta } from "./footer-closing-cta";
import { footerSitemap } from "./footer-sitemap";
import { tabs } from "./tabs";
import { accordion } from "./accordion";
import { dropdown } from "./dropdown";

// Registration order = palette order: chrome, opener, what-it-does, proof,
// price, answers, close, chrome again — a natural top-to-bottom page-building
// flow, so scrolling the palette is roughly scrolling the page you're building.
//
// EVERY FAMILY IS CONTIGUOUS, and that is load-bearing rather than tidy. Each
// block's `name` is the palette label verbatim (see `blockItem` in the builder's
// palette.ts), so a family reads as ONE set of choices — `Navbar — Brand Left`,
// `Navbar — Center Links`, … — only when its members sit together. Split them up
// and the palette looks like twenty-five unrelated rows that happen to rhyme.
//
// Within a family the order is by how much the layout asks of the author: the
// one that needs only copy first, then media, then a working form, then the
// specialist. `verify.mjs` pins the count of each five-strong family, so adding
// a sixth is a deliberate edit in two places rather than a drift in one.
const ALL: Template[] = [
  // Chrome — the header.
  navbar,
  navbarCenterLinks,
  navbarCenterLogo,
  navbarMegaMenu,
  navbarFloatingPill,
  // The opener.
  heroSplitCta,
  heroCentered,
  heroSpotlight,
  heroSignup,
  heroStatement,
  // What it does.
  featureGrid,
  featureMedia,
  featureAlternating,
  featureBento,
  featureChecklist,
  // Proof.
  logoCloud,
  statsBand,
  testimonialQuote,
  testimonialsGrid,
  testimonialCarousel,
  testimonialLogos,
  testimonialPortrait,
  // Price.
  pricingTiers,
  pricingToggle,
  pricingDuo,
  pricingSingle,
  pricingTable,
  // Answers and context.
  faqAccordion,
  contentProse,
  teamGrid,
  contactSection,
  // The close.
  ctaBand,
  ctaSplit,
  ctaCard,
  ctaSignup,
  ctaInline,
  // Chrome — the footer.
  footer,
  footerMinimal,
  footerNewsletter,
  footerClosingCta,
  footerSitemap,
  // Interactive composites — behavior-driven building blocks (not marketing
  // sections). Fully-editable trees carrying behavior markers the runtime drives.
  tabs,
  accordion,
  dropdown,
];
const BY_KEY: ReadonlyMap<string, Template> = new Map(
  ALL.map((b) => [b.key, b] as const),
);

export interface BlockFilter {
  category?: string;
  tag?: string;
}

/** All blocks, optionally filtered by category and/or tag. */
export function listBlocks(filter?: BlockFilter): Template[] {
  return ALL.filter(
    (b) =>
      (!filter?.category || b.category === filter.category) &&
      (!filter?.tag || (b.tags ?? []).includes(filter.tag)),
  );
}

/** Look up one block by its stable key. */
export function getBlock(key: string): Template | undefined {
  return BY_KEY.get(key);
}

/** The manifest without the tree — for palettes and listings. */
export function catalogSummary(b: Template): Omit<Template, "root"> {
  const { root: _root, ...rest } = b;
  return rest;
}

export {
  navbar,
  navbarCenterLinks,
  navbarCenterLogo,
  navbarMegaMenu,
  navbarFloatingPill,
  heroSplitCta,
  heroCentered,
  heroSpotlight,
  heroSignup,
  heroStatement,
  featureGrid,
  featureMedia,
  featureAlternating,
  featureBento,
  featureChecklist,
  logoCloud,
  statsBand,
  testimonialQuote,
  testimonialsGrid,
  testimonialCarousel,
  testimonialLogos,
  testimonialPortrait,
  pricingTiers,
  pricingToggle,
  pricingDuo,
  pricingSingle,
  pricingTable,
  faqAccordion,
  contentProse,
  teamGrid,
  contactSection,
  ctaBand,
  ctaSplit,
  ctaCard,
  ctaSignup,
  ctaInline,
  footer,
  footerMinimal,
  footerNewsletter,
  footerClosingCta,
  footerSitemap,
  tabs,
  accordion,
  dropdown,
};
