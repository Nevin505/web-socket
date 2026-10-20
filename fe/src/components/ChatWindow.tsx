import { useEffect, useRef, useState, type FormEvent } from "react";

import type { Conversation, Message } from "../types/chat";
import { Avatar, Button, Input, ChatBubbleIcon, UserPlusIcon } from "./ui";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSend: (text: string) => void;
  onBack: () => void;
  onInvite?: () => void;
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
  onInvite,
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
      <section
        className={`flex-1 flex flex-col items-center justify-center bg-gray-50/50 p-6 text-center text-gray-400 ${className}`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-500 mb-3 shadow-inner">
          <ChatBubbleIcon className="h-8 w-8" />
        </div>
        <h3 className="text-base font-semibold text-gray-700">No chat selected</h3>
        <p className="mt-1 text-xs text-gray-400 max-w-xs">
          Choose a conversation from the sidebar or create a new group to start chatting.
        </p>
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
    <section className={`min-w-0 flex-1 flex flex-col bg-gray-50/60 ${className}`}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl p-1.5 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Back to chats"
          >
            ←
          </button>

          {conversation.isGroup ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-sm text-sm">
              {conversation.name.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <Avatar name={conversation.name} />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-semibold text-gray-900 text-sm md:text-base">
                {conversation.name}
              </h2>
              {conversation.isGroup && (
                <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                  Group
                </span>
              )}
            </div>
            <p className="truncate text-xs text-gray-500">
              {conversation.isGroup
                ? `${conversation.memberCount || 1} members ${
                    conversation.maxMembers ? `• Limit ${conversation.maxMembers}` : ""
                  }`
                : "Active now"}
            </p>
          </div>
        </div>

        {/* Action button in header */}
        <div className="flex items-center gap-2">
          {conversation.isGroup && onInvite && (
            <button
              type="button"
              onClick={onInvite}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all hover:bg-blue-100 hover:text-blue-800"
            >
              <UserPlusIcon className="h-3.5 w-3.5" />
              <span>+ Invite</span>
            </button>
          )}
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mt-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-2">
              💬
            </div>
            <p className="text-sm font-semibold text-gray-600">No messages yet</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {conversation.isGroup
                ? "Start the discussion or invite your friends to join!"
                : "Say hello to get the conversation started!"}
            </p>
          </div>
        )}

        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${
                  mine
                    ? "rounded-br-sm bg-blue-600 text-white"
                    : "rounded-bl-sm bg-white text-gray-900 border border-gray-100"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <span
                  className={`mt-1 block text-right text-[10px] font-medium ${
                    mine ? "text-blue-100" : "text-gray-400"
                  }`}
                >
                  {formatTime(m.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Footer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-gray-200 bg-white p-3 shadow-inner"
      >
        <div className="flex-1">
          <Input
            id="message"
            placeholder={
              conversation.isGroup
                ? `Message in ${conversation.name}...`
                : "Type a message..."
            }
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