/**
 * schema.org / JSON-LD builders. Structured data is the single biggest lever
 * for answer engines (ChatGPT, Perplexity, Claude, Google AI Overviews): it
 * hands them machine-readable, unambiguous facts instead of asking them to
 * infer meaning from prose. Every builder here is a pure function returning a
 * plain object; `<JsonLd>` serializes it into the page.
 *
 * All @id values are absolute URLs so nodes can be referenced across pages and
 * merged into one graph by a consumer.
 */
import {
  AUTHOR,
  GITHUB_URL,
  NPM_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  url,
} from "./site";

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;
const APP_ID = `${SITE_URL}/#software`;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: url("/icon.svg"),
    sameAs: [GITHUB_URL, NPM_URL],
    parentOrganization: { "@type": "Organization", name: AUTHOR },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

/**
 * The library itself, described both as a SoftwareApplication (so it can
 * surface as "a developer tool named SilicaUI") and via SoftwareSourceCode
 * facts (language, license, repo). Free, open-source, browser-targeted.
 */
export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": APP_ID,
    name: SITE_NAME,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "UI component library",
    operatingSystem: "Web browser",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    downloadUrl: NPM_URL,
    codeRepository: GITHUB_URL,
    programmingLanguage: ["TypeScript", "CSS"],
    softwareRequirements: "React 19+, or any HTML environment",
    license: "https://opensource.org/licenses/MIT",
    isAccessibleForFree: true,
    author: { "@id": ORG_ID },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: url(c.path),
    })),
  };
}

/**
 * One component doc page. TechArticle carries the human-readable "what is this"
 * that an answer engine quotes; it points back at the library's
 * SoftwareApplication node and the site.
 */
export function componentSchema(opts: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${opts.title} — SilicaUI component`,
    name: opts.title,
    description: opts.description,
    url: url(opts.path),
    isPartOf: { "@id": SITE_ID },
    about: { "@id": APP_ID },
    inLanguage: "en",
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

/**
 * FAQPage — one of the highest-leverage schema types for answer engines and
 * Google's FAQ rich results: it hands them clean question/answer pairs to quote
 * verbatim. The same `items` render as the visible accordion, so the structured
 * data can never disagree with the page.
 */
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

/** A CollectionPage listing every component — the /docs index. */
export function collectionSchema(opts: {
  name: string;
  description: string;
  path: string;
  items: { title: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: url(opts.path),
    isPartOf: { "@id": SITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.title,
        url: url(it.path),
      })),
    },
  };
}
