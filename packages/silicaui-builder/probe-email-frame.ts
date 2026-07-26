/**
 * Isolated proof for the email FRAME — host chrome composed around an authored
 * email without ever entering it (`src/email/frame.ts`). No React, no DOM.
 *
 * What this has to establish, because the whole feature exists for these two
 * guarantees: the frame reaches the SENT HTML, and it never reaches the SAVED
 * DOCUMENT. Bundled with esbuild + run under node.
 */
import { EmailEditor } from "./src/email/engine";
import { composeEmailDocument, isEmptyFrame, frameLabel } from "./src/email/frame";
import { toEmailHtml } from "./src/email/projector";
import type { EmailFrame } from "./src/email/frame";
import type { EmailResolveHost } from "./src/email/resolve";
import type { EmailDocument, SectionNode } from "./src/email/schema";

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

/** A frame section holding one text block — the shape a brand bar / legal
 *  footer actually takes. `bind` makes its copy a data binding instead. */
function section(id: string, text: string, bind?: string): SectionNode {
  return {
    id,
    kind: "section",
    bg: "#111827",
    paddingX: 24,
    paddingY: 16,
    children: [
      {
        id: `${id}-t`,
        kind: "text",
        html: text,
        align: "center",
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "normal",
        lineHeight: 18,
        ...(bind ? { data: { kind: "value" as const, ref: bind } } : {}),
      },
    ],
  };
}

const frame: EmailFrame = {
  header: [section("brand-bar", "ACME")],
  footer: [section("legal", "Unsubscribe · 123 Main St")],
  label: "Brand frame",
};

function docOf(ed: EmailEditor): EmailDocument {
  return ed.extract();
}

// ── 1. composition: order, purity, identity ──────────────────────────────────
console.log("composeEmailDocument");
{
  const ed = new EmailEditor();
  const doc = docOf(ed);
  const bodyIds = doc.root.children.map((c) => c.id);
  const composed = composeEmailDocument(doc, frame);

  check(
    "children are [header, ...body, footer], in order",
    composed.root.children.map((c) => c.id).join(",") === ["brand-bar", ...bodyIds, "legal"].join(","),
  );
  check("the source document is NOT mutated", doc.root.children.map((c) => c.id).join(",") === bodyIds.join(","));
  check("subject/preheader/root fields survive", composed.subject === doc.subject && composed.root.width === doc.root.width);

  // An absent or empty frame is a no-op, so no call site needs a special case.
  check("no frame returns the same object", composeEmailDocument(doc, undefined) === doc);
  check("an empty frame returns the same object", composeEmailDocument(doc, { header: [], footer: [] }) === doc);
  check("isEmptyFrame agrees", isEmptyFrame(undefined) && isEmptyFrame({}) && !isEmptyFrame(frame));
  check("frameLabel prefers the host's label", frameLabel(frame) === "Brand frame");
  check("frameLabel falls back when unset", frameLabel({ header: [] }).length > 0);
}

// ── 2. the frame reaches the sent HTML ───────────────────────────────────────
console.log("projection");
{
  const ed = new EmailEditor();
  const doc = docOf(ed);
  const bare = toEmailHtml(doc);
  const framed = toEmailHtml(doc, { frame });

  check("without a frame, chrome is absent", !bare.includes("ACME") && !bare.includes("Unsubscribe"));
  check("with a frame, the header renders", framed.includes("ACME"));
  check("with a frame, the footer renders", framed.includes("Unsubscribe"));
  check(
    "the header precedes the body, which precedes the footer",
    framed.indexOf("ACME") < framed.indexOf("Start writing") &&
      framed.indexOf("Start writing") < framed.indexOf("Unsubscribe"),
  );
  check("the frame's own background paints (it's a real section)", framed.includes("#111827"));
  // A positional resolver argument still means "resolver" — the older call form
  // can't be misread as an options bag now that one exists.
  check("a bare positional resolver still projects unframed", toEmailHtml(doc, {} as EmailResolveHost) === bare);
}

// ── 3. composition happens BEFORE resolution ─────────────────────────────────
// The point: a brand bar can bind its wordmark exactly the way a body node
// does. If the frame were merged after resolution its bindings would render as
// literal placeholders.
console.log("frame content resolves");
{
  const ed = new EmailEditor();
  const bound: EmailFrame = { header: [section("brand-bar", "fallback", "brand.name")] };
  const host: EmailResolveHost = {
    resolveBinding: (ref) => (ref === "brand.name" ? { value: "Acme Corp" } : undefined),
  };
  const html = toEmailHtml(docOf(ed), { resolver: host, frame: bound });
  check("a bound frame node resolves against the host", html.includes("Acme Corp"));
  check("the unresolved placeholder is gone", !html.includes("fallback"));
}

// ── 4. the frame never enters the document ───────────────────────────────────
// The guarantee that makes this different from "just insert the sections":
// nothing the editor persists or relays has ever heard of the frame.
console.log("the document stays clean");
{
  const ed = new EmailEditor();
  const before = JSON.stringify(ed.extractProject());
  // Composition is the only place the frame appears; it takes a document as a
  // VALUE and hands one back, so there is no channel into the editor at all.
  composeEmailDocument(docOf(ed), frame);
  toEmailHtml(docOf(ed), { frame });
  check("extractProject() is byte-identical after composing + projecting", JSON.stringify(ed.extractProject()) === before);
  check("no frame section is addressable in the tree", ed.node("brand-bar") === undefined && ed.node("legal") === undefined);
  check(
    "removing a frame section is a no-op (there is nothing to remove)",
    (ed.remove("legal"), JSON.stringify(ed.extractProject()) === before),
  );
}

console.log(`\n${failures === 0 ? "✅ email frame: all checks passed" : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
