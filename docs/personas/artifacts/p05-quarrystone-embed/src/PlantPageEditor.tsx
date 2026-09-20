/**
 * The one route in Quarrystone that embeds the builder.
 *
 * Everything around it is ours: our nav, our theme, our save indicator. The
 * builder fills the panel it is given and nothing else.
 */
import * as React from "react";
import { Builder } from "@wizeworks/silicaui-builder/react";
import type { BuilderHandle, Op, OpMeta, Peer, PublishPayload } from "@wizeworks/silicaui-builder/react";
import type { Site } from "@wizeworks/silicaui-html";
import { quarrystoneHost, COMPLIANCE_CERT, PLANT_STATS, PRICE_ENQUIRY } from "./quarrystone-host";
import { HOGANAS, setSignedInAccount } from "./host-nodes";
import { subscribe, type QuarrystoneEditor } from "./presence";

/** Our own store. Deliberately separate from the builder's crash recovery — one
 *  of the questions this evaluation has to answer is whether that recovery is
 *  genuinely independent of us. */
export interface SaveState {
  status: "clean" | "saving" | "saved" | "failed";
  at?: number;
  ops: number;
  seq?: number;
}

/** Everything our relay has sent since this tab opened. */
const opLog: Op[] = [];
/** The last thing Publish handed us, for our deploy step to pick up. */
const lastPublish: { value: PublishPayload | undefined } = { value: undefined };

declare global {
  interface Window {
    __quarrystone?: {
      ops: Op[];
      extract: () => Site | undefined;
      applyRemoteOps: (ops: readonly Op[]) => { applied: number; dropped: Op[] } | undefined;
      resync: (site: Site, seq: number) => void;
      setSignal: (ok: boolean) => void;
      storeKey: string;
      lastPublish: () => PublishPayload | undefined;
      setDraft: (name: string) => void;
      signIn: (account: string) => void;
    };
  }
}

const STORE_KEY = "quarrystone:plant-page";

/** A switch the evaluation can flip: when this is on, every save fails, the way
 *  a van on bad signal fails. */
export let failEveryStore = false;
export function setFailEveryStore(v: boolean) {
  failEveryStore = v;
}

async function putToOurBackend(site: Site, key: string): Promise<void> {
  if (failEveryStore) throw new Error("no signal");
  window.localStorage.setItem(key, JSON.stringify(site));
}

function loadFromOurBackend(key: string): Site | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Site) : undefined;
  } catch {
    return undefined;
  }
}

/** The plant's product list. Ours only in the sense that we seeded it — this is
 *  author content, freely editable, which is exactly why it is the block we hand
 *  to a second editor to hold. */
const PRODUCTS: readonly (readonly [string, string, string])[] = [
  ["product-makadam", "Makadam 8–16 mm", "189 kr/ton"],
  ["product-stenmjol", "Stenmjöl 0–4 mm", "142 kr/ton"],
  ["product-bergkross", "Bergkross 0–32 mm", "118 kr/ton"],
  ["product-singel", "Singel 16–32 mm", "205 kr/ton"],
];

function productList() {
  return {
    id: "block-products",
    kind: "element" as const,
    tag: "ul",
    className: "flex flex-col gap-2",
    children: PRODUCTS.map(([id, name, price]) => ({
      id,
      kind: "element" as const,
      tag: "li",
      className: "flex justify-between gap-4 text-base text-base-content",
      children: [`${name} · ${price}`],
    })),
  };
}

/** A blank plant page, seeded with our three blocks so the evaluation always
 *  starts with something to attack. */
function seed(): Site {
  const host = (component: string, id: string) => ({
    id,
    kind: "host" as const,
    component,
    props: { plantId: HOGANAS.id },
    ...(component === PRICE_ENQUIRY ? {} : { locked: "host" as const }),
  });
  return {
    version: "1",
    theme: { name: "quarrystone", tokens: {} },
    pages: [
      {
        id: "page-hoganas",
        name: HOGANAS.name,
        slug: "/hoganas-angelholmsvagen",
        root: {
          id: "root",
          kind: "element",
          tag: "div",
          className: "flex flex-col gap-6 p-8",
          children: [
            {
              id: "hero",
              kind: "element",
              tag: "h1",
              className: "text-3xl font-bold text-base-content",
              children: [HOGANAS.name],
            },
            productList(),
            host(COMPLIANCE_CERT, "block-compliance"),
            host(PLANT_STATS, "block-stats"),
            host(PRICE_ENQUIRY, "block-enquiry"),
          ],
        },
      },
    ],
  } as unknown as Site;
}

/**
 * `instance` names a SECOND copy on the same screen. Two editors on one page
 * must not share a store key, a recovery draft or a rail-width memory, and the
 * only way to find that out is to open two.
 */
export function PlantPageEditor({ instance }: { instance?: string } = {}) {
  const storeKey = instance ? `${STORE_KEY}:${instance}` : STORE_KEY;
  // Which draft this editor is writing. It CHANGES while the editor is open:
  // an author switching from one plant page to another keeps the same mounted
  // editor, and the draft has to move with them.
  const [draft, setDraft] = React.useState("default");
  // Re-render when our auth changes, so the host nodes resolve against the new
  // account rather than showing the last one's data until something else moves.
  const [, setSignedIn] = React.useState("acct-hoganas");
  const persistKey = instance
    ? `quarrystone:plant-page:recovery:${instance}`
    : `quarrystone:plant-page:recovery${draft === "default" ? "" : `:${draft}`}`;
  const handle = React.useRef<BuilderHandle | null>(null);
  const [save, setSave] = React.useState<SaveState>({ status: "clean", ops: 0 });
  // Read once, at mount. `document` is a seed, not a controlled prop.
  const [initial] = React.useState<Site>(() => loadFromOurBackend(storeKey) ?? seed());

  // Our presence channel, handed straight to the builder. We pass the whole
  // roster on every change because that is what the prop asks for and what our
  // socket already sends; the engine diffs it, so a heartbeat carrying no news
  // costs nothing.
  const [others, setOthers] = React.useState<readonly QuarrystoneEditor[]>([]);
  React.useEffect(() => subscribe(setOthers), []);
  const peers = React.useMemo<readonly Peer[]>(
    () => others.map((e) => ({ id: e.id, name: e.name, color: e.color, selection: e.selection, claim: e.claim })),
    [others],
  );

  const onChange = React.useCallback((site: Site, ops: readonly Op[], meta: OpMeta) => {
    // The op stream is what our relay sends to the other person in the page.
    // We keep it because we have to: the document goes to storage, the ops go
    // to the socket, and they are not the same thing.
    opLog.push(...ops.map((o) => ({ ...o })));
    setSave((s) => ({ status: "saving", ops: s.ops + ops.length, seq: meta.baseSeq }));
    // Everything the host owns: its own debounce, its own retries, its own
    // failure state. The builder is told nothing about any of it.
    void putToOurBackend(site, storeKey).then(
      () => setSave((s) => ({ ...s, status: "saved", at: Date.now() })),
      () => setSave((s) => ({ ...s, status: "failed" })),
    );
  }, [storeKey]);

  // The seam our own integration tests drive - the relay and the document, the
  // two things our server touches. Nothing the builder needs; everything we do.
  React.useEffect(() => {
    // Only the primary editor claims the seam. Two of them fighting over one
    // global would make every check on this page read whichever mounted last.
    if (instance) return;
    window.__quarrystone = {
      ops: opLog,
      extract: () => handle.current?.extract(),
      applyRemoteOps: (ops: readonly Op[]) => handle.current?.applyRemoteOps(ops),
      // Our server is authoritative. When it says "this is the page", we say so
      // to the builder and let it discard whatever local lineage it had.
      resync: (site: Site, seq: number) => handle.current?.replaceState(site, seq),
      // The van going into a tunnel. Every save fails from here on.
      setSignal: (ok: boolean) => setFailEveryStore(!ok),
      storeKey,
      lastPublish: () => lastPublish.value,
      setDraft,
      // Our own auth, not the builder's. It has never been told who is signed
      // in and it must never need to be.
      signIn: (account: string) => {
        setSignedInAccount(account);
        setSignedIn(account);
      },
    };
  }, [instance, storeKey]);

  // Publish hands us the structured site AND every page composed to production
  // HTML. Our pipeline (publish.mjs) fills the host mount points and writes the
  // files; nothing of ours runs on the page a customer opens.
  const onPublish = React.useCallback((payload: PublishPayload) => {
    lastPublish.value = payload;
    setSave((s) => ({ ...s, status: "saved", at: Date.now() }));
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <WhoIsHere others={others} />
      <div className="flex-1 min-h-0 overflow-hidden rounded-box border border-base-300 bg-base-100">
        <Builder
          ref={handle}
          document={initial}
          peers={peers}
          host={quarrystoneHost}
          studioTheme="quarrystone-studio"
          persistKey={persistKey}
          onChange={onChange}
          onPublish={onPublish}
          toolbarSlot={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                const site = handle.current?.extract();
                if (site) window.alert(`Sent ${site.pages.length} page(s) for compliance review.`);
              }}
            >
              Send for review
            </button>
          }
          toolbarStatusSlot={<SaveIndicator state={save} />}
        />
      </div>
    </div>
  );
}

/** Our own presence strip. It is Quarrystone chrome, not builder chrome: we knew
 *  who was in the page before we embedded an editor, and an author should be
 *  able to see that without opening one.
 *
 *  The only inline style here is the identity DOT, for the same reason the
 *  builder's own claim notice paints one: a person's colour is data from our
 *  presence server, not a role in the theme. Everything else is a token. */
function PeerDot({ color }: { color?: string }) {
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color ?? "var(--color-base-content)" }}
      aria-hidden
    />
  );
}

function WhoIsHere({ others }: { others: readonly QuarrystoneEditor[] }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-box border border-base-300 bg-base-100 px-4 py-2 text-sm text-base-content"
      data-testid="quarrystone-presence"
    >
      <span className="font-semibold">I sidan nu</span>
      <span className="flex items-center gap-2">
        <PeerDot color="#0f766e" />
        <span>Arvid Lindqvist (du)</span>
      </span>
      {others.map((e) => (
        <span key={e.id} className="flex items-center gap-2" data-quarrystone-peer={e.id}>
          <PeerDot color={e.color} />
          <span>
            {e.name} — {e.claim?.length ? "redigerar produktlistan" : "tittar"}
          </span>
        </span>
      ))}
      {others.length === 0 && <span>Ingen annan är här just nu.</span>}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const text =
    state.status === "failed"
      ? "Not saved — no signal"
      : state.status === "saving"
        ? "Saving…"
        : state.status === "saved"
          ? `Saved ${new Date(state.at ?? Date.now()).toLocaleTimeString("sv-SE")}`
          : "No changes yet";
  return (
    <span
      data-testid="quarrystone-save"
      className={`text-xs ${state.status === "failed" ? "text-error" : "text-base-content"}`}
    >
      {text}
      {state.ops > 0 && ` · ${state.ops} change${state.ops === 1 ? "" : "s"}`}
    </span>
  );
}
