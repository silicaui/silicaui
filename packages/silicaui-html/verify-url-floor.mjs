/**
 * The url half of the element floor: which `href`/`src` values survive
 * `sanitizeElement`, and which are dropped.
 *
 * Two things have to be true at once, and the previous implementation only
 * managed the second:
 *
 *  1. A SCHEMELESS url is relative and cannot leave the origin, so it is kept.
 *     `isSafeUrl`'s own comment said exactly that, but the code allow-listed
 *     `/`, `#`, `?` and `.` and dropped the rest — so `./photos/a.jpg` survived
 *     while `photos/a.jpg`, `chellah.html` and `entree/x/` were deleted. Those
 *     are the forms a static-site generator emits, and the failure was silent:
 *     an `<img>` with no `src`, an `<a>` that looks like a link and goes
 *     nowhere. Found by P08 — docs/personas/issues/034.
 *
 *  2. A DANGEROUS scheme is dropped, including when whitespace or control
 *     characters are hiding it. The url parser strips tab/LF/CR from anywhere
 *     in a url, so `java\nscript:alert(1)` is a `javascript:` url to a browser.
 *     The old code was safe here only by accident — it dropped everything it did
 *     not recognise — and widening rule 1 without handling this explicitly would
 *     have opened a real hole. That is why the control-character cases below
 *     matter more than the ordinary ones.
 */
import { toHtml } from "./dist/index.js";

const href = (v) => toHtml({ kind: "element", tag: "a", attrs: { href: v }, children: ["l"] });
const src = (v) => toHtml({ kind: "element", tag: "img", attrs: { src: v, alt: "x" } });

/** @type {[string, boolean, string][]} value, mustBeKept, why */
const CASES = [
  // Relative — the regression this file exists for.
  ["photos/chellah.jpg", true, "plain relative path"],
  ["chellah.html", true, "sibling file"],
  ["entree/chellah/", true, "relative directory"],
  ["assets/img/a.png", true, "nested relative"],
  ["photos/a:b.jpg", true, "a colon AFTER a path separator is not a scheme"],
  ["./photos/a.jpg", true, "dot-relative"],
  ["../photos/a.jpg", true, "parent-relative"],
  ["/photos/a.jpg", true, "rooted"],
  ["#hours", true, "fragment"],
  ["?q=1", true, "query"],
  // Schemes that are allowed.
  ["//cdn.example.org/a.jpg", true, "protocol-relative"],
  ["https://example.org/a", true, "https"],
  ["http://example.org/a", true, "http"],
  ["mailto:x@y.org", true, "mailto"],
  ["tel:+212537000000", true, "tel"],
  // Schemes that are not.
  ["javascript:alert(1)", false, "javascript"],
  ["JaVaScRiPt:alert(1)", false, "javascript, mixed case"],
  ["data:text/html,<script>alert(1)</script>", false, "data"],
  ["vbscript:msgbox(1)", false, "vbscript"],
  ["file:///etc/passwd", false, "file"],
  // RFC 3986 allows a single-letter scheme, so this is scheme `a:` and not a
  // relative path. Worth a row because it is the case that looks relative.
  ["a:b/c.jpg", false, "a single letter is a valid scheme"],
  // Empty resolves to the current document — a re-fetch and a broken image.
  ["", false, "empty"],
  // Whitespace and control characters hiding a scheme.
  [" javascript:alert(1)", false, "leading space"],
  ["\tjavascript:alert(1)", false, "leading tab"],
  ["\njavascript:alert(1)", false, "leading newline"],
  ["java\nscript:alert(1)", false, "newline inside the scheme"],
  ["java\tscript:alert(1)", false, "tab inside the scheme"],
  ["java\rscript:alert(1)", false, "carriage return inside the scheme"],
  ["\u0000javascript:alert(1)", false, "NUL prefix"],
  ["  \t\n  ", false, "whitespace only"],
];

let failures = 0;
for (const [value, want, why] of CASES) {
  for (const [attr, render] of [["href", href], ["src", src]]) {
    const got = render(value).includes(`${attr}=`);
    if (got !== want) {
      failures++;
      console.log(
        `  ✗ ${attr} ${JSON.stringify(value)} was ${got ? "KEPT" : "DROPPED"}, want ${want ? "KEPT" : "DROPPED"} — ${why}`,
      );
    }
  }
}

// `target="_blank"` must always carry rel, whatever was authored.
const blank = toHtml({
  kind: "element",
  tag: "a",
  attrs: { href: "https://example.org", target: "_blank", rel: "opener" },
  children: ["l"],
});
if (!blank.includes('rel="noopener noreferrer"')) {
  failures++;
  console.log(`  ✗ target="_blank" did not force rel=noopener noreferrer — ${blank}`);
}

if (failures) {
  console.log(`\n❌ url floor: ${failures} case(s) wrong`);
  process.exit(1);
}
console.log(`✅ url floor: ${CASES.length} values × 2 attributes, all correct`);
