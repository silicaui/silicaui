/**
 * The email FRAME — fixed chrome composed AROUND an authored email, and
 * deliberately not part of it.
 *
 * ── Why this isn't a schema field ───────────────────────────────────────────
 * The motivating case is a platform that wraps every tenant's email in a brand
 * bar and a tiered legal footer. Two things have to be true of that chrome:
 *
 *  1. An author cannot delete it (compliance).
 *  2. It reflects the tenant's CURRENT brand at send time — not the brand that
 *     happened to be current when the email was authored six months ago.
 *
 * Baking the chrome into the persisted `EmailDocument` breaks BOTH: a node in
 * the document is a node an author can select, and a color stored in the
 * document is a color frozen at authoring time. So the frame lives OUTSIDE the
 * document — supplied by the host on every mount and every send, never
 * persisted, never in `onChange`, never on the undo stack, never reachable by
 * the engine (`EmailEditor` is not even told it exists).
 *
 * This mirrors how the site builder handles the same problem: a `Frame` belongs
 * to the `Site`, not to any `Page`, and the page canvas renders it as inert
 * context around the editable body.
 *
 * ── Why composition is exported ─────────────────────────────────────────────
 * A host that composes the frame in its own send path AND wants the builder to
 * show it would otherwise have two implementations of "the framed email", free
 * to drift — the exact preview-vs-send split `toEmailHtml`'s resolver seam
 * exists to close. So the composition is one function, used by the builder's
 * canvas, its Preview/Export/Send-test projections, and the host's send path
 * alike. Pass the frame to `toEmailHtml` (via `EmailRenderOptions.frame`) and
 * the host doesn't need to call this at all.
 *
 * ── The one rule ────────────────────────────────────────────────────────────
 * Frame sections are ordinary `SectionNode`s, so they get the same projector,
 * the same mobile CSS, and — because composition happens BEFORE resolution —
 * the same data bindings and `{{merge}}` tokens the body gets. A brand bar can
 * bind its wordmark to `site.logo` exactly the way a body image would.
 */
import type { EmailDocument, SectionNode } from "./schema";

/**
 * Host-owned chrome wrapped around the authored body.
 *
 * Both regions are plain `SectionNode` arrays — the same kind the body holds,
 * so nothing new has to be rendered, projected, or resolved for them. Their
 * `id`s are never used for selection (the canvas gives frame nodes no
 * `data-sui-id`), so they only need to be unique enough for React keys; a
 * collision with a body node id is harmless.
 */
export interface EmailFrame {
  /** Sections rendered ABOVE the authored body, in order. */
  header?: readonly SectionNode[];
  /** Sections rendered BELOW the authored body, in order. */
  footer?: readonly SectionNode[];
  /**
   * What the canvas calls this chrome when it explains why the region can't be
   * edited — e.g. `"Brand frame"`, `"Managed by Acme"`. Defaults to
   * `"Managed by the host"`.
   */
  label?: string;
}

/** True when a frame would add nothing — no header and no footer sections.
 *  Lets every call site treat "no frame" and "an empty frame" identically. */
export function isEmptyFrame(frame: EmailFrame | undefined): boolean {
  return !frame || ((frame.header?.length ?? 0) === 0 && (frame.footer?.length ?? 0) === 0);
}

/**
 * Compose `frame` around `doc`, returning a NEW document whose body children
 * are `[...header, ...doc.root.children, ...footer]`.
 *
 * Pure and non-mutating: `doc` is untouched, and the result shares the original
 * child nodes by reference (nothing here mutates them either). An empty or
 * absent frame returns `doc` itself.
 *
 * The result is a projection artifact, NOT a document to persist — storing it
 * would bake the chrome into the author's email and defeat the entire point.
 */
export function composeEmailDocument(doc: EmailDocument, frame: EmailFrame | undefined): EmailDocument {
  if (isEmptyFrame(frame)) return doc;
  return {
    ...doc,
    root: {
      ...doc.root,
      children: [...(frame!.header ?? []), ...doc.root.children, ...(frame!.footer ?? [])],
    },
  };
}

/** The label the canvas shows on a frame region. */
export function frameLabel(frame: EmailFrame | undefined): string {
  return frame?.label?.trim() || "Managed by the host";
}
