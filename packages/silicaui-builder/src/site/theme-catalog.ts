/**
 * The Themes panel's SHELVES — which themes the builder offers as starting
 * points, and where a host's own come from.
 *
 * The library had two tiers, and a platform could reach neither. "This site" is
 * `site.savedThemes`: real document data, the author's own snapshots, one click
 * from deletion, and scoped to one site. The presets shelf was a hard import of
 * `THEME_PRESETS`. So a host embedding the builder across many tenants — with a
 * curated brand catalog it maintains centrally — had nowhere to put it. Seeding
 * `savedThemes` is the wrong shelf twice over: it hands the author a delete
 * button on the platform's brand, and it copies the catalog into every site.
 *
 * This is the third tier, with the same merge semantics as every other host
 * catalog (`catalog()`, `componentStarters()`): `extend` adds, `hide` prunes.
 * Host shelves render ABOVE the shipped presets, and carry no delete affordance
 * — exactly like the shipped shelf, and unlike "This site".
 *
 * NOTE what applying a theme does, because a platform will assume otherwise:
 * the panel deep-copies the chosen theme into `site.theme`. A site that adopts
 * a host preset holds a SNAPSHOT, so later edits to the host's catalog do not
 * propagate to sites already on it. That is deliberate — the author can edit an
 * applied theme, and a live upstream overwrite would silently discard their work
 * mid-session — but a host's own UI must not promise propagation.
 */
import type { Theme } from "@wizeworks/silicaui-html";
import { THEME_PRESETS } from "@wizeworks/silicaui-html";

/** One shelf in the Themes panel: a labeled, apply-only row of themes. */
export interface ThemeGroup {
  /** Stable key — what `hide` matches to drop the whole shelf, and what two
   *  same-keyed `extend` groups merge on. */
  key: string;
  /** The shelf heading, verbatim ("Acme brand", "Seasonal"). */
  label: string;
  themes: readonly Theme[];
}

/** A host's contribution to the Themes panel (`BuilderHost.themes`). Mirrors
 *  `catalog()`: `extend` adds shelves, `hide` prunes shipped preset NAMES or the
 *  shipped shelf KEY — see `themeShelves` for the precedence rules. */
export interface ThemeContribution {
  extend?: ThemeGroup[];
  hide?: string[];
}

/** The shipped shelf's group key — `hide: ["silicaui"]` drops it. */
export const SHIPPED_THEMES_KEY = "silicaui";

/** `hide: ["*"]` drops every SHIPPED shelf, whatever we ship next. The literal
 *  key works too, but only for the shelf that exists today; a white-label host
 *  wants the standing instruction, not a list it has to maintain against us. */
export const HIDE_ALL_SHIPPED = "*";

/** The presets @wizeworks/silicaui ships, as a shelf. */
export function shippedThemeGroups(): ThemeGroup[] {
  return [{ key: SHIPPED_THEMES_KEY, label: "silicaui presets", themes: THEME_PRESETS }];
}

// A theme's `name` IS its `[data-theme]` value and is stored on every site that
// adopts it, so two rows under one name is not a cosmetic duplicate — it's two
// different token bags claiming the same selector. Dropping one silently is the
// exact class of degradation that reads as a mystery later, so say so once.
const warned = new Set<string>();
function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[silicaui-builder] ${message}`);
}

/** Host shelves, de-duplicated by theme name (first shelf wins), same-key groups
 *  merged — plus the name→shelf-label index the shipped filter shadows against. */
function hostShelves(extend?: readonly ThemeGroup[]): { groups: ThemeGroup[]; claimed: Map<string, string> } {
  const claimed = new Map<string, string>();
  const byKey = new Map<string, { key: string; label: string; themes: Theme[] }>();
  const order: string[] = [];

  for (const group of extend ?? []) {
    let shelf = byKey.get(group.key);
    if (!shelf) {
      shelf = { key: group.key, label: group.label, themes: [] };
      byKey.set(group.key, shelf);
      order.push(group.key);
    }
    for (const theme of group.themes) {
      const owner = claimed.get(theme.name);
      if (owner !== undefined) {
        warnOnce(
          `host:${theme.name}`,
          `host theme "${theme.name}" is declared more than once (kept the one under "${owner}", dropped the copy under "${group.label}") — ` +
            `a theme name is its [data-theme] value, so two cannot coexist.`,
        );
        continue;
      }
      claimed.set(theme.name, group.label);
      shelf.themes.push(theme);
    }
  }

  return {
    groups: order.map((k) => byKey.get(k)!).filter((g) => g.themes.length > 0),
    claimed,
  };
}

/**
 * The full set of apply-only shelves for the Themes panel: the host's own first,
 * then whatever it left of the shipped presets.
 *
 * Precedence, in the order it resolves:
 *
 *  1. `hide` prunes SHIPPED entries only — a preset by `name`, the whole shelf by
 *     `key`, or `"*"` for every shipped shelf. It never touches the host's own
 *     `extend` (following `mergeCatalog`, not `applyStarterHide`): a white-label
 *     host passing `hide: ["*"]` means "only mine", and having that erase its own
 *     catalog would be an absurd reading. A host that doesn't want one of its own
 *     themes simply doesn't pass it.
 *  2. A host theme SHADOWS a shipped preset of the same name — host wins, the
 *     shipped one is dropped and logged. Deliberate: a platform naming its theme
 *     `quartz` is overriding ours, and rendering both would put two token bags
 *     under one `[data-theme]`.
 *  3. Shelves left empty fall away, so an emptied group never renders a bare
 *     heading.
 *
 * "This site" (`site.savedThemes`) is NOT here — it's document data the panel
 * reads from the engine, and the only shelf that can be edited or deleted.
 */
export function themeShelves(contribution?: ThemeContribution): ThemeGroup[] {
  const { groups: host, claimed } = hostShelves(contribution?.extend);
  const hidden = new Set(contribution?.hide ?? []);
  if (hidden.has(HIDE_ALL_SHIPPED)) return host;

  const shipped = shippedThemeGroups()
    .filter((g) => !hidden.has(g.key))
    .map((g) => ({
      ...g,
      themes: g.themes.filter((t) => {
        if (hidden.has(t.name)) return false;
        const owner = claimed.get(t.name);
        if (owner === undefined) return true;
        warnOnce(
          `shadow:${t.name}`,
          `host theme "${t.name}" (shelf "${owner}") shadows the shipped preset of the same name — ` +
            `the shipped one is hidden. Rename either if you meant to offer both.`,
        );
        return false;
      }),
    }))
    .filter((g) => g.themes.length > 0);

  return [...host, ...shipped];
}
