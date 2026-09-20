/**
 * Can the projection express TEXT DIRECTION and LANGUAGE?
 *
 * It could not. `dir`, `lang` and `translate` were absent from `GLOBAL_ATTRS`
 * and `<bdi>`/`<bdo>` were absent from `RAW_ELEMENTS`, so every one of them was
 * stripped — `dir="auto"` dropped, `lang="ar"` dropped, `<bdi>` downgraded to
 * `<div>`. A document mixing Arabic and French inside one heading had no correct
 * markup available, and the failure is not a blank: the text renders, with its
 * neutral characters (the slash, the em-dash, the punctuation at a script
 * boundary) placed on the wrong side by the bidi algorithm's paragraph default.
 *
 * Found by P08, a documentation engineer publishing a heritage guide in Arabic,
 * French and English — docs/personas/issues/035.
 *
 * The second half of this file matters as much as the first: these four are
 * allowed because they are INERT metadata, so the probe also pins the things
 * that must stay blocked. A widening that also let `style` or `on*` through
 * would pass the first half and fail here.
 */
import { toHtml } from "./dist/index.js";

let failures = 0;
const check = (name, cond, detail) => {
  if (!cond) {
    failures++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const MIXED = "Chellah / شالة — nécropole mérinide";
const withAttr = (attrs) => toHtml({ kind: "element", tag: "p", attrs, children: [MIXED] });
const asTag = (tag, attrs) => toHtml({ kind: "element", tag, attrs, children: ["شالة"] });

// ── must be expressible ─────────────────────────────────────────────────────
for (const [attr, value] of [
  ["dir", "auto"],
  ["dir", "rtl"],
  ["dir", "ltr"],
  ["lang", "ar"],
  ["lang", "fr-MA"],
  ["translate", "no"],
]) {
  const out = withAttr({ [attr]: value });
  check(`${attr}="${value}" survives`, out.includes(`${attr}="${value}"`), out.slice(0, 90));
}

check("<bdi> renders as itself", asTag("bdi") === "<bdi>شالة</bdi>", asTag("bdi"));
check(
  "<bdo dir> renders as itself",
  asTag("bdo", { dir: "rtl" }) === '<bdo dir="rtl">شالة</bdo>',
  asTag("bdo", { dir: "rtl" }),
);

// The mixed string itself must survive byte-for-byte — no normalisation, no
// escaping of the Arabic, no mangling of the em-dash.
const plain = toHtml({ kind: "element", tag: "h1", children: [MIXED] });
check("mixed-script text is passed through unchanged", plain === `<h1>${MIXED}</h1>`, plain);

// ── must stay blocked ───────────────────────────────────────────────────────
for (const bad of ["style", "onclick", "onload", "srcdoc", "formaction"]) {
  const out = withAttr({ [bad]: "x" });
  check(`${bad} is still dropped`, !out.includes(`${bad}=`), out.slice(0, 90));
}
for (const tag of ["script", "iframe", "object", "embed", "style", "base"]) {
  const out = toHtml({ kind: "element", tag, children: ["x"] });
  check(`<${tag}> is still downgraded`, out.startsWith("<div"), out.slice(0, 60));
}

if (failures) {
  console.log(`\n❌ i18n floor: ${failures} check(s) failed`);
  process.exit(1);
}
console.log("✅ i18n floor: direction and language are expressible, and nothing unsafe opened with them");
