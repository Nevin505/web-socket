import { useEffect, useRef, useState, type FormEvent } from "react";
import Input from "./input";
import Button from "./Button";
import Avatar from "./Avatar";
import type { Conversation, Message } from "../types/chat";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSend: (text: string) => void;
  onBack: () => void;
  className?: string;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ChatWindow = ({
  conversation,
  messages,
  currentUserId,
  onSend,
  onBack,
  className = "",
}: ChatWindowProps) => {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, conversation?.id]);

  if (!conversation) {
    return (
      <section className={`flex-1 items-center justify-center bg-gray-50 text-gray-400 ${className}`}>
        Select a chat to start messaging
      </section>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <section className={`min-w-0 flex-1 flex-col bg-gray-50 ${className}`}>
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md p-1 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Back to chats"
        >
          ←
        </button>
        <Avatar name={conversation.name} />
        <h2 className="font-medium text-gray-900">{conversation.name}</h2>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-gray-400">No messages yet. Say hi!</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine
                    ? "rounded-br-sm bg-blue-600 text-white"
                    : "rounded-bl-sm bg-white text-gray-900"
                  }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <span className={`mt-1 block text-right text-[10px] ${mine ? "text-blue-100" : "text-gray-400"}`}>
                  {formatTime(m.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-200 bg-white p-3">
        <div className="flex-1">
          <Input
            id="message"
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={!text.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
};

export default ChatWindow;