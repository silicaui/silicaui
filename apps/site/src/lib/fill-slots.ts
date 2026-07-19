import { walk, type Node } from "@wizeworks/silicaui-html";

/**
 * Real content for one slot. A plain string covers "text"/"richtext" slots
 * (and is sugar for a "link" slot's label with no href change). An object
 * covers "link" ({ label?, href? }) and "image" ({ src?, alt? }) slots.
 *
 * "boolean"/"select"/"list" slot types aren't handled yet — no block this
 * site currently composes uses them; add support when one does, rather than
 * guessing at a shape now.
 */
export type SlotValue = string | Record<string, string>;
export type SlotContent = Record<string, SlotValue>;

/** Mirrors silicaui-html's own (unexported) symbol-override text setter: an
 *  element's single string child, or a component's `label` prop (falling
 *  back to `text`). */
function setNodeText(node: Node, text: string): void {
  if (node.kind === "element") {
    node.children = [text];
  } else if (node.kind === "component") {
    const props = { ...(node.props ?? {}) };
    if ("label" in props) props.label = text;
    else props.text = text;
    node.props = props;
  }
}

function setNodeAttr(node: Node, key: string, value: string): void {
  if (node.kind === "component") {
    node.props = { ...(node.props ?? {}), [key]: value };
  } else if (node.kind === "element") {
    node.attrs = { ...(node.attrs ?? {}), [key]: value };
  }
}

/**
 * Write real copy into a freshly-`stamp()`ed block tree, matched by
 * `slot.name` (blocks mark editable spots via `slot()`, see
 * packages/silicaui-html/src/kit.ts — that's builder-panel metadata, not a
 * content-injection path on its own). Mutates `root` in place and returns it,
 * matching `applyOverrides`'s calling convention. A slot with no matching key
 * in `content` is left as the block's own default copy.
 */
export function fillSlots(root: Node, content: SlotContent): Node {
  walk(root, (n) => {
    if (n.kind === "outlet" || !n.slot) return;
    const value = content[n.slot.name];
    if (value === undefined) return;

    switch (n.slot.type) {
      case "text":
      case "richtext":
        if (typeof value === "string") setNodeText(n, value);
        break;
      case "link": {
        const v = typeof value === "string" ? { label: value } : value;
        if (v.label != null) setNodeText(n, v.label);
        if (v.href != null) setNodeAttr(n, "href", v.href);
        break;
      }
      case "image": {
        if (typeof value === "object") {
          if (value.src != null) setNodeAttr(n, "src", value.src);
          if (value.alt != null) setNodeAttr(n, "alt", value.alt);
        }
        break;
      }
      default:
        // "boolean" / "select" / "list" (repeatable) — not needed yet.
        break;
    }
  });
  return root;
}
