/**
 * Page links are addresses (sparx persona issue 054).
 *
 * A bare slug is a relative link ("contact" from /blog/a-post goes to
 * /blog/contact), a record template is not a place, and the "links to this page"
 * count must see "/contact" as a link to the page whose slug is "contact".
 */
import { Editor } from "./src/site/engine";
import { isTemplateSlug, linksToPage, pageHref } from "./src/site/page-href";
import { el } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

console.log("pageHref");
check("a bare slug becomes an address", pageHref("contact") === "/contact");
check("a slashed slug stays one", pageHref("/contact") === "/contact");
check("Home's empty slug is the root", pageHref("") === "/");
check("a trailing slash is dropped", pageHref("about/") === "/about");

console.log("isTemplateSlug");
check("a record template is not a place", isTemplateSlug("/products/:handle"));
check("an ordinary page is", !isTemplateSlug("contact"));

console.log("linksToPage");
check("/contact links to slug contact", linksToPage("/contact", "contact"));
check("contact links to slug /contact", linksToPage("contact", "/contact"));
check("a query or anchor still counts", linksToPage("/contact?ref=nav#form", "contact"));
check("/ links to Home", linksToPage("/", ""));
check("an outside site does not", !linksToPage("https://example.com/contact", "contact"));
check("a protocol-relative link does not", !linksToPage("//example.com/contact", "contact"));
check("an anchor alone does not", !linksToPage("#contact", "contact"));
check("a mail link does not", !linksToPage("mailto:a@b.test", "contact"));
check("another page does not", !linksToPage("/contact-us", "contact"));

console.log("Editor.linksTo");
const ed = new Editor({
  version: "1",
  pages: [
    {
      id: "home",
      name: "Home",
      slug: "",
      root: el("div", "", { children: [el("a", "", { attrs: { href: "/contact" }, text: "Contact us" })] }),
    },
    { id: "contact", name: "Contact", slug: "contact", root: el("div", "", {}) },
  ],
  theme: { name: "test", tokens: {} },
} as unknown as ConstructorParameters<typeof Editor>[0]);
check("counts a /contact link for the page whose slug is contact", ed.linksTo("contact", "contact") === 1);

console.log(failures === 0 ? "\nALL PAGE-HREF PROBES PASSED" : `\n${failures} PAGE-HREF PROBE(S) FAILED`);
if (failures) process.exit(1);
