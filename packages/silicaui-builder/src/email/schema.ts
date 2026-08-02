/**
 * The email document schema — deliberately a CLOSED set of node kinds, unlike the
 * site engine's open element/component tree. Email HTML has no room for arbitrary
 * nesting (it has to survive Outlook's Word rendering engine and Gmail stripping
 * `<style>` blocks), so the vocabulary mirrors what every mainstream email
 * builder converges on: a body of sections, sections and columns both holding
 * `LayoutChild` (a nested columns row, a clickable `link` group, OR bare
 * content — one level of column-in-column nesting is allowed, the common "2x2
 * grid" pattern), content being the leaf kinds.
 *
 * Structural nesting is enforced by TYPES, not runtime validation: a
 * `LayoutChild` can't hold a `ColumnNode` directly (only via `ColumnsNode`), a
 * `ColumnNode` can't hold a `SectionNode`, etc. `engine.ts`'s `canHold` is the
 * single runtime mirror of these rules — keep the two in sync.
 */
import type { DataBinding } from "@wizeworks/silicaui-html";
export type { DataBinding, DataScope, DataSource, ResolveDiagnostic, Resolved } from "@wizeworks/silicaui-html";

export type Align = "left" | "center" | "right";
export type FontWeight = "normal" | "medium" | "semibold" | "bold";

interface BaseNode {
  id: string;
  /**
   * The author's own name for this layer, shown in the Navigator instead of the
   * derived one ("Section", "Columns"). Lets someone tell two identical rows
   * apart — "Order summary" vs "Legal footer" — without opening either.
   *
   * Called `name`, not `label`, because `label` is already a ButtonNode's own
   * TEXT — a content field that ships in the email. These are opposites, and
   * one word cannot mean both. (The site schema, which has no such collision,
   * spells the same idea `Node.label`.)
   *
   * Authoring metadata, exactly like `ord` below: `toEmailHtml` never reads it,
   * so it cannot reach sent markup.
   */
  name?: string;
  /**
   * Fractional ORDERING KEY among siblings — a string chosen to sort strictly
   * between its neighbors (`generateKeyBetween` in `@wizeworks/silicaui-html`).
   * The same mechanism, and the same reasoning, as the site schema's `Node.ord`.
   *
   * `children` order still drives rendering; `ord` is what makes a position
   * transportable in an op. An array index is not a stable address — "insert at
   * 2" resolves differently depending on what else landed first — so two authors
   * inserting into one section would produce a result neither saw.
   *
   * Authoring metadata: `toEmailHtml` never reads it, so it cannot reach sent
   * markup. Backfilled at load by the engine for documents authored before it
   * existed.
   */
  ord?: string;
  /**
   * The SAME dynamic-content marker the site engine's `Node` carries (reused
   * type, not reinvented) — an opaque `{ kind, ref, attr? }` the engine never
   * parses. `value`/`action` are meaningful on any node; `collection` (repeat
   * children once per item) is only meaningful on a node that actually HAS
   * `children` (body/section/columns/column/link) — email's schema can't express a
   * repeat on a leaf content node the way the site's uniform `Node` shape can,
   * since a leaf kind has no `children` slot to repeat. See `resolve.ts`.
   *
   * ONE marker per node is the rule, not an oversight — it is what keeps a
   * binding readable ("this node comes from that field") and what every
   * consumer of `node.data` is written against. A card that needs two per-item
   * values (an image `src` AND a destination) COMPOSES instead of stacking
   * markers: a `LinkNode` binds the `href`, its `ImageNode` child binds the
   * `src`.
   */
  data?: DataBinding;
  /**
   * Structural immutability + its OWNER — the same two-tier flag the site
   * schema carries (`silicaui-html`'s `NodeBase.locked`, host-nodes spec §B),
   * reused here rather than reinvented, so a host that pins regions in both
   * builders reasons about one concept.
   *
   * A locked node cannot be removed or moved; its OWN fields stay editable
   * (a locked footer's copy is still typo-fixable) and so do its children.
   * Presence IS locked; the value encodes who owns the lock:
   *   - `"author"` — the author locked it from the Inspector; the same toggle
   *     unlocks it.
   *   - `"host"` — the host locked it (a compliance block it stamps into a
   *     seeded document, or a runtime `setLocked` call). The author UI shows it
   *     locked and offers NO unlock; only the host can clear it.
   *
   * Authoring metadata: `toEmailHtml` never reads it, so it cannot reach sent
   * markup.
   *
   * For chrome that must not live in the document at all — a brand bar or a
   * legal footer that has to reflect the CURRENT brand on every send, and that
   * an author must never even see as a deletable node — use `EmailFrame`
   * (`frame.ts`) instead. A lock protects a node that IS part of the saved
   * document; a frame is composed around it and never persisted.
   */
  locked?: "host" | "author";
}

export interface TextNode extends BaseNode {
  kind: "text";
  /** Minimal inline-safe HTML: `<b>`, `<i>`, `<a href>`, `<br>` — nothing block-level. */
  html: string;
  align: Align;
  color: string;
  /** When true, `color` tracks the brand theme's `baseContent` role live (see
   *  `EmailEditor.setColorDefaults`) instead of being a frozen manual pick. */
  colorAuto?: boolean;
  /** Which `EmailColorDefaults` role `color` tracks while `colorAuto` — see
   *  `AutoColorRule` in `engine.ts`. Omitted means the kind's default role
   *  (`baseContent`). */
  colorRole?: keyof EmailColorDefaults;
  /**
   * Color for `<a>` elements inside `html`. Unset (the default) leaves anchors
   * to the client's own hyperlink blue — the historical behavior, and the one
   * that keeps output byte-identical for documents that never set this.
   *
   * There is no LINK NODE and deliberately so: a link is inline INSIDE copy and
   * this schema has no inline level to hold one. So the projector applies this
   * by rewriting anchor tags in `html` — the one place it parses markup at all,
   * acceptable only because a `TextNode`'s `html` is the constrained inline-safe
   * subset documented above (arbitrary markup belongs in an `HtmlNode`, which
   * stays untouched). An anchor that already carries its own `color:` wins.
   */
  linkColor?: string;
  /** Tracks the theme's `primary` role live — see `colorAuto`. */
  linkColorAuto?: boolean;
  linkColorRole?: keyof EmailColorDefaults;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
}

export interface ImageNode extends BaseNode {
  kind: "image";
  src: string;
  alt: string;
  href?: string;
  /** Pixels; the projector clamps it to the body width. */
  width: number;
  align: Align;
}

/**
 * `filled` (the default) paints `bg` behind the label. `outline` draws only the
 * border and lets whatever is behind the button show through — the projector
 * emits `background:transparent` and, critically, NO `bgcolor` attribute, since
 * `bgcolor` has no valid transparent value. A border on a `<td>` is well
 * supported everywhere including Outlook's Word engine, so an outline button is
 * as "bulletproof" as a filled one.
 */
export type ButtonVariant = "filled" | "outline";

export interface ButtonNode extends BaseNode {
  kind: "button";
  label: string;
  href: string;
  /** Omitted means `filled` — so a document authored before variants existed
   *  projects byte-identically. */
  variant?: ButtonVariant;
  bg: string;
  /** See `TextNode.colorAuto` — tracks the theme's `primary` role live. */
  bgAuto?: boolean;
  bgRole?: keyof EmailColorDefaults;
  color: string;
  /** Tracks the theme's `primaryContent` role live. */
  colorAuto?: boolean;
  colorRole?: keyof EmailColorDefaults;
  /** Border color; defaults to `bg` when a width is set but no color is. */
  borderColor?: string;
  /** Tracks the theme's `primary` role live. */
  borderColorAuto?: boolean;
  borderColorRole?: keyof EmailColorDefaults;
  /** Border thickness in px. A `filled` button renders a border only when this
   *  is set; an `outline` button falls back to 1px when it isn't. */
  borderWidth?: number;
  radius: number;
  align: Align;
  paddingX: number;
  paddingY: number;
}

export interface DividerNode extends BaseNode {
  kind: "divider";
  color: string;
  /** Tracks the theme's `base300` role live. */
  colorAuto?: boolean;
  colorRole?: keyof EmailColorDefaults;
  thickness: number;
}

export interface SpacerNode extends BaseNode {
  kind: "spacer";
  height: number;
}

/** The social platforms with a built-in badge color. Rendered as small
 *  self-contained text badges (a letter on the platform's brand color), not
 *  hotlinked icon images — no external asset dependency for the output HTML. */
export type SocialPlatform = "facebook" | "instagram" | "x" | "linkedin" | "youtube" | "tiktok" | "pinterest";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface SocialNode extends BaseNode {
  kind: "social";
  links: SocialLink[];
  align: Align;
  iconSize: number;
  gap: number;
}

/** Raw HTML passthrough for power users — merge tags (`{{first_name}}`, an
 *  ESP's own syntax) pass through untouched since the projector never parses
 *  this string, just emits it verbatim. */
export interface HtmlNode extends BaseNode {
  kind: "html";
  html: string;
}

/**
 * A video: email clients can't embed/autoplay `<video>` reliably (most strip
 * it), so the universal technique is a linked thumbnail image that opens the
 * video's real URL — this node IS that, not a video embed.
 */
export interface VideoNode extends BaseNode {
  kind: "video";
  href: string;
  thumbnail: string;
  width: number;
  align: Align;
  /** A centered play-glyph overlay drawn over the thumbnail. */
  showPlayButton: boolean;
}

export type ContentNode = TextNode | ImageNode | ButtonNode | DividerNode | SpacerNode | SocialNode | HtmlNode | VideoNode;
export type ContentKind = ContentNode["kind"];

const CONTENT_KINDS = new Set<ContentKind>(["text", "image", "button", "divider", "spacer", "social", "html", "video"]);
export function isContentKind(kind: EmailNode["kind"]): kind is ContentKind {
  return CONTENT_KINDS.has(kind as ContentKind);
}

/**
 * A CLICKABLE GROUP of content — one destination shared by an image, a title,
 * and a price, so a repeated card can deep-link to its own record.
 *
 * ── Why this node exists ──────────────────────────────────────────────────────
 * Every node carries at most ONE `data` marker, so an `ImageNode` inside a
 * `collection` repeat can bind its `src` from `item.imageUrl` OR its `href`
 * from `item.url` — never both. And a `TextNode` has no `href` field at all: a
 * link inside copy is authored as inline `<a>` markup, which is a literal
 * string and therefore identical on every repeated item. That left a product
 * rail with no way to send each card to its own PDP. This node is the missing
 * composition step: it holds the `href`, so `data: { kind: 'value', ref: 'url',
 * attr: 'href' }` on it binds per item while each child keeps its own marker
 * for its own field.
 *
 * ── How it projects, and why NOT as one `<a>` ─────────────────────────────────
 * The obvious lowering — wrap the card's markup in a single anchor — is exactly
 * what does NOT work in email. An `<a>` around block-level content (a table, a
 * `<div>`) is invalid in the HTML dialect Outlook's Word engine parses, and it
 * drops the link there: the card renders, looks clickable, and silently isn't,
 * for the one audience most likely to be reading a transactional email on a
 * desktop client. So the projector DISTRIBUTES the link down onto each child
 * that can carry one instead (see `renderLink`): an image becomes
 * `<a><img></a>`, a text block's copy is wrapped in an anchor. Both are plain
 * inline anchors — bulletproof in every client, Outlook included.
 *
 * The consequence, stated plainly because it is a real difference from the
 * site engine's link box: the CONTENT of the card is clickable, the padding
 * and gaps around it are not. That is the honest ceiling of email link
 * support, and it beats a whole-card hit area that evaporates in Outlook.
 *
 * A child that carries its OWN destination keeps it — an explicit link beats
 * an inherited one, so a "Buy now" button inside a card still goes wherever
 * its own `href` says. Same for `video`/`social`, which are links already.
 */
export interface LinkNode extends BaseNode {
  kind: "link";
  /** Where the group points. Bindable per item inside a `collection` repeat via
   *  `data: { kind: 'value', ref: '<field>', attr: 'href' }` (it is also the
   *  default target, so a bare `value` bind with no `attr` fills it). Empty
   *  means "no link yet" — children render exactly as if they weren't grouped. */
  href: string;
  /**
   * Content only — no nested `columns`, and no nested `link`. Both are type
   * errors rather than runtime guards, and the second is load-bearing: nested
   * anchors are invalid HTML, and "which of the two destinations wins" has no
   * answer an author would predict.
   */
  children: ContentNode[];
}

/** What a section OR a column can hold directly — a nested multi-column row
 *  (one level of column-in-column nesting, the common "2x2 grid" pattern most
 *  email builders support), a clickable group, or bare content. */
export type LayoutChild = ColumnsNode | LinkNode | ContentNode;

export interface ColumnNode extends BaseNode {
  kind: "column";
  /** This column's share of the row; a row's columns should sum to 100. */
  widthPct: number;
  children: LayoutChild[];
}

export interface ColumnsNode extends BaseNode {
  kind: "columns";
  children: ColumnNode[];
  stackOnMobile: boolean;
}

export interface SectionNode extends BaseNode {
  kind: "section";
  bg: string;
  /** Tracks the theme's `base100` role live. */
  bgAuto?: boolean;
  /**
   * Which `EmailColorDefaults` role `bg` tracks while `bgAuto` is on. Omitted
   * means `base100` (the historical, hardcoded behavior). This is what makes a
   * TINTED surface — a card or footer on `base200`/`base300`, or a brand-colored
   * hero band on `primary` — follow each tenant's palette instead of freezing a
   * literal neutral hex the moment you want anything but white.
   */
  bgRole?: keyof EmailColorDefaults;
  /** An optional background image URL. Email clients vary wildly on support
   *  (Outlook desktop needs a VML fallback, which the projector emits); `bg`
   *  always renders too, underneath, as the graceful-degradation fallback. */
  bgImage?: string;
  paddingX: number;
  paddingY: number;
  /**
   * Horizontal alignment of the section's `<td>` — what inline-block `columns`
   * rows and inline content align against. Omitted means `center`, which is what
   * the projector used to hardcode, so existing documents are unaffected.
   */
  align?: Align;
  /**
   * ── Box decoration ──────────────────────────────────────────────────────────
   * Any of `radius`/`borderWidth`/`marginX`/`marginY` promotes the section from
   * a bare `<tr><td>` to a nested-table "card": an outer cell carrying the
   * margin as padding (a `<td>` can't take real margin in Outlook's Word engine)
   * wrapping an inner table that carries the fill, border, and radius.
   *
   * `radius` is IGNORED by Outlook desktop — corners go square there. That's the
   * normal, accepted degradation for rounded email cards, not a bug to work
   * around.
   */
  radius?: number;
  borderColor?: string;
  /** Tracks the theme's `base300` role live. */
  borderColorAuto?: boolean;
  borderColorRole?: keyof EmailColorDefaults;
  /** Border thickness in px; a border renders only when this is > 0. */
  borderWidth?: number;
  /** Outer inset, px — space OUTSIDE the section's own fill. */
  marginX?: number;
  marginY?: number;
  children: LayoutChild[];
}

/**
 * One `@font-face` the projector emits into the document `<head>`.
 *
 * A webfont is a DOCUMENT-LEVEL DESIGN DECISION, so it lives in the schema —
 * not in a caller-supplied CSS string. That way it travels with the document,
 * round-trips through save/load, and is editable in the Inspector instead of
 * being invisible code at the render call site.
 *
 * Two things every consumer needs to know, because neither is obvious and both
 * bite in production:
 *
 * 1. **Reach is limited and that's fine.** Apple Mail, iOS Mail, Outlook for
 *    Mac, and Samsung Mail render webfonts. Gmail (every surface), Outlook on
 *    Windows, and Yahoo do NOT — they fall back to `EmailBody.fontFamily`.
 *    Always keep that stack a real, self-sufficient system stack.
 * 2. **Use a hosted URL, not a `data:` URI.** Gmail CLIPS a message past
 *    roughly 102KB, hiding everything after the cut behind a "View entire
 *    message" link. An embedded font blows through that on its own and will
 *    silently truncate the email.
 *
 * The projector wraps the emitted `@font-face` in `@media screen` — Outlook's
 * Word engine ignores that at-rule entirely, which stops it seeing a webfont it
 * can't load and falling back to Times New Roman.
 */
export interface EmailWebFont {
  /** The `font-family` name, e.g. `"Sohne"`. Quoted automatically when emitted. */
  family: string;
  /** A `url(...)`-able source. Hosted HTTPS strongly preferred — see above. */
  src: string;
  /** Defaults to `400`. */
  weight?: number | string;
  /** Defaults to `normal`. */
  style?: "normal" | "italic";
}

export interface EmailBody extends BaseNode {
  kind: "body";
  /** The email's canvas width in px (classic email default: 600). */
  width: number;
  /** Background behind the body (visible as side "wallpaper" in wide clients). */
  bg: string;
  /** Tracks the theme's `base200` role live. */
  bgAuto?: boolean;
  bgRole?: keyof EmailColorDefaults;
  /** The body's own background. */
  contentBg: string;
  /** Tracks the theme's `base100` role live. */
  contentBgAuto?: boolean;
  contentBgRole?: keyof EmailColorDefaults;
  fontFamily: string;
  /** `@font-face` declarations; the families are prepended to `fontFamily` in
   *  the emitted body font stack, so `fontFamily` stays the fallback. */
  webFonts?: EmailWebFont[];
  /**
   * Declares which color schemes this email is designed for — emitted as the
   * `color-scheme`/`supported-color-schemes` `<meta>` pair plus the matching
   * `:root` rule.
   *
   * Set this and Apple Mail / Outlook for Mac will honor your own
   * `@media (prefers-color-scheme: dark)` rules (supplied via the projector's
   * `head.css` hook). Gmail and Outlook.com IGNORE it and forcibly invert
   * colors on their own terms regardless — so treat dark mode as progressive
   * enhancement for a minority of clients, never as a design you can rely on.
   */
  colorScheme?: "light" | "dark" | "light dark";
  children: SectionNode[];
}

export type EmailNode = EmailBody | SectionNode | ColumnsNode | ColumnNode | LinkNode | ContentNode;

export interface EmailDocument {
  version: "1";
  subject: string;
  /** Preview text shown next to the subject in an inbox list. */
  preheader: string;
  root: EmailBody;
}

/** One named email in a project — the unit the template switcher lists, adds,
 *  renames, and deletes. Mirrors the site engine's `Page` (name + its own tree),
 *  minus a route `slug` — a template has no URL to route. */
export interface EmailTemplate {
  id: string;
  name: string;
  document: EmailDocument;
}

/**
 * A project is one or more independent templates sharing nothing but the brand
 * color defaults they were seeded with — mirrors the site engine's `Site`
 * (pages sharing one theme + frame), scaled down: an email has no shared frame
 * or theme tokens to hold at the project level, so a project is JUST the
 * roster. `EmailEditor` edits one template at a time (its `activeTemplateId`).
 */
export interface EmailProject {
  version: "1";
  templates: EmailTemplate[];
}

/**
 * Hex color defaults new blocks / a fresh document seed with. Plain hex — no
 * `Theme`/OKLCH knowledge here, so the engine stays framework-neutral; the
 * React layer (`email/react/theme-defaults.ts`) resolves an actual brand
 * `Theme` down to this shape before constructing an `EmailEditor`, since email
 * HTML can't ship OKLCH (Outlook and most clients don't support CSS color
 * functions) — every stored color must already be a literal hex string.
 */
export interface EmailColorDefaults {
  /** Button background / links / accents. */
  primary: string;
  /** Text color that reads on top of `primary`. */
  primaryContent: string;
  /** Body copy color. */
  baseContent: string;
  /** Section / content background. */
  base100: string;
  /** Outer canvas background. */
  base200: string;
  /** Divider color. */
  base300: string;
  /**
   * The rest of the theme's semantic roles (`rolesOf`'s `SEMANTIC_ROLES`,
   * minus `primary` above) — resolved purely so the Inspector's color
   * swatches offer the SAME palette breadth as the site builder's, not used
   * to seed any block default (only `primary`/`base*` are — see the block
   * `make()` functions in `../palette.ts`).
   */
  secondary: string;
  accent: string;
  neutral: string;
  info: string;
  success: string;
  warning: string;
  error: string;
}

export const DEFAULT_EMAIL_COLORS: EmailColorDefaults = {
  primary: "#111827",
  primaryContent: "#ffffff",
  baseContent: "#18181b",
  base100: "#ffffff",
  base200: "#f4f4f5",
  base300: "#e4e4e7",
  secondary: "#6366f1",
  accent: "#ec4899",
  neutral: "#3f3f46",
  info: "#0ea5e9",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

/** A fresh, empty document — one section with an intro text block. */
export function emptyEmailDocument(makeId: () => string, colors: EmailColorDefaults = DEFAULT_EMAIL_COLORS): EmailDocument {
  return {
    version: "1",
    subject: "New email",
    preheader: "",
    root: {
      id: makeId(),
      kind: "body",
      width: 600,
      bg: colors.base200,
      bgAuto: true,
      contentBg: colors.base100,
      contentBgAuto: true,
      fontFamily: "Arial, Helvetica, sans-serif",
      children: [
        {
          id: makeId(),
          kind: "section",
          bg: colors.base100,
          bgAuto: true,
          paddingX: 24,
          paddingY: 24,
          children: [
            {
              id: makeId(),
              kind: "text",
              html: "Start writing your email…",
              align: "left",
              color: colors.baseContent,
              colorAuto: true,
              fontSize: 16,
              fontWeight: "normal",
              lineHeight: 24,
            },
          ],
        },
      ],
    },
  };
}
