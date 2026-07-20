import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

export type ChatSide = "start" | "end";
export type ChatBubbleColor = SilicaColor;

export interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `start` (incoming, avatar left) or `end` (outgoing, avatar right). */
  side?: ChatSide;
}

/**
 * Silica Chat — a message row: avatar, header, bubble, footer.
 *
 *   <Chat side="start">
 *     <ChatImage><Avatar>OW</Avatar></ChatImage>
 *     <ChatHeader>Obi-Wan <time>12:45</time></ChatHeader>
 *     <ChatBubble>You were the chosen one!</ChatBubble>
 *     <ChatFooter>Seen</ChatFooter>
 *   </Chat>
 *   <Chat side="end">
 *     <ChatBubble color="primary">I hate you!</ChatBubble>
 *   </Chat>
 */
export const Chat = React.forwardRef<HTMLDivElement, ChatProps>(
  function Chat({ side = "start", className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div ref={ref} className={cx(sc("chat"), sc(`chat-${side}`), className)} {...rest} />
    );
  },
);

export type ChatImageProps = React.HTMLAttributes<HTMLDivElement>;
export const ChatImage = React.forwardRef<HTMLDivElement, ChatImageProps>(
  function ChatImage({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("chat-image"), className)} {...rest} />;
  },
);

export type ChatHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export const ChatHeader = React.forwardRef<HTMLDivElement, ChatHeaderProps>(
  function ChatHeader({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("chat-header"), className)} {...rest} />;
  },
);

export type ChatFooterProps = React.HTMLAttributes<HTMLDivElement>;
export const ChatFooter = React.forwardRef<HTMLDivElement, ChatFooterProps>(
  function ChatFooter({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("chat-footer"), className)} {...rest} />;
  },
);

export interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Bubble color; maps to `chat-bubble-<color>`. Default neutral base-200. */
  color?: ChatBubbleColor;
}
export const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  function ChatBubble({ color, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div
        ref={ref}
        className={cx(sc("chat-bubble"), color && sc(`chat-bubble-${color}`), className)}
        {...rest}
      />
    );
  },
);
