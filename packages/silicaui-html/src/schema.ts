/**
 * The silicaui node schema (architecture spec §3).
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
  /** The ONLY styling surface: silicaui component classes + the allowed utility
   *  subset. A host gates these. No inline style, ever. */
  class?: string;
  children?: Child[];

  // ── system metadata — typed, and NEVER mixed into attrs/props ──────────────
  /** Dynamic content. At most one binding; the union makes "at most one"
   *  structural. The `ref` is opaque — silicaui never parses it. */
  data?: DataBinding;
  /** Marks this node as an editable region for a builder/host. */
  slot?: SlotDef;
  /** Marks this node as a behavior ROOT. */
  behavior?: BehaviorMarker;
  /** Marks this node as a structural PART of an ancestor behavior. */
  part?: BehaviorRole;
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
  /** A silicaui atom by name: 'Button' | 'Card' | 'Image' | 'Icon' | … */
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
  | { kind: "value"; ref: string } // fill this node from a resolved value
  | { kind: "collection"; ref: string } // render `children` once per item
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
  | "toc";

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
  | "spy";

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

/** A native silicaui theme — a token set applied via `[data-theme]` (§5). */
export interface Theme {
  /** The `[data-theme]` value applied to the canvas/site root. */
  name: string;
  /** Base (light) tokens: --color-*, --color-*-content, --radius-*, --size-*, … */
  tokens: Record<string, string>;
  /** Per-mode override deltas for dark. */
  dark?: Record<string, string>;
  /** Which mode this expresses; either is renderable. */
  mode?: "light" | "dark";
}

/** Optional surrounding layout: a tree containing exactly one `Outlet` (§9.7). */
export interface Frame {
  root: Node;
  editable: boolean;
}

/** A live, editable, themed document — what loads into and extracts from the builder. */
export interface Document {
  version: string;
  /** The editable tree — ids present. */
  root: Node;
  theme: Theme;
  frame?: Frame;
}
