import * as React from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { cx, useSilicaClass } from "@wizeworks/silicaui-react";

export interface RichTextEditorProps {
  /** Controlled HTML value. */
  value?: string;
  /** Uncontrolled initial HTML. */
  defaultValue?: string;
  /** Fires with the editor's HTML on every change. */
  onValueChange?: (html: string) => void;
  /** Empty-state placeholder text. */
  placeholder?: string;
  /** Allow editing. Default `true`. */
  editable?: boolean;
  /** Show the formatting toolbar. Default `true`. */
  toolbar?: boolean;
  className?: string;
  /** Class for the editable content surface. */
  contentClassName?: string;
}

const icons = {
  bulletList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  orderedList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6h11M10 12h11M10 18h11M4 4v4M3 8h2M3 16h2a1 1 0 0 1 0 2H3a1 1 0 0 0 0 2h2" />
    </svg>
  ),
  quote: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M7 7H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a2 2 0 0 1-2 2H3v2h1a4 4 0 0 0 4-4V9a2 2 0 0 0-1-2Zm11 0h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a2 2 0 0 1-2 2h-1v2h1a4 4 0 0 0 4-4V9a2 2 0 0 0-1-2Z" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
    </svg>
  ),
  redo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9a5 5 0 0 0 0 10h1" />
    </svg>
  ),
};

interface BtnProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function Toolbar({ editor }: { editor: Editor }) {
  const sc = useSilicaClass();

  const Btn = ({ onClick, active, disabled, title, children }: BtnProps) => (
    <button
      type="button"
      className={cx(sc("rich-text-editor-btn"))}
      data-active={active || undefined}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      // Keep the editor selection instead of blurring to the button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );

  const sep = <span className={cx(sc("rich-text-editor-sep"))} aria-hidden="true" />;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className={cx(sc("rich-text-editor-toolbar"))} role="toolbar" aria-label="Formatting">
      <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span style={{ fontWeight: 800 }}>B</span>
      </Btn>
      <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}>I</span>
      </Btn>
      <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span style={{ textDecoration: "line-through" }}>S</span>
      </Btn>
      {sep}
      <Btn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </Btn>
      <Btn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </Btn>
      {sep}
      <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        {icons.bulletList}
      </Btn>
      <Btn title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        {icons.orderedList}
      </Btn>
      {sep}
      <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        {icons.quote}
      </Btn>
      <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        {icons.code}
      </Btn>
      <Btn title="Link" active={editor.isActive("link")} onClick={setLink}>
        {icons.link}
      </Btn>
      {sep}
      <Btn title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        {icons.undo}
      </Btn>
      <Btn title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        {icons.redo}
      </Btn>
    </div>
  );
}

/**
 * RichTextEditor — a TipTap editor with a Silica-styled toolbar and content
 * surface. Emits HTML via `onValueChange`; control it with `value` or run
 * uncontrolled with `defaultValue`. StarterKit + Link + Placeholder are wired in;
 * drop `toolbar={false}` for a bare editable surface.
 */
export function RichTextEditor({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Write something…",
  editable = true,
  toolbar = true,
  className,
  contentClassName,
}: RichTextEditorProps) {
  const sc = useSilicaClass();

  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value ?? defaultValue ?? "",
    onUpdate: ({ editor }) => onValueChange?.(editor.getHTML()),
  });

  // Sync a controlled value in without firing onUpdate (avoids a loop) or
  // stomping the cursor when the change already came from the editor.
  React.useEffect(() => {
    if (!editor || value === undefined) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  React.useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  return (
    <div
      className={cx(sc("rich-text-editor"), className)}
      data-disabled={!editable || undefined}
    >
      {toolbar && editor && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className={cx(sc("rich-text-editor-content"), contentClassName)}
      />
    </div>
  );
}
