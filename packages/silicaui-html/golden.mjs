// Golden byte-identical snapshot for the HTML projection. Locks the EXACT markup
// every component atom + element + metadata lowering produces, across the plain /
// prefixed / ids render variants, plus the three real blocks.
//
//   node golden.mjs           → verify current output matches the committed fixture
//   node golden.mjs --write   → (re)capture the fixture (only after an INTENDED change)
//
// Run against built output: `pnpm --filter @wizeworks/silicaui-html build && node golden.mjs`.
// This exists to prove the ComponentDef/expand refactor is behavior-preserving:
// capture on the old code, refactor, rebuild, verify — zero diff.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { toHtml } from "./dist/index.js";
import { faqAccordion, featureGrid, heroSplitCta, listBlocks } from "./dist/blocks/index.js";

const FIXTURE = fileURLToPath(new URL("./golden.fixture.txt", import.meta.url));

// Raw node builders — bypass the kit so we can plant ids + every metadata marker
// and every atom-specific prop precisely, including the pathological edges.
const c = (component, extra = {}) => ({ kind: "component", component, ...extra });
const e = (tag, extra = {}) => {
    const { text, ...rest } = extra;
    const node = { kind: "element", tag, ...rest };
    if (text != null && node.children == null) node.children = [text];
    return node;
};

// A synthetic tree exercising every atom, every render branch, and every edge.
const synthetic = e("section", {
    class: "wrap card",
    attrs: { "data-role": "root", hidden: false, tabindex: 0, "aria-live": true },
    children: [
        // ── Button: button (default type + label fallback), button (explicit type +
        //    children), anchor (href + label), + metadata (id/action) ──
        c("Button", { class: "btn btn-primary", props: { label: "Save & go >" } }),
        c("Button", { class: "btn", props: { type: "submit" }, children: [e("span", { text: "Submit" })] }),
        c("Button", { class: "btn btn-ghost", props: { href: "/pricing", label: "Pricing" } }),
        c("Button", {
            id: "b1",
            class: "btn",
            props: { label: "Buy" },
            data: { kind: "action", ref: "checkout", href: "/buy" },
        }),
        // ── Image: full, bare defaults, ratio-only-no-class, portrait ──
        c("Image", { class: "rounded-box w-full", props: { src: "/a.png", alt: "A photo", ratio: "wide" } }),
        c("Image", { props: {} }),
        c("Image", { props: { ratio: "square" } }),
        c("Image", { class: "shadow", props: { src: "/p.png", alt: 'Quote "x" & <b>', ratio: "portrait" } }),
        // ── Heading: explicit, default, clamp-high, clamp-low, children vs text ──
        c("Heading", { class: "text-4xl", props: { level: 1, text: "Title" } }),
        c("Heading", { props: { text: "Default level" } }),
        c("Heading", { props: { level: 9, text: "Clamped high" } }),
        c("Heading", { props: { level: 0, text: "Clamped low" } }),
        c("Heading", { props: { level: 3 }, children: [e("em", { text: "Rich" })] }),
        // ── Simple element atoms: text fallback, children, empty ──
        c("Text", { class: "prose", props: { text: "A paragraph & more <tags>" } }),
        c("Text", { children: [c("Badge", { class: "badge", props: { text: "New" } })] }),
        c("Text", {}),
        c("Badge", { class: "badge badge-accent", props: { text: "Hot" } }),
        c("Card", { class: "card", children: [c("Heading", { props: { text: "In card" } })] }),
        c("Section", { class: "py-8", props: { text: "Sec" } }),
        c("Container", { class: "container", props: { text: "Cont" } }),
        c("Grid", { class: "grid grid-cols-2", children: [c("Stack", { class: "stack", props: { text: "S" } })] }),
        // ── Icon: name, no name, with class ──
        c("Icon", { props: { name: "sparkles" } }),
        c("Icon", {}),
        c("Icon", { class: "size-6 text-primary", props: { name: "check" } }),
        // ── Divider: with class, bare ──
        c("Divider", { class: "divider" }),
        c("Divider", {}),
        // ── Form controls: Input (type + attrs + bool), default; Textarea (rows +
        //    empty-children edge, then text value w/ esc); Select (options object +
        //    string mix, empty, child-override); Checkbox/Radio/Toggle (checked/value/
        //    disabled); Field + Form containers ──
        c("Input", { class: "input", props: { type: "email", name: "email", placeholder: "you@x.com", required: true } }),
        c("Input", { props: {} }),
        c("Textarea", { class: "textarea", props: { placeholder: "Bio", rows: 4 }, children: [] }),
        c("Textarea", { props: { text: "Preset & <val>" } }),
        c("Select", { class: "select", props: { name: "n", options: [{ value: "a", label: "A" }, { value: "b", label: "B & C" }, "plain"] } }),
        c("Select", { props: { options: [] } }),
        c("Select", { class: "select", children: [e("option", { attrs: { value: "x" }, text: "X" })] }),
        c("Checkbox", { class: "checkbox", props: { name: "agree", checked: true } }),
        c("Radio", { class: "radio", props: { name: "r", value: "1" } }),
        c("Toggle", { class: "toggle", props: { name: "t", disabled: true } }),
        // Captioned form of the same three: children wrap the control in a
        // <label> and the control class MUST stay on the <input>, not the
        // wrapper (routing it to the wrapper left the real control unstyled).
        c("Checkbox", { class: "checkbox", props: { name: "tos" }, children: ["I agree"] }),
        c("Radio", { class: "radio", props: { name: "plan", value: "pro" }, children: ["Pro"] }),
        c("Toggle", { class: "toggle", props: { name: "mail" }, children: ["Email me"] }),
        c("CheckboxOption", { class: "checkbox", props: { name: "opt" }, children: ["Option A"] }),
        c("RadioOption", { class: "radio", props: { name: "tier" }, children: ["Basic"] }),
        c("Field", { class: "field", children: [e("label", { class: "field-label", text: "Name" }), c("Input", { class: "input", props: {} })] }),
        // Components that existed in React but had no -html macro, so a static or
        // Sparx-rendered page simply could not author them. `accept` here also
        // locks the sanitizer fix — it was absent from input's allowlist, so the
        // file filter was silently dropped from every static file input.
        c("Link", { class: "link link-primary", props: { href: "/docs", text: "Docs & more" } }),
        c("Link", { class: "link", props: { href: "https://x.test", target: "_blank", rel: "noreferrer" }, children: [e("span", { text: "Out" })] }),
        c("FileInput", { class: "file-input", props: { name: "cv", accept: "image/*", multiple: true } }),
        c("FileInput", { props: {} }),
        c("FloatingLabel", { class: "floating-label", props: { label: "Email" }, children: [c("Input", { class: "input", props: { type: "email", placeholder: " " } })] }),
        c("SelectableCard", { class: "card card-selectable", props: { name: "plan", value: "pro", checked: true }, children: [c("Heading", { props: { text: "Pro" } })] }),
        c("SelectableCard", { class: "card card-selectable", props: { type: "checkbox", name: "addons", value: "sso" }, children: ["SSO"] }),
        c("MockupCodeLine", { props: { prefix: "$", text: "npm i @wizeworks/silicaui" } }),
        c("MockupCodeLine", { class: "text-success", props: { text: "done & <ok>" } }),
        // Chat family — the whole set, including the composites that build inner
        // structure the author never writes, so a drift in that structure shows
        // up here as a byte diff rather than silently.
        c("ChatMessage", { props: { side: "start", avatar: "OW", name: "Obi-Wan & Co", time: "12:45" }, children: ["You were the chosen one!"] }),
        c("ChatMessage", { props: { side: "end", color: "primary", metadata: "Delivered" }, children: ["I hate you!"] }),
        c("ChatMessage", { props: { compact: true }, children: ["Grouped follow-up"] }),
        c("ChatTypingIndicator", { props: { avatar: "S", name: "Silica <Assistant>" } }),
        c("ChatTypingIndicator", { props: {} }), // no avatar, default aria-label
        c("ChatSystemMessage", { props: { text: "Today" } }),
        c("ChatToolCalls", { props: { label: 'Called search_web("silica")' }, children: ["{ ok: true }"] }),
        c("ChatToolCalls", { props: { label: "Open by default", defaultOpen: true }, children: ["detail"] }),
        c("ChatComposer", { props: {} }),
        c("ChatComposer", { props: { name: "msg", placeholder: "Say hi & wave", sendLabel: "Send", disabled: true }, children: [c("Button", { class: "btn", props: { label: "Attach" } })] }),
        c("ChatLayout", { class: "chat-layout", children: [
          c("ChatLayoutMessages", { class: "chat-layout-messages", children: [c("Chat", { class: "chat", children: [c("ChatBubble", { class: "chat-bubble", props: { text: "Hi" } })] })] }),
        ] }),
        c("Chat", { class: "chat chat-end", children: [c("ChatHeader", { class: "chat-header", props: { text: "Ada" } }), c("ChatBubble", { class: "chat-bubble", props: { text: "Yo" } }), c("ChatFooter", { class: "chat-footer", props: { text: "Seen" } })] }),
        c("ChatMessageMetadata", { class: "chat-message-metadata", props: { text: "Edited" } }),
        // Filter — reuses `toggle-group` + an optional `close` part rather than
        // adding a BehaviorType; locking the markup keeps that reuse honest.
        c("Filter", { class: "filter", children: [
          c("FilterItem", { class: "filter-item", props: { value: "all", text: "All", selected: true } }),
          c("FilterItem", { class: "filter-item", props: { value: "gear", text: "Gear & kit" } }),
        ] }),
        c("Filter", { class: "filter", props: { showReset: false }, children: [
          c("FilterItem", { class: "filter-item", props: { value: "x", text: "No reset" } }),
        ] }),
        // Form: auto `form` behavior marker; props.action → action binding; an
        // explicit `data`/`behavior` on the node is respected (never clobbered).
        c("Form", { class: "flex", children: [c("Button", { class: "btn", props: { label: "Go", type: "submit" } })] }),
        c("Form", { class: "flex", props: { action: "subscribe" }, children: [c("Input", { class: "input", props: { name: "email", type: "email" } })] }),
        c("Form", { id: "f3", class: "flex", props: { action: "ignored" }, data: { kind: "action", ref: "explicit" }, children: [] }),
        // ── Nav/Feedback/Data components: items lists, prop-driven structures, edges ──
        c("Breadcrumb", { class: "breadcrumb", props: { items: ["Home", "Library & Docs", "Data"] } }),
        c("Breadcrumb", { props: { items: [] } }), // empty items → empty <ol>
        c("Menu", { class: "menu w-56", props: { items: ["Dashboard", "Settings"] } }),
        c("Steps", { class: "steps", props: { items: ["A", "B", "C"], current: 1 } }),
        c("Steps", { class: "steps", props: { items: ["Only"] } }), // no current → none primary
        c("Pagination", { class: "join", props: { pages: 3 } }),
        c("Pagination", { class: "join", props: {} }), // default 3
        c("Navbar", { class: "navbar", children: [e("div", { class: "navbar-start", text: "SilicaUI" }), e("div", { class: "navbar-end", text: "Sign in" })] }),
        c("Alert", { class: "alert alert-info", props: { text: "Heads up <b> & stuff" } }),
        c("Alert", { class: "alert" }), // default message
        // Dismissible: close button + `dismiss` behavior marker + inlined icon.
        // This was React-only until the macro learned to emit it.
        c("Alert", { class: "alert alert-warning", props: { text: "Closable", dismissible: true } }),
        c("Progress", { class: "progress", props: { value: 70 } }),
        c("Progress", { class: "progress", props: {} }), // default 50 → w-1/2
        c("Loading", { class: "loading loading-md" }),
        c("Skeleton", { class: "skeleton h-24 w-full" }),
        c("Status", { class: "status status-success" }),
        c("Kbd", { class: "kbd", props: { text: "Ctrl" } }),
        c("Stat", { class: "stats", props: { title: "Users", value: "1,204", desc: "↗ 12%" } }),
        c("Stat", { class: "stats", props: { value: "42" } }), // value-only (no title/desc rows)
        c("Avatar", { class: "avatar w-12 rounded-full", props: { src: "/me.png", alt: "Me & I" } }),
        c("Avatar", { class: "avatar", props: {} }), // no src → alt="" only
        c("Collapse", { class: "details", props: { title: "More", content: "Hidden body" } }),
        c("Collapse", { class: "details", props: { title: "Custom" }, children: [e("p", { text: "Rich body & <x>" })] }),
        c("Timeline", { class: "timeline", props: { items: ["Founded", "Launched"] } }),
        c("Table", { class: "table", children: [e("thead", { children: [e("tr", { children: [e("th", { text: "Name" })] })] })] }),
        // ── Metadata lowering across every DataBinding + behavior + part ──
        e("div", { id: "n1", class: "menu", data: { kind: "value", ref: "user.name" } }),
        e("ul", { id: "n2", data: { kind: "collection", ref: "items" }, children: [e("li", { text: "x" })] }),
        e("a", { class: "link", data: { kind: "action", ref: "open", href: "/o" }, text: "Open" }),
        c("Card", {
            id: "car",
            class: "carousel",
            behavior: { type: "carousel", params: { loop: true, per: 2 } },
            children: [c("Card", { class: "slide", part: "slide", props: { text: "1" } })],
        }),
        // ── Text-vs-children fallback edge: empty children array + text prop ──
        c("Text", { class: "edge", children: [], props: { text: "fallback wins" } }),
    ],
});

function renderCorpus() {
    const parts = [];
    const push = (label, html) => parts.push(`### ${label}\n${html}`);
    // The three original blocks in all three render modes (plain / prefixed / ids).
    for (const [name, blk] of [["hero", heroSplitCta], ["faq", faqAccordion], ["feat", featureGrid]]) {
        push(`block:${name}:plain`, toHtml(blk));
        push(`block:${name}:prefix`, toHtml(blk, { prefix: "st-" }));
        push(`block:${name}:ids`, toHtml(blk, { ids: true }));
    }
    // Every registered block (plain + prefixed) — locks the whole marketing library's
    // markup and proves the prefixer walks each block's class strings correctly.
    for (const blk of listBlocks()) {
        push(`lib:${blk.key}:plain`, toHtml(blk));
        push(`lib:${blk.key}:prefix`, toHtml(blk, { prefix: "st-" }));
    }
    push("synthetic:plain", toHtml(synthetic));
    push("synthetic:prefix", toHtml(synthetic, { prefix: "st-" }));
    push("synthetic:ids", toHtml(synthetic, { ids: true }));
    return parts.join("\n\n");
}

const out = renderCorpus();

if (process.argv.includes("--write")) {
    writeFileSync(FIXTURE, out, "utf8");
    console.log(`✓ wrote golden fixture (${out.length} bytes) → golden.fixture.txt`);
    process.exit(0);
}

let expected;
try {
    expected = readFileSync(FIXTURE, "utf8");
} catch {
    console.error("✗ no golden.fixture.txt — run `node golden.mjs --write` first");
    process.exit(1);
}

if (out === expected) {
    console.log("✅ golden: HTML projection is byte-identical to the fixture");
    process.exit(0);
}

// Minimal first-diff report.
const a = expected;
const b = out;
let i = 0;
while (i < a.length && i < b.length && a[i] === b[i]) i++;
const ctx = 80;
console.error("❌ golden: output DIFFERS from fixture");
console.error(`first diff at byte ${i} (expected ${a.length} bytes, got ${b.length})`);
console.error("expected: …" + JSON.stringify(a.slice(Math.max(0, i - ctx), i + ctx)));
console.error("actual:   …" + JSON.stringify(b.slice(Math.max(0, i - ctx), i + ctx)));
process.exit(1);
