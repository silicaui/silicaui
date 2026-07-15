/**
 * The authoring kit (architecture spec §4). A tiny, closed helper set so blocks
 * are readable and every node is well-formed by construction. Authoring happens
 * in this neutral form (never JSX) so all three projections stay faithful.
 */
import type {
  BehaviorMarker,
  BehaviorRole,
  Child,
  ComponentNode,
  ElementNode,
  HostNode,
  Node,
  OutletNode,
  SlotDef,
  Template,
} from "./schema";
import { walk } from "./tree";
import { assertBlockClean } from "./lint";

/** A node that can carry system metadata (everything except `Outlet`). */
type MarkableNode = ElementNode | ComponentNode;

/** Build a raw element node. `text` is sugar for a single string child. */
export function el(
  tag: string,
  cls?: string,
  opts?: { text?: string; attrs?: ElementNode["attrs"]; children?: Child[] },
): ElementNode {
  const node: ElementNode = { kind: "element", tag };
  if (cls) node.class = cls;
  if (opts?.attrs) node.attrs = opts.attrs;
  const children =
    opts?.children ?? (opts?.text != null ? [opts.text] : undefined);
  if (children) node.children = children;
  return node;
}

/** Build a @wizeworks/silicaui component atom node. */
export function atom(
  component: string,
  cls?: string,
  props?: ComponentNode["props"],
  children?: Child[],
): ComponentNode {
  const node: ComponentNode = { kind: "component", component };
  if (cls) node.class = cls;
  if (props) node.props = props;
  if (children) node.children = children;
  return node;
}

/** The reserved `Outlet` node — valid only inside a `Frame`. */
export function outlet(): OutletNode {
  return { kind: "outlet" };
}

/** Build a host-node mount point for a live host component (spec §A). A leaf —
 *  `component` is the host's opaque allowlist key, `props` its author-set config. */
export function host(component: string, cls?: string, props?: HostNode["props"]): HostNode {
  const node: HostNode = { kind: "host", component };
  if (cls) node.class = cls;
  if (props) node.props = props;
  return node;
}

/** Mark a node as an editable region. Mutates and returns it for inline use. */
export function slot<T extends MarkableNode>(node: T, def: SlotDef): T {
  node.slot = def;
  return node;
}

/** Mark a node as a behavior ROOT. */
export function behave<T extends MarkableNode>(
  node: T,
  marker: BehaviorMarker,
): T {
  node.behavior = marker;
  return node;
}

/** Mark a node as a structural PART of an ancestor behavior. */
export function part<T extends MarkableNode>(node: T, role: BehaviorRole): T {
  node.part = role;
  return node;
}

/** Bind a resolved value into a node (fills its primary content). */
export function bind<T extends MarkableNode>(node: T, ref: string): T {
  node.data = { kind: "value", ref };
  return node;
}

/** Mark a container to repeat once per collection item. */
export function repeat<T extends MarkableNode>(node: T, ref: string): T {
  node.data = { kind: "collection", ref };
  return node;
}

/** Mark a node as a host-action trigger. */
export function action<T extends MarkableNode>(
  node: T,
  ref: string,
  href?: string,
): T {
  node.data =
    href != null ? { kind: "action", ref, href } : { kind: "action", ref };
  return node;
}

// ---------------------------------------------------------------------------
// Block assembly + validation
// ---------------------------------------------------------------------------

/** The flat index of every declared slot, in document order. */
export function collectSlots(root: Node): SlotDef[] {
  const out: SlotDef[] = [];
  walk(root, (n) => {
    if (n.kind !== "outlet" && n.slot) out.push(n.slot);
  });
  return out;
}

/** Author-time structural validation: a template is id-free and Outlet-free. */
export function validateBlockTree(root: Node): void {
  walk(root, (n) => {
    if (n.kind === "outlet") {
      throw new Error(
        "A block/template may not contain an Outlet node (Outlet is Frame-only).",
      );
    }
    if (n.id != null) {
      throw new Error(
        `A template must be id-free; found id="${n.id}". Ids are minted at stamp time.`,
      );
    }
  });
}

/** The authored unit: a manifest whose `slots` index is derived from the tree. */
export type BlockInput = Omit<Template, "slots">;

/**
 * Assemble and validate a block. Fails at module load (not at a consumer's stamp
 * time) if the tree is malformed: structural validation (id-free, Outlet-free),
 * a derived slot index, then the class linter (§6.3) so a conformant block is
 * guaranteed to pass a host gate.
 */
export function block(input: BlockInput): Template {
  validateBlockTree(input.root);
  const tpl: Template = { ...input, slots: collectSlots(input.root) };
  assertBlockClean(tpl);
  return tpl;
}
