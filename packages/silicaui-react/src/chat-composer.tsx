import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { Button } from "./button";

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m22 2-7 20-4-9-9-4Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export interface ChatComposerProps {
  /** Controlled draft text. */
  value?: string;
  /** Uncontrolled initial draft text. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fires with the trimmed text on submit (Enter, or the send button); the field then clears. */
  onSend?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Extra leading controls (e.g. an attach button), placed before the field. */
  actions?: React.ReactNode;
  /** Override the send button's content. Default a paper-plane icon. */
  sendLabel?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * Silica ChatComposer — an auto-growing message input + send button. Enter
 * submits; Shift+Enter inserts a newline. Uncontrolled by default (manages
 * its own draft text and clears on send); pass `value`/`onValueChange` to
 * control it (e.g. to persist an in-progress draft).
 *
 *   <ChatComposer onSend={(text) => sendMessage(text)} placeholder="Message…" />
 */
export function ChatComposer({
  value,
  defaultValue = "",
  onValueChange,
  onSend,
  placeholder = "Message…",
  disabled,
  actions,
  sendLabel,
  className,
  "aria-label": ariaLabel,
}: ChatComposerProps) {
  const sc = useSilicaClass();
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const draft = isControlled ? value : internal;
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const resize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useEffect(resize, [draft, resize]);

  function setDraft(next: string) {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  }

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;
    onSend?.(trimmed);
    setDraft("");
  }

  return (
    <div className={cx(sc("chat-composer"), className)}>
      {actions && <div className={cx(sc("chat-composer-actions"))}>{actions}</div>}
      <textarea
        ref={textareaRef}
        rows={1}
        value={draft}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel ?? "Message"}
        className={cx(sc("textarea"), sc("chat-composer-field"))}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button
        type="button"
        size="sm"
        shape="circle"
        color="primary"
        disabled={disabled || !draft.trim()}
        aria-label="Send message"
        onClick={submit}
      >
        {sendLabel ?? <SendIcon />}
      </Button>
    </div>
  );
}
