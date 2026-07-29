// Runnable proof that a HOST-supplied `DataSource` catalog cannot hang or crash
// the editor (builder-contract.md §5). Run against the built output:
// `pnpm --filter @wizeworks/silicaui-html build && node verify-data-sources.mjs`.
//
// Both walkers here were unbounded and both were reachable from ordinary host
// data. The regression this pins down is a STALL, not a wrong answer, so every
// check below is wall-clock-bounded as well as value-asserted — a fix that
// returns the right list in 8 seconds is still the bug.
import {
  scopeAt,
  findSource,
  flattenSources,
  truncationMessage,
  MAX_SOURCE_DEPTH,
  MAX_SOURCE_OPTIONS,
} from "./dist/index.js";

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}
/** Assert `fn` both returns something usable AND returns FAST. */
function within(name, ms, fn) {
  const t0 = process.hrtime.bigint();
  let out, threw;
  try {
    out = fn();
  } catch (e) {
    threw = e;
  }
  const took = Number(process.hrtime.bigint() - t0) / 1e6;
  if (threw) {
    check(`${name} — did not throw (${threw.constructor.name}: ${threw.message})`, false);
    return undefined;
  }
  check(`${name} — returned in ${took.toFixed(0)}ms (budget ${ms}ms)`, took < ms);
  return out;
}

const scalar = (k, label = k) => ({ key: k, label, cardinality: "scalar" });

// ── 1. the ordinary case still behaves ───────────────────────────────────────
console.log("a well-formed catalog flattens exactly as before");
{
  const sources = [
    scalar("siteName", "Site name"),
    {
      key: "products",
      label: "Products",
      cardinality: "array",
      fields: [scalar("title", "Title"), scalar("price", "Price")],
    },
  ];
  const { options, truncated } = flattenSources(sources);
  check("nothing reported as dropped", truncated.length === 0);
  check("scalars at every level, deepest-first path labels", JSON.stringify(options.map((o) => o.label)) === JSON.stringify(["Site name", "Products > Title", "Products > Price"]));
  check("value is the opaque key, never the path", options[1].value === "title");
  check("findSource reaches a nested key", findSource(sources, "price")?.label === "Price");
  check("findSource misses honestly", findSource(sources, "nope") === undefined);
  check("scopeAt narrows to an ancestor collection's fields", scopeAt(sources, [{ kind: "element", tag: "div", data: { kind: "collection", ref: "products" } }]).length === 2);
}

// ── 2. a CYCLE — the stack-overflow case ─────────────────────────────────────
// The ordinary shape of a CMS schema with a back-reference. This overflowed the
// stack in ~3ms, thrown mid-render, which surfaced as the whole editor tripping
// its error boundary rather than as anything identifiably about data binding.
console.log("a self-referential catalog terminates instead of overflowing");
{
  const post = { key: "post", label: "Post", cardinality: "array", fields: [scalar("title", "Title")] };
  const author = { key: "author", label: "Author", cardinality: "object", fields: [scalar("name", "Name")] };
  post.fields = [...post.fields, author];
  author.fields = [...author.fields, post];
  const sources = [post];

  const flat = within("flattenSources(cyclic)", 250, () => flattenSources(sources));
  check("reports the cycle rather than silently truncating", flat.truncated.includes("cycle"));
  check("still yields the real fields it could reach", flat.options.some((o) => o.value === "title") && flat.options.some((o) => o.value === "name"));
  check("truncationMessage names it in a sentence an author can act on", /refers back to itself/.test(truncationMessage(flat.truncated)));

  within("findSource(cyclic, present key)", 250, () => findSource(sources, "name"));
  check("findSource still finds through a cycle", findSource(sources, "name")?.label === "Name");
  const miss = within("findSource(cyclic, absent key)", 250, () => findSource(sources, "nope"));
  check("findSource returns undefined on a cyclic miss", miss === undefined);
}

// ── 3. SHARING WITHOUT A CYCLE — the exponential case ────────────────────────
// The subtler hazard, and the one needing no cycle at all: content types that
// embed the same sub-shapes are finite and small to author, exponential in
// paths. Measured before the fix: 51 distinct sources -> 1.86M options (779ms);
// 55 -> 16.7M (7.7s), each destined to become a real <option> element.
console.log("a shared-subshape DAG is bounded, not exponential");
{
  const dag = (depth, fanout) => {
    let level = [scalar("id"), scalar("slug"), scalar("title")];
    for (let d = 0; d < depth; d++) {
      const kids = level; // the SAME array instance under every sibling
      level = Array.from({ length: fanout }, (_, i) => ({
        key: `t${d}_${i}`,
        label: `Type${d}_${i}`,
        cardinality: "object",
        fields: kids,
      }));
      level = [...level, scalar(`f${d}`)];
    }
    return level;
  };

  for (const [depth, fanout] of [
    [10, 3],
    [14, 3],
    [20, 4],
  ]) {
    const flat = within(`flattenSources(depth=${depth},fanout=${fanout})`, 250, () => flattenSources(dag(depth, fanout)));
    check(`  never exceeds the ${MAX_SOURCE_OPTIONS}-option ceiling (got ${flat.options.length})`, flat.options.length <= MAX_SOURCE_OPTIONS);
    check("  says the list is incomplete", flat.truncated.length > 0);
  }

  // The cap is a bound on WORK, not a slice of work already done: if it were
  // `.slice(0, N)` the 20-deep case above could not have come in under budget.
  const deep = flattenSources(dag(20, 4));
  check("truncationMessage points at the raw-reference escape hatch", /Type the reference directly/.test(truncationMessage(deep.truncated)));
}

// ── 4. the depth guard ───────────────────────────────────────────────────────
console.log("a single deep chain stops at the depth ceiling");
{
  let node = scalar("leaf", "Leaf");
  for (let d = 0; d < MAX_SOURCE_DEPTH + 4; d++) {
    node = { key: `n${d}`, label: `N${d}`, cardinality: "object", fields: [node] };
  }
  const flat = flattenSources([node]);
  check("reports depth truncation", flat.truncated.includes("depth"));
  check("no option is labelled past the ceiling", flat.options.every((o) => o.label.split(" > ").length <= MAX_SOURCE_DEPTH + 1));
  check("a complete list reports NOTHING (empty array, not undefined)", Array.isArray(flattenSources([scalar("a")]).truncated) && flattenSources([scalar("a")]).truncated.length === 0);
  check("truncationMessage is undefined when nothing was dropped", truncationMessage([]) === undefined);
}

console.log(failures === 0 ? "\nall data-source guards hold" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
