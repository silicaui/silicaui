/**
 * The email document schema — deliberately a CLOSED set of node kinds, unlike the
 * site engine's open element/component tree. Email HTML has no room for arbitrary
 * nesting (it has to survive Outlook's Word rendering engine and Gmail stripping
 * `<style>` blocks), so the vocabulary mirrors what every mainstream email
 * builder converges on: a body of sections, sections and columns both holding
 * `LayoutChild` (a nested columns row OR bare content — one level of
 * column-in-column nesting is allowed, the common "2x2 grid" pattern), content
 * being the leaf kinds.
 *
 * Structural nesting is enforced by TYPES, not runtime validation: a
 * `LayoutChild` can't hold a `ColumnNode` directly (only via `ColumnsNode`), a
 * `ColumnNode` can't hold a `SectionNode`, etc. `engine.ts`'s `canHold` is the
 * single runtime mirror of these rules — keep the two in sync.
 */

export type Align = "left" | "center" | "right";
export type FontWeight = "normal" | "medium" | "semibold" | "bold";

interface BaseNode {
  id: string;
}

export interface TextNode extends BaseNode {
  kind: "text";
  /** Minimal inline-safe HTML: `<b>`, `<i>`, `<a href>`, `<br>` — nothing block-level. */
  html: string;
  align: Align;
  color: string;
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

export interface ButtonNode extends BaseNode {
  kind: "button";
  label: string;
  href: string;
  bg: string;
  color: string;
  radius: number;
  align: Align;
  paddingX: number;
  paddingY: number;
}

export interface DividerNode extends BaseNode {
  kind: "divider";
  color: string;
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

/** What a section OR a column can hold directly — either a nested multi-column
 *  row (one level of column-in-column nesting, the common "2x2 grid" pattern
 *  most email builders support), or bare content. */
export type LayoutChild = ColumnsNode | ContentNode;

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
  /** An optional background image URL. Email clients vary wildly on support
   *  (Outlook desktop needs a VML fallback, which the projector emits); `bg`
   *  always renders too, underneath, as the graceful-degradation fallback. */
  bgImage?: string;
  paddingX: number;
  paddingY: number;
  children: LayoutChild[];
}

export interface EmailBody extends BaseNode {
  kind: "body";
  /** The email's canvas width in px (classic email default: 600). */
  width: number;
  /** Background behind the body (visible as side "wallpaper" in wide clients). */
  bg: string;
  /** The body's own background. */
  contentBg: string;
  fontFamily: string;
  children: SectionNode[];
}

export type EmailNode = EmailBody | SectionNode | ColumnsNode | ColumnNode | ContentNode;

export interface EmailDocument {
  version: "1";
  subject: string;
  /** Preview text shown next to the subject in an inbox list. */
  preheader: string;
  root: EmailBody;
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
      contentBg: colors.base100,
      fontFamily: "Arial, Helvetica, sans-serif",
      children: [
        {
          id: makeId(),
          kind: "section",
          bg: colors.base100,
          paddingX: 24,
          paddingY: 24,
          children: [
            {
              id: makeId(),
              kind: "text",
              html: "Start writing your email…",
              align: "left",
              color: colors.baseContent,
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
