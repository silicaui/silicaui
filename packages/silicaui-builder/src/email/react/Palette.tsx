/**
 * The email Insert palette (left rail). Unlike the site palette, the email
 * catalog is small and closed (8 fixed block kinds — a few, like columns, get
 * more than one preset), so there's no search box — but it IS both a click
 * target (inserts relative to the current selection, same placement rule as
 * the site engine's `insertRelative`) and a drag source (drop precisely onto
 * the canvas), matching the site palette's interaction model. A Saved section
 * (any block the Inspector's "Save as block" wrote) sits above the catalog,
 * mirroring the site palette's Components section.
 *
 * STYLING RULE (hard): Tailwind utilities + @wizeworks/silicaui classes + baked <Icon> only.
 */
import * as React from "react";
import { useEmailEditor, useEmailSelectedNode } from "./editor-context";
import { Icon } from "../../shared/react/Icon";
import { EMAIL_PALETTE } from "../palette";
import type { EmailPaletteItem } from "../palette";
import { nodeName } from "../node-display";
import { DRAG_MIME, encodeDrag } from "../../shared/dnd";
import { useSavedBlocks } from "./saved-blocks";
import type { SavedBlock } from "./saved-blocks";

function ItemRow({ item }: { item: EmailPaletteItem }) {
  const editor = useEmailEditor();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm w-full justify-start gap-2 font-normal"
      title={item.hint}
      draggable
      data-insert-key={item.key}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_MIME, encodeDrag({ kind: "insert", key: item.key }));
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => editor.insertRelative(item.make(editor.colorDefaults))}
    >
      <Icon name={item.icon} className="text-base-content/55" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

/** A saved-block row: click inserts a fresh copy (re-stamped ids, no live
 *  link back to this saved entry — see `saved-blocks.ts`'s doc comment for
 *  why that's the right model for email, unlike the site builder's symbols).
 *  Drag drops it at a precise canvas spot; hover reveals rename/delete. */
function SavedBlockRow({ block }: { block: SavedBlock }) {
  const editor = useEmailEditor();
  const { remove, rename } = useSavedBlocks();
  return (
    <div className="group flex items-center gap-0.5 rounded-btn hover:bg-base-200">
      <button
        type="button"
        className="btn btn-ghost btn-sm flex-1 min-w-0 justify-start gap-2 font-normal hover:bg-transparent"
        draggable
        data-insert-key={`saved:${block.id}`}
        title={`Insert "${block.name}"`}
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_MIME, encodeDrag({ kind: "insert", key: `saved:${block.id}` }));
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() => editor.insertRelative(structuredClone(block.node))}
      >
        <Icon name="saved" className="text-secondary" />
        <span className="truncate">{block.name}</span>
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-xs flex-none opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Rename"
        onClick={() => {
          const name = window.prompt("Rename saved block", block.name);
          if (name) rename(block.id, name);
        }}
      >
        <Icon name="pencil" />
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-xs flex-none text-error opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Delete saved block"
        onClick={() => remove(block.id)}
      >
        <Icon name="trash" />
      </button>
    </div>
  );
}

function SavedBlocksSection() {
  const { blocks } = useSavedBlocks();
  if (blocks.length === 0) return null;
  return (
    <section className="flex flex-col gap-0.5">
      <h3 className="px-2.5 pb-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/40">Saved</h3>
      {blocks.map((b) => (
        <SavedBlockRow key={b.id} block={b} />
      ))}
    </section>
  );
}

/** A one-line reminder of where the next click-insert will land. */
function TargetHint() {
  const selected = useEmailSelectedNode();
  const where = selected ? nodeName(selected) : "the email";
  return (
    <p className="px-2.5 pb-1 text-xs text-base-content/45">
      Inserts into <span className="font-medium text-base-content/70">{where}</span>.
    </p>
  );
}

export function EmailPalette() {
  return (
    <div className="flex flex-col gap-3 px-1.5 py-2">
      <TargetHint />
      <SavedBlocksSection />
      <section className="flex flex-col gap-0.5">
        {EMAIL_PALETTE.map((item) => (
          <ItemRow key={item.key} item={item} />
        ))}
      </section>
    </div>
  );
}
