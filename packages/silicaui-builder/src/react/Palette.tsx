/**
 * The Insert palette (left rail, "Insert" tab in Page/Layout mode) — the
 * click-to-insert / drag-to-insert surface. Grouped primitives + composed blocks;
 * a row is both a button (click → insert relative to the current selection) and a
 * native drag source (drag → drop onto the canvas at a precise spot). The engine
 * resolves *where* a click lands; the Canvas resolves *where* a drop lands.
 *
 * STYLING RULE (hard): Tailwind utilities + silicaui classes + baked <Icon> only.
 */
import * as React from "react";
import { useEditor, useSelectedNode } from "./editor-context";
import { Icon } from "./Icon";
import { paletteGroups } from "../palette";
import type { PaletteItem } from "../palette";
import { nodeName } from "../node-display";
import { DRAG_MIME, encodeDrag } from "../dnd";

const GROUPS = paletteGroups();

function ItemRow({ item }: { item: PaletteItem }) {
  const editor = useEditor();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm w-full justify-start gap-2 font-normal"
      draggable
      title={item.hint}
      data-insert-key={item.key}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_MIME, encodeDrag({ kind: "insert", key: item.key }));
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => editor.insertRelative(item.make())}
    >
      <Icon name={item.icon} className="text-base-content/55" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

/** A one-line reminder of where the next click-insert will land. */
function TargetHint() {
  const selected = useSelectedNode();
  const where = selected ? nodeName(selected) : "the page";
  return (
    <p className="px-2.5 pb-1 text-xs text-base-content/45">
      Inserts into <span className="font-medium text-base-content/70">{where}</span>. Drag onto the canvas to place it.
    </p>
  );
}

export function Palette() {
  return (
    <div className="flex flex-col gap-3 px-1.5 py-2">
      <TargetHint />
      {GROUPS.map((group) => (
        <section key={group.key} className="flex flex-col gap-0.5">
          <h3 className="px-2.5 pb-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/40">
            {group.label}
          </h3>
          {group.items.map((item) => (
            <ItemRow key={item.key} item={item} />
          ))}
        </section>
      ))}
    </div>
  );
}
