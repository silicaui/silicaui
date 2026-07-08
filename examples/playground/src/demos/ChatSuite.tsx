import { useState } from "react";
import {
    ChatLayout,
    ChatLayoutMessages,
    ChatMessage,
    ChatMessageMetadata,
    ChatSystemMessage,
    ChatToolCalls,
    ChatComposer,
    Avatar,
} from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

interface Msg {
    id: number;
    side: "start" | "end";
    text: string;
    name?: string;
    time?: string;
    compact?: boolean;
}

const INITIAL: Msg[] = [
    { id: 1, side: "start", name: "Silica Assistant", time: "9:41", text: "Hi! Ask me anything about the design system." },
    { id: 2, side: "end", name: "You", time: "9:42", text: "What's the token for the primary color?" },
];

export function ChatSuiteDemo() {
    const [messages, setMessages] = useState<Msg[]>(INITIAL);
    const [showTool, setShowTool] = useState(false);

    function handleSend(text: string) {
        const userMsg: Msg = { id: Date.now(), side: "end", name: "You", time: "9:43", text };
        setMessages((prev) => [...prev, userMsg]);
        setShowTool(true);
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    side: "start",
                    name: "Silica Assistant",
                    time: "9:43",
                    text: "It's --color-primary — every component reads it through an orthogonal color class.",
                },
            ]);
        }, 300);
    }

    return (
        <Section title="Real use · full conversation screen (layout + composer + system/tool messages)">
            <div className="max-w-lg overflow-hidden rounded-box border border-base-300">
                <ChatLayout className="h-[28rem]">
                    <ChatLayoutMessages>
                        <ChatSystemMessage>Today</ChatSystemMessage>

                        {messages.map((m) => (
                            <ChatMessage
                                key={m.id}
                                side={m.side}
                                name={m.name}
                                time={m.time}
                                color={m.side === "end" ? "primary" : undefined}
                                avatar={
                                    !m.compact ? (
                                        <Avatar
                                            size="sm"
                                            color={m.side === "end" ? "secondary" : "neutral"}
                                            alt={m.name ?? ""}
                                        >
                                            {(m.name ?? "?").slice(0, 1)}
                                        </Avatar>
                                    ) : undefined
                                }
                            >
                                {m.text}
                            </ChatMessage>
                        ))}

                        {showTool && (
                            <ChatToolCalls label='Called search_docs("primary color token")' defaultOpen={false}>
                                {JSON.stringify({ query: "primary color token", results: 3 }, null, 2)}
                            </ChatToolCalls>
                        )}

                        <ChatMessageMetadata>Assistant is typing…</ChatMessageMetadata>
                    </ChatLayoutMessages>

                    <ChatComposer onSend={handleSend} placeholder="Ask about Silica…" />
                </ChatLayout>
            </div>
        </Section>
    );
}
