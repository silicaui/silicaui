// The migration ledger, built from the two trees rather than from memory.
//
// Every daisyUI class the BEFORE app used, and what is in its place after.
//
// Two counts in the first version were wrong and both flattered the result:
// it matched every two-space-indented capitalised line as a "silicaui component"
// and so counted the app's own screen exports and its data constants, turning 47
// into 58; and it counted total lines, so the migration notes written at every
// non-drop-in call site read as code the migration added.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const read = (side) =>
  ["App.tsx", "screens.tsx"].map((f) => readFileSync(`${ROOT}/${side}/src/${f}`, "utf8")).join("\n");
const before = read("before");
const after = read("after");

const FAMILIES =
  "btn card table input select checkbox toggle badge modal alert stats stat join tabs tab breadcrumbs divider textarea label form-control loading drawer tooltip progress avatar navbar menu hero steps footer link range radio dropdown collapse kbd mask indicator chat carousel countdown diff dock fieldset filter list status swap timeline validator".split(
    " ",
  );

function componentClasses(src) {
  const found = new Map();
  const re = /className=[{"`]([^"`}]*)/g;
  let m;
  while ((m = re.exec(src))) {
    for (const cls of m[1].split(/\s+/)) {
      const base = cls.replace(/^(sm|md|lg|xl|max-lg):/, "");
      const fam = FAMILIES.find((f) => base === f || base.startsWith(f + "-"));
      if (fam) found.set(base, (found.get(base) ?? 0) + 1);
    }
  }
  return found;
}

const b = componentClasses(before);
const a = componentClasses(after);
const familiesOf = (map) =>
  new Set([...map.keys()].map((c) => FAMILIES.find((f) => c === f || c.startsWith(f + "-"))));

const imported = [
  ...after.matchAll(/import \{([^}]*)\} from "@wizeworks\/silicaui-react";/g),
]
  .flatMap((m) => m[1].split(",").map((x) => x.trim()))
  .filter(Boolean);
const uniqueImported = [...new Set(imported)].sort();

const codeLines = (src) =>
  src
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !l.startsWith("//") &&
        !l.startsWith("*") &&
        !l.startsWith("/*") &&
        !l.startsWith("{/*"),
    ).length;

console.log(`BEFORE  ${b.size} distinct daisyUI classes across ${familiesOf(b).size} component families`);
console.log(`AFTER   ${a.size} component classes still written by hand, in ${familiesOf(a).size} family`);
console.log("");
console.log(`the migration removed ${[...b.keys()].filter((c) => !a.has(c)).length} of the ${b.size} by name`);
console.log("what is left, and it is Silica's own, on a deliberately native control:");
for (const c of [...a.keys()].sort()) console.log(`   .${c}  x${a.get(c)}`);
console.log("");
console.log(`silicaui components imported: ${uniqueImported.length}`);
console.log("  " + uniqueImported.join(", "));
console.log("");
console.log(`lines of CODE       before ${codeLines(before)}   after ${codeLines(after)}`);
console.log(
  `lines with comments before ${before.split("\n").length}   after ${after.split("\n").length}` +
    "   <- the difference is the migration notes",
);
