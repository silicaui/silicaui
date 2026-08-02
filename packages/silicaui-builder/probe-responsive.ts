/**
 * Per-breakpoint class authoring (doc 139 §1) — the token surgery and the
 * container guarantee. No React: the key mapping is trivial, the cascade is not.
 *
 * What this exists to catch: a wrong answer here is INVISIBLE. Writing
 * `@3xl:grid-cols-2` when the group already carries `grid-cols-1` at base looks
 * right in the class string and renders right at tablet — and quietly wrong if
 * the write clobbered the base instead of adding beside it. Same for the
 * container guarantee: a container variant with no container ancestor compiles,
 * ships, and does nothing.
 */
import { Editor } from "./src/site/engine";
import {
  BREAKPOINT_ORDER,
  declaredBreakpoints,
  declaresContainer,
  setTokenAt,
  splitToken,
  tokenStateAt,
} from "./src/site/class-tokens";
import { el, lintTree, stampTree } from "@wizeworks/silicaui-html";
import type { Node, Theme } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${!cond && detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

const theme: Theme = { name: "test", tokens: {} };
const COLS = ["grid-cols-1", "grid-cols-2", "grid-cols-3"];

// ── the pure token layer ─────────────────────────────────────────────────────
console.log("setTokenAt");
{
  check("sets at base", setTokenAt("p-4", COLS, "grid-cols-2") === "p-4 grid-cols-2");
  check("sets at a breakpoint", setTokenAt("p-4", COLS, "grid-cols-2", "@3xl:") === "p-4 @3xl:grid-cols-2");
  check(
    "replaces within the SAME breakpoint only",
    setTokenAt("grid-cols-1 @3xl:grid-cols-2", COLS, "grid-cols-3", "@3xl:") === "grid-cols-1 @3xl:grid-cols-3",
  );
  check(
    "...and leaves the base alone — the whole point",
    setTokenAt("grid-cols-1 @3xl:grid-cols-2", COLS, "grid-cols-3", "@3xl:").includes("grid-cols-1 "),
  );
  check(
    "setting base leaves the breakpoint alone too",
    setTokenAt("grid-cols-1 @3xl:grid-cols-2", COLS, "grid-cols-3") === "@3xl:grid-cols-2 grid-cols-3",
  );
  check("clears at a breakpoint", setTokenAt("grid-cols-1 @3xl:grid-cols-2", COLS, "", "@3xl:") === "grid-cols-1");
  check("clearing a breakpoint never touches base", setTokenAt("grid-cols-1 @3xl:grid-cols-2", COLS, "", "@3xl:") === "grid-cols-1");
  check("unrelated tokens survive untouched", setTokenAt("flex p-4 text-primary", COLS, "grid-cols-2", "@5xl:") === "flex p-4 text-primary @5xl:grid-cols-2");
  check("a no-op write is idempotent", setTokenAt("@3xl:grid-cols-2", COLS, "grid-cols-2", "@3xl:") === "@3xl:grid-cols-2");
  check("empty class string is fine", setTokenAt(undefined, COLS, "grid-cols-2", "@3xl:") === "@3xl:grid-cols-2");
  check(
    "a STACKED variant is not mistaken for a bare one",
    splitToken("hover:@3xl:underline")[0] === "hover:@3xl:" && splitToken("hover:@3xl:underline")[1] === "underline",
  );
  check(
    "...so writing @3xl: leaves hover:@3xl: alone",
    setTokenAt("hover:grid-cols-2", COLS, "grid-cols-3", "").includes("hover:grid-cols-2"),
  );
}

// ── a numeric group owns its whole SCALE, not just the steps it lists ────────
// The bug this locks: sparx's starter hero is authored `px-6 py-20`, the Padding
// Y control offers 0…16, and picking 16 produced `py-20 py-16` — both classes
// shipped, `py-20` won in Tailwind's source order, and the control looked dead.
console.log("\nsetTokenAt — scale ownership");
{
  const PAD_Y = ["py-0", "py-2", "py-4", "py-8", "py-16"];
  check(
    "a step the control doesn't list is REPLACED, not appended",
    setTokenAt("bg-base-100 px-6 py-20 text-center", PAD_Y, "py-8") === "bg-base-100 px-6 text-center py-8",
    setTokenAt("bg-base-100 px-6 py-20 text-center", PAD_Y, "py-8"),
  );
  check("an arbitrary value is owned too", setTokenAt("py-[3.5rem]", PAD_Y, "py-8") === "py-8");
  check("...as is the px hairline", setTokenAt("py-px", PAD_Y, "py-8") === "py-8");
  check("Auto clears an unlisted step as well", setTokenAt("px-6 py-20", PAD_Y, "") === "px-6");
  check("the OTHER axis is untouched", setTokenAt("px-20 py-20", PAD_Y, "py-8") === "px-20 py-8");
  check("...and so is the shorthand (a different head)", setTokenAt("p-20 py-20", PAD_Y, "py-8") === "p-20 py-8");
  check("ownership is per-breakpoint like everything else", setTokenAt("py-20 @3xl:py-24", PAD_Y, "py-8") === "@3xl:py-24 py-8");
  check("tokenStateAt reports the unlisted step rather than claiming unset", tokenStateAt("py-20", PAD_Y, "").value === "py-20");
  check("...and declaredBreakpoints announces it", JSON.stringify(declaredBreakpoints("py-20 @3xl:py-24", PAD_Y)) === JSON.stringify(["", "@3xl:"]));

  // The counter-case, and the reason ownership is derived from a NUMERIC scale
  // rather than from a shared prefix: a group of NAMED values keeps membership
  // semantics, or picking an alignment would strip the node's size and color.
  const ALIGN = ["text-left", "text-center", "text-right"];
  check(
    "a NAMED group owns only its members",
    setTokenAt("text-4xl text-primary text-left", ALIGN, "text-center") === "text-4xl text-primary text-center",
    setTokenAt("text-4xl text-primary text-left", ALIGN, "text-center"),
  );
  const FLEX_CHILD = ["flex-1", "grow", "flex-none"];
  check("a MIXED group owns only its members", setTokenAt("flex-col flex-1", FLEX_CHILD, "grow") === "flex-col grow");
  check("...so `flex-col` is never mistaken for a scale step", !setTokenAt("flex-col flex-1", FLEX_CHILD, "grow").includes("flex-1"));
  // Every other numeric group gets the same fix for free — that's the point of
  // deriving it instead of hand-listing padding.
  check("gap owns its scale too", setTokenAt("gap-12", ["gap-0", "gap-4", "gap-8"], "gap-4") === "gap-4");
  check("grid-cols owns its scale too", setTokenAt("grid-cols-12", COLS, "grid-cols-3") === "grid-cols-3");
}

console.log("\ntokenStateAt — the mobile-first cascade");
{
  const cls = "grid-cols-1 @3xl:grid-cols-2";
  check("base reports its own", tokenStateAt(cls, COLS, "").value === "grid-cols-1");
  check("...as NOT inherited", tokenStateAt(cls, COLS, "").inherited === false);
  check("@3xl reports its own", tokenStateAt(cls, COLS, "@3xl:").value === "grid-cols-2");
  check("...also not inherited", tokenStateAt(cls, COLS, "@3xl:").inherited === false);
  const at5 = tokenStateAt(cls, COLS, "@5xl:");
  check("@5xl INHERITS from @3xl (the nearest below)", at5.value === "grid-cols-2" && at5.inherited === true);
  check("...and says where from", at5.setAt === "@3xl:");
  const baseOnly = tokenStateAt("grid-cols-1", COLS, "@5xl:");
  check("with only a base value, a large breakpoint inherits base", baseOnly.value === "grid-cols-1" && baseOnly.setAt === "");
  const unset = tokenStateAt("p-4", COLS, "@3xl:");
  check("an unset group reports empty, not inherited", unset.value === "" && unset.setAt === undefined && unset.inherited === false);
  check("inheritance never runs UPWARD", tokenStateAt("@5xl:grid-cols-3", COLS, "@3xl:").value === "");
  check("the ladder is ascending with base first", BREAKPOINT_ORDER[0] === "" && BREAKPOINT_ORDER.indexOf("@3xl:") < BREAKPOINT_ORDER.indexOf("@5xl:"));
}

console.log("\ndeclaredBreakpoints");
{
  const cls = "@5xl:grid-cols-3 grid-cols-1 @3xl:grid-cols-2";
  check("lists every breakpoint that declares the group, ascending", JSON.stringify(declaredBreakpoints(cls, COLS)) === JSON.stringify(["", "@3xl:", "@5xl:"]));
  check("empty when unset", declaredBreakpoints("p-4", COLS).length === 0);
}

console.log("\ndeclaresContainer");
{
  check("bare @container", declaresContainer("p-4 @container"));
  check("named @container/sidebar", declaresContainer("@container/sidebar"));
  check("not a container variant", !declaresContainer("@3xl:grid-cols-2"));
  check("nothing", !declaresContainer("flex p-4"));
}

// ── the engine seam ──────────────────────────────────────────────────────────
function find(root: Node, pred: (n: Node) => boolean): Node | undefined {
  const stack: Node[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (pred(n)) return n;
    if (n.kind !== "outlet") for (const c of n.children ?? []) if (typeof c !== "string") stack.push(c);
  }
  return undefined;
}
const idOf = (n: Node | undefined): string | undefined => (n && n.kind !== "outlet" ? n.id : undefined);

function freshEditor(rootClass = "page"): Editor {
  const root = stampTree(
    el("div", rootClass, {
      children: [el("section", "hero", { children: [el("div", "grid", { children: [el("p", "cell", { text: "x" })] })] })],
    }),
  );
  return new Editor({ version: "1", root, theme });
}
const byClass = (ed: Editor, cls: string): string =>
  idOf(find(ed.extract().root, (n) => n.kind !== "outlet" && (n.class ?? "").split(/\s+/).includes(cls)))!;
const classOf = (ed: Editor, id: string): string => {
  const n = ed.node(id);
  return n && n.kind !== "outlet" ? (n.class ?? "") : "";
};

console.log("\nEditor.setClassToken");
{
  const ed = freshEditor();
  const grid = byClass(ed, "grid");
  ed.setClassToken(grid, COLS, "grid-cols-1");
  ed.setClassToken(grid, COLS, "grid-cols-3", "@5xl:");
  const cls = classOf(ed, grid);
  check("base and breakpoint coexist", cls.includes("grid-cols-1") && cls.includes("@5xl:grid-cols-3"), cls);
  check("read at base sees base", ed.classTokenAt(grid, COLS, "").value === "grid-cols-1");
  check("read at @5xl sees its own", ed.classTokenAt(grid, COLS, "@5xl:").value === "grid-cols-3");
  check("read at @3xl inherits base", ed.classTokenAt(grid, COLS, "@3xl:").value === "grid-cols-1");
  check("...and reports it as inherited", ed.classTokenAt(grid, COLS, "@3xl:").inherited === true);
  check("classTokenBreakpoints lists both", JSON.stringify(ed.classTokenBreakpoints(grid, COLS)) === JSON.stringify(["", "@5xl:"]));
}
{
  // One undo per gesture, including the container that rode along with it.
  const ed = freshEditor();
  const grid = byClass(ed, "grid");
  ed.setClassToken(grid, COLS, "grid-cols-2", "@3xl:");
  ed.undo();
  check("ONE undo reverses the token AND the container it added", !classOf(ed, grid).includes("@3xl:") && !ed.canUndo);
}
{
  const ed = freshEditor();
  const grid = byClass(ed, "grid");
  const before = classOf(ed, grid);
  ed.setClassToken(grid, COLS, "", "@3xl:"); // clearing an unset group
  check("a no-op write emits no history step", classOf(ed, grid) === before && !ed.canUndo);
}

console.log("\nthe container guarantee");
{
  const ed = freshEditor();
  const grid = byClass(ed, "grid");
  const rootId = idOf(ed.extract().root)!;
  check("no container to start with", !declaresContainer(classOf(ed, rootId)));
  ed.setClassToken(grid, COLS, "grid-cols-2", "@3xl:");
  check("writing a container variant adds @container to the TREE ROOT", declaresContainer(classOf(ed, rootId)), classOf(ed, rootId));
  check("...not to the node's parent, which would measure the wrong box", !declaresContainer(classOf(ed, byClass(ed, "hero"))));
  check("...and not to the node itself", !declaresContainer(classOf(ed, grid)));
}
{
  const ed = freshEditor();
  const grid = byClass(ed, "grid");
  ed.setClassToken(grid, COLS, "grid-cols-2", "@3xl:");
  const rootCls = classOf(ed, byClass(ed, "page"));
  ed.setClassToken(grid, COLS, "grid-cols-3", "@5xl:");
  check("it's idempotent — a second variant doesn't add a second @container", classOf(ed, byClass(ed, "page")) === rootCls);
}
{
  // A block that declares its own container (every shipped block does, on its
  // <section>) already satisfies the guarantee — don't add a redundant one.
  const ed = freshEditor();
  const hero = byClass(ed, "hero");
  ed.setClass(hero, "hero @container");
  const rootId = idOf(ed.extract().root)!;
  ed.setClassToken(byClass(ed, "grid"), COLS, "grid-cols-2", "@3xl:");
  check("an existing @container ancestor is respected", !declaresContainer(classOf(ed, rootId)));
}
{
  const ed = freshEditor();
  const rootId = idOf(ed.extract().root)!;
  ed.setClassToken(byClass(ed, "grid"), COLS, "grid-cols-2");
  check("a BASE write adds no container — there's no query to satisfy", !declaresContainer(classOf(ed, rootId)));
}
{
  const ed = freshEditor();
  const rootId = idOf(ed.extract().root)!;
  ed.setClassToken(byClass(ed, "grid"), COLS, "", "@3xl:");
  check("CLEARING at a breakpoint adds no container either", !declaresContainer(classOf(ed, rootId)));
}

// ── what the whole thing is for ──────────────────────────────────────────────
console.log("\nend to end: one grid, three sizes");
{
  const ed = freshEditor();
  const grid = byClass(ed, "grid");
  ed.setClassToken(grid, COLS, "grid-cols-1", ""); // mobile
  ed.setClassToken(grid, COLS, "grid-cols-2", "@3xl:"); // tablet
  ed.setClassToken(grid, COLS, "grid-cols-3", "@5xl:"); // desktop
  const cls = classOf(ed, grid);
  check("all three survive together", ["grid-cols-1", "@3xl:grid-cols-2", "@5xl:grid-cols-3"].every((c) => cls.split(/\s+/).includes(c)), cls);
  check("...with no viewport variant anywhere", !/\b(sm|md|lg|xl|2xl):/.test(cls), cls);

  // Changing the middle one leaves the other two exactly as they were.
  ed.setClassToken(grid, COLS, "grid-cols-4", "@3xl:");
  const after = classOf(ed, grid).split(/\s+/);
  check("editing one size touches only that size", after.includes("grid-cols-1") && after.includes("@3xl:grid-cols-4") && after.includes("@5xl:grid-cols-3"), classOf(ed, grid));
}

// ── viewport variants are rejected by DEFAULT, and the default is liftable ───
console.log("\nthe viewport-variant policy (doc 139 §2)");
{
  const ed = freshEditor();
  const grid = byClass(ed, "grid");
  const rejected = ed.setClass(grid, "grid md:grid-cols-2");
  check("a viewport variant is refused by default", rejected.ok === false);
  check("...with a reason naming the container equivalent", !rejected.ok && rejected.reason.includes("@md:"), !rejected.ok ? rejected.reason : "");
  check("...and the node is untouched", !classOf(ed, grid).includes("md:grid-cols-2"));
  check("the CONTAINER equivalent is accepted", ed.setClass(grid, "grid @md:grid-cols-2").ok === true);
  check("...and `@container` itself is never mistaken for a variant", ed.setClass(grid, "grid @container").ok === true);
}
{
  // It's a policy, not the floor: a host whose output IS viewport-sized can lift it.
  const root = stampTree(el("div", "page", { children: [el("div", "grid", {})] }));
  const ed = new Editor({ version: "1", root, theme }, { viewportVariants: "allow" });
  const grid = byClass(ed, "grid");
  check("a host can allow viewport variants", ed.setClass(grid, "grid md:grid-cols-2").ok === true);
  // …but never the security floor, which is the whole point of the distinction.
  const banned = ed.setClass(grid, "grid fixed");
  check("...and STILL cannot lift the security floor", banned.ok === false, "`fixed` got through");
}
{
  // A host validator and the viewport policy compose — both add rejections.
  const root = stampTree(el("div", "page", { children: [el("div", "grid", {})] }));
  const ed = new Editor(
    { version: "1", root, theme },
    { validateClass: (cls) => (cls.includes("bg-red-500") ? { ok: false, reason: "host says no" } : { ok: true }) },
  );
  const grid = byClass(ed, "grid");
  check("the host's own rule still applies", ed.setClass(grid, "bg-red-500").ok === false);
  check("...alongside the viewport default", ed.setClass(grid, "md:flex").ok === false);
  check("...and an ordinary class still passes both", ed.setClass(grid, "flex gap-4").ok === true);
}

// ── lintTree: the check a host validator provably cannot do ──────────────────
console.log("\nlintTree — orphaned container queries");
{
  const orphan = el("div", "page", { children: [el("div", "@3xl:grid-cols-2", {})] });
  const issues = lintTree(orphan);
  check("an orphaned container query is reported", issues.length === 1 && issues[0]!.rule === "orphan-container-query");
  check("...as a WARNING (it's inert, not dangerous)", issues[0]!.level === "warn");
  check("...naming the offending class", issues[0]!.message.includes("@3xl:grid-cols-2"));

  const wrapped = el("div", "page @container", { children: [el("div", "@3xl:grid-cols-2", {})] });
  check("a container ancestor clears it", lintTree(wrapped).length === 0);

  const named = el("div", "page @container/main", { children: [el("div", "@3xl:grid-cols-2", {})] });
  check("a NAMED container counts too", lintTree(named).length === 0);

  const deep = el("div", "@container", { children: [el("div", "x", { children: [el("p", "@5xl:text-lg", {})] })] });
  check("the container may be any ancestor, not just the parent", lintTree(deep).length === 0);

  // The classic version of this bug: the container and the query on ONE node. A
  // container query measures the nearest container ANCESTOR — never itself.
  const selfish = el("div", "page", { children: [el("div", "@container @3xl:grid-cols-2", {})] });
  check("a node's own @container does NOT satisfy its own query", lintTree(selfish).length === 1);

  check("no container variants, no warnings", lintTree(el("div", "flex gap-4", { children: [el("p", "text-lg", {})] })).length === 0);
  check("`@container` alone is never reported as a query", lintTree(el("div", "@container", {})).length === 0);
}
{
  // And the editor's own writes never produce one — the guarantee and the lint
  // agree, which is the only way the warning stays meaningful.
  const ed = freshEditor();
  ed.setClassToken(byClass(ed, "grid"), COLS, "grid-cols-2", "@3xl:");
  check("a tree authored through setClassToken lints clean", lintTree(ed.extract().root).length === 0, JSON.stringify(lintTree(ed.extract().root)));
}

console.log(failures === 0 ? "\nALL RESPONSIVE PROBES PASSED" : `\n${failures} RESPONSIVE PROBE(S) FAILED`);
if (failures) process.exit(1);
