/**
 * The blocks index (architecture spec §6.5) — `@wizeworks/silicaui-html/blocks`.
 *
 * A validated catalog of composed patterns, with lookup + filtering and a
 * tree-free summary for lightweight listings and a host's palette.
 */
import type { Template } from "../schema";
import { heroSplitCta } from "./hero-split-cta";
import { faqAccordion } from "./faq-accordion";
import { featureGrid } from "./feature-grid";
import { navbar } from "./navbar";
import { footer } from "./footer";
import { ctaBand } from "./cta-band";
import { testimonialQuote } from "./testimonial-quote";
import { testimonialsGrid } from "./testimonials-grid";
import { pricingTiers } from "./pricing-tiers";
import { statsBand } from "./stats-band";
import { logoCloud } from "./logo-cloud";
import { teamGrid } from "./team-grid";
import { contactSection } from "./contact-section";
import { contentProse } from "./content-prose";
import { featureMedia } from "./feature-media";
import { tabs } from "./tabs";
import { accordion } from "./accordion";
import { dropdown } from "./dropdown";

// Registration order = palette order. Grouped: chrome, hero/feature, social proof,
// pricing/stats, content/contact — a natural top-to-bottom page-building flow.
const ALL: Template[] = [
  navbar,
  heroSplitCta,
  featureGrid,
  featureMedia,
  logoCloud,
  statsBand,
  testimonialQuote,
  testimonialsGrid,
  pricingTiers,
  faqAccordion,
  contentProse,
  teamGrid,
  contactSection,
  ctaBand,
  footer,
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
  heroSplitCta,
  faqAccordion,
  featureGrid,
  navbar,
  footer,
  ctaBand,
  testimonialQuote,
  testimonialsGrid,
  pricingTiers,
  statsBand,
  logoCloud,
  teamGrid,
  contactSection,
  contentProse,
  featureMedia,
  tabs,
  accordion,
  dropdown,
};
