import {
    Chat,
    ChatImage,
    ChatHeader,
    ChatBubble,
    ChatFooter,
    Avatar,
} from "silicaui-react";
import { Section } from "../lib/Section";
import { COLORS } from "../lib/data";

export function ChatDemo() {
    return (
        <>
            <Section title="Bubble colors">
                <div className="flex flex-col gap-3">
                    {COLORS.slice(0, 6).map((color) => (
                        <Chat key={color} side="end">
                            <ChatBubble color={color}>{color} bubble</ChatBubble>
                        </Chat>
                    ))}
                </div>
            </Section>

            <Section title="Real use · a short conversation">
                <div className="flex max-w-md flex-col gap-1">
                    <Chat side="start">
                        <ChatImage>
                            <Avatar color="neutral" alt="Obi-Wan">
                                OW
                            </Avatar>
                        </ChatImage>
                        <ChatHeader>
                            Obi-Wan <time className="opacity-60">12:45</time>
                        </ChatHeader>
                        <ChatBubble>You were the chosen one!</ChatBubble>
                    </Chat>
                    <Chat side="start">
                        <ChatImage>
                            <Avatar color="neutral" alt="Obi-Wan">
                                OW
                            </Avatar>
                        </ChatImage>
                        <ChatBubble>
                            It was said that you would destroy the Sith, not join them.
                        </ChatBubble>
                    </Chat>
                    <Chat side="end">
                        <ChatBubble color="primary">I hate you!</ChatBubble>
                        <ChatFooter>Delivered</ChatFooter>
                    </Chat>
                </div>
            </Section>
        </>
    );
}
