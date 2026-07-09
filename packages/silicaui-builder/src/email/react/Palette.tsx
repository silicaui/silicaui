/**
 * The email Insert palette (left rail) — click-to-insert only. Unlike the site
 * palette, the email catalog is small and closed (8 fixed block kinds), so
 * there's no search box and no drag source — a click inserts relative to the
 * current selection, same placement rule as the site engine's `insertRelative`.
 *
 * STYLING RULE (hard): Tailwind utilities + @wizeworks/silicaui classes + baked <Icon> only.
 */
import * as React from "react";
import { useEmailEditor, useEmailSelectedNode } from "./editor-context";
import { Icon } from "../../shared/react/Icon";
import { EMAIL_PALETTE } from "../palette";
import type { EmailPaletteItem } from "../palette";
import { nodeName } from "../node-display";

function ItemRow({ item }: { item: EmailPaletteItem }) {
  const editor = useEmailEditor();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm w-full justify-start gap-2 font-normal"
      title={item.hint}
      data-insert-key={item.key}
      onClick={() => editor.insertRelative(item.make())}
    >
      <Icon name={item.icon} className="text-base-content/55" />
      <span className="truncate">{item.label}</span>
    </button>
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
      <section className="flex flex-col gap-0.5">
        {EMAIL_PALETTE.map((item) => (
          <ItemRow key={item.key} item={item} />
        ))}
      </section>
    </div>
  );
}
