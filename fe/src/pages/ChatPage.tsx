import { useState } from "react";
// import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/SideBar";
import ChatWindow from "../components/ChatWindow";
import type { Conversation, Message } from "../types/chat";

// Temporary mock data, replaced by API/socket data later
const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "1", name: "Aarav Sharma", lastMessage: "See you tomorrow!", time: "10:24", unread: 2 },
  { id: "2", name: "Priya Nair", lastMessage: "Sent the files", time: "Yesterday", unread: 0 },
  { id: "3", name: "Dev Team", lastMessage: "Deploy is done", time: "Mon", unread: 5 },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "m1", senderId: "other", text: "Hey! Are we still meeting?", createdAt: new Date().toISOString() },
    { id: "m2", senderId: "me", text: "Yes, 5 pm works for me.", createdAt: new Date().toISOString() },
    { id: "m3", senderId: "other", text: "See you tomorrow!", createdAt: new Date().toISOString() },
  ],
  "2": [],
  "3": [],
};

const ChatPage = () => {
  // const { user } = useAuth();
  const currentUserId =  "me";

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);

  const activeConversation = MOCK_CONVERSATIONS.find((c) => c.id === activeId) ?? null;

  const handleSend = (text: string) => {
    if (!activeId) return;
    const newMessage: Message = {
      id: crypto.randomUUID(),
      senderId: currentUserId,
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMessage] }));
  };

  return (
    // h-screen + overflow-hidden so only the message list scrolls
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        conversations={MOCK_CONVERSATIONS}
        activeId={activeId}
        onSelect={setActiveId}
        userName={ "Me"}
        className={activeId ? "hidden md:flex" : "flex"}
      />
      <ChatWindow
        conversation={activeConversation}
        messages={activeId ? messages[activeId] ?? [] : []}
        currentUserId={currentUserId}
        onSend={handleSend}
        onBack={() => setActiveId(null)}
        className={activeId ? "flex" : "hidden md:flex"}
      />
    </div>
  );
};

export default ChatPage;