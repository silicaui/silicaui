import "./styles.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Builder, StatusItem, useEditor } from "@wizeworks/silicaui-builder/react";
import type { BuilderHandle, BuilderHost, Editor, Op, OpMeta, Peer } from "@wizeworks/silicaui-builder/react";
import { EmailBuilder } from "@wizeworks/silicaui-builder/email/react";
import type {
  EmailBuilderHandle,
  EmailBuilderHost,
  EmailFrame,
  SavedBlock,
  SavedBlockChange,
} from "@wizeworks/silicaui-builder/email/react";
import { emptyEmailDocument } from "@wizeworks/silicaui-builder/email";
import type { EmailProject, SectionNode, TextNode } from "@wizeworks/silicaui-builder/email";
import { stamp, el } from "@wizeworks/silicaui-html";
import { heroSplitCta } from "@wizeworks/silicaui-html/blocks";

/**
 * A demo `BuilderHost` (builder-contract.md §5) exercising every hook, mounted
 * under `?host=demo` — a small stand-in for what sparx (or any host) plugs in,
 * so e2e coverage of the host seam doesn't need a real backend.
 */
const demoHost: BuilderHost = {
  catalog: () => ({
    extend: [
      {
        key: "host",
        label: "Host",
        items: [
          {
            key: "host:callout",
            label: "Host callout",
            icon: "box",
            hint: "Contributed by the demo host",
            // `id` (not `data-testid`) — the raw-element attr floor (element.ts)
            // deliberately excludes ALL `data-*` from authored nodes, `id` is
            // whitelisted, so the e2e spec locates this by DOM id instead.
            make: () => el("div", "card bg-accent/10 p-4", { text: "Host-contributed block", attrs: { id: "host-callout" } }),
          },
        ],
      },
    ],
    // `hide` reaches host-component rows, not just built-in ones. `ReelFrame` is
    // registered below — so it renders, takes props and survives in a document —
    // but it is the raw ingredient of a curated block, not something an author
    // should place bare, and deregistering it to keep it out of the palette
    // would take the rest of that with it.
    hide: ["host:ReelFrame"],
  }),
  dataSources: () => [
    { key: "site.title", label: "Site title", cardinality: "scalar" },
    // The brand logo — bind it to a Wordmark's `src` (via the Data group's
    // `attr` field) to preview a real brand mark on the canvas.
    { key: "site.identity.logo", label: "Brand logo", cardinality: "scalar" },
    {
      key: "products",
      label: "Products",
      cardinality: "array",
      fields: [
        { key: "product.title", label: "Title", cardinality: "scalar" },
        { key: "product.price", label: "Price", cardinality: "scalar" },
      ],
    },
    // Deliberately LONGER than anything you'd put above the fold — this is the
    // source the collection binding's "How many" (`limit`) field exists for:
    // one catalog, and a different count per instance (a strip of 4 on the
    // landing page, a full grid at /shop, a rail of 12 on the product page).
    {
      key: "catalog",
      label: "Full catalog",
      cardinality: "array",
      fields: [
        { key: "product.title", label: "Title", cardinality: "scalar" },
        { key: "product.price", label: "Price", cardinality: "scalar" },
      ],
    },
    // Always resolves to zero items — exercises the `repeat.omitWhenEmpty`
    // toggle end-to-end (as opposed to `products`, which never hits the
    // zero-item case in this demo host).
    { key: "empty-collection", label: "Empty collection (demo)", cardinality: "array", fields: [] },
  ],
  // A PLATFORM's curated brand catalog — the shelf sparx maintains centrally and
  // offers to every site it hosts. Apply-only (no delete), rendered above the
  // shipped presets, and `hide` prunes one shipped preset to prove that lever
  // works from the UI side too. A real platform would fetch these once.
  themes: () => ({
    extend: [
      {
        key: "acme",
        label: "Acme brand",
        themes: [
          {
            name: "acme-day",
            tokens: {
              "--color-base-100": "oklch(99% 0.004 95)",
              "--color-base-200": "oklch(96% 0.006 95)",
              "--color-base-300": "oklch(91% 0.009 95)",
              "--color-base-content": "oklch(22% 0.02 60)",
              "--color-primary": "oklch(56% 0.16 42)",
              "--color-secondary": "oklch(60% 0.07 60)",
              "--color-accent": "oklch(70% 0.14 160)",
              "--color-neutral": "oklch(28% 0.02 60)",
            },
          },
          {
            name: "acme-night",
            mode: "dark",
            tokens: {
              "--color-base-100": "oklch(18% 0.015 60)",
              "--color-base-200": "oklch(15% 0.015 60)",
              "--color-base-300": "oklch(12% 0.015 60)",
              "--color-base-content": "oklch(94% 0.008 95)",
              "--color-primary": "oklch(72% 0.15 42)",
              "--color-secondary": "oklch(76% 0.06 60)",
              "--color-accent": "oklch(76% 0.13 160)",
              "--color-neutral": "oklch(85% 0.01 60)",
            },
          },
        ],
      },
    ],
    hide: ["ocean"],
  }),
  validateClass: (cls) =>
    cls.includes("host-banned") ? { ok: false, reason: 'the demo host blocks "host-banned"' } : { ok: true },
  inspectorPanels: () => [
    {
      id: "demo-panel",
      title: "Host panel",
      render: (node, ctx) => (
        <div data-testid="host-panel">
          <p className="mb-1 text-xs text-base-content/60">Contributed by the demo host, for {node.kind === "outlet" ? "outlet" : node.kind}.</p>
          <button
            type="button"
            className="btn btn-xs btn-soft"
            data-testid="host-panel-set-attr"
            onClick={() => ctx.setAttr("data-host-note", "set-by-host-panel")}
          >
            Set host attr
          </button>
        </div>
      ),
    },
  ],
  // Host TABS — top-level peers of Design/Settings, the coarse half of the
  // inspector seam. Deliberately covers all three cases at once: a panel-scoped
  // tab that must survive an empty selection, a node-scoped one that must come
  // and go with the selection, a reserved id that must be rejected outright, and
  // enough filler to overflow a 300px rail so the paging buttons have to appear.
  inspectorTabs: (node) => [
    {
      id: "demo-history",
      label: "History",
      icon: "undo",
      scope: "panel",
      render: () => (
        <div className="p-3 text-sm" data-testid="host-tab-history">
          Change history for the whole document, independent of what is selected.
        </div>
      ),
    },
    // Node-scoped, and only for elements: proves a tab can be conditional, and
    // that closing over a node the selection left behind falls back to Design.
    ...(node?.kind === "element"
      ? [
          {
            id: "demo-audit",
            label: "Audit",
            icon: "shield",
            render: (n: typeof node, ctx: { setAttr: (k: string, v: string) => void }) => (
              <div className="p-3 text-sm" data-testid="host-tab-audit">
                <p className="mb-2">
                  Auditing <span data-testid="host-tab-audit-tag">{n.tag}</span>.
                </p>
                <button
                  type="button"
                  className="btn btn-xs btn-soft"
                  data-testid="host-tab-audit-mark"
                  onClick={() => ctx.setAttr("data-audited", "yes")}
                >
                  Mark audited
                </button>
              </div>
            ),
          },
        ]
      : []),
    // Rejected: "design" is the builder's own id. The built-in tab must survive.
    { id: "design", label: "Hijack", render: () => <div data-testid="host-tab-hijack">nope</div> },
    { id: "demo-filler-1", label: "Reports", render: () => <div className="p-3 text-sm">Reports</div> },
    { id: "demo-filler-2", label: "Translations", render: () => <div className="p-3 text-sm">Translations</div> },
  ],
  pickAsset: async () => ({ url: "https://picsum.photos/seed/host/400/300", alt: "Host-picked asset" }),
  // Host NODES (spec §A) — live host-owned widgets the builder places as
  // `HostNode`s. `PriceTag` renders from its props; `CheckoutWidget` is `pinned`
  // (inserts host-locked, non-deletable). A stand-in for sparx's checkout/cart/
  // PLP regions, so the host-node seam has e2e coverage without a real app.
  hostComponents: () => [
    {
      name: "PriceTag",
      label: "Price Tag",
      category: "Commerce",
      icon: "pricing",
      hint: "The live price of the product this page is about.",
      defaultClass: "inline-block",
      defaultProps: { amount: 9.99, currency: "USD" },
      props: [
        { name: "amount", label: "Amount", type: "number" },
        { name: "currency", label: "Currency", type: "select", options: [{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }] },
      ],
    },
    { name: "CheckoutWidget", label: "Checkout", category: "Commerce", icon: "cta", pinned: true, defaultClass: "block" },
    // `category` is DISPLAY COPY and this one names a shelf the builder already
    // has, so the row lands INSIDE the built-in Media group instead of opening a
    // second section headed "Media" directly beneath it.
    {
      name: "video.reel",
      label: "Video reel",
      category: "Media",
      icon: "video",
      hint: "A looping highlight reel, played by the host.",
    },
    // Registered but HIDDEN from the palette (see `catalog().hide` above) — the
    // bare frame the curated row wraps.
    { name: "ReelFrame", label: "Video reel frame", category: "Media", icon: "video" },
    // A category matching nothing built-in opens its own group, labelled with the
    // host's copy VERBATIM — and a long one, which is the width the search row's
    // group badge has to yield at rather than eating the item's name.
    {
      name: "store.map",
      label: "Store map",
      category: "Video, audio & maps",
      icon: "monitor",
      hint: "A pin on a map, wherever this tenant trades from.",
    },
  ],
  renderHostNode: (node, ctx) => {
    if (node.component === "PriceTag") {
      const amount = typeof node.props?.amount === "number" ? node.props.amount : 0;
      const currency = String(node.props?.currency ?? "USD");
      return (
        <span data-testid="host-pricetag" className="badge badge-primary">
          {currency} {amount.toFixed(2)}
        </span>
      );
    }
    if (node.component === "store.map") {
      return (
        <div data-testid="host-map" className="rounded-box border border-base-300 p-4 text-center text-sm">
          Live store map{ctx.preview ? " (preview)" : ""}
        </div>
      );
    }
    if (node.component === "video.reel" || node.component === "ReelFrame") {
      return (
        <div data-testid="host-reel" className="rounded-box border border-base-300 p-4 text-center text-sm">
          Live video reel{ctx.preview ? " (preview)" : ""}
        </div>
      );
    }
    return (
      <div data-testid="host-checkout" className="rounded-box border border-base-300 p-4 text-center text-sm">
        Live checkout widget{ctx.preview ? " (preview)" : ""}
      </div>
    );
  },
  // Fixed sample data, resolved SYNCHRONOUSLY (§3 of builder-contract.md) — a
  // real host would fetch once, up front, into a closure this reads from.
  // Every ref this host DECLARES in `dataSources` above, it also resolves here.
  // That symmetry is the contract: the picker only offers declared keys, so a
  // key the catalog advertises but the resolver drops on the floor is a HOST
  // bug — and it was ours, too. `product.title` / `product.price` /
  // `empty-collection` were all declared but unhandled, "working" only via a
  // fallthrough that claimed `visible: false` for everything unrecognized.
  //
  // An unrecognized ref now returns `undefined` — "I've never heard of this" —
  // NOT `{ value: undefined }` (which claims "I know it, it's empty" and blanks
  // the node) and NOT `visible: false` (which claims "hide this" and drops it).
  // A demo host must model the contract, not the footgun. See §A.2 of
  // data-resolution-and-brand-mark.md.
  resolveBinding: (ref, scope) => {
    if (ref === "site.title") return { value: "Acme Storefront", label: "Site title" };
    if (ref === "site.identity.logo") return { value: "/brand-wide.svg", label: "Brand logo" };
    const item = scope.item as { title: string; price: string } | undefined;
    if (ref === "product.title") return { value: item?.title };
    if (ref === "product.price") return { value: item?.price };
    return undefined;
  },
  resolveCollection: (ref) => {
    if (ref === "products")
      return [
        { title: "Widget", price: "$12" },
        { title: "Gadget", price: "$24" },
        { title: "Gizmo", price: "$36" },
      ];
    // 12 rows — enough that "how many of these do I want HERE" is a real
    // question, which is what the binding's `limit` answers.
    if (ref === "catalog")
      return Array.from({ length: 12 }, (_, i) => ({ title: `Catalog item ${i + 1}`, price: `$${(i + 1) * 6}` }));
    // A KNOWN collection that legitimately has no items — the `omitWhenEmpty`
    // path. Unknown refs deliberately never reach it.
    if (ref === "empty-collection") return [];
    return undefined;
  },
};

/**
 * A demo `EmailBuilderHost` — the email twin of `demoHost` above, mounted
 * under the SAME `?host=demo` switch, exercising the ported
 * catalog/dataSources/resolveBinding/resolveCollection seam (Q23–Q25) end to
 * end without a real backend.
 */
const demoEmailHost: EmailBuilderHost = {
  catalog: () => ({
    extend: [
      {
        key: "host:callout",
        label: "Host block",
        hint: "Contributed by the demo host",
        icon: "box",
        make: () => ({
          id: "x",
          kind: "text",
          html: "Host-contributed block",
          align: "left",
          color: "#111827",
          fontSize: 16,
          fontWeight: "normal",
          lineHeight: 24,
        }),
      },
    ],
  }),
  dataSources: () => [
    { key: "customer.firstName", label: "Customer first name", cardinality: "scalar" },
    {
      key: "products",
      label: "Products",
      cardinality: "array",
      fields: [
        { key: "product.title", label: "Title", cardinality: "scalar" },
        { key: "product.price", label: "Price", cardinality: "scalar" },
        // The two extra fields a CLICKABLE product card needs per item: its own
        // image and its own destination (the latter bound onto a `link` group's
        // `href` — the whole reason that node kind exists).
        { key: "product.image", label: "Image", cardinality: "scalar" },
        { key: "product.url", label: "Link URL", cardinality: "scalar" },
      ],
    },
    // Always resolves to zero items — exercises the `repeat.omitWhenEmpty`
    // toggle end-to-end (as opposed to `products`, which never hits the
    // zero-item case in this demo host).
    { key: "empty-collection", label: "Empty collection (demo)", cardinality: "array", fields: [] },
  ],
  // Fixed sample data, resolved SYNCHRONOUSLY — a real host would fetch once,
  // up front, into a closure this reads from.
  resolveBinding: (ref, scope) => {
    if (ref === "customer.firstName") return { value: "Jordan" };
    const item = scope.item as { title: string; price: string; image: string; url: string } | undefined;
    if (ref === "product.title") return { value: item?.title };
    if (ref === "product.price") return { value: item?.price };
    if (ref === "product.image") return { value: item?.image };
    if (ref === "product.url") return { value: item?.url };
    return undefined; // unknown ref — see the note on `demoHost.resolveBinding`
  },
  resolveCollection: (ref) => {
    if (ref === "products")
      return [
        { title: "Widget", price: "$12", image: "https://cdn.example.com/widget.jpg", url: "https://shop.example.com/p/widget" },
        { title: "Gadget", price: "$24", image: "https://cdn.example.com/gadget.jpg", url: "https://shop.example.com/p/gadget" },
        { title: "Gizmo", price: "$36", image: "https://cdn.example.com/gizmo.jpg", url: "https://shop.example.com/p/gizmo" },
      ];
    // A KNOWN collection that legitimately has no items — exercises the
    // `omitWhenEmpty` path, which unknown refs deliberately never reach.
    if (ref === "empty-collection") return [];
    return undefined;
  },
};

/**
 * A demo `EmailFrame` + a host-locked seed, mounted under `?frame=1` — the
 * shape a platform that brands every tenant's mail actually has: chrome
 * composed around the body (never inside it), plus one block that IS part of
 * the document but must survive the author.
 *
 * A frame section is an ordinary `SectionNode`; nothing special is needed to
 * author one.
 */
function frameSection(id: string, html: string, bg: string, color: string): SectionNode {
  return {
    id,
    kind: "section",
    bg,
    paddingX: 24,
    paddingY: 14,
    children: [
      { id: `${id}-text`, kind: "text", html, align: "center", color, fontSize: 12, fontWeight: "normal", lineHeight: 18 },
    ],
  };
}

const demoEmailFrame: EmailFrame = {
  label: "Brand frame",
  header: [frameSection("demo-brand-bar", "<b>ACME</b>", "#111827", "#ffffff")],
  footer: [
    frameSection("demo-legal", "123 Main St · <a href=\"#\">Unsubscribe</a> · Sent by ACME", "#f4f4f5", "#3f3f46"),
    // A raw-HTML footer block — the shape a real compliance footer takes when
    // the host already owns the markup. It's here because it's the node kind
    // that used to leak authoring chrome (a "Custom HTML" label painted over
    // finished host content), so the frame demo has to carry one.
    {
      id: "demo-legal-html",
      kind: "section",
      bg: "#f4f4f5",
      paddingX: 24,
      paddingY: 10,
      children: [
        {
          id: "demo-legal-html-body",
          kind: "html",
          html: '<p style="margin:0;text-align:center;font-size:11px;color:#71717a">ACME Inc. is a registered trader. <a href="#">Privacy</a></p>',
        },
      ],
    },
  ],
};

/** A seed whose FIRST section is host-locked — the other half of the story:
 *  content that lives in the saved document but can't be deleted or moved. */
function lockedSeedProject(): EmailProject {
  let n = 0;
  const document = emptyEmailDocument(() => `seed-${n++}`);
  const pinned: SectionNode = {
    ...frameSection("seed-pinned", "Your order is confirmed.", "#eef2ff", "#1e1b4b"),
    locked: "host",
  };
  (pinned.children[0] as TextNode).fontSize = 18;
  document.root.children.unshift(pinned);
  return { version: "1", templates: [{ id: "seed-template", name: "Email 1", document }] };
}

// The editable DOCUMENT theme — a complete "lightsilica" palette (every surface +
// role) so the Theme editor's tile grid and the component board are fully
// populated. A nested `[data-theme]` island, distinct from the chrome's studio
// theme; editing it must never move the chrome.
const theme = {
  name: "lightsilica",
  tokens: {
    "--color-base-100": "oklch(98% 0.003 250)",
    "--color-base-200": "oklch(95% 0.004 250)",
    "--color-base-300": "oklch(90% 0.006 250)",
    "--color-base-content": "oklch(21% 0.012 255)",
    "--color-primary": "oklch(42% 0.055 252)",
    "--color-primary-content": "oklch(98% 0.004 250)",
    "--color-secondary": "oklch(55% 0.035 255)",
    "--color-secondary-content": "oklch(98% 0.004 250)",
    "--color-accent": "oklch(64% 0.13 211)",
    "--color-accent-content": "oklch(15% 0.02 255)",
    "--color-neutral": "oklch(26% 0.014 255)",
    "--color-neutral-content": "oklch(95% 0.004 250)",
    "--color-info": "oklch(68% 0.1 232)",
    "--color-success": "oklch(70% 0.12 150)",
    "--color-warning": "oklch(80% 0.11 85)",
    "--color-error": "oklch(58% 0.17 25)",
  },
  dark: {
    "--color-base-100": "oklch(16% 0.01 255)",
    "--color-base-200": "oklch(13.5% 0.01 255)",
    "--color-base-300": "oklch(11% 0.01 255)",
    "--color-base-content": "oklch(93% 0.006 250)",
    "--color-primary": "oklch(72% 0.06 252)",
    "--color-secondary": "oklch(78% 0.035 255)",
    "--color-accent": "oklch(72% 0.13 211)",
  },
  mode: "light",
} as const;

// Surface the data-out API on window so the harness (and Playwright) can observe
// what a real host would persist/deploy: the latest onChange site + publish result.
const bus = window as unknown as {
  __ready: boolean;
  __lastChange?: unknown;
  __changeCount: number;
  __published?: unknown;
  __exported?: string;
  __sentTest?: { to: string; subject: string };
  __activePage?: unknown;
  __editor?: Editor;
  // The state-and-intent-out contract: every op batch the builder has emitted,
  // the meta that rode with it, and the imperative handle a real collaborative
  // host would hold. Exactly what such a host sees — no bespoke test API.
  __ops: Op[];
  __lastMeta?: OpMeta;
  __handle?: BuilderHandle;
  __emailHandle?: EmailBuilderHandle;
  // The host-owned saved-block library (`?savedBlocks=host`): what the "server"
  // currently holds, and every intent the builder reported.
  __savedBlocks?: readonly SavedBlock[];
  __savedBlockChanges: SavedBlockChange[];
  // Presence, pushed in the way a real host's relay would: a full roster, from
  // outside the editor. A spec can't produce a second client, so this is how one
  // is stood in for.
  __setPeers?: (peers: readonly Peer[]) => void;
};
bus.__changeCount = 0;
bus.__ops = [];
bus.__savedBlockChanges = [];

/**
 * The host's toolbar UI — and the harness's handle on the editor. `toolbarSlot`
 * renders INSIDE the Builder, so it can read the same `useEditor()` context the
 * built-in panels use: a real host gets the imperative spine through the public
 * seam it already has, no bespoke test API. Playwright drives `__editor` to
 * reach states the Inspector's own controls can't author — e.g. a ref no host
 * declares, which is what a stale document (or a host whose catalog and
 * resolver disagree) actually produces in the wild.
 */
/**
 * The status-bar disclosure — a count that reveals what it counts, which is the
 * one interactive thing the strip allows. Modelled on a host's pre-publish
 * check: the number is ambient, and pressing it is how you find out which three.
 */
function StatusBarSlot() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <StatusItem
        data-testid="status-bar-slot"
        onClick={() => setOpen((v) => !v)}
        expanded={open}
        controls="harness-status-detail"
      >
        3 editing · saved, not live yet
      </StatusItem>
      {open && (
        <span id="harness-status-detail" data-testid="status-bar-detail" className="text-base-content">
          Ana, Ben, Cai
        </span>
      )}
    </>
  );
}

function ToolbarSlot() {
  const editor = useEditor();
  React.useEffect(() => {
    bus.__editor = editor;
  }, [editor]);
  return (
    <span data-testid="toolbar-slot" className="text-xs text-base-content/50 px-1">
      Demo host UI
    </span>
  );
}

/**
 * A demo account-level saved-block library — the host side of the controlled
 * `savedBlocks`/`onSavedBlocksChange` seam, mounted under `?savedBlocks=host`.
 *
 * Deliberately behaves like a real backend rather than a synchronous stub: it
 * ACKs after a round trip and re-ids the block server-side, which is the whole
 * reason the seam is a controlled prop instead of fire-and-forget write hooks —
 * the palette can only show the account's real id if the account's list is what
 * it renders. `?savedBlocks=readonly` mounts the other supported shape: a
 * curated, insert-only library (no `onSavedBlocksChange`).
 */
const CURATED_BLOCK: SavedBlock = {
  id: "sb_account_promo",
  name: "Account promo",
  node: {
    id: "sbn_account_promo",
    kind: "text",
    html: "Saved to the account, not this browser.",
    align: "left",
    color: "#1f2937",
  } as TextNode,
  savedAt: 0,
};

function useHostSavedBlocks(mode: string | null): {
  savedBlocks?: readonly SavedBlock[];
  onSavedBlocksChange?: (next: SavedBlock[], change: SavedBlockChange) => void;
} {
  const [blocks, setBlocks] = React.useState<readonly SavedBlock[]>(
    mode === "readonly" ? [CURATED_BLOCK] : [],
  );
  React.useEffect(() => {
    bus.__savedBlocks = blocks;
  }, [blocks]);

  const onChange = React.useCallback((next: SavedBlock[], change: SavedBlockChange) => {
    bus.__savedBlockChanges.push(change);
    // The server round trip. A save comes back with the id the ACCOUNT assigned,
    // not the one the builder proposed — a host swapping ids underneath is the
    // case a shadow copy inside the builder could not survive.
    window.setTimeout(() => {
      setBlocks(
        change.type === "save"
          ? next.map((b) => (b.id === change.block.id ? { ...b, id: `srv_${b.id}` } : b))
          : next,
      );
    }, 80);
  }, []);

  if (mode === "host") return { savedBlocks: blocks, onSavedBlocksChange: onChange };
  if (mode === "readonly") return { savedBlocks: blocks };
  return {};
}

/** The email builder plus whatever host-owned state it needs — a component, not
 *  a bare `root.render`, because a controlled prop needs a state owner above it. */
function EmailHarness(props: React.ComponentProps<typeof EmailBuilder>) {
  const library = useHostSavedBlocks(new URLSearchParams(location.search).get("savedBlocks"));
  return <EmailBuilder {...props} {...library} />;
}

// Local crash-recovery: ON for the real designer, OFF under test automation (so
// e2e specs start clean and don't restore a prior test's edits) — unless a spec
// opts back in with `?persist=1` (the persistence spec, which cleans up after).
const params = new URLSearchParams(location.search);
const persist = params.has("persist")
  ? params.get("persist") !== "0"
  : !navigator.webdriver;
const persistKey = persist ? "silicaui-designer" : null;

// `?editor=email` mounts the email builder instead of the site builder — a query
// switch (not a route) since this is a single-page dev harness, not the product.
const editorMode = params.get("editor");
// `?host=demo` mounts the site builder with `demoHost` (the host adapter, §5)
// wired in — exercises catalog/dataSources/validateClass/inspectorPanels/pickAsset
// end to end without a real backend. Same switch mounts the email builder's
// `demoEmailHost` twin when `?editor=email` is also set.
const host = params.get("host") === "demo" ? demoHost : undefined;
const emailHost = params.get("host") === "demo" ? demoEmailHost : undefined;
// `?frame=1` mounts the email builder with host chrome AND a host-locked
// section in the seed — the two ways a host keeps content out of an author's
// hands, exercised together.
const framed = params.get("frame") === "1";

const root = createRoot(document.getElementById("app") as HTMLElement);
if (editorMode === "email") {
  root.render(
    <React.StrictMode>
      <EmailHarness
        ref={(h) => {
          bus.__emailHandle = h ?? undefined;
        }}
        theme={theme}
        host={emailHost}
        frame={framed ? demoEmailFrame : undefined}
        project={framed ? lockedSeedProject() : undefined}
        persistKey={persist ? "silicaui-designer-email" : null}
        onChange={(project, ops, meta) => {
          bus.__lastChange = project;
          bus.__changeCount += 1;
          bus.__ops.push(...(ops as unknown as Op[]));
          bus.__lastMeta = meta;
        }}
        onExport={(html) => {
          bus.__exported = html;
        }}
        onSendTest={async ({ to, subject }) => {
          // Simulate a real (slow, sometimes-fails) send: a host's ESP call.
          await new Promise((r) => setTimeout(r, 150));
          bus.__sentTest = { to, subject };
        }}
        toolbarSlot={
          emailHost ? (
            <span data-testid="email-toolbar-slot" className="text-xs text-base-content/50 px-1">
              Demo host UI
            </span>
          ) : undefined
        }
        toolbarStatusSlot={
          emailHost ? (
            <span data-testid="email-toolbar-status-slot" className="text-xs text-base-content">
              All changes saved
            </span>
          ) : undefined
        }
        statusBarSlot={<span data-testid="email-status-bar-slot">Sends 9am Tue</span>}
      />
    </React.StrictMode>,
  );
} else {
  root.render(
    <React.StrictMode>
      <SiteHarness />
    </React.StrictMode>,
  );
}

/**
 * The site builder, plus the one thing a host drives from OUTSIDE the editor:
 * presence. A real host pushes `peers` from its own relay socket; the harness
 * pushes it from `window.__setPeers` so a spec can put someone else in the
 * document mid-test, which is the only way to exercise a ring drawn for a
 * client that isn't this one.
 */
function SiteHarness() {
  const [peers, setPeers] = React.useState<readonly Peer[]>([]);
  React.useEffect(() => {
    bus.__setPeers = setPeers;
  }, []);
  return (
    <Builder
        peers={peers}
        ref={(h) => {
          bus.__handle = h ?? undefined;
        }}
        document={stamp(heroSplitCta, theme)}
        host={host}
        persistKey={persistKey}
        onChange={(site, ops, meta) => {
          bus.__lastChange = site;
          bus.__changeCount += 1;
          bus.__ops.push(...ops);
          bus.__lastMeta = meta;
        }}
        onActivePageChange={(page) => {
          bus.__activePage = page;
        }}
        onPublish={(payload) => {
          bus.__published = payload;
        }}
        toolbarSlot={<ToolbarSlot />}
        toolbarStatusSlot={
          <span data-testid="toolbar-status-slot" className="text-xs text-base-content">
            All changes saved
          </span>
        }
        statusBarSlot={<StatusBarSlot />}
    />
  );
}

// Signal readiness for Playwright.
bus.__ready = true;
