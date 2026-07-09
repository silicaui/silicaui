/**
 * @wizeworks/silicaui-builder (Email) — the framework-neutral email document engine +
 * projector. The React chrome lives at `@wizeworks/silicaui-builder/email/react`.
 */
export { EmailEditor } from "./engine";
export type { ChangeEvent, ChangeKind } from "./engine";
export { toEmailHtml } from "./projector";
export { emptyEmailDocument, isContentKind } from "./schema";
export type {
  Align,
  ButtonNode,
  ColumnNode,
  ColumnsNode,
  ContentKind,
  ContentNode,
  DividerNode,
  EmailBody,
  EmailDocument,
  EmailNode,
  ImageNode,
  SectionChild,
  SectionNode,
  SpacerNode,
  TextNode,
} from "./schema";
export { EMAIL_PALETTE, emailPaletteItemByKey } from "./palette";
export type { EmailPaletteItem } from "./palette";
