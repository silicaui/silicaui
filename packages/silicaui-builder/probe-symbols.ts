/**
 * Isolated engine proof for symbols/instances (no React, no DOM). Drives the real
 * `Editor` through the full symbol lifecycle — save-as-component → propagate →
 * insert → edit-master → detach → delete → undo — and flattens for output, so the
 * whole mechanism is verified before any UI sits on top. Bundled with esbuild and
 * run under node (see the runner in the shell command).
 */
import { Editor } from "./src/engine";
import { el, stampTree, toHtml, walk } from "@wizeworks/silicaui-html";
import type { Node, Theme } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

const theme: Theme = { name: "test", tokens: {} };

/** Find the first node matching a predicate (depth-first). */
function find(root: Node, pred: (n: Node) => boolean): Node | undefined {
  let hit: Node | undefined;
  walk(root, (n) => {
    if (!hit && pred(n)) hit = n;
  });
  return hit;
}
function countInstances(root: Node, symId: string): number {
  let n = 0;
  walk(root, (x) => {
    if (x.kind !== "outlet" && x.instanceOf === symId) n++;
  });
  return n;
}
const idOf = (n: Node | undefined): string | undefined => (n && n.kind !== "outlet" ? n.id : undefined);

// A page: body div → [ section(card: h2 + button), footer p ]
function freshEditor(): Editor {
  const root = stampTree(
    el("div", "page", {
      children: [
        el("section", "card p-6", {
          children: [
            el("h2", "text-xl", { text: "Original title" }),
            el("button", "btn", { text: "Click" }),
          ],
        }),
        el("p", "foot", { text: "footer" }),
      ],
    }),
  );
  return new Editor({ version: "1", root, theme });
}

// ── 1. save-as-component replaces the node with an instance ──────────────────
console.log("createSymbol");
{
  const ed = freshEditor();
  const section = find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section")!;
  const symId = ed.createSymbol("Card", idOf(section))!;
  check("returns a symbol id", typeof symId === "string" && symId.length > 0);
  check("symbol roster now has 1", ed.symbols.length === 1 && ed.symbols[0]!.name === "Card");

  const page = ed.extract().root;
  check("the section is replaced by ONE instance", countInstances(page, symId) === 1);
  check("selection is the new instance", idOf(ed.selectedNode) === ed.selection && ed.selectedNode?.kind !== "outlet" && (ed.selectedNode as { instanceOf?: string }).instanceOf === symId);
  check("the raw page no longer holds the section element", !find(page, (n) => n.kind === "element" && n.tag === "section"));

  // ── 2. output flattens the instance back to the master markup ──────────────
  const html = toHtml(ed.exportSite().pages[0]!.root);
  check("flattened output contains the master markup", html.includes("Original title") && html.includes("<section"));
  check("flattened output has NO instance wrapper leakage", !html.includes("instanceOf"));
}

// ── 3. edit-once-propagate: editing the master moves every instance ──────────
console.log("edit master propagates");
{
  const ed = freshEditor();
  const section = find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section")!;
  const symId = ed.createSymbol("Card", idOf(section))!;
  // Insert a SECOND instance at the page root.
  ed.select(undefined);
  ed.insertSymbolInstance(symId);
  check("two instances of the symbol now exist", countInstances(ed.extract().root, symId) === 2);

  // Enter the master, retitle its heading, exit.
  ed.enterSymbol(symId);
  check("editingSymbol reflects the open master", ed.editingSymbol?.id === symId);
  const masterHeading = find(ed.activeRootNode, (n) => n.kind === "element" && n.tag === "h2")!;
  ed.setText(idOf(masterHeading)!, "Shared new title");
  ed.exitSymbol();
  check("back on the page after exit", ed.activeTree === "page");

  const html = toHtml(ed.exportSite().pages[0]!.root);
  const hits = html.split("Shared new title").length - 1;
  check("BOTH instances show the edited title (propagated)", hits === 2);
  check("the old title is gone everywhere", !html.includes("Original title"));
}

// ── 4. detach severs one instance; the other keeps propagating ───────────────
console.log("detach");
{
  const ed = freshEditor();
  const section = find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section")!;
  const symId = ed.createSymbol("Card", idOf(section))!;
  ed.select(undefined);
  ed.insertSymbolInstance(symId);

  const firstInstance = find(ed.extract().root, (n) => n.kind !== "outlet" && n.instanceOf === symId)!;
  ed.detachInstance(idOf(firstInstance)!);
  check("one instance remains after detaching the other", countInstances(ed.extract().root, symId) === 1);
  const detached = find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section");
  check("the detached instance is real, editable section markup again", !!detached);
}

// ── 5. undo unwinds a createSymbol cleanly ───────────────────────────────────
console.log("undo");
{
  const ed = freshEditor();
  const section = find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section")!;
  const symId = ed.createSymbol("Card", idOf(section))!;
  check("symbol + instance present before undo", ed.symbols.length === 1 && countInstances(ed.extract().root, symId) === 1);
  ed.undo();
  check("undo removes the symbol", ed.symbols.length === 0);
  check("undo restores the original section element", !!find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section"));
  ed.redo();
  check("redo re-creates the symbol + instance", ed.symbols.length === 1 && countInstances(ed.extract().root, symId) === 1);
}

// ── 6. delete detaches all instances, no dangling refs ───────────────────────
console.log("deleteSymbol");
{
  const ed = freshEditor();
  const section = find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section")!;
  const symId = ed.createSymbol("Card", idOf(section))!;
  ed.select(undefined);
  ed.insertSymbolInstance(symId);
  ed.deleteSymbol(symId);
  check("symbol roster is empty after delete", ed.symbols.length === 0);
  check("no instance refs dangle in the page", countInstances(ed.extract().root, symId) === 0);
  check("both instances became real section markup", find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section") != null);
}

// ── 7. persistence: extractSite round-trips symbols ──────────────────────────
console.log("persistence");
{
  const ed = freshEditor();
  const section = find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section")!;
  const symId = ed.createSymbol("Card", idOf(section))!;
  const saved = ed.extractSite();
  check("extractSite carries the symbol map", !!saved.symbols && !!saved.symbols[symId]);
  const reloaded = new Editor(saved);
  check("a reloaded editor sees the symbol", reloaded.symbols.length === 1);
  check("a reloaded editor keeps the instance linked", countInstances(reloaded.extract().root, symId) === 1);
  const outHtml = toHtml(reloaded.exportSite().pages[0]!.root);
  check("reloaded output flattens correctly", outHtml.includes("Original title"));
}

// ── 8. per-instance overrides ────────────────────────────────────────────────
console.log("overrides");
{
  const ed = freshEditor();
  const section = find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section")!;
  const symId = ed.createSymbol("Card", idOf(section))!;
  ed.select(undefined);
  ed.insertSymbolInstance(symId);

  const instanceIds: string[] = [];
  walk(ed.extract().root, (n) => {
    if (n.kind !== "outlet" && n.instanceOf === symId && n.id) instanceIds.push(n.id);
  });
  const masterHeadingId = idOf(find(ed.symbol(symId)!.root, (n) => n.kind === "element" && n.tag === "h2"))!;

  // Override ONLY the first instance's heading.
  ed.setInstanceOverrideText(instanceIds[0]!, masterHeadingId, "Only me");
  const html = toHtml(ed.exportSite().pages[0]!.root);
  check("overridden instance shows its own text", html.includes("Only me"));
  check("the other instance still shows the master text", (html.split("Original title").length - 1) === 1);

  // A master edit must NOT clobber an overridden field, but DOES move the other.
  ed.enterSymbol(symId);
  ed.setText(masterHeadingId, "Master v2");
  ed.exitSymbol();
  const html2 = toHtml(ed.exportSite().pages[0]!.root);
  check("override survives a master edit", html2.includes("Only me"));
  check("non-overridden instance follows the master", html2.includes("Master v2"));

  // Clearing the override returns the instance to the (current) master text.
  ed.setInstanceOverrideText(instanceIds[0]!, masterHeadingId, undefined);
  const html3 = toHtml(ed.exportSite().pages[0]!.root);
  check("clearing the override returns to the master", !html3.includes("Only me") && (html3.split("Master v2").length - 1) === 2);
}

// ── 9. detach bakes the override in ──────────────────────────────────────────
console.log("detach keeps overrides");
{
  const ed = freshEditor();
  const section = find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section")!;
  const symId = ed.createSymbol("Card", idOf(section))!;
  const instanceId = idOf(find(ed.extract().root, (n) => n.kind !== "outlet" && n.instanceOf === symId))!;
  const masterHeadingId = idOf(find(ed.symbol(symId)!.root, (n) => n.kind === "element" && n.tag === "h2"))!;
  ed.setInstanceOverrideText(instanceId, masterHeadingId, "Detached custom");
  ed.detachInstance(instanceId);
  const html = toHtml(ed.exportSite().pages[0]!.root);
  check("detached copy keeps the overridden text", html.includes("Detached custom"));
  check("detached copy is a real section (no instance)", !!find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section"));
}

console.log(`\n${failures === 0 ? "✅ symbols engine: all checks passed" : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
