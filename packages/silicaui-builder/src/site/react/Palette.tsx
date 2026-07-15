/**
 * The Insert palette (left rail, "Insert" tab in Page/Layout mode) — the
 * click-to-insert / drag-to-insert surface. Grouped primitives + composed blocks;
 * a row is both a button (click → insert relative to the current selection) and a
 * native drag source (drag → drop onto the canvas at a precise spot). The engine
 * resolves *where* a click lands; the Canvas resolves *where* a drop lands.
 *
 * The catalog is large (primitives + forms + nav + data + the whole block
 * library), so the top of the rail is a fuzzy SEARCH box: type a few letters and
 * the groups collapse to a single ranked result list, best match first, Enter to
 * insert it. Search matches label, key, and hint so "cta", "pricing", or "sub"
 * all land their block. Empty query restores the normal grouped browse view.
 *
 * STYLING RULE (hard): Tailwind utilities + @wizeworks/silicaui classes + baked <Icon> only.
 */
import * as React from "react";
import { Input } from "@wizeworks/silicaui-react";
import { useEditor, useSelectedNode, useSymbols } from "./editor-context";
import { useHost } from "./host-context";
import { Icon } from "../../shared/react/Icon";
import { paletteGroups, catalogForHost } from "../palette";
import type { PaletteItem, PaletteGroup } from "../palette";
import { nodeName } from "../node-display";
import { DRAG_MIME, encodeDrag } from "../../shared/dnd";

const DEFAULT_GROUPS = paletteGroups();

/** Every item flattened once, tagged with its group — the search corpus. */
interface FlatItem {
  item: PaletteItem;
  groupLabel: string;
}
const flatten = (groups: readonly PaletteGroup[]): FlatItem[] =>
  groups.flatMap((g) => g.items.map((item) => ({ item, groupLabel: g.label })));

/**
 * Subsequence fuzzy score: `null` when `q`'s characters don't all appear in `t`
 * in order, else a positive score that rewards contiguous runs and word-boundary
 * hits (so "pt" → "**P**ricing **T**iers" beats a scattered match) and gently
 * penalizes long haystacks. Deliberately tiny — no dependency, no index return.
 */
function subseqScore(q: string, t: string): number | null {
  const query = q.toLowerCase();
  const text = t.toLowerCase();
  let qi = 0;
  let score = 0;
  let prev = -2;
  let streak = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] !== query[qi]) continue;
    if (ti === prev + 1) {
      streak += 1;
      score += 6 + streak * 2; // contiguous run — strongly preferred
    } else {
      streak = 0;
      score += 1;
    }
    const before = ti === 0 ? " " : text[ti - 1];
    if (before === " " || before === "-" || before === "_" || before === "/") score += 9; // word start
    prev = ti;
    qi += 1;
  }
  if (qi < query.length) return null; // not every query char matched
  return score - text.length * 0.06;
}

/** Best weighted score across an item's searchable fields, or `null` if no match. */
function scoreItem(q: string, f: FlatItem): number | null {
  const fields: Array<[string | undefined, number]> = [
    [f.item.label, 1],
    [f.item.key.replace(/^block:/, ""), 0.7],
    [f.item.hint, 0.45],
    [f.groupLabel, 0.35],
  ];
  let best: number | null = null;
  for (const [text, weight] of fields) {
    if (!text) continue;
    const s = subseqScore(q, text);
    if (s == null) continue;
    const w = s * weight;
    if (best == null || w > best) best = w;
  }
  return best;
}

function ItemRow({ item, groupLabel }: { item: PaletteItem; groupLabel?: string }) {
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
      {groupLabel && <span className="ml-auto shrink-0 text-xs uppercase tracking-wide text-base-content/35">{groupLabel}</span>}
    </button>
  );
}

/** A saved-symbol row: click inserts an instance, drag drops one at a precise spot,
 *  and hover reveals manage actions (edit the master / delete the component).
 *  Distinct from a catalog `ItemRow` — a symbol inserts through the engine's
 *  instance path (not a static `make()`), so it stays linked to its master.
 *  Deleting is SAFE: it detaches every instance into a real copy (no content loss). */
function SymbolRow({ id, name }: { id: string; name: string }) {
  const editor = useEditor();
  return (
    <div className="group flex items-center gap-0.5 rounded-btn hover:bg-base-200">
      <button
        type="button"
        className="btn btn-ghost btn-sm flex-1 min-w-0 justify-start gap-2 font-normal hover:bg-transparent"
        draggable
        data-insert-key={`symbol:${id}`}
        title={`Insert an instance of ${name}`}
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_MIME, encodeDrag({ kind: "insert", key: `symbol:${id}` }));
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() => editor.insertSymbolInstance(id)}
      >
        <Icon name="box" className="text-secondary" />
        <span className="truncate">{name}</span>
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-xs flex-none opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Edit component"
        data-testid={`symbol-edit:${id}`}
        onClick={() => editor.enterSymbol(id)}
      >
        <Icon name="pencil" />
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-xs flex-none text-error opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Delete component (unlinks every instance)"
        data-testid={`symbol-delete:${id}`}
        onClick={() => editor.deleteSymbol(id)}
      >
        <Icon name="trash" />
      </button>
    </div>
  );
}

/** The Components section — the site's saved reusable components (symbols). */
function ComponentsSection() {
  const symbols = useSymbols();
  if (symbols.length === 0) return null;
  return (
    <section className="flex flex-col gap-0.5">
      <h3 className="px-2.5 pb-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/40">Components</h3>
      {symbols.map((s) => (
        <SymbolRow key={s.id} id={s.id} name={s.name} />
      ))}
    </section>
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
  const editor = useEditor();
  const host = useHost();
  const [query, setQuery] = React.useState("");
  const q = query.trim();

  // Host-merged groups (builder-contract.md §5) + the host's declared host
  // components (spec §A.5) — recomputed only when the host identity changes.
  const GROUPS = React.useMemo(() => catalogForHost(DEFAULT_GROUPS, host), [host]);
  const FLAT = React.useMemo(() => flatten(GROUPS), [GROUPS]);

  // Ranked flat results while searching; recomputed only when the query (or the
  // merged catalog) changes.
  const results = React.useMemo(() => {
    if (!q) return null;
    return FLAT.map((f) => ({ f, score: scoreItem(q, f) }))
      .filter((r): r is { f: FlatItem; score: number } => r.score != null)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.f);
  }, [q, FLAT]);

  return (
    <div className="flex flex-col gap-3 px-1.5 py-2">
      <div className="relative px-1">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/45"
        />
        <Input
          type="search"
          size="sm"
          autoFocus
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            const top = results?.[0];
            if (e.key === "Enter" && top) {
              editor.insertRelative(top.item.make());
            } else if (e.key === "Escape" && query) {
              e.stopPropagation();
              setQuery("");
            }
          }}
          placeholder="Search components…"
          className="w-full pl-8"
          aria-label="Search the insert catalog"
        />
      </div>

      {results ? (
        results.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-xs text-base-content/40">
            No components match “{q}”.
          </p>
        ) : (
          <section className="flex flex-col gap-0.5">
            {results.map((r) => (
              <ItemRow key={r.item.key} item={r.item} groupLabel={r.groupLabel} />
            ))}
          </section>
        )
      ) : (
        <>
          <TargetHint />
          <ComponentsSection />
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
        </>
      )}
    </div>
  );
}
