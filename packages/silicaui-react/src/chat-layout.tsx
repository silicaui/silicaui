import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type ChatLayoutProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Silica ChatLayout — the outer flex column for a conversation screen: give
 * it a height (or let it fill a flex/grid parent), put `ChatLayoutMessages`
 * first and a `ChatComposer` (or anything) last.
 *
 *   <ChatLayout className="h-[32rem]">
 *     <ChatLayoutMessages>
 *       {messages.map((m) => <ChatMessage key={m.id} {...m} />)}
 *     </ChatLayoutMessages>
 *     <ChatComposer onSend={sendMessage} />
 *   </ChatLayout>
 */
export const ChatLayout = React.forwardRef<HTMLDivElement, ChatLayoutProps>(
  function ChatLayout({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("chat-layout"), className)} {...rest} />;
  },
);

export interface ChatLayoutMessagesProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Auto-scroll to the newest message on update — but only while the user is
   * already near the bottom, so scrolling up to read history isn't yanked
   * away by an incoming message. Default `true`.
   */
  stickToBottom?: boolean;
}

/** The scrollable message area within a `ChatLayout`. */
export const ChatLayoutMessages = React.forwardRef<HTMLDivElement, ChatLayoutMessagesProps>(
  function ChatLayoutMessages({ stickToBottom = true, className, onScroll, children, ...rest }, forwardedRef) {
    const sc = useSilicaClass();
    const innerRef = React.useRef<HTMLDivElement>(null);
    const stickRef = React.useRef(true);

    React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLDivElement);

    // Runs after every commit — in normal usage that means "the message list
    // changed" (new/removed messages), which is exactly when we want to
    // consider re-pinning the scroll position.
    React.useEffect(() => {
      const el = innerRef.current;
      if (el && stickToBottom && stickRef.current) el.scrollTop = el.scrollHeight;
    });

    return (
      <div
        ref={innerRef}
        className={cx(sc("chat-layout-messages"), className)}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          onScroll?.(e);
        }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
