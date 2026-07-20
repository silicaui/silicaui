/**
 * Isolated proof for FRACTIONAL SIBLING ORDERING (`Node.ord`) — no React, no DOM.
 *
 * Two halves. First the key generator in isolation: keys sort where they were
 * asked to, and the awkward cases (adjacent digits, long shared prefixes, a
 * thousand head-inserts) stay strictly ordered instead of colliding or
 * degenerating. Then the engine: every structural path assigns a key consistent
 * with the array it produced, replacements in place keep their slot, and the
 * keys never reach published output.
 *
 * The property that matters: array order and key order must agree everywhere,
 * always. The array is what renders locally; the keys are what merge remotely.
 * If they ever disagree, a collaborator's tree silently differs from the
 * author's — which is the failure this whole mechanism exists to prevent.
 */
import { Editor } from "./src/site/engine";
import { assignOrds, el, generateKeyBetween, ordAt, stampTree, stripOrds } from "@wizeworks/silicaui-html";
import type { Child, Node, Theme } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${!cond && detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

const theme: Theme = { name: "test", tokens: {} };
const ordOf = (c: Child | undefined): string | undefined =>
  c && typeof c !== "string" && c.kind !== "outlet" ? c.ord : undefined;
const idOf = (n: Node | undefined): string | undefined => (n && n.kind !== "outlet" ? n.id : undefined);

function find(root: Node, pred: (n: Node) => boolean): Node | undefined {
  const stack: Node[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (pred(n)) return n;
    if (n.kind !== "outlet") for (const c of n.children ?? []) if (typeof c !== "string") stack.push(c);
  }
  return undefined;
}

// ── 1. the generator ─────────────────────────────────────────────────────────
console.log("generateKeyBetween places keys where asked");
{
  const first = generateKeyBetween(null, null);
  check("first key is non-empty", first.length > 0);
  const before = generateKeyBetween(null, first);
  const after = generateKeyBetween(first, null);
  check("prepend sorts below", before < first, `${before} !< ${first}`);
  check("append sorts above", after > first, `${after} !> ${first}`);
  const mid = generateKeyBetween(before, first);
  check("between sorts between", before < mid && mid < first, `${before} ${mid} ${first}`);
  // Every generated key must be legal INPUT to the generator — the round-trip
  // that keeps a long editing session from painting itself into a corner.
  // (A trailing "0" is illegal in the FRACTIONAL part only; the zero key "a0"
  // is a well-formed integer and must be accepted.)
  let rejected: string | null = null;
  for (const k of [first, before, after, mid]) {
    try {
      generateKeyBetween(k, null);
      generateKeyBetween(null, k);
    } catch {
      rejected = k;
    }
  }
  check("every generated key is valid input", rejected === null, `rejected ${rejected}`);
}
{
  // Adjacent digits force the borrow branch — the case a naive midpoint breaks on.
  let a = generateKeyBetween(null, null);
  let ok = true;
  for (let i = 0; i < 200 && ok; i++) {
    const next = generateKeyBetween(a, null);
    if (!(next > a)) ok = false;
    a = next;
  }
  check("200 successive appends stay ascending", ok);
  check("append key length stays bounded", a.length <= 6, `len ${a.length} (${a})`);
}
{
  // Repeated insertion into the SAME gap — the pathological case for any
  // fractional index, and the one that grows keys if the split is wrong.
  let lo = generateKeyBetween(null, null);
  const hi = generateKeyBetween(lo, null);
  let ok = true;
  let longest = 0;
  for (let i = 0; i < 500 && ok; i++) {
    const mid = generateKeyBetween(lo, hi);
    if (!(mid > lo && mid < hi)) ok = false;
    longest = Math.max(longest, mid.length);
    lo = mid;
  }
  check("500 inserts into one gap stay strictly between", ok);
  check("key growth is sub-linear", longest < 500 / 4, `longest ${longest}`);
}
{
  let ok = true;
  let head = generateKeyBetween(null, null);
  for (let i = 0; i < 300 && ok; i++) {
    const next = generateKeyBetween(null, head);
    if (!(next < head)) ok = false;
    head = next;
  }
  check("300 successive prepends stay descending", ok);
}
{
  let threw = false;
  try {
    generateKeyBetween("b", "a");
  } catch {
    threw = true;
  }
  check("a non-ascending pair is rejected, not silently mis-ordered", threw);
}

// ── 2. backfill preserves array order ────────────────────────────────────────
console.log("assignOrds backfills without moving anything");
{
  const tree = el("div", "", {
    children: [el("p", "", { text: "a" }), el("p", "", { text: "b" }), el("p", "", { text: "c" })],
  });
  assignOrds(tree);
  const ords = (tree.children ?? []).map(ordOf);
  check("every child got a key", ords.every((o) => typeof o === "string"));
  check("keys ascend with array order", ords[0]! < ords[1]! && ords[1]! < ords[2]!, JSON.stringify(ords));
}
{
  // A partially-keyed parent — the shape a merge or a hand edit can leave behind.
  const tree = el("div", "", {
    children: [el("p", "", { text: "a" }), el("p", "", { text: "b" }), el("p", "", { text: "c" })],
  });
  const kids = tree.children as Node[];
  const pinned = generateKeyBetween(null, null); // last child already keyed
  (kids[2] as { ord?: string }).ord = pinned;
  assignOrds(tree);
  const ords = (tree.children ?? []).map(ordOf);
  check("existing key is preserved", ords[2] === pinned, JSON.stringify(ords));
  check("backfilled keys thread BELOW it", ords[0]! < ords[1]! && ords[1]! < ords[2]!, JSON.stringify(ords));
}
{
  const tree = el("div", "", { children: [el("p", "", { text: "a" })] });
  assignOrds(tree);
  const once = ordOf(tree.children?.[0]);
  assignOrds(tree);
  check("assignOrds is idempotent", ordOf(tree.children?.[0]) === once);
}
{
  // Mixed bare text + element children: text can't carry a key and must not
  // break the elements around it.
  const tree: Node = { kind: "element", tag: "p", children: ["hello ", el("strong", "", { text: "world" }), "!"] };
  assignOrds(tree);
  check("text children are left alone", typeof (tree.children as Child[])[0] === "string");
  check("the element child still got a key", typeof ordOf((tree.children as Child[])[1]) === "string");
}

// ── 3. stampTree drops the root key, keys the children ───────────────────────
console.log("stampTree keys a fresh subtree");
{
  const stamped = stampTree(el("div", "", { children: [el("p", "", { text: "a" }), el("p", "", { text: "b" })] }));
  check("root has NO key (its slot isn't known yet)", ordOf(stamped) === undefined);
  const ords = (stamped.kind !== "outlet" ? stamped.children ?? [] : []).map(ordOf);
  check("children are keyed in order", ords[0]! < ords[1]!, JSON.stringify(ords));
}
{
  // A duplicate must not carry its source's key into a new slot.
  const src = stampTree(el("div", "", { children: [el("p", "", { text: "a" })] }));
  (src as { ord?: string }).ord = generateKeyBetween(null, null);
  check("stampTree drops an inherited root key", ordOf(stampTree(src)) === undefined);
}

// ── 4. the engine: array order and key order agree, always ───────────────────
function freshEditor(): Editor {
  const root = stampTree(
    el("div", "page", {
      children: [el("h1", "", { text: "One" }), el("h2", "", { text: "Two" }), el("h3", "", { text: "Three" })],
    }),
  );
  return new Editor({ version: "1", root, theme });
}
const pageId = (ed: Editor) => idOf(find(ed.extract().root, (n) => n.kind === "element" && n.class === "page"))!;
const kidsOf = (ed: Editor, id: string): Child[] => {
  const n = find(ed.extract().root, (x) => idOf(x) === id);
  return n && n.kind !== "outlet" ? n.children ?? [] : [];
};
/** The invariant: every keyed child's key is strictly above its predecessor's. */
function ascending(ed: Editor, parentId: string): boolean {
  const ords = kidsOf(ed, parentId).map(ordOf).filter((o): o is string => typeof o === "string");
  return ords.every((o, i) => i === 0 || ords[i - 1]! < o);
}
const textsOf = (ed: Editor, id: string): string[] =>
  kidsOf(ed, id).map((c) => (typeof c === "string" ? c : c.kind !== "outlet" ? String(c.children?.[0] ?? "") : ""));

console.log("engine keeps array order and key order in agreement");
{
  const ed = freshEditor();
  check("a loaded site is backfilled", ascending(ed, pageId(ed)));
  check("…and every child has a key", kidsOf(ed, pageId(ed)).every((c) => typeof ordOf(c) === "string"));
}
{
  const ed = freshEditor();
  const p = pageId(ed);
  ed.insert(el("p", "", { text: "head" }), p, 0);
  check("insert at head: keys ascend", ascending(ed, p));
  check("insert at head: array order is right", textsOf(ed, p)[0] === "head", JSON.stringify(textsOf(ed, p)));
  ed.insert(el("p", "", { text: "mid" }), p, 2);
  check("insert in middle: keys ascend", ascending(ed, p));
  check("insert in middle: array order is right", textsOf(ed, p)[2] === "mid", JSON.stringify(textsOf(ed, p)));
  ed.insert(el("p", "", { text: "tail" }), p);
  check("append: keys ascend", ascending(ed, p));
  check("append: array order is right", textsOf(ed, p).at(-1) === "tail", JSON.stringify(textsOf(ed, p)));
}
{
  const ed = freshEditor();
  const p = pageId(ed);
  const third = idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === "h3"))!;
  ed.move(third, p, 0);
  check("move to head: keys ascend", ascending(ed, p));
  check("move to head: array order is right", textsOf(ed, p)[0] === "Three", JSON.stringify(textsOf(ed, p)));
  ed.move(third, p, 2);
  check("same-parent move down: keys ascend", ascending(ed, p));
  check("same-parent move down: array order is right", textsOf(ed, p)[1] === "Three", JSON.stringify(textsOf(ed, p)));
}
{
  const ed = freshEditor();
  const p = pageId(ed);
  const second = idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === "h2"))!;
  ed.duplicate(second);
  check("duplicate: keys ascend", ascending(ed, p));
  check("duplicate lands right after its source", textsOf(ed, p)[2] === "Two", JSON.stringify(textsOf(ed, p)));
}
{
  // Long random walk — the real assurance. Any op sequence must leave the two
  // orders in agreement.
  const ed = freshEditor();
  const p = pageId(ed);
  let ok = true;
  for (let i = 0; i < 60 && ok; i++) {
    const kids = kidsOf(ed, p).filter((c): c is Node => typeof c !== "string");
    const at = i % (kids.length + 1);
    if (i % 3 === 2 && kids.length > 1) {
      const victim = idOf(kids[i % kids.length]);
      if (victim) ed.move(victim, p, at);
    } else {
      ed.insert(el("p", "", { text: `n${i}` }), p, at);
    }
    ok = ascending(ed, p);
  }
  check("60 mixed insert/move ops keep keys ascending", ok);
}

// ── 5. replacement in place keeps the slot ───────────────────────────────────
console.log("in-place replacement keeps its key");
{
  const ed = freshEditor();
  const p = pageId(ed);
  const second = idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === "h2"))!;
  const before = ordOf(kidsOf(ed, p)[1]);
  const sym = ed.createSymbol("Mid", second)!;
  check("createSymbol: instance inherits the slot key", ordOf(kidsOf(ed, p)[1]) === before, `${before} → ${ordOf(kidsOf(ed, p)[1])}`);
  check("createSymbol: keys still ascend", ascending(ed, p));

  const inst = idOf(find(ed.extract().root, (n) => n.kind !== "outlet" && n.instanceOf === sym))!;
  ed.detachInstance(inst);
  check("detachInstance: keeps the slot key", ordOf(kidsOf(ed, p)[1]) === before);
  check("detachInstance: keys still ascend", ascending(ed, p));
}
{
  const ed = freshEditor();
  const p = pageId(ed);
  const second = idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === "h2"))!;
  const before = ordOf(kidsOf(ed, p)[1]);
  const sym = ed.createSymbol("Mid", second)!;
  ed.deleteSymbol(sym); // cascade-detaches every instance
  check("deleteSymbol cascade: keeps the slot key", ordOf(kidsOf(ed, p)[1]) === before);
  check("deleteSymbol cascade: keys still ascend", ascending(ed, p));
}

// ── 6. keys survive undo/redo and never reach output ─────────────────────────
console.log("keys round-trip through history and are stripped at publish");
{
  const ed = freshEditor();
  const p = pageId(ed);
  ed.insert(el("p", "", { text: "x" }), p, 1);
  ed.undo();
  check("undo: keys still ascend", ascending(ed, p));
  ed.redo();
  check("redo: keys still ascend", ascending(ed, p));
}
{
  const ed = freshEditor();
  ed.insert(el("p", "", { text: "x" }), pageId(ed), 1);
  const exported = ed.exportSite();
  let leaked = 0;
  const scan = (n: Node): void => {
    if (n.kind === "outlet") return;
    if (n.ord !== undefined) leaked++;
    for (const c of n.children ?? []) if (typeof c !== "string") scan(c);
  };
  for (const pg of exported.pages) scan(pg.root);
  if (exported.frame) scan(exported.frame.root);
  check("exportSite strips every key", leaked === 0, `${leaked} leaked`);
  check("the live site still has them", ascending(ed, pageId(ed)));
}
{
  const nested = stampTree(el("div", "", { children: [el("p", "", { text: "a" })] }));
  const clean = stripOrds(nested);
  check("stripOrds is deep", ordOf((clean as { children?: Child[] }).children?.[0]) === undefined);
  check("stripOrds does not mutate its input", typeof ordOf((nested as { children?: Child[] }).children?.[0]) === "string");
}

// ── 7. ordAt brackets the slot it is given ───────────────────────────────────
console.log("ordAt brackets the requested slot");
{
  const kids: Child[] = [];
  const a = ordAt(kids, 0);
  kids.push({ kind: "element", tag: "p", ord: a });
  const b = ordAt(kids, 1);
  kids.push({ kind: "element", tag: "p", ord: b });
  const between = ordAt(kids, 1);
  check("ordAt(0) on empty works", typeof a === "string");
  check("ordAt(len) appends above", b > a);
  check("ordAt(1) lands between", between > a && between < b, `${a} ${between} ${b}`);
  const head = ordAt(kids, 0);
  check("ordAt(0) lands below the first", head < a, `${head} !< ${a}`);
  // Bare text neighbors are skipped, not treated as bounds.
  const withText: Child[] = ["lead ", { kind: "element", tag: "p", ord: a }];
  check("text neighbors are skipped", ordAt(withText, 1) < a);
}

console.log(failures === 0 ? "\nALL ORD PROBES PASSED" : `\n${failures} ORD PROBE(S) FAILED`);
if (failures) process.exit(1);
