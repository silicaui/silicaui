import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { Chat, ChatImage, ChatBubble, ChatFooter } from "./chat";
import type { ChatSide, ChatBubbleColor } from "./chat";
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "./collapsible";

export interface ChatMessageProps {
  /** `"start"` (incoming, avatar left, default) or `"end"` (outgoing, avatar right). */
  side?: ChatSide;
  avatar?: React.ReactNode;
  name?: React.ReactNode;
  time?: React.ReactNode;
  /** Bubble color; maps to `chat-bubble-<color>`. */
  color?: ChatBubbleColor;
  /** An extra trailing line after the name/time row, e.g. "Delivered". */
  metadata?: React.ReactNode;
  /**
   * Suppress the avatar + name/time row — for a consecutive message from the
   * same sender, grouped right under the previous one.
   */
  compact?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Silica ChatMessage — a friendlier entry point over the `Chat`/`ChatImage`/
 * `ChatBubble`/`ChatFooter` primitives, for the common case of "one message,
 * maybe with an avatar and metadata" without composing four parts by hand
 * each time. Reach for the primitives directly when you need more control
 * (e.g. a Slack-style name/time row ABOVE the bubble via `ChatHeader` —
 * `ChatMessage` itself puts name/time in the footer, after the bubble, to
 * match a modern messaging-app read: the message is the point, the
 * timestamp is a quiet trailing detail).
 *
 *   <ChatMessage side="start" avatar={<Avatar>OW</Avatar>} name="Obi-Wan" time="12:45">
 *     You were the chosen one!
 *   </ChatMessage>
 *   <ChatMessage side="end" color="primary" metadata="Delivered">
 *     I hate you!
 *   </ChatMessage>
 */
export function ChatMessage({
  side = "start",
  avatar,
  name,
  time,
  color,
  metadata,
  compact,
  children,
  className,
}: ChatMessageProps) {
  return (
    <Chat side={side} className={className}>
      {avatar && !compact && <ChatImage>{avatar}</ChatImage>}
      <ChatBubble color={color}>{children}</ChatBubble>
      {!compact && (name != null || time != null) && (
        <ChatFooter>
          {name}
          {time != null && <time className="opacity-60"> {time}</time>}
        </ChatFooter>
      )}
      {metadata != null && <ChatFooter>{metadata}</ChatFooter>}
    </Chat>
  );
}

export type ChatMessageMetadataProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * A small metadata line — usable inside a `ChatMessage` (same look as
 * `ChatFooter`) or standalone, e.g. under a `compact` group of consecutive
 * messages that skip their own per-message metadata.
 */
export const ChatMessageMetadata = React.forwardRef<HTMLDivElement, ChatMessageMetadataProps>(
  function ChatMessageMetadata({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("chat-message-metadata"), className)} {...rest} />;
  },
);

export interface ChatTypingIndicatorProps {
  side?: ChatSide;
  avatar?: React.ReactNode;
  /** Announced to screen readers, e.g. `"Silica Assistant is typing"`. */
  name?: React.ReactNode;
  className?: string;
}

/**
 * Silica ChatTypingIndicator — three animated dots inside a real
 * `.chat-bubble`, so it sits exactly where the next message will land
 * instead of reading as a stray line of muted text.
 *
 *   <ChatTypingIndicator avatar={<Avatar size="sm">S</Avatar>} name="Silica Assistant" />
 */
export function ChatTypingIndicator({
  side = "start",
  avatar,
  name,
  className,
}: ChatTypingIndicatorProps) {
  const sc = useSilicaClass();
  return (
    <Chat side={side} className={className}>
      {avatar && <ChatImage>{avatar}</ChatImage>}
      <ChatBubble>
        <span
          className={cx(sc("chat-typing"))}
          role="status"
          aria-label={name ? `${name} is typing` : "Typing"}
        >
          <span className={cx(sc("chat-typing-dot"))} />
          <span className={cx(sc("chat-typing-dot"))} />
          <span className={cx(sc("chat-typing-dot"))} />
        </span>
      </ChatBubble>
    </Chat>
  );
}

export type ChatSystemMessageProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * A centered system notice / divider within the conversation — "Today",
 * "Ada joined the conversation", etc. Not attributed to either side.
 */
export const ChatSystemMessage = React.forwardRef<HTMLDivElement, ChatSystemMessageProps>(
  function ChatSystemMessage({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div ref={ref} role="status" className={cx(sc("chat-system-message"), className)} {...rest} />
    );
  },
);

export interface ChatToolCallsProps {
  /** The always-visible summary, e.g. "Called search_web(query)". */
  label: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The detail — arguments, results, etc. Rendered in a monospace block. */
  children: React.ReactNode;
  className?: string;
}

/**
 * Silica ChatToolCalls — a collapsible detail for an assistant's tool/function
 * call (wraps the existing `Collapsible`, not a bespoke disclosure), so a
 * long tool-call trace doesn't dominate the conversation by default.
 *
 *   <ChatToolCalls label="Called search_web(&quot;silica ui&quot;)">
 *     {JSON.stringify(result, null, 2)}
 *   </ChatToolCalls>
 */
export function ChatToolCalls({
  label,
  defaultOpen,
  open,
  onOpenChange,
  children,
  className,
}: ChatToolCallsProps) {
  const sc = useSilicaClass();
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      className={cx(sc("chat-tool-calls"), className)}
    >
      <CollapsibleTrigger>{label}</CollapsibleTrigger>
      <CollapsiblePanel>{children}</CollapsiblePanel>
    </Collapsible>
  );
}
