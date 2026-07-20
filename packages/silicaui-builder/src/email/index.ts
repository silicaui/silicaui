/**
 * @wizeworks/silicaui-builder (Email) — the framework-neutral email document engine +
 * projector. The React chrome lives at `@wizeworks/silicaui-builder/email/react`.
 */
export { EmailEditor } from "./engine";
export type { ChangeEvent, ChangeKind, HistoryDelegate, TemplateMeta, TemplatesView } from "./engine";
// The semantic operation vocabulary — what `onChange` hands back alongside the
// state, and what `applyRemoteOps` accepts.
export type { Op, OpKind, OpTarget, OpMeta } from "./ops";
export { toEmailHtml } from "./projector";
export { resolveEmailTree, emailScopeAt } from "./resolve";
export type { EmailResolveHost } from "./resolve";
export { emptyEmailDocument, isContentKind } from "./schema";
export type {
  Align,
  ButtonNode,
  ColumnNode,
  ColumnsNode,
  ContentKind,
  ContentNode,
  DataBinding,
  DataScope,
  DataSource,
  DividerNode,
  EmailBody,
  EmailColorDefaults,
  EmailDocument,
  EmailNode,
  EmailProject,
  EmailTemplate,
  FontWeight,
  HtmlNode,
  ImageNode,
  LayoutChild,
  Resolved,
  SectionNode,
  SocialLink,
  SocialNode,
  SocialPlatform,
  SpacerNode,
  TextNode,
  VideoNode,
} from "./schema";
export { EMAIL_PALETTE, emailPaletteItemByKey } from "./palette";
export type { EmailPaletteItem } from "./palette";
