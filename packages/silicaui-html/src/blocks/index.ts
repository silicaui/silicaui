/**
 * The blocks index (architecture spec §6.5) — `silicaui-html/blocks`.
 *
 * A validated catalog of composed patterns, with lookup + filtering and a
 * tree-free summary for lightweight listings and a host's palette.
 */
import type { Template } from "../schema";
import { heroSplitCta } from "./hero-split-cta";
import { faqAccordion } from "./faq-accordion";
import { featureGrid } from "./feature-grid";

const ALL: Template[] = [heroSplitCta, faqAccordion, featureGrid];
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

export { heroSplitCta, faqAccordion, featureGrid };
