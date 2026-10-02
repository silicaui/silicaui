/**
 * The address a page is reached at, from its slug.
 *
 * Slugs arrive in two spellings depending on who wrote them ("contact" and
 * "/contact"), and a link written from the bare one is RELATIVE: "contact" on a
 * page at /blog/a-post goes to /blog/contact. So every place that turns a page into
 * a link, or asks whether a link points at a page, goes through here. Home's empty
 * slug is "/".
 */
export function pageHref(slug: string): string {
  const trimmed = slug.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return `/${trimmed}`;
}

/** A template page that renders one record ("/products/:handle"): not a place a
 *  link can go, because the address has a hole in it. */
export function isTemplateSlug(slug: string): boolean {
  return slug.includes(":");
}

/**
 * Does this link point at this page? Compares addresses, not spellings, so a
 * "/contact" link counts for a page whose slug is "contact". An external link, an
 * anchor or a protocol link never does.
 */
export function linksToPage(href: unknown, slug: string): boolean {
  if (typeof href !== "string") return false;
  const value = href.trim();
  if (value === "" || value.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) {
    return false;
  }
  const path = value.split(/[?#]/)[0] ?? "";
  return pageHref(path) === pageHref(slug);
}
