/**
 * The email document schema — deliberately a CLOSED set of node kinds, unlike the
 * site engine's open element/component tree. Email HTML has no room for arbitrary
 * nesting (it has to survive Outlook's Word rendering engine and Gmail stripping
 * `<style>` blocks), so the vocabulary mirrors what every mainstream email
 * builder converges on: a body of sections, sections holding either columns or
 * content directly, columns holding content, content being the leaf kinds.
 *
 * Structural nesting is enforced by TYPES, not runtime validation: `SectionChild`
 * can't hold a `ColumnNode` directly (only via `ColumnsNode`), a `ColumnNode` can't
 * hold a `SectionNode`, etc. `engine.ts`'s `canHold` is the single runtime mirror
 * of these rules — keep the two in sync.
 */

export type Align = "left" | "center" | "right";

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

export type ContentNode = TextNode | ImageNode | ButtonNode | DividerNode | SpacerNode;
export type ContentKind = ContentNode["kind"];

const CONTENT_KINDS = new Set<ContentKind>(["text", "image", "button", "divider", "spacer"]);
export function isContentKind(kind: EmailNode["kind"]): kind is ContentKind {
  return CONTENT_KINDS.has(kind as ContentKind);
}

export interface ColumnNode extends BaseNode {
  kind: "column";
  /** This column's share of the row; a row's columns should sum to 100. */
  widthPct: number;
  children: ContentNode[];
}

export interface ColumnsNode extends BaseNode {
  kind: "columns";
  children: ColumnNode[];
  stackOnMobile: boolean;
}

/** What a section can hold directly — either a multi-column row, or bare content
 *  (treated as one implicit full-width column by the projector). */
export type SectionChild = ColumnsNode | ContentNode;

export interface SectionNode extends BaseNode {
  kind: "section";
  bg: string;
  paddingX: number;
  paddingY: number;
  children: SectionChild[];
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

/** A fresh, empty document — one section with an intro text block. */
export function emptyEmailDocument(makeId: () => string): EmailDocument {
  return {
    version: "1",
    subject: "New email",
    preheader: "",
    root: {
      id: makeId(),
      kind: "body",
      width: 600,
      bg: "#f4f4f5",
      contentBg: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
      children: [
        {
          id: makeId(),
          kind: "section",
          bg: "#ffffff",
          paddingX: 24,
          paddingY: 24,
          children: [
            {
              id: makeId(),
              kind: "text",
              html: "Start writing your email…",
              align: "left",
              color: "#18181b",
              fontSize: 16,
              lineHeight: 24,
            },
          ],
        },
      ],
    },
  };
}
