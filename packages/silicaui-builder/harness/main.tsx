import "./styles.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Builder } from "@wizeworks/silicaui-builder/react";
import type { BuilderHost } from "@wizeworks/silicaui-builder/react";
import { EmailBuilder } from "@wizeworks/silicaui-builder/email/react";
import type { EmailBuilderHost } from "@wizeworks/silicaui-builder/email/react";
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
  }),
  dataSources: () => [
    { key: "site.title", label: "Site title", cardinality: "scalar" },
    {
      key: "products",
      label: "Products",
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
      defaultClass: "inline-block",
      defaultProps: { amount: 9.99, currency: "USD" },
      props: [
        { name: "amount", label: "Amount", type: "number" },
        { name: "currency", label: "Currency", type: "select", options: [{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }] },
      ],
    },
    { name: "CheckoutWidget", label: "Checkout", category: "Commerce", pinned: true, defaultClass: "block" },
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
    return (
      <div data-testid="host-checkout" className="rounded-box border border-base-300 p-4 text-center text-sm">
        Live checkout widget{ctx.preview ? " (preview)" : ""}
      </div>
    );
  },
  // Fixed sample data, resolved SYNCHRONOUSLY (§3 of builder-contract.md) — a
  // real host would fetch once, up front, into a closure this reads from.
  resolveBinding: (ref) =>
    ref === "site.title" ? { value: "Acme Storefront", label: "Site title" } : { value: undefined, visible: false },
  resolveCollection: (ref) => (ref === "products" ? ["Widget", "Gadget", "Gizmo"] : []),
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
    if (ref === "product.title") return { value: (scope.item as { title: string } | undefined)?.title };
    if (ref === "product.price") return { value: (scope.item as { price: string } | undefined)?.price };
    return { value: undefined, visible: false };
  },
  resolveCollection: (ref) =>
    ref === "products" ? [{ title: "Widget", price: "$12" }, { title: "Gadget", price: "$24" }, { title: "Gizmo", price: "$36" }] : [],
};

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
};
bus.__changeCount = 0;

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

const root = createRoot(document.getElementById("app") as HTMLElement);
if (editorMode === "email") {
  root.render(
    <React.StrictMode>
      <EmailBuilder
        theme={theme}
        host={emailHost}
        persistKey={persist ? "silicaui-designer-email" : null}
        onChange={(project) => {
          bus.__lastChange = project;
          bus.__changeCount += 1;
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
      />
    </React.StrictMode>,
  );
} else {
  root.render(
    <React.StrictMode>
      <Builder
        document={stamp(heroSplitCta, theme)}
        host={host}
        persistKey={persistKey}
        onChange={(site) => {
          bus.__lastChange = site;
          bus.__changeCount += 1;
        }}
        onActivePageChange={(page) => {
          bus.__activePage = page;
        }}
        onPublish={(payload) => {
          bus.__published = payload;
        }}
        toolbarSlot={
          <span data-testid="toolbar-slot" className="text-xs text-base-content/50 px-1">
            Demo host UI
          </span>
        }
      />
    </React.StrictMode>,
  );
}

// Signal readiness for Playwright.
bus.__ready = true;
