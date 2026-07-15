/**
 * The @wizeworks/silicaui node schema (architecture spec §3).
 *
 * One shape everywhere: a template, a live document, a stored record, and the
 * input to every projection are all built from `Node`. JSON-serializable, no
 * functions. The design deliberately separates *what a node is* (element vs
 * component, its own props) from *system metadata* (data bindings, editable
 * slots, behavior markers) — the metadata is typed and top-level, never smuggled
 * through `props`/`attrs`.
 */

/** A block/document tree is built from these. */
export type Node = ElementNode | ComponentNode | OutletNode;

/** A child is another node, or a plain string (a text node). */
export type Child = Node | string;

interface NodeBase {
  /** GLOBALLY-UNIQUE instance id. Present on DOCUMENT nodes (selection, keys,
   *  dnd); ABSENT on template/block nodes. Minted at stamp/duplicate/paste. */
  id?: string;
  /** Builder-only layer name shown in the Navigator (user-renamable). Authoring
   *  metadata — ignored by every projection. */
  label?: string;
  /** The ONLY styling surface: @wizeworks/silicaui component classes + the allowed utility
   *  subset. A host gates these. No inline style, ever. */
  class?: string;
  children?: Child[];
  /**
   * RENDER-TIME-ONLY trusted inner HTML, emitted UNESCAPED by `toHtml` in place
   * of `children`. It is NOT part of the authored/persisted schema and must never
   * be hand-authored: `resolveTree` sets it from an `html` data binding, whose
   * value the HOST is responsible for sanitizing at its data boundary (same trust
   * model as React's `dangerouslySetInnerHTML` / Vue's `v-html`). This is the one
   * sanctioned bypass of the raw-element floor, gated behind an explicit binding a
   * host opts into per-field — the CMS long-form / rich-text content path. */
  rawHtml?: string;

  // ── system metadata — typed, and NEVER mixed into attrs/props ──────────────
  /** Dynamic content. At most one binding; the union makes "at most one"
   *  structural. The `ref` is opaque — @wizeworks/silicaui never parses it. */
  data?: DataBinding;
  /** Marks this node as an editable region for a builder/host. */
  slot?: SlotDef;
  /** Marks this node as a behavior ROOT. */
  behavior?: BehaviorMarker;
  /** Marks this node as a structural PART of an ancestor behavior. */
  part?: BehaviorRole;
  /** This node is an INSTANCE of a reusable symbol (a user-saved component). It
   *  holds no meaningful children of its own — at render it EXPANDS to a fresh
   *  clone of `symbols[instanceOf].root`, so editing that one master propagates to
   *  every instance. `flattenSymbols` inlines it for output; the projection itself
   *  stays symbol-agnostic. */
  instanceOf?: string;
  /** Per-INSTANCE overrides, keyed by the MASTER node's (stable) id. Applied over
   *  the expanded master clone, so this instance can differ from its siblings
   *  without detaching; an overridden field is NOT overwritten by a later master
   *  edit. Only meaningful on an instance node (`instanceOf` set). */
  overrides?: Record<string, NodeOverride>;
}

/** What a single instance overrides on one master node. Extensible; text is the
 *  common case (a heading, paragraph, or button label per instance). */
export interface NodeOverride {
  /** Replacement primary text (element text, or a component's label/text). */
  text?: string;
  /** Replacement component props, shallow-merged over the master's (component nodes). */
  props?: Record<string, unknown>;
}

export interface ElementNode extends NodeBase {
  kind: "element";
  /** 'div' | 'section' | 'nav' | 'h1' | 'a' | 'img' | … */
  tag: string;
  /** Whitelisted HTML attributes only. */
  attrs?: Record<string, string | number | boolean>;
}

export interface ComponentNode extends NodeBase {
  kind: "component";
  /** A @wizeworks/silicaui atom by name: 'Button' | 'Card' | 'Image' | 'Icon' | … */
  component: string;
  /** The component's OWN typed API. */
  props?: Record<string, unknown>;
}

/** Reserved structural node — valid ONLY inside a `Frame` (§9.7). */
export interface OutletNode {
  kind: "outlet";
}

/** The three opaque dynamic-content primitives (§8). */
export type DataBinding =
  | { kind: "value"; ref: string; attr?: string } // fill this node from a resolved value; `attr` targets a specific attribute/prop (e.g. "href") instead of the auto-detected primary slot
  | { kind: "html"; ref: string } // fill this node's inner content from a resolved TRUSTED HTML string (rich text / CMS long-form) — the host sanitizes the value; emitted unescaped via `rawHtml`. The one raw-HTML content path.
  | { kind: "collection"; ref: string; omitWhenEmpty?: boolean } // render `children` once per item; `omitWhenEmpty` drops the node entirely (like `visible: false`) instead of the default one-placeholder-item convention when the collection resolves to zero items
  | { kind: "action"; ref: string; href?: string }; // triggers a host action

export interface SlotDef {
  name: string;
  type:
    | "text"
    | "richtext"
    | "image"
    | "icon"
    | "link"
    | "boolean"
    | "select"
    | "list";
  label?: string;
  required?: boolean;
  repeatable?: { min?: number; max?: number; of: SlotDef[] };
}

export interface BehaviorMarker {
  type: BehaviorType;
  params?: Record<string, unknown>;
}

export type BehaviorType =
  | "carousel"
  | "disclosure"
  | "tabs"
  | "menu"
  | "marquee"
  | "scrollspy"
  | "counter"
  | "dismiss"
  | "toc"
  | "form"
  | "sidebar"
  | "selection-list"
  | "modal"
  | "popover"
  | "combobox"
  | "date-segment"
  | "pin-input"
  | "calendar"
  | "tree"
  | "wizard"
  | "number-field"
  | "toggle-group"
  | "scroll-area"
  | "overflow-list"
  | "dropzone"
  | "slider"
  | "switch"
  | "rating"
  | "theme-toggle"
  | "phone-input"
  | "reveal";

export type BehaviorRole =
  | "track"
  | "slide"
  | "prev"
  | "next"
  | "dot"
  | "dots"
  | "trigger"
  | "panel"
  | "item"
  | "tab"
  | "spy"
  | "backdrop"
  | "close"
  | "search"
  | "segment"
  | "cell"
  | "grid"
  | "day"
  | "title"
  | "node"
  | "toggle"
  | "step"
  | "increment"
  | "decrement"
  | "thumb"
  | "input"
  | "list"
  | "country";

/** An authored, id-free, reusable template (a block or a user-saved component). */
export interface Template {
  key: string;
  name: string;
  category: string;
  version: string;
  description: string;
  tags?: string[];
  /** Named theme colors the tree references — a host validates they exist. */
  colors: string[];
  /** Behaviors the tree uses; [] if static. */
  behaviors: BehaviorType[];
  /** Obeys the email-degradable subset (a host email renderer's concern). */
  emailEligible: boolean;
  /** Flat index of every editable region, derived from the tree. */
  slots: SlotDef[];
  /** Exactly one, id-free. */
  root: Node;
  preview?: { thumb?: string; note?: string };
}

/**
 * A reusable component saved from the canvas: a named, id-carrying master tree
 * that INSTANCE nodes (`instanceOf`) render. Editing the master updates every
 * instance. Site-scoped (shared across all pages + the frame) — stored in
 * `Site.symbols`, keyed by `id`.
 */
export interface SymbolDef {
  /** Stable symbol id — the value an instance node's `instanceOf` references. */
  id: string;
  /** Human name shown in the Components palette + instance chrome. */
  name: string;
  /** The master tree (ids present — it's editable like any page/frame tree). */
  root: Node;
}

/** Which webfont (if any) a theme's `--font-sans`/`--font-head` token was built
 *  from — purely a provenance signal for a publish-time self-hosting step; the CSS
 *  stack string in `tokens` is what actually renders, this is never read by `toHtml`. */
export interface ThemeFontSelection {
  /** The catalog family name, e.g. "Inter" — or a pinned system label like "System". */
  family: string;
  source: "system" | "google";
  /** Weights to load/self-host, e.g. [400, 600, 700]. Absent for a system source. */
  weights?: number[];
}

/** A native @wizeworks/silicaui theme — a token set applied via `[data-theme]` (§5). */
export interface Theme {
  /** The `[data-theme]` value applied to the canvas/site root. */
  name: string;
  /** Base (light) tokens: --color-*, --color-*-content, --radius-*, --size-*, … */
  tokens: Record<string, string>;
  /** Per-mode override deltas for dark. */
  dark?: Record<string, string>;
  /** Which mode this expresses; either is renderable. */
  mode?: "light" | "dark";
  /** Which webfont each font token was picked from, when it's a Google Font — absent
   *  for a system-stack pick or an untouched/legacy theme. See `ThemeFontSelection`. */
  fonts?: { sans?: ThemeFontSelection; head?: ThemeFontSelection };
}

/** Optional surrounding layout: a tree containing exactly one `Outlet` (§9.7). */
export interface Frame {
  root: Node;
  editable: boolean;
}

/** A live, editable, themed document — one page's tree in its theme/frame context.
 *  This is the unit a projection (`toHtml`) turns into a single HTML page. A
 *  multi-page site is a `Site`; each of its pages projects THROUGH a Document. */
export interface Document {
  version: string;
  /** The editable tree — ids present. */
  root: Node;
  theme: Theme;
  frame?: Frame;
}

/** One page of a Site: a routable body tree with its own name + slug. The `root`
 *  carries node ids (it's editable); the page `id` is its own space (not a node id). */
export interface Page {
  /** Stable page id — the key the editor switches/removes by (not a node id). */
  id: string;
  /** Human label shown in the page switcher + Navigator. */
  name: string;
  /** Route path, e.g. "/" or "/pricing". Unique within a site. */
  slug: string;
  /** The editable page body — ids present. */
  root: Node;
}

/** A multi-page site: one or more `Page`s sharing a single theme + optional frame.
 *  The shared shell (`frame`) wraps EVERY page; the theme applies site-wide. This
 *  is what the builder loads/extracts once multi-page is in play — each page
 *  projects to its own `Document` (see `pageDocument`) for HTML output/storage. */
export interface Site {
  version: string;
  theme: Theme;
  frame?: Frame;
  /** At least one page; `pages[0]` is the home/default page. */
  pages: Page[];
  /** User-saved reusable components, keyed by symbol id. Instances across any page
   *  or the frame reference these; edit-once-propagate flows from here. */
  symbols?: Record<string, SymbolDef>;
  /** The site's own saved theme presets ("This site" in the Themes panel) —
   *  distinct from the shipped `THEME_PRESETS` starting points, which are never
   *  stored here. A site the author hasn't saved any theme for yet omits this;
   *  the `Editor` seeds it with `[theme]` on load. */
  savedThemes?: Theme[];
}
