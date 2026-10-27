import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Conversation, Message } from "../types/chat";
import { Avatar, ChatBubbleIcon, UserPlusIcon } from "./ui";
import { FaPaperPlane, FaUsers } from "react-icons/fa";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSend: (text: string) => void;
  onBack: () => void;
  onInvite?: () => void;
  onCreateGroup?: () => void;
  className?: string;
  onSendMessage: ({
    type,
    message,
    groupId,
    sentBy,
  }: {
    type: string;
    message: string;
    groupId: string;
    sentBy: string;
  }) => void;
}

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatWindow = ({
  conversation,
  messages,
  currentUserId,
  onSend,
  onBack,
  onInvite,
  onCreateGroup,
  onSendMessage,
  className = "",
}: ChatWindowProps) => {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, conversation?.id]);

  // Empty state matching the user's screenshot
  if (!conversation) {
    return (
      <section
        className={`flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#090d16] ${className}`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 border border-white/5 text-primary text-2xl mb-4 shadow-[0_0_35px_rgba(124,58,237,0.25)]">
          <ChatBubbleIcon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">
          No chat selected
        </h3>
        <p className="mt-2 text-xs text-slate-400 max-w-sm text-center leading-relaxed">
          Choose a conversation from the sidebar or create a new group to start chatting.
        </p>

        <div className="mt-6 flex items-center gap-3">
          {onCreateGroup && (
            <button
              type="button"
              onClick={onCreateGroup}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-primary/25 hover:brightness-110 transition-all cursor-pointer"
            >
              <span>+</span>
              <span>Create New Group</span>
            </button>
          )}

          {onInvite && (
            <button
              type="button"
              onClick={onInvite}
              className="flex items-center gap-2 rounded-xl border border-dark-input-border bg-dark-input px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-dark-input-hover transition-all cursor-pointer"
            >
              <FaUsers className="text-slate-400" />
              <span>Invite Friends</span>
            </button>
          )}
        </div>

        <p className="mt-10 flex items-center gap-1.5 text-xs text-slate-500">
          <span>Pro-tip: Press</span>
          <kbd className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            ⌘K
          </kbd>
          <span>to jump to any chat quickly</span>
        </p>
      </section>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (onSendMessage && conversation) {
      onSendMessage({
        type: "broadcast",
        message: trimmed,
        groupId: conversation.id,
        sentBy: currentUserId,
      });
    } else {
      onSend(trimmed);
    }
    setText("");
  };

  return (
    <section className={`min-w-0 flex-1 flex flex-col bg-[#090d16] ${className}`}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800/80 bg-[#0d121f] px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/5 hover:text-white md:hidden cursor-pointer"
            aria-label="Back to chats"
          >
            ←
          </button>

          {conversation.isGroup ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary font-bold text-white shadow-md shadow-primary/20 text-xs">
              {conversation.name.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <Avatar name={conversation.name} />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-semibold text-white text-sm md:text-base">
                {conversation.name}
              </h2>
              {conversation.isGroup && (
                <span className="shrink-0 rounded bg-primary/20 px-1.5 py-0.2 text-[10px] font-medium text-primary-300">
                  Group
                </span>
              )}
            </div>
            <p className="truncate text-xs text-slate-400 mt-0.5">
              {conversation.isGroup
                ? `${conversation.memberCount || 1} members ${conversation.maxMembers ? `• Limit ${conversation.maxMembers}` : ""
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-300 transition-all hover:bg-primary/20 cursor-pointer"
            >
              <UserPlusIcon className="h-3.5 w-3.5" />
              <span>+ Invite</span>
            </button>
          )}
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-dark-input text-slate-500 mb-3 border border-dark-input-border text-2xl">
              💬
            </div>
            <p className="text-sm font-semibold text-slate-300">No messages yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {conversation.isGroup
                ? "Start the discussion or invite your friends to join!"
                : "Say hello to get the conversation started!"}
            </p>
          </div>
        )}

        {messages.filter(Boolean).map((m) => {
          const mine = m?.sentBy === currentUserId;
          return (
            <div
              key={m?.id || `${m?.sentBy}-${m?.createdAt}-${Math.random()}`}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all ${mine
                    ? "rounded-br-sm bg-primary text-white shadow-primary/20"
                    : "rounded-bl-sm bg-dark-card border border-dark-card-border text-slate-100"
                  }`}
              >
                <p className="whitespace-pre-wrap break-words">{m?.content}</p>
                <span
                  className={`mt-1 block text-right text-[10px] font-medium ${mine ? "text-primary-200" : "text-slate-500"
                    }`}
                >
                  {formatTime(m?.createdAt)}
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
        className="flex items-center gap-3 border-t border-slate-800/80 bg-[#0d121f] p-3 sm:p-4"
      >
        <div className="flex-1 min-w-0">
          <input
            id="message"
            type="text"
            placeholder={
              conversation.isGroup
                ? `Message in ${conversation.name}...`
                : "Type a message..."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
            className="w-full rounded-xl border border-dark-input-border bg-dark-input px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim()}
          title="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary text-white shadow-md shadow-primary/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <FaPaperPlane className="h-3.5 w-3.5" />
        </button>
      </form>
    </section>
  );
};

export default ChatWindow;